var thisobj = {
	taskName: '定居阿凯鲁法村',
	taskStages: [
		{
			intro: '0.检查是否可以直接定居。',
			workFunc: function (cb2) {
				let mainMap = cga.travel.switchMainMap()
				if (mainMap != '阿凯鲁法村') {
					throw new Error('必须要在阿凯鲁法村启动')
				}
				thisobj.func.settle((r)=>{
					// 设定登入点成功，定居任务结束
					if (r === true){
						console.log('定居成功。')
						cb2('jump', thisobj.taskStages.length)
						return
					}
					// 设定不成功，任务继续。
					cb2(true)
					return
				})
			}
		},
		{
			intro: '1.前往阿凯鲁法村与小次郎（119.115）对话，选“是”、“是”获得【清澈水】。',
			workFunc: function(cb2){
				cga.travel.autopilot('主地图', ()=>{
					cga.askNpcForObj({ act: 'item', target: '清澈水', npcpos: [119, 115] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '2.前往夏姆吉诊所（121.155）与阿达巴（11.10）对话，交出【清澈水】获得【纪念宝石】。',
			workFunc: function(cb2){
				cga.travel.autopilot('夏姆吉诊所', ()=>{
					cga.askNpcForObj({ act: 'item', target: '纪念宝石', npcpos: [11, 10] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '3.前往银行（139.136）与银行员（32.17）对话，交出【纪念宝石】获得【黄金箱】。',
			workFunc: function(cb2){
				cga.travel.autopilot('银行', ()=>{
					cga.askNpcForObj({ act: 'item', target: '黄金箱', npcpos: [32, 17] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '4.前往冒险者旅馆（192.208）与利克嘉（21.5）对话，交出【黄金箱】获得【马查招待券】。',
			workFunc: function(cb2){
				cga.travel.autopilot('医院', ()=>{
					cga.askNpcForObj({ act: 'item', target: '马查招待券', npcpos: [21, 5] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '5.前往马查酒吧（192.162）与会长（25.19）对话，交出【马查招待券】获得【马查咖哩饭】。',
			workFunc: function(cb2){
				cga.travel.autopilot('马查酒吧', ()=>{
					cga.askNpcForObj({ act: 'item', target: '马查咖哩饭', npcpos: [25, 19] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '6.与小次郎（119.115）对话，交出【马查咖哩饭】获得【推荐函】。',
			workFunc: function(cb2){
				cga.travel.autopilot('主地图', ()=>{
					cga.askNpcForObj({ act: 'item', target: '推荐函', npcpos: [119, 115] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '7.前往阿凯鲁法城（183.104）三楼谒见之间与伦达国王（24.20）对话，交出【推荐函】获得阿凯鲁法村定居权，任务完结。',
			workFunc: function(cb2){
				cga.travel.autopilot('谒见之间', ()=>{
					cga.askNpcForObj({ act: 'msg', target: '登录点', npcpos: [24, 20] }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '8.完成任务后定居。',
			workFunc: function (cb2) {
				thisobj.func.settle((r)=>{
					// 设定登入点成功，定居任务结束
					if (r === true){
						console.log('定居成功。')
						cb2(true)
						return
					}
					// 设定不成功，重做任务。
					console.log('定居失败，重做任务。')
					cb2('jump', 0)
					return
				})
			}
		},
		],
	taskRequirements: [
		()=>{
			return false
		},
		()=>{
			return cga.getItemCount('清澈水') > 0;
		},
		()=>{
			return cga.getItemCount('纪念宝石') > 0;
		},
		()=>{
			return cga.getItemCount('黄金箱') > 0;
		},
		()=>{
			return cga.getItemCount('马查招待券') > 0;
		},
		()=>{
			return cga.getItemCount('马查咖哩饭') > 0;
		},
		()=>{
			return cga.getItemCount('#16223') > 0;
		},
	],
	data: {// 任务数据，可自定义，方便使用
		talkPos: [99, 164],
		npcPos: [99, 163]
	},
	func: {// 任务自定义函数
		settle: (cb) => {
			cga.travel.autopilot('主地图', ()=>{
				cga.walkList([
					[thisobj.data.talkPos[0], thisobj.data.talkPos[1]]
				], () => {
					cga.turnTo(thisobj.data.npcPos[0], thisobj.data.npcPos[1]);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('登录点') != -1) {
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