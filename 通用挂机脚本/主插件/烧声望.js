var Async = require('async');
var fs = require('fs');
var supplyMode = require('./../公共模块/灵堂回补');
var supplyCastle = require('./../公共模块/里堡回补');
var logbackEx = require('./../公共模块/登出防卡住');
var cga = global.cga;
var configTable = global.configTable;


var interrupt = require('./../公共模块/interrupt');
var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var supplyArray = [
	supplyMode, 
	supplyCastle
];

var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)

// 烧技能单词技能消耗，用于计算使用次数
var skillcast = professionalInfo.jobmainname == '咒术师' ? 5 : 10 
// 应该烧技能的次数，通过阿蒙和阿梅确定声望进度，然后估计需要使用多少次得意技
var skillcount = null 
// 声望进度百分比
var per = null
// 是否去刷新声望进度
var getTitleFlag = true

var loadBattleConfig = ()=>{

	var playerJobInfo = {}

	var settingpath = cga.getrootdir() + '\\战斗配置\\'

	if (professionalInfo.jobmainname == '咒术师'){
		settingpath = settingpath + '咒术烧声望.json'

		playerJobInfo.jobname = professionalInfo.jobmainname
		playerJobInfo.skillcast = 10
		playerJobInfo.jobname = professionalInfo.jobmainname

	}else{
		settingpath = settingpath + '传教烧声望.json'
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

// 获取称号进度百分比
var getPercentage = (cb) =>{
	console.log('刷新称号，并获取进度百分比')

	cga.travel.falan.toStone('E2', ()=>{
		cga.walkList([
		[230, 82],
		], ()=>{
			cga.turnDir(2);
			setTimeout(()=>{
				cga.walkList([
					[235, 107],
					], ()=>{
						cga.turnDir(2);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if(dlg && dlg.message.indexOf('一点兴趣') >= 0||dlg.message.indexOf('新称号而努力') >= 0){
								per = 0
							}else if(dlg.message.indexOf('四分之一') >= 0){
								per = 0.25
							}else if(dlg.message.indexOf('毛毛虫美少女') >= 0){
								per = 0.5
							}else if(dlg.message.indexOf('再加把劲') >= 0){
								per = 0.75
							}else{
								per = 1
							}
							console.log('当前声望进度:【'+(per==null? '读取失败' : per * 100)+'%】')
							getTitleFlag = false
							setTimeout(cb, 2000, null);
						});
					});
			}, 2000);
		});
	});
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
				console.log('interruptFromMoveThink + supplyMode.func(loop)')
				supplyMode.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						console.log('moveThinkInterrupt.requestInterrupt + supplyMode.func(loop)')
						ctx.supplycount += 1
						supplyMode.func(loop);
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

var jump = ()=>{
	// 恢复出战宠物
	// 详细逻辑请看cga.findbattlepet()注释
	cga.ChangePetState(cga.findbattlepet(), cga.PET_STATE_BATTLE);
}

var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var playerinfo = cga.GetPlayerInfo();

	if(cga.needSupplyInitial()){
		var supplyObject = getSupplyObject(map, mapindex);
		if(supplyObject)
		{
			supplyObject.func(loop);
			return;
		}
	}

	if(getTitleFlag){
		setTimeout(getPercentage, 2000,loop);
		return
	}

	callSubPluginsAsync('prepare', ()=>{
		//设置宠物不出战
		var petIndex = playerinfo.petid;
		if(petIndex!=-1){
			cga.ChangePetState(petIndex, 0);
		}
		
		if(map == '里谢里雅堡' && mapindex == 1500){
			cga.walkList([
			[47, 85, '召唤之间']
			], loop);
		}else if(map == '召唤之间' && mapindex == 1530){
			cga.walkList([
				[27, 8, '回廊']
				], loop);
		} else if(map == '回廊' && mapindex == 1531){
			cga.walkList([
			[23, 19, '灵堂']
			], loop);
		}else if(map == '灵堂' && mapindex == 11015){
			
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			cga.walkList([
				[30, 49],
			], ()=>{
				cga.freqMove(0);
			});
		}else{
			cga.travel.falan.toStone('C', loop);
		}
		return
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{

		if(supplyMode.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{
		
		configTable.listenPort = obj.listenPort;
		thisobj.listenPort = obj.listenPort

		if(!supplyMode.loadconfig(obj))
			return false;

		return true;
	},
	inputcb : (cb)=>{
		
		var stage1 = (cb2)=>{
			
			var sayString = '【烧声望插件】请选择服务监听端口（和乐园之卵4保持相同）: 1000~65535';
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
		
		Async.series([stage1], cb);
	},
	execute : ()=>{
		loadBattleConfig()
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		loop();
	},
};

module.exports = thisobj;