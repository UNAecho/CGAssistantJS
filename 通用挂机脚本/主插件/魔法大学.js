var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
// 治疗受伤
var healObject = require(rootdir + '/通用挂机脚本/公共模块/治疗自己');
var healPetObject = require(rootdir + '/通用挂机脚本/公共模块/治疗宠物');
// 私人治疗和招魂
var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
// 为了保留config的落盘信息
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
// 回补模块
var supplyMode = require(rootdir + '/通用挂机脚本/公共模块/通用登出回补');
var supplySelena = require(rootdir + '/通用挂机脚本/公共模块/莎莲娜回补');
// 跳转模块
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

var job = cga.job.getJob().job
var jobLv = getprofessionalInfos.getJobLevel(cga.GetPlayerInfo().job)

// 小号申请蹭车暗号
var cipher = '水龙衣'
// 客户端回应暗号
var cipherAnswer = '咒术'
// 小号识别带队者标识符 TODO改为更为灵活的自动识别方式，例如检测人物昵称（cga.ChangeNickName()可以修改人物昵称，可自定义一个暗号让小号识别）
var namefilters = ['UNA','砂の']

// 没有3转的号会被认定为需要蹭车晋级的小号
if (jobLv < 3){
	job= '小号'
}

// 服务端变量
var craft_count = 0;
var craft_target = null;
// 3是因为一次药剂和鉴定的配合只能在NPC那里获得3个未鉴定药剂，所以一次打3份（1组）材料就行。
const MATERIALS_MULTIPLE_TIMES = 3;

// 魔法大学和里堡的交易地点信息，用于交易对接。
var universityPosObj = {
	mainmap : '魔法大学',
	mapindex : 4410,
	pos : job == '药剂师' ? [35, 45] : [34, 45],
	dir : job == '药剂师' ? 4 : 0
}
var castlePosObj = {
	mainmap : '法兰城',
	mapindex : 1500,
	pos : job == '药剂师' ? [34, 87] : [33, 87],
	dir : job == '药剂师' ? 4 : 0
}

// 鉴定师waiting时所在坐标以及朝向
var waitingPos = [33, 86]
var waitingTurnDir = 2

// 小号动适配鉴定师的坐标以及朝向
var memberPos = cga.getStaticOrientationPosition(waitingPos, waitingTurnDir, 1)
var memberTurnDir = cga.tradeDir(waitingTurnDir)

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
			if(data.job_name == '鉴定士'){
				thisobj.isFull = data.is_full
				console.log('鉴定师通知:thisobj.isFull : ' + thisobj.isFull)
			}
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
		// 服务端接收客户端通知，银行是否已满
		socket.on('is_full', (data) => {
			thisobj.isFull = data.isFull
			console.log('收到客户端更新的银行状态：【' + (thisobj.isFull ? '满':'未满') +'】')
		});

		// 服务端回答客户端所询问的交易地点
		socket.on('trade_centre', () => {
			socket.emit('cur_centre',{centre : thisobj.centre})
		});
		
		socket.on('waiting', () => {
			console.log('waiting');
			socket.cga_data.state = 'waiting'; 
		});
		// 药剂师得知鉴定师收到了药剂ready提醒
		socket.on('received', () => {
			console.log('received');
			thisobj.received = true
		});

		socket.on('traveling', () => {
			console.log('traveling');
			socket.cga_data.state = 'traveling'; 
		});

		socket.on('exam', (data) => {
			console.log('出发去魔法大学，本次【' + (Object.keys(data.promote).length ? '有' : '无') +'】小号晋级');
			thisobj.promote = data.promote
			// 需要等待人物静止站好位置再调用去魔法大学的逻辑，不然容易walklist运行冲突
			var waitWalk = (cb) => {
				var XY = cga.GetMapXY();
				var index = cga.GetMapIndex().index3
				if(index == thisobj.centre.mapindex && XY.x == thisobj.centre.pos[0] && XY.y == thisobj.centre.pos[1]){
					// 这里本来是在loop中的逻辑，现在改为收到socket信号才去魔法大学
					goExam(()=>{
						waitAssess(loop);
					})
					return
				}
				console.log('未满足出发条件')
				setTimeout(waitWalk, 2000, cb);
				return
			}
			waitWalk()
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
		// 声望不够，不记录状态，并结束脚本，回到烧技能循环。
		if(dlg.message.indexOf('没有满足') != -1){
			console.log('【' + configTable.mainPlugin + '】完成')
			jump()
			return
		}
		// 获取进阶资格，记录进度并结束脚本，回到烧技能循环。
		if(dlg.message.indexOf('已经得到了') != -1){
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
	// 关闭队聊
	cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
	var mainPluginName = null
	var category = cga.job.getJob().category
	// 不写else，方便debug没有涉及到的分类错误
	if(category == '制造系'){
		mainPluginName = '双百制造'
	}else if(category == '采集系'){
		mainPluginName = '采集冲技能'
	}
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : mainPluginName})
	},5000)
}
// 通用，前往魔法大学考官面前
var goExam = (cb)=>{
	var pos = job == '药剂师' ? [40, 20] : [40, 21]
	// var pos = job == '药剂师' ? [31, 89] : [31, 90]
	cga.travel.toVillage('魔法大学',()=>{
		cga.travel.autopilot('魔法大学内部',()=>{
			cga.walkList([
				pos,
			], cb);
		})	
	})

	// cga.walkList([
	// 	pos,
	// ], cb);
	return
}

// 根据仓库是否已满，灵活适配集散地
var goToCentre = (cb) => {
	var mainMapName = cga.travel.switchMainMap()
	var go = (cb)=>{
		cga.walkList([
			thisobj.centre.pos,
		], cb);
		return
	}

	if(mainMapName == thisobj.centre.mainmap){
		cga.travel.autopilot(thisobj.centre.mapindex,()=>{
			go(cb)
		})
	}else{
		if(thisobj.centre.mapindex == 4410){
			cga.travel.falan.toTeleRoom('魔法大学', ()=>{
				cga.travel.autopilot(thisobj.centre.mapindex,()=>{
					go(cb)
				})
			});
		}else if(thisobj.centre.mapindex == 1500){
			cga.travel.falan.toStone('C', (r)=>{
				go(cb)
			});
		}else{
			throw new Error('未知的集散地，请检查。目前只能是魔法大学或里谢里雅堡')
		}
	}
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
			// 需要计算采集者所站立的坐标，如果不匹配则不发起交易
			var targetPos = cga.getStaticOrientationPosition(thisobj.centre.pos, thisobj.centre.dir, 1)
			if(unit == null || unit.xpos != targetPos[0] || unit.ypos != targetPos[1]){
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
		thisobj.centre.pos
	], ()=>{
		cga.turnDir(thisobj.centre.dir)
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
				if(Object.keys(thisobj.promote).length){
					promote(cb)
				}else{
					cb(null)
				}
			}
			else{
				exchangeItem2(name, cb);
			}
		});
	} else {
		console.log(new Error('未找到鉴定师，可能已掉线。或已成功带小号进入合格房间，重新开始循环'));
		if(Object.keys(thisobj.promote).length){
			promote(()=>{
				cb(new Error('未找到鉴定师，可能已掉线。或已成功带小号进入合格房间，重新开始循环'));
			})
		}else{
			cb(new Error('未找到鉴定师，可能已掉线。或已成功带小号进入合格房间，重新开始循环'));
		}
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
	// 会刷屏，注掉
	// console.log('等待鉴定师');

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
		
		console.log('等待鉴定师' + (Object.keys(thisobj.promote).length > 0 ? '与小号' : '') + '...');

		// if(find_player.cga_data.state == 'appraiser_joined'){
		// 	console.log('鉴定师已加入，将其状态变更为exchange')
		// 	find_player.cga_data.state = 'exchange';
		// 	find_player.emit('exchange');
		// 	// 允许其他人加入队伍，因为小号要加入蹭车
		// 	// cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
		// 	getInRoom(find_player.cga_data.player_name, cb);
		// 	return;
		// }

		find_player.cga_data.state = 'addteam';
		find_player.emit('addteam');
		/**
		 * 自定义一个队伍等待，逻辑如下
		 * 等待鉴定师加入，并且兼顾蹭车小号的人数
		 * Object.keys(thisobj.promote).length 是晋级小号人数，后面+2是因为药剂师、鉴定师固定2人。
		 * 小号最多只能3个人同时蹭车。
		 */
		var wait = (cb, find_player)=>{
			if(cga.getTeamPlayers().length >= Object.keys(thisobj.promote).length + 2 && find_player.cga_data.state == 'appraiser_joined'){
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
// 注意这里计算的方式是所有道具都算1，而药剂每个count算1
// 因为药剂师在和鉴定师在教室里交换NPC的未鉴定药剂时，未鉴定物品不能叠加，会占用更多的格子
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

var checkUnassessed = ()=>{
	var result = false
	// 物品栏里的物品数+拆开叠加的15630药剂数量+未鉴定的18526药剂数量大于15个时
	var inventory = cga.getInventoryItems();
	var count = getExtractedItemCount(inventory);
	if(count >= 15 && inventory.find((inv)=>{
		return inv.itemid == 15630;
	}) != undefined){
		result = true
	}
	return result
}

/**
 * UNAecho:鉴定师等待药剂师或者小号的逻辑
 * 如果鉴定师银行没满，并且接到服务端通知去魔法大学的【瞬间】，如果队伍里没有小号，那么不等待小号加入，直接去魔法大学。
 * 这么做是为了快速满足鉴定师攒满一仓库的深蓝药剂。因为小号可能会掉线、开传送等原因迟到。
 * @param {*} cb 
 * @returns 
 */
var checkTeamAndGo = (cb) => {
	// 临时方案，由于药剂师通知的时候，鉴定师刚好走在回班车点的路上，造成walklist已在运行中
	// TODO 优化等待以及出发的逻辑，因为无论怎么延时，都有可能出现衔接不完美的时候。
	var pos = cga.GetMapXY();
	if(pos.x != waitingPos[0] || pos.y != waitingPos[1]){
		console.log('等待鉴定师走到班车点...')
		setTimeout(checkTeamAndGo, 3000, cb);
		return
	}
	if(thisobj.state != 'deepblue_ready'){
		setTimeout(checkTeamAndGo, 1000, cb);
		return
	}

	// 在班车点站立10秒并且deepblue_ready后开始判断是继续等待还是直接去魔法大学
	setTimeout(() => {
		var teamplayers = cga.getTeamPlayers();
		// 如果银行已满，需要等待小号加入，才通知服务端发车
		if(thisobj.isFull && !teamplayers.length){
			checkTeamAndGo(cb)
			return
		}
		// 如果没有小号，直接发车
		if(!teamplayers.length){
			socket.emit('exam',{promote : thisobj.promote})
			cga.disbandTeam(cb)
		}else{// 有小号则需要作出提醒
			for(var t in teamplayers){
				if(!teamplayers[t].is_me && !thisobj.promote[teamplayers[t].name]){
					console.log('队伍中有小号未登记，继续等待...')
					setTimeout(checkTeamAndGo, 1000, cb);
					return
				}
			}
			socket.emit('exam',{promote : thisobj.promote})
			cga.SayWords(cipherAnswer , 0, 3, 1);
			// 延迟解散队伍，给小号记录自己的称号（服务端玩家名称）留一点时间
			console.log('延迟解散队伍，给小号记录自己的称号（服务端玩家名称）留一点时间')
			setTimeout(cga.disbandTeam, 5000, cb);
		}
		return
	}, 10000);

	
	// setTimeout(() => {



	// // 如果没有小号晋级，直接去魔法大学
	// 	if(!Object.keys(thisobj.promote).length){
	// 		socket.emit('exam',{promote : false, promoteCount : Object.keys(thisobj.promote).length})
	// 		setTimeout(cb, 1000);
	// 		return
	// 	}
	// 	// 以下为有小号晋级逻辑
	// 	var teamplayers = cga.getTeamPlayers();
	// 	// 队伍没人的情况
	// 	if(!teamplayers.length){
	// 		// 如果之前已经决定晋级（如小号超时掉线），但银行未满，则通知药剂师放弃等待小号，直接进入考场进入深蓝药剂流程，提高产出效率。
	// 		if(!thisobj.isFull){
	// 			thisobj.promote = {}
	// 			socket.emit('exam',{promote : false, promoteCount : Object.keys(thisobj.promote).length})
	// 		}else{//如果之前已经决定晋级（如小号超时掉线）而银行深蓝药剂已满，则通知药剂师一直等待小号加入才能参加考试
	// 			socket.emit('exam',{promote : true, promoteCount : Object.keys(thisobj.promote).length})
	// 		}
	// 	}else{// 如果小号已经在队里，则通知药剂师需要带小号通过考试
	// 		socket.emit('exam',{promote : true, promoteCount : Object.keys(thisobj.promote).length})
	// 	}
	// 	// 无论怎样，去魔法大学前都需要单人赶路
	// 	cga.disbandTeam(cb)
	// }, 10000);
	return
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
					if(Object.keys(thisobj.promote).length){
						promote(cb)
					}else{
						cb(null)
					}
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
							if(Object.keys(thisobj.promote).length){
								promote(cb)
							}else{
								cb(null)
							}
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
	cga.waitForLocation({mapindex : 4421}, ()=>{
		console.log('已到达合格房间')
		setTimeout(cb, 1000);
		return
	});
	
	if(job == '鉴定士'){
		cga.TurnTo(6, 7);
		cga.AsyncWaitNPCDialog(dialogHandler);
	}

	// console.log('开始判断是否需要带小号晋级...')
	// var index = cga.GetMapIndex().index3
	// var teamplayers = cga.getTeamPlayers();
	
	// var disbandTeam = (cb)=>{
	// 	var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
	// 	if(isTeamLeader){
	// 		console.log('队长解散队伍')
	// 		cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
	// 	}
	// 	setTimeout(cb, 1000);
	// }

	// // 如果在第一考场中，队伍人数大于2人，那么一定有除了药剂师和鉴定师之外的小号需要蹭车晋级
	// if(teamplayers.length > 2){
	// 	if(index == 4415){
	// 		cga.waitForLocation({mapindex : 4421}, ()=>{
	// 			console.log('已到达合格房间')
	// 			setTimeout(disbandTeam, 1000, cb);
	// 		});
	// 	}else if(index == 4421){
	// 		setTimeout(disbandTeam, 1000, cb);
	// 	}

	// 	if(job == '鉴定士'){
	// 		cga.TurnTo(6, 7);
	// 		cga.AsyncWaitNPCDialog(dialogHandler);
	// 	}
	// 	return;
	// }else{
	// 	console.log('没有晋级需求。')
	// 	setTimeout(disbandTeam, 1000, cb);
	// }
}

// 仅客户端使用
var checkBank = (cb) => {
	if(thisobj.isFull === null){
		cga.travel.toBank(()=>{
			var bankitem = cga.GetBankItemsInfo()
			console.log('银行物品:【' + bankitem.length + '】个')
			if(bankitem.length >= 20){
				thisobj.isFull = true
			}else{
				thisobj.isFull = false
			}
			socket.emit('is_full', {isFull : thisobj.isFull})
			setTimeout(cb, 1500);
		})
	}else{
		socket.emit('is_full', {isFull : thisobj.isFull})
		setTimeout(cb, 1500);
	}
	return
}

var loop = ()=>{
	// loop里的药剂师逻辑
	if(job == '药剂师'){
		callSubPluginsAsync('prepare', ()=>{
			// 由于涉及到去魔法大学还是里谢里雅堡等待交易的问题，在鉴定师没确认库存之前，药剂师先休眠，节约传送费用。
			if(thisobj.isFull === null){
				console.log('等待鉴定师检查银行深蓝药剂库存...')
				setTimeout(loop, 2000);
				return
			}else if(thisobj.isFull === true){
				thisobj.centre = castlePosObj
			}else if(thisobj.isFull === false){
				thisobj.centre = universityPosObj
			}
		
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
			var XY = cga.GetMapXY();
			// 如果成功进入晋级房间，则重置所有晋级小号信息
			if(mapindex == 4421 && cga.getTeamPlayers().length){
				thisobj.promote = {}
				cga.disbandTeam(loop)
				return
			}
	
			var playerInfo = cga.GetPlayerInfo();
			if(playerInfo.mp < craft_target.cost) {
				if(mapindex == 4410){
					cga.walkList([
						[35, 48]
					], ()=>{
							cga.turnDir(6)
						}
					);
				}else if(mapindex == 1500){
					cga.walkList([
						[34, 89]
					], ()=>{
							cga.turnDir(7)
						}
					);
				}else{
					throw new Error('补蓝逻辑只有魔法大学和里谢里雅堡，请检查')
				}
				setTimeout(loop, 3000);
				return;
			}
			
			if(playerInfo.health > 0) {
				healObject.func(loop);
				return;
			}
			// 检查完人物状态，才能继续下一步
			if(mapindex != thisobj.centre.mapindex) {
				goToCentre(loop)
				return
			}
			if(XY.x != thisobj.centre.pos[0] || XY.y != thisobj.centre.pos[1]){
				goToCentre(loop)
				return
			}

			if(checkUnassessed()){
				if(!thisobj.received){
					io.sockets.emit('deepblue_ready')
					console.log('鉴定师没收到ready信息...')
					setTimeout(loop, 1000);
				}
				return
			}
			// 如果开始做药剂，则重置鉴定师是否已经收到deepblue_ready的状态
			thisobj.received = false
	
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
	}else if(job == '鉴定士'){
		// 极端情况下，药剂师通过socket.emit通知鉴定师状态更改为deepblue_ready，刚好鉴定师loop运行，就会将deepblue_ready覆盖掉，这里做一下处理
		if(thisobj.state != 'deepblue_ready'){
			console.log('loop开始，thisobj != deepblue_ready，将其置为waiting')
			thisobj.state = 'waiting';
			socket.emit('waiting');
		}

		// 执行loop时，首先清空晋级小号信息
		console.log('清空晋级小号信息...')
		console.log('isFull : ' + thisobj.isFull)
		// 关闭队聊
		cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
		thisobj.promote = {}
		
		// 身上的鉴定药剂存银行，主要因为身上不能有鉴定好的深蓝药剂，因为要和NPC交换未鉴定的药剂。
		var inventory = cga.getInventoryItems();
		var found_assessed = inventory.find((inv)=>{
			return (inv.assessed == true && inv.itemid == 18526);
		});
		if(found_assessed != undefined){
			// 为了保持银行满负荷，丢弃不成一组的深蓝药剂。TODO这个方法是异步方法，不是很稳定，容易一边丢东西一边高频执行loop。
			check_drop();

			// 银行没满
			if(!thisobj.isFull){
				cga.travel.falan.toBank(()=>{
					cga.walkList([
					[11, 8],
					], ()=>{
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.saveToBankAll((item)=>{// 3个一组放入银行，多余丢弃
								return item.itemid == 18526 && item.count == 3 && item.assessed == true;
							}, 3, (err)=>{
								if(err && err.message.indexOf('没有空位') != -1){
									thisobj.isFull = true
									socket.emit('is_full', {isFull : true})
								}
								setTimeout(loop, 1000);
							});
						});
					});
				});
			}else{// 银行满了
				console.log('银行已满，多余的深蓝药剂：满足3个一组的卖店，不满则丢弃')
				// 由于身上不能有鉴定好的深蓝药剂，否则无法在NPC处交换多个药？，所以在银行已满的情况下只能卖店或丢弃。
				// TODO这个方法是异步方法，不是很稳定，容易一边丢东西一边高频执行loop。
				check_drop();

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
					setTimeout(loop, 1000);
					return
				}
			}
			return;
		}

		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.hp < playerInfo.maxhp || playerInfo.mp < playerInfo.maxmp) {
			if(cga.travel.switchMainMap() == '魔法大学'){
				cga.travel.toHospital(loop)
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
			cga.travel.falan.toStone('C', (r)=>{
				cga.walkList([
					waitingPos,
				], ()=>{
					console.log('等待服务端通知去魔法大学，并开启小号暗号监听')
					// 开启队聊
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
					// 鉴定师监听小号所说的暗号
					cga.waitTeammateSay((player, msg)=>{
						console.log('监听中.....')
						// 如果发现有小号，则开启小号蹭车模式。由于需要登记数量，所以只能一直开启监听。
						if(player.index > 0 && player.index < 5 && msg.indexOf(cipher) != -1){
							thisobj.promote[player.name] = true
							console.log('小号【' + player.name + '】已报名需要晋级')
						}
						// 收到药剂师的信号去魔法大学时，关闭本次监听
						if(thisobj.state == 'traveling'){
							console.log('出发去魔法大学，关闭小号监听')
							return false
						}
						return true;
					});

					// 进入等待药剂师以及检查队伍逻辑，通过后再继续下一步
					checkTeamAndGo(()=>{
						// 如果满足检查条件，则发送状态，并出发
						thisobj.state = 'traveling'
						socket.emit('traveling');
						goExam(()=>{
							thisobj.state = 'ready_addteam';
							socket.emit('ready_addteam');
						})
					})
				});
			});
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
			else if(supplyMode.func)
				supplyMode.func(loop);
			return;
		}

		// 改为询问服务端交易地点在哪，并将donemanager移至socket中调用
		if(thisobj.check_done()){
			socket.emit('trade_centre')
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
		var index = cga.GetMapIndex().index3;
		var teamplayers = cga.getTeamPlayers();

		var retry = (cb)=>{
			teamplayers = cga.getTeamPlayers();
			var finder = cga.findPlayerUnit((u)=>{
				// 检测班车角色是否是目标，方法暂时使用名称fliter+坐标
				for (var filter in namefilters){
					if(u.unit_name.indexOf(namefilters[filter]) == 0 && u.xpos == waitingPos[0] && u.ypos == waitingPos[1]){
						console.log('发现班车:'+ u.unit_name)
						return true;
					}
				}
				return false
			});
			if(finder && !teamplayers.length){
				var target = cga.getRandomSpace(finder.xpos,finder.ypos);
				cga.walkList([
					target
				], ()=>{
					cga.addTeammate(finder.unit_name, (r)=>{
						// 开启队聊，防止干扰其他玩家
						cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
						// 监听队长暗号
						cga.waitTeammateSay((player, msg)=>{
							console.log('调用cga.waitTeammateSay监听...')
							// 如果收到暗号，等待解散队伍并执行下一步，同时关闭监听
							if(player.index == 0 && msg.indexOf(cipherAnswer) != -1){
								// 通过回答暗号的人的昵称，来得知去魔法大学谁是队长。因为小号不参与socket
								thisobj.leaderName = player.nick
								// 记录完队长名称再重新进入循环
								setTimeout(loop, 1000);
								console.log('关闭监听...')
								return false
							}
							return true;
						});
						// 随机延迟发话，防止多个小号同时说话造成统计疏漏
						var randomtime = Math.ceil(Math.random()*3000) + Math.ceil(Math.random()*1000)
						setTimeout(()=>{
							cga.SayWords(cipher, 0, 3, 1);
						}, randomtime);
						return
					})
				});
			} else {
				setTimeout(retry, 1500,cb);
			}
		}

		if(teamplayers.length){
			if(index == 4421){
				console.log('成功抵达合格房间，等待解散')
			}
			cga.disbandTeam(loop)
			return
		}else{
			/**
			 * 走到10,10处和11,10的NPC对话，对话一次即可，无需第二次对话
			 * 第1次对话：
			 * {
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 7858,
				message: '\n\n恭喜你通过测验。你已经得到了入仕王宫的资格。但是未来还是要多努力一点喔！\n学习是永无止境的，共勉之。'
				}
			* 第2次对话：
				{
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 7858,
				message: '\n\n你已经得到了必要的资格。\n回到担任你职业的公会会长那边升阶吧！'
				}
			* 声望不够：
				{
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 8179,
				message: '\n\n嗯？你好像没有满足升阶的条件。'
				}
			*/
			console.log('小号loop...')
			console.log('thisobj.leaderName : ' + thisobj.leaderName)

			var waitAddTeam = ()=>{
				cga.addTeammate(thisobj.leaderName, (r)=>{
					// 必须加入队伍，才能继续逻辑
					if(r){
						thisobj.leaderName = null
						cga.disbandTeam(loop)
						return;
					}
					setTimeout(waitAddTeam, 1000);
				});
			}

			if(index == 4421){
				cga.walkList([
					[10, 10],
				], ()=>{
					cga.TurnTo(11, 10);
					cga.AsyncWaitNPCDialog(dialogHandler);
				});
				return
			}
			if(index == 1500 && thisobj.leaderName){
				goExam(waitAddTeam)
				return
			}
			callSubPluginsAsync('prepare', ()=>{
				// 治疗和招魂完毕再进行下一步逻辑
				healMode.func(()=>{
					cga.travel.falan.toStone('C', (r)=>{
						cga.walkList([
							memberPos
						], ()=>{
							retry(loop)
						});
					});
				})
			})
		}
	}
}

var thisobj = {
	// 晋级小号信息
	promote : {},
	// 客户端仓库是否已存满3转物品（深蓝药剂或其他3转物品），默认值为null，不要使用false
	isFull : null,
	// 客户端状态，鉴定初始化waiting，采集初始化gathering
	state : job == '鉴定士' ? 'waiting' : 'gathering',
	// 客户端采集者用
	gatherInfo : {},
	// 客户端采集者用，正在采集的物品名称
	workingItem : null,
	// 集散地信息，方便灵活切换。默认在魔法大学内部
	centre : null,
	// 小号专用，用来保存魔法大学带队者名称，因为小号不参与socket
	leaderName : null,
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
		console.warn('【UNAecho脚本提醒】警告，check_done不应该运行至此，请检查。')
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
		if(mainMapName == thisobj.centre.mainmap)
		{
			cga.travel.autopilot(thisobj.centre.mapindex,() => {
				cga.walkList([
					thisobj.centre.pos,
					], ()=>{
						cga.turnDir(thisobj.centre.dir);
						setTimeout(repeat, 1000);
					});
			})

		}else{
			if(thisobj.centre.mainmap == '魔法大学'){
				cga.travel.falan.toTeleRoom('魔法大学', ()=>{
					thisobj.doneManager(cb)
				});
			}else if(thisobj.centre.mainmap == '法兰城'){
				cga.travel.falan.toStone('C', (r)=>{
					thisobj.doneManager(cb)
				});
			}else{
				throw new Error('异常集散点，请检查')
			}

		}
	},
	// 客户端用
	extra_dropping : (item)=>{
		if(item.name == '腐烂的树枝'){
			return true
		}else if(item.itemid == 18526 && item.count < 3){// 鉴定师逻辑，在银行已满的情况下，丢弃背包中不成一组的深蓝药剂。
			return true
		}
		return false;
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
		if(job == '鉴定士' || job == '猎人' || job == '樵夫' && pair.field == 'serverPort'){
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
		}else if(job == '鉴定士' || job == '猎人' || job == '樵夫'){// 鉴定师以及猎人、伐木的端口号
			configTable.serverPort = obj.serverPort;
			thisobj.serverPort = obj.serverPort;
			
			if(!thisobj.serverPort){
				console.error('读取配置：服务端口失败！');
				return false;
			}
		}else{
			// 读取失败也不影响本脚本逻辑，但要调用，因为后续要落盘，不能丢了key。
			// 保留战斗config落盘信息
			supplyMode.loadconfig(obj)
			
			teamMode.loadconfig(obj)

			configMode.loadconfig(obj)
			
			configTable.sellStore = obj.sellStore;
			thisobj.sellStore = obj.sellStore
			// 保留生产config落盘信息
			if(obj.craftType)
				configTable.craftType = obj.craftType;
			if(obj.forgetSkillAt)
				configTable.forgetSkillAt = obj.forgetSkillAt;
			if(obj.listenPort)
				configTable.listenPort = obj.listenPort;
			// 保留采集config落盘信息
			if(obj.mineObject)
				configTable.mineObject = obj.mineObject;
			if(obj.gatherObject)
				configTable.gatherObject = obj.gatherObject;
			if(obj.target)
				configTable.target = obj.target;
			if(obj.mineType)
				configTable.mineType = obj.mineType;
			if(obj.logoutTimes)
				configTable.logoutTimes = obj.logoutTimes;
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
		// 通用，都需要先初始化
		callSubPlugins('init');

		// 服务端逻辑，暂时只支持药剂师一种职业。
		if (job == '药剂师'){
			io.listen(thisobj.listenPort);
			loop()
		}else{// 其余职业为客户端
			socket = require('socket.io-client')('http://localhost:'+thisobj.serverPort, { reconnection: true });

			socket.on('connect', ()=>{
				console.log('连接到深蓝节点');
				socket.emit('register', {
					state : thisobj.state,
					player_name : cga.GetPlayerInfo().name,
					job_name : job,
					is_full : thisobj.isFull
				});
			});
			
			socket.on('init', (data)=>{
				thisobj.craft_player = data.craft_player;
				thisobj.craft_materials = data.craft_materials;
				if(job == '猎人' || job == '樵夫'){
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
				// 用修改昵称的方式来告知晋级小号，魔法大学队长是谁。
				// 因为小号可能为多台机器运行，不参加服务端的socket，无法传递信息。
				else if(job == '鉴定士'){
					cga.ChangeNickName(thisobj.craft_player)
				}
			});

			// 采集员的交易socket逻辑
			if(job == '猎人' || job == '樵夫'){
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

				// 小号接收到交易地点后，调用doneManager
				socket.on('cur_centre', (data)=>{
					thisobj.centre = data.centre
					thisobj.centre.pos = cga.getStaticOrientationPosition(thisobj.centre.pos, thisobj.centre.dir, 1)
					thisobj.centre.dir = cga.tradeDir(thisobj.centre.dir)
					thisobj.doneManager(loop)
				});
				// 首次调用loop
				loop()
			}

			if(job == '鉴定士'){
				// 服务端通知客户端已备好药剂
				socket.on('deepblue_ready', () => {
					console.log('deepblue_ready');
					thisobj.state = 'deepblue_ready'
					socket.emit('received');
				});

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
				// 鉴定师最初需要先检查银行，再进行loop
				checkBank(loop)
			}
			if(job == '小号'){
				// 开启队聊
				cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
				// 首次调用loop
				loop()
			}
	
			socket.on('disconnect', ()=>{
				console.log('退出深蓝节点');
			});
					
		}
		configMode.manualLoad('生产赶路')
		// loop改为不在execute()中执行，因为鉴定师一开始需要去检查银行
	},
};

module.exports = thisobj;