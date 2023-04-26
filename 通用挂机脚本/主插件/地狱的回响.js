/**
 * 【注意】如果你需要在半山腰练级，那么不需要做地狱的回响任务。
 * 如果你妄图和大祭祀对话进入小岛节约阿鲁卡的800块传送费：
 * 1、小岛的怪会变成60级
 * 2、通往山顶的路的怪会变成10级
 * 3、半山腰将不会遇敌（因为不是一个index，不会遇敌的index为57475，会遇敌的index为57182）
 * 
 * 当然你还是可以去练级的，阿鲁卡交的800块之后，小岛、通往山顶的路、半山腰都是和半山5一致的。（因为大祭司和阿鲁卡传送的小岛，不是一个index）
 */
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

// 小岛默认等待坐标
var leaderPos = [65, 97]
var memberPos = [65, 98]

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
		updateConfig.update_config({'mainPlugin' : '智能练级'})
	},5000)
}

var dialogHandler = (err, dlg)=>{
	if(dlg){
		if((dlg.options & 4) == 4){
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}else if((dlg.options & 32) == 32){
			cga.ClickNPCDialog(32, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}else if(dlg.options == 1){
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}else if(dlg.options == 3){
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}else if(dlg.options == 12){
			cga.ClickNPCDialog(4, -1);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
	}
	return
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

/**
 * UNAecho:开发笔记
 * 【注意】本任务跑图消耗相当大，请备足10级料理
 * 通往山顶的路10层+通往地狱的道路36层，一共46层，怪物在130级左右，一场8-10个怪。请一定保证清怪效率
 */
var task = cga.task.Task(configTable.mainPlugin, [
	{//0
		intro: '1.前往法兰城里谢里雅堡2楼图书馆与阿斯提亚祭司（27.15）对话，选“是”交出1000G获得【锄头】并传送至小岛。',
		workFunc: function(cb2){
			var obj = {act : "item", target : "锄头"}

			// 即便手里有锄头，也需要丢掉
			// 黑心祭祀，有锄头不给传送，只有扔掉锄头才收你1000块再给你把锄头，再传送过去
			var itemPos = cga.findItem(obj.target)
			if(itemPos != -1){
				cga.DropItem(itemPos);
			}

			healMode.func(()=>{
				cga.travel.falan.toStone('C', (r)=>{
					cga.travel.autopilot(1504,()=>{
						cga.askNpcForObj(1504, [27,15],obj,()=>{
							waitMembers(leaderPos,memberPos,()=>{
								cb2(true)
							})
						})
					})
				});
			
			})
		}
	},
	{//1
		intro: '2.至（64.45）处通过黄色传送石进入通往山顶的路，通过随机迷宫抵达半山腰。',
		/**
		 * ◆通往山顶的路为随机迷宫；魔物为托罗帝鸟、岩地跑者、火焰啄木鸟、狂奔鸟（怀旧服为Lv.59~65；时长/道具服为Lv.130~134）
		 * ◆半山腰为固定地图，index57182
		 * ◆半山腰为固定地图；魔物为（怀旧服Lv.72~74；时长/道具服Lv.142~144）的虎人*2~4、迷你蝙蝠*2、液态史莱姆*1、利牙*1，最高遇敌数量8
		 */
		workFunc: function(cb2){
			var obj1 = {act : "map", target : "小岛"}
			var obj2 = {act : "map", target : "通往山顶的路100M"}
			var obj3 = {act : "map", target : "半山腰"}

			var walkMaze = (cb)=>{
				var map = cga.GetMapName();
				if(map == obj3.target){
					cb2(true)
					return;
				}
				if(map == obj1.target){
					cga.walkList([
						[64,45, obj2.target],
						], ()=>{
							walkMaze(cb);
						});
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb);
				});
			}
			
			// 清怪配置
			configMode.func('节能模式')

			if(cga.isTeamLeader){
				walkMaze(cb2);
			}else{
				cga.waitForLocation({mapname : obj3.target}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//2
		intro: '3.持有【锄头】调查奇怪的薄冰（81.56），交出【锄头】进入圣山内部',
		/**
		 * 圣山内部index57402
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : "圣山内部"}
			cga.askNpcForObj("半山腰", [81,56],obj,()=>{
				waitMembers([16, 12],[15, 12],()=>{
					cb2(true)
				})
			})
		}
	},
	{//3
		intro: '4.通过红色传送石进入通往地狱的道路，通过随机迷宫抵达地狱入口。',
		/**
		 * 地狱入口index57403
		 */
		workFunc: function(cb2){
			var obj1 = {act : "map", target : "圣山内部"}
			var obj2 = {act : "map", target : "通往地狱的道路地下1层"}
			var obj3 = {act : "map", target : "地狱入口"}

			var walkMaze = (cb)=>{
				var map = cga.GetMapName();
				if(map == obj3.target){
					cb2(true)
					return;
				}
				if(map == obj1.target){
					cga.walkList([
						[19,7, obj2.target],
						], ()=>{
							walkMaze(cb);
						});
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb);
				});
			}
			
			// 清怪配置
			configMode.func('节能模式')

			if(cga.isTeamLeader){
				walkMaze(cb2);
			}else{
				cga.waitForLocation({mapname : obj3.target}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//4
		intro: '5.与濒死的圣鸟子嗣（14.11）对话传送至圣山之巅。',
		/**
		 * 从地狱入口传送回来的特殊圣山之巅，index57404
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : "圣山之巅"}
			cga.askNpcForObj("地狱入口", [24, 25],obj,()=>{
				cb2(true)
			})
		}
	},
	{//5
		intro: '6.与阿鲁卡那斯对话，交出称号“背叛者”获得称号“地狱的回响”并传送回法兰城。',
		workFunc: function(cb2){
			var obj = {act : "map", target : "法兰城"}
			cga.askNpcForObj("圣山之巅", [23,22],obj,()=>{
				cb2(true)
			})
		}
	},
	{//6
		intro: '7.返回法兰城里谢里雅堡2楼图书馆与阿斯提亚祭司（27.15）对话，获得【大天使的呼吸】，任务完结。',
		/**
		 * UNAecho: 
		 * 大天使的呼吸#491919 @26
		 * 使用后，点击【是】，并传送至【？？？】，index57405
		 * 61,13处有大天使NPC，对话可招魂
		 * 【注意】【大天使的呼吸】为消耗品，使用1次就消失
		 */
		workFunc: function(cb2){
			var obj = {act : "item", target : "大天使的呼吸"}
			cga.travel.falan.toStone('C', (r)=>{
				cga.travel.autopilot(1504,()=>{
					cga.askNpcForObj(1504, [27,15],obj,()=>{
						cb2(true)
					})
				})
			});
		}
	},
	],
	[//任务阶段是否完成
	function(){//1.前往法兰城里谢里雅堡2楼图书馆与阿斯提亚祭司（27.15）对话，选“是”交出1000G获得【锄头】并传送至小岛。
		return false;
	},
	function(){//2.至（64.45）处通过黄色传送石进入通往山顶的路，通过随机迷宫抵达半山腰。
		return cga.GetMapIndex().index3 == 57182 ? true : false;
	},
	function(){//3.持有【锄头】调查奇怪的薄冰（81.56），交出【锄头】进入圣山内部，通过红色传送石进入通往地狱的道路。
		if(cga.GetMapName() == '圣山内部'){
			return true
		}
		if(cga.GetMapName().indexOf('通往地狱的道路') >= 0 && teammates.length == cga.getTeamPlayers().length){
			return true
		}
		return false;
	},
	function(){//4.通过红色传送石进入通往地狱的道路，通过随机迷宫抵达地狱入口。
		return cga.GetMapName() == '地狱入口' ? true : false;
	},
	function(){//5.与濒死的圣鸟子嗣（14.11）对话传送至圣山之巅。
		return cga.GetMapName() == '圣山之巅' ? true : false;
	},
	function(){//6.与阿鲁卡那斯对话，交出称号“背叛者”获得称号“地狱的回响”并传送回法兰城。
		return cga.findTitle('地狱的回响') != -1 ? true :false
	},
	function(){//7.返回法兰城里谢里雅堡2楼图书馆与阿斯提亚祭司（27.15）对话，获得【大天使的呼吸】，任务完结。
		return cga.findItem('大天使的呼吸') != -1 ? true : false;
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