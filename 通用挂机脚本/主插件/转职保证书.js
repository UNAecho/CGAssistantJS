var fs = require('fs');
var Async = require('async');
var updateConfig = require('./../公共模块/修改配置文件');
var teamMode = require('./../公共模块/组队模式');
var configMode = require('./../公共模块/读取战斗配置');
var supplyMode = require('./../公共模块/智能回补');
var update = require('../公共模块/修改配置文件');

var cga = global.cga;
var configTable = global.configTable;

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : '传咒驯互转'})
	},5000)
}

cga.waitTeammateSay((player, msg)=>{

	if(msg.indexOf('长老之证x7 GET') >= 0 ){
		thisobj.callZLZZ = true;
	}

	return true;
});

// 重置任务进度以及组队成员
var rollBack = (cb, result, obj) => {
	delete thisobj.spawnOfAmber4.teammates
	// 因为taskStep代表已完成的步骤，读取时会做第n+1步。如果要从任务第0步开始做，这里就需要填-1来使 n + 1 = 0
	thisobj.spawnOfAmber4.taskStep = -1
	// 重置任务flag状态
	thisobj.callZLZZ = false;
	thisobj.spawnOfAmber4.fuckBoss = false

	task.jumpToStep = 0
	
	update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
		configMode.manualLoad('战斗赶路')
		setTimeout(cb, 1000, result, obj)
	})
	return
}

var loadBattleConfig = ()=>{
	var job = cga.job.getJob()
	if(job.job != '传教士'){
		configMode.manualLoad('BOSS合击')
	}else{
		configMode.manualLoad('传教士任务')
	}

	return
}

var walkMazeForward = (cb)=>{
	cga.walkRandomMaze(null, (err)=>{
		console.log(err);
		cb(err);
	}, {
		layerNameFilter : (layerIndex)=>{
			return '海底墓场外苑第'+(layerIndex + 1)+'地带';
		},
		entryTileFilter : (e)=>{
			return e.colraw == 0x462F;
		}
	});
}

var walkMazeBack = (cb)=>{
	var map = cga.GetMapName();
	if(map == '？？？'){
		cb(null);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		console.log(err);
		cb(err);
	}, {
		layerNameFilter : (layerIndex)=>{
			return layerIndex > 1 ? '海底墓场外苑第'+(layerIndex - 1)+'地带': '？？？';
		},
		entryTileFilter : (e)=>{
			return e.colraw == 0x462E || e.colraw == 0;
		}
	});
}

var goodToGoZLZZ = (cb)=>{
	// 长老之证数量，用于定时打印log。
	let cntCache = 0

	var findObj = (cb3)=>{
		var objs = cga.getMapObjects();
		var pos = cga.GetMapXY();
		if(objs.length){
			for(var i in objs){
				if(objs[i].mapx != pos.x || objs[i].mapy != pos.y){
					cb3(objs[0]);
					return;
				}
			}
		}
		setTimeout(findObj, 1000, cb3);
	}
			
	var battleAgain = ()=>{

		if(cga.isInBattle()){
			setTimeout(battleAgain, 5000);
			return;
		}

		let cnt = cga.getItemCount('长老之证')
		// 实时播报进度
		if(cntCache != cnt){
			cntCache = cnt
			console.log('当前长老之证数量:' + cntCache)
		}

		// 集齐长老之证的人要喊出来已完成。
		if(cnt >= 7){
			cga.SayWords('长老之证x7 GET', 0, 3, 1);
			cb(true);
			return;
		}


		// 因为全局有cga.waitTeammateSay，所以上面有人喊了之后，会把thisobj.callZLZZ置为true，那么没有集齐长老之证的人，流程也会进行到下一步。
		if(thisobj.callZLZZ){
			cb(true);
			return;
		}
		
		cga.cleanInventory(1, ()=>{
			if(thisobj.isLeader)
				cga.ClickNPCDialog(1, 1);
			
			setTimeout(battleAgain, 5000);
		});			
	};
	
	var retryNpc = (result)=>{
		cga.TurnTo(result.xpos, result.ypos);
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			if(dlg && dlg.message && (dlg.message.indexOf('已死的主人') >= 0 || dlg.message.indexOf('呼呼呼呼呼') >= 0 || dlg.message.indexOf('嘻嘻嘻嘻嘻嘻') >= 0)){
				setTimeout(battleAgain, 1000);
			}
			else
			{
				setTimeout(retryNpc, 5000, result);
			}
		});
	}

	var search = ()=>{
		var blackList = [];
		cga.searchMap((units) => {
			return units.find(u => u.unit_name == '守墓员' && u.type == 1 && u.model_id != 0) || cga.GetMapName() == '？？？'
		}, (err, result) => {
			
			if(cga.GetMapName() == '？？？'){
				goodToGoZLZZ(cb);
				return;
			}
			
			if(result && result.unit_name == '守墓员'){
				retryNpc(result);
			} else {
				walkMazeForward(search);
			}
		});
	}
	// 打长老之证前读取战斗配置
	loadBattleConfig()

	if(thisobj.isLeader){
		findObj((obj)=>{
			cga.walkList([
				[obj.mapx, obj.mapy, '海底墓场外苑第1地带']
			], search);
		});
	} else {
		setTimeout(battleAgain, 5000);
	}
}

var zhanglaozhizheng = (cb)=>{
	cga.buildTeam(thisobj.spawnOfAmber4.teammates, 300000, [131, 66], (r) => {
		if (r && r == 'ok') {
			goodToGoZLZZ(cb);
			return
		} else if (r && r == 'timeout') {// 如果超时，则重置任务相关数据，回到任务第一步
			rollBack(cb, 'jump', 0)
			return
		} else {
			throw new Error('cga.buildTeam返回类型错误')
		}
	})
}

var goodToGoZDZ = (cb)=>{
	
	var retry = ()=>{
		var pos = cga.GetMapXY();
		if (pos.x == 163 && pos.y == 100){
			return
		}

		if(cga.findNPCByPosition('障碍物', 213, 226)){
			cga.turnDir(2);
		}
		setTimeout(retry, 1000);
		return
	
	}

	var findZDZ_D = ()=>{
		cga.walkList([
			[193, 184],
		], ()=>{
			if(cga.findNPCByPosition('障碍物', 192, 184)){
				cga.turnTo(192, 184);
				return;
			}
			cga.SayWords('错误：找不到任何活着的障碍物!', 0, 3, 1);
			return;
		});
	}
	
	var findZDZ_C = ()=>{
		cga.walkList([
			[234, 202],
		], ()=>{
			if(cga.findNPCByPosition('障碍物', 235, 202)){
				cga.turnTo(235, 202);
				return;
			}
			findZDZ_D();
			return;
		});
	}
	
	var findZDZ_B = ()=>{
		cga.walkList([
			[229, 177],
		], ()=>{
			if(cga.findNPCByPosition('障碍物', 230, 177)){
				cga.turnTo(230, 177);
				return;
			}
			findZDZ_C();
			return;
		});
	}
	
	var findZDZ_A = ()=>{
		cga.walkList([
			[213, 225],
		], retry);
	}
	
	if(thisobj.isLeader)
	{
		setTimeout(findZDZ_A, 1000);
	}
	
	var battleAgain = ()=>{

		if(cga.isInBattle()){
			setTimeout(battleAgain, 1500);
			return;
		}
		
		var pos = cga.GetMapXY();
		if(pos.x == 163 && pos.y == 100){
			cb(true);
			return;
		}
		
		setTimeout(battleAgain, 1500);
	};

	setTimeout(battleAgain, 1500);
}

var zudangzhe = (cb)=>{
	cga.buildTeam(thisobj.spawnOfAmber4.teammates, 300000, [213, 166], (r) => {
		if (r && r == 'ok') {
			goodToGoZDZ(cb);
			return
		} else if (r && r == 'timeout') {// 如果超时，则重置任务相关数据，回到任务第一步
			rollBack(cb, 'jump', 0)
			return
		} else {
			throw new Error('cga.buildTeam返回类型错误')
		}
	})
}

var task = cga.task.Task('琥珀之卵4', [
	{//0
		intro: '0.进行一些前期处理工作。',
		workFunc: function(cb2){
			if(thisobj.spawnOfAmber4.teammates){
				cb2(true)
				return
			}

			cga.travel.newisland.toStone('X', ()=>{
				let doneNick = 'done'
				// i转职保证书和i觉醒的文言抄本的min:0的作用是为了一次性在cga.buildCustomerTeam中实现组队以及统计任务道具持有情况
				// 这样可以在任务期间不需要另行花费时间来统计BOSS战是否登出。
				let cusObj = {
					'check': {'#620018': { min: 0 },'r输出': { sum: 4 }, 'r治疗': { sum: 1 }, 'r小号': { sum: 0 } },
					'part': thisobj.spawnOfAmber4.part,
					'leaderPos': [thisobj.spawnOfAmber4.leaderX, thisobj.spawnOfAmber4.leaderY],
					'leaderFilter': thisobj.spawnOfAmber4.leaderFilter,
					'dangerLevel': 0,
					'doneNick': doneNick,
					'memberCnt' : 5,
				}
				
				cga.buildCustomerTeam(cusObj, (r) => {
					// 队员监听队长，需要等到超时，才判断队长是否通过队伍的人员构成，所以需要等待全员done
					cga.checkTeamAllDone(doneNick, () => {
						// 记录本次任务的队伍以及道具持有情况
						for (let key of Object.keys(r)){
							if(key == 'teammates'){
								continue
							}
							if(typeof r[key] == 'object'){
								if(r[key].item['620018'] == 0){
									console.log('队员【'+key+'】没有【觉醒的文言抄本】，本次任务需要击倒BOSS，尝试获取文言抄本。注意，抄本是随机掉落的。')
									thisobj.spawnOfAmber4.fuckBoss = true
								}
							}
						}
						thisobj.spawnOfAmber4.teammates = r.teammates
						if(!thisobj.spawnOfAmber4.fuckBoss){
							console.log('全员都持有【觉醒的文言抄本】，本次任务跳过击杀BOSS环节。')
						}

						update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
							cga.disbandTeam(() => {
								setTimeout(cb2, 1000, true);
							})
						})
					})
				})
			});
		}
	},
	{//1
		intro: '1.在艾夏岛冒险者旅馆(102.115)内与时空之人(30.20)对话，输入“朵拉”选“是”，再选“确定”可重置本任务',
		workFunc: function(cb2,index){
			// 如果已经进入？？？开始等待组队，则代表这一步已经进行完毕了
			if(cga.GetMapIndex().index3==59714){
				cb2(true)
				return
			}
			cga.travel.newisland.toPUB(()=>{
				cga.walkList([
				[31, 21],
				], ()=>{
					cga.TurnTo(30, 20);
					cga.AsyncWaitNPCDialog(()=>{
						cga.SayWords('朵拉', 0, 3, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
								thisobj.spawnOfAmber4.taskStep = index
								update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
									setTimeout(cb2, 2000, true);
								})
							});
						});
					});
				});
			});
		}
	},
	{//2
		intro: '2.黄昏或夜晚前往艾尔莎岛神殿·伽蓝（200.96）三楼神殿·里侧大厅，至（48.60）处进入约尔克神庙。调查(39.21)处，获得【琥珀之卵】。',
		workFunc: function(cb2){
			
			if(cga.getItemCount('琥珀之卵') > 0){
				cb2(true);
				return;
			}
			
			var retry = ()=>{
				cga.cleanInventory(1, ()=>{
					cga.turnTo(39, 21);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(!(dlg && dlg.message.indexOf('感觉脑海中有什么声响') >= 0)){
							setTimeout(retry, 5000);
							return;
						}
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(32, 0);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(32, 0);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(32, 0);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(1, 0);
												setTimeout(cb2, 1000, true);
											});
										});
									});
								});
							});
						});
					});
				});				
			}
			
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[201, 96, '神殿　伽蓝'],
				[95, 104, '神殿　前廊'],
				[44, 41, '神殿　里侧大厅'],
				[34, 34, 59535],
				[48, 60, '约尔克神庙'],
				[39, 22],
				], ()=>{
					retry();
				});
			});
		}
	},
	{//3
		intro: '3.前往盖雷布伦森林路路耶博士的家(244.76)，进入后再离开路路耶博士的家并传送至？？？。' + "\n" + '通过(142.69)或(122.69)处黄色传送石进入海底墓场外苑，寻找随机出现的守墓者并与之对话进入战斗。',
		workFunc: function(cb2){

			if(cga.getInventoryEmptySlotCount() < 3){
				console.log('【UNAecho脚本警告】你背包的空闲格子少于3个，长老之证是3个1组，想打满7个，需要3个背包空位。如果全队人都不满足此条件，将会出现在海底无限与NPC交战。请清理背包！')
			}

			thisobj.bankObj.prepare(()=>{
				var go =()=>{
					cga.walkList([
						[131, 61],
						], ()=>{
							cga.TurnTo(131, 59);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(dlg && dlg.message.indexOf('还不快点') == -1)
									{
										cga.ClickNPCDialog(32, 0);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(1, 0);
											zhanglaozhizheng(cb2);
										});
									} else {
										cga.ClickNPCDialog(1, 0);
										zhanglaozhizheng(cb2);
									}
								});
							});
						});
				}

				if(cga.needSupplyInitial({  })){
					cga.travel.falan.toCastleHospital(()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					});
					return;
				}

				configMode.manualLoad('战斗赶路')

				var XY = cga.GetMapXY();
				var mapindex = cga.GetMapIndex().index3
				if(mapindex == 59714 && XY.x > 120 && XY.x < 146 && XY.y > 58 && XY.y < 80){
					if(cga.getTeamPlayers().length){
						goodToGoZLZZ(cb2);
					}else{
						go()
					}
				}else{
					cga.travel.newisland.toStone('X', ()=>{
						cga.walkList([
						[130, 50, '盖雷布伦森林'],
						[246, 76, '路路耶博士的家'],
						], ()=>{
							cga.WalkTo(3, 10);
							cga.AsyncWaitMovement({map:['？？？'], delay:1000, timeout:10000}, ()=>{
								go()
							});
						});
					});
				}
			})
		}
	},
	{//4
		intro: '4.集齐7个【长老之证】后返回？？？，由持有7个【长老之证】的队员与荷特普(167.102)对话2次，选“是”交出【长老之证】并传送至盖雷布伦森林。',
		workFunc: function(cb2,index){

			let save = (cb3)=>{
				thisobj.spawnOfAmber4.taskStep = index
				update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
					setTimeout(cb3, 1000, true);
				})
			}

			var sayshit = ()=>{
				// 无论是否持有7个长老之证，最终目标都是被传送至盖雷布伦森林
				cga.waitForLocation({mapname : '盖雷布伦森林'}, ()=>{
					setTimeout(save, 3000, cb2)
				});

				if(cga.getItemCount('长老之证') >= 7){
					console.log('长老之证已集齐7个，回去跟影子对话进行任务下一阶段');
					cga.TurnTo(131, 60);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
							});
						});
					});
				} else {
					console.log('有队友集齐7个长老之证，等待蹭车传送回盖雷布伦森林');
				}
			}
			
			if(thisobj.isLeader){
				var walkShit = ()=>{
					if(cga.GetMapName() == '？？？')
					{
						cga.walkList([
						[131, 61],
						[130, 61],
						[131, 61],
						[130, 61],
						[131, 61],
						], (r)=>{
							sayshit();
						});
						return;
					}
					walkMazeBack(walkShit);
				}
				walkMazeBack(walkShit);				
				return;
			}
			else
			{
				cga.waitForLocation({mapname : '？？？', pos:[131, 60]}, sayshit);
				return;
			}
		}
	},
	{//5
		intro: '5.黄昏或夜晚时至神殿·伽蓝与荷特普(92.138)对话。',
		workFunc: function(cb2,index){
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					[201, 96, '神殿　伽蓝'],
					[91, 138],
				], (r)=>{
					cga.task.waitForNPC('荷特普', ()=>{
						cga.turnTo(92, 138);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(32, -1);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(1, -1);
										setTimeout(()=>{
											thisobj.spawnOfAmber4.taskStep = index
											update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
												setTimeout(cb2, 1000, true);
											})
										}, 3000);
									});
								});
							});
						});
					});
				});
			});
		}
	},
	{//6
		intro: '6.前往艾夏岛冒险者旅馆(102.115)与安洁可(55.32)对话，获得【逆十字】。',
		workFunc: function(cb2){
			
			if(cga.getItemCount('逆十字') > 0){
				cb2(true);
				return;
			}
			
			cga.travel.newisland.toPUB(()=>{
				cga.walkList([
					[56, 32],
				], (r)=>{
					cga.cleanInventory(1, ()=>{
						cga.turnTo(56, 31);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								setTimeout(()=>{
									cb2(true);
								}, 1000);
							});
						});
					});					
				});
			});
		}
	},
	{//7
		intro: '7.前往梅布尔隘地，持有【琥珀之卵】、【逆十字】与祭坛守卫(211.116)对话进入？？？。',
		workFunc: function(cb2){
			let go = ()=>{
				thisobj.bankObj.prepare(()=>{
					if(cga.needSupplyInitial({  })){
						cga.travel.falan.toCastleHospital(()=>{
							setTimeout(()=>{
								cb2('restart stage');
							}, 3000);
						});
						return;
					}
	
					
	
					cga.travel.newisland.toStone('X', ()=>{
						cga.walkList([
							[165, 153],
						], (r)=>{
							cga.TurnTo(165, 154);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(8, -1);
									cga.AsyncWaitMovement({map:['梅布尔隘地'], delay:1000, timeout:10000}, ()=>{
										cga.walkList([
											[211, 117],
										], (r)=>{
											cga.TurnTo(212, 116);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(32, -1);
												cga.AsyncWaitNPCDialog(()=>{
													cga.ClickNPCDialog(1, -1);
													cga.AsyncWaitMovement({map:['？？？'], delay:1000, timeout:10000}, ()=>{
														cb2(r);
													});
												});
											});
										});
									});
								});
							});
						});
					});
				})
			}

			loadBattleConfig()

			go()
		}
	},
	{//8
		intro: '8.击倒(136.197)一带的阻挡者后，进入(156.197)的传送石。9.击倒(213.226)、(235.202)等位置的任意一个阻挡者，随机被传送。',
		workFunc: function(cb2){
			cga.walkList([
				[135, 197],
			], (r)=>{
				var step = 7;
				var go = ()=>{
					cga.ForceMove(0, true);
					if(step > 0){
						step --;
						setTimeout(go, 500);
					}else{
						cga.walkList([
							[156, 197, '？？？', 213, 164],
							], ()=>{
							zudangzhe(cb2);
						});
					}
				}
				setTimeout(go, 1000);
			});
		}
	},
	{//9
		intro: '9.击倒(161.108)一带的阻挡者，经由(241.118)的传送石进入？？？。与BOSS对话，进入战斗。注意：进入战斗即视为战斗胜利，无需击倒BOSS。除非你想获取觉醒的文言抄本，否则可以直接登出，进行下一步。',
		workFunc: function(cb2,index){

			let save = (cb3)=>{
				thisobj.spawnOfAmber4.taskStep = index
				update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
					setTimeout(cb3, 1000, true);
				})
			}
			
			var waitBOSS = ()=>{
				if(cga.isInBattle()){
					if(thisobj.spawnOfAmber4.fuckBoss){
						console.log('本次队内部分人员需要获取文言抄本，等待BOSS战胜利..')
						cga.battle.waitBossBattle('梅布尔隘地', () => {
							save(cb2)
						})
						return
					}else{
						console.log('本次队内人员不需要再次获取文言抄本，跳过BOSS战')
						save(cb2)
					}
					return;
				}
				setTimeout(waitBOSS, 1500);
				return
			}
			
			if(!thisobj.isLeader){
				setTimeout(waitBOSS, 1500);
				return;
			}
			
			cga.walkList([
				[163, 107],
			], (r)=>{
				var step = 4;
				var go = ()=>{
					cga.ForceMove(2, true);
					if(step > 0){
						step --;
						setTimeout(go, 500);
					}else{
						cga.walkList([
						[218, 117],
						[242, 117, 59716],
						[221, 187],
						], ()=>{
							cga.turnTo(222, 188);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(32, -1);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(32, -1);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(32, -1);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(32, -1);
												cga.AsyncWaitNPCDialog(()=>{
													cga.ClickNPCDialog(32, -1);
													cga.AsyncWaitNPCDialog(()=>{
														cga.ClickNPCDialog(8, -1);
														cga.AsyncWaitNPCDialog(()=>{
															cga.ClickNPCDialog(1, -1);

															setTimeout(waitBOSS, 1500);															
														});
													});
												});
											});
										});
									});
								});
							});
						});
					}
				}
				setTimeout(go, 1000);
			});
		}
	},
	{//10
		intro: '10.返回盖雷布伦森林，持有【觉醒的文言抄本】与纳塞(245.73)对话，获得【转职保证书】。',
		workFunc: function(cb2){
			
			var go = () => {
				let bookCnt = cga.getItemCount('转职保证书')

				if(bookCnt > 0){
					console.log('已经有保证书了，任务结束')
					cb2(true)
					return
				}

				cga.walkList([
					[130, 50, '盖雷布伦森林'],
					], ()=>{
						var obj = { act: 'item', target: '转职保证书' }
						cga.askNpcForObj('盖雷布伦森林', [245, 73], obj, () => {
							cb2(true)
						})
					});
			}


			cga.travel.newisland.toStone('X', ()=>{
				let WYWCnt = cga.getItemCount('觉醒的文言抄本')

				let delay = 0
				if(WYWCnt == 0){
					console.log('手上没有文言抄本，等待' + delay / 1000 + '秒后，再去看看指定地点有没有丢弃的文言抄本，如果有，则拾取。')
					delay = 7000
				}

				setTimeout(() => {
					cga.walkList([
						[146, 96]
					], () => {
						if(WYWCnt == 0){
							let itemFilter = (unit) => {
								if (unit.flags == 1024 && unit.item_name == '觉醒的文言抄本') {
									return true
								}
							}
							let units = cga.GetMapUnits().filter(itemFilter);
							if (units && units.length > 0) {
								console.log('地上有文言抄本，捡起来。')
								// 只要捡一个文言抄本即可，多了没用。
								let unit = units[0];
								// 获取一个目标周围空闲的坐标，用于拾取
								walkpos = cga.getRandomSpace(unit.xpos, unit.ypos)
								cga.walkList([
									[walkpos[0], walkpos[1]]
								], () => {
									cga.TurnTo(unit.xpos, unit.ypos)
									setTimeout(go, 1500);
									return
								});
							} else {
								console.log('地上没有发现队友丢的文言抄本，白嫖失败。等待下次任务打BOSS时有几率获取。')
								cb2(true);
								return
							}
						}else if(WYWCnt == 1){
							setTimeout(go, 1500);
						}else{
							let item = cga.findItem('觉醒的文言抄本');

							if(item != -1){
								cga.DropItem(item);
							}
							setTimeout(go, 1500);
						}
					});
				}, delay);
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){//前期处理
			return false;
		},
		function(){//消除任务
			return false;
		},
		function(){//琥珀之卵
			return (cga.getItemCount('琥珀之卵') >= 1) ? true : false;
		},
		function(){//长老之证
			return (cga.getItemCount('长老之证') >= 7 || thisobj.callZLZZ) ? true : false;
		},
		function(){
			return false;
		},
		function(){
			return false;
		},
		function(){//逆十字
			return (cga.getItemCount('逆十字') > 0) ? true : false;
		},
		function(){
			return false;
		},
		function(){
			return false;
		},
		function(){
			return false;
		},
		function(){
			return (cga.getItemCount('转职保证书') > 0 && cga.getItemCount('觉醒的文言抄本') == 0)? true : false;
		},
	]
	);
	// task.anyStepDone = false意为关掉下面步骤做完导致上面步骤直接跳过的方式。
	// 详见cgaapi中的cga.task.Task源码
	task.anyStepDone = false;

var loop = ()=>{
	cga.SayWords('欢迎使用【UNAの脚本】全自动保证书+转职+刷声望流程，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
	task.doTask(()=>{
		if(thisobj.job.job == '暗黑骑士' || thisobj.job.job == '教团骑士'){
			console.log('暗黑骑士和教团骑士无法通过保证书刷称号，直接进入陪打循环。')
			rollBack(()=>{
				setTimeout(loop, 3000);
			})
			return
		}else{
			console.log('任务完成，去阿蒙刷新一下称号。');
			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[230, 82],
				], ()=>{
					cga.turnTo(230, 83);
					setTimeout(() => {
						if(thisobj.spawnOfAmber4.aim == '无限循环' || cga.getItemCount('转职保证书') == 0){
							console.log('称号已满、包中没有保证书或已经不需要再烧声望，重新做本任务。')
							rollBack(()=>{
								setTimeout(loop, 3000);
							})
							return
						}else{
							console.log('未到达满称号，开始转职刷声望')
							setTimeout(jump, 3000);
							return
						}
					}, 3000);
				});
			});
		}
	});
}

var thisobj = {
	taskName : '琥珀之卵4',
	// 队长flag的缓存，通过spawnOfAmber4.part == '队长'判断
	isLeader : false,
	// 自动匹配队伍，记录至此
	teammates : null,
	// 自动存取魔币
	bankObj : require('../子插件/自动存取魔币.js'),
	// 人物职业以及声望信息
	job:cga.job.getJob(),
	// 任务相关flag
	callZLZZ : false,
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{

		if (pair.field == 'sellStore') {
			pair.field = '是否卖石';
			pair.value = pair.value == 1 ? '卖石' : '不卖石';
			pair.translated = true;
			return true;
		}

		if (pair.field == 'spawnOfAmber4') {
			pair.field = '是否自动做' + thisobj.taskName;
			pair.value = pair.value.flag ? '做' : '不做';
			pair.translated = true;
			return true;
		}

		if (supplyMode.translate(pair))
			return true;

		if (teamMode.translate(pair))
			return true;

		if (configMode.translate(pair))
			return true;

		return false;
	},
	loadconfig : (obj)=>{

		if (typeof obj.spawnOfAmber4 == 'object') {
			if (typeof obj.spawnOfAmber4.flag != 'boolean') {
				console.error('读取配置：' + thisobj.taskName + '任务数据失败！智能练级会自动帮做' + thisobj.taskName + '任务，请明确输入相关设定。');
				return false
			}

			if (typeof obj.spawnOfAmber4.part != 'string') {
				console.error('读取配置：' + thisobj.taskName + '任务数据失败！智能练级会自动帮做' + thisobj.taskName + '任务，请明确输入相关设定。');
				return false
			}else{
				thisobj.isLeader = obj.spawnOfAmber4.part == '队长' ? true : false
			}

			if (typeof obj.spawnOfAmber4.aim != 'string' || cga.role.taskRoleArr.indexOf(obj.spawnOfAmber4.aim) == -1) {
				console.error('读取配置：' + thisobj.taskName + '任务数据失败！智能练级会自动帮做' + thisobj.taskName + '任务，请明确输入相关设定。');
				return false
			}
			// 如果离线记录了任务进度，则继续完成余下部分
			if (typeof obj.spawnOfAmber4.taskStep != 'number') {
				console.log('读取配置：' + thisobj.taskName + '任务进度失败，从任务最初开始做任务。');
				task.jumpToStep = 0;
			}else{
				// jumpToStep需要进行taskStep的下一步
				task.jumpToStep = obj.spawnOfAmber4.taskStep + 1
			}
			
			configTable.spawnOfAmber4 = obj.spawnOfAmber4
			thisobj.spawnOfAmber4 = obj.spawnOfAmber4;
		} else {
			console.error('读取配置：' + thisobj.taskName + '任务数据失败！智能练级会自动帮做' + thisobj.taskName + '任务，请明确输入相关设定。');
			return false
		}
		// 获取人物目标职业
		if(!configMode.loadconfig(obj)){
			return false;
		}
		return true;
	},
	inputcb : (cb)=>{
		var stage1 = (cb2) => {
			var saveObj = {}

			var stage1_1 = (cb3) => {
				var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入此任务你是队长还是队员，0队长1队员:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && (value == 0 || value == 1)) {
						saveObj.part = value == 0 ? '队长' : '队员'

						sayString = '当前已选择: 你是【' + saveObj.part + '】';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1_2, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_2 = (cb3) => {
				var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入你做此任务的目的，';
				for (var i in cga.role.taskRoleArr) {
					sayString += i + cga.role.taskRoleArr[i]
				}
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value < cga.role.taskRoleArr.length) {
						saveObj.aim = cga.role.taskRoleArr[value]

						sayString = '当前已选择: 【' + saveObj.aim + '】';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1_3, 500, cb3);
						return false;
					}

					return true;
				});
			}


			var stage1_3 = (cb3) => {
				var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入任务队长在艾尔莎岛的X坐标:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value >= 0 && value <= 999) {
						saveObj.leaderX = value;

						setTimeout(stage1_4, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_4 = (cb3) => {
				var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入任务队长在艾尔莎岛的Y坐标:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value >= 0 && value <= 999) {
						saveObj.leaderY = value;

						setTimeout(stage1_5, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_5 = (cb3) => {
				var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入队长昵称过滤字符，玩家昵称中带有此输入字符才会被认定为队长(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果队长昵称里面包含ok字符，请输入$ok:';
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (msg !== null && msg.length > 0 && msg.indexOf(':') == -1) {
						if (msg == 'ok') {
							saveObj.leaderFilter = '';
						} else if (msg == '$ok') {
							saveObj.leaderFilter = 'ok';
						} else {
							saveObj.leaderFilter = msg;
						}

						sayString = '当前已选择玩家昵称:[' + saveObj.leaderFilter + ']为队长标志。';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1Final, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1Final = (cb3) => {
				configTable.spawnOfAmber4 = saveObj;
				thisobj.spawnOfAmber4 = saveObj;

				cb3(null)
				return
			}

			var sayString = '【全自动练级插件】【' + thisobj.taskName + '】请输入是否自动做【' + thisobj.taskName + '】任务，0不做1做:';
			cga.sayLongWords(sayString, 0, 3, 1);

			cga.waitForChatInput((msg, value) => {
				if (value !== null && (value == 0 || value == 1)) {
					saveObj.flag = value == 1 ? true : false

					sayString = '当前已选择: 【' + thisobj.taskName + '】【' + (saveObj.flag ? '做' : '不做') + '】';
					cga.sayLongWords(sayString, 0, 3, 1);

					// 如果自动做琥珀之卵4，开始输入必要信息
					if (saveObj.flag) {
						setTimeout(stage1_1, 500, cb2);
					} else {
						setTimeout(stage1Final, 500, cb3);
					}
					return false;
				}

				return true;
			});

			return
		}
		
		Async.series([
			stage1,
		], cb);
	},
	execute : ()=>{
		callSubPlugins('init');
		loop();
	},
}

module.exports = thisobj;