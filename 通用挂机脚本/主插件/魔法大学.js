var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()

var healObject = require(rootdir + '/通用挂机脚本/公共模块/治疗自己');
var healPetObject = require(rootdir + '/通用挂机脚本/公共模块/治疗宠物');
var supplyObject = require(rootdir + '/通用挂机脚本/公共模块/通用登出回补');
var supplySelena = require(rootdir + '/通用挂机脚本/公共模块/莎莲娜回补');
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)
var job = professionalInfo.jobmainname
var jobLv = getprofessionalInfos.getJobLevel(cga.GetPlayerInfo().job)

// 由于小号不参与socket，所以需要手动指定服务端带队者是谁
var serverPlayerName = 'UNAの药剂'

// 没有3转的号会被认定为需要蹭车晋级的小号
if (jobLv < 3){
	job= '小号'
}

// 服务端变量
var craft_count = 0;
var craft_target = null;
// 3是因为一次药剂和鉴定的配合只能在NPC那里获得3个未鉴定药剂，所以一次打3份（1组）材料就行。
const MATERIALS_MULTIPLE_TIMES = 3;

// 制造者交易时的站立坐标以及朝向坐标
var craftPlayerPos = [35, 45]
var craftPlayerTurnDir = 4

// 采集员自动适配制造者的坐标以及朝向
var workerPos = cga.getStaticOrientationPosition(craftPlayerPos, craftPlayerTurnDir, 1)
var workerTurnDir = cga.tradeDir(craftPlayerTurnDir)

var isDarkBlueMaterials = (name)=>{
	return ['湿地毒蛇', '魔法红萝卜', '瞿麦', '百里香'].indexOf(name) != -1 ? true : false
}
// 仅服务端使用
const io = require('socket.io')();
// 仅客户端使用
var socket = null;

// 如果是药剂师，则作为服务端
if(job == '药剂师'){
	io.on('connection', (socket) => { 
		socket.emit('init', {
			craft_player : cga.GetPlayerInfo().name,
			craft_materials : craft_target ? craft_target.materials : [],
		});
		
		socket.on('register', (data) => {
			socket.cga_data = data;
			socket.join('gather_'+data.gather_name);
			console.log(socket.cga_data.player_name +' 已加入魔法大学节点');
		});
	
		socket.on('done', (data) => {
			socket.cga_data.count = data.count;
			socket.cga_data.state = 'done'; 
		});
		
		socket.on('ready_addteam', () => {
			console.log('ready_addteam');
			socket.cga_data.state = 'ready_addteam'; 
		});
		
		socket.on('appraiser_joined', () => {
			console.log('appraiser_joined');
			socket.cga_data.state = 'appraiser_joined'; 
		});
		
		socket.on('traveling', () => {
			console.log('traveling');
			socket.cga_data.state = 'traveling'; 
		});
		
		socket.on('exchange_finish', (fn) => {
			if(socket.cga_data.state == 'exchange')
			{
				socket.cga_data.state = 'exchange_finish'; 
				
				var count = 0;
				cga.getInventoryItems().forEach((inv)=>{
					if( inv.itemid == 18526 && inv.assessed == false )
						count ++;
				})
				
				console.log('交易阶段结束，未被鉴定的深蓝药剂数量为：' + count);
				
				fn(count);
			}
		});
		
		socket.on('disconnect', (err) => {
			if(socket.cga_data)
				console.log(socket.cga_data.player_name +' 已退出魔法大学节点');
		})
	});
}

// 通用对话逻辑
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
		console.log(dlg)
		// 获取进阶资格则结束本脚本
		if(dlg.message.indexOf('升阶') != -1){
			var minssionObj = {}
			minssionObj[configTable.mainPlugin] = true
			cga.refreshMissonStatus(minssionObj,()=>{
				console.log('【' + configTable.mainPlugin + '】完成')
				jump()
			})
			return
		}
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 3)
	{
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 12)
	{
		cga.ClickNPCDialog(4, -1);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else
	{
		return;
	}
}
// 跳转脚本
var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','双百制造')
	},5000)
}

// 仅服务端使用
var waitStuffs = (name, materials, cb)=>{
	
	console.log('等待材料 ' + name);

	var waitJob = ['魔法红萝卜', '瞿麦', '百里香'].indexOf(name) != -1 ? '樵夫' : '猎人'

	var repeat = ()=>{
		var s = io.in('buddy_'+name).sockets;
		var find_player = null;
		/**
		 * 此处特殊处理，由于樵夫属于1人打多种材料，所以本脚本并未使用材料名称作为job_name，而是使用职业名称
		 * 进而s[key].cga_data.job_name需要判断职业名称，而不是材料名称
		 * 故从传统的s[key].cga_data.job_name == name 改为 s[key].cga_data.job_name == waitJob
		 */
		for(var key in s){
			if(s[key].cga_data &&
			s[key].cga_data.job_name == waitJob &&
			s[key].cga_data.state == 'done' ){
				find_player = s[key];
				break;
			}
		}
		
		if(find_player){
			
			console.log('等待材料... ' + name);
			
			find_player.cga_data.state = 'trade';
			find_player.emit('init', {
				craft_player : cga.GetPlayerInfo().name,
				craft_materials : materials,
			});
			
			find_player.emit('trade');

			var unit = cga.findPlayerUnit(find_player.cga_data.player_name);

			if(unit == null || unit.xpos != 34 || unit.ypos != 45){
				setTimeout(repeat, 1000);
				return;
			}

			setTimeout(()=>{
				var stuffs = { gold:0 };
				// TODO计算一下如何平衡金钱
				/*if(find_player.cga_data.gather_name == '百里香'){
					stuffs.gold += find_player.cga_data.count * 1;
				}*/
				cga.positiveTrade(find_player.cga_data.player_name, stuffs, null, (result)=>{
					if (result.success == true){
						cb(true);
					} else {
						find_player.emit('endtrade');
						setTimeout(repeat, 1500);
					}
				});
			}, 1500);

			return;
		}
		
		setTimeout(repeat, 1000);
	}

	cga.walkList([
		[35, 45]
	], ()=>{
		cga.TurnTo(34, 45);
		setTimeout(repeat, 500);
	});
}

// 仅服务端使用，等待鉴定归还药?
var exchangeItem2 = (name, cb)=>{

	var s = io.in('buddy_鉴定').sockets;
	var find_player = null;
	for(var key in s){
		if(s[key].cga_data &&
		s[key].cga_data.player_name == name &&
		s[key].cga_data.state == 'exchange' || s[key].cga_data.state == 'exchange_finish'){
			find_player = s[key];
			break;
		}
	}
	
	var stuffs = 
	{
		itemFilter : (item)=>{
			if(find_player.cga_data.state == 'exchange_finish')
				return (item.itemid == 18526);
			
			return false;
		}
	}
	
	if(find_player){
		
		console.log('交易阶段： ' + find_player.cga_data.state);

		cga.waitTrade(stuffs, null, (result)=>{
			if(find_player.cga_data.state == 'exchange_finish'){
				// 如果有蹭车小号需要晋级，陪同至合格房间再解散队伍
				promote(cb)
			}
			else{
				exchangeItem2(name, cb);
			}
		});
	} else {
		console.log(new Error('未找到鉴定师，可能已掉线。或已成功带小号进入合格房间，重新开始循环'));
		promote(()=>{
			cb(new Error('未找到鉴定师，可能已掉线。或已成功带小号进入合格房间，重新开始循环'));
		})
	}
}

// 仅服务端使用，交易给鉴定未开光深蓝
var exchangeItem = (name, cb)=>{

	var s = io.in('buddy_鉴定').sockets;
	var find_player = null;
	for(var key in s){
		if(s[key].cga_data &&
		s[key].cga_data.player_name == name &&
		s[key].cga_data.state == 'exchange'){
			find_player = s[key];
			break;
		}
	}
	
	var stuffs = 
	{
		itemFilter : (item)=>{
			return (item.itemid == 15630);
		}
	}

	if(find_player){

		console.log('exchangeItem')

		setTimeout(()=>{
			cga.positiveTrade(name, stuffs, null, (result)=>{
				if(result && result.success == true)
				{
					exchangeItem2(name, cb);
					return;
				}
				
				exchangeItem(name, cb);
			});
		}, 1500);
		
	} else {
		cb(new Error('未找到鉴定师，可能已掉线'));
	}
}
// 仅服务端使用
var getInRoom = (name, cb)=>{
	cga.walkList([
	[40, 20],
	], ()=>{
		cga.TurnTo(40, 18);
		cga.AsyncWaitNPCDialog(()=>{
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(1, 0);
				cga.AsyncWaitMovement({map:'教室'}, ()=>{
					cga.walkList([
					[7, 7],
					[7, 6],
					[7, 7],
					[7, 6],
					[7, 7],
					], ()=>{
						exchangeItem(name, cb);
					});
				});
			});
		})
	});
}
// 仅服务端使用
var waitAssess = (cb)=>{

	console.log('等待鉴定师');

	cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);

	var s = io.in('buddy_鉴定').sockets;
	var find_player = null;
	for(var key in s){
		if(s[key].cga_data &&
		(s[key].cga_data.state == 'ready_addteam' || s[key].cga_data.state == 'addteam' || s[key].cga_data.state == 'appraiser_joined') ){
			find_player = s[key];
			break;
		}
	}
	
	if(find_player){
		
		console.log('等待鉴定师...');

		if(find_player.cga_data.state == 'appraiser_joined'){
			console.log('鉴定师已加入，将其状态变更为exchange')
			find_player.cga_data.state = 'exchange';
			find_player.emit('exchange');
			// 允许其他人加入队伍，因为小号要加入蹭车
			// cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
			getInRoom(find_player.cga_data.player_name, cb);
			return;
		}

		find_player.cga_data.state = 'addteam';
		find_player.emit('addteam');
		/**
		 * 自定义一个队伍等待，逻辑如下
		 * 等待鉴定师加入，如果有小号加入要蹭车3转，也可以。所以这样就不能使用cga.waitTeammates来等待队员，不然会把小号踢出去。
		 */
		var wait = (cb, find_player)=>{
			if(cga.getTeamPlayers().length > 1 && find_player.cga_data.state == 'appraiser_joined'){
				console.log('发送addteam之后，鉴定师已加入，将其状态变更为exchange')
				find_player.cga_data.state = 'exchange';
				find_player.emit('exchange');
				// 允许其他人加入队伍，因为小号要加入蹭车
				// cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
				getInRoom(find_player.cga_data.player_name, cb);
				return;
			}
			setTimeout(wait, 1000, cb, find_player);
		}

		wait(cb, find_player)
	}
	else
	{
		setTimeout(waitAssess, 1000, cb);
	}
}
// 仅服务端使用
var getExtractedItemCount = (inventory)=>{
	var count = 0;
	inventory.forEach((inv)=>{
		if(inv.itemid == 15630 || (inv.itemid == 18526 && inv.assessed == false))
			count += inv.count;
		else
			count += 1;
	});
	
	return count;
}
// 仅客户端使用
var exchangeItemForUnassessed = (name, cb)=>{
	var stuffs = 
	{
		itemFilter : (item)=>{
			if (item.itemid == 18526){
				return true;
			}
			
			return false;
		}
	}

	console.log('交易阶段2： '+ thisobj.state);

	cga.positiveTrade(name, thisobj.state == 'exchange_finish' ? {} : stuffs, null, (result)=>{
		if(result && result.success == true)
		{
			if(thisobj.state == 'exchange_finish' && result.received 
			&& result.received.items && result.received.items.find((item)=>{
				return item.itemid == 18526;
			}))
			{
				console.log('exchangeItemForUnassessed阶段，已经拿到所有深蓝');
				//看看有没有蹭车晋级需求
				cga.assessAllItems(()=>{
					setTimeout(promote, 1000, cb);
				});
			}
			else
			{
				exchangeNPC(name, cb);
			}
			return;
		}
		if(thisobj.state != 'exchange_finish' && thisobj.state != 'exchange' && thisobj.state != 'addteam'){
			console.log('状态错误：'+thisobj.state);
			cb(new Error('状态错误'));
		} else {
			exchangeItemForUnassessed(name, cb);
		}
	});
}

// 仅客户端使用，从NPC那里换取药？
var exchangeNPC = (name, cb)=>{
	console.log('从NPC那里换取药');
	
	cga.TurnTo(6, 7);
	cga.AsyncWaitNPCDialog((err, dlg)=>{
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(()=>{
			//如果身上有未开光深蓝和药？
			if(cga.getInventoryItems().find((inv)=>{
				return inv.itemid == 15630;
			}) != undefined)
			{
				//把药？交易给药剂师
				exchangeItemForUnassessed(name, cb);
			}
			else
			{
				//身上只有药？，没有未开光深蓝
				thisobj.state = 'exchange_finish';
				socket.emit('exchange_finish', (remain)=>{
					//等待药剂师交还所有药？
					if(remain > 0){
						exchangeItemForUnassessed(name, cb);
					} else {
						//药剂没有剩余的药？了
						console.log('exchangeNPC阶段，已经拿到所有深蓝');
						//看看有没有蹭车晋级需求
						cga.assessAllItems(()=>{
							setTimeout(promote, 1000, cb);
						});
					}
				});
			}
		});
	});
}

// 仅客户端使用，从药剂师那边拿
var exchangeItemFromServer = (name, cb)=>{
	
	console.log('exchangeItem');
	
	cga.waitTrade({}, null, (result)=>{
		if(result && result.success == true)
		{
			//第一次交易，拿到所有未开光
			exchangeNPC(name, cb);
			return;
		}
		
		if(thisobj.state != 'exchange_finish' && thisobj.state != 'exchange' && thisobj.state != 'addteam' && thisobj.state != 'appraiser_joined'){
			console.log('状态错误：'+thisobj.state);
			cb(new Error('状态错误'));
		} else {
			exchangeItemFromServer(name, cb);
		}
	});
	
	
}
// 仅客户端使用
var addTeam = (cb)=>{
	cga.addTeammate(thisobj.craft_player, (r)=>{
		if(r){
			// 客户端向服务端通知已经加入队伍，因为服务端无法使用cga.waitTeammates来等待队员，因为小号是不确定玩家名称的。
			socket.emit('appraiser_joined');
			exchangeItemFromServer(thisobj.craft_player, cb);
			return;
		}
		setTimeout(addTeam, 1000, cb);
	});
}

// 仅客户端使用
var check_drop = ()=>{
	var dropItemPos = -1;
	var pattern = /(.+)的卡片/;
	cga.getInventoryItems().forEach((item)=>{
		if(dropItemPos != -1)
			return;
		if(item.name == '魔石' || item.name == '卡片？' || pattern.exec(item.name)) {
			dropItemPos = item.pos;
			return;
		}
		if(thisobj.extra_dropping(item)) {
			dropItemPos = item.pos;
			return;
		}
	});
	
	if(dropItemPos != -1)
		cga.DropItem(dropItemPos);
}

// 仅客户端使用，带小号晋级
var promote = (cb)=>{
	console.log('开始判断是否需要带小号晋级...')
	var index = cga.GetMapIndex().index3
	var teamplayers = cga.getTeamPlayers();
	
	var disbandTeam = (cb)=>{
		var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
		if(isTeamLeader){
			console.log('队长解散队伍')
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
		}
		setTimeout(cb, 1000);
	}

	// 如果在第一考场中，队伍人数大于2人，那么一定有除了药剂师和鉴定师之外的小号需要蹭车晋级
	if(teamplayers.length > 2){
		if(index == 4415){
			cga.waitForLocation({mapindex : 4421}, ()=>{
				console.log('已到达合格房间')
				setTimeout(disbandTeam, 1000, cb);
			});
		}else if(index == 4421){
			setTimeout(disbandTeam, 1000, cb);
		}

		if(job == '鉴定师'){
			cga.TurnTo(6, 7);
			cga.AsyncWaitNPCDialog(dialogHandler);
		}
		return;
	}else{
		console.log('没有晋级需求。')
		setTimeout(disbandTeam, 1000, cb);
	}
}

var loop = ()=>{
	// loop里的药剂师逻辑
	if(job == '药剂师'){
		callSubPluginsAsync('prepare', ()=>{
		
			var skill = cga.findPlayerSkill('制药');
			
			if(!skill){
				throw new Error('没有制药技能!');
				return;
			}
			
			craft_target = cga.GetCraftsInfo(skill.index).find((craft)=>{
				return craft.name == '香水：深蓝九号';
			})
			
			if(!craft_target){
				throw new Error('没有习得深蓝的制造配方!');
				return;
			}

			var mapindex = cga.GetMapIndex().index3;
			
			if(mapindex != 4410) {
				var mainMapName = cga.travel.switchMainMap()

				var go = ()=>{
					cga.walkList([
						[35, 45],
					], loop);
				}
	
				if(mainMapName == '魔法大学'){
					cga.travel.autopilot('魔法大学内部',go)
					return;
				}else{
					cga.travel.falan.toTeleRoom('魔法大学', ()=>{
						cga.travel.autopilot('魔法大学内部',go)
						return;
					});
				}
				return
			}else if(mapindex == 4410 && (cga.GetMapXY().x != 35 || cga.GetMapXY().y != 45)){
				cga.walkList([
					[35, 45],
					], loop);
				return
			}
	
			var playerInfo = cga.GetPlayerInfo();
			if(playerInfo.mp < craft_target.cost) {
				cga.TurnTo(35, 47);
				setTimeout(loop, 3000);
				return;
			}
			
			if(playerInfo.health > 0) {
				healObject.func(loop);
				return;
			}
	
			//物品栏里的未交换或交换了但未鉴定的深蓝药剂超过3个
			var inventory = cga.getInventoryItems();
			var count = getExtractedItemCount(inventory);
			if(count >= 3 && inventory.find((inv)=>{
				return inv.itemid == 15630;
			}) != undefined){
				waitAssess(loop);
				return;
			}
	
			io.sockets.emit('init', {
				craft_player : cga.GetPlayerInfo().name,
				craft_materials : craft_target ? craft_target.materials : [],
			});
	
			var lackStuffs = null;
			craft_target.materials.forEach((mat)=>{
				if(cga.getItemCount(mat.name) < mat.count){
					lackStuffs = mat;
					return false;
				}
			})
	
			if(lackStuffs !== null){
				waitStuffs(lackStuffs.name, craft_target.materials, loop);
				return;
			}
	
			var craft = ()=>{
	
				//没蓝
				var playerInfo = cga.GetPlayerInfo();
				if(playerInfo.mp < craft_target.cost){
					loop();
					return;
				}
				
				//物品栏里的东西超过15个
				var inventory = cga.getInventoryItems();
				var count = getExtractedItemCount(inventory);
				if(count >= 15 && inventory.find((inv)=>{
					return inv.itemid == 15630;
				}) != undefined){
					loop();
					return;
				}
	
				console.log('开始制造');
				
				cga.craftItemEx({
					craftitem : craft_target.name,
					immediate : true
				}, (err, results)=>{
					// console.log(err);
					if(results && results.success){
						craft_count ++;
						console.log('已造' + craft_count + '次');
						setTimeout(craft, 500);
					} else {
						setTimeout(loop, 500);
					}
					
				});
			}
			
			craft();		
		})
	}else if(job == '鉴定师'){
		thisobj.state = 'traveling';
		socket.emit('traveling');

		// 身上的鉴定药剂存银行，主要因为身上不能有鉴定好的深蓝药剂，因为要和NPC交换未鉴定的药剂。
		var inventory = cga.getInventoryItems();
		var found_assessed = inventory.find((inv)=>{
			return (inv.assessed == true && inv.itemid == 18526);
		});
		if(found_assessed != undefined){
			if(!thisobj.isFull){
				cga.travel.falan.toBank(()=>{
					cga.walkList([
					[11, 8],
					], ()=>{
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.saveToBankAll((item)=>{
								return item.itemid == 18526 && item.assessed == true;
							}, 3, (err)=>{
								if(err && err.message.indexOf('没有空位') != -1){
									thisobj.isFull = true
								}
								loop();
							});
						});
					});
				});
			}else{
				console.log('银行已满，多余的深蓝药剂卖店。')
				var sell = cga.findItemArray((item) => { 
					// 银行已满，直接卖店
					if ([15630, 18526].indexOf(item.itemid) != -1 && item.count == 3) {
						item.count /= 3
						item.count = Math.floor(item.count)
						return true
					}
					return false
				});
				if (sell && sell.length > 0){
					cga.travel.falan.toStone('C', () => {
						cga.walkList([
							[30, 79],
						], () => {
							cga.TurnTo(30, 77);
							cga.sellArray(sell, loop);
						});
					});
					return
				}else{
					loop()
					return
				}
			}
			return;
		}

		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.mp < 80 || playerInfo.hp < playerInfo.maxhp) {
			if(cga.travel.switchMainMap() == '魔法大学'){
				cga.travel.toHospital(false, loop)
			}else{
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(loop, 3000);
				});
			}
			return;
		}
		
		if(playerInfo.health > 0) {
			healObject.func(loop);
			return;
		}

		//药？
		var count = 0;
		var inventory = cga.getInventoryItems();
		var found_unassessed = inventory.find((inv)=>{
			return (inv.assessed == false && inv.itemid == 18526);
		});
		if(found_unassessed != undefined){
			console.log('开始鉴定')
			cga.assessAllItems(loop);
			return;
		}

		callSubPluginsAsync('prepare', ()=>{

			var mainMapName = cga.travel.switchMainMap()

			var go = ()=>{
				cga.walkList([
					[34, 45],
				], ()=>{
					thisobj.state = 'ready_addteam';
					socket.emit('ready_addteam');
				});
			}

			if(mainMapName == '魔法大学'){
				cga.travel.autopilot('魔法大学内部',go)
				return;
			}else{
				cga.travel.falan.toTeleRoom('魔法大学', ()=>{
					cga.travel.autopilot('魔法大学内部',go)
					return;
				});
			}
		});
	}else if(job == '猎人' || job == '樵夫'){
		// 没有需求则进入休眠状态
		if(Object.keys(thisobj.gatherInfo).length == 0){
			setTimeout(loop, 1500);
			return;
		}
		if(job == '猎人' && !thisobj.gatherInfo.hasOwnProperty('湿地毒蛇')){
			setTimeout(loop, 1500);
			return;
		}
		if(job == '樵夫' && !thisobj.gatherInfo.hasOwnProperty('魔法红萝卜') && !thisobj.gatherInfo.hasOwnProperty('瞿麦') && !thisobj.gatherInfo.hasOwnProperty('百里香')){
			setTimeout(loop, 1500);
			return;
		}
		var skillName = job == '猎人' ? '狩猎' : '伐木'

		thisobj.skill = cga.findPlayerSkill(skillName);
		if(!thisobj.skill){
			errmsg = '你没有'+skillName+'技能';
			cga.SayWords(errmsg , 0, 3, 1);
			return;
		}
		if(thisobj.skill.lv < 8){
			var errmsg = skillName+'技能等级不够，需要至少【8】级技能，而你只有'+thisobj.skill.lv+'级技能';
			cga.SayWords(errmsg , 0, 3, 1);
			return;
		}

		var mainMapName = cga.travel.switchMainMap()

		var playerInfo = cga.GetPlayerInfo();
		// 有80%蓝量则认为可以继续工作
		if(playerInfo.mp < playerInfo.maxmp * 0.8 || playerInfo.hp < playerInfo.maxhp)
		{	// 如果血量充足，则使用走路至就近村镇、大学等回补，节约时间以及传送费用
			if(playerInfo.hp >= 1000 && playerInfo.hp > playerInfo.maxhp * 0.8 && supplySelena.isAvailable())
				supplySelena.func(loop);
			else if(supplyObject.func)
				supplyObject.func(loop);
			return;
		}

		if(thisobj.check_done()){
			thisobj.doneManager(loop)
			return
		}
		console.log('你是【' + job + '】，要去打【' + thisobj.workingItem +'】材料')
		// 开始采集任务
		callSubPluginsAsync('prepare', ()=>{
			// 采集地点附近村镇
			var targetVillage = null
			// 猎人采集逻辑
			if(job == '猎人'){
				targetVillage = '魔法大学'
				var go = ()=>{
					cga.walkList([
						[38, 54],
						], ()=>{
							cga.TurnTo(38, 52);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({x : 38, y : 52}, ()=>{
									cga.walkList([
									[38, 51, null, null, null, true],
									[37, 49],
									], thisobj.workwork);
								});
							});
						});
				}
				if(mainMapName == targetVillage){
					cga.travel.autopilot('地底湖 地下2楼',go)
				}else{
					cga.travel.falan.toTeleRoom(targetVillage, ()=>{
						cga.travel.autopilot('地底湖 地下2楼',go)
					});
				}
				return;
			}else if(job == '樵夫'){// 樵夫采集逻辑
				// 魔法红萝卜逻辑：先去魔法大学，没有手套先拿手套，有手套就开始采集
				if (thisobj.workingItem =='瞿麦'){
					targetVillage = '杰诺瓦镇'
					var go = ()=>{
						cga.walkList([
							[71, 19, '莎莲娜'],
							[262, 574],
						], thisobj.workwork);
					}
					if(mainMapName == targetVillage){
						cga.travel.autopilot('主地图',go)
					}else{
						cga.travel.falan.toTeleRoom(targetVillage, loop);
					}
				}else if (thisobj.workingItem =='百里香'){
					targetVillage = '杰诺瓦镇'
					var go = ()=>{
						cga.walkList([
							[24, 40, '莎莲娜'],
							[175, 497],
						], thisobj.workwork);
					}
					if(mainMapName == targetVillage){
						cga.travel.autopilot('主地图',go)
					}else{
						cga.travel.falan.toTeleRoom(targetVillage, loop);
					}
				}else if (thisobj.workingItem =='魔法红萝卜'){
					targetVillage = '魔法大学'
					var go = ()=>{
						cga.walkList([
							[32, 167],
							], thisobj.workwork);
					}
					if(mainMapName == targetVillage){
						if(cga.getItemCount('魔法手套') == 0){
							var getItem = ()=>{
								cga.walkList([
									[18, 10],
									], ()=>{
										cga.TurnTo(18, 8);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(4, 0);
											cga.AsyncWaitNPCDialog(loop);
										})
									});
							}
							if(mainMapName == targetVillage){
								cga.travel.autopilot('仓库内部',getItem)
							}else{
								cga.travel.falan.toTeleRoom(targetVillage, ()=>{
									cga.travel.autopilot('仓库内部',getItem)
								});
							}
							return;
						}else{
							cga.travel.autopilot('主地图',go)
						}
					}else{
						cga.travel.falan.toTeleRoom('魔法大学', loop);
					}
				}
			}
		});
	}else{// 蹭车3转的小号逻辑
		callSubPluginsAsync('prepare', ()=>{
			/**
			 * 走到10,10处和11,10的NPC对话
			 * {
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 7858,
				message: '\n\n你已经得到了必要的资格。\n回到担任你职业的公会会长那边升阶吧！'
				}
			 */
			var waitSuccessRoom = (cb)=>{
				var index = cga.GetMapIndex().index3;
				if (index == 4421){
					console.log('成功抵达合格房间')
					cga.walkList([
						[10, 10],
					], ()=>{
						cga.TurnTo(11, 10);
						cga.AsyncWaitNPCDialog(dialogHandler);
					});
					return
				}
				if(cga.getTeamPlayers().length == 0){
					console.log('队伍已解散，可能有队友已掉线')
					loop()
					return;
				}
				setTimeout(waitSuccessRoom, 1000, cb);
			}

			var leaveteam = (cb)=>{
				if(cga.getTeamPlayers().length){
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					setTimeout(leaveteam, 1000, cb);
				}else{
					setTimeout(leaveteam, 1000, cb);	
				}
				return;
			}

			var go = (cb)=>{
				cga.walkList([
					[34, 45],
				], ()=>{			
					cga.addTeammate(serverPlayerName, (r)=>{
						if(r){
							waitSuccessRoom(cb)
							return;
						}
						setTimeout(go, 1000, cb);
					});
				});
			}
			
			var mainMapName = cga.travel.switchMainMap()

			if(mainMapName == '魔法大学'){
				cga.travel.autopilot('魔法大学内部',()=>{
					go(loop)
				})
			}else{
				cga.travel.falan.toTeleRoom('魔法大学', ()=>{
					cga.travel.autopilot('魔法大学内部',()=>{
						go(loop)
					})
				});
			}
		});
	}
}

var thisobj = {
	// 客户端状态，鉴定初始化traveling，采集初始化gathering
	state : job == '鉴定师' ? 'traveling' : 'gathering',
	// 客户端采集者用
	gatherInfo : {},
	// 客户端采集者用，正在采集的物品名称
	workingItem : null,
	getDangerLevel : ()=>{
		return 0;
	},
	// 客户端使用
	check_done : (cb)=>{
		if(job == '猎人'){
			if (!thisobj.gatherInfo.hasOwnProperty('湿地毒蛇')){
				return false;
			}else{
				if(cga.getItemCount('湿地毒蛇') < thisobj.gatherInfo['湿地毒蛇']){
					thisobj.workingItem = '湿地毒蛇'
					return false
				}
				thisobj.workingItem = null
				return true
			}
		}
		if(job == '樵夫'){
			if(!thisobj.gatherInfo.hasOwnProperty('魔法红萝卜') && !thisobj.gatherInfo.hasOwnProperty('瞿麦') && !thisobj.gatherInfo.hasOwnProperty('百里香')){
				return false;
			}else{
				if(thisobj.workingItem && cga.getItemCount(thisobj.workingItem) >= thisobj.gatherInfo[thisobj.workingItem]){
					thisobj.workingItem = null
					return true
				}
				if(cga.getItemCount('瞿麦') < thisobj.gatherInfo['瞿麦']){
					thisobj.workingItem = '瞿麦'
					return false
				}
				if(cga.getItemCount('百里香') < thisobj.gatherInfo['百里香']){
					thisobj.workingItem = '百里香'
					return false
				}
				if(cga.getItemCount('魔法红萝卜') < thisobj.gatherInfo['魔法红萝卜']){
					thisobj.workingItem = '魔法红萝卜'
					return false
				}
				thisobj.workingItem = null
				return true
			}
		}
		console.warn('【UNA脚本提醒】警告，check_done不应该运行至此，请检查。')
	},
	// 客户端使用
	doneManager : (cb)=>{
		thisobj.state = 'done';

		console.log('材料已凑齐，去交付..')
		
		var repeat = ()=>{

			if(!thisobj.check_done()){
				thisobj.state = 'gathering';
				socket.emit('gathering');
				cb(true);
				return;
			}

			if(thisobj.state == 'done'){
				var count = {};
				var stuffs = 
				{
					itemFilter : (item)=>{
						if(!isDarkBlueMaterials(item.name))
							return false;
						
						if(typeof count[item.name] == 'undefined')
							count[item.name] = 0;
						
						if(count[item.name] >= thisobj.gatherInfo[item.name])
							return false;
						
						count[item.name] += item.count;
						return true;
					}
				}

				var filteredStuffs = cga.getInventoryItems().filter(stuffs.itemFilter);

				socket.emit('done', { count : count });
			}
			
			setTimeout(repeat, 1500);
		}
		var mainMapName = cga.travel.switchMainMap()
		if(mainMapName == '魔法大学')
		{
			cga.travel.autopilot('魔法大学内部',() => {
				cga.walkList([
					workerPos,
					], ()=>{
						cga.turnDir(workerTurnDir);
						setTimeout(repeat, 1000);
					});
			})

		}
		else
		{
			cga.travel.falan.toTeleRoom('魔法大学', ()=>{
				cga.travel.autopilot('魔法大学内部',() => {
					cga.walkList([
						workerPos,
						], ()=>{
							cga.turnDir(workerTurnDir);
							setTimeout(repeat, 1000);
						});
				})
			});
		}
	},
	// 客户端用
	extra_dropping : (item)=>{
		return (item.name == '腐烂的树枝');
	},
	// 客户端用
	workwork : (err, result)=>{
		check_drop();
			
		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')){
			loop();
			return;
		}

		if(thisobj.check_done(result)){
			loop();
			return;
		}
		
		if(playerInfo.health > 0){
			healObject.func(thisobj.workwork);
			return;
		}

		var pets = cga.GetPetsInfo();
		for(var i = 0;i < pets.length; ++i){
			if(pets[i].health > 0)
				healPetObject.func(workwork,i);
		}
		
		cga.StartWork(thisobj.skill.index, 0);
		// cga.AsyncWaitWorkingResult使用方式见开发文档
		cga.AsyncWaitWorkingResult((err, result)=>{
			thisobj.workwork(err, result);
		}, 10000);
	
	},
	translate : (pair)=>{

		if(job == '药剂师' && pair.field == 'listenPort'){
			pair.field = '监听端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		// 鉴定师以及猎人、伐木的端口号
		if(job == '鉴定师' || job == '猎人' || job == '樵夫' && pair.field == 'serverPort'){
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if(healObject.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{
		
		if(job == '药剂师'){
			configTable.listenPort = obj.listenPort;
			thisobj.listenPort = obj.listenPort
			
			if(!thisobj.listenPort){
				console.error('读取配置：监听端口失败！');
				return false;
			}
		}else if(job == '鉴定师' || job == '猎人' || job == '樵夫'){// 鉴定师以及猎人、伐木的端口号
			configTable.serverPort = obj.serverPort;
			thisobj.serverPort = obj.serverPort;
			
			if(!thisobj.serverPort){
				console.error('读取配置：服务端口失败！');
				return false;
			}
		}
		
		if(!healObject.loadconfig(obj))
			return false;
		
		return true;
	},
	inputcb : (cb)=>{

		var stage3 = (cb2)=>{
			if(job == '小号'){
				console.log('蹭车小号不需要输入信息')
				return
			}
			var sayString = '【魔法大学】请选择多号协同工作的端口: 1000~65535。药剂师会作为监听端口，其余职业则作为服务端口。晋级小号则不需要。';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 1000 && val <= 65535){
					var sayString2 = null
					if(job == '药剂师'){
						configTable.listenPort = val;
						thisobj.listenPort = val;
						
						sayString2 = '当前已选择:监听端口='+thisobj.listenPort+'。';
					}else{
						configTable.serverPort = val;
						thisobj.serverPort = val;
						
						sayString2 = '当前已选择:服务端口[' + thisobj.serverPort + ']。';
					}
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		
		Async.series([stage3, healObject.inputcb], cb);
	},
	execute : ()=>{
		// 药剂师为服务端
		if (job == '药剂师'){
			io.listen(thisobj.listenPort);
		}else{// 其余职业为客户端
			socket = require('socket.io-client')('http://localhost:'+thisobj.serverPort, { reconnection: true });

			socket.on('connect', ()=>{
				console.log('连接到深蓝节点');
				socket.emit('register', {
					state : thisobj.state,
					player_name : cga.GetPlayerInfo().name,
					job_name : job,
				});
			});
			
			socket.on('init', (data)=>{
				thisobj.craft_player = data.craft_player;
				thisobj.craft_materials = data.craft_materials;
				if(job == '猎人' || '樵夫'){
					data.craft_materials.forEach((m)=>{
						if( m.name == '湿地毒蛇' && job == '猎人')
							thisobj.gatherInfo[m.name] = m.count * MATERIALS_MULTIPLE_TIMES;
						if( m.name == '魔法红萝卜' && job == '樵夫')
							thisobj.gatherInfo[m.name] = m.count * MATERIALS_MULTIPLE_TIMES;
						if( m.name == '瞿麦' && job == '樵夫')
							thisobj.gatherInfo[m.name] = m.count * MATERIALS_MULTIPLE_TIMES;
						if( m.name == '百里香' && job == '樵夫')
							thisobj.gatherInfo[m.name] = m.count * MATERIALS_MULTIPLE_TIMES;
					});
				}
			});

			// 采集员的交易socket逻辑
			if(job == '猎人' || '樵夫'){
				socket.on('trade', ()=>{

					thisobj.state = 'trading';
					
					var count = {};
					var stuffs = 
					{
						itemFilter : (item)=>{
							if(!isDarkBlueMaterials(item.name))
								return false;
					
							if(typeof count[item.name] == 'undefined')
								count[item.name] = 0;
							
							if(count[item.name] >= thisobj.gatherInfo[item.name])
								return false;
							
							count[item.name] += item.count;
							return true;
						}
					}
		
					cga.waitTrade(stuffs, null, (result)=>{
						if(result && result.success == true)
							cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
						
						thisobj.state = 'done';
					});
				})
		
				socket.on('endtrade', ()=>{
					if(thisobj.state == 'trading'){
						thisobj.state = 'done';
						//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
					}
				});
			}

			if(job == '鉴定师'){
				socket.on('exchange', ()=>{
					thisobj.state = 'exchange';
					console.log('进入交易阶段');
				})

				socket.on('addteam', ()=>{
					if(thisobj.state == 'ready_addteam'){
						console.log('进入组队阶段');
						thisobj.state = 'addteam';
						addTeam(loop);
					}
				});
			}
	
			socket.on('disconnect', ()=>{
				console.log('退出深蓝节点');
			});
					
		}
		callSubPlugins('init');
		loop();
	},
};

module.exports = thisobj;