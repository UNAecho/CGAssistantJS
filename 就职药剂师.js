var fs = require('fs');
var cga = require('./cgaapi')(function () {

	// 提取本地职业数据
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	const professionalbehavior = require('./常用数据/Professionalbehavior.js');
	// 目标职业通称
	var targetJob = '药剂师'
	// 本职技能
	var skillname = '制药'

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
			intro: '1.前往法兰城里谢里雅堡1楼厨房（103.21）与料理长米其巴（8.6）对话，选“是”获得【水果蕃茄】。',
			workFunc: function (cb2) {
				var tmpmsg = '【UNA脚本】就职药剂师的第1-3步所获得的【高级蕃茄】可以使用【就职厨师】第一步的【水果蕃茄】代替。启程去拿【水果蕃茄】'
				cga.SayWords(tmpmsg, 0, 3, 1);
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
			intro: '2.返回山男的家与山男哈葛利特对话，交出【水果蕃茄】获得【莫洛草】。',
			workFunc: function (cb2) {
				var tmpmsg = '【UNA脚本】拿着【高级蕃茄】的代替品【水果蕃茄】去和山男哈葛利特交换【莫洛草】'
				cga.SayWords(tmpmsg, 0, 3, 1);
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88, '芙蕾雅'],
						[509, 153, '山男的家'],
						[8,3]
						], (r)=>{
							askNPCforItem(9,3,'莫洛草',cb2)
						});
				});
			}
		},
		{
			intro: '3.前往圣拉鲁卡村医院与看护实习生德拉格（8.4）对话，交出【莫洛草】获得【药剂师推荐信】。',
			workFunc: function (cb2) {
				var tmpmsg = '【UNA脚本】为防止人物没有开传送，第一次走路去圣拉鲁卡村，顺便开传送。'
				cga.SayWords(tmpmsg, 0, 3, 1);
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(() => {
						cga.walkList([
							[17, 53, '法兰城'],
							[22, 88,'芙蕾雅'],
							[134, 218, '圣拉鲁卡村'],
							[49, 81, '村长的家'],
							[8, 10, '圣拉鲁卡村的传送点'],
							[15, 4,],
						], ()=>{
							cga.TurnTo(15,3);
							setTimeout(()=>{
								cga.walkList([
									[7, 3, '村长的家'],
									[2, 9, '圣拉鲁卡村'],
									[37, 50, '医院'],
									[8, 5]
								], ()=>{
									askNPCforItem(8,4,'药剂师推荐信',cb2)
								});
							}, 2000);
						})
					}, 2500);
				})
			}
		},
		{
			intro: '4.前往圣拉鲁卡村医院2楼，持有【药剂师推荐信】与药剂师柯尼（12.5）对话即可就职药剂师，任务完结。',
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
			function () {//是否在就职地图
				return (cga.getItemCount('水果蕃茄') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('莫洛草') > 0) ? true : false;
			},
			function () {
				return (cga.getItemCount('药剂师推荐信') > 0) ? true : false;
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