var fs = require('fs');
var cga = require('./cgaapi')(function () {

	// 提取本地职业数据
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	// 目标职业通称
	var targetJob = '厨师'
	// 本职技能
	var skillname = '料理'

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

	// 通用学习动作
	var learn = (xpos,ypos,cb) => {
		cga.TurnTo(xpos, ypos);
		cga.AsyncWaitNPCDialog(() => {
			cga.ClickNPCDialog(0, 0);
			cga.AsyncWaitNPCDialog(() => {
				setTimeout(() => {
					cga.ClickNPCDialog(0, -1);
					setTimeout(() => {
						cga.AsyncWaitNPCDialog((err, dlg) => {
							if (dlg && dlg.message.indexOf('技能栏位') > 0) {
								throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了')
							} else if (dlg && dlg.message.indexOf('你的钱') > 0) {
								throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
							} else {
								console.log('技能学习完毕')
								if (cb) {
									cb(true)
								}
							}
						});
					}, 1500);
				}, 1000);
			});
		});
	}

	var taskObj = cga.task.Task('就职【'+targetJob+'】', [
		{
			intro: '1.前往法兰城里谢里雅堡1楼厨房（103.21）与料理长米其巴（8.6）对话，选“是”获得【水果蕃茄】。',
			workFunc: function (cb2) {
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[41, 50, '里谢里雅堡 1楼'],
						[103, 21,'厨房'],
						[8, 7],
						], (r)=>{
							askNPCforItem(8,6,'水果蕃茄',cb2)
						});
				});
			}
		},
		{
			intro: '2.前往伊尔村巴侬的家（42.72）与伊尔村的祭司（9.6）对话，选“是”交出【水果蕃茄】获得【匆忙写下的信】。',
			workFunc: function (cb2) {
				var tmpmsg = '【UNA脚本】为防止人物没有开传送，第一次走路去伊尔村，顺便开传送。后续来就职时，再使用传送石。'
				cga.SayWords(tmpmsg, 0, 3, 1);
				cga.travel.falan.toStone('C', ()=>{
					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88,'芙蕾雅'],
						[681, 343, '伊尔村'],
						[47, 83, '村长的家'],
						[14, 17, '伊尔村的传送点'],
						[20, 10,],
					], (r)=>{
						cga.TurnTo(22,10);
						setTimeout(()=>{
							cga.walkList([
								[12, 17, '村长的家'],
								[6, 13, '伊尔村'],
								[42, 72, '巴侬的家'],
								[8, 6,],
							], ()=>{
								askNPCforItem(9,6,'匆忙写下的信',cb2)
							});
						}, 2000);
					})
			
				})
			}
		},
		{
			intro: '3.前往法兰城竞技场（123.161）与新嫁娘艾莉佳（51.13）对话，交出【匆忙写下的信】获得【流行的项链】。',
			workFunc: function (cb2) {
				cga.travel.falan.toStone('C', ()=>{
					cga.walkList([
						[41, 98, '法兰城'],
						[124, 161],
					], (r)=>{
						cga.turnDir(4);
						cga.AsyncWaitMovement({map:['竞技场的入口'], delay:1000, timeout:10000}, ()=>{
							cga.walkList([
							[15, 6,'竞技场'],
							[51, 14,],
							], ()=>{
								askNPCforItem(51,13,'流行的项链',cb2)
							});
						});
					})
			
				})
			}
		},
		{
			intro: '4.前往法兰城科特利亚酒吧（219.136）与服务生春美（17.12）对话，交出【流行的项链】获得【自豪的食谱】。',
			workFunc: (cb2) => {
				cga.travel.falan.toStone('C', ()=>{
					cga.walkList([
						[41, 98, '法兰城'],
						[219, 136,'科特利亚酒吧'],
						[17, 13],
					], (r)=>{
						askNPCforItem(17,12,'自豪的食谱',cb2)
					})
			
				})
			}
		},
		{
			intro: '5.与酒吧的主人（22.13）对话，交出【自豪的食谱】获得【厨师推荐信】。',
			workFunc: (cb2) => {
				var map = cga.GetMapName();
				if(map == '科特利亚酒吧'){
					cga.walkList([
						[22, 13],
					], (r)=>{
						askNPCforItem(23,13,'厨师推荐信',cb2)
					})
				}else{
					cga.travel.falan.toStone('C', ()=>{
						cga.walkList([
							[41, 98, '法兰城'],
							[219, 136,'科特利亚酒吧'],
							[22, 13],
						], (r)=>{
							askNPCforItem(23,13,'厨师推荐信',cb2)
						})
				
					})
				}
			}
		},
		{
			intro: '6.前往伊尔村旧金山酒吧（32.65），持有【厨师推荐信】与厨师印普德（15.4）对话即可就职厨师，任务完结。',
			workFunc: (cb2) => {
				var tmpmsg = '【UNA脚本】请注意如果没有经历过【就职厨师第二步】或没开伊尔村传送，请手动开启伊尔村传送石'
				cga.SayWords(tmpmsg, 0, 3, 1);
				cga.travel.falan.toTeleRoom('伊尔村', ()=>{
					cga.walkList([
					[12, 17, '村长的家'],
					[6, 13, '伊尔村'],
					[32, 65,'旧金山酒吧'],
					[15, 5],
					], ()=>{
						cga.TurnTo(15, 4);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg && dlg.message.indexOf('我想转职') >= 0){
									cga.SayWords('已经有其他职业，请手动决策', 0, 3, 1);
									var retry = ()=>{
										if(getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname == targetJob){
											setTimeout(cb2, 3000,true);
										}else{
											setTimeout(retry, 3000);
										}
									}
									retry()
								}else{
									setTimeout(cb2, 3000,true);
								}
							});
						});
					});
				});
			}
		},
		{
			intro: '7.学技能',
			workFunc: (cb2) => {

				if(cga.findPlayerSkill(skillname)){
					console.log('已有【'+skillname+'】技能')
					cb2(true)
				}

				if(cga.GetMapIndex().index3 == 1502){
					cga.walkList([
						[12, 7],
						], (r)=>{
							learn(12, 6, cb2)
						});
				}else{
					cga.travel.falan.toStone('C', () => {
						cga.walkList([
							[41, 50, '里谢里雅堡 1楼'],
							[103, 21,'厨房'],
							[12, 7],
							], (r)=>{
								learn(12, 6, cb2)
							});
					});
				}
			}
		}
	],
		[//任务阶段是否完成
			function () {//是否在就职地图
				return (cga.getItemCount('水果蕃茄') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('匆忙写下的信') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('流行的项链') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('自豪的食谱') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('厨师推荐信') > 0) ? true : false;
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