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
var flower = require('./../公共模块/采花.js').mineArray;
var food = require('./../公共模块/狩猎.js').mineArray;
var wood = require('./../公共模块/伐木.js').mineArray;
var mine = require('./../公共模块/挖矿.js').mineArray;
// 合并信息
var actionarr = flower.concat(food).concat(wood).concat(mine)

// 采集员自动适配制造者的坐标以及朝向
var workerPos = cga.getStaticOrientationPosition(craftPlayerPos, craftPlayerTurnDir, 1)
var workerTurnDir = cga.tradeDir(craftPlayerTurnDir)

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
	if(resultDict.player_level >= 40){
		buyLevel = 10
	}else if (resultDict.player_level >= 20) {
		buyLevel = 6
	}

	// 自己所掌握的工作技能
	let arr = [
		{ job: '购买', level: buyLevel }
	]
	let skills = cga.GetSkillsInfo()
	for (let s of skills) {
		if (thisobj.commonJobs.includes(s.name)) {
			// 常用工作技能，以当前等级为准
			arr.push({ job: s.name, level: s.lv })
		}
	}
	resultDict.ability = arr

	// 自己当前的工作状态
	resultDict.state = thisobj.object.state

	// 时间戳，方便统计时使用
	resultDict.timestamp = Date.now()

	return resultDict
}
var loop = () => {

	var skill = null;

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

	var workwork = (err, result) => {

		check_drop();

		var playerInfo = cga.GetPlayerInfo();
		if (playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')) {
			loop();
			return;
		}

		if (mineObject.check_done(result)) {
			loop();
			return;
		}

		if (playerInfo.health > 0) {
			healObject.func(workwork);
			return;
		}

		var pets = cga.GetPetsInfo();
		for (var i = 0; i < pets.length; ++i) {
			if (pets[i].health > 0)
				healPetObject.func(workwork, i);
		}

		if (skill != null && !mineObject.workManager) {
			cga.StartWork(skill.index, 0);
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

				workwork(err, result);
			}, 10000);
		} else {// 如果模块有自己的采集方式，就使用自己的采集方式
			if (mineObject.workManager) {
				mineObject.workManager((err, result) => {
					workwork(err, result);
				});
			} else {
				setTimeout(workwork, 1500, null);
			}
		}
	}
	callSubPluginsAsync('prepare', () => {
		// 成本统计
		mineObject.object.startTime = Date.now()
		mineObject.object.startGold = playerInfo.gold
		console.log('开始任务,当前时间:' + Date(mineObject.object.startTime) + ',当前金币:' + mineObject.object.startGold)
		cleanOtherItems(() => {
			mineObject.func(workwork);
		})
	});
}

var thisobj = {
	// 人物可以胜任的常用工作列表
	commonJobs: ['狩猎', '伐木', '挖掘'],
	// 自己的人物名称
	myname : cga.GetPlayerInfo().name,
	// 当前工作对象
	object: {
		// 任务目标物品名称
		name : null,
		// 任务目标自定义名称，example:鱼翅哥拉尔
		display_name : null,
		// 当前人物状态
		state: 'idle',
	},
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
			console.error('读取配置：监听服务端口失败！');
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
					configTable.listenPort = val;
					thisobj.listenPort = val;

					var sayString2 = '当前已选择:监听端口=' + thisobj.listenPort + '。';
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
			console.log('接收到订单:',data);
			// 由于派单的时候服务端已经有自己的各种信息，所以派来的订单是一定可以接的
			// 更新自己的工作内容
			thisobj.object.name = data.craft_name
			thisobj.object.gatherCount = data.craft_count
			// 更改工作状态。由于客户端只给空闲人员派单，所以接单后一定可以立即变为采集状态
			thisobj.object.state = 'gathering'
			// 通知客户端自己的工作状态
			data.state = thisobj.object.state
			socket.emit('confirm', data);
		});

		socket.on('init', (data) => {
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			thisobj.craft_player_pos = data.craft_player_pos;
			data.craft_materials.forEach((m) => {
				if (m.name == thisobj.object.name) {
					thisobj.object.gatherCount = m.count * MATERIALS_MULTIPLE_TIMES;
					thisobj.object.skuCount = m.count;
				} else if (m.name.replace("条", "") == thisobj.object.name) {// 需要挖矿并压条的情况
					thisobj.object.gatherCount = m.count * 20 * MATERIALS_MULTIPLE_TIMES;
					thisobj.object.skuCount = m.count * 20;
				}
			});
		});

		socket.on('trade', () => {

			thisobj.object.state = 'trading';

			var count = 0;
			var stuffs =
			{
				itemFilter: (item) => {
					if (count >= thisobj.object.gatherCount)
						return false;
					if (thisobj.object.skillname == '挖掘') {
						if (item.name == thisobj.object.name + '条') {
							count += item.count;
							return true;
						}
					} else {
						if (item.name == thisobj.object.name) {
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

				thisobj.object.state = 'done';
			});
		})

		socket.on('endtrade', () => {
			if (thisobj.object.state == 'trading') {
				thisobj.object.state = 'done';
				//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			}
		});

		socket.on('disconnect', () => {
			console.log('退出双百节点');
		});
	},
};

module.exports = thisobj;