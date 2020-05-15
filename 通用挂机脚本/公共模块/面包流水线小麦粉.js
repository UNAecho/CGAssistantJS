var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//挖160个原材料
const MATERIALS_MULTIPLE_COUNT = 160;

//一次交易160个
const MATERIALS_TRADE_COUNT = 80;

//必须定居新城
cga.travel.gelaer.isSettled = false;
cga.travel.falan.isSettled = false;
cga.travel.newisland.isSettled = true;

var thisobj = {

	func : (cb) =>{
		console.log('thisobj.func............');
		thisobj.object.func(cb);
	},
	doneManager : (cb)=>{
		// console.log('doneManager............');
		thisobj.object.doneManager(cb);
	},
	object : {
		name :'小麦粉',
		func : (cb) =>{
			console.log('thisobj.object.func..........');
			if(thisobj.check_done()){
				cb(null);
				return
			}
			
			console.log('thisobj.sell.func..........');
			console.log('开始小麦粉！！！！！！！！！');
			//卖杂物，同采集后操作
			cga.travel.falan.toStone('C', ()=>{
				console.log('卖杂物！！');
				cga.walkList([
				[30, 79],
				], ()=>{
					console.log('走到NPC周围！！');
					cga.TurnTo(30, 77);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							
							var sell = cga.findItemArray((item)=>{
								return item.name != '小麦粉';
							});
							var sellArray = sell.map((item)=>{
								item.count /= 20;
								return item;
							});
							cga.SellNPCStore(sellArray);
							cga.AsyncWaitNPCDialog(()=>{
								cga.walkList([
								[27, 82],
								[41,98,'法兰城'],
								[281, 88, '芙蕾雅'],
								[724, 235],
								], ()=>{
									setTimeout(cb, 1500);
								});
							});
						});
					});
				});
			});

			// if(cga.getItemCount('蕃茄') > 20){
			// 	cga.travel.falan.toCamp(()=>{
			// 		cga.walkList([
			// 		[42, 56, '曙光营地医院'],
			// 		[15, 8],
			// 		[15, 9],
			// 		[15, 10],
			// 		[15, 11],
			// 		[15, 12, '曙光营地医院'],
			// 		[97, 12,]
			// 		], ()=>{
			// 			cga.TurnTo(96, 3);
			// 			setTimeout(()=>{
			// 				// 蕃茄是原料，0是曙光营地医院2楼，蕃茄换其它食材的商店第一个材料：小麦粉。
			// 				// index 0: 小麦粉 ，1: 鸡蛋 ，2：葱 ，3 ： 青椒
			// 				cga.AsyncWaitNPCDialog(()=>{
			// 					cga.ClickNPCDialog(0, 0);
			// 					cga.AsyncWaitNPCDialog(()=>{
			// 						var exchangeCount = cga.getItemCount('蕃茄') / 20;
			// 						cga.BuyNPCStore([{index:0, count:exchangeCount}]);
			// 						cb(null);
			// 					});
			// 				});
			// 			}, 
			// 			2000);
			// 		})
			// 	}, true);
			// }
		},
		gatherCount : MATERIALS_MULTIPLE_COUNT,
		doneManager : (cb)=>{
			// console.log('thisobj.doneManager..........');
			thisobj.object.state = 'done';
			
			var repeat = ()=>{
				
				// console.log('thisobj.doneManager.repeat..........');
				// console.log('thisobj.check_done() : '+ thisobj.check_done());
				// console.log('thisobj.object.state : '+ thisobj.object.state);
				if(!thisobj.check_done()){
					// console.log('if(!thisobj.check_done()){ : ');
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
			
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					[140, 104]
					], ()=>{
						cga.turnTo(140, 106);
						setTimeout(repeat, 500);
					});
			});
		},
		state : 'gathering',
	},
	check_done : (result)=>{
		return cga.getItemCount(thisobj.object.name) >= thisobj.object.gatherCount;
	},
	translate : (pair)=>{
		console.log('translate...........');
		
		if(pair.field == 'serverPort'){
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	loadconfig : (obj, cb)=>{
		console.log('loadconfig...........');
		configTable.serverPort = obj.serverPort;
		thisobj.serverPort = obj.serverPort;
		
		if(!thisobj.serverPort){
			console.error('读取配置：服务端口失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		console.log('inputcb...........');
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
		console.log('init...........');
		socket = require('socket.io-client')('http://localhost:'+thisobj.serverPort, { reconnection: true });

		socket.on('connect', ()=>{
			console.log('成功连接到面包流水线节点');
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
			console.log('trade........');
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
			console.log('退出面包流水线节点');
		});
	}
}

module.exports = thisobj;