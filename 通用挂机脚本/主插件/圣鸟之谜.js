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
		updateConfig.update_config({'mainPlugin' : '小岛之谜'})
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

var goToIsland = (cb) => {
	var villageObj = {
		"name" : "蒂娜村",
		"exit" : [44, 62, '莎莲娜']
	}

	var go = (cb)=>{
		cga.walkList([
			[668, 319],
		], ()=>{
			cga.turnTo(669, 319);
			cga.AsyncWaitNPCDialog(dialogHandler);
			// 小岛
			cga.waitForLocation({mapindex : 57176}, ()=>{
				cb(true)
			});
		})
	}
	// 单人赶路
	configMode.manualLoad('生产赶路')

	if(cga.GetMapIndex().index3 == 400){
		go(cb)
	}else{
		healMode.func(()=>{
			cga.travel.falan.toStone('C', (r)=>{
				cga.travel.autopilot(1522,()=>{
					let timeRange = cga.getTimeRange()
					if(timeRange == "黄昏" || timeRange == "夜晚"){
						villageObj["name"] = "杰诺瓦镇"
						villageObj["exit"] = [71, 18, '莎莲娜']
					}
					cga.travel.falan.toTeleRoom(villageObj["name"], ()=>{
						cga.travel.autopilot("主地图",()=>{
							cga.walkList([
								villageObj["exit"]
								], ()=>{
									go(cb)
								});
						})
					});
				})
			});
		})
	}

}

/**
 * UNAecho:开发笔记
 * 守信用的水手坐标核实为669，319.如果是随机刷取坐标，需要定位再对话
 * 【注意】本任务跑图消耗相当大，请备足10级料理
 */
var task = cga.task.Task(configTable.mainPlugin, [
	{//0
		intro: '1.前往蒂娜村，出村南门至莎莲娜岛（668.321）处与守信用的水手对话传至小岛。',
		workFunc: function(cb2){
			healMode.func(()=>{
				goToIsland(cb2)
			})
		}
	},
	{//1
		intro: '2.与罗伯尼博士（59.78）对话传送至地下实验室，调查时光机器（19.11）传至过去的瑞娜的家。',
		/**
		 * 注意要区分是从达尔文海底出来，还是重新坐船来到小岛
		 * 对话完毕被单人传送至【地下实验室】，index57180
		 * 单人走到19，11处对19，10点击，一个确定键传送至【瑞娜的家】，index57181
		 * 走至11，13与11，12瑞娜对话，输入“阿鲁卡那斯”，等待出现对话框，一顿下一步和确定，获得【匆忙写下的笔录】并传送回小岛，博士面前。
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : 57180}

			var XY = cga.GetMapXY();
			if(XY.x >= 80 && XY.y <= 25){
				leaderPos = [82, 22]
				memberPos = [82, 21]
				console.log('检测到你是从达尔文海底出来，集合坐标更换至',leaderPos)
			}

			waitMembers(leaderPos,memberPos,()=>{
				cga.askNpcForObj(57176, [59,78],obj,()=>{
					cga.walkList([
						[19, 11],
					], ()=>{
						cga.turnTo(19, 10);
						cga.AsyncWaitNPCDialog(dialogHandler);
						// 瑞娜的家
						cga.waitForLocation({mapindex : 57181}, ()=>{
							cb2(true)
						});
					})
				})
			})
		}
	},
	{//2
		intro: '3.与瑞娜（10.13）对话，输入“阿鲁卡那斯”获得【匆忙写下的笔录】并传送回小岛。',
		workFunc: function(cb2){
			// 留一个空位给任务物品
			var obj = {act : "map", target : 57176, say : "阿鲁卡那斯"}
			cga.askNpcForObj(57181, [11, 12],obj,()=>{
				cb2(true)
			})
		}
	},
	{//3
		intro: '4.前往法兰城里谢里雅堡2楼图书馆与博学者（18.19）对话，交出【匆忙写下的笔录】获得【鸟类大全】。',
		workFunc: function(cb2){
			var obj = {act : "item", target : "鸟类大全"}
			cga.travel.falan.toStone('C', (r)=>{
				cga.travel.autopilot(1504,()=>{
					cga.askNpcForObj(1504, [18,19],obj,()=>{
						cb2(true)
					})
				})
			});
		}
	},
	{//4
		intro: '5.前往蒂娜村，出南门至莎莲娜岛（668.321）处与守信用的水手对话传送至小岛。',
		workFunc: function(cb2){
			healMode.func(()=>{
				goToIsland(cb2)
			})
		}
	},
	{//5
		intro: '6.与村民（79, 88）对话，交出【鸟类大全】获得【暗号】。',
		/**
		 * ◆若未持有【暗号】，在第9步时与圣鸟的子嗣对话将无效
		 * ◆后续步骤每名队员都需交出1片【星鳗饭团】，若未持有可向小岛上的酒吧老板（55.81）购买（10000G/片）
		 * UNAecho提醒：别设置自动吃料理把【星鳗饭团】给吃了，不要问我是怎么知道的。
		 */
		workFunc: function(cb2){
			var obj1 = {act : "item", target : "星鳗饭团"}
			var obj2 = {act : "item", target : "暗号"}

			waitMembers(leaderPos,memberPos,()=>{
				cga.askNpcForObj(57176, [55, 81],obj1,()=>{
					cga.askNpcForObj(57176, [79, 88],obj2,()=>{
						cb2(true)
					})
				})})

		}
	},
	{//6
		intro: '7.前往小岛（64.45）处通过黄色传送石进入通往山顶的路。',
		/**
		 * ◆通往山顶的路为随机迷宫，分两段；魔物为托罗帝鸟、岩地跑者、火焰啄木鸟、狂奔鸟（怀旧服为Lv.59~65；时长/道具服为Lv.130~134）
		 * UNAecho提醒：别设置自动吃料理把【星鳗饭团】给吃了，不要问我是怎么知道的。
		 */
		workFunc: function(cb2){
			var obj1 = {act : "map", target : "通往山顶的路100M"}
			var obj2 = {act : "map", target : "半山腰"}

			var walkMaze = (cb)=>{
				var map = cga.GetMapName();
				if(map == obj2.target){
					cb2(true)
					return;
				}
				if(map == '小岛'){
					cga.walkList([
						[64,45, obj1.target],
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
				cga.waitForLocation({mapname : obj2.target}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//7
		intro: '8.通过第一段随机迷宫抵达半山腰，前往半山腰（78.52）处进入通往山顶的路1100M，通过第二段随机迷宫后抵达圣鸟之巢。',
		/**
		 * ◆半山腰为固定地图，index57182
		 * UNAecho提醒：别设置自动吃料理把【星鳗饭团】给吃了，不要问我是怎么知道的。
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
			
			// 清怪配置
			configMode.func('节能模式')

			if(cga.isTeamLeader){
				walkMaze(cb2);
			}else{
				cga.waitForLocation({mapname : obj2.target}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//8
		intro: '9.持有1片【星鳗饭团】与圣鸟的子嗣（14.11）对话，输入“我是来送鳗鱼饭的”交出【星鳗饭团】传送至圣山之巅。',
		/**
		 * ◆每名队员都需交出【星鳗饭团】
		 * ◆此处可以使用宠物邮件
		 * 圣鸟之巢index57183
		 * 圣山之巅index57184
		 * UNAecho提醒：别设置自动吃料理把【星鳗饭团】给吃了，不要问我是怎么知道的。
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : "圣山之巅", say : "我是来送鳗鱼饭的"}
			cga.askNpcForObj("圣鸟之巢", [14,11],obj,()=>{
				cb2(true)
			})
		}
	},
	{//9
		intro: '10.与阿鲁卡那斯（23.32）对话进入战斗。',
		/**
		 * ◆战斗信息：（时长/道具服）
		 * 阿鲁卡纳斯（2动），血量约28000，邪魔系，属性：火40风60，抗咒；技能：攻击、防御、混乱攻击、乾坤一掷、强力陨石魔法、强力火焰魔法、超强风刃魔法、超强遗忘魔法
		 * 阿鲁卡那斯之子（2动），血量约13000，邪魔系，属性：水40火60，不抗咒；技能：攻击、防御、混乱攻击、强力陨石魔法、强力冰冻魔法、超强石化魔法
		 * ◆战斗胜利后有几率掉落【阿鲁卡那斯的蛋】，经过3天的孵化随机获得Lv.1岩地跑者或Lv.1布雷欧（双击【阿鲁卡那斯的蛋】前务必保持宠物栏有空位，否则双击后为空气）
		 * UNAecho战斗提醒：
		 * 不要听攻略上写W站位，BOSS的强力魔法不足为惧。带宠物降低大鸟出必杀秒人概率
		 * 战斗类似双王的双BOSS机制，只有2个2动的怪。大鸟的遗忘攻击和普攻有秒杀风险，小鸟则威胁不大
		 * 大鸟攻击都是遗忘类，小鸟攻击都是石化类
		 * 战斗难度很低，保持满血不要被大鸟给出必杀秒了就好。小鸟虽没有威胁，但是石化很讨厌
		 * 大鸟遗忘持续时间很长，最好有净化。但是注意净化的时机，因为就算是遗忘，也比被小鸟石化好些
		 * 整个任务最难的是途中的通往山顶的路，路超长，遇敌率很高，怪数量也大，请带充足料理
		 * 战斗胜利index57185，BOSS坐标23，22
		 */
		workFunc: function(cb2){
			var obj = {act : "map", target : 57185}

			waitMembers([32, 27],[33, 27],()=>{
				console.log('请手动战斗，胜利后脚本自动继续..')
				if(cga.isTeamLeader){
					cga.waitTeammateReady(null, (r)=>{
						configMode.manualLoad('手动BOSS')
						r("ok")
						return
					}, (r)=>{
						cga.walkList([
							[23,23],
							], ()=>{
								// 暂时手动打BOSS
								// cga.turnTo(23, 22);
								// cga.AsyncWaitNPCDialog(dialogHandler);
								cga.waitForLocation({mapname : obj.target}, ()=>{
									cb2(true)
								});
							});
						return
					})
				}else{
					cga.waitTeammateReady(null, (r)=>{
						configMode.manualLoad('手动BOSS')
						r("ok")
						return
					}, (r)=>{
						cga.waitForLocation({mapname : obj.target}, ()=>{
							cb2(true)
						});
						return
					})
				}
			})
		}
	},
	{//10
		intro: '11.战斗胜利后与阿鲁卡那斯对话，交出称号“追查真相中”获得称号“保守秘密的人”、【圣鸟之羽】并传送回小岛，任务完结。',
		/**
		 * 【注意】【圣鸟之羽】在半山7/结界之链还会用到，请不要丢弃
		 */
		workFunc: function(cb2){
			var obj = {act : "item", target : "圣鸟之羽"}
			cga.askNpcForObj("圣山之巅", [23,22],obj,()=>{
				cb2(true)
			})
		}
	},
	],
	[//任务阶段是否完成
	function(){//1.前往蒂娜村，出村南门至莎莲娜岛（668.321）处与守信用的水手对话传至小岛。
		return cga.GetMapName() == '小岛' ? true : false;
	},
	function(){//2.与罗伯尼博士（59.78）对话传送至地下实验室，调查时光机器（19.11）传至过去的瑞娜的家。
		return cga.GetMapIndex().index3 == 57181 ? true : false;
	},
	function(){//3.与瑞娜（10.13）对话，输入“阿鲁卡那斯”获得【匆忙写下的笔录】并传送回小岛。
		return cga.findItem('匆忙写下的笔录') != -1 ? true : false;
	},
	function(){//4.前往法兰城里谢里雅堡2楼图书馆与博学者（18.19）对话，交出【匆忙写下的笔录】获得【鸟类大全】。
		return cga.findItem('鸟类大全') != -1 ? true : false;
	},
	function(){//5.前往蒂娜村，出南门至莎莲娜岛（668.321）处与守信用的水手对话传送至小岛。
		return (cga.GetMapName() == '小岛' && cga.findItem('鸟类大全') != -1) ? true : false;
	},
	function(){//6.与村民（79, 88）对话，交出【鸟类大全】获得【暗号】。
		return cga.findItem('暗号') != -1 ? true : false;
	},
	function(){//7.前往小岛（64.45）处通过黄色传送石进入通往山顶的路。
		return (cga.GetMapName().indexOf('通往山顶的路') != -1 || cga.GetMapName() == '半山腰') ? true : false;
	},
	function(){//8.通过第一段随机迷宫抵达半山腰，前往半山腰（78.52）处进入通往山顶的路1100M，通过第二段随机迷宫后抵达圣鸟之巢。
		return cga.GetMapName() == '圣鸟之巢' ? true : false;
	},
	function(){//9.持有1片【星鳗饭团】与圣鸟的子嗣（14.11）对话，输入“我是来送鳗鱼饭的”交出【星鳗饭团】传送至圣山之巅。
		return cga.GetMapName() == '圣山之巅' ? true : false;
	},
	function(){//10.与阿鲁卡那斯（23.32）对话进入战斗。
		return cga.GetMapIndex().index3 == 57185 ? true : false;
	},
	function(){//11.战斗胜利后与阿鲁卡那斯对话，交出称号“追查真相中”获得称号“保守秘密的人”、【圣鸟之羽】并传送回小岛，任务完结。
		return cga.findItem('圣鸟之羽') != -1 ? true : false;
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