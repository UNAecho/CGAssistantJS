var thisobj = {
	taskName: '格斗士就职',
	taskStages: [
		{
			intro: '0.任务准备。',
			workFunc: function (cb2) {
				thisobj.func.bankObj.prepare(() => {
					thisobj.func.healObj.func(() => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '1.前往奇利村。',
			workFunc: function (cb2) {
				let go = () => {
					cb2(true)
				}

				// 逃跑赶路
				cga.loadBattleConfig('战斗赶路')

				cga.travel.toVillage('奇利村', () => {
					// 如果是徒步走到村镇，还需要再次回补
					if (cga.needSupplyInitial({})) {
						cga.travel.toHospital(() => {
							go()
						});
						return;
					}

					go()
				})
			}
		},
		{
			intro: '2.逃跑赶路，通过洪恩大风洞，至大厅',
			workFunc: function (cb2) {
				// 逃跑赶路
				cga.loadBattleConfig('战斗赶路')

				let path = [[380, 324, 23600],]
				let mapInfo = cga.getMapInfo();
				if (mapInfo.name == '奇利村') {
					cga.travel.autopilot('东门', () => {
						cb2('restart stage');
					})
					return
				} else if (mapInfo.index3 == 300) {
					if (mapInfo.x < 377) {
						path.unshift(
							[318, 336],// 防止走路在石头中卡住
							[356, 334, '角笛大风穴'],
							[133, 26, '索奇亚'],
						)
					}
				} else if (mapInfo.name == '角笛大风穴') {
					path.unshift([133, 26, '索奇亚'],)
				}

				cga.walkList(path, () => {
					cb2(true)
				})
			}
		},
		{
			intro: '3.与柜台小姐真奈美对话，进入狮子之穴。',
			workFunc: function (cb2) {
				cga.disbandTeam(() => {
					let obj = { act: 'map', target: 23604, npcpos: [23, 33] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '4.心之房，与BOSS对话交战。',
			workFunc: function (cb2) {

				// 直接合击
				cga.loadBattleConfig('BOSS合击不防御')
				// 开启任务playerThink
				cb2('playerThink on')

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: [2, 21] }, (r) => {
					if (r && r == 'ok') {
						let obj = { act: 'map', target: 23605, npcpos: [29, 21], waitLocation: 23604 }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						cb2('jump', thisobj.taskStages.length)
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '5.技之房，与BOSS对话交战。',
			workFunc: function (cb2) {

				// 直接合击
				cga.loadBattleConfig('BOSS合击不防御')
				// 开启任务playerThink
				cb2('playerThink on')

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: [2, 21] }, (r) => {
					if (r && r == 'ok') {
						let obj = { act: 'map', target: 23606, npcpos: [29, 21], waitLocation: 23605 }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						cb2('jump', thisobj.taskStages.length)
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '6.体之房，与BOSS对话交战。',
			workFunc: function (cb2) {

				// 直接合击
				cga.loadBattleConfig('BOSS合击不防御')
				// 开启任务playerThink
				cb2('playerThink on')

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: [2, 21] }, (r) => {
					if (r && r == 'ok') {
						let obj = { act: 'map', target: 23607, npcpos: [29, 21], waitLocation: 23606 }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						cb2('jump', thisobj.taskStages.length)
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '7.六角型擂台，与BOSS对话交战。',
			workFunc: function (cb2) {

				// 直接合击
				cga.loadBattleConfig('BOSS合击不防御')
				// 开启任务playerThink
				cb2('playerThink on')

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: [2, 21] }, (r) => {
					if (r && r == 'ok') {
						let obj = { act: 'map', target: 23603, npcpos: [25, 25], waitLocation: 23607 }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						cb2('jump', thisobj.taskStages.length)
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '8.战斗胜利，进入导师房间，与绿先生对话，获得推荐信',
			workFunc: function (cb2) {
				// 如果之前收回了宠物，现在要放出来
				if (thisobj.data.petIndex != -1) {
					cga.ChangePetState(thisobj.data.petIndex, cga.PET_STATE_BATTLE)
				}
				cga.disbandTeam(() => {
					let obj = { act: 'item', target: '格斗家推荐信', npcpos: [13, 15] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '9.与导师对话，完成职业变动。',
			workFunc: function (cb2) {

				cga.disbandTeam(() => {
					if (cga.job.getJob().job == '格斗士') {
						cb2(true)
						return
					}
					let obj = { act: 'job', target: '格斗士', npcpos: thisobj.data.jobObj.npcpos }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '10.学习得意技。',
			workFunc: function (cb2) {

				cga.disbandTeam(() => {
					if (cga.findPlayerSkill('混乱攻击')) {
						// 如果持有混乱攻击，推测为打手。回到入口23600大厅。
						cga.askNpcForObj({ act: 'map', target: 23600 ,npcpos: [14, 7]}, () => {
							cb2(true)
						})
						return
					}

					cga.askNpcForObj({ act: 'skill', target: '混乱攻击' }, () => {
						cb2(true)
					})
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return false;
		},
		function () {
			let mapInfo = cga.getMapInfo();
			if (mapInfo.name == '奇利村') {
				return true
			} else if (mapInfo.index3 == 300) {
				return true
			} else if (mapInfo.index3 == 13001) {
				return true
			}
			return false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23600) ? true : false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23604) ? true : false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23605) ? true : false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23606) ? true : false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23607) ? true : false;
		},
		function () {
			return (cga.getMapInfo().index3 == 23603) ? true : false;
		},
		function () {
			return false;
		},
		function () {
			return false;
		},
		function () {
			return false;
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		jobObj: cga.job.getJob('格斗士'),
		petIndex: -1
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取魔币.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo();
		let teamplayers = cga.getTeamPlayers()
		// let items = cga.GetItemsInfo();
		let index = cga.GetMapIndex().index3

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			teamplayers: teamplayers,
			// inventory: items.filter((item) => {
			// 	return item.pos >= 8 && item.pos < 100;
			// }),
			// equipment: items.filter((item) => {
			// 	return item.pos >= 0 && item.pos < 8;
			// }),
			result: null,
		}

		if (index == 23603) {
			console.log('抵达就职房间，taskPlayerThink结束')
			return false
		}

		// 进入绿先生房间，或者宠物忠诚低于40，要收起宠物
		if (ctx.petinfo && (index == 23607 || ctx.petinfo.loyality < 40)) {
			// 记录被收回的宠物，打完绿先生需要复原
			thisobj.data.petIndex = ctx.petinfo.index
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
			console.log('宠物已回收不出战..')
		}

		if (ctx.teamplayers.length != thisobj.param.teammates.length) {
			let xy = cga.GetMapXY();
			if (index > 23600 && xy.x < 5) {
				// console.log('BOSS战前组队，暂时阻止playerthink的组队监测..')
			} else {
				console.log('队伍与预设值', thisobj.param.teammates, '不符，中断任务')
				return function (cb) {
					// 返回任务的第index步
					cb(thisobj.taskStages.length)
				}
			}
		}

		if (ctx.playerinfo.souls > 0) {
			console.log('人物掉魂，中断任务')
			return function (cb) {
				thisobj.func.bankObj.prepare(() => {
					thisobj.func.healObj.func(() => {
						cb(0)
					})
				})
			}
		}

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param

		if (!thisobj.param.hasOwnProperty('teammates') || !thisobj.param.teammates instanceof Array) {
			throw new Error('参数错误：teammates。队伍成员必须在外部传入，否则无法执行逻辑。')
		}

		// 判断队长队员
		thisobj.data.isTeamLeader = thisobj.param.teammates[0] == cga.GetPlayerInfo().name

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;

		// 任务初始化，刷新角色的晋级任务状态
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;