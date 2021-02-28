var Async = require('async');
var supplyKengiro = require('../公共模块/肯吉罗岛回补');
var sellKengiro = require('../公共模块/肯吉罗岛卖石');
var sellCastle = require('../公共模块/里堡卖石');
var teamMode = require('../公共模块/组队模式');
var logbackEx = require('../公共模块/登出防卡住');

var cga = global.cga;
var configTable = global.configTable;
var sellStoreArray = ['不卖石', '卖石'];

var interrupt = require('../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var area = null

var cachedEntrance = null;
var blacklistEntrance = [];

// 队伍最低和最高等级
var minlevel = null
var maxlevel = null

// 遇敌最高等级，用于判定最优练级层数
var enemymaxlv = 0
// 输出开关，如果本次战斗曾输出过最高等级，则为true。防止log过多
var hasoutputmaxlvflag = false

// 注意回补模块顺序，先从泛用性低的开始放入数组
// 比如在矮人城镇练级，判断当前地图是肯吉罗岛之后，回补模块会直接根据（肯吉罗岛）返回去营地回补了，这是不对的。所以要先放矮人回补在前
// 整合了营地和矮人回补方式，变为一个模块
var supplyArray = [supplyKengiro];

var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}

// 和supply模块一样，先把泛用性低的模块放在前，以免被高泛用性的模块给短路替代了。
var sellArray = [sellKengiro, sellCastle];

var getSellObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return sellArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}

var battleAreaArray = [
{
	name : '地洞',
	range : [450, 600, 200, 320],
},
{
	name : '水洞',
	range : [300, 400, 500, 550],
},
{
	name : '火洞',
	range : [400, 450, 400, 450],
},
{
	name : '风洞',
	range : [300, 450, 150, 300],
}
]

// var lowArea = ['低地鸡','刀鸡','诅咒']
var dwarfArea = ['蝎子','石头人']
var KengiroArea = ['营地','地洞','蜥蜴','黑龙']

var battleAreaName = ['隐秘之洞','蜥蜴洞穴','黑龙沼泽']
var regionName = ['隐秘之洞地下','蜥蜴洞穴上层第','黑龙沼泽']
var floorName = ['层','区']

var walkMazeForward = (cb)=>{
	var map = cga.GetMapName();
	if(map == '隐秘之洞地下'+(thisobj.layerLevel)+'层'){
		cb(true);
		return;
	}
	if(map == '肯吉罗岛'){
		cb(false);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('隐秘之洞地下') >= 0)
		{
			cb(true);
			return;
		}
		walkMazeForward(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return '隐秘之洞地下'+(layerIndex + 1)+'层';
		},
		entryTileFilter : (e)=>{
			return e.colraw == 0x2EE2;
		}
	});
}

var walkMazeBack = (cb)=>{
	var map = cga.GetMapName();
	if(map == '肯吉罗岛'){
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		walkMazeBack(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return layerIndex > 1 ? ('隐秘之洞地下'+(layerIndex - 1)+'层') : '肯吉罗岛';
		},
		entryTileFilter : (e)=>{
			return (cga.GetMapName() == '隐秘之洞地下1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0);
		}
	});
}

var minmaxlv= (teamplayers)=>{

	if(teamplayers.length>=2){
		minlevel = teamplayers[0].level
		maxlevel = teamplayers[0].level
	}else{
		minlevel = playerinfo.level
	}
	for (i = 0 ; i< teamplayers.length ; i++){
		minlevel = minlevel < teamplayers[i].level ? minlevel : teamplayers[i].level
		maxlevel = maxlevel > teamplayers[i].level ? maxlevel : teamplayers[i].level
	}
	console.log('队员最低等级 : ' + minlevel)
	console.log('队员最高等级 : ' + maxlevel)
	return
}


var choosearea = ()=>{
	var teamplayers = cga.getTeamPlayers();
	minmaxlv(teamplayers)

	// 营地门口
	if(minlevel <= 69 ){
		area = '营地'
		global.battleAreaName = area
	}// 矮人城镇外（蝎子）
	else if(minlevel > 69 && minlevel <= 80){
		area = '蝎子'
		global.battleAreaName = area
	}// 矮人城镇内（石头人）
	else if(minlevel > 80 && minlevel <= 90){
		area = '石头人'
		global.battleAreaName = area
	}
	// 隐秘之洞（地）
	// TODO 隐秘之洞刷碎片
	// else if(minlevel >=29 && minlevel < 31){
	// 	thisobj.battleArea = battleAreaArray[5];
	// 	thisobj.layerLevel = 4
	// }

	// 蜥蜴
	else if(minlevel > 90 && minlevel <= 105){
		area = '蜥蜴'
		global.battleAreaName = area
	}// 黑龙
	else if(minlevel > 105 && minlevel <= 140){
		area = '黑龙'
		global.battleAreaName = area
		// TODO 黑龙分层练级
		if(minlevel > 108 && minlevel <=111){
			thisobj.layerLevel = 2
		}else if(minlevel > 111 && minlevel <=113){
			thisobj.layerLevel = 3
		}else if(minlevel > 113 && minlevel <=115){
			thisobj.layerLevel = 4
		}else if(minlevel > 115 && minlevel <=117){
			thisobj.layerLevel = 5
		}else if(minlevel > 117 && minlevel <=119){
			thisobj.layerLevel = 6
		}else if(minlevel > 119 && minlevel <=121){
			thisobj.layerLevel = 7
		}else if(minlevel > 121 && minlevel <=126){
			thisobj.layerLevel = 8
		}else if(minlevel > 126 && minlevel <=130){
			thisobj.layerLevel = 9
		}else if(minlevel > 130 && minlevel <=140){
			thisobj.layerLevel = 10
		}else{
			thisobj.layerLevel = 1
		}
	}
	// 打印练级场所及层数
	if(thisobj.layerLevel > 1){
		console.log('去【' + area +'】【' + thisobj.layerLevel + '】层练级')
	}else{
		console.log('去【' + area + '】练级')
	}
}

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
	// console.log("ctx.result = " + ctx.result)
	// console.log("ctx.reason = " + ctx.reason)
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
				walkMazeBack(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						walkMazeBack(loop);
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
	// playerThink 的时候，判断遇到的最高等级敌人。
	if(!hasoutputmaxlvflag && cga.isInBattle()){
		var battleUnits = cga.GetBattleUnits()
		for(var i in battleUnits){
			if (battleUnits[i].pos >9 && enemymaxlv < battleUnits[i].level){
				enemymaxlv = battleUnits[i].level
				console.log('当前遇到最高级别怪为：【'+enemymaxlv+'】级')
				hasoutputmaxlvflag = true
			}
		}
	}else{// 没有遇敌则重置
		hasoutputmaxlvflag = false
	}

	setTimeout(playerThinkTimer, 1500);
}

var getMazeEntrance = (cb)=>{
		
	if(cachedEntrance)
	{
		cga.downloadMapEx(cachedEntrance.mapx - 12, cachedEntrance.mapy - 12, cachedEntrance.mapx + 12, cachedEntrance.mapy + 12, ()=>{
			var objs = cga.getMapObjects();
			var entrance = objs.find((obj)=>{
				return (obj.cell == 3 && obj.mapx == cachedEntrance.mapx && obj.mapy == cachedEntrance.mapy)
			})
			
			if(entrance == undefined){
				cachedEntrance = null;
				console.log('缓存的迷宫入口失效,重新寻找入口')
				getMazeEntrance(cb);
				return;
			}
			
			cb(entrance);
		});
		return;
	}
	
	console.log('正在下载地图')
	cga.downloadMapEx(
	thisobj.battleArea.range[0],
	thisobj.battleArea.range[1], 
	thisobj.battleArea.range[2], 
	thisobj.battleArea.range[3], ()=>{
		console.log('地图已下载完成')
		
		var objs = cga.getMapObjects();
		console.log(objs.filter((o)=>{
			return o.cell == 3;
		}))
		var entrance = objs.find((obj)=>{

			return (obj.cell == 3 && 
			obj.mapx >= thisobj.battleArea.range[0] &&
			obj.mapx <= thisobj.battleArea.range[1] && 
			obj.mapy >= thisobj.battleArea.range[2] && 
			obj.mapy <= thisobj.battleArea.range[3] && 
			( !blacklistEntrance.length || (blacklistEntrance.length && blacklistEntrance.find((b)=>{
				return b.mapx == obj.mapx && b.mapy == obj.mapy;
			}) == undefined) )
			);
		})
		
		if(entrance == undefined){
			console.log('迷宫入口未找到,等待15秒后重试')
			setTimeout(getMazeEntrance, 15000, cb);
			return;
		}
		
		cachedEntrance = entrance;
		cb(entrance);
	});
}

// TODO
var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var mapXY = cga.GetMapXY();

	var isleader = cga.isTeamLeaderEx();
	
	if(isleader && teamMode.is_enough_teammates()){

		// 判断练级地点
		choosearea()

		// 矮人城镇逻辑
		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域'){
			cga.walkList([
				[231, 434, '矮人城镇'],
			], loop);
			return;
		}
		// TODO 需要添加石头人逻辑
		if(map == '矮人城镇'){
			var go = ()=>{
				callSubPluginsAsync('prepare', ()=>{
					if(cga.GetMapName() != '矮人城镇'){
						loop();
						return;
					}
					playerThinkInterrupt.hasInterrupt();//restore interrupt state
					console.log('playerThink on');
					playerThinkRunning = true;
					cga.walkList([
						[110, 191, '肯吉罗岛'],
						[233, 439],
					], ()=>{
						cga.freqMove(0);
					});
				});
			}
			
			supplyKengiro.func(()=>{
				if(thisobj.sellStore == 1){
					var sellObject = getSellObject(map, mapindex);
					if(sellObject)
					{
						sellObject.func(go);
						return;
					}
				}
				go();
			});
			return;
		}
		// 营地逻辑
		if(map == '医院' && mapindex == 44692){
			if(thisobj.sellStore == 1){
				var sellObject = getSellObject(map, mapindex);
				if(sellObject)
				{
					sellObject.func(loop);
					return;
				}
			}
		} 
		if(map == '工房' && mapindex == 44693){
			cga.walkList([
			[30, 37, '圣骑士营地']
			], loop);
			return;
		}
		if(map == '肯吉罗岛'){
			getSupplyObject().func(loop);
			return;
		}
		if(map == '圣骑士营地'){
			callSubPluginsAsync('prepare', ()=>{
				if(cga.GetMapName() != '圣骑士营地'){
					loop();
					return;
				}
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
				console.log('area = ' + area)
				cga.walkList([
					[36, 87, '肯吉罗岛'],
				], ()=>{
					if(area == '营地'){
						cga.walkList([
							[548, 332],
						], ()=>{
							cga.freqMove(0);
						});
					}else if(area == '五转碎片'){
						getMazeEntrance((obj)=>{
							cga.walkList([
								[obj.mapx, obj.mapy, '隐秘之洞地下1层']
							], (err)=>{
								console.log(err);
								if(err && err.message == 'Unexcepted map changed.'){
									var xy = cga.GetMapXY();
									cachedEntrance = null;
									blacklistEntrance.push(obj);
									cga.walkList([
									[xy.x, xy.y, '肯吉罗岛'],
									], loop);
									return;
								}
								loop();
							});
						})
					}
					// 矮人城镇域练级
					else if(dwarfArea.indexOf(area) != -1){
						console.log('出发去矮人城镇')
						cga.walkList([
							[384, 245, '蜥蜴洞穴'],
							[12, 2, '肯吉罗岛'],
							[231, 434, '矮人城镇'],
						], loop);
					}
					else if(area == '蜥蜴'){
						cga.walkList([
							[384, 245, '蜥蜴洞穴'],
							[17, 4, '蜥蜴洞穴上层第1层'],
						], loop);
					}
					else if(area == '黑龙'){
						cga.walkList([
							[424, 345, '黑龙沼泽1区'],
						], loop);
					}
				});
			});
			return;
		}
		if(map == '隐秘之洞地下1层')
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
		}
		if(map == '蜥蜴洞穴上层第1层')
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
		}
		if(map == '黑龙沼泽1区')
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
		}
	} else if(!isleader){
		// 五转碎片不加hasInterrupt，原因未知，如果有问题，请注释
		playerThinkInterrupt.hasInterrupt();//restore interrupt state

		console.log('playerThink on');
		playerThinkRunning = true;
		return;
	}
	
	if(thisobj.sellStore == 1 && cga.getSellStoneItem().length > 0)
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
		var supplyObject = getSupplyObject(map, mapindex);
		if(supplyObject)
		{
			supplyObject.func(loop);
			return;
		}
	}

	callSubPluginsAsync('prepare', ()=>{
		cga.travel.falan.toCamp(()=>{
			cga.walkList([
			cga.isTeamLeader ? [96, 86] : [97, 86],
			], ()=>{
				teamMode.wait_for_teammates(loop
					
				// 	()=>{
				// 	// 判断练级地点
				// 	choosearea()

				// 	// 矮人城镇域练级
				// 	if(dwarfArea.indexOf(area) != -1){
				// 		console.log('出发去矮人城镇')
				// 		cga.walkList([
				// 			[36, 87, '肯吉罗岛'],
				// 			[384, 245, '蜥蜴洞穴'],
				// 			[12, 2, '肯吉罗岛'],
				// 			[231, 434, '矮人城镇'],
				// 		], loop);
				// 	}// 营地域练级
				// 	else if(KengiroArea.indexOf(area) != -1){
				// 		loop()
				// 	}// TODO 前50级练级
				// 	else{
				// 		loop()
				// 	}

				// }
				);
			});
		});
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();
		var dangerlevel = 0;

		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域'){
			dangerlevel = 2;
			return dangerlevel;
		}
		// TODO 矮人城镇石头人区域
		// if(mapXY){}

		if(map == '肯吉罗岛' || map == '蜥蜴洞穴' )
			return 1;
		if(map.indexOf('隐秘之洞地下') >= 0)
			return 2;
		if(map.indexOf('蜥蜴洞穴上层') >= 0)
			return 2;
		if(map.indexOf('黑龙沼泽') >= 0)
			return 2;
		return 0;
	},
	translate : (pair)=>{
		
		if(pair.field == 'sellStore'){
			pair.field = '是否卖石';
			pair.value = pair.value == 1 ? '卖石' : '不卖石';
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'layerLevel'){
			pair.field = '练级层数';
			pair.value = pair.value + '层';
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'battleArea'){
			pair.field = '练级地点';
			pair.value = battleAreaArray[pair.value];
			pair.translated = true;
			return true;
		}

		if(supplyKengiro.translate(pair))
			return true;

		if(teamMode.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{

		if(!supplyKengiro.loadconfig(obj))
			return false;
		
		if(!teamMode.loadconfig(obj))
			return false;
		
		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore
		
		if(thisobj.sellStore == undefined){
			console.error('读取配置：是否卖石失败！');
			return false;
		}
		
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
		
		configTable.layerLevel = obj.layerLevel;
		thisobj.layerLevel = obj.layerLevel
		
		if(!thisobj.layerLevel){
			console.error('读取配置：练级层数失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([supplyKengiro.inputcb, teamMode.inputcb, (cb2)=>{
			var sayString = '【全自动肯吉罗岛练级插件】请选择是否卖石: 0不卖石 1卖石';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val <= 1){
					configTable.sellStore = val;
					thisobj.sellStore = val;
					
					var sayString2 = '当前已选择:'+sellStoreArray[thisobj.sellStore]+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}, (cb2)=>{
			
			var sayString = '【全自动肯吉罗岛练级插件】请选择练级地点:';
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
		}, (cb2)=>{
			var sayString = '【全自动肯吉罗岛练级插件】请选择练级层数(1~100):';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 1 && val <= 100){
					configTable.layerLevel = val;
					thisobj.layerLevel = val;
					
					var sayString2 = '当前已选择:'+thisobj.layerLevel+'层练级。';
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
};

module.exports = thisobj;