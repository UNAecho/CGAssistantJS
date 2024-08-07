var fs = require('fs');
var Async = require('async');
var updateConfig = require('./../公共模块/修改配置文件');
var configMode = require('./../公共模块/读取战斗配置');
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
		configMode.manualLoad('BOSS合击血量高')
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
			return thisobj.maze.prefix+(layerIndex + 1)+thisobj.maze.suffix;
		},
		entryTileFilter : (e)=>{// 逻辑：如果走到迷宫最后一层还是没找到，由于迷宫出入口是一张地图。那就出迷宫，重新从入口进入，再次寻找
			let objs = e.objs
			if(e.colraw == 0){
				for (let i = 0; i < objs.length; i++) {
					// 顶层出口，回到？？？地图。一般是出现没找到守墓者的情况
					if(objs[i].cell == 3 && e.colraws.matrix[objs[i].mapy][objs[i].mapx] == thisobj.maze.backEntryTile){
						console.log('地图中存在后退楼梯，判定传送石为出口')
						return true
					}
				}
			}else if(e.colraw == thisobj.maze.forwardEntryTile){// 楼层+1的楼梯是0x462F，楼层-1是0x462E
				return true
			}
			return false
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
/**
 * UNAecho:TODO:请注意，目前有一个小概率的BUG，但不一定非要修复
 * 寻找守墓员的逻辑是：
 * 1、搜索附近的守墓员，如果有，去对话。
 * 2、对话发现NPC在CD过程中，则加入黑名单。
 * 3、如果对话发现可以打，则一直刷。
 * 4、如果没看见守墓者，使用cga.walkMazeForward的随机走路方式寻找NPC，如果地图探索完，还没发现NPC，则继续使用cga.walkMazeForward下楼梯，回到第1步
 * 
 * 以上是正常逻辑，但小概率BUG是指一些极限状况下，可能出现的问题：
 * 1、同时打的玩家很多，导致看到的守墓者都在CD，或者特别倒霉，一直找不到。
 * 2、找不到守墓者，就一直下楼，直到下到底层，出现黄色水晶（出去就回到？？？了）。还是没发现能打的守墓者
 * 3、这时，cga.walkMazeForward的逻辑无法支撑逻辑了：找又找不到，出又出不去（没有下楼的楼梯了）
 * 4、队长就会进入无限等待状态。一直站立至掉线，或迷宫过期。
 * 
 * 为什么说不一定非要修复：
 * 1、如果让角色走到底层，出传送水晶回到？？？地图，再从第一层重新找，极限状态下还会出现这个问题。
 * 2、这样就会令全队一直交战，总会出现伤亡的情况。
 * 
 * 所以倒不如就一直卡住，等到迷宫重置或人物掉线。至少不会损失惨重（比如宠物过度死亡出现逃跑现象）。
 * 
 * 修复建议：
 * 需要修改cga.walkMazeForward逻辑，或者cga.searchMap逻辑。耗时较大
 * 
 * 简单粗暴的方法：
 * 给cga.searchMap传入一些随机走迷宫的方式，让角色覆盖地图的面积变大。因为cga.walkMazeForward的探索地图逻辑比较简陋。具体如何简陋，请看cga.searchMap的注释
 * 
 * @param {*} cb 
 * @returns 
 */
var goodToGoZLZZ = (cb)=>{
	// 长老之证数量，用于定时打印log。
	let cntCache = 0
	// 守墓者的黑名单，如果有其它玩家与其交战，则短时间内无法与其开战。
	// 设置一个黑名单，规定在一定时间内不与其尝试对话发生战斗。防止一群人在一个NPC面前无限等待，浪费时间
	let blackList = {}

	// 如果角色没有搜索到守墓者，尝试在迷宫中使用cga.getRandomMazePos来获取视野范围外的坐标点（API内已去重）尝试探索。如果超过此次数，则去下一层继续寻找
	let retryCnt = 3
	
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

		if(cga.getTeamPlayers().length != thisobj.spawnOfAmber4.teammates.length){
			console.log('队伍人数与组建时不相等，可能有人掉线，回去等待其加入')
			walkMazeBack(()=>{
				zhanglaozhizheng(cb)
			})
			return
		}

		let cnt = cga.getItemCount('长老之证')

		if(cga.GetMapName() == '？？？' && cnt > 0){
			console.log('刷长老之证过程中，迷宫过期，重新回到新刷出的迷宫中继续..')
			setTimeout(goodToGoZLZZ,1000,cb)
			return;
		}

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
			// 在点击进入战斗这里加一点延迟，为了防止其它角色由于长老之证没有来得及叠加起来就进入了战斗，导致一直被长老之证*1的道具填满背包。
			/**
			 * 这里在点击进入战斗这里加一点延迟
			 * 因为出现一种特殊情况：
			 * 1、战斗所获得的物品，都是1个1个进入角色背包的。
			 * 2、此时，如果角色的背包近乎满格，比如18格，一下子会被长老之证*1的2个道具填满
			 * 3、虽然脚本中有道具叠加的机制，但是由于队长进入战斗太快，根本不给其它角色调整道具的时间
			 * 4、导致这些角色，永远不会再次获得道具，因为一直包满
			 * 
			 * 所以在点击进入战斗前，队长要预留一点时间，给自己和其它角色调整背包
			 */
			if(thisobj.isLeader){
				setTimeout(() => {
					cga.ClickNPCDialog(1, 1);
				}, 1500);
			}
			
			setTimeout(battleAgain, 5000);
		});			
	};
	
	var retryNpc = (result) => {
		cga.TurnTo(result.xpos, result.ypos);
		cga.AsyncWaitNPCDialog((err, dlg) => {
			if (dlg && dlg.message && (dlg.message.indexOf('已死的主人') >= 0 || dlg.message.indexOf('呼呼呼呼呼') >= 0 || dlg.message.indexOf('嘻嘻嘻嘻嘻嘻') >= 0)) {
				setTimeout(battleAgain, 1000);
			} else if (dlg && dlg.message && dlg.message.indexOf('回头见') >= 0) {
				console.log('x:',result.xpos,'y:',result.xpos,'的守墓者处于CD中')
				blackList[result.xpos + '_' + result.ypos] = Date.now()
				setTimeout(search, 1000);
			} else {
				setTimeout(retryNpc, 5000, result);
			}
		});
	}

	var search = ()=>{
		cga.searchMap((units) => {
			return units.find((u) => {
				if(u.unit_name == '守墓员' && u.type == 1 && u.model_id != 0){
					console.log('发现守墓员..')
					// 设置找到的守墓者如果在黑名单中，一定时间内不找他战斗
					if(Date.now() - blackList[u.xpos + '_' + u.ypos] < 300000){
						console.log('x:',u.xpos,'y:',u.xpos,'的守墓者处于CD中，无视它，继续搜索..')
						return false
					}
					// 黑名单时间超时，去掉此NPC
					delete blackList[u.xpos + '_' + u.ypos]
					return true
				}
			}) || cga.GetMapName() == '？？？'
		}, (err, result) => {
			
			if(cga.GetMapName() == '？？？'){
				goodToGoZLZZ(cb);
				return;
			}

			if(cga.getTeamPlayers().length != thisobj.spawnOfAmber4.teammates.length){
				console.log('队伍人数与组建时不相等，可能有人掉线，回去等待其加入')
				walkMazeBack(()=>{
					zhanglaozhizheng(cb)
				})
				return
			}
			
			if(result && result.unit_name == '守墓员'){
				retryNpc(result);
			} else {
				// 尝试次数耗尽前，使用cga.getRandomMazePos来随机探索视野之外的坐标，以此搜索NPC
				if(retryCnt > 0){
					console.log('迷宫轮廓已经探明，探索墙壁轮廓时，没看见守墓员。现在开始获取视野之外的点，继续探索守墓员。')
					console.log('剩余探索次数:',retryCnt,'探索次数耗尽后，将进入下一层继续重复此逻辑')

					// 消耗1次搜索次数，开始尝试随机探索
					retryCnt -= 1

					let outOfView = Object.values(cga.getRandomMazePos())
					if(outOfView.length){
						let randomPos = outOfView[Math.floor(Math.random() * outOfView.length + 1)]
						console.log('本次获取到的视野之外的点:',randomPos)
						cga.walkList([
							[randomPos.x, randomPos.y]
						], search);
						return
					}else{
						console.log('【注意】没找到视野之外的坐标点，建议debug查看问题')
					}
				}
				console.log('已经尝试数次探索视野之外的点，但没发现可攻击的守墓员，调用walkMazeForward进入下一层继续探索..')

				// 复原尝试次数
				retryCnt = 3

				walkMazeForward(search);
			}
		});
	}
	// 打长老之证前读取战斗配置
	loadBattleConfig()

	if(thisobj.isLeader){
		if(cga.GetMapName().indexOf('海底墓场外苑') != -1){
			console.log('已经在海底墓场外苑了，直接进入search..')
			search()
			return
		}
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
	cga.buildTeam({teammates : thisobj.spawnOfAmber4.teammates, timeout:300000, pos : [131, 66]}, (r) => {
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
	cga.buildTeam({teammates : thisobj.spawnOfAmber4.teammates, timeout:300000, pos : [213, 166]}, (r) => {
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
				// i转职保证书和i觉醒的文言抄本的sum: -1的作用是为了一次性在cga.buildCustomerTeam中实现组队以及统计任务道具持有情况。sum: -1是不设数量限制的情况。
				// 这样可以在任务期间不需要另行花费时间来统计BOSS战是否登出。
				// 小号尝试2个是否能安全稳定挂机，如果不能，再改为1个
				let cusObj = {
					'check': {'#620018': { sum: -1 },'r输出': { sum: 4 }, 'r治疗': { sum: 1 }, 'r小号': { sum: 2 } },
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
						// 记录已经组好队了（完成第0步）
						thisobj.spawnOfAmber4.taskStep = 0

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

			var map = cga.GetMapName();

			if(map.indexOf('海底墓场外苑') != -1){
				if(cga.getTeamPlayers().length){
					goodToGoZLZZ(cb2);
					return
				}
			}else if(map == '？？？'){
				if(cga.getTeamPlayers().length){
					goodToGoZLZZ(cb2);
				}else{
					zhanglaozhizheng(cb2);
				}
				return
			}

			thisobj.bankObj.prepare(()=>{
				thisobj.healObj.func(()=>{
					var go =()=>{
						let obj = {act : 'msg', target : '长老之证', npcpos : [131, 60]}
						cga.askNpcForObj(obj,()=>{
							zhanglaozhizheng(cb2);
						})
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
								cga.walkList([
									[3, 10, '？？？']
								], (err)=>{
									if(err && err.message == 'Unexcepted map changed.'){
										console.log('进入？？？失败，可能由于掉线或其他原因导致长老之证流程未完成，任务卡住。回滚任务进度，重新执行..')
										rollBack(cb2, 'jump', 0)
										return
									}
									go()
								});
							});
						});
					}
				})
			})
		}
	},
	{//4
		intro: '4.集齐7个【长老之证】后返回？？？，由持有7个【长老之证】的队员与荷特普(131.60)对话2次，选“是”交出【长老之证】并传送至盖雷布伦森林。',
		workFunc: function(cb2,index){

			let save = (cb3)=>{
				thisobj.spawnOfAmber4.taskStep = index
				update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
					setTimeout(cb3, 1000, true);
				})
			}

			let obj = {act : 'map', target : 59500, npcpos : [131, 60], waitLocation: '？？？', notalk :()=>{
				if(cga.getItemCount('长老之证') < 7){
					return true
				}
				return false
			}}
			
			if(thisobj.isLeader){
				var walkShit = ()=>{
					if(cga.GetMapName() == '？？？')
					{
						cga.askNpcForObj(obj,()=>{
							setTimeout(save, 3000, cb2)
						})
						return;
					}
					walkMazeBack(walkShit);
				}
				walkMazeBack(walkShit);				
				return;
			}else{
				cga.askNpcForObj(obj,()=>{
					setTimeout(save, 3000, cb2)
				})
				return;
			}
		}
	},
	{//5
		intro: '5.黄昏或夜晚时至神殿·伽蓝与荷特普(92.138)对话。',
		workFunc: function(cb2,index){
			let obj = {act : 'msg', target : '异界的神', npcpos : [92, 138]}

			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					[201, 96, '神殿　伽蓝'],
					[91, 138],
				], (r)=>{
					cga.task.waitForNPC('荷特普', ()=>{
						cga.askNpcForObj(obj,()=>{
							setTimeout(()=>{
								thisobj.spawnOfAmber4.taskStep = index
								update.update_config({ spawnOfAmber4: thisobj.spawnOfAmber4 }, true, () => {
									setTimeout(cb2, 1000, true);
								})
							}, 3000);
						})
					});
				});
			});
		}
	},
	{//6
		intro: '6.前往艾夏岛冒险者旅馆(102.115)与安洁可(56, 31)对话，获得【逆十字】。',
		workFunc: function(cb2){
			
			if(cga.getItemCount('逆十字') > 0){
				cb2(true);
				return;
			}

			let obj = {act : 'item', target : '逆十字', npcpos : [56, 31]}
			
			cga.travel.newisland.toPUB(()=>{
				cga.askNpcForObj(obj,()=>{
					cb2(true);
				})
			});
		}
	},
	{//7
		intro: '7.前往梅布尔隘地，持有【琥珀之卵】、【逆十字】与祭坛守卫(211.116)对话进入？？？。',
		workFunc: function(cb2){
			let talkToNPC = ()=>{
				cga.walkList([
					[211, 117],
				], (r)=>{
					cga.TurnTo(212, 116);
					cga.AsyncWaitNPCDialog((err,dlg)=>{
						if(dlg && dlg.message.indexOf('放我一马') != -1){
							console.log('无法进入祭坛，可能是打BOSS时掉线，重新进入的。但其他人进度可能参差不齐，这里需要回滚，重新执行任务。')
							rollBack(cb2, 'jump', 0)
							return
						}
						cga.ClickNPCDialog(32, -1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, -1);
							cga.AsyncWaitMovement({map:['？？？'], delay:1000, timeout:10000}, ()=>{
								cb2(r);
							});
						});
					});
				});
			}
			
			let go = ()=>{
				thisobj.bankObj.prepare(()=>{
					thisobj.healObj.func(()=>{
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
											talkToNPC()
										});
									});
								});
							});
						});
					})
				})
			}

			loadBattleConfig()

			var map = cga.GetMapName();
			if(map == '梅布尔隘地'){
				talkToNPC()
			}else{
				go()
			}
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

				thisobj.healObj.func(()=>{
					cga.travel.newisland.toStone('X', ()=>{
						cga.walkList([
							[130, 50, '盖雷布伦森林'],
							], ()=>{
								var obj = { act: 'item', target: '转职保证书', npcpos : [245, 73] }
								cga.askNpcForObj(obj, () => {
									cb2(true)
								})
							});
					})
				})
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
	// 如果并不是带打账号，且已经有保证书，则跳过保证书环节，进入传咒驯互转
	if(thisobj.spawnOfAmber4.aim == '一次性' && cga.getItemCount('转职保证书') > 0){
		console.log('你已经有【转职保证书】了，并且不是带过任务的账号。跳过保证书环节，进入传咒驯互转。')
		// 万一角色有脏数据，这里借用rollback来清洗一下，再跳转脚本
		rollBack(()=>{
			setTimeout(jump, 3000);
		})
		return
	}

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
						// 不管是无限循环还是正常去转职，都要清空任务缓存，以免下次打还是继续上次的进度。
						rollBack(()=>{
							if(thisobj.spawnOfAmber4.aim == '无限循环' || cga.getItemCount('转职保证书') == 0){
								console.log('称号已满、包中没有保证书或需要无限循环帮其它人做此任务，重置任务状态，并重新进入loop..')
								rollBack(()=>{
									setTimeout(loop, 3000);
								})
								return
							}else{
								console.log('转职保证书已完成，跳转至传咒驯互转..')
								setTimeout(jump, 3000);
								return
							}
						})
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
	// 自动存取
	bankObj : require('../子插件/自动存取.js'),
	// 自动存取
	healObj : require('../公共模块/治疗和招魂.js'),
	// 人物职业以及声望信息
	job:cga.job.getJob(),
	// 海底墓场外苑迷宫信息
	maze : cga.mazeInfo['海底墓场外苑'],
	// 任务相关flag
	callZLZZ : false,
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{

		if (pair.field == 'spawnOfAmber4') {
			pair.field = '是否自动做' + thisobj.taskName;
			pair.value = pair.value.flag ? '做' : '不做';
			pair.translated = true;
			return true;
		}

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
						setTimeout(stage1Final, 500, cb2);
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