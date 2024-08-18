var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var healObject = require('./../公共模块/治疗自己');
// 集成智能培养角色，用于晋级、开传送等
var trainMode = require('./../子插件/智能培养角色');
// 集成智能培养角色，用于晋级、开传送等
var saveAndDraw = require('./../子插件/自动存取');

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

// 挖掘技能列表，用于各种逻辑判断
const gatherSkillNames = ['狩猎','伐木','挖掘']

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
const myname = cga.GetPlayerInfo().name

// 本职得意技数组，一般制造系只有唯一一个技能
var myCraftSkill = cga.job.getJob().skill[0]
if (!myCraftSkill) {
	throw new Error('职业数据中没有你的职业技能信息，请检查')
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
 * 关于私信的原理，我的猜测也是这样。只不过筛选出来唯一的socket吧，这样就做到了只有1个人收到广播信息，相当于私信。
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
		// socket.join('buddy_' + data.job_name);
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
		if (cga.GetPlayerInfo().direction != thisobj.address.turndir) {
			cga.turnDir(thisobj.address.turndir)
			setTimeout(repeat, 500);
			return;
		}

		var s = io.sockets.sockets;
		var find_player = null;
		for (var key in s) {
			if (s[key].cga_data &&
				((s[key].cga_data.job_name == name) || (s[key].cga_data.job_name == '买布' && cga.isFabricName(name))) &&
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

	// 获取交易地点
	let address = getAddress()
	if (address.country == '法兰王国' && address.mainmap == '法兰城') {
		cga.travel.falan.toStone('C', () => {
			cga.walkList([
				address.pos
			], () => {
				cga.turnDir(address.turndir);
				setTimeout(repeat, 500);
			});
		});
	} else {
		throw new Error('需要开发其它地点的逻辑')
	}
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

			if (!cga.isFabricName(mat.name))
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
	// 检查是否是可以合成的物品，如果是，提取原材料名称进行搜索，否则可能找不到结果。例如【铜条】是无法在采集资料里搜到的，而【铜】才能。
	materialObj = cga.getMaterialInfo(name)
	// 寻找采集资料
	for (let skill in gatherDict) {
		for (let mineObj of gatherDict[skill]) {
			if (mineObj.name == materialObj.raw_name) {
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

	// 需要二次加工的原料需要特殊处理，否则无法找到采集方法
	if(materialName.indexOf('条') != -1){
		materialName = materialName.replace('条', '')
	}

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

/**
 * 获取客户端采集材料后交付的收件人。
 * 目前默认是自己，为日后可能开发的多人协同做扩展准备
 * @returns 
 */
const getRecipient = () => {
	return myname
}

/**
 * 获取客户端采集材料后交付的收件人交易地址（国家、主地图、mapindex3、坐标、站立朝向）
 * 日后可能添加根据不同的制造物品，去不同的国家，不同主地图等交易地点
 * 国家名称参考：
 * 1、法兰王国（法兰城所在国家）
 * 2、苏国（阿凯鲁法村所在国家）
 * 3、艾尔巴尼亚王国（哥拉尔镇所在国家）
 * 4、天界之域（辛梅尔所在国家）
 * 5、神圣大陆（艾尔莎岛所在国家）
 * @returns 
 */
const getAddress = () => {
	let defaultAddress = {
		country: '法兰王国',
		mainmap: '法兰城',
		mapindex: 1500,
		pos: [34, 89],
		turndir: 4,
	}
	return defaultAddress
}

/**
 * 寻找某个socket对象
 * @param {*} obj filter对象，包括：
 * 1、playerName：玩家名称filter
 * 2、state：状态filter，可选值：'gathering'，'idle'，'done'等
 * 
 * 可自行增减条件逻辑
 * @returns 
 */
var findSocket = (obj) => {
	for (var key in io.sockets.sockets) {
		// io.sockets.sockets有自己的大量数据，我们只用自定义的cga_data来判断业务逻辑
		if (io.sockets.sockets[key].cga_data) {
			// 符合filter的flag
			let passCheck = true;
			// 名称filter
			if (typeof obj.playerName == 'string') {
				if (io.sockets.sockets[key].cga_data.player_name != obj.playerName) {
					passCheck = false;
				}
			}
			// 状态filter
			if (typeof obj.state == 'string') {
				if (io.sockets.sockets[key].cga_data.state != obj.state) {
					passCheck = false;
				}
			}
			// 如果满足所有条件，返回此socket，否则继续遍历
			if (passCheck) {
				return io.sockets.sockets[key]
			}
		}
	}
	// 没有符合filter的人，返回null
	return null
}

/**
 * socket的简易封装
 * @param {String} playerName 要发送的玩家名称
 * @param {String} changeState 发送时是否需要修改状态，可不填
 * @param {String} emitKey 发送key，如refresh
 * @param {Object} data 要发送的数据
 */
var emitFunc = (playerName, changeState, emitKey, data) => {

	if (!playerName || typeof emitKey != 'string' || typeof data != 'object') {
		throw new Error('emit数据格式有误，请检查')
	}

	let socketObj = findSocket({ playerName: playerName })
	// 没找到则不进行emit
	if (!socketObj) {
		console.warn('向【' + playerName + '】发送数据失败，可能已离线')
		return
	}

	// 找到了则正常发送emit
	// 如果有状态变更需求
	if (typeof changeState == 'string') {
		socketObj.cga_data.state = changeState
	}
	// 发送
	socketObj.emit(emitKey, data);
	return
}

var chooseWorker = (materials) => {
	// 获取要派发的订单列表
	let orders = getOrders(materials)
	// 由于order已经按照材料的需求度排名，取排名第1的物品作为本次分配的任务目标
	// 因为分配一次任务后，所有材料的需求度都会重新计算，所以只需取1个需求分数最高的物品即可。
	let orderObj = orders[0]
	console.log("🚀 ~ file: 智能制造.js:587 ~ chooseWorker ~ orderObj:", orderObj)
	if (!orderObj) {
		throw new Error('订单列表数据异常，请检查')
	}

	// 用于派单的排序数组，所有关于order的技能损失以及收益的数据会存放在这里
	let rankArr = []

	// 是否存在技能未达到上限的空闲人员。如果有，则优先把订单派给经验获取最高的人
	let skillNotMax = false

	/**
	 * 根据订单的难易度以及排序分数，给空闲人员派发工作单。
	 * 时间复杂度非常大，但由于数据量较小，所以影响并不是很大。
	 */
	for (var key in io.sockets.sockets) {
		if (io.sockets.sockets[key].cga_data) {
			if (io.sockets.sockets[key].cga_data.state == 'idle') {
				for (let method of orderObj.gather_method) {
					for (let abilityObj of io.sockets.sockets[key].cga_data.ability) {
						if (abilityObj.job == method.skill && abilityObj.level >= method.level) {
							// 每采集一次目标物品所获经验，默认为0
							let tmpExp = 0
							// 如果该技能为采集技能，并且没有达到该职级的最高等级，则获取采集一次目标物品可以获得的经验。
							if (abilityObj.level < abilityObj.maxLevel && ['狩猎', '伐木', '挖掘'].includes(abilityObj.job)) {
								tmpExp = cga.gather.getExperience(method.level, abilityObj.level, false)
							}
							
							// 如果有人技能等级未烧至当前职级最大，则标记
							if (!skillNotMax && tmpExp > 0) {
								skillNotMax = true
							}
							
							rankArr.push({
								player_name: io.sockets.sockets[key].cga_data.player_name,
								skill: abilityObj.job,
								skill_lost: abilityObj.level - method.level,
								skill_exp: tmpExp,
							})

						}
					}
				}
			} else if (io.sockets.sockets[key].cga_data.state == 'confirm') {
				console.log('玩家【' + io.sockets.sockets[key].cga_data.player_name + '】正在确认订单')
			}
		}
	}

	// 如果没有空闲的worker，结束此函数
	if (!rankArr.length) {
		return
	}
	console.log("🚀 ~ file: 智能制造.js:637 ~ chooseWorker ~ rankArr:", rankArr)

	/**
	 * 排序
	 * 
	 * 自定义名词解释：
	 * 1、获得经验量：采集技能单次采集物品所获得的经验值
	 * 2、技能等级损失：当前采集技能等级-物品等级
	 * 
	 * 排序逻辑：
	 * 如果有人技能未满，则以获得经验量降序排序。
	 * 如果所有人技能都达到当前最高级，则进入以下逻辑：
	 * 
	 * 当采集方式为【效率】时
	 * 1、将【购买】方式置顶，a,b均为购买时，以技能等级损失升序排序。
	 * 2、其余采集方式以技能等级损失升序排序。
	 * 
	 * 当采集方式为【利润】时
	 * 1、将采集类技能【狩猎】【伐木】【挖掘】方式置顶，a,b均为此类技能时，以技能等级损失升序排序。
	 * 2、其余采集方式以技能等级损失升序排序。
	 * 
	 * 这样做的理由：
	 * 1、有人技能未满时，找到一个收益最大的人来采集此物品，加速全员技能升级速度。
	 * 2、有一种尴尬情况：所有人技能都满时，2个人，一个10级技能，一个1级技能，10级技能抢了1级物品的订单，而1级技能无法接10级物品的订单。
	 * 使用技能等级损失，找到损失最小的那个人（采集等级最接近），来规避这种情况发生
	 */
	if (skillNotMax) {
		rankArr.sort((a, b) => { return b.skill_exp - a.skill_exp })
	} else {
		rankArr.sort((a, b) => {
			if(thisobj.gatherType == '效率'){
				if(a.skill == '购买' && b.skill != '购买'){
					return -1
				}else if(a.skill != '购买' && b.skill == '购买'){
					return 1
				}
				return a.skill_lost - b.skill_lost
			}
			if(thisobj.gatherType == '利润'){
				if(gatherSkillNames.includes(a.skill) && !gatherSkillNames.includes(b.skill)){
					return -1
				}else if(!gatherSkillNames.includes(a.skill) && gatherSkillNames.includes(b.skill)){
					return 1
				}
				return a.skill_lost - b.skill_lost
			}
			
			// thisobj.gatherType的其余兜底情况，一般不会走到这个逻辑
			return a.skill_lost - b.skill_lost
		})
	}

	// 制作派单信息
	// 候选对象
	let top_1 = rankArr[0]
	console.log("🚀 ~ file: 智能制造.js:658 ~ chooseWorker ~ top_1:", top_1)
	// 收件人名称
	let recipient = getRecipient()
	// 收件地址以及其它信息
	let address = getAddress()
	// 要发送的订单数据
	let emitData = {
		recipient: recipient,
		country: address.country,
		mainmap: address.mainmap,
		mapindex: address.mapindex,
		pos: address.pos,
		turndir: address.turndir,
		craft_name: orderObj.name,
		craft_count: orderObj.count,
		skill: top_1.skill,
		gather_type: thisobj.gatherType,
	}

	emitFunc(top_1.player_name, 'confirm', 'order', emitData)
	console.log('给玩家【' + top_1.player_name + '】派发订单【' + emitData.craft_name + ' x ' + emitData.craft_count + '】，采集方式【' + emitData.gather_type + '】')
	console.log('收件人【' + emitData.recipient + '】，所在国家【' + emitData.country + '】主地图【' + emitData.mainmap + '】地图index【' + emitData.mapindex + '】坐标【' + emitData.pos + '】朝向【' + emitData.turndir + '】')
	// 派发一次订单后，不能继续遍历，因为所有的分工数据都要重新计算
	return
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

var cleanUseless = (cb) => {
	if (thisobj.craftAim == '刷钱' || thisobj.craftAim == '烧技能') {
		var sellarray = cga.findItemArray((item) => {
			// 考虑到堆叠数没叠满不可以售卖，如果是料理和血瓶，只卖足够一组的格子。如果是装备，count=0即可售卖
			if (item.name == thisobj.craft_target.name && (item.count == 0 || item.count == 3)) {
				return true
			}
			return false
		});

		// 只要进入cleanUseless()，则物品必须清理，如果没找到物品，则视为逻辑bug，必须解决，否则人物会背包会满。
		if (!sellarray.length) {
			throw new Error('cleanUseless()没有识别出要售卖的东西，请检查')
		}
		// 调整售卖数量，因为卖店的count与装备的堆叠数count不是一个含义
		sellarray = sellarray.map((item) => {
			if (item.count == 3) {
				item.count /= 3;
			}
			return item;

		});
		cga.travel.falan.toStone('B2', () => {
			cga.turnTo(157, 122);
			cga.sellArray(sellarray, cb, 8000);
		});
	} else if (thisobj.craftAim == '制造') {
		// 默认全部存至移动银行
		saveAndDraw.manualPrepare({
			"item": [{ "name": thisobj.craft_target.name, "upper": 0, "lower": 0 },],
		}, cb)
	}
	// 不会出现else情况，因为loadconfig已经将else情况规避
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
	/**
	 * 选择要烧的制造系技能逻辑：
	 * 1、如果发现是自己本职技能低于上限，停止遍历，优先选择。
	 * 2、如果其它技能低于上限，暂时选择该技能，但不能停止遍历，因为可能本职技能的顺序在此技能之后
	 * 3、如果遍历所有制造系技能后依然没有发现能烧的技能，后面会将逻辑改为刷钱。
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
				// 如果没找到要烧的技能，判断一下是什么情况
				if (!thisobj.craftSkill) {
					// 如果有本职技能，那么判断是已经烧满，可能是暂时烧满（声望不够晋级），也可能是最终烧满（技能10级）。
					let craftSkillObj = cga.findPlayerSkill(myCraftSkill)
					if (craftSkillObj) {
						// 不管是暂时烧满还是最终烧满，都将制造技能改为本职技能刷钱，直至声望变化去晋级/玩家手动介入。
						thisobj.craftSkill = craftSkillObj
						thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
					} else {// 如果没找到本职技能，判断是没学，或者处于刷双百过程中，刚刚忘记本职技能。去学习
						forgetAndLearn(loop);
						return;
					}
				}
				// 一定要使用getBestCraftableItem()的最终结果来为thisobj.craft_target赋值。
				// 因为如果在getBestCraftableItem()内部直接给thisobj.craft_targe赋值，就有可能在搜索过程中，同步的广播函数会将未搜索完全的制造列表播放出去。
				thisobj.craft_target = getBestCraftableItem();
				if (!thisobj.craft_target) {
					throw new Error('没有可制造的物品!');
				}

				console.log('正在制作【'+thisobj.craft_target.name+'】')
				
				/**
				 * UNAecho:双百判断，使用最简单的是否双百判断。如果不是双百，即在大于等于5级时忘记技能
				 * 理由：【智能制造】的初衷是尽可能地兼容所有生产情况。
				 * 根据奥卡姆剃刀原理【如无必要,勿增实体】，不要增加诸多不必要的逻辑，日后的可扩展性也更大。
				 * 如果想看最低时间成本达到双百的逻辑，请参考我的【双百制造】脚本
				 */
				if (thisobj.double && thisobj.craftSkill.lv >= 5) {
					var curDetail = cga.GetPlayerInfo()['detail']
					var curEndurance = curDetail.manu_endurance
					var curSkillful = curDetail.manu_skillful
					var curIntelligence = curDetail.manu_intelligence
					if (['治疗', '急救'].includes(myCraftSkill) && (curEndurance < 100 || curIntelligence < 100)) {
						console.log('【UNAecho脚本提醒】人物当前耐力【' + curEndurance + '】智力【' + curIntelligence + '】不满足双百条件，忘记本职技能，重新学习。')
						forgetAndLearn(loop);
						return;
					} else if (['料理', '制药', '鉴定'].includes(myCraftSkill) && (curSkillful < 100 || curIntelligence < 100)) {
						console.log('【UNAecho脚本提醒】人物当前灵巧【' + curSkillful + '】智力【' + curIntelligence + '】不满足双百条件，忘记本职技能，重新学习。')
						forgetAndLearn(loop);
						return;
					} else if (curEndurance + curSkillful + curIntelligence < 200) {// 武器/防具制造技能过多，偷懒的写法
						console.log('【UNAecho脚本提醒】人物当前耐力【' + curEndurance + '】灵巧【' + curSkillful + '】不满足双百条件，忘记本职技能，重新学习。')
						forgetAndLearn(loop);
						return;
					}
				}

				var playerInfo = cga.GetPlayerInfo();
				// UNAecho:当制作物品消耗低于35耗魔，而角色蓝量低于35并且受伤的时候，脚本会陷入无限等待的状态。添加一个35耗魔的补魔判断
				if (playerInfo.mp < 35 || playerInfo.mp < thisobj.craft_target.cost) {
					cga.travel.toHospital(() => {
						setTimeout(loop, 3000);
					}, false, false);
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
	craftAimArr: ['刷钱', '烧技能', '制造'],
	// 客户端采集的方式
	gatherTypeDict: {
		'利润': '舍弃效率，采取利润最大的方式采集。刷钱请用这个模式。',
		'效率': '舍弃利润，采取效率最高的方式采集。追求速度，不计成本，请用这个模式。',
	},
	// 获取自己的收件地址，同时也是制造地址，建议站在回补NPC旁边。
	address: getAddress(),
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

		if (pair.field == 'gatherType') {
			pair.field = '采集方式';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'double') {
			pair.field = '是否刷双百';
			pair.value = pair.value ? '是' : '否';
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

		if (trainMode.translate(pair))
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

		configTable.gatherType = obj.gatherType;
		thisobj.gatherType = obj.gatherType;

		if (!thisobj.gatherTypeDict[thisobj.gatherType]) {
			console.error('读取配置：客户端采集方式失败！');
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

		if (!trainMode.loadconfig(obj))
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
			var sayString = '【智能制造】请选择制造目的:';
			for (var i in thisobj.craftAimArr) {
				if (i != 0)
					sayString += ', ';
				sayString += '(' + (parseInt(i) + 1) + ')' + thisobj.craftAimArr[i];
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 1 && thisobj.craftAimArr[index - 1]) {
					configTable.craftAim = thisobj.craftAimArr[index - 1]
					thisobj.craftAim = thisobj.craftAimArr[index - 1]

					var sayString2 = '当前已选择:[' + thisobj.craftAim + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		var stage3 = (cb2) => {
			var sayString = '【智能制造】请选择采集目标物品的方式:';
			var arr = Object.keys(thisobj.gatherTypeDict)
			for (var i in arr) {
				if (i != 0)
					sayString += ', ';
				sayString += '(' + (parseInt(i) + 1) + ')' + arr[i];
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 1 && arr[index - 1]) {
					configTable.gatherType = arr[index - 1]
					thisobj.gatherType = arr[index - 1]

					var sayString2 = '当前已选择:[' + thisobj.gatherType + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		var stage4 = (cb2) => {

			var sayString = '【智能制造】请选择是否需要刷双百，0不需要1需要。';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, value) => {
				if (value !== null && (value == 0 || value == 1)) {

					let saveValue = value == 1
					let strValue = value == 1 ? '需要' : '不需要'

					configTable.double = saveValue;
					thisobj.double = saveValue

					sayString = '当前已选择:[' + strValue + ']刷双百。';
					cga.sayLongWords(sayString, 0, 3, 1);

					cb2(null)
					return false;
				}

				return true;
			});
		}

		var stage5 = (cb2) => {

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
		Async.series([stage1, stage2, stage3, stage4, stage5, healObject.inputcb, trainMode.inputcb], cb);
	},
	execute: () => {
		io.listen(thisobj.listenPort);
		callSubPlugins('init');
		broadcast(5000)
		loop();
	},
};

module.exports = thisobj;