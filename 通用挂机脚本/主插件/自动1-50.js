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
	name : '诅咒',
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
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[17, 53, '法兰城'],
					[22, 88, '芙蕾雅'],
					[265, 155],
				], ()=>{
					getMazeEntrance((obj)=>{
						cga.walkList([
							[obj.mapx, obj.mapy, '诅咒之迷宫地下1楼']
						], loop);
					})
				});
			});
		}
	},
	moveDir : 2,
	isDesiredMap : (map)=>{
		return (map == '诅咒之迷宫地下1楼');
	}
},
{
	//本dict仅name有用，walkTo请无视
	name : '全自动识别最低级号',
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

	if(cga.isTeamLeaderEx())
	{
		var interruptFromMoveThink = false;
		
		if(ctx.result == null && playerThinkInterrupt.hasInterrupt())
		{
			ctx.result = 'supply';
			interruptFromMoveThink = true;
		}

		var supplyObject = null;

		if(ctx.result == 'supply')
		{
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			supplyObject = getSupplyObject(map, mapindex);
			if(supplyObject && supplyObject.isLogBack(map, mapindex))
				ctx.result = 'logback';
		}
		
		if( ctx.result == 'supply' && supplyObject)
		{
			if(interruptFromMoveThink)
			{
				supplyObject.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						supplyObject.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}
		else if( ctx.result == 'logback' || ctx.result == 'logback_forced' )
		{
			if(interruptFromMoveThink)
			{
				logbackEx.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						logbackEx.func(loop);
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
var minteammateslv= (teamplayers)=>{
	var minlv = null
	if(teamplayers.length>=2){
		minlv = teamplayers[0].level
	}else{
		minlv = playerinfo.level
	}
	for (i = 0 ; i< teamplayers.length ; i++){
		minlv = minlv < teamplayers[i].level ? minlv : teamplayers[i].level
	}
	// console.log('队伍最低等级 : ' + minlv)
	return minlv
}
var getMazeEntrance = (cb)=>{
	console.log('正在下载地图')
	cga.downloadMapEx(260, 260+24, 133, 133+24*2, ()=>{
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
var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var isleader = cga.isTeamLeaderEx();

	// 诅咒迷宫层数
	var curselayer = 1
	
	if(isleader && teamMode.is_enough_teammates())
	{
		var teamplayers = cga.getTeamPlayers();
		console.log('thisobj.battleArea.name = ' + thisobj.battleArea.name)
		if(teamplayers.length >1){
			if(thisobj.battleArea.name =='全自动识别最低级号'){
				min = minteammateslv(teamplayers)
				if(min < 10){
					thisobj.battleArea = battleAreaArray[0];
				}else if(min >=10 && min < 28){
					thisobj.battleArea = battleAreaArray[1];
				}else if(min >=28 && min < 32){
					thisobj.battleArea = battleAreaArray[2];
				}else if(min >=32 && min < 38){
					thisobj.battleArea = battleAreaArray[3];
				}else if(min >=38 && min < 50){
					//battleAreaArray，4是银狮，5是诅咒，暂时改为4，因为一个弓箭手带不了4个小号诅咒练级
					thisobj.battleArea = battleAreaArray[4];
					thisobj.layerLevel = 8
				}else{
					throw new error('超过50级了，再练刷不了吉拉（52级最高）了')
				}
				console.log('根据当前队员最小等级推断练级地点：' + thisobj.battleArea.name)
			}else{
				console.log('当前练级使用指定的地点：' + thisobj.battleArea.name)
			}

		}
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
			}else{//高地逻辑
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
			return;
		}
	} else if(!isleader){
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;
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
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
			cga.isTeamLeader ? [144, 106] : [143, 106],
			], ()=>{
				teamMode.wait_for_teammates(loop);
			});
		});
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();

		if(map == '盖雷布伦森林' )
			return 1;

		if(map == '布拉基姆高地' )
			return 2;
		
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
			
			var sayString = '【高地插件】请选择练级地点:';
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