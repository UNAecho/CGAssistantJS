var fs = require('fs');
var Async = require('async');
const { min } = require('moment');
var cga = global.cga;
var configTable = global.configTable;
var socket = null;

// 原料采集信息
var flower = require('./采花.js').mineArray;
var food = require('./狩猎.js').mineArray;
var wood = require('./伐木.js').mineArray;
var mine = require('./挖矿.js').mineArray;

// 丢弃物品的类别
var dropTypeArr = [
	// 鹿皮
	26,
	// 蔬菜
	34,
	// 狩猎材料
	35,
]
var mineTypeInfo = ['使用狩猎、伐木、挖掘技能采集', '采集其他材料兑换或直接商店购买'];
// 合并信息
var actionarr = flower.concat(food).concat(wood).concat(mine)

// 采集原材料需求的几倍（即造几件的量），然后和其他人汇合。
// 注意：如果超出2倍，经常会出现制造者一直在桥头售卖的死循环，因为材料+成品可能会多于15个，特别是料理和血瓶的合成过程。
const MATERIALS_MULTIPLE_TIMES = 2;

var loadBattleConfig = ()=>{

	var settingpath = cga.getrootdir() + '\\战斗配置\\生产赶路.json'

	var setting = JSON.parse(fs.readFileSync(settingpath))

	cga.gui.LoadSettings(setting, (err, result)=>{
		if(err){
			console.log(err);
			return;
		}else{
			console.log('读取战斗配置【'+settingpath+'】成功')
		}
	})
	return
}

var thisobj = {
	func: (cb) => {
		thisobj.object.func(cb);
	},
	workManager : (cb)=>{// 本模块自定义采集方式
		thisobj.object.workManager(cb);
	},
	doneManager: (cb) => {
		thisobj.object.doneManager(cb);
	},
	object: {
		// 任务目标物品名称
		name : null,
		// 每次采集开始的计时
		startTime : null,
		// 每次采集开始的金额
		startGold : null,
		// 技能信息，动态更新
		skill : null,
		// loadconfig中定义需要什么技能。TODO：动态更新
		skillname : null,
		func: (cb) => {

			if (thisobj.object.gatherCount === null) {
				setTimeout(thisobj.object.func, 1500, cb);
				return;
			}

			if (thisobj.check_done()) {
				cb(null);
				return
			}
			thisobj.object.skill = cga.findPlayerSkill(thisobj.object.skillname)
			if(thisobj.object.skill && thisobj.object.skill.lv < thisobj.object.level){
				var errmsg = thisobj.object.skill.name+'技能等级不够，'+thisobj.object.name+'需要'+thisobj.object.level+'级技能，而你只有'+thisobj.object.skill.lv+'级技能';
				throw Error(errmsg)
			}
			// 找采集信息里面的目标obj
			var actobj = null
			for(var i in actionarr){
				if (actionarr[i].name == thisobj.object.name){
					actobj = actionarr[i]
					break
				}
			}
			if(actobj){
				//具体动作，也就是walklist以及cb那一套
				actobj.func(cb)
			}else{
				console.log('index = ' + index)
				console.log('未找到行动信息，请手动检查问题')
				cb(null)
			}
		},
		workManager : (cb)=>{
			if(thisobj.object.name == '小麦粉' && thisobj.mineType == 1){
				// 要兑换20个小麦粉，一次兑换动作可以换16个，需要换20/16次，取整，再乘20就是要准备的原材料数量
				var rawMaterialCount = Math.ceil((20.0 / 16.0 * MATERIALS_MULTIPLE_TIMES)) * 20
				if(cga.getItemCount('蕃茄') >= rawMaterialCount){
					console.log('替代品集齐'+rawMaterialCount+'了，去兑换目标物品')
					cga.travel.falan.toStone('C', ()=>{
						cga.travel.falan.toCamp(()=>{
							cga.walkList([
								[42, 56, '曙光营地医院'],
								[15,12, '曙光营地医院', 97, 12],
								[96,5],
							], ()=>{
								cga.turnDir(6);
								cga.exchangeItemFromStore(cb,thisobj.object.name)
							})
						}, true);
					})
				}else{
					cga.StartWork(thisobj.object.skill.index, 0);
					// cga.AsyncWaitWorkingResult使用方式见开发文档
					cga.AsyncWaitWorkingResult((err, result)=>{
						// 这里的cb执行的是采集.js中，自定义采集方式mineObject.workManager的workwork的回调
						thisobj.object.workManager(cb);
					}, 10000);
				}
			}else if(thisobj.object.name == '砂糖' && thisobj.mineType == 1){
				cga.turnTo(12, 6);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						var store = cga.parseBuyStoreMsg(dlg);
						if(!store)
						{
							cb(new Error('商店内容解析失败'));
							return;
						}
		
						var buyitem = [];
						var emptySlotCount = cga.getInventoryEmptySlotCount();
		
						store.items.forEach((it)=>{
							if(it.name == '砂糖' && emptySlotCount > 0){
								buyitem.push({index: it.index, count: emptySlotCount * 20});
							}
						});
		
						cga.BuyNPCStore(buyitem);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							setTimeout(cb, 1500);
							return;
						});
					});
				});
			}else{
				cga.StartWork(thisobj.object.skill.index, 0);
				// cga.AsyncWaitWorkingResult使用方式见开发文档
				cga.AsyncWaitWorkingResult((err, result)=>{
					if(thisobj.logoutTimes > 0 && result !== undefined){
						if(thisobj.gatherTimes == undefined)
							thisobj.gatherTimes = 0;
						
						if(thisobj.gatherTimes < thisobj.logoutTimes){
							thisobj.gatherTimes ++;
							// console.log('已挖'+thisobj.gatherTimes+'次');
						} else {
							cga.LogOut();
							return false;
						}
					}
					// 这里的cb执行的是采集.js中，自定义采集方式mineObject.workManager的workwork的回调
					cb(err, result);
				}, 10000);
			}
		},
		gatherCount: null,
		// 一件成品的原材料数量，例如寿喜锅的盐，skuCount为20
		skuCount: null,
		doneManager: (cb) => {

			thisobj.object.state = 'done';

			var repeat = () => {

				if (!thisobj.check_done()) {
					thisobj.object.state = 'gathering';
					socket.emit('gathering', { player_name: cga.GetPlayerInfo().name, gold: cga.GetPlayerInfo().gold });
					cb(true);
					return;
				}

				if (thisobj.object.state == 'done') {
					socket.emit('done', {
						count: thisobj.object.gatherCount,
						cost: !thisobj.object.startGold ? 0: (thisobj.object.startGold - cga.GetPlayerInfo().gold),
					});
				}

				setTimeout(repeat, 1500);
			}

			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[33, 88]
				], () => {
					cga.TurnTo(35, 88);
					setTimeout(repeat, 1000);
				});
			});
		},
		extra_dropping : (item)=>{
			if(dropTypeArr.indexOf(item.type) != -1 && item.name != thisobj.object.name){
				console.log('【UNA脚本提示】清理背包，物品:【' + item.name + '】类别:【'+item.type+'】，非目标物品，丢弃')
				return true;
			}
			
			return false
		},
		state: 'gathering',
	},
	check_done: () => {
		// console.log('thisobj.object.state:' + thisobj.object.state)
		// console.log('cga.getItemCount(thisobj.object.name):' + cga.getItemCount(thisobj.object.name))
		// console.log('thisobj.object.skuCount:' + thisobj.object.skuCount)
		if (thisobj.object.gatherCount === null)
			return false;
		if(thisobj.object.state == 'gathering'){
			// 修改check_done方式，改为打满或者打空蓝(低于2级治疗的35魔)再回去交付
			if (thisobj.object.state == 'gathering' && (cga.getItemCount(thisobj.object.name) >= thisobj.object.gatherCount) && (cga.getInventoryItems().length >= 15 || cga.GetPlayerInfo().mp < 35))
				return true
		}else{
			// 如果处于非收集环节，那么直到把材料都交出去，再去进行新一轮收集。
			if (cga.getItemCount(thisobj.object.name) >= thisobj.object.skuCount){
				return true
			}
		}
		return false;
	},
	translate: (pair) => {

		if (pair.field == 'serverPort') {
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'target') {
			pair.field = '采集目标';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if(pair.field == 'mineType'){
			pair.field = '获取材料方式';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		return false;
	},
	loadconfig: (obj, cb) => {
		configTable.serverPort = obj.serverPort;
		thisobj.serverPort = obj.serverPort;

		if (!thisobj.serverPort) {
			console.error('读取配置：服务端口失败！');
			return false;
		}

		for(var i in actionarr){
			if(actionarr[i].display_name == obj.target){
				configTable.target = actionarr[i].display_name;
				thisobj.object.name = actionarr[i].display_name;
				thisobj.object.level = actionarr[i].level;
				break;
			}
		}
		
		if(!thisobj.object){
			console.error('读取配置：双百采集材料种类失败！');
			return false;
		}

		for(var i in flower){
			if (flower[i].display_name == thisobj.object.name){
				thisobj.object.skillname = '伐木'
				break
			}
		}
		
		for(var i in food){
			if (food[i].display_name == thisobj.object.name){
				thisobj.object.skillname = '狩猎'
				break
			}
		}

		for(var i in wood){
			if (wood[i].display_name == thisobj.object.name){
				thisobj.object.skillname = '伐木'
				break
			}
		}

		for(var i in mine){
			if (mine[i].display_name == thisobj.object.name){
				thisobj.object.skillname = '挖掘'
				break
			}
		}
		
		configTable.mineType = obj.mineType;
		thisobj.mineType = obj.mineType
		// 如果没读到如何收集食材，则默认采集获取
		if(!thisobj.mineType){
			console.log('读取配置：使用默认的采集方式获取目标材料')
			thisobj.mineType = 0
		}

		// 暂时把读取战斗配置放在这里
		loadBattleConfig()

		return true;
	},
	inputcb: (cb) => {
		Async.series([(cb2)=>{
			var sayString = '【双百采集插件】请选择连接的服务端口(1000~65535):';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val >= 1000 && val <= 65535) {
					configTable.serverPort = val;
					thisobj.serverPort = val;
	
					var sayString2 = '当前已选择:服务端口[' + thisobj.serverPort + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
	
					cb2(null)
	
					return false;
				}
	
				return true;
			});
		}, (cb2)=>{
			var sayString = '【双百采集插件】请选择采集对象:[';
			for(var i in actionarr){
				if(i != 0 && i!=actionarr.length)
					sayString += ', ';
				sayString += '('+ (parseInt(i)+1) + ')' + actionarr[i].display_name;
			}
			sayString += ']';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{

				if(index !== null && index >= 1 && actionarr[index - 1]){
					configTable.target = actionarr[index - 1].display_name;
					
					var sayString2 = '当前已选择采集对象:[' + configTable.target + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null)
					
					return false;
				}
				
				return true;
			});
		},(cb2)=>{
			var sayString = '【采集插件】请选择材料采集方式: 0采集技能 1采集其他材料兑换或直接商店购买';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val <= 1){
					configTable.mineType = val;
					thisobj.mineType = val;
					
					var sayString2 = '当前已选择:'+mineTypeInfo[thisobj.mineType]+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}], cb);
	},
	init: () => {

		socket = require('socket.io-client')('http://localhost:' + thisobj.serverPort, { reconnection: true });

		socket.on('connect', () => {
			console.log('成功连接到双百节点');
			socket.emit('register', {
				state: thisobj.object.state,
				player_name: cga.GetPlayerInfo().name,
				// 初始资金，用于计算整体一批socket下的所有账号的生产利润总和
				initial_funding: cga.GetPlayerInfo().gold,
				job_name: thisobj.object.name,
			});
		});

		socket.on('init', (data) => {
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			data.craft_materials.forEach((m) => {
				if (m.name == thisobj.object.name)
					thisobj.object.gatherCount = m.count * MATERIALS_MULTIPLE_TIMES;
					thisobj.object.skuCount = m.count;
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

					if (item.name == thisobj.object.name) {
						count += item.count;
						return true;
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
	}
}

module.exports = thisobj;