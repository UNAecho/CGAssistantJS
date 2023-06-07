var thisobj = {
	taskName: '就职咒术师',
	taskStages: [
		{
			intro: '1.进入莎莲娜海底洞窟。前往莎莲娜海底洞窟地下2楼调查（31.22）处，输入“咒术”，变更场景。往南行走进入咒术师的秘密住处（38.37），与咒术师希索普（13.7）对话，选“是”获得【咒器·红念珠】。',
			workFunc: function (cb2) {

				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(()=>{
						cb2('restart stage');
					})
					return;
				}
				
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88, '芙蕾雅'],
					], () => {
						cga.askNpcForObj({ act: 'map', target: 15000, npcpos : [201, 165] }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
							], () => {
								cga.askNpcForObj({ act: 'map', target: 15006, say: '咒术', npcpos : [31, 22] }, () => {
									cga.walkList([
										[38, 37, '咒术师的秘密住处'],
									], () => {
										cga.askNpcForObj({ act: 'item', target: '咒器·红念珠', npcpos : [13, 7]}, () => {
											cb2(true)
										})
									});
								})
							});
						})
					})
				})

			}
		},
		{
			intro: '2.前往法兰城豪宅（96.148），通过厨房的垃圾箱（33.22），进入豪宅地下。由（9.5）处上楼，通过镜子（33.10）进入镜中的豪宅。',
			workFunc: function (cb2) {

				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(()=>{
						cb2('restart stage');
					})
					return;
				}

				cga.travel.falan.toStone('W2', () => {
					cga.travel.autopilot('镜中的豪宅  阁楼', () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '3.与罗蕾儿（23.10）对话，选“是”获得【神器·紫念珠】。再次与罗蕾儿对话传送回豪宅（32.45）处。',
			workFunc: (cb2) => {
				cga.askNpcForObj({ act: 'item', target: '神器·紫念珠', npcpos : [23, 10] }, () => {
					cga.askNpcForObj({ act: 'map', target: '豪宅', npcpos : [23, 10] }, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '4.返回莎莲娜海底洞窟咒术师的秘密住处与咒术师希索普对话，交出【咒器·红念珠】、【神器·紫念珠】获得【咒术师推荐信】。',
			workFunc: (cb2) => {
				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(()=>{
						cb2('restart stage');
					})
					return;
				}
				
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88, '芙蕾雅'],
					], () => {
						cga.askNpcForObj({ act: 'map', target: 15000, npcpos : [201, 165] }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
							], () => {
								cga.askNpcForObj({ act: 'map', target: 15006, say: '咒术', npcpos : [31, 22] }, () => {
									cga.walkList([
										[38, 37, '咒术师的秘密住处'],
									], () => {
										cga.askNpcForObj({ act: 'item', target: '咒术师推荐信', npcpos : [13, 7]}, () => {
											cb2(true)
										})
									});
								})
							});
						})
					})
				})
			}
		},
		{
			intro: '5.前往莎莲娜海底洞窟咒术师的秘密住处（15012）与咒术师方涅尔（11.10）对话即可就职咒术师，任务完结。',
			workFunc: (cb2) => {
				var obj = { act: 'job', target: thisobj.data.job.job }
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return (cga.getItemCount('咒器·红念珠') >= 1) ? true : false;
		},
		function () {
			return ((cga.GetMapName() == '镜中的豪宅  阁楼') && cga.GetMapXY().y < 19) ? true : false;
		},
		function () {
			return (cga.getItemCount('咒器·红念珠') >= 1 && cga.getItemCount('神器·紫念珠') >= 1) ? true : false;
		},
		function () {
			return (cga.getItemCount('咒术师推荐信') >= 1) ? true : false;
		},
		function () {
			return (cga.job.getJob().job == '咒术师') ? true : false;
		},
	],
	data: {// 任务静态数据，可自定义，方便使用
		job: cga.job.getJob('咒术师')
	},
	func: {// 任务自定义函数

	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param
		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;