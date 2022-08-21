var fs = require('fs');
var Async = require('async');
var supplyKengiro = require('../公共模块/肯吉罗岛回补');
var supplyCastle = require('./../公共模块/里堡回补');
var sellKengiro = require('../公共模块/肯吉罗岛卖石');
var sellCastle = require('../公共模块/里堡卖石');
var teamMode = require('../公共模块/组队模式');
var configMode = require('../公共模块/读取战斗配置');

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

var cachedEntrance = null;
var blacklistEntrance = [];

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

var battleAreaArray = [
	{
		name : '艾夏岛门口',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[210, 216],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '盖雷布伦森林');
		}
	},
	{
		name : '低地鸡',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[221, 228],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '盖雷布伦森林');
		}
	},
	{
		name : '刀鸡',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[34, 188],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '龙骨',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[111, 206],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '黄金龙骨',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[135, 175],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '银狮',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[122, 117],
					[147, 117],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '回廊',
		muster : (cb)=>{
			cga.travel.falan.toStone('C', ()=>{
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
										], cb);
									});
								});
							});
						});
					});	
			});
			return
		},
		walkTo : (cb)=>{
			setTimeout(cb, 500);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '过去与现在的回廊');
		}
	},
	{
		name : '营地',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[548, 332],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛');
		}
	},
	{
		name : '蝎子',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			var map = cga.GetMapName();
			if(map == '圣骑士营地'){
				cga.walkList([
					[36, 87, '肯吉罗岛'],
					[384, 245, '蜥蜴洞穴'],
					[12, 2, '肯吉罗岛'],
					[231, 434, '矮人城镇'],
				], cb);
			}else if(map == '矮人城镇'){
				cga.walkList([
					[110, 191, '肯吉罗岛'],
					[233, 439],
				], cb);
			}
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域');
		}
	},
	{
		name : '沙滩',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[471, 203],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域');
		}
	},
	{
		name : '蜥蜴',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[384, 245, '蜥蜴洞穴'],
				[17, 4, '蜥蜴洞穴上层第1层'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '蜥蜴洞穴上层第1层');
		}
	},
	{
		name : '黑龙',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[424, 345, '黑龙沼泽1区'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '黑龙沼泽1区');
		}
	},
	{
		name : '旧日之地',
		muster : (cb)=>{
			
			var getHorn = (cb2)=>{
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
								], ()=>{
									muster(cb2)
								});
							});
						});
					});				
					return;
				
			}
			
			var muster = (cb2)=>{
				cga.walkList([
					[119, 81],
					], ()=>{
						cga.TurnTo(121, 81);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, -1);
							cga.AsyncWaitMovement({map:'旧日之地'}, ()=>{
								cga.walkList([
								[45, 47],
								], ()=>{
									cga.TurnTo(45, 45);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(1, -1);
										cga.AsyncWaitMovement({map:'迷宫入口'}, ()=>{
											cga.walkList([
											cga.isTeamLeader ? [6, 5] : [6, 6],
											], cb2);									
										});
									});
								});
							});
						});
					});
			}

			cga.travel.falan.toCamp(()=>{
				if(cga.getItemCount('战斗号角') == 0){
					getHorn(cb)
				}else{
					muster(cb)
				}
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[9, 5, '旧日迷宫第1层'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '旧日迷宫第1层');
		}
	},
]

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
	if (professionalInfo.jobmainname == '传教士'){
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
	}else if(professionalInfo.jobmainname == '格斗士'){
		var chaos = cga.findPlayerSkill('混乱攻击')
		if (chaos && chaos.lv != chaos.maxlv){
			settingpath = settingpath + '格斗练级烧混乱攻击.json'
		}else{
			settingpath = settingpath + '格斗练级.json'
		}
	}else if(professionalInfo.jobmainname == '弓箭手'){
		settingpath = settingpath + '弓箭练级.json'
	}else if(professionalInfo.jobmainname == '剑士'){
		settingpath = settingpath + '剑士练级.json'
	}else if(professionalInfo.jobmainname == '战斧斗士'){
		settingpath = settingpath + '战斧练级.json'
	}else if(professionalInfo.jobmainname == '魔术师'){
		settingpath = settingpath + '法师练级.json'
	}else if(professionalInfo.jobmainname == '巫师'){
		settingpath = settingpath + '巫师练级.json'
	}else if(professionalInfo.jobmainname == '封印师'){
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

var levelRegion= (cb)=>{
	if (!teamMode.is_enough_teammates()){
		setTimeout(levelRegion, 1000, cb);
		return
	}

	var teamplayers = cga.getTeamPlayers();

	if(teamplayers.length > 1){
		thisobj.minLevel = teamplayers[0].level
		thisobj.maxLevel = teamplayers[0].level
	}else{
		thisobj.minLevel = cga.GetPlayerInfo().level
	}
	for (i = 0 ; i< teamplayers.length ; i++){
		thisobj.minLevel = thisobj.minLevel < teamplayers[i].level ? thisobj.minLevel : teamplayers[i].level
		thisobj.maxLevel = thisobj.maxLevel > teamplayers[i].level ? thisobj.maxLevel : teamplayers[i].level
	}
	console.log('队员最低等级 : ' + thisobj.minLevel)
	console.log('队员最高等级 : ' + thisobj.maxLevel)

	if (cb) cb(null)
	return
}

var switchArea = (cb)=>{
	if(thisobj.minLevel <= 8){
		global.area = '艾夏岛门口'
	}
	else if(thisobj.minLevel> 8 && thisobj.minLevel <= 10){
		global.area = '低地鸡'
	}
	else if(thisobj.minLevel> 10 && thisobj.minLevel <= 27){
		global.area = '刀鸡'
	}
	else if(thisobj.minLevel> 27 && thisobj.minLevel <= 30){
		global.area = '龙骨'
	}
	else if(thisobj.minLevel> 30 && thisobj.minLevel <= 39){
		global.area = '黄金龙骨'
	}
	else if(thisobj.minLevel> 39 && thisobj.minLevel <= 45){
		global.area = '银狮'
	}
	else if(thisobj.minLevel> 45 && thisobj.minLevel <= 60){
		global.area = '回廊'
	}
	else if(thisobj.minLevel> 60 && thisobj.minLevel <= 72){
		global.area = '营地'
	}
	else if(thisobj.minLevel> 72 && thisobj.minLevel <= 80){
		global.area = '蝎子'
	}
	else if(thisobj.minLevel> 80 && thisobj.minLevel <= 89){
		global.area = '沙滩'
	}
	// TODO 隐秘之洞刷碎片

	else if(thisobj.minLevel> 89 && thisobj.minLevel <= 105){
		global.area = '蜥蜴'
	}
	else if(thisobj.minLevel> 105 && thisobj.minLevel <= 120){
		global.area = '黑龙'
	}
	else if(thisobj.minLevel> 120 && thisobj.minLevel <= 140){
		global.area = '旧日之地'
	}
	// 打印练级场所及层数
	if(thisobj.layerLevel > 1){
		console.log('去【' + area +'】【' + thisobj.layerLevel + '】层练级')
	}else{
		console.log('去【' + area + '】练级')
	}

	thisobj.battleAreaObj = battleAreaArray.find((b)=>{
		return b.name == global.area
	});

	if(!thisobj.battleAreaObj){
		throw new Error('错误，未找到合适的练级地点，请检查。')
	}
	console.log('自动识别练级地点:' + thisobj.battleAreaObj.name)

	setTimeout(cb, 1000);
	return
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
	var skills = cga.GetSkillsInfo();

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
		skills : skills,
		result : null,
	}

	teamMode.think(ctx);
	// 自动读取战斗配置
	configMode.think(ctx);

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
		// 如果是单人练级，没有进行组队判定去哪里练级，就根据自身等级判定
		if(!thisobj.battleAreaObj){
			levelRegion(()=>{
				switchArea(()=>{
					callSubPluginsAsync('prepare', ()=>{
						thisobj.battleAreaObj.muster(()=>{

							playerThinkInterrupt.hasInterrupt();//restore interrupt state
							console.log('playerThink on');
							playerThinkRunning = true;
							
							thisobj.battleAreaObj.walkTo(()=>{
								var xy = cga.GetMapXY();
								var dir = cga.getRandomSpaceDir(xy.x, xy.y);
								cga.freqMove(dir);
							})
						})
					});

				})
			})
			return
		}
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

					thisobj.battleAreaObj.walkTo(()=>{
						var xy = cga.GetMapXY();
						var dir = cga.getRandomSpaceDir(xy.x, xy.y);
						cga.freqMove(dir);
					})
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
		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '圣骑士营地门口域'){
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

				thisobj.battleAreaObj.walkTo(()=>{
					if(cga.GetMapName() == '矮人城镇'){
						setTimeout(loop, 1000);
					}else{
						var xy = cga.GetMapXY();
						var dir = cga.getRandomSpaceDir(xy.x, xy.y);
						cga.freqMove(dir);
					}
				})
			});
			return;
		}
		// 练级地点逻辑
		if(thisobj.battleAreaObj.isDesiredMap(map)){

			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;

			var xy = cga.GetMapXY();
			var dir = cga.getRandomSpaceDir(xy.x, xy.y);
			cga.freqMove(dir);

			return
		}
		// 正常在集散地出发
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;

		thisobj.battleAreaObj.walkTo(()=>{
			var xy = cga.GetMapXY();
			var dir = cga.getRandomSpaceDir(xy.x, xy.y);
			cga.freqMove(dir);
		})

		return
	} else if(!isleader){
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;

		return
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

	cga.travel.newisland.toStone('X', ()=>{
		cga.walkList([
			cga.isTeamLeader ? [140, 107] : [140, 106],
		], ()=>{
			teamMode.wait_for_teammates(()=>{
				levelRegion(()=>{
					switchArea(()=>{
						var retry = ()=>{
							if(cga.getTeamPlayers().length){
								if(cga.isTeamLeaderEx()){
									cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
									setTimeout(retry, 1000);
								}else{
									setTimeout(retry, 1000);
								}
								return
							}else{
								callSubPluginsAsync('prepare', ()=>{
									thisobj.battleAreaObj.muster(()=>{
										teamMode.wait_for_teammates(loop);
									})
								});
								return
							}
						}
						retry()
					})
				})
			});
		});
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();

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

		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域'){
			return 2
		}
		if(map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域'){
			return 2
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

		if(!configMode.loadconfig(obj))
			return false;
		
		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore
		
		if(thisobj.sellStore == undefined){
			console.error('读取配置：是否卖石失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([configMode.inputcb, supplyKengiro.inputcb, teamMode.inputcb, (cb2)=>{
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
		},
	], cb);
	},
	execute : ()=>{
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		// loadBattleConfig()
		loop();
	},
};

module.exports = thisobj;