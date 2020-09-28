var cga = require('./cgaapi')(function(){

	
	cga.turnTo(20, 11);
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
			var emptySlotCount = cga.getInventoryEmptySlotCount();

			store.items.forEach((it)=>{
				if(it.name == '小麦粉' && emptySlotCount > 0){
					buyitem.push({index: it.index, count: emptySlotCount * 20});
				}
			});

			cga.BuyNPCStore(buyitem);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				return;
			});
		});
	});

});