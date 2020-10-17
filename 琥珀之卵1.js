var cga = require('./cgaapi')(function(){

	var playerinfo = cga.GetPlayerInfo();

	// 不使用动态组队，避免脚本运行时需要手动组队的麻烦
	var teammates = [
		"UNAの弓",
		"UNAの传教",
		"UNAの护士",
		"UNAの造小刀",
		"UNAの巫师",
	];

	// 注销掉动态组队
	// var teamplayers = cga.getTeamPlayers();
	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false

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

	var task = cga.task.Task('琥珀之卵1', [
	{//1
		intro: '1.黄昏或夜晚前往艾尔莎岛神殿·伽蓝（200.96）三楼神殿·里侧大厅，至（48.60）处进入约尔克神庙。调查(39.21)处，获得【琥珀之卵】。',
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
	{//2
		intro: '2.黄昏或夜晚，前往艾夏岛查尔博士的家（133.77）与查尔博士（11.12）对话，获得【查尔的介绍信】。\n如果无法获得【查尔的介绍信】，则前往艾夏岛冒险者旅馆（102.115）与时空之人（30.20）对话，输入“安登”，再与查尔博士（11.12）对话可获得。',
		workFunc: function(cb2){

			var letter = ()=>{
				if(cga.getItemCount('查尔的介绍信') > 0){
					cb2(true)
				}else{
					setTimeout(letter, 1000);
				}
				return
			}

			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
				[133, 77, '查尔博士的家'],
				[10, 12],
				], ()=>{
					cga.TurnTo(11, 12);
					cga.AsyncWaitNPCDialog(dialogHandler);
					letter()
					return
				});
			});
		}
	},
	{//3
		intro: '3.前往盖雷布伦森林路路耶博士的家(244.76)',
		workFunc: function(cb2){
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
				[7, 8]
				], ()=>{
					setTimeout(cb2, 1000, true);
				});
			});
		}
	},
	{//4
		intro: '4.与路路耶博士（8.8）对话，进入战斗。',
		workFunc: function(cb2){

			var battleAgain = ()=>{

				if(cga.isInBattle()){
					setTimeout(battleAgain, 1500);
					return;
				}
				
				if(cga.GetMapIndex().index3 == 59564){
					cb2(true)
				}
				
				setTimeout(battleAgain, 1500);
			};

			cga.TurnTo(8, 8);
			cga.AsyncWaitNPCDialog(dialogHandler);
			battleAgain()

		}
	},
	{//5
		intro: '5.战斗胜利后获得【路路耶的字典】，走出路路耶的家至盖雷布伦森林，任务完结。',
		workFunc: function(cb2){
			var drop =()=>{
			// 直接丢弃换下来的武器
			item = cga.getInventoryItems().find((it)=>{
				return (it.name == '路路耶的字典')
			});
			if(item){
				cga.DropItem(item.pos);
			}
			return
			}

			if(cga.GetMapIndex().index3 == 59564){
				cga.walkList([
					[3, 10, '盖雷布伦森林'],
				], ()=>{return});
			}else{
				cga.travel.newisland.toStone('X', ()=>{
					cga.walkList([
					[130, 50, '盖雷布伦森林'],
					[246, 76, '路路耶博士的家'],
					[7, 8]
					], ()=>{return});
				});
			}

			cga.waitForLocation({mapname : '盖雷布伦森林', pos : [244, 76]}, drop);
		}
	}
	],
	[//任务阶段是否完成
		function(){//琥珀之卵
			return (cga.getItemCount('琥珀之卵') >= 1) ? true : false;
		},
		function(){//查尔的介绍信
			return (cga.getItemCount('查尔的介绍信') > 0) ? true : false;
		},
		function(){//路路耶博士的家
			return (cga.GetMapIndex().index3 == 59560) ? true : false;
		},
		function(){//战斗胜利后路路耶博士的家
			return (cga.GetMapIndex().index3 == 59564 || cga.getItemCount('路路耶的字典') > 0) ? true : false;
		},
		function(){
			return false;
		},
	]
	);
	
	task.doTask(()=>{
		console.log('UNA脚本：已结束');
	});
});