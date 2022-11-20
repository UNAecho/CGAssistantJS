var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

// 任务名称
var MissionName = '起司的任务'

// 计时
var timer = null
// 计时显示开关
var timeLoggerRunning = false
// 十分钟的毫秒数
var tenMinute = 1000 * 60 * 10

// 每次最长挂机时间1931.622秒3603000
// 计时器
var timerfunc = ()=>{
	if(!timer){
		return 0
	}
	var timeCost = (Date.now() - timer) / 1000 / 60
	console.log('计时器：已经过' + timeCost + '分。')
	if(timeCost >= 59 && timeCost <= 61){
		console.log('【UNA脚本提醒】距离上次收到任务道具已经过【' +timeCost+ '】分，处于59-61分钟之间，此时是提交任务道具的最好时机')
	}
	return timeCost
}

// 计时显示
var timeLogger = ()=>{
	if(timeLoggerRunning){
		timerfunc()
	}
	
	setTimeout(timeLogger, 60000);
}

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','通用挂机脚本')
	},5000)
}

var dialogHandler = (err, dlg)=>{
	if(dlg){
		// 用于收集NPC反馈
		console.log(dlg.message)
	}

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

var checkItem = (item, cb)=>{
	if(cga.findItem(item) != -1){
		// 拿到物品开始计时
		timer = Date.now()
		timeLoggerRunning = true
		if (cb) cb(true)
		return
	}
	setTimeout(checkItem, 1000, item, cb);
	return
}

var askNPCForItem = (NPCpos, cb)=>{
	var emptySlotCount = cga.getInventoryEmptySlotCount();

	if (emptySlotCount == 0){
		throw new Error('背包满了，请清理。')
	}

	var target = cga.getRandomSpace(NPCpos[0],NPCpos[1])
	cga.walkList(
		[target], ()=>{
			cga.turnTo(NPCpos[0],NPCpos[1]);
			cga.AsyncWaitNPCDialog(dialogHandler);
			if (cb) cb(true)
			return
	});			
}
var giveNPCItem = (item, NPCpos, cb)=>{
	// 检查道具是否持有
	if(cga.findItem(item) == -1){
		throw new Error('你没有【' + item +'】道具')
	}
	// 每秒检查道具交付情况
	var checkGiveItem = (item)=>{
		if(cga.findItem(item) == -1){
			timeLoggerRunning = false
			if (cb) cb(true)
			return
		}
		setTimeout(checkGiveItem, 1000, item);
		return
	}

	var target = cga.getRandomSpace(NPCpos[0],NPCpos[1])
	cga.walkList(
		[target], ()=>{
			checkGiveItem(item)
			setTimeout(() => {
				cga.turnTo(NPCpos[0],NPCpos[1]);
				cga.AsyncWaitNPCDialog(dialogHandler);
			}, 500);
			return
	});			
}
/**
 * 拿到【好像很好吃的起司】开始计时。本任务需要花费2小时左右完成任务，生产系（医生、护士除外）才能获得2转资格
 * 获得本任务相关【道具】后无法再使用各村落间传送石，任务道具登出回消失，只可徒步行走；
 * 若想节约行走时间，可通过战斗将角色飞回城、卡交易、使用【各村传送券】、使用【纪念羽毛】（怀旧服《法兰城周年庆》任务获得）等方法传送回法兰城
 * 时间与【奖品】：（从拿到【好像很好吃的起司】开始计算，向努波交出为第一阶时间，向德特老爷爷交出为总时间）
 * 
 * 进入维诺亚洞窟方法：等级不足Lv.20的生产系，采集系与制造系需携带本职业3级物品（采集系材料需为20个）；服务系需本职业技能达到3级方可进入维诺亚洞窟
 * 
 * 通过索奇亚海底洞窟（海底）方法：地下1楼与战士巴其鲁（8.37）对话，生产系（不包括护士、医生）、游民：选“是”单人通过；或者在《拦路的热砂》获得【欧兹尼克戒指】后，持有后对话战士巴其鲁全队通过
 * 
 * 通过哈巴鲁东边洞穴（哈洞）方法：生产系和游民可与地下2楼的矿工尤达彭（33.3）交出500G传送到杀熊者欧兹那克后方；或者打倒《杀熊者欧兹那克》的「杀熊者欧兹那克」后通过。
 * 
 * 进入莎莲娜海底洞窟方法：等级不足Lv.25的生产系，可先在加纳村西边的波塔洞窟（671.157）以2000G购买【伪造的通行证】；持有【伪造的通行证】与莎莲娜海底洞窟外卫兵对话，若检验为有效可通过进入；
 * 【伪造的通行证】可能被卫兵检验出是无效的，若为无效则需返回重新购买直至检验为有效的为止；使用技能Lv.6鉴定【伪造的通行证】后物品右键说明显示“可以以假乱真.....”则为有效。转职战斗系后持有【伪造的通行证】无效。
 */
var task = cga.task.Task(MissionName, [
	{//0
		intro: '1.任务准备',
		workFunc: function(cb2){
			healMode.func(()=>{
				setTimeout(() => {
					cb2(true)
				}, 3000);
			})
		}
	},
	{//1
		intro: '2.前往加纳村酒吧（51.34）与葛达对话，选“是”交出100G获得【好像很好吃的起司】。',
		workFunc: function(cb2){
			var villageName = '加纳村'
			var NPCroom = '酒吧'
			var NPCpos = [13, 5]
			var item = '好像很好吃的起司'
			checkItem(item, cb2)

			var go = () => {
				cga.travel.autopilot(NPCroom,()=>{
					askNPCForItem(NPCpos)
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				cga.travel.falan.toTeleRoom(villageName, (r)=>{
					go()
				});
			}
		}
	},
	{//2
		intro: '3.从现在开始直至任务结束，都必须徒步。而且必须在刚好1小时的时候交付任务道具。先徒步至奇利村，全程逃跑约5分钟',
		workFunc: function(cb2){
			var villageName = '加纳村'

			var go = () => {
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[47, 77, '索奇亚'],
						[402, 304, '角笛大风穴'],
						[18, 6, '索奇亚'],
						[294, 325, '奇利村'],
					], ()=>{
						setTimeout(cb2, 1000, true);
					});	
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//3
		intro: '4.徒步至维诺亚村，全程逃跑约3分钟。到达维诺亚村时，距离加纳村拿到起司大概8分钟。',
		workFunc: function(cb2){
			var villageName = '奇利村'

			var go = () => {
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[59, 45, '索奇亚'],
						[240, 265, 15004],
						[7, 42],
					], ()=>{
						cga.turnDir(6);
						cga.AsyncWaitNPCDialog(dialogHandler);
						cga.waitForLocation({mapindex : 15004, pos : [7, 39]}, ()=>{
							cga.walkList([
								[24, 13, 15003],
								[49, 46, 15005],
								[10, 5, 100],
								[330, 481, 2100],
							], ()=>{
								setTimeout(cb2, 1000, true);
							});	
						});
					});	
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				cga.travel.toHospital(false,()=>{
					go()
				})
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//4
		intro: '5.徒步至伊尔村，全程逃跑约6分钟。到达伊尔村时，距离加纳村拿到起司大概12分钟。',
		workFunc: function(cb2){
			var villageName = '维诺亚村'

			var go = () => {
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[67, 47, '芙蕾雅'],
						[442, 349, 11002],
						[35, 10, 11001],
						[34, 14, 11000],
						[20, 14, '芙蕾雅'],
						[681, 343, '伊尔村'],
					], ()=>{
						setTimeout(cb2, 1000, true);
					});	
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				cga.travel.toHospital(false,()=>{
					go()
				})
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//5
		intro: '6.徒步至亚留特村，全程逃跑约4分钟。到达亚留特村时，距离加纳村拿到起司大概16分钟。',
		workFunc: function(cb2){
			var villageName = '伊尔村'

			var go = () => {
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[45, 31, '芙蕾雅'],
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
							], ()=>{
								setTimeout(cb2, 1000, true);
							});
					});	
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				cga.travel.toHospital(false,()=>{
					go()
				})
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//6
		intro: '7.前往亚留特村村长的家，在获得【好像很好吃的起司】后的1小时左右与努波对话，交出100G获得【好像很好喝的酒】。',
		workFunc: function(cb2){
			var villageName = '亚留特村'
			var NPCroom = '村长的家'
			var NPCpos = [17, 11]
			var item = '好像很好喝的酒'
			checkItem(item, cb2)

			var go = () => {
				cga.travel.autopilot(NPCroom,()=>{
					askNPCForItem(NPCpos)
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//7
		intro: '8.徒步至法兰城，全程逃跑约4分钟',
		workFunc: function(cb2){
			var villageName = '亚留特村'

			var go = () => {
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[66, 64, '芙蕾雅'],
						[691, 188, 11005],
						[21, 39, 11004],
						[17, 16],
					], ()=>{
						cga.ForceMove(2, true);
						cga.ForceMove(2, true);
						cga.walkList([
							[62, 65, '哈巴鲁东边洞穴 地下1楼'],
							[9, 37, '芙蕾雅'],
							[470, 196, '法兰城'],
						], ()=>{
							setTimeout(cb2, 1000, true);
						});	
					});	
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//8
		intro: '9.徒步至杰诺瓦镇',
		workFunc: function(cb2){
			var villageName = '法兰城'

			var go = () => {
				cga.walkList([
					[82, 83, '医院'],
					], ()=>{
						cga.walkList([
							[9, 31,],
						], ()=>{
							setTimeout(() => {
								cga.turnDir(6);
								setTimeout(() => {
									cga.walkList([
										[12, 42, '法兰城'],
									], ()=>{
										cga.walkList([
											//西门
											[22, 88, '芙蕾雅'],
										], ()=>{
											cga.walkList([
												[201, 166],
											], ()=>{
												cga.TurnTo(201, 165);
												cga.AsyncWaitNPCDialog(()=>{
													cga.ClickNPCDialog(1, -1)
													cga.AsyncWaitMovement({map:15000, delay:1000, timeout:5000}, (err)=>{
														if(err){
															console.error('出错，请检查..')
															return;
														}
														cga.walkList([
															[20,8,'莎莲娜海底洞窟 地下2楼'],
															[11,9,'莎莲娜海底洞窟 地下1楼'],
															[24,11,'莎莲娜'],
															[217,455,'杰诺瓦镇'],
															], ()=>{
																setTimeout(cb2, 1000, true);
																});
														});
													});
												});
										})
									});	
								}, 5000);
							}, 1000);
						});	
					});
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	{//9
		intro: '10.前往杰诺瓦镇民家（38.59），在获得【好像很好喝的酒】后的1小时左右与德特老爷爷对话。若被告知为好吃则代表时间刚好并获得晋阶资格，选“确定”交出【好像很好吃的起司】、【好像很好喝的酒】根据时间不同随机获得【奖品】，任务完结。',
		workFunc: function(cb2){
			var villageName = '杰诺瓦镇'
			var NPCroom = '民家'
			var NPCpos = [9, 3]
			var item = '好像很好喝的酒'

			var go = () => {
				cga.travel.autopilot(NPCroom,()=>{
					giveNPCItem(item, NPCpos, cb2)
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				cga.travel.toHospital(false,()=>{
					go()
				})
			}else{
				throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
			}
		}
	},
	],
	[//任务阶段是否完成
		function(){//1.任务准备
			return false;
		},
		function(){//2.前往加纳村酒吧（51.34）与葛达对话，选“是”交出100G获得【好像很好吃的起司】。
			return false;
		},
		function(){//3.从现在开始直至任务结束，都必须徒步。而且必须在刚好1小时的时候交付任务道具。先徒步至奇利村
			return false;
		},
		function(){//4.徒步至维诺亚村
			return false;
		},
		function(){//5.徒步至伊尔村
			return false;
		},
		function(){//6.徒步至亚留特村
			return false;
		},
		function(){//7.前往亚留特村村长的家，在获得【好像很好吃的起司】后的1小时左右与努波对话，交出100G获得【好像很好喝的酒】。
			return false;
		},
		function(){//8.徒步至法兰城
			return false;
		},
		function(){//9.徒步至杰诺瓦镇
			return false;
		},
		function(){//10.前往杰诺瓦镇民家（38.59），在获得【好像很好喝的酒】后的1小时左右与德特老爷爷对话。若被告知为好吃则代表时间刚好并获得晋阶资格，选“确定”交出【好像很好吃的起司】、【好像很好喝的酒】根据时间不同随机获得【奖品】，任务完结。
			return false;
		},
	]
	);

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		cga.SayWords('欢迎使用【UNAの全自动练级+转正+烧技能脚本】，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			var minssionObj = {MissionName : true}
			cga.refreshMissonStatus(minssionObj,()=>{
				console.log('【' + configTable.mainPlugin + '】完成')
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

		if(!supplyMode.loadconfig(obj))
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
		Async.series([teamMode.inputcb,], cb);
	},
	execute : ()=>{
		callSubPlugins('init');
		configMode.manualLoad('生产赶路')
		timeLogger()
		loop();
	},
}

module.exports = thisobj;