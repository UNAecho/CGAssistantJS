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
		updateConfig.update_config('mainPlugin','通用挂机脚本')
	},5000)
}

var task = cga.task.Task(configTable.mainPlugin, [
	{//0
		intro: '1.前往法兰城里谢里雅堡2楼图书馆（0.74）与阿斯提亚祭司（27.15）对话，获得【阿斯提亚锥形水晶】。',
		/**
		 * ◆已经完成过本任务拥有“背叛者”称号时，不可解本任务，无法获得【阿斯提亚锥形水晶】，会获得半山6《地狱的回响》的任务道具【锄头】
		 */
		workFunc: function(cb2){
			var obj = {act : "item", target : "阿斯提亚锥形水晶"}
			healMode.func(()=>{
				cga.travel.falan.toStone('C', (r)=>{
					cga.travel.autopilot(1504,()=>{
						cga.askNpcForObj(1504, [27,15],obj,()=>{
							cb2(true)
						})
					})
				});
			
			})
		}
	},
	{//1
		intro: '2.双击【阿斯提亚锥形水晶】传送至小岛，前往（64.45）处通过黄色传送石进入通往山顶的路。',
		/**
		 * UNAecho：水晶传送的小岛为特殊小岛，没有遇敌，index57249
		 * 通往山顶的路有遇敌，每次遇敌仅1个怪，10+级，没有威胁
		 * 本任务的半山腰index57250
		 * ◆通往山顶的路为随机迷宫，共19层；魔物为Lv.9~15狂奔鸟、托罗帝鸟、火焰啄木鸟、岩地跑者，数量固定为1
		 * ◆本任务的半山腰不会遇敌
		 */
		workFunc: function(cb2){
			var obj1 = {act : "map", target : "通往山顶的路100M"}
			var obj2 = {act : "map", target : "半山腰"}

			var go = (cb)=>{
				var map = cga.GetMapName();
				var mapindex = cga.GetMapIndex().index3;
				if(map == obj2.target){
					cb(true)
					return;
				}
				if(map.indexOf('通往山顶的路') != -1){
					cga.walkRandomMaze(null, (err)=>{
						go(cb);
					});
					return
				}
				// 无遇敌的小岛
				if(mapindex == 57249){
					cga.walkList([
						[64,45, obj1.target],
						], ()=>{
							go(cb);
						});
					return;
				}
				cga.UseItem(cga.findItem("阿斯提亚锥形水晶"));
				setTimeout(go, 2000, cb);
				
			}
			
			// 赶路模式，本任务单人即可完成
			configMode.manualLoad('生产赶路')
			healMode.func(()=>{
				go(cb2);
			})
		}
	},
	{//2
		intro: '3.通过随机迷宫进入圣鸟之巢',
		/**
		 * 特殊圣鸟之巢，无需给星鳗饭团，index57247
		 */
		workFunc: function(cb2){
			var obj1 = {act : "map", target : "通往山顶的路1100M"}
			var obj2 = {act : "map", target : "圣鸟之巢"}

			var walkMaze = (cb)=>{
				var map = cga.GetMapName();
				if(map == obj2.target){
					cb2(true)
					return;
				}
				if(map == '半山腰'){
					cga.walkList([
						[78,52, obj1.target],
						], ()=>{
							walkMaze(cb);
						});
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb);
				});
			}
			// 赶路模式，本任务单人即可完成
			configMode.manualLoad('生产赶路')
			walkMaze(cb2);
		}
	},
	{//3
		intro: '4.与圣鸟的子嗣（14.11）对话进入圣山之巅。',
		/**
		 * 特殊圣山之巅，无BOSS战斗。index57248
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : "圣山之巅"}
			cga.askNpcForObj("圣鸟之巢", [14,11],obj,()=>{
				cb2(true)
			})
		}
	},
	{//4
		intro: '5.与阿鲁卡那斯（23.22）对话，交出【阿斯提亚锥形水晶】获得称号“背叛者”并传送回法兰城，任务完结。',
		workFunc: function(cb2){
			var obj = {act : "map", target : "法兰城"}
			cga.askNpcForObj("圣山之巅", [23,22],obj,()=>{
				cb2(true)
			})
		}
	},
	],
	[//任务阶段是否完成
	function(){//1.前往法兰城里谢里雅堡2楼图书馆（0.74）与阿斯提亚祭司（27.15）对话，获得【阿斯提亚锥形水晶】。
		return cga.findItem('阿斯提亚锥形水晶') != -1 ? true : false;
	},
	function(){//2.双击【阿斯提亚锥形水晶】传送至小岛，前往（64.45）处通过黄色传送石进入通往山顶的路。
		return (cga.GetMapName().indexOf('通往山顶的路') != -1 || cga.GetMapName() == '半山腰') ? true : false;
	},
	function(){//3.通过随机迷宫进入圣鸟之巢。
		return cga.GetMapName() == '圣鸟之巢' ? true : false;
	},
	function(){//4.与圣鸟的子嗣（14.11）对话进入圣山之巅。
		return cga.GetMapName() == '圣山之巅' ? true : false;
	},
	function(){//5.与阿鲁卡那斯（23.22）对话，交出【阿斯提亚锥形水晶】获得称号“背叛者”并传送回法兰城，任务完结。
		return cga.findTitle('背叛者') != -1 ? true :false
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