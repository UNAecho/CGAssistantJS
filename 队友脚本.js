//begin from anywhere

var cga = require('./cgaapi')(function(){
	console.log('队员脚本，起始地点任意，回补提醒+卖石，血或者蓝量少于xx%立刻提醒队长')
	
	var minHp = 0.3;//50%hp提醒
	var minPetHp = 0.3;//宠30%hp提醒
	var minBottleHp = 0.6;//60%hp吃瓶子
	var minMp = 0.1;//10%mp提醒
	var minFoodMp = 0.6;//60%mp吃料理
	
	var eatBottle = '生命力回复药（500）';//恰瓶子
	var eatFood = '炒面面包';//恰料理

	var mute = 0;
	
	var playerinfo = cga.GetPlayerInfo();
	
	var teammates = [];
	
	var teamplayers = cga.getTeamPlayers();

	for(var i in teamplayers)
		teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name) ? true : false;
	
	var waitLeader = ()=>{
		
	}

	// 装备保护==开始==
	const getEmptyBagIndexes = (items) => {
		const itemIndexes = items.map(e => e.pos);
		const result = new Array();
		for (let bagIndex = 8; bagIndex < 28; bagIndex++) {
			if (itemIndexes.indexOf(bagIndex) < 0) {
				result.push(bagIndex);
			}
		}
		return result;
	};
	const protectEquipment = () => {
		const allItems = cga.GetItemsInfo();
		const equipments = allItems.filter(e => e.pos <= 4);
		const items = allItems.filter(e => e.pos >= 8);
		if (cga.isInNormalState()) {
			let occupyCount = 0;
			let emptyIndexes = getEmptyBagIndexes(items);
			equipments.filter(item => { // 是否需要摘下来的已装备的装备
				const durability = cga.getEquipEndurance(item);
				return durability && durability[0] <= 30;
			}).forEach(takeOff => {
				const sameEquipment = items.find(i => { // 是否可以替换的背包内的装备
					if (i.type == takeOff.type) {
						const durability = cga.getEquipEndurance(item);
						return durability && durability[0] > 30;
					}
					return false;
				});
				if (sameEquipment) {
					cga.MoveItem(takeOff.pos, sameEquipment.pos, -1);
				} else if (emptyIndexes[occupyCount]) {
					cga.MoveItem(takeOff.pos, emptyIndexes[occupyCount++], -1);
				}
			});
		}
	};
	setInterval(protectEquipment, 10000);
	// 装备保护==结束==

	var openbox = (cb)=>{
		var box = cga.findItem('加强补给品');
		if(box != -1){
			cga.AsyncWaitNPCDialog(function(dlg){
				cga.ClickNPCDialog(4, 0);
				setTimeout(openbox, 1500);
			});
			cga.UseItem(box);
		}
	}
	
	var waitArray = [
	{
		mapname:'肯吉罗岛',
		pos:[475, 208],
		cb : ()=>{

			if(cga.getItemCount('龙角') >= 30){
				cga.TurnTo(475, 208);
				cga.AsyncWaitNPCDialog(function(dlg){
					if(typeof dlg.message == 'string' && 
					dlg.message.indexOf('非常好') >= 0){
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(function(dlg){
							cga.ClickNPCDialog(1, 0);
						});
					}
					else if(typeof dlg.message == 'string' && 
					dlg.message.indexOf('滚开') >= 0){
						openbox();
					}
					else if(typeof dlg.message == 'string' && 
					dlg.message.indexOf('新的增援') >= 0){
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(function(dlg){
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(function(dlg){
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(function(dlg){
									cga.ClickNPCDialog(1, 0);
									
								});
							});
						});
					}
					else if(typeof dlg.message == 'string' && 
					dlg.message.indexOf('哦？不错') >= 0){
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(function(dlg){
							cga.ClickNPCDialog(1, 0);
						});
					}
				});
			}
			
			setTimeout(cga.waitForMultipleLocation, 5000, waitArray);
		}
	},
	{
		mapname:'工房',
		pos:[21, 23],
		cb : ()=>{
			cga.TurnTo(21, 23);
			cga.sellStone(function(){
				cga.SayWords('卖石完毕...', 0, 3, 1);
				setTimeout(cga.waitForMultipleLocation, 15000, waitArray);
			});
		}
	},
	{
		mapname:'矮人城镇',
		pos:[122, 110],
		cb : ()=>{
			cga.TurnTo(122, 110);
			cga.sellStone(function(){
				cga.SayWords('卖石完毕...', 0, 3, 1);
				setTimeout(cga.waitForMultipleLocation, 15000, waitArray);
			});
		}
	},
	{
		mapname:'里谢里雅堡',
		pos:[30, 77],
		cb : ()=>{
			cga.TurnTo(30, 77);
			cga.sellStone(function(){
				cga.SayWords('卖石完毕...', 0, 3, 1);
				setTimeout(cga.waitForMultipleLocation, 15000, waitArray);
			});
		}
	},
	{
		mapindex:27101,//辛希亚探索指挥部
		pos:[7, 21],
		leaveteam:true,
		cb : ()=>{
			
			if(!cga.isTeamLeader && teammates.length > 0){
				
				console.log('inposition');
				
				var waitAdd = ()=>{
					
					console.log('waitadd');
					
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							setTimeout(cga.waitForMultipleLocation, 1500, waitArray);
							return;
						}
						setTimeout(waitAdd, 1000);
					});
				}
				var retry = ()=>{
					
					console.log('retry');
					
					cga.TurnTo(7, 21);
					cga.AsyncWaitMovement({map:'圣骑士营地', delay:1000, timeout:5000}, (r)=>{
						if(r == true){
							waitAdd();
							return;
						}
						
						cga.walkList([ [8, 21], [8, 22] ], retry);
					});
				}
				
				retry();
			} else {
				setTimeout(cga.waitForMultipleLocation, 1500, waitArray);
			}
		}
	}
	];

	cga.waitForMultipleLocation(waitArray);
	
	setInterval(()=>{

		if(cga.isInBattle())
			return;
		
		if(new Date().getTime() >= mute )//15s内闭嘴
		{
			var playerinfo = cga.GetPlayerInfo();
			var petinfo = cga.GetPetInfo(playerinfo.petid);
			
			if(playerinfo.health > 50){
				cga.LogBack();
				process.exit(1);
				return;
			}

			if(cga.getItemCount('加强补给品') >= 1){
				openbox();
				mute = new Date().getTime() + 1000 * 3;
			}
			else if(playerinfo.hp < playerinfo.maxhp * minHp){
				cga.SayWords('人物血量不够，需要回补!', 0, 3, 1);
				mute = new Date().getTime() + 1000 * 15;
			}
			else if(playerinfo.hp < playerinfo.maxhp * minBottleHp){
				if(eatBottle.length > 0){
					var foodPos = cga.findItem(eatBottle);
					if(foodPos != -1){
						cga.UseItem(foodPos);
						cga.AsyncWaitPlayerMenu(function(players){
							console.log(players);
							cga.PlayerMenuSelect(0);
							cga.AsyncWaitUnitMenu(function(units){
								console.log(units);
								cga.UnitMenuSelect(0);
							});
						});
						
						mute = new Date().getTime() + 1000 * 15;
						return;
					}
				}
			}
			else if(playerinfo.mp < playerinfo.maxmp * minMp){
				cga.SayWords('人物蓝量不够，需要回补!', 0, 3, 1);
				mute = new Date().getTime() + 1000 * 15;
			}
			else if(playerinfo.mp < playerinfo.maxmp * minFoodMp){
				if(eatFood.length > 0){
					var foodPos = cga.findItem(eatFood);
					if(foodPos != -1){
						cga.UseItem(foodPos);
						cga.AsyncWaitPlayerMenu(function(players){
							console.log(players);
							cga.PlayerMenuSelect(0);
							cga.AsyncWaitUnitMenu(function(units){
								console.log(units);
								cga.UnitMenuSelect(0);
							});
						});
						
						mute = new Date().getTime() + 1000 * 15;
						return;
					}
				}
			}
			else if(petinfo.mp < petinfo.maxmp * minMp){
				cga.SayWords('宠物蓝量不够，需要回补!', 0, 3, 1);
				mute = new Date().getTime() + 1000 * 15;
			}
			else if(petinfo.hp < petinfo.maxhp * minPetHp){
				cga.SayWords('宠物血量不够，需要回补!', 0, 3, 1);
				mute = new Date().getTime() + 1000 * 15;
			}
			
			
		}
	}, 1000);
});