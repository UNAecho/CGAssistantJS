var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

// 注意CG官方的翻译是咖哩而不是咖喱
var MissionName = '咖哩任务'

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','通用挂机脚本')
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

var checkItem = (item, cb)=>{
	if(cga.findItem(item) != -1){
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
		intro: '2.前往维诺亚村荷特尔咖哩店（49.58）与村姑诗特（11.6）对话，获得【料理？】。',
		workFunc: function(cb2){
			var villageName = '维诺亚村'
			var NPCroom = '荷特尔咖哩店'
			var NPCpos = [11, 6]
			var item = 18320
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
		intro: '3.前往伊尔村旧金山酒吧（32.65）与服务生霍特（14.12）对话，交出【料理？】获得【点心？】。',
		workFunc: function(cb2){
			var villageName = '伊尔村'
			var NPCroom = '旧金山酒吧'
			var NPCpos = [14, 12]
			var item = 18321
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
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88,'芙蕾雅'],
						[681, 343, villageName],
						], go);
				});
			}
		}
	},
	{//3
		intro: '4.前往圣拉鲁卡村食品店（50.64）与新娘莎瓦（16.9）对话，交出【点心？】获得【点心？】。',
		workFunc: function(cb2){
			var villageName = '圣拉鲁卡村'
			var NPCroom = '食品店'
			var NPCpos = [16, 9]
			var item = 18322
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
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88,'芙蕾雅'],
						[134, 218, villageName],
						], go);
				});
			}
		}
	},
	{//4
		intro: '5.返回维诺亚村荷特尔咖哩店与村姑诗特对话，交出【点心？】，生产系（护士、医生除外）获得晋阶资格，任务完结。',
		workFunc: function(cb2){
			var villageName = '维诺亚村'
			var NPCroom = '荷特尔咖哩店'
			var NPCpos = [11, 6]
			var item = 18322

			var go = () => {
				cga.travel.autopilot(NPCroom,()=>{
					giveNPCItem(item, NPCpos, cb2)
				})
			}

			var mainMap = cga.travel.switchMainMap()
			if(mainMap == villageName){
				go()
			}else{
				healMode.func(()=>{
					cga.walkList([
						[41, 98, '法兰城'],
						[153, 241, '芙蕾雅'],
						[473, 316],
					], ()=>{
						cga.TurnTo(472, 316);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitMovement({map:'维诺亚洞穴 地下1楼', delay:1000, timeout:5000}, (err)=>{
								if(err){
									console.error('出错，请检查..')
									return;
								}
								cga.walkList([
									[20,59,'维诺亚洞穴 地下2楼'],
									[24,81,'维诺亚洞穴 地下3楼'],
									[26,64,'芙蕾雅'],
									[330,480,'维诺亚村'],
									], go);
								});
							});
					})
				})
			}
		}
	},
	],
	[//任务阶段是否完成
		function(){//1.任务准备
			return false;
		},
		function(){//2.前往维诺亚村荷特尔咖哩店（49.58）与村姑诗特（11.6）对话，获得【料理？】。
			return cga.findItem(18320) != -1 ? true : false;
		},
		function(){//3.前往伊尔村旧金山酒吧（32.65）与服务生霍特（14.12）对话，交出【料理？】获得【点心？】。
			return cga.findItem(18321) != -1 ? true : false;
		},
		function(){//4.前往圣拉鲁卡村食品店（50.64）与新娘莎瓦（16.9）对话，交出【点心？】获得【点心？】。
			return cga.findItem(18322) != -1 ? true : false;
		},
		function(){//5.返回维诺亚村荷特尔咖哩店与村姑诗特对话，交出【点心？】，生产系（护士、医生除外）获得晋阶资格，任务完结。
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
		loop();
	},
}

module.exports = thisobj;