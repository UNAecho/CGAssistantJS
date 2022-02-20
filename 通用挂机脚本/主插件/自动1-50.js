var Async = require('async');
var supplyMode = require('../公共模块/高地回补');
var supplyCastle = require('../公共模块/里堡回补');
var sellCastle = require('../公共模块/里堡卖石');
var teamMode = require('../公共模块/组队模式');
var logbackEx = require('../公共模块/登出防卡住');

var cga = global.cga;
var configTable = global.configTable;

var interrupt = require('../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var supplyArray = [supplyMode, supplyCastle];

var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}
// 队伍最低和最高等级
var minlv = null
var maxlv = null
// 界定是否是大号的阈值，大于则是，否则不是
var nannylv = 150

//卖石
var sellArray = [sellCastle];

var getSellObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return sellArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}
// 走诅咒迷宫到指定层数
var walkMazeForward = (cb)=>{
	var map = cga.GetMapName();
	if(map == '诅咒之迷宫地下'+(thisobj.layerLevel)+'楼'){
		cb(true);
		return;
	}
	if(map == '芙蕾雅'){
		cb(false);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('诅咒之迷宫地下') >= 0)
		{
			cb(true);
			return;
		}
		walkMazeForward(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return '诅咒之迷宫地下'+(layerIndex + 1)+'楼';
		},
		entryTileFilter : (e)=>{
			return e.colraw == 0x36AD;
		}
	});
}
// 练级地点
var battleAreaArray = [
	{
		//本dict仅name有用，walkTo请无视
		name : '全自动练级',
		walkTo : (cb)=>{
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
		},
		moveDir : 2,
		isDesiredMap : (map)=>{
			return (map == '布拉基姆高地' || map.indexOf('诅咒之')>=0 || map.indexOf('回廊')>=0);
		}
	},
	{
		name : '低地鸡',
		walkTo : (cb)=>{
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			if(map == '医院' && mapindex == 59539){
				cga.walkList([
					[28, 52, '艾夏岛'],
					[190, 116, '盖雷布伦森林'],
					[200, 211],
				], cb);
			} else {
				cga.travel.newisland.toStone('D', ()=>{
					cga.walkList([
						[190, 116, '盖雷布伦森林'],
						[200, 211],
					], cb);
				});
			}
		},
		moveDir : 0,
		isDesiredMap : (map)=>{
			return (map == '盖雷布伦森林');
		}
	},
{
	name : '刀鸡',
	walkTo : (cb)=>{
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		if(map == '医院' && mapindex == 59539){
			cga.walkList([
				[28, 52, '艾夏岛'],
				[190, 116, '盖雷布伦森林'],
				[231, 222, '布拉基姆高地'],
				[34, 188],
			], cb);
		} else {
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[34, 188],
				], cb);
			});
		}
	},
	moveDir : 0,
	isDesiredMap : (map)=>{
		return (map == '布拉基姆高地');
	}
},

{
	name : '龙骨',
	walkTo : (cb)=>{
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		if(map == '医院' && mapindex == 59539){
			cga.walkList([
				[28, 52, '艾夏岛'],
				[190, 116, '盖雷布伦森林'],
				[231, 222, '布拉基姆高地'],
				[111, 206],
			], cb);
		} else {
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[111, 206],
				], cb);
			});
		}
	},
	moveDir : 0,
	isDesiredMap : (map)=>{
		return (map == '布拉基姆高地');
	}
},

{
	name : '黄金龙骨',
	walkTo : (cb)=>{
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		if(map == '医院' && mapindex == 59539){
			cga.walkList([
				[28, 52, '艾夏岛'],
				[190, 116, '盖雷布伦森林'],
				[231, 222, '布拉基姆高地'],
				[135, 175],
			], cb);
		} else {
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[135, 175],
				], cb);
			});
		}
	},
	moveDir : 6,
	isDesiredMap : (map)=>{
		return (map == '布拉基姆高地');
	}
},
{
	name : '银狮',
	walkTo : (cb)=>{
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		if(map == '医院' && mapindex == 59539){
			cga.walkList([
				[28, 52, '艾夏岛'],
				[190, 116, '盖雷布伦森林'],
				[231, 222, '布拉基姆高地'],
				[147, 117],
			], cb);
		} else {
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[122, 117],
					[147, 117],
				], cb);
			});
		}
	},
	moveDir : 2,
	isDesiredMap : (map)=>{
		return (map == '布拉基姆高地');
	}
},
{
	//诅咒1层怪等级16-22
	//诅咒2层怪等级21-26
	//诅咒3层怪等级24-30
	//诅咒4层怪等级29-34
	//诅咒5层怪等级31-36
	//诅咒6层怪等级35-41
	//诅咒7层怪等级39-45
	//诅咒7层怪等级43-49
	name : '诅咒',
	walkTo : (cb)=>{
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
				[17, 53, '法兰城'],
				[22, 88, '芙蕾雅'],
				[262, 147],
			], ()=>{
				getMazeEntrance((obj)=>{
					cga.walkList([
						[obj.mapx, obj.mapy, '诅咒之迷宫地下1楼']
					], cb);
				})
			});
		});
	},
	moveDir : 2,
	isDesiredMap : (map)=>{
		return (map == '诅咒之迷宫地下1楼');
	}
},
{

	name : '回廊',
	walkTo : (cb)=>{
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
				[52, 72]
				], ()=>{
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					setTimeout(cb, 1000);
					// cga.TurnTo(54, 72);
					// cga.AsyncWaitNPCDialog(()=>{
					// 	cga.ClickNPCDialog(32, 0);
					// 	cga.AsyncWaitNPCDialog(()=>{
					// 		cga.ClickNPCDialog(4, 0);
					// 		cga.AsyncWaitNPCDialog(()=>{
					// 			cga.ClickNPCDialog(4, 0);
					// 			cga.AsyncWaitMovement({map:'过去与现在的回廊', delay:1000, timeout:5000}, cb);
					// 		});
					// 	});
					// });
				});	
		});
	},
	moveDir : 2,
	isDesiredMap : (map)=>{
		return (map == '过去与现在的回廊');
	}
},

]

var moveThink = (arg)=>{

	if(moveThinkInterrupt.hasInterrupt())
		return false;

	if(arg == 'freqMoveMapChanged')
	{
		playerThinkInterrupt.requestInterrupt();
		return false;
	}

	return true;
}

var playerThink = ()=>{

	if(!cga.isInNormalState())
		return true;
	
	var playerinfo = cga.GetPlayerInfo();
	var items = cga.GetItemsInfo();
	var ctx = {
		playerinfo : playerinfo,
		petinfo : playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
		teamplayers : cga.getTeamPlayers(),
		dangerlevel : thisobj.getDangerLevel(),
		inventory : items.filter((item)=>{
			return item.pos >= 8 && item.pos < 100;
		}),
		equipment : items.filter((item)=>{
			return item.pos >= 0 && item.pos < 8;
		}),
		result : null,
	}

	teamMode.think(ctx);

	global.callSubPlugins('think', ctx);

	if(cga.isTeamLeaderEx()){
		// console.log('ctx.result1 = ' + ctx.result)
		// console.log('playerThinkInterrupt.hasInterrupt() = ' + playerThinkInterrupt.hasInterrupt())
		var interruptFromMoveThink = false;
		
		if(ctx.result == null && playerThinkInterrupt.hasInterrupt()){
			ctx.result = 'supply';
			interruptFromMoveThink = true;
		}

		var supplyObject = null;
		// console.log('ctx.result2 = ' + ctx.result)
		if(ctx.result == 'supply'){
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			supplyObject = getSupplyObject(map, mapindex);
			if(supplyObject && supplyObject.isLogBack(map, mapindex))
				ctx.result = 'logback';
		}
		// console.log('ctx.result3 = ' + ctx.result)
		if( ctx.result == 'supply' && supplyObject){
			if(interruptFromMoveThink){
				supplyObject.func(loop);
				return false;
			}
			else{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						supplyObject.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}else if( ctx.result == 'logback' || ctx.result == 'logback_forced' ){
			if(interruptFromMoveThink){
				console.log('logback..interruptFromMoveThink')
				logbackEx.func(loop);
				return false;
			}else{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						logbackEx.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}else if( ctx.result == 'corridor'){
			if(interruptFromMoveThink){
				console.log('interruptFromMoveThink..corridor!!!!!!')
				logbackEx.func(loop);
				return false;
			}else{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						console.log('moveThinkInterrupt.requestInterrupt...loop()')
						loop();
						return true;
					}
					return false;
				});
				return false;
			}
		}
	} else {
		if( ctx.result == 'logback_forced' )
		{	
			console.log('logback_forced!!!!!!!!!!!!!!!!!!!!')
			logbackEx.func(loop);
			return false;
		}
	}

	return true;
}

var playerThinkTimer = ()=>{
	if(playerThinkRunning){
		if(!playerThink()){
			console.log('playerThink off');
			playerThinkRunning = false;
		}
	}
	
	setTimeout(playerThinkTimer, 1500);
}

var dialogHandler = (err, dlg)=>{

	if(dlg && (dlg.options & 4) == 4)
	{
		console.log('dlg.options = ' + dlg.options)
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if(dlg && (dlg.options & 32) == 32)
	{
		console.log('dlg.options = ' + dlg.options)
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 1)
	{
		console.log('dlg.options = ' + dlg.options)
		cga.ClickNPCDialog(1, 0);
		return;
	}else if(dlg && dlg.options == 8)
	{
		console.log('dlg.options = ' + dlg.options)
		cga.ClickNPCDialog(8, 0);
		return;
	}
	else if(dlg && dlg.options == 3)
	{
		console.log('dlg.options = ' + dlg.options)
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else
	{
		return;
	}
}

var minmaxlv= (teamplayers)=>{

	if(teamplayers.length>=2){
		minlv = teamplayers[0].level
		maxlv = teamplayers[0].level
	}else{
		minlv = cga.GetPlayerInfo().playerinfo.level
		console.log('没队员，自己等级作为最小等级 : ' + minlv)
	}
	for (i = 0 ; i< teamplayers.length ; i++){
		minlv = minlv < teamplayers[i].level ? minlv : teamplayers[i].level
		maxlv = maxlv > teamplayers[i].level ? maxlv : teamplayers[i].level
	}
	console.log('队员最低等级 : ' + minlv)
	console.log('队员最高等级 : ' + maxlv)
	return
}
var getMazeEntrance = (cb)=>{
	console.log('正在下载地图')
	cga.downloadMap(()=>{
		console.log('地图已下载完成')
		
		var objs = cga.getMapObjects();
		var entrance = objs.find((obj)=>{
			return (obj.cell == 3 && obj.mapx >= 260 && obj.mapx <= 273 && obj.mapy >= 133 && obj.mapy <= 164)
		})
		
		if(entrance == undefined){
			console.log('迷宫入口未找到,等待15秒后重试')
			setTimeout(getMazeEntrance, 15000, cb);
			return;
		}
		
		cb(entrance);
	});
}
var newborn = (cb)=>{
	cga.walkList([
		[4, 10],
	], ()=>{
		cga.TurnTo(4, 9);
		cga.AsyncWaitNPCDialog(()=>{
			cga.ClickNPCDialog(32, -1);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, -1);
					setTimeout(cb, 2000);
				});
			});
		});
	});
}

var chooseArea = (cb)=>{
	var teamplayers = cga.getTeamPlayers();
		console.log('thisobj.battleArea.name = ' + thisobj.battleArea.name)
		if(teamplayers.length >1){
			if(thisobj.battleArea.name =='全自动练级'){
				minmaxlv(teamplayers)
				// 低地鸡
				if(minlv < 10){
					thisobj.battleArea = battleAreaArray[1];
				}
				// 诅咒1层怪等级16-22
				else if(minlv >=10 && minlv < 27){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 1
					// 没有大号带就打刀鸡
					if(maxlv <= nannylv)
					thisobj.battleArea = battleAreaArray[2];
				}
				//诅咒4层怪等级29-34
				else if(minlv >=27 && minlv < 31){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 4
					// 没有大号带就打龙骨
					if(maxlv <= nannylv)
					thisobj.battleArea = battleAreaArray[3];
				}//诅咒5层怪等级31-36
				else if(minlv >=31 && minlv < 36){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 5
					// 没有大号带就打黄金龙骨
					if(maxlv <= nannylv){
						thisobj.battleArea = battleAreaArray[4];
						global.battleAreaName = battleAreaArray[4].name
					}

				}//诅咒6层怪等级35-41
				else if(minlv >=36 && minlv < 40){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 6
					// 没有大号带就打黄金龙骨
					if(maxlv <= nannylv)
					thisobj.battleArea = battleAreaArray[4];
				}//诅咒7层怪等级39-45
				else if(minlv >=40 && minlv < 44){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 7
					// 没有大号带就打银狮
					if(maxlv <= nannylv){
						thisobj.battleArea = battleAreaArray[5];
						global.battleAreaName = battleAreaArray[5].name
					}
				}//诅咒8层怪等级43-49
				else if(minlv >=44 && minlv < 50){
					thisobj.battleArea = battleAreaArray[6];
					thisobj.layerLevel = 8
					// 没有大号带就打银狮
					if(maxlv <= nannylv)
					thisobj.battleArea = battleAreaArray[5];
				}//回廊
				else if(minlv >=50 && minlv < 65){
					thisobj.battleArea = battleAreaArray[7];
				}
				else{
					console.log('超过65级了，需要去营地了')
					var wait = ()=>{
						while(true){
							continue
						}
					}
					wait()
				}
				console.log('根据当前队员最小等级推断练级地点：' + thisobj.battleArea.name)
			}else{
				console.log('当前练级使用指定的地点：' + thisobj.battleArea.name)
			}

		}
}
var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var isleader = cga.isTeamLeaderEx();

	console.log('loop...................')
	// 队长满员发车
	if(isleader && teamMode.is_enough_teammates())
	{
		// 组成队伍后，各队员思考本次练级地点
		chooseArea()
		//如果到达了battleArray的脚本地点
		if(thisobj.battleArea.isDesiredMap(map))
		{	//诅咒逻辑
			if(map == '诅咒之迷宫地下1楼')
			{
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
				
				walkMazeForward((r)=>{
					if(r != true){
						loop();
						return;
					}
					var xy = cga.GetMapXY();
					var dir = cga.getRandomSpaceDir(xy.x, xy.y);
					cga.freqMove(dir);
				});
				return;
			}else{//练级逻辑
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
				
				cga.freqMove(thisobj.battleArea.moveDir);
			}
			return;
		}
		// 没到达battleArray的脚本地点
		else
		{
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			
			thisobj.battleArea.walkTo(loop);
			// 走到指定练级地点，进入playerThink on阶段之后，重置练级地点思考模式，用于更新下一次的练级地点。
			thisobj.battleArea = battleAreaArray[0];
			return;
		}
	} else if(!isleader){
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;
		// 进入playerThink on阶段之后，重置练级地点思考模式，用于更新下一次的练级地点。
		thisobj.battleArea = battleAreaArray[0];
		return;
	}

	//高地卖石，防止包满无法购买桥头武器
	if(cga.getSellStoneItem().length > 0)
	{
		var sellObject = getSellObject(map, mapindex);
		if(sellObject)
		{
			sellObject.func(loop);
			return;
		}
	}

	if(cga.needSupplyInitial())
	{
		var sup = getSupplyObject(map, mapindex);
		if(sup)
		{
			sup.func(loop);
			return;
		}
	}

	callSubPluginsAsync('prepare', ()=>{
		var mapindex = cga.GetMapIndex().index3
		// 判断是不是刚出生的人物
		if(cga.GetPlayerInfo().level == 1 && mapindex >= 1530 && mapindex < 1550){
			console.log('人物在召唤之间')
			var pos = cga.GetMapXY();
			if(pos.x == 15 && pos.y == 6){
				newborn(loop)
			}else if (pos.x == 4 && pos.y == 10){
				cga.LogBack();
				setTimeout(loop, 2000);
			}
		}else if(cga.GetPlayerInfo().level == 1 && mapindex == 1000){
			var stay = ()=>{
				cga.walkList([
				[141, 105]
				], ()=>{
					cga.turnTo(142, 105);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, -1);
						setTimeout(loop, 2000);
					});
				});
			};
			cga.travel.falan.toCity('艾尔莎岛', stay);
		}else{//如果不是刚出生小号，走正常练级逻辑
			// console.log('正常练级模式')
			// 回廊
			if(cga.GetMapIndex().index3 == 1500 && cga.GetMapXY().x > 43 && cga.GetMapXY().y <80){
				cga.walkList([
					[52, 72]
					], ()=>{
						cga.TurnTo(54, 72);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({map:'过去与现在的回廊', delay:1000, timeout:5000}, ()=>{
										cga.walkList([
											cga.isTeamLeader ? [11, 20] : [10, 20],
											], ()=>{
												teamMode.wait_for_teammates(loop);
											});
									});
									return true
								});
							});
						});
					});	
			}
			else{// 1-50 高地+诅咒
				cga.travel.newisland.toStone('X', ()=>{
					cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
					], ()=>{
						teamMode.wait_for_teammates(loop);
					});
				});
			}
		}
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();

		if(map == '盖雷布伦森林' )
			return 1;

		if(map == '布拉基姆高地' )
			return 2;
		if(map.indexOf('诅咒')>=0){
			return 2;
		}
		if(map.indexOf('回廊')>=0){
			return 2;
		}
		return 0;
	},
	translate : (pair)=>{
		
		if(pair.field == 'battleArea'){
			pair.field = '练级地点';
			pair.value = battleAreaArray[pair.value].name;
			pair.translated = true;
			return true;
		}
		
		if(supplyMode.translate(pair))
			return true;
		
		if(teamMode.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{

		if(!supplyMode.loadconfig(obj))
			return false;

		if(!teamMode.loadconfig(obj))
			return false;
		
		for(var i in battleAreaArray){
			if(i == obj.battleArea){
				configTable.battleArea = i;
				thisobj.battleArea = battleAreaArray[i];
				break;
			}
		}
		
		if(!thisobj.battleArea){
			console.error('读取配置：练级地点失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([supplyMode.inputcb, teamMode.inputcb, (cb2)=>{
			
			var sayString = '【自动1-50插件】请选择练级地点:';
			for(var i in battleAreaArray){
				if(i != 0)
					sayString += ', ';
				sayString += '('+ (parseInt(i)+1) + ')' + battleAreaArray[i].name;
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && battleAreaArray[index - 1]){
					configTable.battleArea = index - 1;
					thisobj.battleArea = battleAreaArray[index - 1];
					
					var sayString2 = '当前已选择:[' + thisobj.battleArea.name + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}], cb);
	},
	execute : ()=>{
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		loop();
	},
}

module.exports = thisobj;