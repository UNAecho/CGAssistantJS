var thisobj = {
	taskName: '咖哩任务',
	taskStages: [
		{//0
			intro: '1.任务准备',
			workFunc: function (cb2) {
				thisobj.func.healObj.func(() => {
					cb2(true)
				})
			}
		},
		{//1
			intro: '2.前往维诺亚村荷特尔咖哩店（49.58）与村姑诗特（11.6）对话，获得【料理？】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: 18320, npcpos: [11, 6] }
				cga.travel.toVillage('维诺亚村', () => {
					cga.travel.autopilot('荷特尔咖哩店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
				return
			}
		},
		{//2
			intro: '3.前往伊尔村旧金山酒吧（32.65）与服务生霍特（14.12）对话，交出【料理？】获得【点心？】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: 18321, npcpos: [14, 12] }
				cga.travel.toVillage('伊尔村', () => {
					cga.travel.autopilot('旧金山酒吧', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
				return
			}
		},
		{//3
			intro: '4.前往圣拉鲁卡村食品店（50.64）与新娘莎瓦（16.9）对话，交出【点心？】获得【点心？】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: 18322, npcpos: [16, 9] }
				cga.travel.toVillage('圣拉鲁卡村', () => {
					cga.travel.autopilot('食品店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
				return
			}
		},
		{//4
			intro: '5.返回维诺亚村荷特尔咖哩店与村姑诗特对话，交出【点心？】，生产系（护士、医生除外）获得晋阶资格，任务完结。',
			workFunc: function (cb2) {
				let obj = { act: 'msg', target: '资格', npcpos: [11, 6] }
				cga.travel.toVillage('维诺亚村', () => {
					cga.travel.autopilot('荷特尔咖哩店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
				return
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {//1.任务准备
			return false;
		},
		function () {//2.前往维诺亚村荷特尔咖哩店（49.58）与村姑诗特（11.6）对话，获得【料理？】。
			return cga.findItem(18320) != -1 ? true : false;
		},
		function () {//3.前往伊尔村旧金山酒吧（32.65）与服务生霍特（14.12）对话，交出【料理？】获得【点心？】。
			return cga.findItem(18321) != -1 ? true : false;
		},
		function () {//4.前往圣拉鲁卡村食品店（50.64）与新娘莎瓦（16.9）对话，交出【点心？】获得【点心？】。
			return cga.findItem(18322) != -1 ? true : false;
		},
		function () {//5.返回维诺亚村荷特尔咖哩店与村姑诗特对话，交出【点心？】，生产系（护士、医生除外）获得晋阶资格，任务完结。
			return false;
		},
	],
	taskPlayerThink: () => {
		return true
	},
	data: {// 任务数据，可自定义，方便使用

	},
	func: {// 任务自定义函数
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
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