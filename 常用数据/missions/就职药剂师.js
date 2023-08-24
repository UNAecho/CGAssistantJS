var thisobj = {
	taskName: '就职药剂师',
	taskStages: [
		{
			intro: '1.前往法兰城里谢里雅堡1楼厨房（103.21）与料理长米其巴（8.6）对话，选“是”获得【水果蕃茄】。',
			workFunc: function (cb2) {
				let tmpmsg = '【UNA脚本】就职药剂师的第1-3步所获得的【高级蕃茄】可以使用【就职厨师】第一步的【水果蕃茄】代替。启程去拿【水果蕃茄】'
				cga.SayWords(tmpmsg, 0, 3, 1);
				var obj = { act: 'item', target: '水果蕃茄', npcpos: [8, 6] }
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot('厨房', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				});
			}
		},
		{
			intro: '2.返回山男的家与山男哈葛利特对话，交出【水果蕃茄】获得【莫洛草】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: '莫洛草', npcpos: [9, 3] }
				cga.travel.falan.toStone('C', () => {
					cga.travel.autopilot('东门', () => {
						cga.walkList([
							[509, 153, '山男的家'],
						], (r) => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					})
				});
			}
		},
		{
			intro: '3.前往圣拉鲁卡村医院与看护实习生德拉格（8.4）对话，交出【莫洛草】获得【药剂师推荐信】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: '药剂师推荐信', npcpos: [8, 4] }
				cga.travel.falan.toCastleHospital(()=>{
					cga.travel.toVillage('圣拉鲁卡村', () => {
						cga.travel.autopilot('医院', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						})
					})
				})
			}
		},
		{
			intro: '4.前往圣拉鲁卡村医院2楼，持有【药剂师推荐信】与药剂师柯尼（12.5）对话即可就职药剂师，任务完结。',
			workFunc: function (cb2) {
				let obj = { act: 'job', target: thisobj.data.job.job }
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return (cga.getItemCount('水果蕃茄') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('莫洛草') > 0) ? true : false;
		},
		function () {
			return (cga.getItemCount('药剂师推荐信') > 0) ? true : false;
		},
		function () {
			return (cga.job.getJob().job == '药剂师') ? true : false;
		},
	],
	taskPlayerThink: () => {
		return true
	},
	data: {// 任务数据，可自定义，方便使用
		job: cga.job.getJob('药剂师')
	},
	func: {// 任务自定义函数

	},
	doTask: (param, cb) => {
		// 避免使用自动丢弃列表包含铜的战斗配置
		cga.loadBattleConfig('生产赶路')
		// 接受外部传入的参数
		thisobj.param = param
		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;