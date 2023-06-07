var thisobj = {
	taskName: '就职樵夫',
	taskStages: [
		{
			intro: '1.到法兰城内职业介绍所[193.51]找募集樵夫的阿空交谈并学习伐木体验技能。',
			workFunc: function (cb2) {
				cga.skill.learn('伐木体验', () => {
					cb2(true)
				})
			}
		},
		{
			intro: '2.学到技能后再到法兰城外的树旁使用伐木体验技能伐下20个孟宗竹。',
			workFunc: function (cb2) {
				if (cga.needSupplyInitial({})) {
					cga.travel.toHospital(() => {
						setTimeout(() => {
							cb2('restart stage');
						}, 3000);
					}, false)
					return;
				}
				cga.travel.falan.toStone('E', () => {
					cga.walkList([
						[281, 88, '芙蕾雅']
					], () => {
						var skill = cga.findPlayerSkill('伐木体验');
						cga.StartWork(skill.index, 0);
						var waitEnd = function (cb2) {
							cga.AsyncWaitWorkingResult(() => {
								var playerInfo = cga.GetPlayerInfo();
								if (playerInfo.mp == 0) {
									cb2(true);
									return;
								}
								if (cga.getItemCount('孟宗竹') >= 20) {
									// 过河拆桥，把技能删除
									thisobj.func.forgetSkill(cb2)
									return;
								}
								var item = cga.getInventoryItems().find((it) => {
									return ((it.name == '印度轻木' || it.name == '竹子') && it.count == 20)
								});
								if (item) {
									cga.DropItem(item.pos);
								}
								cga.StartWork(skill.index, 0);
								waitEnd(cb2);
							}, 10000);
						}
						waitEnd(cb2);
					});
				});
			}
		},
		{
			intro: '3.带着伐下的孟宗竹回到法兰城内艾文蛋糕店[216.148]内找艾文交谈后就可以换到手斧。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '手斧？', npcpos : [12, 5] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.travel.autopilot('艾文蛋糕店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('E1', () => {
						go()
					});
				}
			}
		},
		{
			intro: '4.然后再到城内[106.190]的地点找樵夫弗伦（凌晨及白天出现）换取树苗。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '树苗？', npcpos : [106, 191] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.walkList([
						[107, 191],
					], () => {
						cga.task.waitForNPC('樵夫弗伦', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					});
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('S1', go);
				}
			}
		},
		{
			intro: '5.利用白天时再把树苗交给种植家阿姆罗斯（134，36） 交给他之后就可以换取到水色的花。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '水色的花？', npcpos : [134, 36] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.walkList([
						[134, 37],
					], () => {
						cga.task.waitForNPC('种树的阿姆罗斯', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					});
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('S1', go);
				}
			}
		},
		{
			intro: '6.换到花之后再把他交给弗伦后就可以再换到木柴。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '木材？', npcpos : [106, 191] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.walkList([
						[107, 191],
					], () => {
						cga.task.waitForNPC('樵夫弗伦', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					});
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('S1', go);
				}
			}
		},
		{
			intro: '7.前往法兰城艾文蛋糕店与蛋糕店的艾文对话，交出【木材？】获得【艾文的饼干】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '艾文的饼干', npcpos : [12, 5] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.travel.autopilot('艾文蛋糕店', () => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('E1', go);
				}
			}
		},
		{
			intro: '8.返回法兰城（106.191）处与樵夫弗伦对话，交出【艾文的饼干】获得【樵夫推荐信】。',
			workFunc: (cb2) => {
				var obj = { act: 'item', target: '樵夫推荐信', npcpos : [106, 191] }
				var mapindex = cga.GetMapIndex().index3

				var go = () => {
					cga.walkList([
						[107, 191],
					], () => {
						cga.task.waitForNPC('樵夫弗伦', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					});
				}

				if (mapindex == 1000) {
					go()
				} else {
					cga.travel.falan.toStone('S1', go);
				}
			}
		},
		{
			intro: '9.前往法兰城职业介绍所（195.50）与樵夫荷拉巴斯（7.11）对话即可就职樵夫，任务完结。',
			workFunc: (cb2) => {
				var obj = { act: 'job', target: thisobj.data.job.job}
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {//伐木体验
			return (cga.findPlayerSkill('伐木体验')) ? true : false;
		},
		function () {//孟宗竹>=20
			return (cga.getItemCount('孟宗竹') >= 20) ? true : false;
		},
		function () {//手斧
			return (cga.getItemCount('#18179') > 0) ? true : false;
		},
		function () {//树苗
			return (cga.getItemCount('#18180') > 0) ? true : false;
		},
		function () {//水色的花
			return (cga.getItemCount('#18181') > 0) ? true : false;
		},
		function () {//木材
			return (cga.getItemCount('#18178') > 0) ? true : false;
		},
		function () {//艾文的饼干
			return (cga.getItemCount('#18212') > 0) ? true : false;
		},
		function () {//樵夫推荐信
			return (cga.getItemCount('樵夫推荐信') > 0) ? true : false;
		},
		function () {
			return (cga.job.getJob().job == '樵夫') ? true : false;
		},
	],
	data: {// 任务静态数据，可自定义，方便使用
		job: cga.job.getJob('樵夫')
	},
	func: {// 任务自定义函数
		// 删除伐木体验，这个技能除本任务外，没有其它用处
		forgetSkill: (cb) => {
			var skill = cga.skill.getSkill('伐木体验')
			var obj = { act: 'forget', target: skill.name, npcpos : skill.npcpos }
			cga.travel.falan.toStone('E2', () => {
				cga.travel.autopilot(skill.npcMap, () => {
					cga.askNpcForObj(obj, () => {
						cb(true)
					})
				})
			});
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