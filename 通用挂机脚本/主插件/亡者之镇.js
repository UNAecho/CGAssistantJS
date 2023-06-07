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
		'UNAの传教士',
		'UNAの格斗1',
		'UNAの格斗2',
		'UNAの战斧2',
		'UNAの战斧3',
	],[
		'UNAの暗黑骑士',
		'UNAの饲养师',
		'UNAの剑士',
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
		updateConfig.update_config({'mainPlugin' : '圣鸟之谜'})
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
 * 守信用的水手坐标核实为669，319.如果是随机刷取坐标，需要定位再对话
 * ◆完成《圣鸟之谜》任务前不可再重解本任务
 */
var task = cga.task.Task(configTable.mainPlugin, [
	{//0
		intro: '1.前往法兰城里谢里雅堡2楼西边走廊尽头的图书馆（0.74）与博学者（18.19）对话，获得【项链的情报】、【修特的项链】。双击【修特的项链】获得【航海图】。',
		workFunc: function(cb2){
			var item1 = {act : 'item', target : '项链的情报', npcpos : [18,19], waitLocation: '圣山之巅'}
			var item2 = {act : 'item', target : '修特的项链', npcpos : [18,19], waitLocation: '圣山之巅'}

			var checkItem = (cb)=>{
				let itemPos1 = cga.findItem(item1.target)
				let itemPos2 = cga.findItem(item2.target)
				if(itemPos1 != -1 && itemPos2 == -1){
					console.log('没有', item2.target, '丢弃', item1.target)
					cga.DropItem(itemPos1);
					setTimeout(() => {
						cb2('restart stage');
					}, 2000);
					return
				}else if(itemPos1 == -1 && itemPos2 != -1){
					console.log('没有', item1.target, '丢弃', item2.target)
					cga.DropItem(itemPos2);
					setTimeout(() => {
						cb2('restart stage');
					}, 2000);
					return
				}else if(itemPos1 != -1 && itemPos2 != -1){
					cga.UseItem(itemPos2);
					cga.AsyncWaitNPCDialog((dlg)=>{
						cga.ClickNPCDialog(1, 0);
						setTimeout(() => {
							cb2(true);
						}, 1000);
					});
				}else{
					cb(null)
				}
				return
			}

			healMode.func(()=>{
				checkItem(()=>{
					if(cga.getInventoryEmptySlotCount() > 1){
						cga.travel.falan.toStone('C', (r)=>{
							cga.travel.autopilot(1504,()=>{
								cga.askNpcForObj(item2,()=>{
									checkItem(null)
								})
							})
						});
					}else{
						throw new Error('包满了，无法获得任务物品，本次任务物品需要2格')
					}
				})
				return
			})
		}
	},
	{//1
		intro: '2.前往蒂娜村，出村南门前往莎莲娜岛（668.321）处与守信用的水手对话，交出【航海图】获得【止吐药】并传送至圣玛利亚号。',
		workFunc: function(cb2){

			var villageObj = {
				'name' : '蒂娜村',
				'exit' : [44, 62, '莎莲娜']
			}

			var go = (cb)=>{
				cga.walkList([
					[668, 319],
				], ()=>{
					let npc = cga.findNPC('守信用的水手');
					let target = cga.getRandomSpace(npc.xpos,npc.ypos);
					cga.walkList([
						target,
					], ()=>{
						cga.turnTo(npc.xpos, npc.ypos);
						cga.AsyncWaitNPCDialog(dialogHandler);
						// 圣玛丽亚号
						cga.waitForLocation({mapindex : 57179}, ()=>{
							cb(true)
						});
					})
				})
			}

			configMode.manualLoad('生产赶路')
			if(cga.GetMapIndex().index3 == 400){
				go(cb2)
			}else{
				healMode.func(()=>{
					cga.travel.falan.toStone('C', (r)=>{
						cga.travel.autopilot(1522,()=>{
							let timeRange = cga.getTimeRange()
							if(timeRange == '黄昏' || timeRange == '夜晚'){
								villageObj['name'] = '杰诺瓦镇'
								villageObj['exit'] = [71, 18, '莎莲娜']
							}
							cga.travel.falan.toTeleRoom(villageObj['name'], ()=>{
								cga.travel.autopilot('主地图',()=>{
									cga.walkList([
										villageObj['exit']
										], ()=>{
											go(cb2)
										});
								})
							});
						})
					});
				})
			}
		}
	},
	{//2
		intro: '3.等待约10分钟后与守信用的水手对话，交出【止吐药】传送至小岛。',
		workFunc: function(cb2){
			var retry = ()=>{
				cga.TurnTo(44, 25);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg && dlg.message.indexOf('我们到了') >= 0){
						cga.ClickNPCDialog(1, 0);
						// 小岛index57176
						cga.waitForLocation({mapindex:57176}, ()=>{
							cb2(true)
						});
						return;
					}
					
					setTimeout(retry, 5000);
				});
			}
			cga.walkList([
				[43, 25],
			], retry);
		}
	},
	{//3
		intro: '4.与瑞娜的父亲（70.81）对话，选“否”交出【项链的情报】获得【巧克力】。',
		workFunc: function(cb2){
			var obj = {act : 'item', target : '巧克力', neg : '因为这件事', npcpos : [70,81], waitLocation: 57176}
			waitMembers([66,98],[65,98],()=>{
				// 赶路用
				configMode.manualLoad('练级')

				cga.askNpcForObj(obj,()=>{
					cb2(true)
				})
			})
		}
	},
	{//4
		intro: '5.与罗伯尼克博士（59.78）对话，交出【巧克力】获得【金属探测仪】。',
		workFunc: function(cb2){
			var obj = {act : 'item', target : '金属探测仪', npcpos : [59,78], waitLocation: 57176}
			cga.askNpcForObj(obj,()=>{
				cb2(true)
			})
		}
	},
	{//5
		intro: '6.持有【星鳗饭团】与觅食的水龙蜥（82.20）对话，交出【星鳗饭团】进入达尔文海海底。',
		/**
		 * ◆只需队长持有1片【星鳗饭团】与觅食的水龙蜥对话，全队即可进入达尔文海海底；建议向玩家购买，也可花费10000G于小岛上的酒吧老板（55.81）处购买
		 * ◆达尔文海海底为随机迷宫，约12层；魔物为水龙蜥、水晶螃蟹、蜥蜴斗士（怀旧服为Lv.49~59；时长/道具服为Lv.119~129）
		 */
		workFunc: function(cb2){
			var obj = {act : 'item', target : '星鳗饭团'}

			// 注意与觅食的水龙蜥对话完毕，地图index并没有变，只是切换到一个密闭的区域，坐标为121,25。
			// 中间有一个黄色随即迷宫传送石(121,20)，进入即是【达尔文海海底地下1楼】index为1589，但可能是随机的，以地图名称为准
			if(cga.isTeamLeader){
				if(cga.findItem(obj.target) == -1){
					cga.walkList([
						[55, 80],
					], ()=>{
						cga.TurnTo(55,81);
						cga.AsyncWaitNPCDialog(dialogHandler);
						setTimeout(() => {
							cb2('restart stage');
						}, 3000);
					});
					return
				}else{
					console.log('已有【', obj.target ,'】跳过酒吧老板购买【',obj.target,'】阶段')
					cga.walkList([
						[81, 20],
					], ()=>{
						cga.TurnTo(82,20);
						cga.AsyncWaitNPCDialog(dialogHandler);
						cga.waitForLocation({mapname : '小岛', pos : [121, 25]}, ()=>{
							setTimeout(() => {
								cb2(true)
							}, 2000);
						});
					});
				}
			}else{
				cga.waitForLocation({mapname : '小岛', pos : [121, 25]}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//6
		intro: '7.通过随机迷宫进入深海秘窟',
		workFunc: function(cb2){
			// 深海秘窟战斗前index57177
			// 战斗后index57178
			// 不管BOSS战前战后，坐标都是20,17，对话都只有一个确定键
			var obj1 = {act : 'map', target : 57177}
			var obj2 = {act : 'map', target : 57178}

			var walkMaze = (cb)=>{
				var map = cga.GetMapName();
				if(map == obj2.target){
					cb2(true)
					return;
				}
				if(map == '小岛'){
					cga.walkList([
						[121,20, '达尔文海海底地下1楼'],
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
				cga.waitForLocation({mapname : obj1.target}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//7
		intro: '8.与深海领主(20, 17)对话进入战斗。',
		/**
		 * Lv.144深海领主，血量约21000，邪魔系，属性：火80风20；技能：攻击、防御、诸刃、气功弹、超强陨石魔法、超强火焰魔法
		 * Lv.135水晶螃蟹*6，血量约4000，邪魔系，属性：水80火20，不抗咒；技能：攻击、防御、连击、诸刃
		 * BOSS的气功弹和诸人都很痛，1500血左右
		 * 可以战栗BOSS，没蓝基本不动
		 * BOSS不管战前战后，对话都只有一句话，一个确定键
		 */
		workFunc: function(cb2){
			var obj = {act : 'map', target : 57178}

			console.log('请手动战斗，胜利后脚本自动继续..')

			if(cga.isTeamLeader){
				cga.waitTeammateReady(null, (r)=>{
					configMode.manualLoad('手动BOSS')
					r('ok')
					return
				}, (r)=>{
					cga.walkList([
						[20,16],
						], ()=>{
							// 暂时手动打BOSS
							// cga.turnTo(20, 17);
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
					r('ok')
					return
				}, (r)=>{
					cga.waitForLocation({mapname : obj.target}, ()=>{
						cb2(true)
					});
					return
				})
			}
		}
	},
	{//8
		intro: '9.战斗胜利后与深海领主(20, 17)对话，交出【金属探测仪】获得【机器零件】并传送回小岛。',
		/**
		 * 与BOSS对话完毕被单人传送至小岛，队长需要读取逃跑配置，走1格至82，22等待队员82，21入队
		 * 队员加入完毕后，队长恢复组队赶路模式并继续逻辑
		 */
		workFunc: function(cb2){
			var obj = {act : 'item', target : '机器零件', npcpos : [20,17], waitLocation: 57178}
			cga.askNpcForObj(obj,()=>{
				cb2(true)
			})
		}
	},
	{//9
		intro: '10.与罗伯尼克博士（59.78）对话，交出【机器零件】获得【博士的腕轮】，任务完结。',
		workFunc: function(cb2){
			var obj = {act : 'item', target : '博士的腕轮', npcpos : [59,78], waitLocation: 57176}
			// 防止队长走1格遇敌
			configMode.manualLoad('生产赶路')
			waitMembers([82,22],[82,21],()=>{
				// 回去的路上依然有敌人
				configMode.manualLoad('练级')

				cga.askNpcForObj(obj,()=>{
					cb2(true)
				})
			})
		}
	},
	],
	[//任务阶段是否完成
	function(){//1.前往法兰城里谢里雅堡2楼西边走廊尽头的图书馆（0.74）与博学者（18.19）对话，获得【项链的情报】、【修特的项链】。双击【修特的项链】获得【航海图】。
		return (cga.findItem('航海图') != -1 && cga.findItem('项链的情报') != -1)? true : false;
	},
	function(){//2.前往蒂娜村，出村南门前往莎莲娜岛（668.321）处与守信用的水手对话，交出【航海图】获得【止吐药】并传送至圣玛利亚号。
		return cga.GetMapIndex().index3 == 57179 ? true : false;
	},
	function(){//3.等待约10分钟后与守信用的水手对话，交出【止吐药】传送至小岛。
		return cga.GetMapName() == '小岛' ? true : false;
	},
	function(){//4.与瑞娜的父亲（70.81）对话，选“否”交出【项链的情报】获得【巧克力】。
		return cga.findItem('巧克力') != -1 ? true : false;
	},
	function(){//5.与罗伯尼克博士（59.78）对话，交出【巧克力】获得【金属探测仪】。
		return cga.findItem('金属探测仪') != -1 ? true : false;
	},
	function(){//6.持有【星鳗饭团】与觅食的水龙蜥（82.20）对话，交出【星鳗饭团】进入达尔文海海底。
		var mapName = cga.GetMapName()
		var XY = cga.GetMapXY()
		if(mapName == '小岛' && XY.y <= 26){
			return true
		}
		return false
	},
	function(){//7.通过随机迷宫进入深海秘窟。
		return cga.GetMapIndex().index3 == 57177 ? true : false;
	},
	function(){//8.与深海领主对话进入战斗。
		return cga.GetMapIndex().index3 == 57178 ? true : false;
	},
	function(){//9.战斗胜利后与深海领主对话，交出【金属探测仪】获得【机器零件】并传送回小岛。
		return cga.findItem('机器零件') != -1 ? true : false;
	},
	function(){//10.与罗伯尼克博士（59.78）对话，交出【机器零件】获得【博士的腕轮】，任务完结。
		return false;
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