var thisobj = {
	taskName: '拿驯兽师推荐信',
	taskStages: [
		{
			intro: '1.与法兰城平民武器贩售处（150.122）对话，购买就职职业对应的武器。',
			workFunc: function (cb2) {
				var findWeap = cga.findItem((item) => {
					return item.type == 5;
				})
				if (findWeap >= 8) {
					cga.UseItem(findWeap);
					setTimeout(cb2, 1000, true);
					return;
				}

				cga.travel.falan.toStone('B1', () => {
					cga.turnTo(150, 122);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(() => {
							cga.BuyNPCStore([{ index: 5, count: 1 }]);
							cga.AsyncWaitNPCDialog((err, dlg) => {
								if (dlg && dlg.message.indexOf('谢谢') >= 0) {
									cga.UseItem(cga.findItem((item) => {
										return item.type == 5;
									}));
									setTimeout(cb2, 1000, true);
									return;
								}
								else {
									cb2(false);
									return;
								}
							});
						});
					});
				});
			}
		},
		{
			intro: '2.到法兰城的东医院[224.87]内找护士买“止痛药”',
			workFunc: function (cb2) {
				cga.travel.autopilot(1112, () => {
					var npc = cga.findNPC('药剂师波洛姆');
					if (!npc) {
						cb2(false);
						return;
					}
					cga.walkList([
						[npc.xpos - 1, npc.ypos]
					], (r) => {
						cga.turnTo(npc.xpos, npc.ypos);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog(() => {
								cga.BuyNPCStore([{ index: 1, count: 1 }]);
								cga.AsyncWaitNPCDialog((err, dlg) => {
									if (dlg && dlg.message.indexOf('请保重') >= 0) {
										cb2(true);
										return;
									}
									else {
										cb2(false);
										return;
									}
								});
							});
						});
					});
				})
			}
		},
		{
			intro: '3.接著再到公会[73.60]，把止痛药交给安布伦后他会给你一张“通行证” ',
			workFunc: function (cb2) {
				cga.travel.falan.toStone('W1', () => {
					cga.walkList([
						[73, 60, '职业公会'],
						[8, 6]
					], (r) => {
						cga.turnTo(10, 6);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(() => {
								cga.walkList([
									[9, 24, '法兰城'],
									[63, 79],
								], () => {
									cb2(true);
								})
							});
						});
					});
				});
			}
		},
		{
			intro: '4、出西门进国营第24坑道（351.146），在一楼左方找哈鲁迪亚说话就可以进入试练洞窟。直闯6F大厅，和波洛米亚（23.15）交谈后就可以拿到推荐信。',
			workFunc: (cb2) => {
				cga.travel.falan.toStone('W1', (r) => {
					cga.walkList([
						[22, 87, '芙蕾雅'],
						[351, 145, '国营第24坑道 地下1楼'],
						[9, 15],
					], (r) => {
						cga.TurnTo(9, 13);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({ x: 7, y: 15 }, () => {
								cga.walkList([
									[9, 5, '试炼之洞窟 第1层'],
									[33, 31, '试炼之洞窟 第2层'],
									[22, 42, '试炼之洞窟 第3层'],
									[42, 34, '试炼之洞窟 第4层'],
									[27, 12, '试炼之洞窟 第5层'],
									[39, 36, '试炼之洞窟 大厅'],
									[23, 20],
								], (r) => {
									var job = cga.GetPlayerInfo().job;
									if (job == '游民') {
										cga.walkList([
											[23, 17]
										], (r) => {
											cga.turnDir(6);
											cga.AsyncWaitNPCDialog(() => {
												cga.ClickNPCDialog(1, 0);
												setTimeout(cb2, 1000, true);
											});
										});
									} else {
										cga.walkList([
											[22, 12],
											[23, 12],
										], (r) => {
											cga.SayWords('驯兽师', 0, 0, 0);
											cga.AsyncWaitNPCDialog((err, dlg) => {
												if (dlg && dlg.message.indexOf('那就拿去吧') >= 0) {
													cga.ClickNPCDialog(1, 0);
													setTimeout(cb2, 1000, true);
												}
												else {
													cb2(false);
													return;
												}
											});
										});
									}
								});
							});
						});
					});
				});
			}
		},
		{
			intro: '5、返回法兰城与相关职业就职人员对话，就职成功，任务完结。',
			workFunc: (cb2) => {
				// 如果为true，则任务只进行到获取推荐信就结束
				if(thisobj.data.letter){
					cb2(true)
					return
				}
				let obj = { act: 'job', target: thisobj.data.job.job }
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		}
	],
	taskRequirements: [//任务阶段是否完成
		function () {//检查可否直接去拿止痛药
			var job = cga.GetPlayerInfo().job;
			if (job == '游民' && cga.getItemCount((item) => {
				return item.type == 5 && item.pos < 8;
			}, true) > 0) return true;

			if (job != '游民')
				return true;

			return false;
		},
		function () {//止痛药
			return (cga.getItemCount('#18233') > 0) ? true : false;
		},
		function () {//试炼洞穴通行证
			return (cga.getItemCount('#18100') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('驯兽师推荐信') > 0) ? true : false;
		},
		function () {
			// 如果已经是驯兽师，并且不是仅为了拿保证书的情况下会返回true
			return cga.job.getJob().job == '驯兽师' && thisobj.data.letter == false
		}
	],
	data: {// 任务数据，可自定义，方便使用
		job: cga.job.getJob('驯兽师'),
		// 如果为true，则任务只进行到获取推荐信就结束。默认false
		letter: false
	},
	func: {// 任务自定义函数

	},
	doTask: (param, cb) => {
		// 单人即可完成，战斗改为逃跑
		cga.loadBattleConfig('战斗赶路')
		// 接受外部传入的参数
		thisobj.param = param
		// 如果传入了只拿介绍信，则此任务只做到介绍信即停止
		if(thisobj.param.letter){
			thisobj.data.letter = true
			console.log('你选择了任务只进行到拿推荐信即结束，脚本将在就职前结束任务。')
		}
		var task = cga.task.Task(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;