var cga = global.cga;
var configTable = global.configTable;

var socket = null;

/**
 * UNAecho: 制作了一个1-10级所有买布自适应脚本，人物会接受所有买布需求，依次去各地购买。
 * index:物品对应商店所处的index
 * price:单价，一组20个就要乘以20算
 * 所有布料的堆叠数都是20
 */
const fabricInfo = {
	'麻布' : {
		itemid : 10400,
		index : 0,
		price : 20,
		village : '法兰城',
	},
	'木棉布' : {
		itemid : 10401,
		index : 1,
		price : 25,
		village : '法兰城',
	},
	'毛毡' : {
		itemid : 10402,
		index : 2,
		price : 29,
		village : '法兰城',
	},
	'绵' : {
		itemid : 10403,
		index : 3,
		price : 33,
		village : '法兰城',
	},
	'细线' : {
		itemid : 10404,
		index : 4,
		price : 40,
		village : '法兰城',
	},
	'绢布' : {
		itemid : 10405,
		index : 0,// 维诺亚和魔法大学index都是0
		price : 50,
		village : '维诺亚村',
	},
	'莎莲娜线' : {
		itemid : 10406,
		index : 9,
		price : 100,
		village : '杰诺瓦镇',
	},
	'杰诺瓦线' : {
		itemid : 10407,
		index : 10,
		price : 120,
		village : '杰诺瓦镇',
	},
	'阿巴尼斯制的线' : {
		itemid : 10410,
		index : 1,
		price : 400,
		village : '魔法大学',
	},
	'阿巴尼斯制的布' : {
		itemid : 10411,
		index : 2,
		price : 400,
		village : '魔法大学',
	},
	'细麻布' : {
		itemid : 10408,
		index : 0,
		price : 130,
		village : '阿巴尼斯村',
	},
	'开米士毛线' : {
		itemid : 10409,
		index : 1,
		price : 170,
		village : '阿巴尼斯村',
	},
}

var isFabricName = (name)=>{
	return ['麻布', '木棉布', '毛毡', '绵', '细线', '绢布', '莎莲娜线', '杰诺瓦线', '阿巴尼斯制的线', '阿巴尼斯制的布', '细麻布', '开米士毛线', ].indexOf(name) != -1 ? true : false
}

var buyCount = (item, gatherCount) => {
	return gatherCount - cga.getItemCount(item) > 0 ? gatherCount - cga.getItemCount(item) : 0
}

//购买原材料需求的3倍（即造3件的量）
const MATERIALS_MULTIPLE_TIMES = 3;

var thisobj = {
	func : (cb) =>{
		thisobj.object.func(cb);
	},
	doneManager : (cb)=>{
		thisobj.object.doneManager(cb);
	},
	object : {
		name :'买布',
		func : (cb) =>{

			if(Object.keys(thisobj.object.gatherCount) == 0){
				setTimeout(thisobj.object.func, 1500, cb);
				return;
			}
			
			if(thisobj.check_done()){
				cb(true);
				return
			}

			for (var key in fabricInfo){
				// 如果制造方不需要买某种布，则跳过
				if(!thisobj.object.gatherCount[key]){
					// console.log('【'+ key + '】不需要购买')
					continue
				}
				// 如果身上已经有足够数量，则跳过
				var needBuy = buyCount(key, thisobj.object.gatherCount[key])
				if(needBuy == 0){
					// console.log('【'+ key + '】已有足够数量')
					continue
				}
				// console.log('【'+ key + '】需要购买【' + needBuy + '】个')
				if(!thisobj.object.order[fabricInfo[key].village]){
					thisobj.object.order[fabricInfo[key].village] = []
					thisobj.object.order[fabricInfo[key].village].push({item : key, index:fabricInfo[key].index, count: needBuy})
				}else{
					thisobj.object.order[fabricInfo[key].village].push({item : key, index:fabricInfo[key].index, count: needBuy})
				}


			}
			
			// 绢布可以在魔法大学顺便购买
			if (thisobj.object.order.hasOwnProperty('维诺亚村') && thisobj.object.order.hasOwnProperty('魔法大学')){
				console.log('【UNA脚本提醒】：绢布可以顺便在魔法大学直接买，就不去维诺亚村买了')
				thisobj.object.order['魔法大学'].push({item: '绢布', index:fabricInfo['绢布'].index, count: thisobj.object.order['维诺亚村'][0].count})
				delete thisobj.object.order['维诺亚村']
			}
			for (var village in thisobj.object.order){
				if(village == '法兰城'){
					cga.craft.buyFabricLv1Multi(thisobj.object.order[village], ()=>{
						thisobj.object.order = {}
						if(!thisobj.check_done()){
							thisobj.object.func(cb);
							return;
						}
						cb(true);
					});
					return
				}else if(village == '维诺亚村'){
					cga.craft.buyFabricLv2Multi(thisobj.object.order[village], ()=>{
						thisobj.object.order = {}
						if(!thisobj.check_done()){
							thisobj.object.func(cb);
							return;
						}
						cb(true);
					});
					return
				}else if(village == '杰诺瓦镇'){
					cga.craft.buyFabricLv3Multi(thisobj.object.order[village], ()=>{
						thisobj.object.order = {}
						if(!thisobj.check_done()){
							thisobj.object.func(cb);
							return;
						}
						cb(true);
					});
					return
				}else if(village == '魔法大学'){
					cga.craft.buyFabricLv4Multi(thisobj.object.order[village], ()=>{
						thisobj.object.order = {}
						if(!thisobj.check_done()){
							thisobj.object.func(cb);
							return;
						}
						cb(true);
					});
					return
				}else if(village == '阿巴尼斯村'){
					cga.craft.buyFabricLv5Multi(thisobj.object.order[village], ()=>{
						thisobj.object.order = {}
						if(!thisobj.check_done()){
							thisobj.object.func(cb);
							return;
						}
						cb(true);
					});
					return
				}
			}
		},
		doneManager : (cb)=>{
			thisobj.object.state = 'done';
			
			var repeat = ()=>{
				
				// console.log('更新买布状态：'+thisobj.object.state);
				
				if(!thisobj.check_done()){
					thisobj.object.state = 'gathering';
					socket.emit('gathering',{ player_name : cga.GetPlayerInfo().name, gold : cga.GetPlayerInfo().gold });
					cb(true);
					return;
				}
				
				if(thisobj.object.state == 'done'){
					var count = {};
					var stuffs = 
					{
						itemFilter : (item)=>{
							if(!isFabricName(item.name))
								return false;
							
							if(typeof count[item.name] == 'undefined')
								count[item.name] = 0;
							
							if(count[item.name] >= thisobj.object.gatherCount[item.name])
								return false;
							
							count[item.name] += item.count;
							return true;
						}
					}
					
					var filteredStuffs = cga.getInventoryItems().filter(stuffs.itemFilter);
					
					socket.emit('done', { count : count });
				}

				setTimeout(repeat, 1500);
			}
			// 由于买布脚本登出过于频繁，容易被禁用登出，所以改为徒步走路
			var curmap = cga.GetMapName()
			if (curmap == '流行商店'){
				cga.walkList([
					[0, 9, '法兰城'],
					[141, 89, '里谢里雅堡'],
					thisobj.worker_pos
					], ()=>{
						cga.turnTo(thisobj.worker_turn_dir);
						setTimeout(repeat, 1000);
					});
			}else{
				cga.travel.falan.toStone('C', ()=>{
					cga.walkList([
						thisobj.worker_pos
					], ()=>{
						cga.turnTo(thisobj.worker_turn_dir);
						setTimeout(repeat, 1000);
					});
				});
			}
		},
		state : 'gathering',
		gatherCount : {},
		// 采购清单，key为要去的村镇、城市，value为商品index和数量的dict
		order : {},
	},
	check_done : ()=>{
		if(Object.keys(thisobj.object.gatherCount) == 0)
			return false;
		
		for(var key in thisobj.object.gatherCount){
			if(cga.getItemCount(key) < thisobj.object.gatherCount[key])
				return false;
		}

		// 如果状态为done，则刷新采购单
		thisobj.object.order = {}
		return true;
	},
	translate : (pair)=>{
		
		if(pair.field == 'serverPort'){
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	loadconfig : (obj, cb)=>{
		configTable.serverPort = obj.serverPort;
		thisobj.serverPort = obj.serverPort;
		
		if(!thisobj.serverPort){
			console.error('读取配置：服务端口失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		var sayString = '【采集插件】请选择连接的服务端口(1000~65535):';
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, val)=>{
			if(val !== null && val >= 1000 && val <= 65535){
				configTable.serverPort = val;
				thisobj.serverPort = val;
				
				var sayString2 = '当前已选择:服务端口[' + thisobj.serverPort + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				cb(null);
				
				return false;
			}
			
			return true;
		});
	},
	init : ()=>{

		socket = require('socket.io-client')('http://localhost:'+thisobj.serverPort, { reconnection: true });

		socket.on('connect', ()=>{
			console.log('成功连接到双百节点');
			socket.emit('register', {
				state : thisobj.object.state,
				player_name : cga.GetPlayerInfo().name,
				// 初始资金，用于计算整体一批socket下的所有账号的生产利润总和
				initial_funding : cga.GetPlayerInfo().gold,
				job_name : thisobj.object.name,
			});
		});
		
		socket.on('init', (data)=>{
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			thisobj.craft_player_pos = data.craft_player_pos;
			thisobj.worker_pos = data.worker_pos;
			thisobj.worker_turn_dir = data.worker_turn_dir;
			if(data.craft_materials){
				//重置材料需求
				thisobj.object.gatherCount = {};
				data.craft_materials.forEach((m)=>{
					if(isFabricName(m.name)){
						thisobj.object.gatherCount[m.name] = m.count * MATERIALS_MULTIPLE_TIMES;						
					}
				});
			}
			
			// console.log(thisobj.object.gatherCount);
		});

		socket.on('trade', (required_stuffs)=>{

			thisobj.object.state = 'trading';
			
			var count = {};
			var stuffs = 
			{
				itemFilter : (item)=>{
					if(!isFabricName(item.name))
						return false;
					
					if(typeof count[item.name] == 'undefined')
						count[item.name] = 0;
					
					if(count[item.name] >= thisobj.object.gatherCount[item.name])
						return false;
					
					count[item.name] += item.count;
					return true;
				}
			}

			cga.waitTrade(stuffs, null, (result)=>{
				if(result && result.success == true)
					cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
				
				thisobj.object.state = 'done';
			});
		});
		
		socket.on('endtrade', ()=>{
			if(thisobj.object.state == 'trading'){
				thisobj.object.state = 'done';
				//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			}
		});
		
		socket.on('disconnect', ()=>{
			console.log('退出双百节点');
		});
	}
}

module.exports = thisobj;