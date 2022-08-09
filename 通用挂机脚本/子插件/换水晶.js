var cga = global.cga;
var configTable = global.configTable;

var skipMainPluginName = ['烧声望']

var buyArray = [
	{
		name : '地水的水晶（5：5）',
		type : 0,
		area : ['旧日之地','砍龙'],//砍龙为任意水晶
	},
	{
		name : '水火的水晶（5：5）',
		type : 1,
		area : ['银狮','回廊','营地','蝎子','黑龙'],//营地为任意水晶，沿用前一个练级地点（回廊）的水晶
	},
	{
		name : '火风的水晶（5：5）',
		type : 2,
		area : ['艾夏岛门口','低地鸡','刀鸡','龙骨','黄金龙骨','诅咒','蜥蜴','半山'],//诅咒为任意水晶
	},
	{
		name : '风地的水晶（5：5）',
		type : 3,
		area : ['沙滩','地洞'],//地洞为任意水晶，沿用前一个练级地点（沙滩）的水晶
	},
]
// 这里加入了自动练级的自动换水晶功能
const repairFilter = (eq) => {
	if (eq.type == 22) {
		const durability = cga.getEquipEndurance(eq);
		if (global.area == undefined){
			console.log('global.area为undefined,使用离线静态方式换水晶')
			if (durability && durability[0] < 150){
				console.log('水晶耐久不足，更换')
				return true
			}
			return false
		}
		for(var i in buyArray){
			// console.log('buyArray[i].name='+buyArray[i].name)
			// console.log('buyArray[i].area='+buyArray[i].area)
			// console.log('global.area='+global.area)
			if(buyArray[i].area.indexOf(global.area) !=-1){
				// console.log('提示：thisobj.buyCrystal即将被复写为'+buyArray[i].name)
				thisobj.buyCrystal = buyArray[i];
				break;
			}
		}
		if (durability && durability[0] < 150){
			console.log('水晶耐久不足，更换')
			return true
		}else if (eq.name != thisobj.buyCrystal.name){
			console.log('当前水晶：'+eq.name+'与目标水晶：'+thisobj.buyCrystal.name+'不符，更换')
			return true
		}
	}
	return false;
}

const hasFilter = (eq) => {
	if (eq.type == 22) {
		return true;
	}
	return false;
}
// 为了节约，改为150耐即视为可用
const hasrepairedFilter = (eq) => {
	if (eq.type == 22) {
		const durability = cga.getEquipEndurance(eq);
		return (durability && durability[0] > 150);
	}
	return false;
}

const putdownEquipments = (cb)=>{
	var items = cga.getEquipItems().filter(repairFilter);
	if(items.length){
		/*var emptyslot = cga.findInventoryEmptySlot();
		if(emptyslot == -1){
			cb(new Error('物品栏没有空位'));
			return;
		}
		cga.MoveItem(items[0].pos, emptyslot, -1)*/
		cga.DropItem(items[0].pos);
		setTimeout(putdownEquipments, 1000, cb);
		return;
	}
	cb(null)
	return false;
}

const putupEquipments = (buyCrystal, cb)=>{
	// 下面提到的设计bug，修复的部分。
	var equipCrystal = cga.getEquipItems().filter(hasrepairedFilter);
	if(equipCrystal.length){
		cb(null)
		return;
	}
	var item = cga.getInventoryItems().find((eq)=>{
		
		//必须满耐
		const durability = cga.getEquipEndurance(eq);
		if( durability && durability[0] != durability[1])
			return false;
		
		if( buyCrystal.name == eq.name ){
			return true;
		}

		return false;
	});
	// 此处注意，原版代码在设计上有bug。
	// 因为是遍历检查是否有水晶可以装备，所以在身上有多个满足条件的水晶时，会无限反复装备。
	// 修复方式为在方法之初添加cga.getEquipItems().filter(hasrepairedFilter);来验证是否已经装备好了新水晶
	if(item != undefined){
		cga.UseItem(item.pos)
		console.log('开始装备')
		setTimeout(putupEquipments, 500, buyCrystal, cb);
		return;
	}
	setTimeout(cb, 1000);
}

const repairEquipments = (buyCrystal, cb)=>{
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
			
			var buyitem = store.items.find((it)=>{
				return it.name == buyCrystal.name;
			});
			if(buyitem == undefined)
			{
				cb(new Error('商店没有该种水晶出售，可能已被买完'));
				return;
			}
			
			cga.BuyNPCStore([{index: buyitem.index, count:1}]);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.message.indexOf('谢谢') >= 0){		
					console.log('购买完成')			
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
		// 如果主插件是skipMainPluginName中的任务，跳过换水晶
		if (configTable && (global.is_array_contain(skipMainPluginName,configTable.mainPlugin))){
			var items = cga.getEquipItems().filter(hasFilter);
			if(items.length){
				console.log('当前主插件【'+configTable.mainPlugin+'】'+'需要卸下水晶避免浪费耐久度')
				var emptyslot = cga.findInventoryEmptySlot();
				if(emptyslot == -1){
					console.log('物品栏没有空位，保留水晶')
					cb(null);
					return;
				}
				cga.MoveItem(items[0].pos, emptyslot, -1)
			}
			cb(null)
			return
		}

		// 如果已经装备好全新水晶，则装备
		var anyitems = cga.getEquipItems().filter(hasFilter);
		var items = cga.getEquipItems().filter(repairFilter);
		if(!items.length && anyitems.length){
			console.log('身上有水晶，并且不需要更换')
			cb(null);
			return;
		}
		// 如果背包有现成的全新水晶，则装备。
		// 注意cga.getInventoryItems()返回的是数组，因为装备是复数的。所以要用下标指定装备
		// 由于水晶都是一样的，所以装备第0个下标就好
		var usefulitem = cga.getInventoryItems().filter(hasrepairedFilter)

		if(usefulitem.length && usefulitem[0].name == thisobj.buyCrystal.name){
			cga.UseItem(usefulitem[0].pos)
			console.log('有现成的'+usefulitem[0].name+'可供使用')
			setTimeout(thisobj.prepare, 1000, cb);
			return;
		}

		// 金币不足，退出
		if(cga.GetPlayerInfo().gold < 600){
			console.log('没钱了，无法换水晶。注意身上资金！')
			cb(null);
			return;
		}
		
		if(cga.getTeamPlayers().length){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(thisobj.prepare, 1000, cb);
			return;
		}

		console.log('水晶状态异常，需要更换')
		var buy = (cb)=>{
			putdownEquipments(()=>{
				repairEquipments(thisobj.buyCrystal, ()=>{
					putupEquipments(thisobj.buyCrystal, ()=>{
						cb(null);
					});
				});
			});
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
	translate : (pair)=>{
		
		if(pair.field == 'buyCrystal'){
			pair.field = '购买水晶';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	loadconfig : (obj, cb)=>{
		for(var i in buyArray){
			if(buyArray[i].name == obj.buyCrystal){
				configTable.buyCrystal = buyArray[i].name;
				thisobj.buyCrystal = buyArray[i];
				break;
			}
		}
		
		if(thisobj.buyCrystal === undefined){
			console.error('读取配置：购买水晶失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		var sayString = '【换水晶】请选择水晶类型:';
		for(var i in buyArray){
			if(i != 0)
				sayString += ', ';
			sayString += '('+ (parseInt(i)+1) + ')' + buyArray[i].name;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && buyArray[index - 1]){
				configTable.buyCrystal = buyArray[index - 1].name;
				thisobj.buyCrystal = buyArray[index - 1];
				
				var sayString2 = '当前已选择:[' + thisobj.buyCrystal.name + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				cb(null);
				
				return false;
			}
			
			return true;
		});
	}
};

module.exports = thisobj;