var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//买一车，20组
const MATERIALS_MULTIPLE_COUNT = 800;

//一次交易80个（即4组）
const MATERIALS_TRADE_COUNT = 80;

//必须定居新城
cga.travel.gelaer.isSettled = false;
cga.travel.falan.isSettled = false;
cga.travel.newisland.isSettled = true;

var thisobj = {
	func : (cb) =>{
		thisobj.object.func(cb);
	},
	doneManager : (cb)=>{
		thisobj.object.doneManager(cb);
	},
	object : {
		name :'砂糖',
		func : (cb) =>{
			console.log('开始寿喜锅流水线砂糖func...');
			if(thisobj.check_done()){
				cb(null);
				return
			}
			if (cga.GetPlayerInfo().souls != 0){
				thisobj.object.callsouls(cb);
				return
			}
			console.log('去买砂糖...'); 			
			cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
				cga.walkList([
				[5, 1, '村长家的小房间'],
				[9, 5, '村长的家'],
				[11, 6],
				], ()=>{
					
					cga.cleanInventoryEx((it)=>{
						if(it.name == '砂糖' && it.count < 20)
							return true;
						
						return it.name != '砂糖';
					}, ()=>{
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
									cga.travel.falan.toStone('C', ()=>{
										cga.walkList([
											//采集集散点
											[33, 91]
											], ()=>{
												//采集集散点站位朝向
												cga.turnTo(35, 91);
												setTimeout(repeat, 500);
											});
									});
									return;
								});
							});
						});
					});						
				});
			});
		},
		callsouls : (cb) =>{
			var playerinfo = cga.GetPlayerInfo();
			var items = cga.GetItemsInfo();
			var ctx = {
				playerinfo : playerinfo,
				petinfo : playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
				teamplayers : cga.getTeamPlayers(),
				inventory : items.filter((item)=>{
					return item.pos >= 8 && item.pos < 100;
				}),
				equipment : items.filter((item)=>{
					return item.pos >= 0 && item.pos < 8;
				}),
				result : null,
			}
		
			global.callSubPlugins('think', ctx);
		},
		gatherCount : MATERIALS_MULTIPLE_COUNT,
		doneManager : (cb)=>{
			thisobj.object.state = 'done';
			
			var repeat = ()=>{

				if(!thisobj.check_done()){
					thisobj.object.state = 'gathering';
					socket.emit('gathering');
					cb(true);
					return;
				}

				if(thisobj.object.state == 'done'){
					socket.emit('done', { count : cga.getItemCount(thisobj.object.name) });
				}
				
				setTimeout(repeat, 1500);
			}
			
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					//采集集散点
					[33, 91]
					], ()=>{
						//采集集散点站位朝向
						cga.turnTo(35, 91);
						setTimeout(repeat, 500);
					});
			});
		},
		state : 'gathering',
	},
	check_done : (result)=>{

		if(cga.getItemCount(thisobj.object.name) >= 20 && (cga.GetMapName() == '里谢里雅堡' || cga.GetMapName() == '艾尔莎岛'))
			return true;
		
		return cga.getItemCount(thisobj.object.name) >= thisobj.object.gatherCount;
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
			console.log('成功连接到烧鸡流水线节点');
			socket.emit('register', {
				state : thisobj.object.state,
				player_name : cga.GetPlayerInfo().name,
				job_name : thisobj.object.name,
			});
		});
		
		socket.on('init', (data)=>{
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			data.craft_materials.forEach((m)=>{
				if( m.name == thisobj.object.name )
					thisobj.object.gatherCount = MATERIALS_MULTIPLE_COUNT;
			});
		});

		socket.on('trade', ()=>{

			thisobj.object.state = 'trading';
			
			var count = 0;
			var stuffs = 
			{
				itemFilter : (item)=>{
					if(count >= MATERIALS_TRADE_COUNT)
						return false;
					
					if (item.name == thisobj.object.name && item.count >= 20){
						count += item.count;
						return true;
					}
					
					return false;
				}
			}

			cga.waitTrade(stuffs, null, (result)=>{
				if(result && result.success == true)
					cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
				
				thisobj.object.state = 'done';
			});
		})

		socket.on('endtrade', ()=>{
			if(thisobj.object.state == 'trading'){
				thisobj.object.state = 'done';
				//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			}
		});

		socket.on('disconnect', ()=>{
			console.log('退出烧鸡流水线节点');
		});
	}
}

module.exports = thisobj;