var fs = require('fs');
var cga = require('./cgaapi')(function () {

	var jump =()=>{
		global.cga = cga
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\交通脚本\\学习必要技能.js",
		}
		var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		scriptMode.call_ohter_script(body,setting)
	}

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

	// 通用学习动作
	var learn = (cb) => {
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

	var taskObj = cga.task.Task('就职传教士', [
		{
			intro: '1.前往法兰城大圣堂里面，就职处',
			workFunc: function (cb2) {
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[41, 14, '法兰城'],
						[154, 29, '大圣堂的入口'],
						[14, 7, '礼拜堂'],
						[23, 0, '大圣堂里面'],
						[16, 10]
					], () => {
						cb2(true);
					});
				});
			}
		},
		{
			intro: '2.就职答题',
			workFunc: function (cb2) {
				cga.turnDir(2);

				cga.AsyncWaitNPCDialog(dialogHandler);

				var retry = ()=>{
					if(cga.getItemCount('僧侣适性检查合格证') > 0){
						cb2(true)
						return
					}
					setTimeout(retry, 2000);
				}
				setTimeout(retry, 2000);
				return
			}
		},
		{
			intro: '3、与相关职业就职人员对话，就职成功，任务完结。',
			workFunc: (cb2) => {
				cga.turnDir(7);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cb2(true);
					});
				});
			}
		},
		{
			intro: '4、学习单体补血，以备不时之需。',
			workFunc: (cb2) => {
				if (cga.GetMapIndex().index3 == 1207) {
					cga.walkList([
						[13, 7]
					], () => {
						cga.turnDir(7);
						cga.AsyncWaitNPCDialog(dialogHandler);
						// 传教学习技能房间
						cga.AsyncWaitMovement({ map: 1208 }, () => {
							cga.walkList([
								[14, 11]
							], () => {
								cga.turnDir(6);
								learn(cb2)
							});
						})
					});
				}else if (cga.GetMapIndex().index3 == 1208) {
					cga.walkList([
						[14, 11]
					], () => {
						cga.turnDir(6);
						learn(cb2)
					});
				}else {
					cga.travel.falan.toStone('C', () => {
						cga.walkList([
							[41, 14, '法兰城'],
							[154, 29, '大圣堂的入口'],
							[14, 7, '礼拜堂'],
							[23, 0, '大圣堂里面'],
							[13, 7]
						], () => {
							cga.turnDir(7);
							cga.AsyncWaitNPCDialog(dialogHandler);
							// 传教学习技能房间
							cga.AsyncWaitMovement({ map: 1208 }, () => {
								cga.walkList([
									[14, 11]
								], () => {
									cga.turnDir(6);
									learn(cb2)
								});
							})
						});
					});
				}

			}
		},
		{
			intro: '5、学习强力补血补血，以备不时之需。',
			workFunc: (cb2) => {
				if (cga.GetMapIndex().index3 == 1207) {
					cga.walkList([
						[13, 7]
					], () => {
						cga.turnDir(7);
						cga.AsyncWaitNPCDialog(dialogHandler);
						// 传教学习技能房间
						cga.AsyncWaitMovement({ map: 1208 }, () => {
							cga.walkList([
								[19, 13]
							], () => {
								cga.turnDir(6);
								learn(cb2)
							});
						})
					});
				}else if (cga.GetMapIndex().index3 == 1208) {
					cga.walkList([
						[19, 13]
					], () => {
						cga.turnDir(6);
						learn(cb2)
					});
				}else {
					cga.travel.falan.toStone('C', () => {
						cga.walkList([
							[41, 14, '法兰城'],
							[154, 29, '大圣堂的入口'],
							[14, 7, '礼拜堂'],
							[23, 0, '大圣堂里面'],
							[13, 7]
						], () => {
							cga.turnDir(7);
							cga.AsyncWaitNPCDialog(dialogHandler);
							// 传教学习技能房间
							cga.AsyncWaitMovement({ map: 1208 }, () => {
								cga.walkList([
									[19, 13]
								], () => {
									cga.turnDir(6);
									learn(cb2)
								});
							})
						});
					});
				}

			}
		},
		{
			intro: '6、跳转下个流程。',
			workFunc: (cb2) => {
				cb2(true)
				jump()
			}
		}
	],
		[//任务阶段是否完成
			function () {//是否在就职地图
				return (cga.GetMapIndex().index3 == 1207) ? true : false;
			},
			function () {
				return (cga.getItemCount('僧侣适性检查合格证') > 0) ? true : false;
			},
			function () {
				return cga.GetPlayerInfo().job.indexOf('传教士') != -1 ? true : false;
			},
			function () {
				return (cga.findPlayerSkill('补血魔法') && cga.GetPlayerInfo().job.indexOf('传教士') != -1) ? true : false;
			},
			function () {
				return (cga.findPlayerSkill('强力补血魔法') && cga.GetPlayerInfo().job.indexOf('传教士') != -1) ? true : false;
			},
			function () {
				return false
			}
		]
	);

	taskObj.doTask();
});