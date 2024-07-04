var thisobj = {
	taskName: '定居艾尔莎岛',
	taskStages: [
		{
			intro: '0.检查是否可以直接定居。',
			workFunc: function (cb2) {
				let mainMap = cga.travel.switchMainMap()
				if (mainMap != '艾尔莎岛') {
					throw new Error('必须要在艾尔莎岛启动')
				}
				// 艾尔莎岛不需要定居任务
				thisobj.func.settle((r)=>{
					// 设定登入点成功，定居任务结束
					if (r === true){
						console.log('定居成功。')
						cb2('jump', thisobj.taskStages.length)
						return
					}
					// 设定不成功，任务继续。但艾尔莎岛不需要定居任务，此选项不会抵达。仅为了让所有定居任务格式统一。
					cb2(true)
					return
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return false;
		},
	],
	data: {// 任务数据，可自定义，方便使用
		talkPos: [141, 105],
		npcPos: [142, 105]
	},
	func: {// 任务自定义函数
		settle: (cb) => {
			cga.travel.autopilot('主地图', ()=>{
				cga.walkList([
					[thisobj.data.talkPos[0], thisobj.data.talkPos[1]]
				], () => {
					cga.turnTo(thisobj.data.npcPos[0], thisobj.data.npcPos[1]);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('登入点') != -1) {
							cga.ClickNPCDialog(4, -1);
							cb(true)
							return
						} else if (dlg && dlg.message.indexOf('您没有达到能够设定登陆点的条件') != -1) {
							cb(false)
							return
						}
	
						setTimeout(() => {
							thisobj.func.settle(cb)
						}, 2000);
					});
				});
			})
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