var thisobj = {
	taskName: '就职传教士',
	taskStages: [
		{
			intro: '1.前往法兰城大圣堂里面，就职处',
			workFunc: function (cb2) {
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot(thisobj.data.job.tutorRoom, () => {
						cb2(true);
					})
				});
			}
		},
		{
			intro: '2.就职答题',
			workFunc: function (cb2) {
				var obj = { act: 'item', target: '僧侣适性检查合格证' }
				cga.travel.autopilot(thisobj.data.job.tutorRoom, () => {
					cga.askNpcForObj(thisobj.data.job.tutorRoom, [16, 11], obj, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '3、与相关职业就职人员对话，就职成功，任务完结。',
			workFunc: (cb2) => {
				var obj = { act: 'job', target: '传教士' }
				cga.travel.autopilot(thisobj.data.job.tutorRoom, () => {
					cga.askNpcForObj(thisobj.data.job.tutorRoom, thisobj.data.job.tutorpos, obj, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '4、学习单体补血。',
			workFunc: (cb2) => {
				var go = (skillObj) => {
					var obj = { act: 'skill', target: skillObj.name }
					cga.travel.autopilot(skillObj.teacherMap, () => {
						cga.askNpcForObj(skillObj.teacherMap, skillObj.teacherPos, obj, () => {
							cb2(true)
						})
					})
				}

				var villageName = cga.travel.switchMainMap()
				var skillObj = cga.skill.getSkill('补血魔法')

				if (villageName == '法兰城') {
					go(skillObj)
				} else {
					cga.travel.falan.toStone('C', () => {
						go(skillObj)
					});
				}
				return
			}
		},
		{
			intro: '5、学习强力补血补血。',
			workFunc: (cb2) => {
				var go = (skillObj) => {
					var obj = { act: 'skill', target: skillObj.name }
					cga.travel.autopilot(skillObj.teacherMap, () => {
						cga.askNpcForObj(skillObj.teacherMap, skillObj.teacherPos, obj, () => {
							cb2(true)
						})
					})
				}

				var villageName = cga.travel.switchMainMap()
				var skillObj = cga.skill.getSkill('强力补血魔法')

				if (villageName == '法兰城') {
					go(skillObj)
				} else {
					cga.travel.falan.toStone('C', () => {
						go(skillObj)
					});
				}
				return
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return (cga.GetMapIndex().index3 == 1207) ? true : false;
		},
		function () {
			return (cga.getItemCount('僧侣适性检查合格证') > 0) ? true : false;
		},
		function () {
			return cga.job.getJob().job == '传教士';
		},
		function () {
			return (cga.findPlayerSkill('补血魔法') && cga.job.getJob().job == '传教士') ? true : false;
		},
		function () {
			return (cga.findPlayerSkill('强力补血魔法') && cga.job.getJob().job == '传教士') ? true : false;
		},
	],
	data: {// 任务静态数据，可自定义，方便使用
		job: cga.job.getJob('传教士')
	},
	func :{// 任务自定义函数

	},
};

module.exports = thisobj;