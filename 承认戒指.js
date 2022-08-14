var fs = require('fs');
var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){
	
	// 提取本地职业数据
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)

	var playerinfo = cga.GetPlayerInfo();
	
	// 不使用动态组队，避免脚本运行时需要手动组队的麻烦
	var teammates = [
		"UNAの传教士2",
		"UNAの格斗2",
		"UNAの制头盔",
		"UNAの矿工4",
		"UNAの矿工5",
	];
	
	// 本次任务自由组队人数
	var maxteammate = 5

	// var teamplayers = cga.getTeamPlayers();

	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;

	var loadBattleConfig = ()=>{

		var settingpath = cga.getrootdir() + '\\战斗配置\\'
		// 因为传教士可能还有正在刷声望的小号，这样可以区分是保姆还是小号
		if (professionalInfo.jobmainname == '传教士'){
			settingpath = settingpath + 'BOSS传教.json'
		}else if(professionalInfo.jobmainname == '格斗士'){
			settingpath = settingpath + '格斗练级.json'
		}else{
			settingpath = settingpath + '营地组队普攻刷声望.json'
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

	var dialogHandler = (err, dlg)=>{

		if(dlg && (dlg.options & 4) == 4)
		{
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		if(dlg && (dlg.options & 32) == 32)
		{
			cga.ClickNPCDialog(32, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if(dlg && dlg.options == 1)
		{
			cga.ClickNPCDialog(1, 0);
			return;
		}else if(dlg && dlg.options == 8)
		{
			cga.ClickNPCDialog(8, 0);
			return;
		}
		else if(dlg && dlg.options == 3)
		{
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else
		{
			return;
		}
	}

	var task = cga.task.Task('曙光1/承认之戒', [
	{//0
		intro: '1.前往法兰城里谢里雅堡2楼谒见之间与大祭司布鲁梅尔（5.3）对话，选“是”获得【信笺】。',
		workFunc: function(cb2){
			
			cga.travel.falan.toStone('C', (r)=>{
				cga.walkList([
				[41, 50, '里谢里雅堡 1楼'],
				[74, 19, '里谢里雅堡 2楼'],
				[49, 22, '谒见之间'],
				[5, 4],
				], (r)=>{
					cga.TurnTo(5, 2);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 3000);
				});
			});
		}
	},
	{//1
		intro: '2.出法兰城东或南门，前往芙蕾雅岛（513.282）处，进入曙光骑士团营地。3.前往曙光营地指挥部（52.68）房间（69.69）与圣骑士法尔缇娅（95.7）对话，选“是”交出【信笺】获得【团长的证明】。',
		workFunc: function(cb2){

			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}

			cga.travel.falan.toStone('S', function(r){
				cga.walkList([
					[153, 241, '芙蕾雅'],
					[513,282, '曙光骑士团营地'],
					[52, 68, '曙光营地指挥部'],
					[69, 69, '曙光营地指挥部', 85, 2],
					[94, 6],
				], ()=>{
					cga.TurnTo(95, 7);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 3000);
				});
			});
		}
	},
	{//2
		intro: '3.前往辛希亚探索指挥部（55.47），通过楼梯下楼抵达辛希亚探索指挥部。5.与教团骑士克罗米（40.22）对话，交出【团长的证明】并通过栅栏，通过黄色传送石（44.22）抵达废墟。',
		workFunc: function(cb2){

			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}
			// 队员在随机迷宫门口集合
			var gather = ()=>{
				if(cga.isTeamLeader){
					cga.WalkTo(39, 23);
					if(cga.getTeamPlayers().length >= maxteammate){
						go_1();
						return;
					}else{
						setTimeout(gather, 1000);
					}
				} else {
					cga.addTeammate(teammates[0], ()=>{
						if(cga.getTeamPlayers().length >= maxteammate){
							go_1();
							return;
						}
						setTimeout(gather, 1000);
					});
				}
			}
			// 队伍中一名持有团长证明的队员和NPC对话，带全队过栅栏
			var go_1 = ()=>{
				if (cga.getItemCount('团长的证明') >= 1){
					cga.TurnTo(41, 22);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, 0);
						setTimeout(go_2, 1000);
					});
				}else{
					cga.waitForLocation({mapname : '辛希亚探索指挥部', pos : [42, 22]}, go_2);
				}

			}
			// 走随机迷宫
			var go_2 = ()=>{
				// 队长逻辑
				if (cga.isTeamLeader){
					// 如果中途在迷宫中脚本停止，重新运行会用到下面if逻辑
					if(cga.GetMapName().indexOf('废墟地下') >=0){
						console.log('在迷宫中继续')
						var walkMaze = (r)=>{
							if(cga.GetMapName() == '遗迹'){
								cb2(true);
								return;
							}else{
								cga.walkRandomMaze(null, walkMaze);
							}
						}
						cga.walkRandomMaze(null, walkMaze);
					}else{//else中是正常任务流程
						console.log('进入栅栏..')
						cga.walkList([
							[44, 22, '废墟地下1层']
							], ()=>{
								var walkMaze = (r)=>{
									if(cga.GetMapName() == '遗迹'){
										cb2(true);
										return;
									}else{
										cga.walkRandomMaze(null, walkMaze);
									}
								}
								cga.walkRandomMaze(null, walkMaze);
							});
					}
				}
				// 队员逻辑
				else{
					cga.waitForLocation({mapname : '遗迹'},()=>{
						cb2(true);
					});
				}
			}
			// 该step的main逻辑。如果是陪打，或者拿了团长证明，本step走if逻辑
			if((cga.getItemCount('承认之戒') >= 1 || cga.getItemCount('团长的证明') >= 1) && cga.GetMapName() != '曙光营地指挥部'){
				cga.travel.falan.toStone('S', function(r){
					cga.walkList([
						[153, 241, '芙蕾雅'],
						[513,282, '曙光骑士团营地'],
						[55, 47, '辛希亚探索指挥部'],
						[7,4, '辛希亚探索指挥部', 91, 6],
						[95,9, 27101],
						[39, 22],
						], ()=>{
							gather()
						});
				});
			}else{// 如果是正常从任务最初开始，那么本step走else逻辑
				cga.walkList([
					[85, 3, '曙光营地指挥部', 69, 70],
					[53, 79, '曙光骑士团营地'],
					[52, 55],
					[55, 47, '辛希亚探索指挥部'],
					[7,4, '辛希亚探索指挥部', 91, 6],
					[95,9, 27101],
					[39, 22],
					], ()=>{
						gather()
					});
			}
		}
	},
	{//3
		intro: '4.通过随机迷宫抵达遗迹，调查奇异的装置（14.14）进入战斗。',
		workFunc: function(cb2){

			// 留空位给任务物品
			var inventory = cga.getInventoryItems();
			if(inventory.length >= 18){
				var stone = cga.findItem('魔石');

				if(stone != -1){
					cga.DropItem(stone);
				}
			}

			var waitBOSS = ()=>{
				if(cga.isInBattle())
				{
					setTimeout(waitBOSS, 1000);
					return;
				}
				
				setTimeout(cb2, 1000, true);
			}
			
			cga.walkList([
			[13, 14]
			], ()=>{
				cga.TurnTo(14, 14);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					setTimeout(waitBOSS, 1500);
				});
			});
		}
	},
	{//4
		intro: '5.战斗胜利后随机获得【神之金】。与神秘人（14.14）对话，获得【怪物碎片】并传送回法兰城。',
		workFunc: function(cb2){
			// 留空位给任务物品
			// 战斗成功后，房间index为44708
			var inventory = cga.getInventoryItems();
			if(inventory.length >= 18){
				var stone = cga.findItem('魔石');

				if(stone != -1){
					cga.DropItem(stone);
				}
			}

			cga.walkList([
			[13, 14]
			], ()=>{
				cga.TurnTo(14, 14);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, 0);
						setTimeout(cb2, 1500, true);
					});
				});
			});
		}
	},
	{//5
		intro: '6.前往曙光骑士团营地，进入曙光营地指挥部（52.68）房间（69.69）与圣骑士法尔缇娅（95.7）对话，交出【怪物碎片】获得【信】。',
		workFunc: function(cb2){

			if(cga.needSupplyInitial({  })){
				console.log('打完boss回补..')
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}

			cga.travel.falan.toStone('S', function(r){
				cga.walkList([
					[153, 241, '芙蕾雅'],
					[513,282, '曙光骑士团营地'],
					[52, 68, '曙光营地指挥部'],
					[69, 69, '曙光营地指挥部', 85, 2],
					[94, 6],
				], ()=>{
					cga.TurnTo(95, 7);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 3000);
				});
			});
		}
	},
	{//6
		intro: '7.返回法兰城里谢里雅堡2楼谒见之间与大祭司布鲁梅尔（5.3）对话，交出【信】获得【承认之戒】，任务完结。',
		workFunc: function(cb2){
						
			cga.travel.falan.toStone('C', (r)=>{
				cga.walkList([
				[41, 50, '里谢里雅堡 1楼'],
				[74, 19, '里谢里雅堡 2楼'],
				[49, 22, '谒见之间'],
				[5, 4],
				], (r)=>{
					cga.TurnTo(5, 2);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 5000);
				});
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){
			if(cga.getItemCount('承认之戒') >= 1){
				console.log('已有承认之戒，本次任务变为陪打')
				return true
			}else if(cga.getItemCount('信笺') >= 1){
				return true
			}else if(cga.getItemCount('团长的证明') >= 1){
				return true
			}else if(cga.getItemCount('怪物碎片') >= 1){
				return true
			}
			else{
				return false
			}
		},
		function(){
			if(cga.getItemCount('怪物碎片') >= 1){
				return true
			}
			else if(cga.getItemCount('承认之戒') >= 1){
				console.log('陪打号直接去迷宫入口等待接任务的队友组队')
				return true
			}else if(cga.getItemCount('团长的证明') >= 1){
				return true
			}
			else{
				return false
			}
		},
		function(){
			// 存在带打账号在BOSS期间登出的bug，注销掉查明原因中
			// return (cga.GetMapIndex().index3 == 44707 || cga.getItemCount('怪物碎片') >= 1) ? true : false;
			return false
		},
		function(){
			// 存在带打账号在BOSS期间登出的bug，注销掉查明原因中
			// return (cga.GetMapIndex().index3 == 44708 || cga.getItemCount('怪物碎片') >= 1) ? true : false;
			return false
		},
		function(){
			return (cga.getItemCount('怪物碎片') >= 1) ? true : false;
		},
		function(){
			return (cga.getItemCount('信') >= 1) ? true : false;
		},
		function(){
			return false;
		},
	]
	);
	loadBattleConfig()
	task.anyStepDone = false;

	task.doTask(()=>{
		console.log('ok');
	});
});