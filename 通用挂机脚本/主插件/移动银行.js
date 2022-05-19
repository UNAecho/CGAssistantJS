var cga = global.cga;
var configTable = global.configTable;
var switchAccount = require('./../公共模块/切换同类账号');

var stuffs = { gold : 0 };

// 普通账户/银行大客户的金币上限
var normallimit = 1000000
var bigcustomerlimit = 10000000

// 移动银行站立地点
var waitmapname = '里谢里雅堡'
var waitXY = {x:48,y:39}

// 移动银行最低最高持有金币。少取多存。
var upperlimit = 500000
var lowerlimit = 200000
var newbornlimit = 1000
// 每次给前来提款的人多少金币
var drawmoney = lowerlimit

// 余额不足提示次数
var mute = 5
// 暗号物品名称
var ciphername = '瓶子'
var cipherid = 18314

// 暗号物品数量意义，1存，7取
var cipherSave = 1
var cipherDraw = 7

// 暗号内容，区分存取动作
var save = '头目万岁'
var draw = '魔术'
// 注意该暗号需要在后面跟上特殊符号一起使用，需要配合[取出生启动金.js]使用
var newborn = '朵拉'

// 银行里是否有充足金钱取，或者有充足位置存
var banksaveflag = true
var bankdrawflag = true

// 换号种类，自动识别，不要更改
var switchtype = 0

// 银行魔币缓存
var bankgold = null

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
					if (result.reason == '交易被拒绝'){
						console.log('交易被人为终止')
					}else if(result.reason == '物品栏已满'){
						console.log('物品栏满了，可能是魔币、物品以及宠物，需要存银行或换号了。')
						// 如果银行也满了就换下一个号
						if(bankgold == normallimit){
							setTimeout(() => {
								switchlogic(1,loop)
							}, 1000);
						}else{// 没满就去存银行
							cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
							setTimeout(loop, 1000);
						}
					}
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
					console.log('已支付【'+player.name+'】+【'+drawmoney+'】魔币')
				}else if(result && result.success == false){// TODO 取钱，对方满了如何作出处理
					if (result.reason == '交易被拒绝'){
						console.log('交易被人为终止')
					}else if(result.reason == '物品栏已满'){
						console.log('物品栏满了，可能是魔币、物品以及宠物，需要存银行或换号了。')
						setTimeout(() => {
							switchlogic(-1,loop)
						}, 1000);
					}
				
				}
				// 不管成功与否，都禁止再次交易。由对方再说出暗号才可继续交易
				cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			});
		}
		
		if(msg.indexOf(newborn) >= 0 && msg.charAt(msg.length - 1) == '$'){
			console.log('出生学技能扶持暗号街头成功')
			stuffs.gold = newbornlimit
			cga.waitTrade(stuffs, null, (result)=>{
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
	}else if(type == 'draw'){
		cga.MoveGold(money, cga.MOVE_GOLD_FROMBANK);
		console.log('本次从银行取【'+money+'】元')
	}else{
		console.log('非存取钱动作，跳过此操作')
	}

	setTimeout(() => {
		console.log('原来缓存银行金额:'+bankgold)
		bankgold = cga.GetBankGold()
		console.log('更新缓存银行金额:'+bankgold)
	}, 1500);

	setTimeout(cb, 5000);
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
// 切号逻辑
var switchlogic =(switchtype,cb)=>{
	try {
		var switchObject = switchAccount
		if(switchObject)
		{
			console.log('准备换号..switchtype = ' + switchtype)
			switchObject.func(loop,'仓库',switchtype == 0 ? 1 : switchtype);
			return;
		}
	} catch(e) {
		console.log('读取自动更换账号异常 , message : ', e);
		setTimeout(cb, 1000);
	}
}
var loop = ()=>{

	var playerPos = cga.GetMapXY()
	var curgold = cga.GetPlayerInfo().gold
	var teamplayers = cga.getTeamPlayers()

	var inventory = cga.getInventoryItems();

	if(inventory.length >= 18){
		dropUseless(loop);
		return;
	}
	// TODO 这里注意后续辨别一下大客户的一千万上限和普通不同
	if(bankgold && (curgold < lowerlimit && bankgold >= lowerlimit) || (curgold > upperlimit && bankgold < normallimit)) {

		var typeofact = curgold >= upperlimit  ? 'save' : 'draw'
		
		if(bankgold && typeofact == 'save' && bankgold == normallimit){
			if (mute>0){
				console.log('银行金币已到上限，无法继续存储。去集合点正常提供服务，如果遇到存钱的账号，则换下一个号继续收钱')
				mute -=1
			}
		}else if(bankgold && typeofact == 'draw' && bankgold == 0){
			if (mute>0){
				console.log('银行金币已为0，无法继续取钱。去集合点正常提供服务，如果遇到取钱的账号，则换下一个号继续提供钱')
				mute -=1
			}
		}else{
			cga.travel.falan.toBank(() => {
				cga.walkList([
					[11, 8],
				], () => {
					cga.turnDir(0);
					cga.AsyncWaitNPCDialog(() => {
						bankgold = cga.GetBankGold()
						if(typeofact == 'draw' && bankgold < lowerlimit){
							// bankdrawflag = false
							// switchtype = -1
							console.log('银行余额不足以维持移动银行的现金流了，全部取出')
							setTimeout(() => {
								GoldAct(bankgold, typeofact,loop)
							}, 2000);
							return
						}else if(typeofact == 'save' && bankgold + curgold >= normallimit){
							// banksaveflag = false
							// switchtype = 1
							console.log('银行满了')
							setTimeout(() => {
								GoldAct(normallimit - bankgold, typeofact,loop)
							}, 2000);
							return
						}
						setTimeout(() => {
							GoldAct(typeofact == 'save' ? (upperlimit-lowerlimit):(upperlimit-curgold), typeofact,loop)
						}, 2000);
						return
					}, 1000);
				});
			});
		}
	}else if(cga.GetMapName() == waitmapname && playerPos.x == waitXY.x && playerPos.y == waitXY.y){
	
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
	}else{
		callSubPluginsAsync('prepare', ()=>{
			cga.travel.falan.toBank(() => {
				cga.walkList([
					[11, 8],
				], () => {
					cga.turnDir(0);
					cga.AsyncWaitNPCDialog(() => {
						bankgold = cga.GetBankGold()
						console.log('银行现金:'+bankgold)
						cga.travel.falan.toStone('C', ()=>{
							cga.walkList([
							[waitXY.x, waitXY.y],
							], loop);
						});
					}, 1000);
				});
			});
		});
		return
	}

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