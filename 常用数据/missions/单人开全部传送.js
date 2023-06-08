var thisobj = {
	taskName: '学习必要技能',
	taskStages: [
		{
			intro: '1.单人开全部传送',
			workFunc: function (cb2) {
				let config = cga.loadPlayerConfig();
				if (config.allstonedone) {
					console.log('人物已经全部开传送，任务结束')
					cb2(true)
					return
				}
				let targetVillage = null
				for (let i = 0; i < thisobj.data.villages.length; i++) {
					if (!config[thisobj.data.villages[i]]) {
						targetVillage = thisobj.data.villages[i]
						break
					}
					console.log('【' + thisobj.data.villages[i] + '】已经开启传送，跳过')
				}
				// 如果都开启了传送
				if (targetVillage === null) {
					cga.travel.falan.checkAllTeleRoom((r) => {
						if (r) {
							cb2(true)
							return
						}
						// TODO 其实cga.travel.falan.checkAllTeleRoom暂时没有返回false的情况，后续再添加吧
						console.log('在启程之间实际检测到人物还有未开启的传送，重新进入开传送逻辑')
						cb2('restart stage')
						return
					})
					return
				} else {// 如果有村镇未开启传送
					cga.travel.toVillage(targetVillage, () => {
						console.log('【' + targetVillage + '】开传送完毕。')
						cb2('restart stage')
						return
					})
				}

				return
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return false
		},
	],
	data: {
		villages: ['圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇', '阿巴尼斯村', '蒂娜村']
	},
	func: {},
	doTask: (param, cb) => {
		// 单人即可完成，战斗改为逃跑
		cga.loadBattleConfig('战斗赶路')
		// 接受外部传入的参数
		thisobj.param = param
		var task = cga.task.Task(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;