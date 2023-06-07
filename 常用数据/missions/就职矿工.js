var thisobj = {
	taskName: '就职矿工',
	taskStages: [
		{
			intro: '1.前往圣拉鲁卡村赛谢利亚酒吧（39.70）与募集矿工的洛伊（16.10）习得技能挖矿体验后，前往法兰城西门外国营第24坑道（351.145）地下1楼，在任意位置使用挖矿体验，挖掘【铜】（铜矿，非铜条）20个。时道服直接去新城买矿',
			workFunc: function (cb2) {
				let cu = cga.getItemCount('铜')
				if (cu < 20) {
					cga.travel.newisland.toStone('D', () => {
						cga.travel.autopilot('画廊', () => {
							cga.buyItems('铜', 20 - cu, [58, 54], (r) => {
								if (r) {
									cb2(true)
									return
								}
								cb2('restart stage')
								return
							})
						})
					});
					return
				}
				cb2(true)
				return
			}
		},
		{
			intro: '2.前往法兰城毕夫鲁的家（206.37），持有【铜】*20与那尔薇（8.3）对话，选“是”获得【便当？】。',
			workFunc: function (cb2) {
				var obj = { act: 'item', target: '便当？', npcpos : [8, 3] }
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot('毕夫鲁的家', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				});
			}
		},
		{
			intro: '3.返回国营第24号矿坑道（351.145）地下一楼与矿工毕夫鲁（35.7）对话，选“是”交出【便当？】获得【矿石？】、【有关矿石的纸条】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '矿石？', npcpos : [35, 7] }
				cga.travel.falan.toStone('W1', (r) => {
					cga.walkList([
						[22, 87, '芙蕾雅'],
						[351, 145, '国营第24坑道 地下1楼'],
					], () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					});
				});
			}
		},
		{
			intro: '4.前往法兰城凯蒂夫人店（196.78）与鉴定师马尔弗（13.9）对话，选“是”交出【矿石？】、【有关矿石的纸条】获得【给那尔薇的信】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '给那尔薇的信', npcpos : [13, 9] }
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot('凯蒂夫人的店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				});
			}
		},
		{
			intro: '5.前往毕夫鲁之家与那尔薇（8.3）对话，选“是”交出【给那尔薇的信】获得【饮料？】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '饮料？', npcpos : [8, 3] }
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot('毕夫鲁的家', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				});
			}
		},
		{
			intro: '6.前往国营第24矿坑道地下一楼与矿工毕夫鲁（35.7）对话，选“是”交出【饮料？】获得【矿工推荐信】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '矿工推荐信', npcpos : [35, 7] }
				cga.travel.falan.toStone('W1', (r) => {
					cga.walkList([
						[22, 87, '芙蕾雅'],
						[351, 145, '国营第24坑道 地下1楼'],
					], () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					});
				});
			}
		},
		{
			intro: '7.前往圣拉鲁卡村村长的家（49.81）2楼与矿工吉拉瓦特（8.4）对话即可就职矿工，任务完结。',
			workFunc: (cb2) => {
				var obj = { act: 'job', target: thisobj.data.job.job, npcpos : thisobj.data.job.npcpos }
				cga.travel.toVillage(thisobj.data.job.npcMainMap, () => {
					cga.travel.autopilot(thisobj.data.job.npcMap, () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return (cga.getItemCount('铜') >= 20) ? true : false;
		},
		function () {
			return (cga.getItemCount('便当？') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('矿石？') > 0 && cga.getItemCount('有关矿石的纸条') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('给那尔薇的信') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('饮料？') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('矿工推荐信') > 0) ? true : false;
		},
		function () {
			return (cga.job.getJob().job == '矿工') ? true : false;
		},
	],
	taskPlayerThink: () => {
		return true
	},
	data: {// 任务静态数据，可自定义，方便使用
		job: cga.job.getJob('矿工')
	},
	func: {// 任务自定义函数

	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param
		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;