var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
// 法兰城找医生治疗+招魂
var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
// 为了保留config配置
var supplyMode = require(rootdir + '/通用挂机脚本/公共模块/肯吉罗岛回补');
var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');
var playerInfo = cga.GetPlayerInfo();

// 可以填写多个静态队伍，人物自动识别 
// TODO 改为动态识别
var teammates = null
var teams = [
	[
		"UNAの传教士",
		"UNAの格斗1",
		"UNAの格斗2",
		"UNAの战斧2",
		"UNAの战斧3",
	],[
		"UNAの暗黑骑士",
		"UNAの饲养师",
		"UNAの剑士",
	]
]

for(var i in teams){
	if(teammates){
		break
	}
	for(var j in teams[i]){
		if(playerInfo.name == teams[i][j]){
			teammates = teams[i]
			break
		}
	}
}

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : '亡者之镇'})
	},5000)
}

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
	else
	{
		return;
	}
}

var waitMembers = (leaderPos, memberPos, cb)=>{
	var wait = (cb)=>{
		if(cga.isTeamLeader){
			cga.waitTeammates(teammates, (r)=>{
				if(r){
					if(teammates.length > 0){
						configMode.func('节能模式')
					}else{
						configMode.manualLoad('生产赶路')
					}
					setTimeout(cb, 1000);
					return;
				}
				setTimeout(wait, 1000, cb);
			});
		}else{
			cga.addTeammate(teammates[0], (r)=>{
				if(r){
					if(teammates.length > 0){
						configMode.func('节能模式')
					}else{
						configMode.manualLoad('生产赶路')
					}
					setTimeout(cb, 1000);
					return;
				}
				setTimeout(wait, 1000, cb);
			});
		}
	}
	// 集合前要使用逃跑
	configMode.manualLoad('生产赶路')

	cga.walkList([
		cga.isTeamLeader ? leaderPos : memberPos,
	], ()=>{
		wait(cb)
	})
}

var prepareBattle = (cb)=>{
	var teamplayers = cga.getTeamPlayers()
	// 人物战斗站位，false后排，true前排
	let battlePosition = false
	for (let t = 0; t < teamplayers.length; t++) {
		if(teamplayers[t].is_me && (t == 1 || t == 2)){
			battlePosition = true
			break
		}
	}
	cga.EnableFlags(cga.ENABLE_FLAG_BATTLE_POSITION, battlePosition)
	cga.ChangePetState(cga.GetPlayerInfo().petid, 0)
	configMode.manualLoad('手动BOSS')
	setTimeout(() => {
		cb("ok")
	}, 1500);
	return
}

var talkToGhost = (cb)=>{
	var teamplayers = cga.getTeamPlayers()
	if(teamplayers.length){
		cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
		setTimeout(talkToGhost, 1000, cb);
		return
	}
	cga.walkList([
		[63, 51],
	], ()=>{
		cga.TurnTo(64, 51);
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.waitForLocation({mapindex : 400}, ()=>{
			cb(true)
		});
	})
}

/**
 * UNAecho:开发笔记
 * 夜晚蒂娜村index4201
 * 时间实地考察：
 * hours: 16 mins: 105 secs: 8 白天
 * hours: 16 mins: 105 secs: 14 黑天
 * 队长走到夜晚蒂娜村63，51处，朝64，51处右键进入战斗
 * 全队都必须有海德的好运符才能进入战斗
 * 记得更换战斗配置
 * 记得换水晶
 * 记得收宠W站位
 * ◆战斗信息：（时长/道具服）
 * Lv.140亡灵，邪魔系，血量约22000，属性：火20风80，抗咒；技能：攻击、防御、乾坤一掷、连击、超强火焰魔法、超强风刃魔法、超强昏睡魔法、超强中毒魔法、召唤幽灵*4（幽灵全部被击倒后追加）
 * Lv.130幽灵*4，不死系，血量约9000，属性：地20水80，不抗咒；技能：攻击、防御、圣盾、强力中毒魔法、强力遗忘魔法、强力陨石魔法、强力冰冻魔法
 * 
 * 战斗胜利，切换至地图index57175。
 * 和亡魂？（64，51）对话，6次下一步，1次确定，被传送至莎莲娜index400，pos ：570, 270
 * 每个人都要对话，点确定后，被传送至蒂娜村外，并获得【修特的项链】id 491668 type 26，任务完毕 
 * 返回法兰城里谢里雅堡1楼与士兵海德对话，交出【修特的项链】获得【海德的戒指】id 491669 type 18，获得称号“追查真相中”，任务完结。
 * ◆完成《圣鸟之谜》任务前不可再重解本任务
 */
var task = cga.task.Task(configTable.mainPlugin, [
	{//0
		intro: '1.前往法兰城里谢里雅堡1楼与士兵海德（81.18）对话，获得【海德的好运符】。',
		workFunc: function(cb2){
			var obj = '海德的好运符'
			healMode.func(()=>{
				if(cga.findItem(obj) != -1){
					setTimeout(() => {
						cb2(true);
					}, 1000);
				}else{
					if(cga.getInventoryEmptySlotCount() > 0){
						cga.travel.falan.toStone('C', (r)=>{
							cga.travel.autopilot(1520,()=>{
								cga.askNpcForObj(1520, [81,18],obj,()=>{
									cb2(true)
								})
							})
						});
					}else{
						throw new Error('包满了，无法获得任务物品')
					}
				}
			})
		}
	},
	{//1
		intro: '2.前往蒂娜村，夜晚与亡魂？（64.51）对话，交出【海德的好运符】进入战斗。',
		workFunc: function(cb2){
			// 为了防止赶路过程中超出了夜晚时间，写一个在村口等待夜晚的函数。注意人物需要等级较高，不然可能会在村口遇敌阵亡
			// 【注意】在夜晚蒂娜村不能使用以cga.travel.autopilot为核心的去医院回补或自动导航，因为此API暂不持支主地图是多个index的情况
			var waitForNightVillage = (cb)=>{
				let index = cga.GetMapIndex().index3;
				// 尝试更改地图周期为5分钟
				let waittime = 50000;

				if(index == 400){
					cga.walkList([
						[570, 275, '蒂娜村'],
					], ()=>{
						setTimeout(waitForNightVillage, 1500, cb);
						}
					);
					return
				}else if(index == 4200 || index == 4210){
					let sysTime = cga.GetSysTime();
					console.log('hours:',sysTime.hours,'mins:',sysTime.mins,'secs:',sysTime.secs)
					let tmpList = [[12, 9]]
					if(index == 4200){
						tmpList.unshift([34, 25, 4210])
					}
					cga.walkList(tmpList, ()=>{
							cga.turnDir(6)
							setTimeout(() => {
								cga.walkList([
									[1, 9, '蒂娜村'],
									[29, 21, 400],
								],() => {
									setTimeout(waitForNightVillage, 1500, cb);
								})
							}, waittime);
						});
					return
				}else if(index == 4201){
					let sysTime = cga.GetSysTime();
					console.log('进入夜晚蒂娜村')
					console.log('hours:',sysTime.hours,'mins:',sysTime.mins,'secs:',sysTime.secs)
					setTimeout(cb, 1000);
					return
				}
			}

			var waitBattle = (cb)=>{
				if(cga.isInBattle())
				{
					cga.waitForLocation({mapindex : 57175}, ()=>{
						cb(true)
					});
					return;
				}
				
				setTimeout(waitBattle, 1500);
				return
			}

			var go = ()=>{
				var time = cga.getTimeRange()
				if(time == '黎明' || time == '白天'){
					console.log('等待黄昏以后出发...')
					setTimeout(go, 60000);
					return
				}else{
					cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
						waitMembers([6,8],[6,7],()=>{
							// 赶路用
							configMode.manualLoad('练级')

							if(cga.isTeamLeader){
								cga.travel.autopilot('主地图',()=>{
									cga.walkList([
										[71, 18, '莎莲娜'],
										], ()=>{
											waitForNightVillage(()=>{
												cga.prepareToBattle(4201,[64, 51],(r)=>{
													prepareBattle(r)
												},(r)=>{
													console.log('战斗较难，请手动处理BOSS，胜利后，脚本再继续..')
													waitBattle(cb2)
												})
											})
										});
								})
							}else{
								cga.prepareToBattle(4201,[64, 51],(r)=>{
									prepareBattle(r)
								},(r)=>{
									waitBattle(cb2)
								})
							}
						})
					});
				}
			}
			go()
		}
	},
	{//2
		intro: '3.战斗胜利后与亡魂？对话，获得【修特的项链】。',
		workFunc: function(cb2){
			talkToGhost(cb2)
		}
	},
	{//3
		intro: '4.返回法兰城里谢里雅堡1楼与士兵海德对话，交出【修特的项链】获得【海德的戒指】、称号“追查真相中”，任务完结。',
		workFunc: function(cb2){
			var obj = '海德的戒指'
			healMode.func(()=>{
				if(cga.findItem(obj) != -1){
					setTimeout(() => {
						cb2(true);
					}, 1000);
				}else{
					if(cga.getInventoryEmptySlotCount() > 0){
						cga.travel.falan.toStone('C', (r)=>{
							cga.travel.autopilot(1520,()=>{
								cga.askNpcForObj(1520, [81,18],obj,()=>{
									cb2(true)
								})
							})
						});
					}else{
						throw new Error('包满了，无法获得任务物品')
					}
				}
			})
		}
	},
	],
	[//任务阶段是否完成
		function(){//1.前往法兰城里谢里雅堡1楼与士兵海德（81.18）对话，获得【海德的好运符】。
			return cga.findItem('海德的好运符') != -1 ? true : false;
		},
		function(){//2.前往蒂娜村，夜晚与亡魂？（64.51）对话，交出【海德的好运符】进入战斗。
			return cga.GetMapIndex().index3 == 57175 ? true : false;
		},
		function(){//3.战斗胜利后与亡魂？对话，获得【修特的项链】。
			return cga.findItem('修特的项链') != -1 ? true : false;
		},
		function(){//4.返回法兰城里谢里雅堡1楼与士兵海德对话，交出【修特的项链】获得【海德的戒指】、称号“追查真相中”，任务完结。
			// 考虑到有陪打，这里设置不可跳过
			return false
		},
	]
	);

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		cga.SayWords('欢迎使用【UNAの全自动练级+转正+烧技能脚本】，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			var minssionObj = {}
			minssionObj[configTable.mainPlugin] = true
			cga.refreshMissonStatus(minssionObj,()=>{
				console.log('【' + configTable.mainPlugin + '】完成')
				jump()
			})
		});
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(teamMode.translate(pair))
			return true;
		if(configMode.translate(pair))
			return true;

		return false;
	},
	loadconfig : (obj)=>{
		// 读取失败也不影响本脚本逻辑，但要调用，因为后续要落盘，不能丢了key。
		// 保留战斗config落盘信息
		supplyMode.loadconfig(obj)
		
		teamMode.loadconfig(obj)
		// 由于通用挂机脚本中，公共模块中的【组队模式】对cga.isTeamLeader进行过修改，故在这里手动更改自定义模式的队长
		cga.isTeamLeader = ((teammates.length && teammates[0] == cga.GetPlayerInfo().name) || teammates.length == 0) ? true : false;

		configMode.loadconfig(obj)
		
		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore
		// 保留生产config落盘信息
		if(obj.craftType)
			configTable.craftType = obj.craftType;
		if(obj.forgetSkillAt)
			configTable.forgetSkillAt = obj.forgetSkillAt;
		if(obj.listenPort)
			configTable.listenPort = obj.listenPort;
		// 保留采集config落盘信息
		if(obj.mineObject)
			configTable.mineObject = obj.mineObject;
		if(obj.gatherObject)
			configTable.gatherObject = obj.gatherObject;
		if(obj.target)
			configTable.target = obj.target;
		if(obj.mineType)
			configTable.mineType = obj.mineType;
		if(obj.logoutTimes)
			configTable.logoutTimes = obj.logoutTimes;

		return true;
	},
	execute : ()=>{
		callSubPlugins('init');
		loop();
	},
}

module.exports = thisobj;