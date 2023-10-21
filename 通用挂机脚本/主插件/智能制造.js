var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()

// 集成智能培养角色，用于晋级、开传送等
var trainMode = require('./../子插件/智能培养角色');
// 集成智能培养角色，用于晋级、开传送等
var saveAndDraw = require('./../子插件/自动存取');

// 原料采集信息
var flower = require('./../公共模块/采花.js').mineArray;
var food = require('./../公共模块/狩猎.js').mineArray;
var wood = require('./../公共模块/伐木.js').mineArray;
var mine = require('./../公共模块/挖矿.js').mineArray;
var buy = require('./../公共模块/自定义购买.js').mineArray;
// 整合采集信息
var gatherDict = {
	'采花': flower,
	'狩猎': food,
	'伐木': wood,
	'挖矿': mine,
	'购买': buy,
}

const allowMats = [
	// 挖掘
	'铜条',
	// 购买
	'麻布',
	// 伐木
	'印度轻木',
	'苹果薄荷',
	'柠檬草',
	'蝴蝶花',
	// 狩猎
	'鹿皮',
	'小麦粉',
	'牛奶',
	'葱',
	'盐',
	'酱油',
	'牛肉',
	'砂糖',
	// 其它
];

// 自己的名字
var myname = cga.GetPlayerInfo().name

// 本职得意技数组，一般制造系只有唯一一个技能
var myCraftSkill = cga.job.getJob().skill[0]
if (!myCraftSkill) {
	throw new Error('职业数据中没有你的职业技能信息，请检查')
}

// 制造者交易时的站立坐标以及朝向坐标
var craftPlayerPos = [34, 89]
var craftPlayerTurnDir = 4

// 采集员自动适配制造者的坐标以及朝向
var workerPos = cga.getStaticOrientationPosition(craftPlayerPos, craftPlayerTurnDir, 1)
var workerTurnDir = cga.tradeDir(craftPlayerTurnDir)

var healObject = require(rootdir + '/通用挂机脚本/公共模块/治疗自己');

const isFabricName = (name) => {
	return ['麻布', '木棉布', '毛毡', '绵', '细线', '绢布', '莎莲娜线', '杰诺瓦线', '阿巴尼斯制的线', '阿巴尼斯制的布', '细麻布', '开米士毛线',].indexOf(name) != -1 ? true : false
}

/**
 * io.sockets使用小技巧
 * 
 * 1、io是此脚本全局对象，可以保存全局信息
 * 2、io中的数据多且繁杂，主要使用的对象是io.sockets
 * 3、io.sockets中，常用的就是emit()、on()、join()、leave()等方法
 * 4、io.sockets.sockets（注意是2个sockets）中保存着各种连接的信息，注意这里有的是客户端数据，有的则不是。需要自行辨别（例如检测是否含有'register'环节注册的cga_data键）
 * 5、io.sockets.sockets中的数据：key为唯一识别id。value才是各种连接的数据。其中最熟悉的cga_data就在这里。
 * 6、双百制造中，所使用的socket.join('buddy_' + data.job_name)方法，原理如下：
 * 实际上，不论是join()、in()、to()等方法，本质上就是对io.sockets中各个连接的一种刷选，return还是io.sockets类
 * 就像Array的.filter一样，只是筛选出来部分对象，筛选完依然是Array
 * join()、in()、to()等类似局部广播的方法，都是这种实现，只是一种索引指定连接的一种手段
 * 筛选出来sockets后，我们依然可以对其使用emit()方法来广播信息，只不过筛选过后，相当于局部广播了
 * 实际上，私信的原理我猜也是这样，只不过筛选出来唯一的socket吧，这样就做到了只有1个人收到广播信息，相当于私信。
 * 7、我们可以利用全局性质的io.sockets来保存各种数据（例如都存在cga_data中），只不过提出数据麻烦了一些，就不需要其它对象为我们保存信息了。
 * 这样数据的一致性就有了保障，否则到处定义数据、更新数据，出现数据不同步的现象很麻烦。
 * 8、【注意】io.sockets的各种数据全都属于服务端自身的行为，与客户端不发生任何关系，包括储存的各种数据。只有使用emit()、on()等广播行为，才能与客户端进行数据交互。
 * 所以客户端的工作状态state与socket.cga_data.state是同一个业务数据，但是技术上却不同步，需要靠emit()、on()等广播行为更新，维持同步。
 */
const io = require('socket.io')();

io.on('connection', (socket) => {

	socket.on('register', (data) => {
		socket.cga_data = data;
		// 由socket.js的join源码可知，如果已经加入过此房间，则直接跳过。可以放心重复join同一个房间，不会出现异常。
		// 注意：加入房间是属于服务端行为，与客户端不发生任何关系。是服务端自己索引（客户端）缓存数据的一种方式。
		socket.join('buddy_' + data.job_name);
		console.log(socket.cga_data.player_name + ' 已加入节点');
	});

	socket.on('refresh', (data) => {
		socket.cga_data = data
		console.log(socket.cga_data.player_name + ' 已更新数据');
	});

	socket.on('confirm', (data) => {
		// data数据其实是派单的时候emit('order')发出去的数据，客户端会在接收到之后emit('confirm')传回来。所以job_name直接复用craft_name即可。
		socket.cga_data.job_name = data.craft_name;
		socket.cga_data.state = data.state;
		console.log(socket.cga_data.player_name + ' 已确认接受订单，并更改其状态为:' + socket.cga_data.state);
	});

	socket.on('done', (data) => {
		socket.cga_data.count = data.count;
		socket.cga_data.state = 'done';
	});

	socket.on('gathering', () => {
		socket.cga_data.state = 'gathering';
	});

	socket.on('disconnect', (err) => {
		if (socket.cga_data) {
			console.log(socket.cga_data.player_name + ' 已退出节点');
		}
	})
});
var waitStuffs = (name, materials, cb) => {

	console.log('正在等待材料 ' + name);

	var repeat = () => {

		//修复：防止面向方向不正确导致无法交易
		if (cga.GetPlayerInfo().direction != craftPlayerTurnDir) {
			cga.turnDir(craftPlayerTurnDir)
			setTimeout(repeat, 500);
			return;
		}

		var s = io.in('buddy_' + name).sockets;
		var find_player = null;
		for (var key in s) {
			if (s[key].cga_data &&
				((s[key].cga_data.job_name == name) || (s[key].cga_data.job_name == '买布' && isFabricName(name))) &&
				s[key].cga_data.state == 'done') {
				find_player = s[key];
				break;
			}
		}

		if (find_player) {
			find_player.cga_data.state = 'trade';
			find_player.emit('init', {
				craft_player: cga.GetPlayerInfo().name,
				craft_materials: materials,
				craft_player_pos: craftPlayerPos,
				worker_pos: workerPos,
				worker_turn_dir: workerTurnDir,
			});

			find_player.emit('trade');

			var unit = cga.findPlayerUnit(find_player.cga_data.player_name);
			// UNAecho:采集者坐标更改为动态调整
			if (unit == null || unit.xpos != workerPos[0] || unit.ypos != workerPos[1]) {
				setTimeout(repeat, 1000);
				return;
			}

			setTimeout(() => {
				var stuffs = { gold: 0 };
				// 补贴一些传送石的费用，去过的村庄为true
				var villageFlag = {
					'维诺亚村': false,
					'杰诺瓦镇': false,
					'阿巴尼斯村': false,
				}

				if (find_player.cga_data.job_name == '买布' && Object.keys(find_player.cga_data.count).length > 0) {
					for (var key in find_player.cga_data.count) {
						if (key == '麻布') {
							stuffs.gold += find_player.cga_data.count[key] * 20;
						}
						else if (key == '木棉布') {
							stuffs.gold += find_player.cga_data.count[key] * 25;
						}
						else if (key == '毛毡') {
							stuffs.gold += find_player.cga_data.count[key] * 29;
						}
						else if (key == '绵') {
							stuffs.gold += find_player.cga_data.count[key] * 33;
						}
						else if (key == '细线') {
							stuffs.gold += find_player.cga_data.count[key] * 40;
						}
						else if (key == '绢布') {
							stuffs.gold += find_player.cga_data.count[key] * 50;
							villageFlag['维诺亚村'] = true
						}
						else if (key == '莎莲娜线') {
							stuffs.gold += find_player.cga_data.count[key] * 100;
							villageFlag['杰诺瓦镇'] = true
						}
						else if (key == '杰诺瓦线') {
							stuffs.gold += find_player.cga_data.count[key] * 120;
							villageFlag['杰诺瓦镇'] = true
						}
						else if (key == '阿巴尼斯制的线') {
							stuffs.gold += find_player.cga_data.count[key] * 400;
							villageFlag['阿巴尼斯村'] = true
						}
						else if (key == '阿巴尼斯制的布') {
							stuffs.gold += find_player.cga_data.count[key] * 400;
							villageFlag['阿巴尼斯村'] = true
						}
						else if (key == '细麻布') {
							stuffs.gold += find_player.cga_data.count[key] * 130;
							villageFlag['阿巴尼斯村'] = true
						}
						else if (key == '开米士毛线') {
							stuffs.gold += find_player.cga_data.count[key] * 170;
							villageFlag['阿巴尼斯村'] = true
						}
					}
				}

				for (var v in villageFlag) {
					if (villageFlag[v]) {
						console.log('采购员去过【' + v + '】，补贴【' + cga.travel.teleCost[v] + '】魔币')
						stuffs.gold += cga.travel.teleCost[v];
					}
				}

				if (find_player.cga_data.job_name == '鹿皮') {
					stuffs.gold += find_player.cga_data.count * 1;
				}
				if (find_player.cga_data.job_name == '印度轻木') {
					stuffs.gold += find_player.cga_data.count * 1;
				}
				if (find_player.cga_data.job_name == '铜条') {
					stuffs.gold += find_player.cga_data.count * 20;
				}
				if (find_player.cga_data.job_name == '铁条') {
					stuffs.gold += find_player.cga_data.count * 36;
				}
				if (find_player.cga_data.job_name == '葱') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 1.0 + 0)
				}
				if (find_player.cga_data.job_name == '盐') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.3 + 0)
				}
				if (find_player.cga_data.job_name == '酱油') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 1.5 + 0)
				}
				if (find_player.cga_data.job_name == '牛肉') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 4.0 + 0)
				}
				if (find_player.cga_data.job_name == '砂糖') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 4.5 + 0)
				}
				if (find_player.cga_data.job_name == '鸡蛋') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 2.5 + 0)
				}
				// 如果是买的，金币需要使用移动银行平衡
				if (find_player.cga_data.job_name == '胡椒') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 4.0 + 0)
				}
				if (find_player.cga_data.job_name == '鱼翅') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 31.0 + 0)
				}
				// console.log('交易对象信息:')
				// console.log(find_player.cga_data)
				// console.log('交易金钱信息:')
				// console.log(stuffs)
				cga.positiveTrade(find_player.cga_data.player_name, stuffs, null, (result) => {
					if (result.success == true) {
						cb(true);
					} else {
						find_player.emit('endtrade');
						setTimeout(repeat, 1500);
					}
				});
			}, 1500);

			return;
		}

		setTimeout(repeat, 1000);
	}

	cga.travel.falan.toStone('C', () => {
		cga.walkList([
			craftPlayerPos
		], () => {
			cga.turnDir(craftPlayerTurnDir);
			setTimeout(repeat, 500);
		});
	});
}

var getBestCraftableItem = () => {

	//refresh
	thisobj.craftSkill = cga.findPlayerSkill(thisobj.craftSkill.name);
	thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);

	var minGatherType = 999;

	var item = null;
	for (var i = thisobj.craftItemList.length - 1; i >= 0; i--) {
		// console.log('id:'+thisobj.craftItemList[i].itemid+',name:'+thisobj.craftItemList[i].name)
		if (thisobj.craftItemList[i].level > thisobj.craftSkill.level)
			continue;
		if (!thisobj.craftItemList[i].available)
			continue;
		var allow = true;
		var gather_type = 0;

		thisobj.craftItemList[i].materials.forEach((mat) => {

			if (allowMats.find((m) => { return m == mat.name }) == undefined) {
				allow = false;
				return false;
			}

			if (!isFabricName(mat.name))
				gather_type++;

			if (mat.name.indexOf('条') != -1) {
				gather_type++;
			}
		})

		if (allow == false)
			continue;

		if (gather_type < minGatherType) {
			minGatherType = gather_type;
			item = thisobj.craftItemList[i];
		}
	}
	return item;
}


var forgetAndLearn = (cb) => {
	let skillObj = cga.findPlayerSkill(myCraftSkill)
	let obj = null
	// 如果持有技能，则忘记技能
	if (skillObj) {
		let stoneSkill = cga.skill.getSkill('石化魔法')
		console.log('【UNAecho脚本提醒】去石化魔法NPC处忘记【' + skillObj.name + '】技能')
		obj = { act: 'forget', target: skillObj.name, npcpos: stoneSkill.npcpos }
		cga.travel.falan.toStone('C', (r) => {
			cga.walkList([
				[17, 53, '法兰城'],
			], (r) => {
				cga.askNpcForObj(obj, () => {
					// 忘记之后重新学习
					setTimeout(forgetAndLearn, 1000, cb);
				})
			});
		});
	} else {// 如果没有技能，则重新学习技能
		console.log('【UNAecho脚本提醒】去学习【' + myCraftSkill + '】技能')
		cga.askNpcForObj({ act: 'skill', target: myCraftSkill }, () => {
			cb(null)
		})
	}

	return
}

var dropUseless = (cb) => {
	if (cga.getInventoryItems().find((inv) => {
		return inv.name == '木棉布';
	}) != undefined && thisobj.craft_target.materials.find((mat) => {
		return mat.name == '木棉布';
	}) == undefined) {
		var itempos = cga.findItem('木棉布');
		if (itempos != -1) {
			cga.DropItem(itempos);
			setTimeout(dropUseless, 500, cb);
			return;
		}
	}

	if (cga.getInventoryItems().find((inv) => {
		return inv.name == '毛毡';
	}) != undefined && thisobj.craft_target.materials.find((mat) => {
		return mat.name == '毛毡';
	}) == undefined) {
		var itempos = cga.findItem('毛毡');
		if (itempos != -1) {
			cga.DropItem(itempos);
			setTimeout(dropUseless, 500, cb);
			return;
		}
	}

	cb(null);
}

var getMineObj = (name) => {
	for (let skill in gatherDict) {
		for (let mineObj of gatherDict[skill]) {
			if (mineObj.name == name) {
				return mineObj
			}
		}
	}
	throw new Error('未找到名为' + name + '的采集物品')
}

// 获取当前io对象中记录的各客户端分工人数情况
var getDivisionOfLabor = () => {
	let resultDict = {}
	for (var key in io.sockets.sockets) {
		if (io.sockets.sockets[key].cga_data && io.sockets.sockets[key].cga_data.job_name) {
			if (resultDict[io.sockets.sockets[key].cga_data.job_name]) {
				resultDict[io.sockets.sockets[key].cga_data.job_name] += 1
			} else {
				resultDict[io.sockets.sockets[key].cga_data.job_name] = 1
			}
		}
	}
	console.log('当前客户端各材料采集人数分布情况:', resultDict)
	return resultDict
}

var findGatherMethods = (materialName) => {
	let arr = []
	for (let skillName in gatherDict) {
		for (let obj of gatherDict[skillName]) {
			if (obj.name == materialName) {
				obj.skill = skillName == '采花' ? '伐木' : skillName
				arr.push(obj)
			}
		}
	}
	if (!arr.length) {
		throw new Error('未找到物品' + materialName + '的采集方式，请手动添加')
	}
	return arr
}

var getOrders = (materials) => {
	// 获取当前io对象中的各采集物品的人员分布情况
	let divisionOfLabor = getDivisionOfLabor()

	// 定义订单处理的专用数组，防止因为浅拷贝问题导致原数据被污染
	let orderArr = []

	// 遍历计算各材料的排序分数
	materials.forEach(m => {
		// 如果该物品有其它客户端在采集，则计算其排序分数。如果没有，则将分数置为最高
		let rank_score = divisionOfLabor[m.name] ? getMineObj(m.name).level * m.count / divisionOfLabor[m.name] : 99999
		// 采集途径，数组形式，可以为多种。例如糖可以魔法大学狩猎也可以维诺亚村买。
		let gather_method = findGatherMethods(m.name)
		orderArr.push({
			name: m.name,
			count: m.count,
			gather_method: gather_method,
			rank_score: rank_score,
		})
	})

	// 降序排列，分数越高的物品，需求越迫切（采集难度大或在职人员少），排名越靠前。
	orderArr.sort((a, b) => { return b.rank_score - a.rank_score })
	return orderArr
}

var chooseWorker = (materials) => {
	// 获取要派发的订单列表
	let orders = getOrders(materials)

	/**
	 * 根据订单的难易度以及排序分数，给空闲人员派发工作单。
	 * 时间复杂度非常大，但由于数据量较小，所以影响并不是很大。
	 */
	for (var key in io.sockets.sockets) {
		if (io.sockets.sockets[key].cga_data) {
			if (io.sockets.sockets[key].cga_data.state == 'idle') {
				for (let orderObj of orders) {
					for (let method of orderObj.gather_method) {
						for (let abilityObj of io.sockets.sockets[key].cga_data.ability) {
							if (abilityObj.job == method.skill && abilityObj.level >= method.level) {
								io.sockets.sockets[key].cga_data.state = 'confirm';
								io.sockets.sockets[key].emit('order', {
									craft_player: cga.GetPlayerInfo().name,
									craft_player_pos: craftPlayerPos,
									craft_name: orderObj.name,
									craft_count: orderObj.count,
								});
								// 派发一次订单后，不能继续遍历，因为所有的分工数据都要重新计算
								return
							}
						}
					}
				}
			} else if (io.sockets.sockets[key].cga_data.state == 'confirm') {
				console.log('玩家【' + io.sockets.sockets[key].cga_data.player_name + '】正在确认订单')
			}
		}
	}
}

var broadcast = (period) => {
	if (thisobj.craft_target) {
		chooseWorker(thisobj.craft_target.materials)
	}
	console.log('每间隔' + period + 'ms广播一次订单..')
	setTimeout(broadcast, period, period)
	return
}

var sellFilter = (item) => {
	if (item.name != thisobj.craft_target.name) {
		return false
	}
	// 料理type 23，血瓶43
	if (item.type == 23 || item.type == 43) {
		if (item.count == 3) {
			return true
		}
		return false
	} else {
		return true
	}
}

var cleanUseless = (cb)=>{

}

// 本方法需要多层if来避免循环判断带来的循环浪费
var checkaim = (playerInfo) => {
	//如果每次制造循环都判断是否到达双百，性能过于浪费。通过开启warnflag来避免这一问题
	if (warn_flag) {
		if (playerInfo['detail'].manu_endurance == 100 && playerInfo['detail'].manu_skillful == 100) {
			console.log('注意：人物已经刷到了双百，再刷下去也只是金钱和声望的增长，望周知')
			return
		}
	} else {
		return
	}

}

var loop = () => {
	// reset
	thisobj.craftSkill = null
	thisobj.craftItemList = null

	var craftSkillList = cga.GetSkillsInfo().filter((sk) => {
		return (sk.name.indexOf('制') == 0 || sk.name.indexOf('造') == 0 || sk.name.indexOf('铸') == 0 || sk.name.indexOf('料理') == 0 || sk.name.indexOf('制药') == 0);
	});
	console.log("🚀 ~ file: 智能制造.js:553 ~ craftSkillList ~ craftSkillList:", craftSkillList)
	/**
	 * 选择要烧的制造系技能逻辑：
	 * 1、如果发现是自己本职技能低于上限，停止遍历，优先选择。
	 * 2、
	 */
	for (var i in craftSkillList) {
		if (craftSkillList[i].name == myCraftSkill && craftSkillList[i].lv < craftSkillList[i].maxlv) {
			thisobj.craftSkill = craftSkillList[i];
			thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
			break;
		} else if (craftSkillList[i].lv < craftSkillList[i].maxlv) {
			thisobj.craftSkill = craftSkillList[i];
			thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
		}
	}

	// 利用移动银行平衡金币
	saveAndDraw.manualPrepare({
		"gold": [{
			"name": "金币",
			"upper": 900000,
			"lower": 50000
		}]
	}, () => {
		// 内置【智能培养角色】来自动完成晋级任务与晋级，方便直接从1级冲至10级生产技能。
		trainMode.prepare(() => {
			// 其它子插件的运行
			callSubPluginsAsync('prepare', () => {
				// 学技能动作，要在保证金币充足的地方才能调用
				if (!thisobj.craftSkill) {
					forgetAndLearn(loop);
					return;
				}
				// 一定要使用getBestCraftableItem()的最终结果来为thisobj.craft_target赋值。
				// 因为如果在getBestCraftableItem()内部直接给thisobj.craft_targe赋值，就有可能在搜索过程中，同步的广播函数会将未搜索完全的制造列表播放出去。
				thisobj.craft_target = getBestCraftableItem();
				if (!thisobj.craft_target) {
					throw new Error('没有可制造的物品!');
				}

				/**
				 * UNAecho:双百判断，使用最简单的是否双百判断。如果不是双百，即在大于等于5级时忘记技能
				 * 理由：【智能制造】的初衷是尽可能地兼容所有生产情况。
				 * 根据奥卡姆剃刀原理【如无必要,勿增实体】，不要增加诸多不必要的逻辑，日后的可扩展性也更大。
				 * 如果想看最低时间成本达到双百的逻辑，请参考我的【双百制造】脚本
				 */
				if (thisobj.double && thisobj.craftSkill.lv >= 5) {
					var curDetail = cga.GetPlayerInfo()['detail']
					var CurrentEndurance = curDetail.manu_endurance
					var CurrentSkillful = curDetail.manu_skillful
					if (CurrentEndurance < 100 || CurrentSkillful < 100) {
						console.log('【UNAecho脚本提醒】人物当前耐力：【' + CurrentEndurance + '】')
						console.log('【UNAecho脚本提醒】人物当前灵巧：【' + CurrentSkillful + '】')
						console.log('【UNAecho脚本提醒】耐力或灵巧不满足双百条件，需要忘记技能重新刷级')
						forgetAndLearn(loop);
						return;
					}
				}

				var playerInfo = cga.GetPlayerInfo();
				// UNAecho:当制作物品消耗低于35耗魔，而角色蓝量低于35并且受伤的时候，脚本会陷入无限等待的状态。添加一个35耗魔的补魔判断
				if (playerInfo.mp < 35 || playerInfo.mp < thisobj.craft_target.cost) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(loop, 3000);
					});
					return;
				}

				if (playerInfo.health > 0) {
					healObject.func(loop);
					return;
				}

				var inventory = cga.getInventoryItems();
				if (inventory.length >= 15) {
					cleanUseless(loop);
					return;
				}

				// io.sockets.emit('init', {
				// 	craft_player: myname,
				// 	craft_materials: thisobj.craft_target ? thisobj.craft_target.materials : [],
				// 	craft_player_pos: craftPlayerPos,
				// 	worker_pos: workerPos,
				// 	worker_turn_dir: workerTurnDir,
				// });

				io.sockets.emit('init', {
					craft_player: myname,
					craft_materials: thisobj.craft_target ? thisobj.craft_target.materials : [],
					craft_player_pos: craftPlayerPos,
					worker_pos: workerPos,
					worker_turn_dir: workerTurnDir,
				});

				var lackStuffs = null;
				thisobj.craft_target.materials.forEach((mat) => {
					if (cga.getItemCount(mat.name) < mat.count) {
						lackStuffs = mat;
						return false;
					}
				})

				if (lackStuffs !== null) {
					waitStuffs(lackStuffs.name, thisobj.craft_target.materials, loop);
					return;
				}

				var craft = () => {

					//没蓝
					var playerInfo = cga.GetPlayerInfo();
					if (playerInfo.mp < thisobj.craft_target.cost) {
						loop();
						return;
					}

					//包满
					if (cga.getInventoryItems().length >= 15) {
						loop();
						return;
					}

					//升级?
					if (cga.findPlayerSkill(thisobj.craftSkill.name).lv != thisobj.craftSkill.lv) {
						// 开启警告flag，用于接下来提醒是否已经刷满双百
						warn_flag = true
						loop();
						return;
					}

					// console.log('开始制造：'+thisobj.craft_target.name);

					cga.craftItemEx({
						craftitem: thisobj.craft_target.name,
						immediate: true
					}, (err, results) => {

						if (results && results.success) {
							//检查是否刷满双百
							if (!aim_flag) {
								checkaim(playerInfo)
							}
							setTimeout(craft, 500);
						} else {
							setTimeout(loop, 500);
						}

					});
				}

				craft();

			})
		})
	})
}

var thisobj = {
	// 此脚本的几种运行模式
	craftAimArr : ['刷钱','烧技能','制造'],
	getDangerLevel: () => {
		return 0;
	},
	translate: (pair) => {

		if (pair.field == 'craftAim') {
			pair.field = '制造目的';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if (pair.field == 'listenPort') {
			pair.field = '监听端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if (healObject.translate(pair))
			return true;

		return false;
	},
	loadconfig: (obj) => {

		configTable.double = obj.double;
		thisobj.double = obj.double;

		if (thisobj.double != 0 && thisobj.double != 1) {
			console.error('读取配置：是否刷双百失败！');
			return false;
		}
		
		configTable.craftAim = obj.craftAim;
		thisobj.craftAim = obj.craftAim;

		if (!thisobj.craftAimArr.includes(thisobj.craftAim)) {
			console.error('读取配置：制造目的失败！');
			return false;
		}

		configTable.listenPort = obj.listenPort;
		thisobj.listenPort = obj.listenPort

		if (!thisobj.listenPort) {
			console.error('读取配置：监听端口失败！');
			return false;
		}

		if (!healObject.loadconfig(obj))
			return false;

		return true;
	},
	inputcb: (cb) => {

		var stage1 = (cb2) => {
			var craftSkillList = cga.GetSkillsInfo().filter((sk) => {
				return (sk.name.indexOf('制') == 0 || sk.name.indexOf('造') == 0 || sk.name.indexOf('铸') == 0 || sk.name.indexOf('料理') == 0 || sk.name.indexOf('制药') == 0);
			});

			var sayString = '【智能制造】请选择刷的技能:';
			for (var i in craftSkillList) {
				if (i != 0)
					sayString += ', ';
				sayString += '(' + (parseInt(i) + 1) + ')' + craftSkillList[i].name;
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 1 && craftSkillList[index - 1]) {
					configTable.craftType = craftSkillList[index - 1].name;
					thisobj.craftSkill = craftSkillList[index - 1];
					thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);

					var sayString2 = '当前已选择:[' + thisobj.craftSkill.name + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);
					return false;
				}

				return true;
			});
		}

		var stage2 = (cb2) => {

			var sayString = '【智能制造】请选择服务监听端口: 1000~65535';
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

		Async.series([stage1, stage2, healObject.inputcb], cb);
	},
	execute: () => {
		io.listen(thisobj.listenPort);
		callSubPlugins('init');
		broadcast(5000)
		loop();
	},
};

module.exports = thisobj;