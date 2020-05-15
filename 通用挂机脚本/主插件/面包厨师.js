var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var craft_count = 0;
var craft_target = null;

var healObject = require('./../公共模块/治疗自己');
var checkSettle = require('./../公共模块/登出检查定居地');

//必须定居新城
cga.travel.gelaer.isSettled = false;
cga.travel.falan.isSettled = false;
cga.travel.newisland.isSettled = true;

const io = require('socket.io')();

io.on('connection', (socket) => { 

	socket.emit('init', {
		craft_player : cga.GetPlayerInfo().name,
		craft_materials : craft_target ? craft_target.materials : [],
	});
	
	socket.on('register', (data) => {
		socket.cga_data = data;
		socket.join('buddy_'+data.job_name);
		console.log(socket.cga_data.player_name +' 已加入面包节点');
	});

	socket.on('done', (data) => {
		socket.cga_data.count = data.count;
		socket.cga_data.state = 'done'; 
	});
	
	socket.on('gathering', () => {
		socket.cga_data.state = 'gathering'; 
	});
	
	socket.on('disconnect', (err) => {
		if(socket.cga_data)
			console.log(socket.cga_data.player_name +' 已退出面包节点');
	})
});

var waitStuffs = (name, materials, cb)=>{

	console.log('正在等待材料 ' + name);

	var repeat = ()=>{
		
		// console.log('repeat....... ');
		//修复：防止面向方向不正确导致无法交易
		if(cga.GetPlayerInfo().direction != 4){
			console.log('设置人物等待方向..');
			cga.turnTo(34, 91);
			setTimeout(repeat, 500);
			return;
		}
		
		var s = io.in('buddy_'+name).sockets;
		var find_player = null;
		for(var key in s){
			if(s[key].cga_data &&
				(s[key].cga_data.job_name == name || (name == '小麦粉' && (s[key].cga_data.job_name == '牛奶' || s[key].cga_data.job_name == '盐')) ) &&
			s[key].cga_data.state == 'done' ){
				find_player = s[key];
				console.log('findplayer结束,break..');
				break;
			}
		}
		
		if(find_player){
			
			find_player.cga_data.state = 'trade';
			find_player.emit('init', {
				craft_player : cga.GetPlayerInfo().name,
				craft_materials : materials,
			});
			
			find_player.emit('trade');

			var unit = cga.findPlayerUnit(find_player.cga_data.player_name);

			if(unit == null || unit.xpos != 34 || unit.ypos != 91){
				setTimeout(repeat, 1000);
				return;
			}

			setTimeout(()=>{
				var stuffs = { gold : 0 };
				
				// 根据采集任务给钱
				if(find_player.cga_data.job_name == '小麦粉'){
					stuffs.gold += find_player.cga_data.count * 5;
				}
				if(find_player.cga_data.job_name == '牛奶'){
					stuffs.gold += find_player.cga_data.count * 5;
				}
				if(find_player.cga_data.job_name == '盐'){
					stuffs.gold += find_player.cga_data.count * 3;
				}

				cga.positiveTrade(find_player.cga_data.player_name, stuffs, null, (result)=>{
					if (result.success == true){
						cb(null);
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

	// cga.travel.falan.toCastleHospital(()=>{
	// 	cga.walkList([
	// 		[35, 91]
	// 		], ()=>{
	// 			cga.turnTo(34, 91);
	// 			setTimeout(repeat, 500);
	// 		});
	// });
	setTimeout(repeat, 1000);
}

var getBestCraftableItem = ()=>{
	console.log('查看料理最高等级是否能做目标物品..');
	//refresh
	thisobj.craftSkill = cga.findPlayerSkill('料理');
	if(!thisobj.craftSkill)
		return null;
	
	thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
	
	return thisobj.craftItemList.find((c)=>{
		return c.name == '面包';
	});
}

var loop = ()=>{
	
	console.log('loop()开始..');
	callSubPluginsAsync('prepare', ()=>{

		if(cga.GetMapName() != '里谢里雅堡')
		{
			console.log('当前地图不是王都，登出..');
			// cga.LogBack();
			cga.travel.falan.toStone('C',(r)=>{
				cga.walkList([
					[35, 91]
					], ()=>{
						cga.turnTo(34, 91);
						setTimeout(loop, 1000);
					});
			});
			return;
		}
		
		craft_target = getBestCraftableItem();
		if(!craft_target){
			throw new Error('无法制造面包，可能料理技能有问题，技能没有学习');
			return;
		}
		
		// 为了刷技能，改为做完料理卖店

		// if(cga.getItemCount('面包') > 0){
		// 	console.log('去银行存成品..');
		// 	cga.travel.falan.toBank(()=>{
		// 		cga.walkList([
		// 		[11, 8],
		// 		], ()=>{
		// 			cga.turnDir(0);
		// 			cga.AsyncWaitNPCDialog(()=>{
		// 				cga.saveToBankAll('面包', 3, (err)=>{
		// 					loop();
		// 				});
		// 			});
		// 		});
		// 	});
		// 	return;
		// }

		// 卖料理
		if(cga.getItemCount('面包') > 3){
			console.log('卖料理环节..');
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
				[30, 79],
				], ()=>{
					console.log('走到NPC周围！！');
					cga.TurnTo(30, 77);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							
							var sell = cga.findItemArray((item)=>{
								return item.name == '面包';
							});
							var sellArray = sell.map((item)=>{
								item.count /= 3;
								return item;
							});
							cga.SellNPCStore(sellArray);
							cga.AsyncWaitNPCDialog(()=>{
								cga.walkList([
									[35, 91]
									], ()=>{
										cga.turnTo(34, 91);
									});
							});
						});
					});
				});
			});
			console.log('卖料理结束..');
	}
		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.mp < craft_target.cost) {
			console.log('去医院补魔..');
			cga.travel.falan.toCastleHospital(()=>{
			});
			cga.walkList([
				[35, 91]
				], ()=>{
					cga.turnTo(34, 91);
					setTimeout(loop, 3000);
				});

			return;
		}
		
		if(playerInfo.health > 0) {
			healObject.func(loop);
			return;
		}

		io.sockets.emit('init', {
			craft_player : cga.GetPlayerInfo().name,
			craft_materials : craft_target ? craft_target.materials : [],
		});

		var lackStuffs = null;
		craft_target.materials.forEach((mat)=>{
			if(cga.getItemCount(mat.name) < mat.count){
				console.log('缺失材料 : '+mat.name+'  需要 : '+mat.count+'   还需 ： '+(mat.count-cga.getItemCount(mat.name)));
				lackStuffs = mat;
				return false;
			}
		})

		if(lackStuffs !== null){
			console.log('缺材料了，开始等待..');
			waitStuffs(lackStuffs.name, craft_target.materials, loop);
			return;
		}
		
		var craft = ()=>{

			//没蓝
			var playerInfo = cga.GetPlayerInfo();
			if(playerInfo.mp < craft_target.cost){
				loop();
				return;
			}
			
			// //包满
			// if(cga.getInventoryItems().length > 15){
			// 	console.log('包满了！');
			// 	loop();
			// 	return;
			// }

			console.log('开始制造：'+craft_target.name);
			
			cga.craftItemEx({
				craftitem : craft_target.name,
				immediate : true
			}, (err, results)=>{
				if(results && results.success){
					craft_count ++;
					console.log('已造' + craft_count + '次');
					setTimeout(craft, 500);
				} else {
					setTimeout(loop, 500);
				}
				
			});
		}
		
		craft();		
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
				
		if(pair.field == 'listenPort'){
			pair.field = '监听端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(healObject.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{
		
		configTable.listenPort = obj.listenPort;
		thisobj.listenPort = obj.listenPort
		
		if(!thisobj.listenPort){
			console.error('读取配置：监听端口失败！');
			return false;
		}
		
		if(!healObject.loadconfig(obj))
			return false;
		
		return true;
	},
	inputcb : (cb)=>{

		var stage3 = (cb2)=>{
			
			var sayString = '【面包插件】请选择服务监听端口: 1000~65535';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 1000 && val <= 65535){
					configTable.listenPort = val;
					thisobj.listenPort = val;
					
					var sayString2 = '当前已选择:监听端口='+thisobj.listenPort+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		
		Async.series([stage3, healObject.inputcb], cb);
	},
	execute : ()=>{
		io.listen(thisobj.listenPort);
		
		callSubPlugins('init');
		
		checkSettle.func((err, map)=>{
			if(map != '艾尔莎岛')
				throw new Error('必须定居新城!');
			
			loop();
		});
	},
};

module.exports = thisobj;