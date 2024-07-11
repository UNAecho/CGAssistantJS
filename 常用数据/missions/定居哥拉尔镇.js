var thisobj = {
	taskName: '定居哥拉尔镇',
	taskStages: [
		{
			intro: '0.检查是否可以直接定居。',
			workFunc: function (cb2) {
				let mainMap = cga.travel.switchMainMap()
				if (mainMap != '哥拉尔镇') {
					throw new Error('必须要在哥拉尔镇启动')
				}
				thisobj.func.settle((r) => {
					// 设定登入点成功，定居任务结束
					if (r === true) {
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
			intro: '1.前往哥拉尔镇民房（89.64）与金梅婆婆（7.5）对话，选“是”获得【老婆婆的黑轮】。',
			workFunc: function (cb2) {
				cga.travel.autopilot(43170, () => {
					cga.askNpcForObj({ act: 'item', target: '老婆婆的黑轮', npcpos: [7, 5], showmsg: true }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '2.前往哥拉尔镇（170.114）处，持有【老婆婆的黑轮】与金多吉爷爷对话，选“是”交出【老婆婆的黑轮】获得【吉比雷的帽子】。',
			workFunc: function (cb2) {
				cga.travel.autopilot('主地图', () => {
					cga.askNpcForObj({ act: 'item', target: '吉比雷的帽子', npcpos: [170, 114], showmsg: true  }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '3.前往阿凯鲁法村与医师吉比雷（228.201）对话，交出【吉比雷的帽子】获得【吉比雷的胃肠药】。',
			workFunc: function (cb2) {
				cga.travel.goAbroad('苏国', false, () => {
					cga.travel.autopilot('主地图', () => {
						cga.askNpcForObj({ act: 'item', target: '吉比雷的胃肠药', npcpos: [228, 201], showmsg: true  }, () => {
							setTimeout(cb2, 1000, true);
						})
					})
				})
			}
		},
		{// TODO 此处可不用坐船，直接登出后想办法回到哥拉尔即可。坐船有点浪费时间
			intro: '4.返回哥拉尔镇与金多吉爷爷（170.114）对话，交出【吉比雷的胃肠药】获得【黑轮串】。',
			workFunc: function (cb2) {
				cga.travel.goAbroad('艾尔巴尼亚王国', false, () => {
					cga.travel.autopilot('主地图', () => {
						cga.askNpcForObj({ act: 'item', target: '黑轮串', npcpos: [170, 114], showmsg: true  }, () => {
							setTimeout(cb2, 1000, true);
						})
					})
				})
			}
		},
		{
			intro: '5.返回民房（89.64）与金梅婆婆（7.5）对话，交出【黑轮串】获得【吉比雷的桌子钥匙】。',
			workFunc: function (cb2) {
				cga.travel.autopilot(43170, () => {
					cga.askNpcForObj({ act: 'item', target: '吉比雷的桌子钥匙', npcpos: [7, 5], showmsg: true  }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '6.调查书桌（15.3），选“是”交出【吉比雷的桌子钥匙】获得【哥拉尔市民权状】。',
			workFunc: function (cb2) {
				cga.travel.autopilot(43170, () => {
					cga.askNpcForObj({ act: 'item', target: '哥拉尔市民权状', npcpos: [15, 3], showmsg: true  }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '7.持有【哥拉尔市民权状】与艾尔菲那斯女王（58.46）对话，交出【哥拉尔市民权狀】获得哥拉尔镇定居权，任务完结。',
			workFunc: function (cb2) {
				cga.travel.autopilot('谒见之间', () => {
					cga.askNpcForObj({ act: 'msg', target: '登录点', npcpos: [58, 46], showmsg: true  }, () => {
						setTimeout(cb2, 1000, true);
					})
				})
			}
		},
		{
			intro: '8.完成任务后定居。',
			workFunc: function (cb2) {
				thisobj.func.settle((r) => {
					// 设定登入点成功，定居任务结束
					if (r === true) {
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
		() => {
			return false
		},
		() => {
			return cga.getItemCount('老婆婆的黑轮') > 0;
		},
		() => {
			return cga.getItemCount('吉比雷的帽子') > 0;
		},
		() => {
			return cga.getItemCount('吉比雷的胃肠药') > 0;
		},
		() => {
			return cga.getItemCount('黑轮串') > 0;
		},
		() => {
			return cga.getItemCount('吉比雷的桌子钥匙') > 0;
		},
		() => {
			return cga.getItemCount('哥拉尔市民权状') > 0;
		},
		() => {
			return false
		},
	],
	data: {// 任务数据，可自定义，方便使用
		talkPos: [118, 106],
		npcPos: [118, 105]
	},
	func: {// 任务自定义函数
		settle: (cb) => {
			cga.travel.autopilot('主地图', () => {
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