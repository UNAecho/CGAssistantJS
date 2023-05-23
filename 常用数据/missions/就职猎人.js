var thisobj = {
	taskName: '就职猎人',
	taskStages: [
		{
			intro: '1.前往伊尔村，与猎人亚烈格尔（48.76）对话，习得技能狩猎体验。',
			workFunc: function (cb2) {
				cga.skill.learn('狩猎体验', () => {
					cb2(true)
				})
			}
		},
		{
			intro: '2.出伊尔村，前往芙蕾雅岛（652.228）点处使用狩猎体验进行狩猎，可随机获得【传说的鹿皮】。',
			workFunc: function (cb2) {
				if (cga.needSupplyInitial({})) {
					cga.travel.toHospital(() => {
						setTimeout(() => {
							cb2('restart stage');
						}, 3000);
					}, false)
					return;
				}
				cga.travel.toVillage('伊尔村', () => {
					cga.walkList([
						[45, 31, '芙蕾雅'],
						[652, 228]
					], () => {
						var skill = cga.findPlayerSkill('狩猎体验');
						cga.StartWork(skill.index, 0);
						var waitEnd = function (cb2) {
							cga.AsyncWaitWorkingResult(() => {
								var playerInfo = cga.GetPlayerInfo();
								if (playerInfo.mp == 0) {
									cga.walkList([
										[681, 343, '伊尔村']
									], () => {
										cb2('restart stage');
									});
									return;
								}
								if (cga.getItemCount('传说的鹿皮') > 0) {
									cga.walkList([
										[681, 343, '伊尔村'],
									], () => {
										// 过河拆桥，把技能删除
										thisobj.func.forgetSkill(cb2)
									});
									return;
								}
								var item = cga.getInventoryItems().find((it) => {
									return ((it.name == '鹿皮') && it.count == 40)
								});
								if (item) {
									cga.DropItem(item.pos);
								}
								cga.StartWork(skill.index, 0);
								waitEnd(cb2);
							}, 10000);
						}
						waitEnd(cb2);
					});
				})
			}
		},
		{
			intro: '3.返回伊尔村，持有【传说的鹿皮】与败家子葛达尔夫（49.77）对话，交出【传说的鹿皮】*1获得【猎人推荐信】。',
			workFunc: (cb2) => {

				var go = (cb3) => {
					var obj = { act: 'item', target: '猎人推荐信' }
					cga.askNpcForObj('伊尔村', [49, 77], obj, () => {
						cb3(true)
					})
				}

				var mapindex = cga.GetMapIndex().index3
				if (mapindex == 100) {
					cga.walkList([
						[681, 343, '伊尔村'],
					], () => {
						go(cb2)
					});
					return
				} else {
					cga.travel.toVillage('伊尔村', () => {
						go(cb2)
					})
				}
			}
		},
		{
			intro: '4.前往伊尔村装备店（35.25）与猎人强提（13.16）对话即可就职猎人，任务完结。',
			workFunc: (cb2) => {
				var obj = { act: 'job', target: thisobj.data.job.job }
				cga.travel.toVillage(thisobj.data.job.tutorlocation, () => {
					cga.travel.autopilot(thisobj.data.job.tutorRoom, () => {
						cga.askNpcForObj(thisobj.data.job.tutorRoom, thisobj.data.job.tutorpos, obj, () => {
							cb2(true)
						})
					})
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
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
			return (cga.job.getJob().job == '猎人') ? true : false;
		},
	],
	data: {// 任务静态数据，可自定义，方便使用
		job: cga.job.getJob('猎人')
	},
	func: {// 任务自定义函数
		forgetSkill: (cb) => {
			var skill = cga.skill.getSkill('狩猎体验')
			var obj = { act: 'forget', target: skill.name }
			cga.travel.toVillage(skill.teacherMainMap, () => {
				cga.travel.autopilot(skill.teacherMap, () => {
					cga.askNpcForObj(skill.teacherMap, skill.teacherPos, obj, () => {
						cb(true)
					})
				})
			});
		}
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param
		var task = cga.task.Task(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;