var cga = global.cga;
var configTable = global.configTable;

/** var store = cga.parseBuyStoreMsg(dlg) 返回内容数据结构，达美姐妹的店为例。
 * { storeid: '14032',
  name: '耶莱达美',
  items: 
   [ { index: 0,
       name: '封印卡（人形系）',
       image_id: '26400',
       cost: '75',
       attr: '$4等级 1\\n$0种类 封印卡片\\n\\n\\n\\n\\n\\n\\n$4能封印人型敌人的卡片\\n\\n',
       unk1: '1',
	   max_buy: '20' },
	   *****同类物品省略中间部分*******
     { index: 8,
       name: '封印卡（植物系）',
       image_id: '26417',
       cost: '75',
       attr: '$4等级 1\\n$0种类 封印卡片\\n\\n\\n\\n\\n\\n\\n$4能封印植物系敌人的卡片\\n\\n',
       unk1: '1',
       max_buy: '20' },
     { index: 9,
       name: '地水的水晶（5：5）',
       image_id: '27513',
       cost: '600',
       attr: '$4等级 1\\n$4耐久 1500/1500 $0种类 水晶\\n\\n\\n\\n\\n\\n\\n$4宿有地和水属性的水晶\\n\\n',
       unk1: '1',
       max_buy: '1' },
	   *****同类物品省略中间部分*******
     { index: 12,
       name: '风地的水晶（5：5）',
       image_id: '27514',
       cost: '600',
       attr: '$4等级 1\\n$4耐久 1500/1500 $0种类 水晶\\n\\n\\n\\n\\n\\n\\n$4宿有风和地属性的水晶\\n\\n',
       unk1: '1',
       max_buy: '1' }
 */

// ItemId
// 9209地水5：5
// 9218水火5：5
// 9227火风5：5
// 9236风地5：5
const crystalid = [9209,9218,9227,9236]
const crystalName = ["地水的水晶（5：5）","水火的水晶（5：5）","火风的水晶（5：5）","风地的水晶（5：5）"]

// 上面数组的索引，用于快速索引
var tempIndex = null

// 各个水晶对应的练级地点，地水：0，水火：1，火风：2，风地：3。
const areaType0 = ["黑龙"] 
const areaType1 = ["回廊","营地","蝎子","半山"] 
const areaType2 = ["低地鸡","刀鸡","龙骨","黄金龙骨","银狮","诅咒","石头人","地洞","蜥蜴"] 
const areaType3 = ["沙滩"] 

var hasEquipCrystal = false

const repairFilter = (eq) => {
	const durability = cga.getEquipEndurance(eq);
	if (eq.type == 22) {
		hasEquipCrystal = true
		if(tempIndex === null){
			return durability && durability[0] < 100
		}else{
			return (eq.itemid != crystalid[tempIndex]) || (durability && durability[0] < 100) ? true : false
		}
	}
	return false;
}

const dropFilter = (eq) => {
	const durability = cga.getEquipEndurance(eq);
	if (eq.type == 22) {
		return durability && durability[0] < 100
	}
	return false;
}

// 本方法疑似废弃
// const putdownEquipments = (cb)=>{
// 	var items = cga.getEquipItems().filter(repairFilter);
// 	if(items.length){
// 		var emptyslot = cga.findInventoryEmptySlot();
// 		if(emptyslot == -1){
// 			cb(new Error('物品栏没有空位'));
// 			return;
// 		}
// 		cga.MoveItem(items[0].pos, emptyslot, -1)
// 		setTimeout(putdownEquipments, 1000, cb);
// 		return;
// 	}
	
// 	setTimeout(cb, 1000);
// }

const putupEquipments = (equipped, cb)=>{

	var currentEquip = cga.getEquipItems();

	for(var i in currentEquip){
		if (currentEquip[i].type ==22 && currentEquip[i].itemid == crystalid[tempIndex]){
			setTimeout(cb, 1000);
			return
		}
	}

	var item = cga.getInventoryItems().find((eq)=>{
		if (eq.type != 22)
			return false
		// 由必须满耐改为大于半耐即可
		const durability = cga.getEquipEndurance(eq);
		if (durability && durability[0] < durability[1] / 2)
			return false;

		// // 原逻辑：获取跟自己身上一样的水晶
		// if( equipped.find((eq2)=>{
		// 	return eq2.name == eq.name;
		// }) != undefined){

			// var foundEq = currentEquip.find((eq2)=>{
			// 	return eq2.name == eq.name;
			// });
			
		// 	if(foundEq == undefined)
		// 		return true;
			
		// 	const durability2 = cga.getEquipEndurance(foundEq);
		// 	if( durability2 && durability2[0] < durability[0])
		// 		return true;
		// }

		/* 新逻辑：自动匹配练级地点，更换对应水晶。
		 * tempIndex为null时，装备与自身相同的新水晶。
		 * 不为null时，装备自动识别对应练级地点的水晶。
		 */ 
		return tempIndex === null ? false: eq.itemid == crystalid[tempIndex]
	});
	
	if(item != undefined){
		cga.UseItem(item.pos)
		setTimeout(putupEquipments, 500, equipped, cb);
		return;
	}
	
	setTimeout(cb, 1000);
}

const repairLoop = (needRepair, cb)=>{
	cga.turnDir(0);
	cga.AsyncWaitNPCDialog(()=>{
		cga.ClickNPCDialog(0, 0);
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			
			var store = cga.parseBuyStoreMsg(dlg);			
			if(!store)
			{
				cb(new Error('商店内容解析失败'));
				return;
			}
			
			var buyitem = store.items.find((it) => {
				return tempIndex === null ? it.name == needRepair[0].name : it.name == crystalName[tempIndex];
			});
			if(buyitem == undefined)
			{
				cb(new Error('商店没有该种水晶出售，可能已被买完'));
				return;
			}
			
			cga.BuyNPCStore([{index: buyitem.index, count:1}]);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.message.indexOf('谢谢') >= 0){					
					cb(null);
					return;
				}
				else
				{
					cb(new Error('购买失败，可能钱不够或物品栏没有空位！'));
					return;
				}
			});
		});
	});
}

var thisobj = {
	prepare : (cb)=>{
		if(global.battleAreaName && global.battleAreaName != '全自动练级'){
			// console.log('global.battleAreaName.name = ' + global.battleAreaName)
			if (areaType0.indexOf(global.battleAreaName) != -1){
				tempIndex = 0
			}else if(areaType1.indexOf(global.battleAreaName) != -1){
				tempIndex = 1
			}else if(areaType2.indexOf(global.battleAreaName) != -1){
				tempIndex = 2
			}else{
				tempIndex = 3
			}
			// console.log('tempIndex = '+tempIndex)
			console.log('检测到本次去【'+global.battleAreaName+'】，适合佩戴：【'+crystalName[tempIndex]+'】')
		}else{
			console.log('首次检测队伍练级地点，如果你使用了自动练级系列脚本，待下次出发前，全员开始自动购买对应属性水晶方便练级。')
		}
		var items = cga.getEquipItems().filter(repairFilter);
		if(!items.length && hasEquipCrystal){
			cb(null);
			return;
		}
		
		if(cga.getTeamPlayers().length){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(thisobj.prepare, 1000, cb);
			return;
		}

		var buy = (cb2)=>{
			var equipped = cga.getEquipItems();
			var needRepair = equipped.filter(repairFilter);
			if(needRepair && needRepair[0]){
				repairLoop(needRepair, ()=>{
					putupEquipments(equipped, ()=>{
						
						var drop = cga.getInventoryItems().filter(dropFilter);
						
						if(drop && drop[0])
						{
							cga.DropItem(drop[0].pos);
							setTimeout(cb2, 1000, null);
						}
						else
						{
							cb2(null);
						}
					});
				});
			} else {
				cb2(null);
			}
		}
		
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		if(map == '圣骑士营地'){
			cga.walkList([
				[92, 118, '商店'],
				[14, 26],
			], ()=>{
				buy(()=>{
					cga.travel.falan.toCamp(cb);
				});
			});
		} else if(mapindex == 44692){
			cga.walkList([
				[0, 20, '圣骑士营地'],
				[92, 118, '商店'],
				[14, 26],
			], ()=>{
				buy(()=>{
					cga.travel.falan.toCamp(cb);
				});
			});
		} else if(mapindex == 44693){
			cga.walkList([
				[30, 37, '圣骑士营地'],
				[92, 118, '商店'],
				[14, 26],
			], ()=>{
				buy(()=>{
					cga.travel.falan.toCamp(cb);
				});
			});
		} else if(mapindex == 44698){
			cga.walkList([
				[3, 23, '圣骑士营地'],
				[92, 118, '商店'],
				[14, 26],
			], ()=>{
				buy(()=>{
					cga.travel.falan.toCamp(cb);
				});
			});
		} else if(mapindex == 44699){
			cga.walkList([
				[14, 26],
			], ()=>{
				buy(()=>{
					cga.travel.falan.toCamp(cb);
				});
			});
		} else if(map == '哥拉尔镇'){
			cga.walkList([
				[146, 117, '魔法店'],
				[18, 12],
			], ()=>{
				buy(()=>{
					cga.walkList([
					[5, 14, '哥拉尔镇'],
					], cb);
				});
			});
		} else {
			cga.travel.falan.toCrystalStore(()=>{
				cga.walkList([
				[17, 18]
				], ()=>{
					buy(()=>{
						cga.walkList([
							[3, 13, '法兰城'],
						], cb);
					});
				});
			});
		}
	},
	loadconfig : (obj, cb)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}
};

module.exports = thisobj;