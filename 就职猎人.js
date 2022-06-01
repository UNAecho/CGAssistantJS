var fs = require('fs');
var cga = require('./cgaapi')(function () {

	// 提取本地职业数据
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	const professionalbehavior = require('./常用数据/Professionalbehavior.js');
	// 目标职业通称
	var targetJob = '猎人'
	// 本职技能
	var skillname = '狩猎'

	var dialogHandler = (err, dlg) => {
		if (dlg && (dlg.options & 4) == 4) {
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		if (dlg && (dlg.options & 32) == 32) {
			cga.ClickNPCDialog(32, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if (dlg && dlg.options == 12) {
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if (dlg && dlg.options == 1) {
			cga.ClickNPCDialog(1, 0);
			return;
		}
		else {
			return;
		}
	}

	var askNPCforItem = (xpos,ypos,itemname,cb)=>{
		cga.TurnTo(xpos, ypos);
		cga.AsyncWaitNPCDialog(dialogHandler);
		setTimeout(()=>{
			if(cga.getItemCount(itemname) > 0){
				setTimeout(()=>{
					cb(true);
				}, 1000);
			}else{
				setTimeout(()=>{
					askNPCforItem(xpos,ypos,itemname,cb)
				}, 3000);
			}
		}, 3000);
	}

	var loadBattleConfig = ()=>{

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
		return
	}

	var taskObj = cga.task.Task('就职【'+targetJob+'】', [
		{
			intro: '1.前往伊尔村，与猎人亚烈格尔（48.76）对话，习得技能狩猎体验。',
			workFunc: function (cb2) {
				var go = ()=>{
					cga.TurnTo(22,10);
					setTimeout(()=>{
						cga.walkList([
							[12, 17, '村长的家'],
							[6, 13, '伊尔村'],
							[48, 77],
						], ()=>{
							cga.turnTo(48, 75);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(0, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(0, -1);
									cga.AsyncWaitNPCDialog(()=>{
										var skill = cga.findPlayerSkill('狩猎体验');
										if(!skill){
											cb2(new Error('狩猎体验学习失败！可能钱不够或技能栏已满。'));
											return;
										}
										cb2(true);
									});
								});
							});
						});
					}, 2000);
				}
				// 有传传送，没传走去
				var config = cga.loadPlayerConfig()
				if (config && config['伊尔村'] == true){
					cga.travel.falan.toTeleRoom('伊尔村', (r)=>{
						cga.walkList([
							[12, 17, '村长的家'],
							[6, 13, '伊尔村'],
							[20, 10,],
						], go);
					});
				}else{
					cga.travel.falan.checkAllTeleRoom(()=>{
						cga.travel.falan.toStone('C', ()=>{
							cga.walkList([
								[65, 53, '法兰城'],
								[281, 88,'芙蕾雅'],
								[681, 343, '伊尔村'],
								[47, 83, '村长的家'],
								[14, 17, '伊尔村的传送点'],
								[20, 10,],
							], go)
						})
					})
				}
			}
		},
		{
			intro: '2.出伊尔村，前往芙蕾雅岛（652.228）点处使用狩猎体验进行狩猎，可随机获得【传说的鹿皮】。',
			workFunc: function (cb2) {
				if(cga.needSupplyInitial({  })){
					cga.travel.falan.toCastleHospital(()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					});
					return;
				}

				var go =()=>{
					cga.walkList([
						[281, 88, '芙蕾雅'],
						[652, 228]
					], ()=>{
						var skill = cga.findPlayerSkill('狩猎体验');
						cga.StartWork(skill.index, 0);
						var waitEnd = function(cb2){
							cga.AsyncWaitWorkingResult(()=>{
								var playerInfo = cga.GetPlayerInfo();
								if(playerInfo.mp == 0)
								{
									cb2('restart stage');
									return;
								}
								if(cga.getItemCount('传说的鹿皮') > 0)
								{
									cb2(true);
									return;
								}
								var item = cga.getInventoryItems().find((it)=>{
									return ((it.name == '鹿皮') && it.count == 40)
								});
								if(item){
									cga.DropItem(item.pos);
								}
								cga.StartWork(skill.index, 0);
								waitEnd(cb2);
							}, 10000);
						}
						waitEnd(cb2);
					});
				}

				var map = cga.GetMapName();
				var tmplist = [
					[652, 228]
				]
				if(map == '伊尔村'){
					tmplist.unshift(
						[45, 31, '芙蕾雅'],
						);
					setTimeout(go, 1000);
				}else{
					tmplist.unshift(
						[281, 88, '芙蕾雅'],
						);
					cga.travel.falan.toStone('E1', go);
				}
			}
		},
		{
			intro: '3.返回伊尔村，持有【传说的鹿皮】与败家子葛达尔夫（49.77）对话，交出【传说的鹿皮】*1获得【猎人推荐信】。',
			workFunc: function (cb2) {
				cga.walkList([
					[681, 343, '伊尔村'],
					[48, 77],
					],()=>{
						askNPCforItem(49,77,'猎人推荐信',cb2)
					});
			}
		},
		{
			intro: '4.前往伊尔村装备店（35.25）与猎人强提（13.16）对话即可就职猎人，任务完结。',
			workFunc: function (cb2) {
				professionalbehavior(cga, targetJob,'induction',cb2)
			}
		},
		{
			intro: '5.学技能',
			workFunc: (cb2) => {

				if(cga.findPlayerSkill(skillname)){
					console.log('已有【'+skillname+'】技能')
					cb2(true)
				}

				professionalbehavior(cga, targetJob,'learning',cb2)
			}
		}
	],
		[//任务阶段是否完成
			function () {
				return (cga.findPlayerSkill('狩猎体验')) ? true : false;
			},
			function () {
				return (cga.getItemCount('传说的鹿皮') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('猎人推荐信') > 0) ? true : false;
			},
			function () {
				return (getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname == targetJob)? true : false;
			},
			function () {
				return (cga.findPlayerSkill(skillname) && getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname == targetJob) ? true : false;
			}
		]
	);
	loadBattleConfig()
	taskObj.doTask();
});