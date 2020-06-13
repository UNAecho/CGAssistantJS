var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//挖一车，19组
const MATERIALS_MULTIPLE_COUNT = 760;

//一次交易80个（即2组）
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
		name :'葱',
		func : (cb) =>{
			console.log('开始寿喜锅流水线func...');
			if(thisobj.check_done()){
				cb(null);
				return
			}
			if (cga.GetPlayerInfo().souls != 0){
				console.log('检测到掉魂了，启动招魂模块')
				cga.travel.falan.toStone('C', ()=>{
					cga.walkList([
					[41, 14, '法兰城'],
					[153, 29, '大圣堂的入口'],
					[14, 7, '礼拜堂'],
					[12, 19],
					], ()=>{
						cga.TurnTo(12, 17);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if(dlg.message && dlg.message.indexOf('我将为你取回') >= 0)
							{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(dlg.message && dlg.message.indexOf('不够') >= 0){
										throw '招魂钱不够！';
									}
	
									console.log('招魂完毕..');
								});
							}
							else
							{
								console.log('招魂模块结束..');
							}
						});
					});
				});
				return
			}
			// var mapname = cga.GetMapName();
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[61, 195],
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

		if(cga.getItemCount(thisobj.object.name) >= 20 && cga.GetMapName() == '里谢里雅堡')
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
			console.log('成功连接到寿喜锅流水线节点');
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
			console.log('退出寿喜锅流水线节点');
		});
	}
}

module.exports = thisobj;