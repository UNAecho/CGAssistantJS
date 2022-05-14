var Async = require('async');
var fs = require('fs');
var supplyMode = require('./../公共模块/灵堂回补');
var supplyCastle = require('./../公共模块/里堡回补');
var logbackEx = require('./../公共模块/登出防卡住');
var updateConfig = require('./../公共模块/修改配置文件');
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
// 声望数据
const reputationInfos = require('../../常用数据/reputation.js');

// 用于对比称号是否有进展，如有则继续刷
var originInfo = null

// 烧技能单次技能消耗，用于计算使用次数
var skillcast = 5
// 回补次数，通过阿蒙和阿梅确定声望进度，然后估计回补多少次即可到达下一级别声望
var supplycount = 0 
// 声望进度百分比
var per = null

var loadBattleConfig = ()=>{

	var settingpath = cga.getrootdir() + '\\战斗配置\\'

	if (professionalInfo.jobmainname == '咒术师'){
		settingpath = settingpath + '咒术烧声望.json'

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
							// 刷新内存中的称号信息，不然还是和阿蒙对话前的称号
							var playerInfo = cga.GetPlayerInfo()
							// 制定接下来的烧声望计划
							var reputationState = (per == null? '读取失败' : (per * 100).toString() + '%')
							var title = reputationInfos.getReputation(playerInfo.titles)
							var skillcount = reputationInfos.skillCount(title,per)
							supplycount = Math.ceil(skillcount / Math.floor(playerInfo.maxmp / skillcast))

							console.log('职业：【'+professionalInfo.jobmainname+'】，称号：【'+title+'】，进度：【'+reputationState+'】，需要使用【'+skillcount+'】次得意技，或回补【'+supplycount+'】次才能升级至下一称号')

							if (title == '无尽星空' || title == '敬畏的寂静'){
								console.log('称号已满，烧声望脚本结束')
								jump()
							}
							if (originInfo === null){
								originInfo = {
									title : title,
									percentage : per
								}
							}else{
								if(originInfo.title == title && originInfo.percentage == per){
									console.log('声望【无】进展，该去做保证书任务了')
									jump()
								}else{
									console.log('声望【有】进展，继续烧声望')
								}
							}
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
		job : professionalInfo.jobmainname ,
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
						supplycount -= 1
						console.log('触发回补，升级至下一个称号还需回补:【'+supplycount+'】次')
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

	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','转职保证书')
	},5000)
}

var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var playerinfo = cga.GetPlayerInfo();

	if(cga.needSupplyInitial() && playerinfo.gold > 10000){
		var supplyObject = getSupplyObject(map, mapindex);
		if(supplyObject)
		{
			supplyObject.func(loop);
			return;
		}
	}

	if(supplycount == 0){
		setTimeout(getPercentage, 2000, loop);
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