var fs = require('fs');
var Async = require('async');
var updateConfig = require('../公共模块/修改配置文件');
var teamMode = require('../公共模块/组队模式');

var cga = global.cga;
var configTable = global.configTable;

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','全自动肯吉罗岛练级')
	},5000)
}

var playerinfo = cga.GetPlayerInfo();
var teammates = [
	"UNAの格斗1",
	"UNAの战斧2",
	"UNAの格斗3",
];

var playerinfo = cga.GetPlayerInfo();

cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false


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
	return
}

var talkNpcSayYesToChangeMap = (cb,npcPosArr,type)=>{
	var wait = (cb)=>{
		cga.waitForLocation({moving : true , pos : npcPosArr ,leaveteam : true}, ()=>{
			var originIndex = cga.GetMapIndex().index3
			var originalPos = cga.GetMapXY();
	
			var retry=()=>{
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.TurnTo(npcPosArr[0], npcPosArr[1]);
				if(type == 'index' && cga.GetMapIndex().index3 != originIndex){
					console.log('index发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.x != originalPos.x){
					console.log('x发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.y != originalPos.y){
					console.log('y发生变化，切换地图成功')
					cb(true)
					return
				}
				setTimeout(retry, 5000);
				return
			}
	
			setTimeout(retry, 1000);
		});
	}

    if(cga.isTeamLeader){
		var posArr = cga.get2RandomSpace(npcPosArr[0],npcPosArr[1])
		cga.walkList([
			posArr[0],
			posArr[1],
			posArr[0],
			posArr[1],
			posArr[0],
		], ()=>{
			setTimeout(() => {
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				wait(cb)
			}, 2000);
		});
    }else{
		wait(cb)
    }
	return
}

var loadBattleConfig = ()=>{
	var checkSkill = ()=>{
		var skills = cga.GetSkillsInfo();
		var job = '其他';
		skills.filter((sk)=>{
			if(sk.name.indexOf('补血魔法') >= 0 && sk.lv >= 4){
				job = '传教士'
			}else if(sk.name.indexOf('恢复魔法') >= 0 && sk.lv >= 4){
				job = '巫师'
			}else if(sk.name.indexOf('气功弹') >= 0 && sk.lv >= 4){
				job = '格斗士'
			}else if(sk.name.indexOf('暗黑骑士之力') >= 0){
				job = '暗黑骑士'
			}else if(sk.name.indexOf('神圣光芒') >= 0){
				job = '圣骑士'
			}
			return '';
		});
		return job;
	}
	

	var settingpath = cga.getrootdir() + '\\战斗配置\\'
	var role = checkSkill()
	if (role == '传教士'){
		settingpath = settingpath + 'BOSS传教.json'

	}else if (role == '巫师'){
		settingpath = settingpath + 'BOSS巫师.json'

	}else if (role == '格斗士'){
		settingpath = settingpath + 'BOSS格斗.json'

	}else if (role == '暗黑骑士'){
		settingpath = settingpath + 'BOSS暗黑骑士.json'

	}else if (role == '圣骑士'){
		settingpath = settingpath + 'BOSS圣骑士.json'

	}else{
		settingpath = settingpath + 'BOSS合击.json'
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
// TODO任务没有写完，需要完善打完白鬼后续的部分
var task = cga.task.Task('半山1(彷徨的亡灵)', [
	{//1
		intro: '1.进行一些前期处理工作',
		workFunc: function(cb2){
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}else{
				cb2(true)
			}
		}
	},
	{//2
		intro: '2.前往法兰城里谢里雅堡1楼与士兵海德（81.18）对话，获得【海德的好运符】id491667。',
		workFunc: function(cb2){
			cga.travel.falan.toStone('C', (r)=>{
				cga.walkList([
				[41, 50, '里谢里雅堡 1楼'],
				[80, 18],
				], (r)=>{
					cga.AsyncWaitNPCDialog(dialogHandler);
					cga.TurnTo(81, 18);
					setTimeout(()=>{
						cb2(true);
					}, 3000);
				});
			});
		}
	},
	{//3
		intro: '3.前往蒂娜村，夜晚与亡魂？（64.51）对话，交出【海德的好运符】进入战斗。',
		workFunc: function(cb2){
			/**
			 * 道具服亡魂140级，喽啰130级。
			 * 1白鬼BOSS，招4个蓝鬼喽啰。
			 * 只有4个喽啰全都死了，才继续召唤补足4个
			 * BOSS攻击力非常高，130级血攻人被他普攻打一下1000点血
			 * BOSS会超强的毒、睡，记得带抗咒和净化
			 * 由于蓝鬼经常防强力冰冻，所以网上推荐收宠W站位。BOSS则是超强属性魔法，怎么站都一样
			 * 全队130级收宠W站位打不过，原因主要是来自于：
			 * 1、BOSS咒术导致传教被控
			 * 2、蓝鬼闪避过高，清掉蓝鬼前，人都死光了。
			 * 
			 * 网站攻略信息：
			 * Lv.140亡灵，邪魔系，血量约22000，属性：火20风80，抗咒；技能：攻击、防御、乾坤一掷、连击、超强火焰魔法、超强风刃魔法、超强昏睡魔法、超强中毒魔法、召唤幽灵*4（幽灵全部被击倒后追加）
			 * Lv.130幽灵*4，不死系，血量约9000，属性：地20水80，不抗咒；技能：攻击、防御、圣盾、强力中毒魔法、强力遗忘魔法、强力陨石魔法、强力冰冻魔法
			 * 
			 * 1.站位：W站位，因为蓝鬼会强力魔法和强力咒术，W站位可以减少对方强力魔法和强力咒术的覆盖面积，并且加速异常状态的自动解除。宠物没有抗魔，属性和抗性也未必达到要求，所以不建议带宠。
			 * 2.饰品：饰品选择树叶及腕轮，如果没有2转，腕轮可以选择替代的首饰有爱情之力、女武士、新村任务所得首饰、南瓜头等，根据自身队伍决定搭配。
			 * 3.装备：适合等级的白板装即可，有条件的可以加上宝石，能穿重套的都可以选择重套，提高魔抗。
			 * 4水晶：仍然推荐纯地或者风地，强袭水晶可选。白鬼输出较高，但是大部分回合还是咒术，蓝鬼反之。
			 * 5.武器：9绿斧子。防御的法系推荐9紫武器。
			 * 6.补给：本次任务准备了400血一车。分摊每个号4组，最后剩余9组+2，算10组，半山1~3总共用去10组，分摊每个号2组。新人自行决定数量，多带点总是没错的。
			 * 7.打法：
			 * ①.W站位，1奶4攻人，输出足够且奶量足够可直接白鬼，但是自强一般消耗会加大，而且容易灭团。可以先消灭1~3只蓝鬼后再合击白鬼。
			 * ②.祈祷、反转白鬼都是很好的减伤技能，石化中毒可控制或输出蓝鬼。
			 * ③.法师可单陨石砸蓝鬼，伤害可观，可一打一防。脆皮可以全程防御。
			 *  */
			cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
				cga.walkList([
					[63, 51],
					], (r)=>{
						cga.AsyncWaitNPCDialog(dialogHandler);
						cga.TurnTo(64, 51);
						setTimeout(()=>{
							cb2(true);
						}, 3000);
					});
			});
		}
	},
	{//4
		intro: '4.战斗胜利后与亡魂？对话，获得【修特的项链】。',
		workFunc: function(cb2){
			
		}
	},
	{//5
		intro: '5.返回法兰城里谢里雅堡1楼与士兵海德对话，交出【修特的项链】获得【海德的戒指】、称号“追查真相中”，任务完结。',
		workFunc: function(cb2){
			
		}
	},
	],
	[//任务阶段是否完成
		function(){//0.前期处理。
			return false;
		},
		function(){//1.前往法兰城里谢里雅堡1楼与士兵海德（81.18）对话，获得【海德的好运符】。
			return (cga.getItemCount('海德的好运符') > 0) ? true : false;
		},
	]
	);

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		cga.SayWords('欢迎使用【UNAの脚本】，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			console.log('【' + configTable.mainPlugin + '】任务完成')
			return
		});
		return false;
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(teamMode.translate(pair))
			return true;
		
		// if(pair.field == 'listenPort'){
		// 	pair.field = '监听端口';
		// 	pair.value = pair.value;
		// 	pair.translated = true;
		// 	return true;
		// }
		return false;
	},
	loadconfig : (obj)=>{

		// if(!teamMode.loadconfig(obj))
		// 	return false;
		
		// configTable.listenPort = obj.listenPort;
		// thisobj.listenPort = obj.listenPort
		
		// if(!thisobj.listenPort){
		// 	console.error('读取配置：监听端口失败！');
		// 	return false;
		// }
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([teamMode.inputcb, 
	], cb);
	},
	execute : ()=>{
		// io.listen(thisobj.listenPort);
		callSubPlugins('init');
		loadBattleConfig()
		loop();
	},
}

module.exports = thisobj;