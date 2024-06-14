var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var gatherObject = null;
var mineObject = null;
var healObject = require('./../公共模块/治疗自己');
var healPetObject = require('./../公共模块/治疗宠物');
var supplyObject = require('./../公共模块/通用登出回补');
var trainMode = require('./../子插件/智能培养角色');

// 原料采集信息
const flower = require('./../公共模块/采花.js').mineArray;
const food = require('./../公共模块/狩猎.js').mineArray;
const wood = require('./../公共模块/伐木.js').mineArray;
const mine = require('./../公共模块/挖矿.js').mineArray;
const buy = require('./../公共模块/自定义购买.js').mineArray;

// 整合采集信息
const gatherDict = {
	'采花': flower,
	'狩猎': food,
	'伐木': wood,
	'挖掘': mine,
	'购买': buy,
}

// // 采集员自动适配制造者的坐标以及朝向
// var workerPos = cga.getStaticOrientationPosition(craftPlayerPos, craftPlayerTurnDir, 1)
// var workerTurnDir = cga.tradeDir(craftPlayerTurnDir)

var socket = null;

var isFabricName = (name) => {
	return ['麻布', '木棉布', '毛毡', '绵', '细线', '绢布', '莎莲娜线', '杰诺瓦线', '阿巴尼斯制的线', '阿巴尼斯制的布', '细麻布', '开米士毛线',].includes(name) ? true : false
}

var check_drop = () => {
	var dropItemPos = -1;
	var pattern = /(.+)的卡片/;
	cga.getInventoryItems().forEach((item) => {
		if (dropItemPos != -1)
			return;
		if (item.name == '魔石' || item.name == '卡片？' || pattern.exec(item.name)) {
			dropItemPos = item.pos;
			return;
		}
		// 如果是买布，那么不能丢弃布类物品。
		if (mineObject.object.name.indexOf('布') != -1 && isFabricName(item.name)) {
			return;
		}
		// 丢弃物品栏中不属于当前采集目标的物品。注意这里的type 31是布类物品，因为秘文之皮的type也是31，需要丢弃。
		if ([29, 30, 31, 32, 34, 35, 36, 40].includes(item.type) && item.name != mineObject.object.name && item.name != (mineObject.object.name + '条')) {
			dropItemPos = item.pos;
			console.log('丢弃物品栏中不属于当前采集目标的物品:' + item.name)
			return;
		}
		if (mineObject.object && mineObject.object.extra_dropping && mineObject.object.extra_dropping(item)) {
			dropItemPos = item.pos;
			return;
		}
	});

	if (dropItemPos != -1)
		cga.DropItem(dropItemPos);
}

var cleanOtherItems = (cb) => {
	var sell = cga.findItemArray((item) => {
		// 不卖采集目标物品
		if (item.name == mineObject.object.name || item.name == mineObject.object.name + '条') {
			return false
		}
		// 布类无法卖店
		if (isFabricName(item.name)) {
			return false
		}
		// 23料理、43血瓶
		if ([23, 43].indexOf(item.type) != -1 && item.count == 3) {
			item.count /= 3
			item.count = Math.floor(item.count)
			return true
		}// 29矿条、30木、31秘文之皮、32牛肉、34蕃茄、35其他食材、36花、40封印卡
		// id：18211是鹿皮，type也是26，特殊处理，因为很多其他物品type也是26
		else if (([29, 30, 31, 32, 34, 35, 36, 40].indexOf(item.type) != -1 || item.itemid == 18211) && item.count % 20 == 0 && item.name != '魔石' && item.name != '砂糖') {
			item.count /= 20
			item.count = Math.floor(item.count)
			return true
		} else if (item.name == '魔石') {
			item.count = 1
			return true
		}
		return false
	});
	if (sell && sell.length > 0) {
		cga.travel.falan.toStone('C', () => {
			cga.walkList([
				[30, 79],
			], () => {
				cga.TurnTo(30, 77);
				cga.sellArray(sell, cb);
			});
		});
		return
	} else {
		if (cb) cb()
		return
	}

}
/**
 * 获取自己能胜任的工作。基于采集技能等级、人物等级或其它条件判断。
 * @returns Array
 */
var getRefreshData = () => {
	let resultDict = {}

	let playerInfo = cga.GetPlayerInfo()
	// 自己的名字
	resultDict.player_name = thisobj.myname

	// 自己当前的等级
	resultDict.player_level = playerInfo.level

	/**
	 * 购买等级的粗略定义
	 * 以能去部分村镇购买物品为基准，这里使用购买布料的村镇为例
	 * 魔法大学能买到10级布，而去魔法大学至少要40级（战斗系必须40级，生产系跑路安全）
	 * 人物40级视为购买等级为10级，20级视为购买等级6级
	 * 
	 */
	let buyLevel = 1
	if (resultDict.player_level >= 40) {
		buyLevel = 10
	} else if (resultDict.player_level >= 20) {
		buyLevel = 6
	}

	// 自己所掌握的工作技能
	let arr = [
		{ job: '购买', level: buyLevel, maxLevel: buyLevel }
	]
	let skills = cga.GetSkillsInfo()
	for (let s of skills) {
		if (thisobj.commonJobs.includes(s.name)) {
			// 常用工作技能，以当前等级为准
			arr.push({ job: s.name, level: s.lv, maxLevel: s.maxlv })
		}
	}
	resultDict.ability = arr

	// 自己当前的工作状态
	resultDict.state = thisobj.state

	// 时间戳，方便统计时使用
	resultDict.timestamp = Date.now()

	return resultDict
}

/**
 * 采集技能的通用工作函数，采集技能包括：
 * 1、狩猎
 * 2、挖掘
 * 3、伐木
 * @param {*} err 
 * @param {*} result 
 * @returns 
 */
const gatherWork = (err, result) => {

	check_drop();

	var playerInfo = cga.GetPlayerInfo();
	if (playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')) {
		loop();
		return;
	}
	
	if (thisobj.object.check_done()) {
		loop();
		return;
	}

	if (playerInfo.health > 0) {
		healObject.func(gatherWork);
		return;
	}

	var pets = cga.GetPetsInfo();
	for (var i = 0; i < pets.length; ++i) {
		if (pets[i].health > 0)
			healPetObject.func(gatherWork, i);
	}

	cga.StartWork(thisobj.object.skill.index, 0);
	// cga.AsyncWaitWorkingResult使用方式见开发文档
	cga.AsyncWaitWorkingResult((err, result) => {

		if (thisobj.logoutTimes > 0 && result !== undefined) {
			if (thisobj.gatherTimes == undefined)
				thisobj.gatherTimes = 0;

			if (thisobj.gatherTimes < thisobj.logoutTimes) {
				thisobj.gatherTimes++;
				// console.log('已挖'+thisobj.gatherTimes+'次');
			} else {
				cga.LogOut();
				return false;
			}
		}

		gatherWork(err, result);
	}, 10000);
}

/**
 * 采集类技能默认的check_done函数
 * 物品数大于等于20视为背包已满
 */
const gatherCheckDone = () => {
	return cga.getInventoryItems().length >= 20
}

const getWorkObj = (orderObj) => {
	let workObj = {
		// 工作所使用的技能
		skill: null,
		// 工作函数，收集物品的主要逻辑
		work: null,
		// 完成条件的检查函数
		check_done: null,
		// 赶往工作地点的函数
		forward: null,
		// 可选，从工作地点徒步返回补给点的函数。如果没有值，则直接登出。
		back: null,
	}

	// 采集目标的数据，根据不同的采集技能，获取对应的数据。
	// if-else的写法是为了以后其它收集物品的可扩展性。例如跑腿、打BOSS拿材料等非采集类的收集物品方式
	let target = null
	if (thisobj.commonJobs.includes(orderObj.skill)) {
		workObj.skill = cga.findPlayerSkill(orderObj.skill)
		workObj.work = gatherWork
		workObj.check_done = gatherCheckDone

		target = gatherDict[orderObj.skill].find((o) => { return o.name == orderObj.craft_name })

		workObj.forward = target.func
		workObj.back = target.back

	} else if (orderObj.skill == '购买') {

	} else {
		throw new Error('采集技能【' + orderObj.skill + '】数值有误。')
	}
}

var loop = () => {

	if (!thisobj.object) {
		console.log('等待服务端派单..')
		setTimeout(loop, 2000)
		return
	}

	// var skill = null;

	// if (gatherObject.skill !== null) {
	// 	skill = cga.findPlayerSkill(gatherObject.skill);
	// 	if (!skill) {
	// 		errmsg = '你没有' + gatherObject.skill + '技能';
	// 		cga.SayWords(errmsg, 0, 3, 1);
	// 		return;
	// 	}
	// 	if (mineObject.object && skill.lv < mineObject.object.level) {
	// 		var errmsg = gatherObject.skill + '技能等级不够，' + mineObject.object.name + '需要' + mineObject.object.level + '级技能，而你只有' + skill.lv + '级技能';
	// 		cga.SayWords(errmsg, 0, 3, 1);
	// 		return;
	// 	}
	// }
	var playerInfo = cga.GetPlayerInfo();
	if (playerInfo.mp < playerInfo.maxmp || playerInfo.hp < playerInfo.maxhp) {
		if (mineObject.supplyManager)
			mineObject.supplyManager(loop);
		else if (supplyObject.func)
			supplyObject.func(loop);
		return;
	}

	setTimeout(loop, 2000)
	return


	// 如果模块有自己的采集完毕的处理逻辑，就执行。
	// 否则，使用通用模块来处理。
	if (mineObject.check_done()) {
		console.log('完成任务，当前时间:' + Date(Date.now()))
		console.log('完成任务，当前金币:' + cga.GetPlayerInfo().gold)
		console.log('一次采集流程完成，耗时【' + ((Date.now() - mineObject.object.startTime) / 1000).toString() + '】秒')
		console.log('一次采集流程完成，消耗金币:【' + (mineObject.object.startGold - cga.GetPlayerInfo().gold) + '】')
		if (mineObject.doneManager)
			mineObject.doneManager(loop);
		else if (doneObject.func)
			doneObject.func(loop, mineObject.object);
		return;
	}


	callSubPluginsAsync('prepare', () => {
		cleanOtherItems(() => {
			mineObject.func(gatherWork);
		})
	});
}

var thisobj = {
	// 人物可以胜任的常用工作列表
	commonJobs: ['狩猎', '伐木', '挖掘'],
	// 自己的人物名称
	myname: cga.GetPlayerInfo().name,
	// 当前工作状态
	state: 'idle',
	// 当前工作对象，业务核心属性。会在接受订单时赋值。具体数据结构，参考【智能制造】emit发送的'order'数据。
	object: null,
	getDangerLevel: () => {
		var map = cga.GetMapName();

		if (map == '芙蕾雅')
			return 1;

		if (map == '米内葛尔岛')
			return 2;

		if (map == '莎莲娜')
			return 2;

		return 0;
	},
	translate: (pair) => {

		if (pair.field == 'serverPort') {
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if (healObject.translate(pair))
			return true;

		return false;
	},
	loadconfig: (obj) => {

		configTable.serverPort = obj.serverPort;
		thisobj.serverPort = obj.serverPort;

		if (!thisobj.serverPort) {
			console.error('读取配置：服务端口失败！');
			return false;
		}

		if (!healObject.loadconfig(obj))
			return false;

		return true;
	},
	inputcb: (cb) => {

		var stage1 = (cb2) => {

			var sayString = '【智能采集插件】请选择连接的服务端口(1000~65535):';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val >= 1000 && val <= 65535) {
					configTable.serverPort = val;
					thisobj.serverPort = val;

					var sayString2 = '当前已选择:连接的服务端口=' + thisobj.serverPort + '。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		Async.series([stage1, healObject.inputcb, trainMode.inputcb], cb);
	},
	execute: () => {
		// 子插件初始化
		callSubPlugins('init');

		socket = require('socket.io-client')('http://localhost:' + thisobj.serverPort, { reconnection: true });

		socket.on('connect', () => {
			console.log('成功连接到双百节点');
			socket.emit('refresh', getRefreshData());
		});

		socket.on('order', (data) => {
			console.log('接收到订单:', data);
			// 由于派单的时候服务端已经有自己的各种信息，所以派来的订单是一定可以接的
			// 更新自己的订单数据
			thisobj.object = data
			// 更改工作状态。由于客户端只给空闲人员派单，所以接单后一定可以立即变为采集状态
			thisobj.state = 'gathering'
			// 通知客户端自己的工作状态
			data.state = thisobj.state
			socket.emit('confirm', data);
		});

		// socket.on('init', (data) => {
		// 	thisobj.craft_player = data.craft_player;
		// 	thisobj.craft_materials = data.craft_materials;
		// 	thisobj.craft_player_pos = data.craft_player_pos;
		// 	data.craft_materials.forEach((m) => {
		// 		if (m.name == thisobj.object.name) {
		// 			thisobj.object.gatherCount = m.count * MATERIALS_MULTIPLE_TIMES;
		// 			thisobj.object.skuCount = m.count;
		// 		} else if (m.name.replace("条", "") == thisobj.object.name) {// 需要挖矿并压条的情况
		// 			thisobj.object.gatherCount = m.count * 20 * MATERIALS_MULTIPLE_TIMES;
		// 			thisobj.object.skuCount = m.count * 20;
		// 		}
		// 	});
		// });

		socket.on('trade', () => {

			thisobj.state = 'trading';

			var count = 0;
			var stuffs =
			{
				itemFilter: (item) => {
					if (count >= thisobj.object.craft_count)
						return false;
					if (thisobj.object.skill == '挖掘') {
						if (item.name == thisobj.object.craft_name + '条') {
							count += item.count;
							return true;
						}
					} else {
						if (item.name == thisobj.object.craft_name) {
							count += item.count;
							return true;
						}
					}

					return false;
				}
			}

			cga.waitTrade(stuffs, null, (result) => {
				if (result && result.success == true)
					cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);

				thisobj.state = 'done';
			});
		})

		socket.on('endtrade', () => {
			if (thisobj.state == 'trading') {
				thisobj.state = 'done';
				//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			}
		});

		socket.on('disconnect', () => {
			console.log('退出双百节点');
		});

		// main
		loop()
	},
};

module.exports = thisobj;