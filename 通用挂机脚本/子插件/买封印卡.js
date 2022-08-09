var cga = global.cga;
var configTable = global.configTable;

var buyArray = [
	{
		name : '封印卡（人形系）',
		type : 40,
	},
	{
		name : '封印卡（龙系）',
		type : 40,	
	},
	{
		name : '封印卡（野兽系)',
		type : 40,	
	},
	{
		name : '封印卡（昆虫系）',
		type : 40,	
	},
	{
		name : '封印卡（特殊系）',
		type : 40,	
	},
	{
		name : '封印卡（金属系）',
		type : 40,	
	},
	{
		name : '封印卡（飞行系）',
		type : 40,	
	},
	{
		name : '封印卡（不死系）',
		type : 40,	
	},
	{
		name : '封印卡（植物系）',
		type : 40,	
	}
	]

const buyFilter = (eq) => {
	if (eq.type == 40 && eq.assessed == true && eq.name == thisobj.buyCard.name && eq.count >=20) {
		return true;
	}
	return false;
}

const buyLoop = (cb)=>{
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
			
			var buyitem = [];
			var buyCount = 0;
			// 留一个空位，给换水晶备用
			var emptySlotCount = cga.getInventoryEmptySlotCount() - 1;
			
			store.items.forEach((it)=>{
				if(it.name == thisobj.buyCard.name && buyCount < emptySlotCount){
					buyitem.push({index: it.index, count:20*emptySlotCount});
					buyCount ++;
				}
			});
			if(!buyitem.length)
			{
				cb(new Error('商店没有封印卡出售，可能已被买完或者背包没空间'));
				return;
			}
			
			cga.BuyNPCStore(buyitem);
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
		var items = cga.GetItemsInfo().filter(buyFilter);
		if(items.length){
			cb(null);
			return;
		}
		
		if(cga.getTeamPlayers().length){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(thisobj.prepare, 1000, cb);
			return;
		}

		var buy = buyLoop;
		
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
		
		if(pair.field == 'buyCard'){
			pair.field = '购买封印卡';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	think : (ctx)=>{

		var counts = cga.getItemCount(thisobj.buyCard.name)
		if(counts<20)
		{
			cga.SayWords('封印卡不够，需要回补!', 0, 3, 1);
			ctx.result = 'logback';
			ctx.reason = '封印卡不够';
			return;
			

		}
	},
	loadconfig : (obj, cb)=>{
		for(var i in buyArray){
			if(buyArray[i].name == obj.buyCard){
				configTable.buyCard = buyArray[i].name;
				thisobj.buyCard = buyArray[i];
				break;
			}
		}
		
		if(thisobj.buyCard === undefined){
			console.error('读取配置：购买封印卡失败！');
			return false;
		}

		return true;
	},
	inputcb : (cb)=>{
		var sayString = '【买封印卡】请选择购买卡片种类:';
		for(var i in buyArray){
			if(i != 0)
				sayString += ', ';
			sayString += '('+ (parseInt(i)+1) + ')' + buyArray[i].name;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && buyArray[index - 1]){
				configTable.buyCard = buyArray[index - 1].name;
				thisobj.buyCard = buyArray[index - 1];
				
				var sayString2 = '当前已选择:[' + thisobj.buyCard.name + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				cb(null);
				
				return false;
			}
			
			return true;
		});
	}
};

module.exports = thisobj;