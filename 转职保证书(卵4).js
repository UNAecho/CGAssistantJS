var fs = require('fs');
var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){

	var playerinfo = cga.GetPlayerInfo();
	// 不使用动态组队，避免脚本运行时需要手动组队的麻烦
	var teammates = [
		"UNAの格斗2",
		"UNAの传教士",
		"UNAの格斗1",
		"UNAの战斧2",
		"UNAの战斧3",
		// "UNAの剑士",
		// "UNAの游侠",
		// "UNAの饲养师",
		// "UNAの圣骑士",
		// "UNAの巫师",
		// "UNAの暗黑骑士"
	];

	// 本次刷保证书的人数
	var maxteammate = 5

	// 注销掉动态组队
	// var teamplayers = cga.getTeamPlayers();
	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false

	// 任务从第几步开始。
	// 考虑到多数玩家都是重复刷保证书，这里改成默认从第一步开始。避免每次都需要手动在游戏中输入，尤其是多号刷，手动输入很麻烦。
	// ‘0’从头（朵拉）开始任务，‘1’从打长老证之前开始任务，‘3’从荷特普开始任务，‘4’从祭坛守卫开始任务，‘5’从打完BOSS换保证书开始任务（必须有文言抄本）。
	var index = 0

	var callZLZZ = false;
	var callWYW = false;
	var doneBOSS = false;
	
	cga.waitTeammateSay((player, msg)=>{

		if(msg.indexOf('长老之证x7 GET') >= 0 ){
			callZLZZ = true;
		}
		
		if(msg.indexOf('觉醒的文言抄本') >= 0 ){
			callWYW = true;
		}

		return true;
	});

	var saveProgressConfig = (step) =>{
		if(typeof step == 'number'){

		}else{
			throw new Error('saveProgressConfig 必须传入数字步骤，并且小于等于最大步骤')
		}
		
		var config = cga.loadPlayerConfig();

		if(!config)
			config = {};

		config.spawn4stage = step
		cga.savePlayerConfig(config);
		return
	}
	
	var loadBattleConfig = ()=>{
		// TODO 如果队里一个人也没有4级以上补血魔法怎么办
		var checkSkill = ()=>{
			var skills = cga.GetSkillsInfo();
			var job = '其他';
			skills.filter((sk)=>{
				if(sk.name.indexOf('补血魔法') >= 0 && sk.lv >= 4){
					job = '传教士'
				}else if(sk.name.indexOf('恢复魔法') >= 0 && sk.lv >= 4){
					job = '巫师'
				}
				return '';
			});
			return job;
		}
		

		var settingpath = cga.getrootdir() + '\\战斗配置\\'
		var role = checkSkill()
		if (role == '传教士'){
			settingpath = settingpath + 'BOSS传教.json'
	
		}else if (role == '巫师'){
			settingpath = settingpath + 'BOSS巫师.json'
	
		}else{
			settingpath = settingpath + 'BOSS合击.json'
		}
	
		var setting = JSON.parse(fs.readFileSync(settingpath))
	
		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.log(err);
				return;
			}else{
				console.log('读取战斗配置【'+settingpath+'】成功')
			}
		})
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
			// 集齐长老之证的人要喊出来已完成。
			if(cga.getItemCount('长老之证') >= 7){
				cga.SayWords('长老之证x7 GET', 0, 3, 1);
				cb(true);
				return;
			}
			// 因为全局有cga.waitTeammateSay，所以上面有人喊了之后，会把callZLZZ置为true，那么没有集齐长老之证的人，流程也会进行到下一步。
			if(callZLZZ){
				cb(true);
				return;
			}
			
			cga.cleanInventory(1, ()=>{
				if(cga.isTeamLeader)
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

		if(cga.isTeamLeader){
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
		if(cga.isTeamLeader){
			cga.WalkTo(131, 62);
			cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
			if(cga.getTeamPlayers().length >= maxteammate){
				goodToGoZLZZ(cb);
				return;
			}else{
				setTimeout(zhanglaozhizheng, 1000, cb);
			}
			// cga.waitTeammates(teammates, (r)=>{
			// 	if(r){
			// 		goodToGoZLZZ(cb);
			// 		return;
			// 	}
			// 	setTimeout(zhanglaozhizheng, 1000, cb);
			// });
		} else {
			cga.addTeammate(teammates[0], (r)=>{
				if(r){
					goodToGoZLZZ(cb);
					return;
				}
				setTimeout(zhanglaozhizheng, 1000, cb);
			});
		}
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
		
		if(cga.isTeamLeader)
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
		var playerinfo = cga.GetPlayerInfo();
			
		var teamplayers = cga.getTeamPlayers();

		if(cga.isTeamLeader){

			if(cga.getTeamPlayers().length >= maxteammate){
				goodToGoZDZ(cb);
				return;
			}else{
				setTimeout(zudangzhe, 1000, cb);
			}

			// cga.waitTeammates(teammates, (r)=>{
			// 	if(r){
			// 		goodToGoZDZ(cb);
			// 		return;
			// 	}
			// 	setTimeout(zudangzhe, 1000, cb);
			// });
		} else {
			cga.addTeammate(teammates[0], (r)=>{
				if(r){
					goodToGoZDZ(cb);
					return;
				}
				setTimeout(zudangzhe, 1000, cb);
			});
		}
	}
	
	var task = cga.task.Task('琥珀之卵4', [
	{//0
		intro: '0.进行一些前期处理工作，如丢弃灵堂烧技能产生的小石像怪的卡片',
		// 这里的stageIndex是从cgaapi中cga.task.Task传过来的任务index，可用于离线写入文件记录任务状态。
		// 功能已实现，但本任务并不需要，故注掉
		workFunc: function(cb2,stageIndex){
			console.log('开始第'+stageIndex+'步骤')
			var dropcount = 0
			var dropUseless = () =>{
				var item = cga.getInventoryItems().find((it)=>{
					return ((it.name == '小石像怪的卡片' || it.name == '魔石'))
				});
				if(item && dropcount < 10){
					dropcount+=1
					cga.DropItem(item.pos);
					setTimeout(dropUseless, 1000);
				}else{
					// saveProgressConfig(stageIndex)
					setTimeout(cb2, 1000, true);
				}
			}
			dropUseless()
			loadBattleConfig()
		}
	},
	{//1
		intro: '1.在艾夏岛冒险者旅馆(102.115)内与时空之人(30.20)对话，输入“朵拉”选“是”，再选“确定”可重置本任务',
		workFunc: function(cb2){
			var thisstep = ()=>{
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
									setTimeout(()=>{
										cb2(true);
									}, 1500);
								});
							});
						});
					});
				});
			}
			if(cga.GetPlayerInfo().gold < 10000){
				cga.SayWords('现金有点少，去银行补充现金', 0, 3, 1);
				cga.travel.newisland.toBank(() => {
					cga.turnDir(0);
					cga.AsyncWaitNPCDialog(() => {
						cga.MoveGold(cga.GetBankGold(), cga.MOVE_GOLD_FROMBANK);
						setTimeout(thisstep, 2000);
					}, 1000);
				});
			}else{
				setTimeout(thisstep, 2000);
			}
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
		intro: '3.前往盖雷布伦森林路路耶博士的家(244.76)，进入后再离开路路耶博士的家并传送至？？？。' + "\n" + '3.通过(142.69)或(122.69)处黄色传送石进入海底墓场外苑，寻找随机出现的守墓者并与之对话进入战斗。',
		workFunc: function(cb2){
			var thisstep = ()=>{
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
					[130, 50, '盖雷布伦森林'],
					[246, 76, '路路耶博士的家'],
					], ()=>{
						cga.WalkTo(3, 10);
						cga.AsyncWaitMovement({map:['？？？'], delay:1000, timeout:10000}, ()=>{
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
						});
					});
				});
			}
			if(cga.GetPlayerInfo().gold < 10000){
				cga.SayWords('现金有点少，去银行补充现金', 0, 3, 1);
				cga.travel.newisland.toBank(() => {
					cga.turnDir(0);
					cga.AsyncWaitNPCDialog(() => {
						cga.MoveGold(cga.GetBankGold(), cga.MOVE_GOLD_FROMBANK);
						setTimeout(thisstep, 2000);
					}, 1000);
				});
			}else{
				setTimeout(thisstep, 2000);
			}
		}
	},
	{//4
		intro: '4.集齐7个【长老之证】后返回？？？，由持有7个【长老之证】的队员与荷特普(167.102)对话2次，选“是”交出【长老之证】并传送至盖雷布伦森林。',
		workFunc: function(cb2){

			var sayshit = ()=>{
				if(cga.getItemCount('长老之证') >= 7){
					console.log('长老之证已集齐7个，回去召唤神龙许愿进行任务下一阶段');
					cga.TurnTo(131, 60);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
								cga.waitForLocation({map : '盖雷布伦森林'}, ()=>{
									cb2(true);
								});
							});
						});
					});
				} else {
					console.log('没打齐7个，但有队友集齐，跟着蹭吃蹭喝去');
					cga.waitForLocation({mapname : '盖雷布伦森林'}, ()=>{
						setTimeout(() => {
							cb2(true);
						}, 2000);
					});
				}
			}
			
			if(cga.isTeamLeader){
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
		workFunc: function(cb2){
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
											cb2(true);
										}, 1000);
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
			var thisstep = ()=>{
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
			}
			if(cga.GetPlayerInfo().gold < 10000){
				cga.SayWords('现金有点少，去银行补充现金', 0, 3, 1);
				cga.travel.newisland.toBank(() => {
					cga.turnDir(0);
					cga.AsyncWaitNPCDialog(() => {
						cga.MoveGold(cga.GetBankGold(), cga.MOVE_GOLD_FROMBANK);
						setTimeout(thisstep, 2000);
					}, 1000);
				});
			}else{
				setTimeout(thisstep, 2000);
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
						cga.walkList((cga.isTeamLeader == true) ? 
						[
						[156, 197, '？？？', 213, 164],
						[213, 165],
						] : [
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
		intro: '9.击倒(161.108)一带的阻挡者，经由(241.118)的传送石进入？？？。',
		workFunc: function(cb2){
			
			var waitBOSS = ()=>{
				if(cga.isInBattle())
				{
					doneBOSS = true;
					
					if(cga.getItemCount('觉醒的文言抄本') > 0){
						item = cga.GetItemsInfo().find(i => i.itemid == 18257)
						setTimeout(cb2, 1000, true);
						return;
					}
					setTimeout(waitBOSS, 1000);
					return;
				}
				
				if(doneBOSS && !callWYW && (cga.getItemCount('觉醒的文言抄本') > 0)){
					cga.SayWords('觉醒的文言抄本 GET', 0, 3, 1);
					callWYW = true;
				}

				if(doneBOSS && callWYW){
					//cga.LogBack();
					setTimeout(cb2, 1000, true);
					return;
				}
				
				setTimeout(waitBOSS, 1500);
			}
			
			if(!cga.isTeamLeader){
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
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[130, 50, '盖雷布伦森林'],
				[244, 74],
				], ()=>{
					cga.TurnTo(245, 73);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, 0);
									setTimeout(()=>{
										if(cga.getItemCount('觉醒的文言抄本') > 1){
											var dropItem = cga.findItem('觉醒的文言抄本');
											if(dropItem != -1)
											{
												cga.DropItem(dropItem);
											}
										}
										if(cga.getItemCount('转职保证书') > 0){
											cb2(true);
											return;
										}
										
									}, 1000, true);
								});
							});
						});
					});
				});
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
			return (cga.getItemCount('长老之证') >= 7 || callZLZZ) ? true : false;
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

	var firstmsg = ''
	if(index == 0){
		firstmsg = '朵拉重置任务'
		task.jumpToStep = 0;
	}else if(index == 1){
		firstmsg = '长老之证'
		task.jumpToStep = 3;
	//else if(index == 2)
	//	task.jumpToStep = 3;
	}else if(index == 3){
		firstmsg = '黄昏或夜晚找荷特普'
		task.jumpToStep = 5;
	}else if(index == 4){
		firstmsg = '打阻挡者'
		task.jumpToStep = 7;
	}else if(index == 5){
		firstmsg = '换保证书'
		task.jumpToStep = 10;
	}
	if(typeof task.jumpToStep != 'undefined'){
		cga.SayWords('欢迎使用【UNAの脚本】转职保证书，当前从【'+ firstmsg + '】步骤开始任务', 0, 3, 1);
		task.doTask(()=>{
			global.cga = cga
			console.log('任务完成，去阿蒙刷新一下称号。');
			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[230, 82],
				], ()=>{
					cga.turnTo(230, 83);
					setTimeout(() => {
						if(cga.ismaxbattletitle()){
							console.log('已到达【无尽星空】称号，属于陪打大号，任务完成')
							process.exit(0)
							return
						}else{
							console.log('未到达【无尽星空】称号，开始转职刷声望')

							if(cga.getItemCount('转职保证书') == 0){
								console.log('包里没有保证书，需要重新解本任务！')
								return
							}
							var rootdir = cga.getrootdir()
							var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
							var body = {
								path : rootdir + "\\转职保证书(传咒互转).js",
							}
							var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
							var setting = JSON.parse(fs.readFileSync(settingpath))
							scriptMode.call_ohter_script(body,setting)

						}
					}, 3000);
				});
			});
		});
		return false;
	}
	return true;
});