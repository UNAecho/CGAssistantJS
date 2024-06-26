var fs = require('fs');
var Async = require('async');
var supplyKengiro = require('../公共模块/肯吉罗岛回补');
var supplyCastle = require('./../公共模块/里堡回补');
var sellKengiro = require('../公共模块/肯吉罗岛卖石');
var sellCastle = require('../公共模块/里堡卖石');
var teamMode = require('../公共模块/组队模式');

var cga = global.cga;
var configTable = global.configTable;
var logbackEx = require('../公共模块/登出防卡住');

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)

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
// 比如在矮人城镇练级，判断当前地图是肯吉罗岛之后，回补模块会直接根据（肯吉罗岛）返回去营地回补了，这是不对的。所以要先放矮人回补在前将后面回补方式短路
// supplyArray中，如果前面的回补方式isAvailable()返回false的话，就找下一个回补模块
var supplyArray = [supplyKengiro,supplyCastle];

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
var KengiroArea = ['营地','沙滩','地洞','蜥蜴','黑龙']

var battleAreaName = ['隐秘之洞','蜥蜴洞穴','黑龙沼泽']
var regionName = ['隐秘之洞地下','蜥蜴洞穴上层第','黑龙沼泽']
var floorName = ['层','区']

var dialogHandler = (err, dlg)=>{
	if(dlg && (dlg.options & 4) == 4)
	{
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if(dlg && (dlg.options & 32) == 32)
	{
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 1)
	{	
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 3)
	{
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 12)
	{
		cga.ClickNPCDialog(4, -1);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	return
}

var talkNpcSayYesToChangeMap = (cb,npcPosArr,type)=>{
	var wait = (cb)=>{
		cga.waitForLocation({moving : true , pos : npcPosArr ,leaveteam : true}, ()=>{
			var originIndex = cga.GetMapIndex().index3
			var originalPos = cga.GetMapXY();
	
			var retry=()=>{
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.TurnTo(npcPosArr[0], npcPosArr[1]);
				if(type == 'index' && cga.GetMapIndex().index3 != originIndex){
					console.log('index发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.x != originalPos.x){
					console.log('x发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.y != originalPos.y){
					console.log('y发生变化，切换地图成功')
					cb(true)
					return
				}
				setTimeout(retry, 5000);
				return
			}
	
			setTimeout(retry, 1000);
		});
	}

    if(cga.isTeamLeader){
		var posArr = cga.get2RandomSpace(npcPosArr[0],npcPosArr[1])
		cga.walkList([
			posArr[0],
			posArr[1],
			posArr[0],
			posArr[1],
			posArr[0],
		], ()=>{
			setTimeout(() => {
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				wait(cb)
			}, 2000);
		});
    }else{
		wait(cb)
    }
	return
}

var walkMazeForward = (cb)=>{
	var map = cga.GetMapName();
	if(map == '隐秘之洞地下'+(thisobj.layerLevel)+'层'){
		cb(true);
		return;
	}
	if(map == '蜥蜴洞穴'){
		cb(false);
		return;
	}
	if(map == '蜥蜴洞穴上层第'+(thisobj.layerLevel)+'层'){
		cb(true);
		return;
	}
	if(map == '黑龙沼泽'+(thisobj.layerLevel)+'区'){
		cb(true);
		return;
	}
	if(map == '迷宫入口'){
		cb(false);
		return;
	}
	if(map == '旧日迷宫第'+(thisobj.layerLevel)+'层'){
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('隐秘之洞地下') >= 0)
		{
			cb(true);
			return;
		}
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('蜥蜴洞穴上层') >= 0)
		{
			cb(true);
			return;
		}
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('黑龙沼泽') >= 0)
		{
			cb(true);
			return;
		}
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('旧日迷宫第') >= 0)
		{
			cb(true);
			return;
		}
		walkMazeForward(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return ('隐秘之洞地下'+(layerIndex + 1)+'层') || ('蜥蜴洞穴上层第'+(layerIndex + 1)+'层') || ('黑龙沼泽'+(layerIndex + 1)+'区');
		},
		entryTileFilter : (e)=>{//TODO 整合所有的练级场所的上下楼梯
			return e.colraw == 0x2EE2;
		}
	});
}

var walkMazeBack = (cb)=>{
	var map = cga.GetMapName();
	if(map == '迷宫入口'){
		cb(true);
		return;
	}
		if(map == '蜥蜴洞穴'){
		cb(true);
		return;
	}
	if(map == '肯吉罗岛'){
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		walkMazeBack(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return (layerIndex > 1 ? ('隐秘之洞地下'+(layerIndex - 1)+'层') : '肯吉罗岛') || (layerIndex > 1 ? ('蜥蜴洞穴上层第'+(layerIndex - 1)+'层') : '蜥蜴洞穴') || (layerIndex > 1 ? ('黑龙沼泽'+(layerIndex - 1)+'区') : '肯吉罗岛') || (layerIndex > 1 ? ('旧日迷宫第'+(layerIndex - 1)+'层') : '迷宫入口');
		},
		entryTileFilter : (e)=>{//TODO 整合所有的练级场所的上下楼梯
			return ((cga.GetMapName() == '隐秘之洞地下1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0)) || ((cga.GetMapName() == '蜥蜴洞穴上层第1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0)) || ((cga.GetMapName() == '黑龙沼泽1区') ? (e.colraw == 0) : (e.colraw == 0x2EE0));
		}
	});
}

var loadBattleConfig = ()=>{

	var settingpath = cga.getrootdir() + '\\战斗配置\\'
	// 因为传教士可能还有正在刷声望的小号，这样可以区分是保姆还是小号
	if (professionalInfo.name == '传教士'){
		if(!cga.ismaxbattletitle()){
			settingpath = settingpath + '营地组队普攻刷声望.json'
		}else{
			var healSingle = cga.findPlayerSkill('补血魔法')
			var healStrong = cga.findPlayerSkill('强力补血魔法')
			var healUltra = cga.findPlayerSkill('超强补血魔法')
			if(healSingle && healSingle.lv != healSingle.maxlv){
				settingpath = settingpath + '传教练级烧单补.json'
			}else if(healStrong && healStrong.lv != healStrong.maxlv){
				settingpath = settingpath + '传教练级烧强补.json'
			}else if(healUltra && healUltra.lv != healUltra.maxlv){
				settingpath = settingpath + '传教练级烧超补.json'
			}else{
				settingpath = settingpath + '传教练级.json'
			}
		}
	}else if(professionalInfo.name == '格斗士'){
		var chaos = cga.findPlayerSkill('混乱攻击')
		if (chaos && chaos.lv != chaos.maxlv){
			settingpath = settingpath + '格斗练级烧混乱攻击.json'
		}else{
			settingpath = settingpath + '格斗练级.json'
		}
	}else if(professionalInfo.name == '弓箭手'){
		settingpath = settingpath + '弓箭练级.json'
	}else if(professionalInfo.name == '剑士'){
		settingpath = settingpath + '剑士练级.json'
	}else if(professionalInfo.name == '战斧斗士'){
		settingpath = settingpath + '战斧练级.json'
	}else if(professionalInfo.name == '魔术师'){
		settingpath = settingpath + '法师练级.json'
	}else if(professionalInfo.name == '巫师'){
		settingpath = settingpath + '巫师练级.json'
	}else if(professionalInfo.name == '封印师'){
		settingpath = settingpath + '封印师练级.json'
	}else{
		settingpath = settingpath + '营地组队普攻刷声望.json'
	}

	var setting = JSON.parse(fs.readFileSync(settingpath))

	cga.gui.LoadSettings(setting, (err, result)=>{
		if(err){
			console.log(err);
			return;
		}else{
			console.log('读取战斗配置【'+settingpath+'】成功')
		}
	})
	return
}

var minmaxlv= (teamplayers)=>{

	if(teamplayers.length>=2){
		minlevel = teamplayers[0].level
		maxlevel = teamplayers[0].level
	}else{
		minlevel = cga.GetPlayerInfo().level
	}
	for (i = 0 ; i< teamplayers.length ; i++){
		minlevel = minlevel < teamplayers[i].level ? minlevel : teamplayers[i].level
		maxlevel = maxlevel > teamplayers[i].level ? maxlevel : teamplayers[i].level
	}
	console.log('队员最低等级 : ' + minlevel)
	console.log('队员最高等级 : ' + maxlevel)
	return
}

var choosearea = (cb)=>{
	var teamplayers = cga.getTeamPlayers();
	minmaxlv(teamplayers)

	// 营地门口
	if(minlevel <= 72 ){
		area = '营地'
		global.battleAreaName = area
	}// 矮人城镇外（蝎子）
	else if(minlevel > 72 && minlevel <= 80){
		area = '蝎子'
		global.battleAreaName = area
	}// 沙滩
	else if(minlevel > 80 && minlevel <= 89){
		area = '沙滩'
		global.battleAreaName = area
	}
	// 隐秘之洞（地）
	// TODO 隐秘之洞刷碎片
	// else if(minlevel >=29 && minlevel < 31){
	// 	thisobj.battleArea = battleAreaArray[5];
	// 	thisobj.layerLevel = 4
	// }

	// 蜥蜴
	else if(minlevel > 89 && minlevel <= 105){
		area = '蜥蜴'
		global.battleAreaName = area
		thisobj.layerLevel = 1
	}// 黑龙
	else if(minlevel > 105 && minlevel <= 120){
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
	}// 旧日之地
	else if(minlevel > 120 && minlevel <= 140){
		area = '旧日之地'
		global.battleAreaName = area
		if(minlevel > 125 && minlevel <=135){
			thisobj.layerLevel = 2
		}else if(minlevel > 135 && minlevel <=140){
			thisobj.layerLevel = 3
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
	// 传递练级的场所，给其他插件调用
	global.area = area
	console.log('global.area已写入：'+global.area)
	if (cb) cb(null)
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
				// 注销掉出迷宫逻辑，原因是所有迷宫都距离营地补给处太远，直接登出回补
				// walkMazeBack(loop);
				supplyObject.func(loop)
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
					// 注销掉出迷宫逻辑，原因是所有迷宫都距离营地补给处太远，直接登出回补
					// walkMazeBack(loop);
					supplyObject.func(loop)
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
		if(map == '蜥蜴洞穴'){
			cga.walkList([
			[12, 13, '肯吉罗岛'],
			], loop);
			return;
		}
		if(map == '圣骑士营地'){
			callSubPluginsAsync('prepare', ()=>{
				if(cga.GetMapName() != '圣骑士营地'){
					loop();
					return;
				}
				console.log('area = ' + area)

				if(area == '旧日之地'){
					talkNpcSayYesToChangeMap(loop,[120,81],'index')
					return
				}

				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
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
					else if(area == '沙滩'){
						cga.walkList([
							[471, 203],
						], ()=>{
							cga.freqMove(0);
						});
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
		if(map == '迷宫入口'){
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			cga.walkList([
				[9, 5, '旧日迷宫第1层'],
			], loop);
			return;
		}
		if(map == '旧日迷宫第1层')
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
		// 人满了再判断练级地点
		if(!teamMode.is_enough_teammates()){
			setTimeout(loop, 1000);
			return
		}
		console.log('!isleader area = ' + area + ',map = ' + map)
		choosearea(()=>{
			if(area != '旧日之地'){
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
			}else{
				if(map == '迷宫入口'){
					playerThinkInterrupt.hasInterrupt();//restore interrupt state
					console.log('playerThink on');
					playerThinkRunning = true;
				}else{
					talkNpcSayYesToChangeMap(loop,[120,81],'index')
					return
				}
			}
		})
		return;
	}

	console.log('map = ' + map)
	if(map == '旧日之地'){
		cga.walkList([
			[45, 47],
			], ()=>{
				cga.TurnTo(45, 45);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, -1);
					cga.AsyncWaitMovement({map:'迷宫入口'}, ()=>{
						cga.walkList([
						cga.isTeamLeader ? [6, 5] : [6, 6],
						], ()=>{
							teamMode.wait_for_teammates(loop);
						});									
					});
				});
			});
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
			if(cga.GetPlayerInfo().level >= 120 && cga.getItemCount('战斗号角') == 0){
				cga.walkList([
				[116, 69, '总部1楼'],
				[86, 50],
				], ()=>{
					cga.TurnTo(88, 50);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.walkList([
							[4, 47, '圣骑士营地'],
							], loop);
						});
					});
				});				
				return;
			}

			cga.walkList([
			cga.isTeamLeader ? [96, 86] : [97, 86],
			], ()=>{
				teamMode.wait_for_teammates(loop);
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
		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域'){
			dangerlevel = 2;
			return dangerlevel;
		}

		if(map == '肯吉罗岛' || map == '蜥蜴洞穴' )
			return 1;
		if(map.indexOf('隐秘之洞地下') >= 0)
			return 2;
		if(map.indexOf('蜥蜴洞穴上层') >= 0)
			return 2;
		if(map.indexOf('黑龙沼泽') >= 0)
			return 2;
		if(map.indexOf('旧日迷宫第') >= 0)
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
		loadBattleConfig()
		loop();
	},
};

module.exports = thisobj;