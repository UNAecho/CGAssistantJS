var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//挖120个原材料
const MATERIALS_MULTIPLE_COUNT = 160;

//一次交易120个
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
		name :'牛奶',
		func : (cb) =>{
			
			if(thisobj.check_done()){
				cb(null);
				return
			}

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
								return item.name != '牛奶';
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
								[679, 312],
								], ()=>{
									setTimeout(cb, 1500);
								});
							});
						});
					});
				});
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