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
	data: {// 任务静态数据，可自定义，方便使用
		battleTypeSkills: ['调教', '气绝回复', '抗石化', '抗昏睡', '抗混乱',],
		productTypeSkills: ['调教', '治疗',],
	},
	func: {// 任务自定义函数
		needLearn: (job) => {
			let targetSkill = null
			let jobObj = cga.job.getJob(job)
			if (jobObj.jobType == '战斗系') {
				for (let i = 0; i < thisobj.data.battleTypeSkills.length; i++) {
					if (cga.findPlayerSkill(thisobj.data.battleTypeSkills[i]) == null) {
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
			} else if (jobObj.jobType == '生产系') {
				for (let i = 0; i < thisobj.data.productTypeSkills.length; i++) {
					if (cga.findPlayerSkill(thisobj.data.productTypeSkills[i]) == null) {
						targetSkill = thisobj.data.productTypeSkills[i]
						break
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