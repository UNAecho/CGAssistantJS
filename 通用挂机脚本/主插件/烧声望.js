var fs = require('fs');
var Async = require('async');
var supplyMode = require('./../公共模块/灵堂回补');
var supplyCamp = require('./../公共模块/营地回补');
var supplyCastle = require('./../公共模块/里堡回补');
// var sellCamp = require('./../公共模块/营地卖石');
// var sellCastle = require('./../公共模块/里堡卖石');
var teamMode = require('./../公共模块/组队模式');
var logbackEx = require('./../公共模块/登出防卡住');
var updateConfig = require('./../公共模块/修改配置文件');
var configMode = require('../公共模块/读取战斗配置');

var cga = global.cga;
var configTable = global.configTable;

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)
var commonJob = professionalInfo.jobmainname

var interrupt = require('./../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var supplyArray = [
	supplyMode, 
	supplyCastle,
	supplyCamp
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

// 通用学习动作
var learn = (xpos,ypos,cb) => {
	cga.TurnTo(xpos, ypos);
	cga.AsyncWaitNPCDialog(() => {
		cga.ClickNPCDialog(0, 0);
		cga.AsyncWaitNPCDialog(() => {
			setTimeout(() => {
				cga.ClickNPCDialog(0, -1);
				setTimeout(() => {
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('技能栏位') > 0) {
							throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了')
						} else if (dlg && dlg.message.indexOf('你的钱') > 0) {
							throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
						} else {
							console.log('技能学习完毕')
							if (cb) {
								cb(true)
							}
						}
					});
				}, 1500);
			}, 1000);
		});
	});
}

// 检查技能
var checkSkill = (cb)=>{
	if(commonJob == '传教士' && !cga.findPlayerSkill('气绝回复')){
		console.log('没找到气绝回复，去亚留特学习')
		var settingpath = cga.getrootdir() + '\\战斗配置\\生产赶路.json'
		var setting = JSON.parse(fs.readFileSync(settingpath))

		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.log(err);
				return;
			}else{
				console.log('读取战斗配置【'+settingpath+'】成功')
			}
		})
		cga.travel.falan.toCastleHospital(()=>{
			cga.walkList([
				[65, 53, '法兰城'],
				[281, 88, '芙蕾雅'],
				[672,223,'哈巴鲁东边洞穴 地下1楼'],
				[41,8,'哈巴鲁东边洞穴 地下2楼'],
				[17,18]
				], ()=>{
					cga.ForceMove(6, true);
					cga.ForceMove(6, true);
					cga.walkList([
						[16,11,'哈巴鲁东边洞穴 地下1楼'],
						[30,4,'芙蕾雅'],
						[596,84,'亚留特村'],
						[49,65],[49,47],
						[56,48,2412],
						[22,9,2499],
						[5,13]
						], ()=>{
							// 顺便开传送
							cga.turnTo(5, 14);
							setTimeout(() => {
								cga.walkList([
									[8, 3, '村长的家'],
									[6,14,'亚留特村'],
									[47,72]
									], ()=>{
										learn(48,72,()=>{
											loadBattleConfig()
											cb(null)
										})
									});
							}, 1500);
						});
				});
		});
	}else if(commonJob == '咒术师' && !cga.findPlayerSkill('石化魔法')){
		console.log('没找到石化魔法')
		cga.travel.falan.toStone('C', (r)=>{
			cga.walkList([
				[17, 53, '法兰城'],
				[120,65],
			], (r)=>{
				cga.TurnTo(120, 64);
				learn(120,64,cb)
			});
		});
	}else{
		loadBattleConfig()
		if (cb) cb(null)
	}
	return
}

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

	if (commonJob == '咒术师'){
		settingpath = settingpath + '咒术烧声望.json'
	}else if(commonJob == '传教士'){
		settingpath = settingpath + '传教烧声望.json'
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

							console.log('职业：【'+commonJob+'】，称号：【'+title+'】，进度：【'+reputationState+'】，需要使用【'+skillcount+'】次得意技，或回补【'+supplycount+'】次才能升级至下一称号')

							if (title == '无尽星空'){
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
									console.log('originInfo.title:'+originInfo.title)
									console.log('title:'+title)
									console.log('originInfo.percentage:'+originInfo.percentage)
									console.log('per:'+per)
									console.log('originInfo.title == title && originInfo.percentage == per:' + (originInfo.title == title && originInfo.percentage == per))
									console.log(originInfo.title == title)
									console.log(originInfo.percentage == per)
									console.log('声望【有】进展，继续烧声望')
									originInfo.title = title
									originInfo.percentage = per
									console.log('originInfo.title改为:'+originInfo.title)
									console.log('originInfo.percentage改为:'+originInfo.percentage)
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
		job : commonJob ,
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
				supplyMode.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						// TODO 实现驯兽师的声望刷新机制，目前暂无，一直遇敌，请定时手动查看声望情况。
						if(commonJob == '驯兽师'){
							console.log('实现驯兽师的声望刷新机制，目前暂无，一直遇敌，请定时手动查看声望情况。')
						}else{
							supplycount -= 1
							console.log('触发回补，升级至下一个称号还需回补:【'+supplycount+'】次')
						}
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
	var isleader = cga.isTeamLeaderEx();

	// 由于传咒需要单人在灵堂烧声望，所以在组队模式中已经将teammate置空数组。故传咒模式下isleader && teamMode.is_enough_teammates()均为true。
	if(isleader && teamMode.is_enough_teammates()){
		if((commonJob == '传教士' || commonJob == '咒术师') && !cga.ismaxbattletitle()){
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
				//传咒单刷设置宠物不出战，驯兽需要保证宠物出战，否则虽然有声望，但是调教不加经验。最后5转需要10级调教的。
				var petIndex = playerinfo.petid;
				// console.log('petIndex:'+petIndex)
				if(commonJob !='驯兽师' && petIndex!=-1){
					console.log('当前职业不是驯兽师，取消掉出战宠物来烧技能。')
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
			return
		}
		
		if(map == '工房' && mapindex == 44693){
			cga.walkList([
			[30, 37, '圣骑士营地']
			], loop);
			return;
		}
		if(map == '肯吉罗岛'){
			supplyMode.func(loop);
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
				cga.walkList([
					[36, 87, '肯吉罗岛'],
					[548, 332],
				], ()=>{
					cga.freqMove(0);
				});
			});
			return;
		}
	} else if(!isleader){
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;
		return;		
	}
	
	// if(thisobj.sellStore == 1 && cga.getSellStoneItem().length > 0)
	// {
	// 	var sellObject = getSellObject(map, mapindex);
	// 	if(sellObject)
	// 	{
	// 		sellObject.func(loop);
	// 		return;
	// 	}
	// }
	
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
				teamMode.wait_for_teammates(loop);
			});
		});
	});

}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();
		
		if(map == '肯吉罗岛' )
			return 2;

		return 0;
	},
	translate : (pair)=>{

		// if(pair.field == 'sellStore'){
		// 	pair.field = '是否卖石';
		// 	pair.value = pair.value == 1 ? '卖石' : '不卖石';
		// 	pair.translated = true;
		// 	return true;
		// }
		
		if(supplyMode.translate(pair))
			return true;
				
		if(teamMode.translate(pair))
			return true;
		
		if(configMode.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{

		if(!supplyMode.loadconfig(obj))
			return false;
		
		if(!teamMode.loadconfig(obj))
			return false;
		
		if(!configMode.loadconfig(obj))
			return false;
		
		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([supplyCamp.inputcb, teamMode.inputcb, 
		// 	(cb2)=>{
		// 	var sayString = '【烧声望插件】请选择是否卖石: 0不卖石 1卖石';
		// 	cga.sayLongWords(sayString, 0, 3, 1);
		// 	cga.waitForChatInput((msg, val)=>{
		// 		if(val !== null && val >= 0 && val <= 1){
		// 			configTable.sellStore = val;
		// 			thisobj.sellStore = val;
					
		// 			var sayString2 = '当前已选择:'+sellStoreArray[thisobj.sellStore]+'。';
		// 			cga.sayLongWords(sayString2, 0, 3, 1);
					
		// 			cb2(null);
					
		// 			return false;
		// 		}
				
		// 		return true;
		// 	});
		// }
	], cb);
	},
	execute : ()=>{
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		checkSkill(loop);
	},
};

module.exports = thisobj;