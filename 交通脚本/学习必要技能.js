const thisobj = require('../通用挂机脚本/公共模块/治疗自己');
var fs = require('fs');
var path = require('path');
var cga = require('../cgaapi')(function(){

	var playerinfo = cga.GetPlayerInfo();

	// 提取本地职业信息
	const getprofessionalInfos = require('../常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(playerinfo.job)
	const professionalbehavior = require('../常用数据/Professionalbehavior.js');

	// 提取所属职业系别
	var category = professionalInfo.category
	console.log('当前职业: '+playerinfo.job +'， 所属职业系别 : '+ category)

	// 游民学习不了
	if(category == '初始系'){
		throw new Error('游民不能学习治疗、调教、宠物强化等职业技能，不适合使用当前脚本,')
	}
	// 读取玩家配置：战斗逃跑+原始移速
	var loadplayerconfig = () =>{
		console.log('【注意】即将长途跋涉，已调整为【逃跑】【100%移动速度】，防止人物阵亡过多和移速过快掉线')
		var rootdir = cga.getrootdir()
		var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		cga.gui.LoadSettings(setting,(err, result)=>{})
	}

	var task = cga.task.Task('学习必要技能 : 治疗、调教、宠物强化等', [
	{//0
		intro: '1.学治疗',
		workFunc: function(cb2){
			if(category == '物理系' || category == '魔法系' || category == '魔物系'){
				console.log('通常情况下,战斗系不学习治疗')
				cb2(true)
			}else{
				professionalbehavior(cga, '医师','learning',cb2)
			}
		}
	},
	{//1
		intro: '2.学调教',
		workFunc: function(cb2){
			if(cga.findPlayerSkill('调教')){
				console.log('已经学会调教,跳过')
				cb2(true)
			}else{
				professionalbehavior(cga, '驯兽师','learning',cb2)
			}
		}
	},
	// 使用脚本，练宠效率不需要很高，非饲养师不学习宠物强化了
	{//2
		intro: '3.学宠物强化',
		workFunc: function(cb2){
			if (professionalInfo.jobmainname != '饲养师'){
				console.log('非饲养师不需要宠物强化，脚本练级效率是无限的，跳过')
				cb2(true)
				return
			}else{
				if(cga.findPlayerSkill('宠物强化')){
					console.log('已经学会宠物强化,跳过')
					cb2(true)
				}else{
					professionalbehavior(cga, '饲养师','learning',cb2)
				}
			}
		}
	},
	{//3
		intro: '4.如果是战斗系，检查是否有气绝回复技能（用于刷声望或打BOSS）',
		workFunc: function(cb2){
			if((category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系') && playerinfo.level > 50){
				var hasResurgenceSkill = cga.findPlayerSkill('气绝回复') ? true : false;
				if(!hasResurgenceSkill){
					var goandlearn = ()=>{
						cga.walkList([
							[8, 3, '村长的家'],
							[6,14,'亚留特村'],
							[47,72]
							], ()=>{
								cga.TurnTo(48, 72)
								cga.AsyncWaitNPCDialog((dlg)=>{
									cga.ClickNPCDialog(0, 0);
									cga.AsyncWaitNPCDialog((dlg2)=>{
										cga.ClickNPCDialog(0, 0);
										cb2(true)
									});
								});
							});
					}

					var walktovinoa = (cb)=>{
						loadplayerconfig()
						cga.walkList([
							[25, 24, '里谢里雅堡 1楼'],
							[74, 40, '里谢里雅堡'],
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
									[5,13],[4,14],[5,13],[4,14],[5,13]
									], ()=>{
										// 顺便开传送
										cga.turnTo(5, 14);
										goandlearn()
									});
							});
					}
					cga.travel.falan.toStone('C', ()=>{

						cga.walkList([
							[41, 50, '里谢里雅堡 1楼'],
							[45, 20, '启程之间'],
							[43, 23]
							], ()=>{
								cga.TurnTo(44, 22);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(typeof dlg.message == 'string' && (dlg.message.indexOf('对不起') >= 0 || dlg.message.indexOf('很抱歉') >= 0)){
									walktovinoa()
									return;
								}else{
									cga.ClickNPCDialog(4, -1);
									cga.AsyncWaitMovement({map:'亚留特的传送点', delay:1000, timeout:5000}, goandlearn);
								}});
							});
					});
				}else{
					console.log('已经有气绝回复了，跳过')
					cb2(true)
				}
				
			}else{
				console.log('不是战斗系或等级小于50级，无法单人走到亚留特学气绝，跳过')
				cb2(true)
			}
		}
	},
	{//4
		intro: '5.如果是战斗系，检查是否有单体石化技能（用于刷声望）',
		workFunc: function(cb2){
			if(cga.ismaxbattletitle()){
				console.log('已到达【无尽星空】称号，不需要刷声望')
				cb2(true)
				return
			}
			if (professionalInfo.jobmainname == '暗黑骑士' || professionalInfo.jobmainname == '教团骑士'){
				console.log('暗黑骑士或教团骑士不能刷声望，跳过')
				cb2(true)
				return
			}
			if(category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系'){

				var hasStoneSkill = cga.findPlayerSkill('石化魔法') ? true : false;
				if(!hasStoneSkill){
					cga.travel.falan.toStone('C', (r)=>{
						cga.walkList([
							[17, 53, '法兰城'],
							[120,65],
						], (r)=>{
							cga.TurnTo(120, 64);
							cga.AsyncWaitNPCDialog((dlg)=>{
								cga.ClickNPCDialog(0, 0);
								cga.AsyncWaitNPCDialog((dlg2)=>{
									cga.ClickNPCDialog(0, 0);
									cb2(true)
								});
							});
						});
					});
				}else{
					cb2(true)
				}
			}else{
				cb2(true)
			}
		}
	},
	{//5
		intro: '6.学狩猎',
		workFunc: function(cb2){
			var lumbering = '狩猎'
			if(category == '制造系' || category == '采集系'){
				if(cga.findPlayerSkill(lumbering)){
					console.log('已经学会' + lumbering + ',跳过')
					cb2(true)
				}else{
					professionalbehavior(cga, '猎人','learning',cb2)
				}
			}else{
				console.log('除了制造和采集，其它系别不需要采集狩伐挖技能')
				cb2(true)
			}
		}
	},
	{//6
		intro: '7.学伐木',
		workFunc: function(cb2){
			var lumbering = '伐木'
			if(category == '制造系' || category == '采集系'){
				if(cga.findPlayerSkill(lumbering)){
					console.log('已经学会' + lumbering + ',跳过')
					cb2(true)
				}else{
					professionalbehavior(cga, '樵夫','learning',cb2)
				}
			}else{
				console.log('除了制造和采集，其它系别不需要采集狩伐挖技能')
				cb2(true)
			}
		}
	},
	{//7
		intro: '8.学挖掘',
		workFunc: function(cb2){
			var dig = '挖掘'
			if(category == '制造系' || category == '采集系'){
				if(cga.findPlayerSkill(dig)){
					console.log('已经学会' + dig + ',跳过')
					cb2(true)
				}else{
					professionalbehavior(cga, '矿工','learning',cb2)
				}
			}else{
				console.log('除了制造和采集，其它系别不需要采集狩伐挖技能')
				cb2(true)
			}
		}
	},
	{//8
		intro: '9.抗石化',
		workFunc: function(cb2){
			if((category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系') && playerinfo.level > 50){
				var hasStoneSkill = cga.findPlayerSkill('抗石化') ? true : false;
				if(!hasStoneSkill){
					loadplayerconfig()
					professionalbehavior(cga, '抗石化','learning',cb2)
				}else{
					cb2(true)
				}
			}else{
				console.log('非战斗系或者等级小于50级，无法单人学习技能')
				cb2(true)
			}
		}
	},
	{//9
		intro: '10.抗混乱',
		workFunc: function(cb2){
			if((category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系') && playerinfo.level > 50){
				var hasStoneSkill = cga.findPlayerSkill('抗混乱') ? true : false;
				if(!hasStoneSkill){
					loadplayerconfig()
					professionalbehavior(cga, '抗混乱','learning',cb2)
				}else{
					cb2(true)
				}
			}else{
				console.log('非战斗系或者等级小于50级，无法单人学习技能')
				cb2(true)
			}
		}
	},
	{//10
		intro: '11.抗毒',
		workFunc: function(cb2){
			if((category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系') && playerinfo.level > 50){
				var hasStoneSkill = cga.findPlayerSkill('抗毒') ? true : false;
				if(!hasStoneSkill){
					loadplayerconfig()
					professionalbehavior(cga, '抗毒','learning',cb2)
				}else{
					cb2(true)
				}
			}else{
				console.log('非战斗系或者等级小于50级，无法单人学习技能')
				cb2(true)
			}
		}
	},
	{//11
		intro: '12.抗昏睡',
		workFunc: function(cb2){
			if((category == '物理系' || category == '魔法系' || category == '魔物系' || category == '服务系') && playerinfo.level > 50){
				var hasStoneSkill = cga.findPlayerSkill('抗昏睡') ? true : false;
				if(!hasStoneSkill){
					loadplayerconfig()
					professionalbehavior(cga, '抗昏睡','learning',cb2)
				}else{
					cb2(true)
				}
			}else{
				console.log('非战斗系或者等级小于50级，无法单人学习技能')
				cb2(true)
			}
		}
	},
	],
	[//任务阶段是否完成
		function(){//学治疗
			return (cga.findPlayerSkill('治疗') || category == '物理系' || category == '魔法系') ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教')) ? true : false;
		},
		function(){// 只有饲养师才需要学习宠物强化，因为脚本的效率是无限的
			return false;
		},
		function(){
				if(category == '物理系' || category == '魔法系' || category == '魔物系'){
					if(cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化') && cga.findPlayerSkill('气绝回复')){
						return true
					}else{
						return false
					}
				}else{
					return true
				}
		},
		function(){
				if(category == '物理系' || category == '魔法系' || category == '魔物系'){
					if(cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化') && cga.findPlayerSkill('气绝回复') && cga.findPlayerSkill('石化魔法')){
						return true
					}else{
						return false
					}
				}else{
					return true
				}
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎')) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木')) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木') && cga.findPlayerSkill('挖掘') ) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木') && cga.findPlayerSkill('挖掘') && cga.findPlayerSkill('抗石化')) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木') && cga.findPlayerSkill('挖掘') && cga.findPlayerSkill('抗石化') && cga.findPlayerSkill('抗混乱')) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木') && cga.findPlayerSkill('挖掘') && cga.findPlayerSkill('抗石化') && cga.findPlayerSkill('抗混乱') && cga.findPlayerSkill('抗毒')) ? true : false;
		},
		function(){
			return (cga.findPlayerSkill('治疗') && cga.findPlayerSkill('调教') && cga.findPlayerSkill('宠物强化')&& cga.findPlayerSkill('狩猎') && cga.findPlayerSkill('伐木') && cga.findPlayerSkill('挖掘') && cga.findPlayerSkill('抗石化') && cga.findPlayerSkill('抗混乱') && cga.findPlayerSkill('抗毒') && cga.findPlayerSkill('抗昏睡')) ? true : false;
		},
	]
	);
	task.anyStepDone = false;
	task.doTask(()=>{
		while (true) {
			
		}
	});
});