var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//挖400个原材料（即10组）,附带10组瓶子
const MATERIALS_MULTIPLE_COUNT = 400;

//一次交易200个（即5组）
const MATERIALS_TRADE_COUNT = 200;

//必须定居法兰城
cga.travel.gelaer.isSettled = false;
cga.travel.falan.isSettled = true;
cga.travel.newisland.isSettled = false;

var thisobj = {
	func : (cb) =>{
		thisobj.object.func(cb);
	},
	doneManager : (cb)=>{
		thisobj.object.doneManager(cb);
	},
	object : {
		name :'蕃茄',
		func : (cb) =>{
			
			if(thisobj.check_done()){
				cb(null);
				return
			}

			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[281, 88, '芙蕾雅'],
					[475, 161],
				], cb);
			});
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
			
			// if(cga.GetMapName() == '法兰城')
			// {
			// 	cga.travel.falan.toStone('E2', ()=>{
			// 		cga.turnTo(246, 78);
			// 		setTimeout(repeat, 1000);
			// 	});
			// 	return;
			// }
			if(thisobj.check_done()){
			console.log('去买瓶子...');
			cga.walkList([
				[217, 53, '拿潘食品店'],
				[19, 11],
			], ()=>{
				cga.cleanInventoryEx((it)=>{
					if(it.name == '蕃茄' && it.count < 20)
						return true;
					
					return it.name != '蕃茄' && it.name != '瓶子';
				}, ()=>{
					cga.turnTo(21, 11);
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
								if(it.name == '瓶子' && emptySlotCount > 0){
									buyitem.push({index: it.index, count:emptySlotCount * 20});
								}
							});

							cga.BuyNPCStore(buyitem);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								cga.walkList([
								[3, 12, '法兰城'],
								], ()=>{
									console.log('买完瓶子登出回法兰去找厨师...');
									cga.walkList([
										[245, 78],
									], ()=>{cga.turnTo(246, 78);})
									setTimeout(repeat, 1000);
								})
								return;
							});
						});
					});
				});					
			});}
		},
		state : 'gathering',
	},
	check_done : (result)=>{

		if(cga.getItemCount(thisobj.object.name) >= 400 && cga.GetMapName() == '法兰城'){
			console.log('材料齐了 ， 蕃茄：'+cga.getItemCount(thisobj.object.name)+'瓶子：'+cga.getItemCount('瓶子'));
			return true;}
		
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
			console.log('成功连接到蕃茄酱流水线节点');
			// console.log('state'+thisobj.object.state);
			// console.log('player_name'+cga.GetPlayerInfo().name);
			// console.log('job_name'+thisobj.object.name);
			socket.emit('register', {
				state : thisobj.object.state,
				player_name : cga.GetPlayerInfo().name,
				job_name : thisobj.object.name,
			});
		});
		
		socket.on('init', (data)=>{
			console.log('交易初始化..');
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			data.craft_materials.forEach((m)=>{
				if( m.name == thisobj.object.name )
					thisobj.object.gatherCount = MATERIALS_MULTIPLE_COUNT;
			});
		});
		
		socket.on('trade', ()=>{
			console.log('打开交易..');

			thisobj.object.state = 'trading';
			
			var count = 0;
			var count_bottle = 0;
			var stuffs = 
			{
				itemFilter : (item)=>{

					console.log('开始判定数量..');
					if (item.name == thisobj.object.name && item.count >= 20 && count < MATERIALS_TRADE_COUNT){
						count += item.count;
						return true;
					}
					
					if (item.name == '瓶子' && item.count >= 20 && count_bottle < MATERIALS_TRADE_COUNT / 2){
						count_bottle += item.count;
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
			console.log('退出蕃茄酱流水线节点');
		});
	}
}

module.exports = thisobj;