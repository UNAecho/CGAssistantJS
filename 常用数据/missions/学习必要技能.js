var thisobj = {
	taskName: '学习必要技能',
	taskStages: [
		{
			intro: '1.检查必要技能',
			workFunc: function (cb2) {
				let targetSkill = thisobj.func.needLearn(thisobj.data.jobObj.job)

				if (!targetSkill) {
					console.log('没有需要学习的技能，结束任务')
					cb2(true)
					return
				}
				console.log('检测到你的目标职业【' + thisobj.data.jobObj.job + '】需要学习【' + targetSkill + '】')
				cga.askNpcForObj({
					act: 'skill',
					target: targetSkill,
				}, () => {
					setTimeout(() => {
						cb2('restart stage');
					}, 2000);
				})
				return
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return false
		},
	],
	data: {// 任务数据，可自定义，方便使用
		battleTypeSkills: [
			'调教',
			'气绝回复',
			'抗石化',
			// '抗昏睡', 
			'抗混乱',
		],
		productTypeSkills: [
			'调教',
			'治疗',
		],
	},
	func: {// 任务自定义函数
		needLearn: (job) => {
			let targetSkill = null
			let jobObj = cga.job.getJob(job)
			if (jobObj.jobType == '战斗系') {
				for (let i = 0; i < thisobj.data.battleTypeSkills.length; i++) {
					if (cga.findPlayerSkill(thisobj.data.battleTypeSkills[i]) == null) {
						// 先查询一下该技能是否能学
						let reason = cga.skill.ableToLearn(thisobj.data.battleTypeSkills[i])
						if (reason.indexOf('slot') != -1) {
							console.log('【UNAecho脚本警告】人物剩余技能栏位不足，无法学习【' + thisobj.data.battleTypeSkills[i] + '】技能，跳过')
							continue
						}
						if (thisobj.data.battleTypeSkills[i].indexOf('抗') != -1 && cga.GetPlayerInfo().level < 40) {
							console.log('人物等级未到40级，无法进入海底。跳过【' + thisobj.data.battleTypeSkills[i] + '】学习')
							continue
						} else if (thisobj.data.battleTypeSkills[i] == '气绝回复' && cga.GetPlayerInfo().level < 30) {
							console.log('人物等级未到30级，走路去亚留特村有风险。跳过【' + thisobj.data.battleTypeSkills[i] + '】学习')
							continue
						} else {
							targetSkill = thisobj.data.battleTypeSkills[i]
							break
						}
					}
				}
			} else if (jobObj.jobType == '生产系' || jobObj.jobType == '服务系') {
				for (let i = 0; i < thisobj.data.productTypeSkills.length; i++) {
					if (cga.findPlayerSkill(thisobj.data.productTypeSkills[i]) == null) {
						targetSkill = thisobj.data.productTypeSkills[i]
						break
					}
				}
			}

			// 通用的技能遍历完之后，对特定职业进行定制学技能。如格斗士的气功弹不是得意技，却是必学技能
			if (targetSkill === null) {
				if (jobObj.job == '格斗士' && cga.findPlayerSkill('气功弹') == null) {
					targetSkill = '气功弹'
				} else if (cga.findPlayerSkill('完美调教术') == null) {
					// 如果当前职业是兽王，并且没有完美调教术，则学习
					let curJobObj = cga.job.getJob()
					if (curJobObj.job == '驯兽师' && curJobObj.jobLv == 5) {
						targetSkill = '完美调教术'
						console.log('【UNAecho脚本提醒】注意，完美调教术学习完毕后需要重新登录，宠物的忠诚才会发生变化。')
					}
				}
			}

			return targetSkill
		}
	},
	doTask: (param, cb) => {
		// 单人即可完成，战斗改为逃跑
		cga.loadBattleConfig('战斗赶路')
		// 接受外部传入的参数
		thisobj.param = param
		thisobj.data.jobObj = cga.job.getJob(thisobj.param.job)
		var task = cga.task.Task(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;