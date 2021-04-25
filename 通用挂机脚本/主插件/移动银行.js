var cga = global.cga;
var configTable = global.configTable;

var stuffs = { gold : 0 };

// 移动银行站立地点
var waitmapname = '里谢里雅堡'
var waitXY = {x:48,y:39}

// 移动银行最低最高持有金币。少取多存。
var upperlimit = 500000
var lowerlimit = 200000
// 每次给前来提款的人多少金币
var drawmoney = lowerlimit

// 暗号物品名称
var ciphername = '瓶子'
var cipherid = 18314

// 暗号物品数量意义，1存，7取
var cipherSave = 1
var cipherDraw = 7

// 暗号内容，区分存取动作
var save = '头目万岁'
var draw = '魔术'

// 银行里是否有充足金钱
var enoughmoney = true

var waitcipher = ()=>{
	/* plarer:
	* { unit_id: 18575,
		hp: 1127,
		maxhp: 1127,
		mp: 1443,
		maxmp: 1443,
		xpos: 26,
		ypos: 80,
		name: 'UNAの测试',
		nick: '',
		injury: 0,
		level: 155,
		index: '1' }
	*/
	cga.waitTeammateSay((player, msg)=>{
		if(msg.indexOf(save) >= 0 ){
			console.log('存钱暗号接头成功')
			stuffs.gold = 0
			cga.waitTrade(stuffs, checkParty, (result)=>{
				if(result && result.success == true){
					console.log('已从【'+player.name+'】处收取存款')
				}else if(result && result.success == false){
					console.log('交易中止，已被取消或包满')
				}
				// 不管成功与否，都禁止再次交易。由对方再说出暗号才可继续交易
				cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			});
		}
		
		if(msg.indexOf(draw) >= 0 ){
			console.log('取钱暗号接头成功')
			stuffs.gold = drawmoney
			cga.waitTrade(stuffs, checkParty, (result)=>{
				if(result && result.success == true){
					console.log('已从【'+player.name+'】处收取存款')
				}else if(result && result.success == false){
					console.log('交易中止，已被取消或包满')
				}
				// 不管成功与否，都禁止再次交易。由对方再说出暗号才可继续交易
				cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			});
		}

		return true;
	});
}
var checkParty = (playerName, receivedStuffs)=>{
	// 物品暗号判断flag
	var cipherFlag = false
	var items = receivedStuffs.items
	if(items != undefined ){
		items.find((s)=>{
			// 蕃茄酱空瓶子,cipherSave个为移动银行收钱，cipherDraw个为付钱
			if (s.name == ciphername && s.itemid == cipherid && s.count == cipherSave){
				cipherFlag = true
				console.log('交易对象：【'+playerName+'】的【存】钱暗号物品通过！');
			}else if(s.name == ciphername && s.itemid == cipherid && s.count == cipherDraw){
				cipherFlag = true
				console.log('交易对象：【'+playerName+'】的【取】钱暗号物品通过！');
			}
		})
	}

	if(!cipherFlag){
		console.log('交易对象：【'+playerName+'】未能满足交易条件，不予以通过');
		return false;
	}
	return true;
}

//魔币操作： cga.MOVE_GOLD_TOBANK = 1;cga.MOVE_GOLD_FROMBANK =  2;cga.MOVE_GOLD_DROP = 3
var GoldAct = (money, type,cb) => {
	if(type == 'save'){
		cga.MoveGold(money, cga.MOVE_GOLD_TOBANK);
		console.log('本次存银行【'+money+'】元')
		setTimeout(cb, 3000);
	}else if(type == 'draw'){
		cga.MoveGold(money, cga.MOVE_GOLD_FROMBANK);
		console.log('本次从银行取【'+money+'】元')
		setTimeout(cb, 3000);
	}else{
		console.log('非存取钱动作，跳过此操作')
		setTimeout(cb, 3000);
	}
	return

}

// 丢弃暗号物品，一个pos最多丢弃9个物品
var dropcount = 0
var dropUseless = (cb)=>{
	console.log('开始清理暗号物品')
	cga.travel.falan.toStone('C', ()=>{
		cga.walkList([
		[48, 41],
		], ()=>{
			if(dropcount < 9 && cga.getInventoryItems().find((inv)=>{
				return inv.name == ciphername;
			}) != undefined){
				var itempos = cga.findItem(ciphername);
				if(itempos != -1){
					cga.DropItem(itempos);
					dropcount+=1
					setTimeout(dropUseless, 500, cb);
					return;
				}
			}
			dropcount = 0
			cb(null);
		});
	});
}
var loop = ()=>{

	var playerPos = cga.GetMapXY();
	var curgold = cga.GetPlayerInfo().gold
	var teamplayers = cga.getTeamPlayers();			

	if(!enoughmoney){
		console.log('【警告】：银行里没钱了，请留意是真的没钱了，还是脚本哪个环节出错导致金钱流失。')
	}

	var inventory = cga.getInventoryItems();

	if(inventory.length >= 18){
		dropUseless(loop);
		return;
	}

	if(enoughmoney && (curgold < lowerlimit || curgold > upperlimit)) {

		var typeofact = curgold >= upperlimit  ? 'save' : 'draw'

		cga.travel.falan.toBank(() => {
			cga.walkList([
				[11, 8],
			], () => {
				cga.turnDir(0);
				cga.AsyncWaitNPCDialog(() => {
					bankgold = cga.GetBankGold()
					if(typeofact == 'draw' && bankgold < lowerlimit){
						enoughmoney = false
						setTimeout(loop, 2000);
						return
					}
					setTimeout(() => {
						GoldAct(typeofact == 'save' ? 500000:(500000-curgold), typeofact,loop)
					}, 2000);
				}, 1000);
			});
		});
		return;
	}

	if(cga.GetMapName() == waitmapname && playerPos.x == waitXY.x && playerPos.y == waitXY.y){
	
		var trade = ()=>{
			if(cga.getTeamPlayers().length < 2){
				setTimeout(loop, 1000);
				return
			}
			// 这里本应是交易逻辑，但真正的触发逻辑，在一开始就运行的waitcipher()中

			// 递归循环
			setTimeout(trade, 1000);
		}

		if(teamplayers.length > 1){
			cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
			setTimeout(trade, 1000);
			return
		}
		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);

		setTimeout(loop, 1000);
		return
	}

	callSubPluginsAsync('prepare', ()=>{
		
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
			[waitXY.x, waitXY.y],
			], loop);
		});
	});
	return
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		return false;
	},
	loadconfig : (obj)=>{

		// 暂注销，备用
		// configTable.listenPort = obj.listenPort;
		// thisobj.listenPort = obj.listenPort
		
		// if(!thisobj.listenPort){
		// 	console.error('读取配置：监听端口失败！');
		// 	return false;
		// }
		
		// if(!healObject.loadconfig(obj))
		// 	return false;
		
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	},
	execute : ()=>{
		callSubPlugins('init');
		loop();
		waitcipher()
	},
};
module.exports = thisobj;