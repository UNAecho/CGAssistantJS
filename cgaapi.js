var cga = require('bindings')('node_cga');	
var moment = require('moment');
var PF = require('pathfinding');
var request = require('request');
var fs = require('fs');

global.is_array_contain = function(arr, val)
{
    for (var i = 0; i < arr.length; i++)
    {
		if (arr[i] == val)
		{
			return true;
		}
    }
	
	return false;
}

module.exports = function(callback){
	var port = null;

	if(process.argv.length >= 3 && parseInt(process.argv[2]) > 0)
		port = parseInt(process.argv[2]);
	else if(process.env.CGA_GAME_PORT && parseInt(process.env.CGA_GAME_PORT) > 0)
		port = parseInt(process.env.CGA_GAME_PORT);

	if(typeof port != 'number')
		throw new Error('获取游戏本地服务端口失败!');

	cga.AsyncConnect(port, function(err){
		if(err){
			throw new Error('无法连接到本地服务端口，可能未附加到游戏或者游戏已经闪退！');
		}
		
		callback();
	});
	
	cga.TRADE_STUFFS_ITEM = 1;
	cga.TRADE_STUFFS_PET = 2;
	cga.TRADE_STUFFS_PETSKILL = 3;
	cga.TRADE_STUFFS_GOLD = 4;

	cga.TRADE_STUFFS_TRANSLATION = {
		1 : '物品',
		2 : '宠物',
		3 : '宠物技能',
		4 : '金币',
	};

	cga.REQUEST_TYPE_PK = 1;
	cga.REQUEST_TYPE_JOINTEAM = 3;
	cga.REQUEST_TYPE_EXCAHNGECARD = 4;
	cga.REQUEST_TYPE_TRADE = 5;
	cga.REQUEST_TYPE_KICKTEAM = 11;
	cga.REQUEST_TYPE_LEAVETEAM = 12;
	cga.REQUEST_TYPE_TRADE_CONFIRM = 13;
	cga.REQUEST_TYPE_TRADE_REFUSE = 14;
	cga.REQUEST_TYPE_REBIRTH_ON = 16;
	cga.REQUEST_TYPE_REBIRTH_OFF = 17;
	
	cga.ENABLE_FLAG_PK = 0;
	cga.ENABLE_FLAG_TEAMCHAT = 1;
	cga.ENABLE_FLAG_JOINTEAM = 2;
	cga.ENABLE_FLAG_CARD = 3;
	cga.ENABLE_FLAG_TRADE = 4;
	cga.ENABLE_FLAG_FAMILY = 5;
	cga.ENABLE_FLAG_AVATAR_PUBLIC = 100;
	cga.ENABLE_FLAG_BATTLE_POSITION = 101;
	
	cga.TRADE_STATE_CANCEL = 0;
	cga.TRADE_STATE_READY = 1;
	cga.TRADE_STATE_CONFIRM = 2;
	cga.TRADE_STATE_SUCCEED = 3;

	cga.TRADE_STATE_TRANSLATION = {
		0 : '取消交易',
		1 : '准备交易',
		2 : '确认交易',
		3 : '交易成功',
	};
	
	cga.FL_BATTLE_ACTION_ISPLAYER = 1;
	cga.FL_BATTLE_ACTION_ISDOUBLE = 2;
	cga.FL_BATTLE_ACTION_ISSKILLPERFORMED = 4;
	cga.FL_BATTLE_ACTION_END = 8;
	cga.FL_BATTLE_ACTION_BEGIN = 16;

	cga.FL_SKILL_SELECT_TARGET = 0x1;
	cga.FL_SKILL_SELECT_DEAD = 0x2;
	cga.FL_SKILL_TO_PET = 0x4;
	cga.FL_SKILL_TO_SELF = 0x8;
	cga.FL_SKILL_TO_TEAMMATE = 0x10;
	cga.FL_SKILL_TO_ENEMY = 0x20;
	cga.FL_SKILL_SINGLE = 0x40;
	cga.FL_SKILL_MULTI = 0x80;
	cga.FL_SKILL_ALL = 0x100;
	cga.FL_SKILL_BOOM = 0x200;
	cga.FL_SKILL_FRONT_ONLY = 0x400;
	
	cga.MOVE_GOLD_TOBANK = 1;
	cga.MOVE_GOLD_FROMBANK =  2;
	cga.MOVE_GOLD_DROP = 3
	
	cga.PET_STATE_READY = 1;
	cga.PET_STATE_BATTLE = 2;
	cga.PET_STATE_REST = 3;
	cga.PET_STATE_WALK = 16;
	
	cga.UI_DIALOG_TRADE = 1;
	cga.UI_DIALOG_BATTLE_SKILL = 2;

	//延迟x毫秒
	cga.delay = (millis) => new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, millis);
	});
	
	cga.promisify = (fn, args) => new Promise((resolve, reject) => {
		args.push((err, reason) => {
			console.log(err);
			setTimeout(() => {
				if (err) reject(err);
				else resolve();
			}, 0);
		});
		fn.apply(null, args);
	});
	
	cga.moveThinkFnArray = [];
	
	cga.moveThink = (arg)=>{
		for(var i = 0; i < cga.moveThinkFnArray.length; ++i){
			if(cga.moveThinkFnArray[i](arg) == false){
				return false;
			}
		}
		return true;
	}
	
	cga.isMoveThinking = false;
	
	cga.registerMoveThink = (fn)=>{
		cga.moveThinkFnArray.push(fn);
	}
	
	cga.isTeamLeaderEx = ()=>{
		return (cga.isTeamLeader == true || cga.getTeamPlayers().length <= 1);
	}
	
	cga.getMapInfo = () => {
		const info = cga.GetMapXY();
		info.indexes = cga.GetMapIndex();
		info.name = cga.GetMapName();
		return info;
	};
	
	cga.getOrientation = (x, y) => {
		const p = cga.GetMapXY();
		const xy = Math.max(-1, Math.min(1, x - p.x)).toString() + Math.max(-1, Math.min(1, y - p.y)).toString();
		switch (xy) {
			case '10':
				return 0;
			case '11':
				return 1;
			case '01':
				return 2;
			case '-11':
				return 3;
			case '-10':
				return 4;
			case '-1-1':
				return 5;
			case '0-1':
				return 6;
			case '1-1':
				return 7;
			default:
		}
		return -1;
	}
	
	cga.getOrientationPosition = (orientation, offset)=>{
		const current = cga.GetMapXY();
		switch (orientation) {
			case 0:
				return [current.x + offset, current.y];
			case 1:
				return [current.x + offset, current.y + offset];
			case 2:
				return [current.x, current.y + offset];
			case 3:
				return [current.x - offset, current.y + offset];
			case 4:
				return [current.x - offset, current.y];
			case 5:
				return [current.x - offset, current.y - offset];
			case 6:
				return [current.x, current.y - offset];
			case 7:
				return [current.x + offset, current.y - offset];
			default:
				return new Error('无效参数');
		}
	}
	// UNAecho:添加一个计算静态坐标的API，用于部分自定义场景。
	cga.getStaticOrientationPosition = (staticPos, orientation, offset)=>{
		switch (orientation) {
			case 0:
				return [staticPos[0] + offset, staticPos[1]];
			case 1:
				return [staticPos[0] + offset, staticPos[1] + offset];
			case 2:
				return [staticPos[0], staticPos[1] + offset];
			case 3:
				return [staticPos[0] - offset, staticPos[1] + offset];
			case 4:
				return [staticPos[0] - offset, staticPos[1]];
			case 5:
				return [staticPos[0] - offset, staticPos[1] - offset];
			case 6:
				return [staticPos[0], staticPos[1] - offset];
			case 7:
				return [staticPos[0] + offset, staticPos[1] - offset];
			default:
				return new Error('无效参数');
		}
	}

	cga.turnDir = cga.turnOrientation = (orientation, offset = 2) => {
		var pos = cga.getOrientationPosition(orientation, offset);
		cga.TurnTo(pos[0], pos[1]);
	}

	/**
	 * UNAecho:获取双方交易朝向，如A是朝向1，B则朝向5；如果A朝向7，B则朝向3。主要目的是为了调用cga.turnDir()时方便。
	 * @param {int} dir 
	 */
	cga.tradeDir = (dir) =>{
		if(!(dir >= 0 && dir < 8)){
			throw new Error('错误，dir朝向必须为0 - 7')
		}
		return dir < 4 ? dir + 4 : dir - 4
	}

	/*  异步登出回城
		由于2022年1月18日的一次更新之后登出回城有可能失败，故所有脚本中的登出回城操作均推荐更改为异步操作
		UNAecho : 修改写入逻辑，如果登出后的记录点与个人配置记录中一致，则跳过写入，节约I/O
	*/
	cga.logBack = (cb)=>{
		cga.waitSysMsgTimeout((err, msg)=>{
			if(err){
				console.log('异步登出无反应，可能网络不稳定或者已经掉线！');
				if(cb) cb(null);
				return
			}

			if(msg == '注销回到传送点。')
			{
				//保存登出回城的地点到配置文件
				var config = cga.loadPlayerConfig();

				if(!config)
					config = {};
				// 如果记录点没有变化，则不写入文件
				let settledCity = cga.GetMapName()
				if(config.settledCity == settledCity){
					console.log('记录点【' + config.settledCity + '】没有变化')
					setTimeout(cb, 300);
				}else{
					config.settledCity = settledCity;
					cga.savePlayerConfig(config, cb);
				}
				
				return false;
			}

			var regex = msg.match(/一分钟内'回到城内登入点'最多使用5次，请过(\d+)秒钟后再用！/);
			
			if(regex && regex.length >= 2){

				console.log('一分钟登出次数已达上限！等待 '+parseInt(regex[1])+' 秒后重试...');

				var wait = parseInt(regex[1]) * 1000;
				setTimeout(cga.logBack, wait + 1000, cb);
				return false;
			}

			return true;
		}, 5000);

		cga.LogBack();
	}
	
	//转向(x,y)坐标，默认往前一格避免捡起面前的物品
	cga.turnTo = (x, y)=>{
		cga.turnOrientation(cga.getOrientation(x, y));
	}
	
	//判断是否在战斗状态
	cga.isInBattle = function(){
		return (cga.GetWorldStatus() == 10) ? true : false;
	}
	
	//判断是否在正常状态（非切图非战斗状态）
	cga.isInNormalState = function(){
		return (cga.GetWorldStatus() == 9 && cga.GetGameStatus() == 3) ? true : false;
	}
	
	//将字符串转义为windows下合法的文件名
	cga.FileNameEscape = (str)=>{
		return str.replace(/[\\/:\*\?"<>|]/g, (c)=>{return {"\\":'%5C','/':'%2F',':':'%3A','*':'%2A','?':'%3F','"':'%22','<':'%3C','>':'%3E','|':'%7C'}[c];});
	}

	//FileNameEscape的反向操作，反转义
	cga.FileNameUnescape = (str)=>{
		return str.replace(/%(5C|2F|3A|2A|3F|22|3C|3E|7C)/g, (c)=>{ return {'%5C':'\\','%2F':'/','%3A':':','%2A':'*','%3F':'?','%22':'"','%3C':'<','%3E':'>','%7C':'|'}[c];});
	}

	//获取制造某种物品所需要的材料信息，返回材料信息object或null
	cga.getItemCraftInfo = function(filter){
		var result = null;
		cga.GetSkillsInfo().forEach((sk)=>{
			if(sk.type == 1)
			{
				var craftInfo = cga.GetCraftsInfo(sk.index).find((craft)=>{

					if(typeof filter == 'string')
					{
						if(filter.charAt(0) == '#')
							return craft.itemid == parseInt(filter.substring(1));
						else
							return craft.name == filter;
					}
					else if(typeof filter == 'number')
					{
						return craft.itemid == filter;
					}
					else if(typeof filter == 'function')
					{
						return filter(craft);
					}
					
					return false;
				});
				if(craftInfo != undefined){
					result = {craft : craftInfo, skill : sk};
					return false;
				}
			}
		});		
		return result;
	}

	/*鉴定、装饰物品，参数：
		cga.manipulateItemEx({
			itempos : 操作的物品位置,
			immediate : 是否立即完成（高速鉴定）,
		}, cb回调)
	*/
	cga.manipulateItemEx = function(options, cb){
		var skill = cga.findPlayerSkill(options.skill);
		if(!skill){
			cb(new Error('你没有'+skillname+'的技能'));
			return;
		}
		
		cga.SetImmediateDoneWork(options.immediate ? true : false);
		
		cga.StartWork(skill.index, 0);

		if(!cga.AssessItem(skill.index, options.itempos)){
			cb(new Error('无法操作该物品'));
			return;
		}
		
		var beginTime = (new Date()).getTime();
		
		var handler = (err, results)=>{
			if(results){
				cb(null, results);
				return;
			}
			
			var craftStatus = cga.GetCraftStatus();
			
			var curTime = (new Date()).getTime();
			
			if(err){
				if(craftStatus == 0 || craftStatus == 2){
					cga.manipulateItemEx(options, cb);
					return;
				}
				
				//强制重试
				var isImmediate = cga.GetImmediateDoneWorkState();
				if(isImmediate != 2 && curTime > beginTime + 1000 * 120)
				{
					cga.manipulateItemEx(options, cb);
					return;
				}
				else if(isImmediate == 2 && curTime > beginTime + 1000 * 5)
				{
					cga.manipulateItemEx(options, cb);
					return;
				}
				
				cga.AsyncWaitWorkingResult(handler, 1000);
			}
		}
		
		cga.AsyncWaitWorkingResult(handler, 1000);
		return;
	}
	
	//制造物品，参数：物品名，添加的宝石的名字(或物品位置)
	//该API已经弃用，请用cga.craftItemEx
	cga.craftNamedItem = function(craftItemName, extraItemName){
		throw new Error('该API已经弃用，请用cga.craftItemEx')
	}

	/*制造物品，参数：
		cga.craftItemEx({
			craftitem : 制造的物品名,
			extraitem(可选) : 添加宝石
			immediate : 是否立即完成（高速制造）,
		}, cb回调)
	*/
	cga.craftItemEx = function(options, cb){

		var err = null;

		var info = cga.getItemCraftInfo(options.craftitem);
		if(info === null)
			err = new Error('你没有制造 '+options.craftitem+' 的技能');

		if(err){
			cb(err);
			return;
		}

		var inventory = cga.getInventoryItems();
			var itemArray = [];
	
		info.craft.materials.forEach((mat)=>{
			var findRequired = inventory.find((inv)=>{
				return (inv.itemid == mat.itemid && inv.count >= mat.count);
			});
			if(findRequired != undefined){
				itemArray.push(findRequired.pos);
			} else {
				err = new Error('制造' +options.craftitem+'所需物品' +mat.name+'不足！');
				return false;
			}
		});
		
		if(err){
			cb(err);
			return;
		}

		if(typeof options.extraitem == 'string'){
			var findRequired = inventory.find((inv)=>{
				return (inv.name == options.extraitem);
			});
			if(findRequired != undefined){
				itemArray[5] = findRequired.pos;
			} else {
				err = new Error('制造' +options.extraitem+'所需宝石' +options.extraitem+'不足！');
			}
		}
		
		if(err){
			cb(err);
			return;
		}
		
		for(var i = 0; i < 6; ++i)
		{
			if(typeof itemArray[i] != 'number')
				itemArray[i] = -1;
		}
		
		cga.SetImmediateDoneWork(options.immediate ? true : false);
		
		cga.StartWork(info.skill.index, info.craft.index);
		cga.CraftItem(info.skill.index, info.craft.index, 0, itemArray);
		
		var beginTime = (new Date()).getTime();
		
		var handler = (err, results)=>{
			if(results){
				cb(null, results);
				return;
			}
			
			var craftStatus = cga.GetCraftStatus();
			
			var curTime = (new Date()).getTime();
			
			if(err){
				if(craftStatus == 0 || craftStatus == 2){
					cga.craftItemEx(options, cb);
					return;
				}
				
				//强制重试
				var isImmediate = cga.GetImmediateDoneWorkState();
				if(isImmediate != 2 && curTime > beginTime + 1000 * 120)
				{
					cga.craftItemEx(options, cb);
					return;
				}
				else if(isImmediate == 2 && curTime > beginTime + 1000 * 5)
				{
					cga.craftItemEx(options, cb);
					return;
				}
				
				cga.AsyncWaitWorkingResult(handler, 1000);
			}
		}
		
		cga.AsyncWaitWorkingResult(handler, 1000);
	}
	
	//获取物品栏里的物品，返回数组
	cga.getInventoryItems = function(){
		return cga.GetItemsInfo().filter((item)=>{
			return item.pos >= 8 && item.pos < 100;
		});
	}
	
	//获取装备栏里的物品，返回数组
	cga.getEquipItems = function(){
		return cga.GetItemsInfo().filter((item)=>{
			return item.pos >= 0 && item.pos < 8;
		});
	}

	//获取装备耐久，返回数组[当前耐久,最大耐久]
	cga.getEquipEndurance = (item)=>{

		if(item.attr){
			var regex = item.attr.match(/\$4耐久 (\d+)\/(\d+)/);
			if(regex && regex.length >= 3){
				return [parseInt(regex[1]), parseInt(regex[2])];
			}
		}

		return null;
	}
	

	//获取装备种类，返回String
	cga.getEquipClass = (item)=>{
		if(item.attr){
			var regex = item.attr.match(/\$0种类 (\w+)/);
			console.log(regex)

			if(regex && regex.length >= 3){
				return [parseInt(regex[1]), parseInt(regex[2])];
			}
		}

		return null;
	}

	/**
	 * UNAecho:获取身上所有物品的详细信息(包括装备)
	 * 目前仅加入了耐久度、耐久度最大值以及耐久度百分比的信息，后续陆续加入其它信息
	 * 
	 * 关于耐久百分比，49/100耐久度返回0.49，保留2位小数，四舍五入
	 * 
	 * 返回的数据格式，参照cga.GetItemsInfo()
	 * @returns Array
	 */
	cga.getItemsInfoDetail = ()=>{
		let items = cga.GetItemsInfo()
		items.forEach((item)=>{
			if(item.attr){
				var regex = item.attr.match(/\$4耐久 (\d+)\/(\d+)/);
				if(regex && regex.length >= 3){
					item.durability = parseInt(regex[1])
					item.durabilityMax = parseInt(regex[2])
					item.durabilityPer = parseFloat((item.durability / item.durabilityMax).toFixed(2))
				}
			}
		});
		return items
	}

	cga.travel = {};
/**
 * UNAecho:一个定义自己在哪个领域内的API
 * 目前仅靠index3来判断地区，还不够完善
 * 日后考虑更细致的按闭合区间判断（遍历当前所有可以走的格子，来划定某一个区域。这样可以避免用XY强硬划分，带来错误。）
 * @returns string
 */
	cga.travel.switchMainMap = ()=>{
		var result = null
		var mapindex = cga.GetMapIndex().index3;
		var XY = cga.GetMapXY();

		if(mapindex >= 2300 && mapindex<=2399){
			result = '圣拉鲁卡村'
		}else if(mapindex >= 2000 && mapindex <= 2099 || [33219,33214,40001].indexOf(mapindex) >= 0){
			result = '伊尔村'
		}else if(mapindex >= 2400 && mapindex <= 2499){
			result = '亚留特村'
		}else if(mapindex >= 2100 && mapindex <= 2199){
			result = '维诺亚村'
		}else if(mapindex >= 3200 && mapindex <= 3299){
			result = '奇利村'
		}else if((mapindex >= 3000 && mapindex <= 3099) || [5005,5006].indexOf(mapindex) >= 0){
			result = '加纳村'
		}else if(mapindex >= 4000 && mapindex <= 4099){
			result = '杰诺瓦镇'
		}else if([4201,4230,14018].indexOf(mapindex) >= 0){
			result = '夜晚蒂娜村'
		}else if(mapindex >= 4200 && mapindex <= 4299){
			result = '蒂娜村'
		}else if(mapindex >= 4300 && mapindex <= 4399){
			result = '阿巴尼斯村'
		}else if(mapindex >= 4400 && mapindex <= 4499){
			result = '魔法大学'
		}else if(mapindex >= 27001 && mapindex <= 27999){
			result = '曙光骑士团营地'
		}else if(mapindex >= 1000 && mapindex <= 32830){
			result = '法兰城'
		}else if(mapindex == 33000){
			result = '米内葛尔岛'
		}else if(mapindex >= 33100 && mapindex < 33300){// TODO完善范围
			result = '阿凯鲁法村'
		}else if(mapindex >= 30000 && mapindex < 40000){// TODO完善范围
			result = '苏国'
		}else if(mapindex == 43000){
			result = '库鲁克斯岛'
		}else if(mapindex >= 43100 && mapindex < 43300){// TODO完善范围
			result = '哥拉尔镇'
		}else if(mapindex >= 44690 && mapindex < 44700){//
			result = '圣骑士营地'
		}else if(mapindex >= 40000 && mapindex < 50000){// TODO完善范围
			result = '艾尔巴尼亚王国'
		}else if(mapindex == 300 && XY.x < 379){// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚奇利域'
		}else if(mapindex == 300 && XY.x >= 379){// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚加纳域'
		}
		// 莎莲娜岛西边区域，以【通往阿巴尼斯的地下道为界限】，包括：阿巴尼斯和魔法大学的郊外。
		else if(mapindex == 402){
			result = '莎莲娜魔法大学域'
		}
		// 莎莲娜岛西边区域，以【通往阿巴尼斯的地下道为界限】，包括：杰诺瓦镇、蒂娜村、神兽入口等郊外区域。
		else if(mapindex == 400){
			result = '莎莲娜杰诺瓦域'
		}else if(mapindex == 59520 || (mapindex >= 59530 && mapindex <= 59537)){
			result = '艾尔莎岛'
		}else if((mapindex > 59800 && mapindex < 59900) || (mapindex == 59522 || mapindex == 59552 || mapindex == 59553)){
			result = '利夏岛'
		}else if(mapindex >= 59521 || mapindex < 60000){// TODO完善范围
			result = '艾夏岛'
		}else if(mapindex >= 50000 && mapindex < 60000){// TODO完善范围
			result = '神圣大陆'
		}else{
			console.warn('[UNA脚本警告]:未知地图index，请联系作者更新。')
		}
		// console.log('cga.travel.switchMainMap输入mapindex:【'+mapindex+'】,识别结果为【'+result+'】')
		return result
	}

	// 【UNAecho】:整合切换国家的API，待完善
	cga.travel.goAbroad = (country, cb) => {
		var mainMap = cga.travel.switchMainMap()
		// 去阿凯鲁法
		if(country == '苏国'){
			if(mainMap == '阿凯鲁法村'){
				if (cb) cb(true)
				return
			}else if(mainMap == '哥拉尔镇'){// TODO 哥拉尔到阿凯鲁法

			}
			cga.travel.falan.toAKLF(cb);
			return
		}else if(country == '艾尔巴尼亚王国'){// 去哥拉尔
			if(mainMap == '哥拉尔镇'){
				if (cb) cb(true)
				return
			}else if(mainMap == '阿凯鲁法村'){// TODO 阿凯鲁法到哥拉尔

			}
			cga.travel.falan.toGelaer(cb);
			return
		}else{// 去法兰城/新城
			if(mainMap == '阿凯鲁法村'){
				cga.travel.AKLF.toFalan(cb)
				return
			}else if(mainMap == '哥拉尔镇'){
				cga.travel.gelaer.toFalan(cb)
				return
			}
		}
	}
		
	cga.travel.falan = {};

	cga.travel.falan.isSettled = ()=>{

		var config = cga.loadPlayerConfig();

		if(config)
			return config.settledCity == '法兰城' ? true : false;

		return false;
	}
	
	cga.travel.falan.xy2name = (x, y, mapname)=>{
		if(x == 242 && y == 100 && mapname == '法兰城')
			return 'E1';
		if(x == 141 && y == 148 && mapname == '法兰城')
			return 'S1';
		if(x == 63 && y == 79 && mapname == '法兰城')
			return 'W1';
		if(x == 233 && y == 78 && mapname == '法兰城')
			return 'E2';
		if(x == 162 && y == 130 && mapname == '法兰城')
			return 'S2';
		if(x == 72 && y == 123 && mapname == '法兰城')
			return 'W2';
		if(x == 46 && y == 16 && mapname == '市场三楼 - 修理专区')
			return 'M3';
		if(x == 46 && y == 16 && mapname == '市场一楼 - 宠物交易区')
			return 'M1';
		if(x == 151 && y == 122 && mapname == '法兰城')
			return 'B1';
		if(x == 155 && y == 122 && mapname == '法兰城')
			return 'B2';
		return null;
	}
	
	cga.travel.falan.isvalid = function(stone){
		switch(stone.toUpperCase()){
			case 'E': return true;
			case 'S': return true;
			case 'W': return true;
			case 'E1': return true;
			case 'S1': return true;
			case 'W1': return true;
			case 'E2': return true;
			case 'S2': return true;
			case 'W2': return true;
			case 'M1': return true;//市场
			case 'M3': return true;
			case 'B1': return true;//桥头
			case 'B2': return true;
			case 'C': return true;//里谢里雅堡
		}
		return false;
	}

	cga.travel.falan.toStoneInternal = function(stone, cb){
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		const desiredMap = ['法兰城','里谢里雅堡','艾尔莎岛','市场一楼 - 宠物交易区','市场三楼 - 修理专区','召唤之间'];
		// UNAecho:如果有不能登出的道具，则考虑在法兰城内步行。
		const itemNotLogBack = ['好像很好吃的起司','好像很好喝的酒',];
		var notLogBack = false

		if(curMap == '法兰城'){
			if(stone == 'C'){
				cga.travel.falan.toCastle(cb);
				return;
			}
			if(stone == 'B1'){
				cga.walkList([
				[151, 122]
				], cb);
				return;
			}
			if(stone == 'B2'){
				cga.walkList([
				[155, 122]
				], cb);
				return;
			}
			var curStone = cga.travel.falan.xy2name(curXY.x, curXY.y, curMap);
			if(curStone) {
				var turn = false;
				if(stone == 'M1' || stone == 'M3') {
					if(curStone == stone){
						cb(null);
						return;
					}
					turn = true;
				}
				else if(stone.length >= 2 && curStone.charAt(1) == stone.charAt(1)) {
					if(curStone.charAt(0) == 'S' && stone.charAt(0) == 'B'){
						cga.walkList([
						stone == 'B1' ? [151, 122] : [155, 122]
						], cb);
						return;
					}
					if(curStone == stone){
						cb(null);
						return;
					}
					turn = true;
				} else if(stone.length < 2){
					if(curStone.charAt(0) == stone.charAt(0)){
						cb(null);
						return;
					}
					turn = true;
				}
				if(turn){
					switch(curStone){
						case 'E2':cga.turnDir(6);break;
						case 'S2':cga.turnDir(0);break;
						case 'W2':cga.turnDir(0);break;
						case 'E1':cga.turnDir(0);break;
						case 'S1':cga.turnDir(6);break;
						case 'W1':cga.turnDir(6);break;
					}
					cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
						if(err){
							cb(err, reason);
							return;
						}
						cga.travel.falan.toStoneInternal(stone, cb);
					});
					return;
				}
			}
		}
		
		if(curMap.indexOf('市场') >= 0 && curXY.x == 46 && curXY.y == 16){
			if(stone == 'M1' && curMap == '市场一楼 - 宠物交易区'){
				cb(null);
				return;
			}
			if(stone == 'M3' && curMap == '市场三楼 - 修理专区'){
				cb(null);
				return;
			}
			cga.turnDir(6);
			cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
				if(err){
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
			return;
		}
		if(curMap == '艾尔莎岛'){
			cga.walkList([
			[140, 105],
			], ()=>{
				cga.turnDir(7);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
						if(err){
							cb(err, reason);
							return;
						}
						cga.travel.falan.toStoneInternal(stone, cb);
					});
				});
			})
			return;
		}
		if(curMap == '里谢里雅堡'){
			if(stone == 'C'){
				cb(null);
				return;
			}
			var walks = null;
			const walkOutOfCastle_1 = [
				[41, 98, '法兰城'],
				[141, 148]
			];
			const walkOutOfCastle_2 = [
				[40, 98, '法兰城'],
				[162, 130]
			];
			const walkOutOfCastle_3 = [
				[41, 98, '法兰城'],
			];
			if(stone == 'M1')
				walks = walkOutOfCastle_2;
			else if(stone == 'M3')
				walks = walkOutOfCastle_1;
			else if(stone.length >= 2 && stone.charAt(0) == 'B')
				walks = walkOutOfCastle_3; 
			else if(stone.length == 1)
				walks = walkOutOfCastle_2;
			else if(stone.length >= 2 && stone.charAt(1) == '1')
				walks = walkOutOfCastle_1;
			else
				walks = walkOutOfCastle_2;

			cga.walkList(walks, (err, reason)=>{
				if(err){
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
			return;
		}
		// UNAecho:如果持有登出就消失的道具，那么尝试回到法兰城主地图，再次执行cga.travel.falan.toStoneInternal
		for(var i in itemNotLogBack){
			if(cga.findItem(itemNotLogBack[i]) != -1){
				notLogBack = true
				console.log('你持有登出即消失的【' + itemNotLogBack[i] + '】道具')
				break
			}
		}
		if(notLogBack && cga.travel.switchMainMap() == '法兰城'){
			console.log('不可登出，尝试徒步至法兰城主地图')
			cga.travel.autopilot('主地图',()=>{
				cga.travel.falan.toStoneInternal(stone, cb);
			})
			return
		}
		cga.logBack(()=>{
			cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
				if(err){
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
		});
	}
	
	//参数1：传送石名称，有效参数：E1 S1 W1 E2 S2 W2 M1(道具-市场1楼) M3(道具-市场3楼)
	//参数2：回调函数function(result), result 为true或false
	cga.travel.falan.toStone = function(stone, cb){
		if(!cga.travel.falan.isvalid(stone)){
			cb(new Error('无效的目的地名称'));
			return;
		}
		
		cga.travel.falan.toStoneInternal(stone, cb, true);
	}
	
	//前往到法兰城东医院
	//参数1：回调函数function(result), result 为true或false
	cga.travel.falan.toEastHospital = (cb)=>{
		cga.travel.falan.toStone('E', ()=>{
			cga.walkList([
			[221, 83, '医院']
			], cb);
		});
	}
	
	//前往到法兰城西医院
	//参数1：回调函数function(result), result 为true或false
	cga.travel.falan.toWestHospital = (cb)=>{
		cga.travel.falan.toStone('W', (r)=>{
			cga.walkList([
			[82, 83, '医院'],
			], cb);
		});
	}
	
	//前往到法兰城银行
	cga.travel.falan.toBank = (cb)=>{
		
		if(cga.GetMapIndex().index3 == 1121){
			cb(null);
			return;
		}
		
		cga.travel.falan.toStone('E', (r)=>{
			cga.walkList([
			[238, 111, '银行'],
			], cb);
		});
	}
	
	//从法兰城到里谢里雅堡，启动地点：登出到法兰城即可
	cga.travel.falan.toCastle = (cb)=>{
		
		if(cga.GetMapName() == '里谢里雅堡'){
			cb(null);
			return;
		}
		
		if(cga.GetMapName() == '法兰城'){
			var curXY = cga.GetMapXY();
			
			var westPath = cga.calculatePath(curXY.x, curXY.y, 141, 88, '里谢里雅堡', null, null, []);
			westPath = PF.Util.expandPath(westPath);
			
			var southPath = cga.calculatePath(curXY.x, curXY.y, 153, 100, '里谢里雅堡', null, null, []);
			southPath = PF.Util.expandPath(southPath);
			
			var eastPath = cga.calculatePath(curXY.x, curXY.y, 165, 88, '里谢里雅堡', null, null, []);
			eastPath = PF.Util.expandPath(eastPath);

			var northPath = cga.calculatePath(curXY.x, curXY.y, 153, 70, '里谢里雅堡', null, null, []);
			northPath = PF.Util.expandPath(northPath);

			var path = westPath;
			var target = [141, 88, '里谢里雅堡'];
			
			if(path.length > southPath.length)
			{
				path = southPath;
				target = [153, 100, '里谢里雅堡'];
			}
			
			if(path.length > eastPath.length)
			{
				path = eastPath;
				target = [165, 88, '里谢里雅堡'];
			}
			
			if(path.length > northPath.length)
			{
				path = northPath;
				target = [153, 70, '里谢里雅堡'];
			}
			
			cga.walkList([target], cb);
		} else {
			cga.travel.falan.toStone('S', ()=>{
				cga.travel.falan.toCastle(cb);
			});
		}
	}
	
	cga.travel.falan.toCastleHospital = function(cb){
		
		if(cga.GetMapName() == '里谢里雅堡'){
			var pos = cga.GetMapXY();
			if(pos.x == 34 && (pos.y >= 87 && pos.y <= 89))
			{
				var turnToPos = []
				if(pos.y == 87){
					turnToPos = [36, 89]
				}else if(pos.y == 88){
					turnToPos = [36, 88]
				}else{
					turnToPos = [36, 87]
				}
				cga.TurnTo(turnToPos[0], turnToPos[1]);
				cb(true);
				return;
			}
			else
			{
				cga.walkList([
				[34, 89]
				], (r)=>{
					cga.TurnTo(36, 87);
					cb(true);
				});
			}
			return;
		}
		
		cga.travel.falan.toStone('C', (r)=>{
			cga.walkList([
			[34, 89]
			], (r)=>{
				cga.TurnTo(36, 87);
				cb(true);
			});
		});	
	}
	
	//前往里堡打卡处并打卡
	cga.travel.falan.toCastleClock = (cb)=>{
		cga.travel.falan.toStone('C', (r)=>{
			cga.walkList([
			[58, 83]
			], (r)=>{
				cga.TurnTo(58, 84);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg.options == 12){
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					} else {
						cb(new Error('没有卡时，无法打卡'));
					}
				});
			});
		});	
	}
	
	cga.travel.camp = {};

	cga.travel.camp.getRegion = (mapname, mapXY)=>{
		if(mapname == '肯吉罗岛')
		{
			if(mapXY.x <= 480 && mapXY.x >= 463 && mapXY.y <= 206 && mapXY.y >= 195)
			{
				return '沙滩域';
			}
			if(mapXY.x <= 316 && mapXY.y >= 325)
			{
				return '矮人城镇域';
			}
			if(mapXY.x >= 355 && mapXY.x <= 516 && mapXY.y <= 181)
			{
				return '沼泽洞穴出口域';
			}
			if(mapXY.x < 355 && mapXY.y <= 212)
			{
				return '沼泽洞穴出口域';
			}
			if(mapXY.x >= 535 && mapXY.y >= 309)
			{
				return '圣骑士营地门口域';
			}
			
			return '圣骑士营地域';
		}else if(mapname == '芙蕾雅'){// 曙光骑士团营地域
			if(mapXY.x <=520 && mapXY.x >=420 && mapXY.y <= 315 && mapXY.y >=250)
			{
				return '曙光骑士团营地域';
			}
		}
		return null;
	}

	//前往圣骑士营地，noWarp为true时只进到曙光骑士团营地
	cga.travel.falan.toCamp = (cb, noWarp)=>{
		var warp = ()=>{
			
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = (teamplayers.length > 0 && teamplayers[0].is_me) == true ? true : false;
			
			if(isTeamLeader){
				setTimeout(()=>{
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					setTimeout(warp, 1500);
				}, 1500);
				return;
			}
			
			cga.TurnTo(7, 21);
			cga.AsyncWaitMovement({map:'圣骑士营地', delay:1000, timeout:5000}, cb);
		}

		var castle_2_camp = ()=>{
			
			var shouldWarp = (cga.getItemCount('承认之戒', true) > 0 && noWarp !== true) ? true : false;
			
			var list = shouldWarp ? [
			[55,47, '辛希亚探索指挥部'],
			[7,4, '辛希亚探索指挥部', 91, 6],
			[95, 9, 27101],
			[8, 21],
			] : [
			
			];

			if(cga.GetMapName() == '里谢里雅堡'){
				list.unshift([513, 282, '曙光骑士团营地']);
				list.unshift([153, 241, '芙蕾雅']);
				list.unshift([41, 98, '法兰城']);
			} else if(cga.GetMapName() == '法兰城'){
				list.unshift([513, 282, '曙光骑士团营地']);
				list.unshift([153, 241, '芙蕾雅']);
			} else if(cga.GetMapName() == '芙蕾雅'){
				list.unshift([513, 282, '曙光骑士团营地']);
			}
			
			cga.walkList(list, (shouldWarp) ? warp : cb);
		}
		
		var mapname = cga.GetMapName();
		if(mapname == '圣骑士营地'){
			cb(null);
			return;
		}
		var mapindex = cga.GetMapIndex().index3;
		if(mapindex == 44692){
			cga.walkList([
				[0, 20, '圣骑士营地'],
			], cb);
			return;
		}
		if(mapindex == 44693){
			cga.walkList([
				[30, 37, '圣骑士营地'],
			], cb);
			return;
		}
		if(mapindex == 44698){
			cga.walkList([
				[3, 23, '圣骑士营地'],
			], cb);
			return;
		}
		if(mapindex == 44699){
			cga.walkList([
				[0, 14, '圣骑士营地'],
			], cb);
			return;
		}
		// 传送石房间
		if(mapname == '辛希亚探索指挥部' && cga.GetMapIndex().index3 == 27101){
			cga.walkList([[8, 21]], warp);
			return;
		}
		
		if(mapname == '法兰城' || mapname == '里谢里雅堡' || mapname == '芙蕾雅' || mapname == '曙光骑士团营地'){
			castle_2_camp(null);
		}else{
			cga.travel.falan.toStone('C', castle_2_camp);
		}
	}

	//前往流行商店
	cga.travel.falan.toFashionStore = cga.travel.falan.toFabricStore = (cb)=>{
		if(cga.GetMapName()=='流行商店'){
			cb(null);
			return;
		}
		
		if(cga.GetMapName() == '法兰城'){
			cga.travel.falan.toStone('S1', ()=>{
				cga.walkList([
					[117, 112, '流行商店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[17, 53, '法兰城'],
					[117, 112, '流行商店'],
				], cb);
			});
		}
	}
	
	//前往凯蒂夫人的店
	cga.travel.falan.toKatieStore = cga.travel.falan.toAssessStore = (cb)=>{
		if(cga.GetMapName()=='凯蒂夫人的店'){
			cb(null);
			return;
		}
		
		if(cga.GetMapName() == '法兰城'){
			cga.travel.falan.toStone('E2', function(r){
				cga.walkList([
					[196, 78, '凯蒂夫人的店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[65, 53, '法兰城'],
					[196, 78, '凯蒂夫人的店'],
				], cb);
			});
		}
	}
	
	//前往达美姊妹的店
	cga.travel.falan.toDameiStore = cga.travel.falan.toCrystalStore = (cb)=>{
		if(cga.GetMapName()=='达美姊妹的店'){
			cb(null);
			return;
		}
		
		if(cga.GetMapName() == '法兰城'){
			cga.travel.falan.toStone('W1', function(r){
				cga.walkList([
					[94, 78, '达美姊妹的店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[17, 53, '法兰城'],
					[94, 78, '达美姊妹的店'],
				], cb);
			});
		}
	}
	
	//前往法兰工房，mine为要换的矿名
	cga.travel.falan.toMineStore = (mine, cb)=>{
		var mineExchange = null;
		if(mine == '铜'){
			mineExchange = (cb2)=>{
				cga.walkList([[26, 5]], ()=>{
					cga.turnTo(26, 4);
					cb2(null);
				});
			}
		}
		if(mine == '铁'){
			mineExchange = (cb2)=>{
				cga.walkList([[28, 6]], ()=>{
					cga.turnTo(28, 5);
					cb2(null);
				});
			}
		}
		if(mine == '银'){
			mineExchange = (cb2)=>{
				cga.walkList([[29, 6]], ()=>{
					cga.turnTo(30, 5);
					cb2(null);
				});
			}
		}
		if(mine == '纯银'){
			mineExchange = (cb2)=>{
				cga.walkList([[27, 7]], ()=>{
					cga.turnTo(27, 5);
					cb2(null);
				});
			}
		}
		if(mine == '金'){
			mineExchange = (cb2)=>{
				cga.walkList([[24, 6]], ()=>{
					cga.turnTo(24, 5);
					cb2(null);
				});
			}
		}
		if(mine == '白金'){
			mineExchange = (cb2)=>{
				cga.walkList([[29, 6]], ()=>{
					cga.turnTo(30, 7);
					cb2(null);
				});
			}
		}
		if(mine == '幻之钢'){
			mineExchange = (cb2)=>{
				cga.walkList([[26, 10]], ()=>{
					cga.turnTo(28, 10);
					cb2(null);
				});
			}
		}
		if(mine == '幻之银'){
			mineExchange = (cb2)=>{
				cga.walkList([[27, 9]], ()=>{
					cga.turnTo(28, 8);
					cb2(null);
				});
			}
		}
		if(mine == '勒格耐席鉧'){
			mineExchange = (cb2)=>{
				cga.walkList([[23, 7]], ()=>{
					cga.turnTo(22, 6);
					cb2(null);
				});
			}
		}
		if(mine == '奥利哈钢'){
			mineExchange = (cb2)=>{
				cga.walkList([[26, 12]], ()=>{
					cga.turnTo(27, 12);
					cb2(null);
				});
			}
		}
		if(cga.GetMapName()=='米克尔工房'){
			if(mineExchange){
				mineExchange(cb);
			}else{
				cb(null);
			}
			return;
		}
		
		if(cga.GetMapName() == '法兰城'){
			cga.travel.falan.toStone('W1', function(r){
				cga.walkList([
					[100, 61, '米克尔工房'],
				], ()=>{
					if(mineExchange){
						mineExchange(cb);
					}else{
						cb(null);
					}
				});
			});
		} else {
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[17, 53, '法兰城'],
					[100, 61, '米克尔工房'],
				], ()=>{
					if(mineExchange){
						mineExchange(cb);
					}else{
						cb(null);
					}
				});
			});
		}
	}
	
	//前往新城工房，mine为要换的矿名
	cga.travel.falan.toNewMineStore = (mine, cb)=>{
		var mineExchange = null;
		if(mine == '铜'){
			mineExchange = (cb2)=>{
				cga.walkList([[35, 46]], ()=>{
					cga.turnTo(35, 45);
					cb2(null);
				});
			}
		}
		if(mine == '铁'){
			mineExchange = (cb2)=>{
				cga.walkList([[32, 47]], ()=>{
					cga.turnTo(31, 47);
					cb2(null);
				});
			}
		}
		if(mine == '银'){
			mineExchange = (cb2)=>{
				cga.walkList([[42, 51]], ()=>{
					cga.turnTo(41, 51);
					cb2(null);
				});
			}
		}
		if(mine == '纯银'){
			mineExchange = (cb2)=>{
				cga.walkList([[37, 49]], ()=>{
					cga.turnTo(37, 48);
					cb2(null);
				});
			}
		}
		if(mine == '金'){
			mineExchange = (cb2)=>{
				cga.walkList([[40, 50]], ()=>{
					cga.turnTo(39, 49);
					cb2(null);
				});
			}
		}
		if(mine == '白金'){
			mineExchange = (cb2)=>{
				cga.walkList([[38, 43]], ()=>{
					cga.turnTo(39, 44);
					cb2(null);
				});
			}
		}
		if(mine == '幻之钢'){
			mineExchange = (cb2)=>{
				cga.walkList([[26, 10]], ()=>{
					cga.turnTo(28, 10);
					cb2(null);
				});
			}
		}
		if(mine == '幻之银'){
			mineExchange = (cb2)=>{
				cga.walkList([[37, 44]], ()=>{
					cga.turnTo(38, 45);
					cb2(null);
				});
			}
		}
		if(mine == '勒格耐席鉧'){
			mineExchange = (cb2)=>{
				cga.walkList([[33, 46]], ()=>{
					cga.turnTo(33, 45);
					cb2(null);
				});
			}
		}
		if(mine == '奥利哈钢'){
			mineExchange = (cb2)=>{
				cga.walkList([[44, 48]], ()=>{
					cga.turnTo(43, 48);
					cb2(null);
				});
			}
		}
		if(mine == '铝'){
			mineExchange = (cb2)=>{
				cga.walkList([[38, 54]], ()=>{
					cga.turnTo(38, 53);
					cb2(null);
				});
			}
		}
		if(cga.GetMapName()=='画廊'){
			if(mineExchange){
				mineExchange(cb);
			}else{
				cb(null);
			}
			return;
		}
		
		cga.travel.newisland.toStone('B', ()=>{
			cga.walkList([
				[144, 120, '武器工房'],
				[28, 21, '画廊'],
			], ()=>{
				if(mineExchange){
					mineExchange(cb);
				}else{
					cb(null);
				}
			});
		});
	}

	//从法兰城到新城
	cga.travel.falan.toNewIsland = (cb)=>{
		cga.travel.falan.toStone('C', function(r){
			cga.walkList([
				[28, 88]
			], (r)=>{
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(32, -1);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, -1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, -1);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(dlg && dlg.options == 12){
										cga.ClickNPCDialog(4, -1);
										cga.AsyncWaitMovement({map:'？'}, ()=>{
											cga.walkList([
												[19, 21, '法兰城遗迹'],
												[96, 138, '盖雷布伦森林'],
												[124, 168, '温迪尔平原'],
												[264, 108, '艾尔莎岛'],
											], cb);
										});
									} else {
										cb(new Error('对话失败'));
									}
								});
							});
						});
					});
				}, 1000);	
			});
		});	
	}
	
	//从法兰城到阿凯鲁法
	cga.travel.falan.toAKLF = (cb)=>{
		
		if(cga.GetMapName() == '阿凯鲁法村'){
			cb(null);
			return;
		}
		
		var stage3 = ()=>{
			cga.walkList([
				[20, 53],
			], (r)=>{
				cga.TurnTo(18, 53);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'港湾管理处'}, ()=>{
						cga.walkList([
							[22, 31, '阿凯鲁法'],
							[28, 30],
						], ()=>{
							cga.TurnTo(30, 30);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'阿凯鲁法村'}, cb);
							});
						});
					});
				});
			});
		}
		
		var retry2 = ()=>{
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				
				if(dlg && dlg.message.indexOf('现在正停靠在阿凯鲁法港') >= 0 && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'往伊尔栈桥'}, ()=>{
						stage3();
					});
					return;
				}
				
				setTimeout(retry2, 5000);
			});
		}
		
		var retry = ()=>{
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'艾欧奇亚号'}, retry2);
					return;
				}
				
				setTimeout(retry, 5000);
			});
		}
		
		if(cga.GetMapName() != '伊尔村'){
			cga.travel.falan.toTeleRoom('伊尔村', ()=>{
				cga.walkList([
				[12, 17, '村长的家'],
				[6, 13, '伊尔村'],
				], ()=>{
					cga.travel.falan.toAKLF(cb);
				});
			});
			return;
		}
		
		cga.walkList([
			[58, 71],
		], ()=>{
			cga.turnTo(60, 71);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({map:'伊尔'}, ()=>{
					cga.walkList([
						[30, 21, '港湾管理处'],
						[23, 25],
					], ()=>{
						cga.TurnTo(23, 23);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'往阿凯鲁法栈桥'}, ()=>{
									cga.walkList([
										[51, 50],
									], retry);
								});
							});
						});
					});
				});
			}, 1000);	
		});
	}
	
	//从法兰城到哥拉尔
	cga.travel.falan.toGelaer = (cb)=>{
		
		if(cga.GetMapName() == '哥拉尔镇'){
			cb(null);
			return;
		}
		
		var stage3 = ()=>{
			cga.walkList([
				[84, 55],
			], ()=>{
				cga.turnTo(84, 53);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'哥拉尔镇 港湾管理处'}, ()=>{
						cga.walkList([
							[14, 15, '哥拉尔镇'],
							[118, 214],
						], cb);
					});
				});
			});
		}
		
		var retry2 = ()=>{
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				
				if(dlg && dlg.message.indexOf('正停在哥拉尔港') >= 0 && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'往伊尔栈桥'}, ()=>{
						stage3();
					});
					return;
				}
				
				setTimeout(retry2, 5000);
			});
		}
		
		var retry = ()=>{
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'铁达尼号'}, retry2);
					return;
				}
				
				setTimeout(retry, 5000);
			});
		}
		
		if(cga.GetMapName() != '伊尔村'){
			cga.travel.falan.toTeleRoom('伊尔村', ()=>{
				cga.walkList([
				[12, 17, '村长的家'],
				[6, 13, '伊尔村'],
				], ()=>{
					cga.travel.falan.toGelaer(cb);
				});
			});
			return;
		}
		
		cga.walkList([
			[58, 71],
		], ()=>{
			cga.turnTo(60, 71);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({map:'伊尔'}, ()=>{
					cga.walkList([
						[30, 21, '港湾管理处'],
						[25, 25],
					], ()=>{
						cga.TurnTo(25, 23);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'往哥拉尔栈桥'}, ()=>{
									cga.walkList([
										[51, 50],
									], retry);
								});
							});
						});
					});
				});
			}, 1000);	
		});
	}
	
	cga.travel.AKLF = {};
	
	cga.travel.AKLF.isSettled = ()=>{

		var config = cga.loadPlayerConfig();

		if(config)
			return config.settledCity == '阿凯鲁法村' ? true : false;

		return false;
	}
	
	//前往到阿凯鲁法银行
	cga.travel.AKLF.toBank = (cb)=>{
		if(cga.GetMapName() != '阿凯鲁法村'){

			if( cga.travel.AKLF.isSettled() ){
				cga.logBack(()=>{
					setTimeout(cga.travel.AKLF.toBank, 1000, cb);
				});
				return;
			}

			cb(new Error('"前往阿凯鲁法银行"功能必须从阿凯鲁法村启动'));
			return;
		}
		cga.walkList([
			[139, 136, '银行'],
			[20, 17],
		], ()=>{
			cga.turnDir(0);
			cb(null);
		});
	}

	//从阿凯鲁法到法兰
	cga.travel.AKLF.toFalan = (cb)=>{
		if(cga.GetMapName() != '阿凯鲁法村'){
			cb(new Error('必须从阿凯鲁法村启动'));
			return;
		}

		var stage4 = ()=>{
			cga.walkList([
				[47, 83, '村长的家'],
				[14, 17, '伊尔村的传送点'],
				[20, 10],
			], (r)=>{
				cga.TurnTo(22, 10);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'启程之间'}, ()=>{
						cga.walkList([
							[25, 24, '里谢里雅堡 1楼'],
							[74, 40, '里谢里雅堡'],
						], cb);
					});
				});
			});
		}
		
		var stage3 = ()=>{
			cga.walkList([
				[19, 55],
			], (r)=>{
				cga.TurnTo(19, 53);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'港湾管理处'}, ()=>{
						cga.walkList([
							[9, 22, '伊尔'],
							[24, 19],
						], ()=>{
							cga.TurnTo(24, 17);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'伊尔村'}, stage4);
							});
						});
					});
				});
			});
		}
		
		var retry2 = ()=>{
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg)=>{				
				if(dlg && dlg.message.indexOf('现在正停靠在伊尔村') >= 0 && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'往阿凯鲁法栈桥'}, ()=>{
						stage3();
					});
					return;
				}
				
				setTimeout(retry2, 5000);
			});
		}

		var retry = ()=>{
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'艾欧奇亚号'}, retry2);
					return;
				}
				
				setTimeout(retry, 5000);
			});
		}
		
		cga.walkList([
			[57, 176],
		], ()=>{
			cga.TurnTo(55, 176);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({map:'阿凯鲁法'}, ()=>{
					cga.walkList([
					[16, 15, '港湾管理处'],
					[15, 12],
					], ()=>{
						cga.TurnTo(17, 12);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'往伊尔栈桥'}, ()=>{
									cga.walkList([
									[51, 50],
									], retry);
								});
							});
						});
					});
				});
			});
		});
	}
	
	cga.travel.falan.toTeleRoomTemplate = (villageName, npcPos, npcPos2, npcPos3, cb)=>{
		var logic = ()=>{
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
			
			var list = [];
			
			if(isTeamLeader){
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
				list.push(npcPos2);				
				list.push(npcPos);
			} else {
				list.push(npcPos);
			}
			
			cga.walkList(list, ()=>{
				var go = ()=>{
					cga.turnTo(npcPos3[0], npcPos3[1]);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						//try again if timeout
						if(err && err.message.indexOf('timeout') > 0)
						{
							setTimeout(go, 1500);
							return;
						}

						if(err){
							cb(err);
							return;
						}

						if(typeof dlg.message == 'string' && (dlg.message.indexOf('对不起') >= 0 || dlg.message.indexOf('很抱歉') >= 0)){
							cb(new Error('无法使用前往'+villageName+'的传送石，可能的原因：没开传送点'));
							return;
						}
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitMovement({map:villageName+'的传送点', delay:1000, timeout:5000}, (err)=>{
							if(err){
								cb(new Error('无法使用前往'+villageName+'的传送石，可能的原因：钱不够'));
								return;
							}

							cb(null);
						});
					});
				}
				if(isTeamLeader){
					setTimeout(()=>{
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(go, 1500);
					}, 1500);
				} else {
					go();
				}
			});
		}
		
		let mapindex = cga.GetMapIndex().index3;
		if(mapindex == 1522){
			logic()
		}else if(mapindex == 1500 || mapindex == 1520){
			cga.travel.autopilot('启程之间',logic)
		}else{
			cga.travel.falan.toStone('C', ()=>{
				cga.travel.autopilot('启程之间',logic)
			});
		}
	}
	
	//从启程之间传送到指定村落
	//UNAecho:修改逻辑，在对应传送石房间直接跳过本API，而不是登出重新再执行传送一遍。
	cga.travel.falan.toTeleRoom = (villageName, cb)=>{
		let mapindex = cga.GetMapIndex().index3;
		switch(villageName){
			case '亚留特村':
				if (mapindex == 2499){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('亚留特村', [43, 23], [43, 22], [44, 22], cb);
				break;
			case '伊尔村':
				if (mapindex == 2099){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('伊尔村', [43, 33], [43, 32], [44, 32], cb);
				break;
			case '圣拉鲁卡村':
				if (mapindex == 2399){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('圣拉鲁卡村', [43, 44], [43, 43], [44, 43], cb);
				break;
			case '维诺亚村':
				if (mapindex == 2199){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('维诺亚村', [9, 22], [9, 23], [8, 22], cb);
				break;
			case '奇利村':
				if (mapindex == 3299){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('奇利村', [9, 33], [8, 33], [8, 32], cb);
				break;
			case '加纳村':
				if (mapindex == 3099){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('加纳村', [9, 44], [8, 44], [8, 43], cb);
				break;
			case '杰诺瓦镇':
				if (mapindex == 4099){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('杰诺瓦镇', [15, 4], [15, 5], [16, 4], cb);
				break;
			case '阿巴尼斯村':
				if (mapindex == 4399){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('阿巴尼斯村', [37, 4], [37, 5], [38, 4], cb);
				break;
			case '蒂娜村':
				if (mapindex == 4299){
					cb(null)
					return
				}
				cga.travel.falan.toTeleRoomTemplate('蒂娜村', [25, 4], [25, 5], [26, 4], cb);
				break;
			case '魔法大学':
				var mapname = cga.GetMapName();
				if(mapname == '魔法大学'){
					cb(null);
					return;
				}
				else if(mapname == '魔法大学内部'){
					cga.walkList([
					[40, 59, '魔法大学'],
					], cb);
					return;
				}
				cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
					cga.walkList([
					[5, 4, 4313],
					[6, 13, 4312],
					[6, 13, '阿巴尼斯村'],
					[37, 71, '莎莲娜'],
					[118, 100, '魔法大学'],
					], cb);
				});
				break;
			default:
				throw new Error('未知的村子名称:'+villageName);
		}
	}

	cga.travel.falan.toTeleRoomPromisify = (city)=>{
		return cga.promisify(cga.travel.falan.toTeleRoom, [city]);
	}

	/**
	 * 检查全部传送石开启状况，将结果保存在【个人配置】中。
	 * 为了提高效率，仅检查没有记录或者未开启的部分。
	 * */ 
	 cga.travel.falan.checkAllTeleRoom = (cb)=>{
		var config = cga.loadPlayerConfig();
		if(!config)
			config = {};
		// 如果全部开传送，将config.allstonedone置为true，无需重复检查。
		if(config.allstonedone){
			console.log('人物已经全部开传送，无需检查。')
			if (cb) setTimeout(cb, 1000,null);
			return
		}
		var alldone = true
		var check =(villageName,pos,npcPos,cb2)=>{
			if (config[villageName]){
				console.log(villageName + '已经开过传送，跳过')
				if (cb2){
					setTimeout(cb2, 1000,null);
				}
				return
			}
			cga.walkList([
				pos
			], ()=>{
				cga.turnTo(npcPos[0], npcPos[1]);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					//try again if timeout
					if(err && err.message.indexOf('timeout') > 0)
					{
						setTimeout(check, 1500);
						return;
					}
					if(err){
						cb2(err);
						return;
					}
					if(typeof dlg.message == 'string' && (dlg.message.indexOf('你') >= 0 || dlg.message.indexOf('很抱歉') >= 0)){
						alldone = false
						config[villageName] = false
						console.log('【' + villageName + '】没开传送，请开启')
					}else if(typeof dlg.message == 'string' && (dlg.message.indexOf('金币') >= 0)){
						config[villageName] = true
					}else{
						new Error('未知错误，请手动检查传送石状态')
					}
					if (cb2){
						setTimeout(cb2, 1000,null);
					}
				});
			});
		}
		var map = cga.GetMapName();
		if (map == '启程之间'){
			check('亚留特村', [43, 22],[44, 22],()=>{
				check('伊尔村', [43, 32],[44, 32],()=>{
					check('圣拉鲁卡村', [43, 43], [44, 43],()=>{
						check('维诺亚村', [9, 23], [8, 22],()=>{
							check('奇利村', [8, 33], [8, 32],()=>{
								check('加纳村', [8, 44], [8, 43],()=>{
									check('杰诺瓦镇', [15, 5], [16, 4],()=>{
										check('蒂娜村', [25, 5], [26, 4],()=>{
											check('阿巴尼斯村', [37, 5], [38, 4], ()=>{
												console.log('检查完毕')
												if(alldone){
													cga.SayWords('恭喜，人物已经开启全部法兰王国传送石。', 0, 3, 1);
													config.allstonedone = true
												}
												cga.savePlayerConfig(config, cb);
											})
										})
									})
								})
							})
						})
					})
				})
			})
		}else{
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[41, 50, '里谢里雅堡 1楼'],
					[45, 20, '启程之间']
					], ()=>{
						cga.travel.falan.checkAllTeleRoom(cb)
					});
			});
			return
		}
	}
	/**
	 * UNAecho:一些传送石的费用，目前仅考虑单向传送，从登入点较近的传送石，传到较远的传送石
	 * 例如从法兰传送到维诺亚，而不是从维诺亚传送至法兰，或从哥拉尔传送至米诺基亚，而不是从米诺基亚传送至哥拉尔
	 */
	cga.travel.teleCost = {
		'圣拉鲁卡村' : 100,
		'伊尔村' : 100,
		'亚留特村' : 250,
		'维诺亚村' : 250,
		'奇利村' : 500,
		'加纳村' : 600,
		'杰诺瓦镇' : 750,
		'蒂娜村' : 750,
		'阿巴尼斯村' : 750,
		'魔法大学' : 750,
	}
	
	cga.travel.info = {
		'法兰城':{
			mainName : '法兰城',
			mainindex : 1000,
			minindex : 1000,
			maxindex : 32830,
			mapTranslate:{
				'主地图' : 1000,
				'法兰城' : 1000,
				'拿潘食品店' : 1062,
				'职业公会' : 1092,
				'酒吧':{
					1101:'科特利亚酒吧',// 调教技能学习地
					1170:'安其摩酒吧',// 铜钥匙购买地
				},
				'医院':{
					1111:'西门医院',
					1112:'东门医院',
				},
				'科特利亚酒吧':1101,
				'酒吧里面':1102,
				'凯蒂夫人的店':1031,
				'强哥杂货店':1051,
				'银行':1121,
				'葛利玛的家':1150,
				'冒险者旅馆':1154,
				'冒险者旅馆 2楼':1164,
				'流行商店':1162,
				'安其摩酒吧':1170,
				'弓箭手公会':1181,
				'公寓':1187,
				'公寓2楼':1188,
				'美容院':1189,
				'职业介绍所':1091,
				'大圣堂的入口':1201,
				'礼拜堂':1202,
				'2楼客房':1206,
				'大圣堂里面':{
					1207:'传教士职业导师房间',
					1208:'传教士职业技能房间',
				},
				'竞技场的入口':1400,
				'竞技场':{
					1401 : '学习气功弹等PK竞技场',
					1450 : '打吉拉竞技场的石像说话第1层',
					1451 : '打吉拉竞技场的石像说话第2层',
					1452 : '打吉拉竞技场的石像说话第3层',
					1453 : '打吉拉竞技场的石像说话第4层',
					1454 : '打吉拉竞技场的石像说话第5层',
					1455 : '打吉拉竞技场的石像说话第6层',
				},
				'后台':1402,
				'治愈的广场':1403,
				'休息室':1404,
				'升官图房间2':{
					1420 : '第一个升官图房间2',
					1421 : '第二个升官图房间2',
				},
				'升官图':1422,
				'升官图导览间':1423,
				'升官图走廊':1424,
				'休息室':1456,
				'竞技预赛会场':1457,
				'客房':{
					1104:'病倒的厨师',
					1105:'学调教',
					1507:'护士职业导师房间',
					1508:'封印师职业导师房间',
					1509:'骑士职业导师房间',
					1510:'阳炎学习房间',
					32830:'空房间，以前是抽奖',
				},
				'里谢里雅堡':1500,
				'厨房':1502,
				'图书室':1504,
				'食堂':1506,
				'谒见之间':1511,
				'寝室':1512,
				'走廊':1518,
				'里谢里雅堡 1楼':1520,
				'里谢里雅堡 2楼':1521,
				'启程之间':1522,
				'召唤之间':1530,
				// 新手房召唤之间的index是多变的，目前见过的范围是1533-36，无法从外面走入，只能走出。
				'召唤之间':1533,
				'召唤之间':1534,
				'召唤之间':1535,
				'召唤之间':1536,
				'饲养师之家':1810,
				'气功弹':'气功弹',
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				1000:[],
				// 凯蒂夫人的店
				1031:[[196, 78, 1031],],
				// 强哥杂货店
				1051:[[191, 37, 1051],],
				// 拿潘食品店
				1062:[[217, 53, 1062],],
				// 职业公会
				1092:[[73, 60, 1092],],
				// 科特利亚酒吧
				1101:[[219, 136, 1101],],
				// 酒吧里面
				1102:[[219, 136, 1101],[27, 20, 1102],],
				// 客房
				1104:[[219, 136, 1101],[27, 20, 1102],[10, 12, 1104],],
				// 客房
				1105:[[219, 136, 1101],[27, 20, 1102],[10, 6, 1105],],
				// 西门医院
				1111:[[82, 83, 1111],],
				// 东门医院
				1112:[[221, 83, 1112],],
				// 银行
				1121:[[238, 111, 1121],],
				// 葛利玛的家
				1150:[[216, 43, 1150],],
				// 冒险者旅馆
				1154:[[238, 64, 1154],],
				// 流行商店
				1162:[[117, 112, 1162],],
				// 冒险者旅馆 2楼
				1164:[[238, 64, 1154],[33, 27, 1164],],
				// 安其摩酒吧
				1170:[[102, 131, 1170],],
				// 弓箭手公会
				1181:[[190, 133, 1181],],
				// 公寓
				1187:[[182, 132, 1187],],
				// 公寓2楼
				1188:[[182, 132, 1187],[16, 7, 1188],],
				// 美容院
				1189:[[216, 124, 1189],],
				// 职业介绍所
				1091:[[195, 50, 1091],],
				// 大圣堂的入口
				1201:[[154, 29, 1201],],
				// 礼拜堂
				1202:[[154, 29, 1201],[14, 7, 1202],],
				// 2楼客房
				1206:[[154, 29, 1201],[22, 9, 1206],],
				// 大圣堂里面
				1207:[[154, 29, 1201],[14, 7, 1202],[23, 0, 1207],],
				// 大圣堂里面
				1208:[[154, 29, 1201],[14, 7, 1202],[23, 0, 1207],
				[(cb)=>{
					cga.walkList([[13, 6]], ()=>{
							cga.turnDir(0);
							cga.waitForLocation({mapindex : 1208}, cb);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
							});
					});
				}, null, 1208],],
				// 竞技场的入口
				1400:[[(cb)=>{
					cga.walkList([[124, 161]], ()=>{
							cga.turnDir(4);
							cga.waitForLocation({mapindex : 1400}, cb);
					});
				}, null, 1400],],
				// 竞技场
				1401:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[15, 6, 1401],],
				// 后台
				1402:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[15, 6, 1401],[35, 8, 1402],],
				// 治愈的广场
				1403:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],],
				// 休息室
				1404:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],],
				// 升官图房间2
				1420:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],[8, 9, 1424],[9, 7, 1420],],
				// 升官图房间2
				1421:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],[8, 9, 1424],[9, 12, 1421],],
				// 升官图
				1422:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],[8, 9, 1424],[9, 17, 1422],],
				// 升官图导览间
				1423:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],[8, 9, 1424],[9, 2, 1423],],
				// 升官图走廊
				1424:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[2, 14, 1404],[8, 9, 1424],],
				// 竞技场
				1450:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],],
				// 竞技场
				1451:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],],
				// 竞技场
				1452:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],],
				// 竞技场
				1453:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],[22, 8, 1453],],
				// 竞技场
				1454:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],[22, 8, 1453],[15, 8, 1454],],
				// 竞技场
				1455:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],[22, 8, 1453],[15, 8, 1454],[22, 16, 1455],],
				// 休息室
				1456:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],[22, 8, 1453],[15, 8, 1454],[22, 16, 1455],
				[(cb)=>{
					cga.walkList([[16, 12]], ()=>{
						cga.turnDir(6);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if((dlg && dlg.message.indexOf('斗士之证') >= 0)){
								cga.ClickNPCDialog(1, -1)
								cga.travel.autopilot(1456,cb)
								return
							}else{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(4, -1);
										setTimeout(()=>{
											cb2(true)
										}, 1000);	
									});
								});
							}


						});
				});
				}, null, 1456],],
				// 竞技预赛会场
				1457:[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[27, 14, 1403],
				[(cb)=>{
					cga.walkList([[25, 13]], ()=>{
						cga.waitForLocation({mapindex : 1450}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
				});
				}, null, 1450],[22, 13, 1451],[15, 8, 1452],[22, 8, 1453],[15, 8, 1454],[22, 16, 1455],
				[(cb)=>{
					cga.walkList([[16, 12]], ()=>{
						cga.turnDir(6);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if((dlg && dlg.message.indexOf('斗士之证') >= 0)){
								cga.ClickNPCDialog(1, -1)
								cga.travel.autopilot(1456,cb)
								return
							}else{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(4, -1);
										setTimeout(cb, 1000);	
									});
								});
							}


						});
				});
				}, null, 1456],
				[(cb)=>{
					cga.waitForLocation({mapindex : 1457}, cb);
					cga.walkList([[16, 6]], ()=>{
						cga.turnDir(4);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							cga.ClickNPCDialog(8, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.turnDir(7);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, -1);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(1, -1);
									});
								});
							});});
				});
				}, null, 1457]],
				// 里谢里雅堡
				1500:[[153, 100, 1500],],
				// 厨房
				1502:[[153, 100, 1500],[104, 21, 1502],],
				// 图书室
				1504:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[0, 74, 1504],],
				// 食堂
				1506:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[95, 71, 1506],],
				// 客房
				1507:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[18, 71, 1507],],
				// 客房
				1508:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[32, 71, 1508],],
				// 客房
				1509:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[67, 71, 1509],],
				// 客房
				1510:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[79, 71, 1510],],
				// 谒见之间
				1511:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[50, 22, 1511],],
				// 寝室
				1512:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[50, 22, 1511],[16, 3, 1518],[35, 3, 1512],],
				// 走廊
				1518:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[50, 22, 1511],[16, 3, 1518],],
				// 里谢里雅堡 1楼
				1520:[[153, 100, 1500],[41, 50, 1520],],
				// 里谢里雅堡 2楼
				1521:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],],
				// 启程之间
				1522:[[153, 100, 1500],[41, 50, 1520],[45, 20, 1522],],
				// 召唤之间
				1530:[[153, 100, 1500],[47, 85, 1530],],
				// 召唤之间(新手房，无法再次进入)
				1533:[[153, 100, 1500],[47, 85, 1533],],
				// 召唤之间(新手房，无法再次进入)
				1534:[[153, 100, 1500],[47, 85, 1534],],
				// 召唤之间(新手房，无法再次进入)
				1535:[[153, 100, 1500],[47, 85, 1535],],
				// 召唤之间(新手房，无法再次进入)
				1536:[[153, 100, 1500],[47, 85, 1535],],
				// 召唤之间(新手房，无法再次进入)
				1537:[[153, 100, 1500],[47, 85, 1535],],
				// 饲养师之家
				1810:[[122, 36, 1810],],
				// 客房
				32830:[[219, 136, 1101],[27, 20, 1102],[10, 17, 32830],],
				// 学气功弹
				'气功弹':[[(cb)=>{
					cga.travel.autopilot(1400,cb)
				}, null, 1400],[15, 6, 1401],[15, 57]],
			},
			walkReverse:{
				// 拿潘食品店
				1062:[[3, 13, 1000],],
				// 职业公会
				1092:[[9, 24, 1000],],
				// 科特利亚酒吧
				1101:[[10, 16, 1000]],
				// 酒吧里面
				1102:[[4, 15, 1101]],
				// 客房
				1104:[[2, 7, 1102]],
				// 客房
				1105:[[3, 7, 1102]],
				// 西门医院
				1111:[[12, 42, 1000]],
				// 东门医院
				1112:[[12, 42, 1000]],
				// 凯蒂夫人的店
				1031:[[4, 13, 1000]],
				// 强哥杂货店
				1051:[[15, 24, 1000],],
				// 银行
				1121:[[2, 13, 1000],],
				// 葛利玛的家
				1150:[[2, 9, 1000],],
				// 冒险者旅馆
				1154:[[7, 29, 1000],],
				// 流行商店
				1162:[[0, 9, 1000],],
				// 冒险者旅馆 2楼
				1164:[[20, 24, 1154],],
				// 安其摩酒吧
				1170:[[16, 23, 1000],],
				// 弓箭手公会
				1181:[[8, 16, 1000]],
				// 公寓
				1187:[[15, 25, 1000]],
				// 公寓2楼
				1188:[[15, 9, 1187]],
				// 美容院
				1189:[[4, 14, 1000]],
				// 职业介绍所
				1091:[[2, 10, 1000]],
				// 大圣堂的入口
				1201:[[14, 23, 1000]],
				// 礼拜堂
				1202:[[12, 45, 1201]],
				// 2楼客房
				1206:[[43, 40, 1201]],
				// 大圣堂里面
				1207:[[14, 21, 1202]],
				// 大圣堂里面
				1208:[[(cb)=>{
					cga.walkList([[14, 20]], ()=>{
						cga.waitForLocation({mapindex : 1207}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
						});
				});
				}, null, 1400],],
				// 竞技场的入口
				1400:[[15, 23, 1000]],
				// 竞技场
				1401:[[(cb)=>{
					cga.walkList([[34, 67]], ()=>{
						cga.waitForLocation({mapindex : 1400}, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
						});
				});
				}, null, 1400],],
				// 后台
				1402:[[24, 34, 1401]],
				// 治愈的广场
				1403:[[5, 31, 1400]],
				// 休息室
				1404:[[19, 4, 1400]],
				// 升官图房间2
				1420:[[(cb)=>{
					cga.walkList([[9, 1]], ()=>{
						cga.waitForLocation({mapindex : 1404}, cb);
						cga.turnDir(5);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
						});
				});
				}, null, 1404],],
				// 升官图房间2
				1421:[[(cb)=>{
					cga.walkList([[3, 1]], ()=>{
						cga.waitForLocation({mapindex : 1404}, cb);
						cga.turnDir(5);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
						});
				});
				}, null, 1404],],
				// 升官图
				1422:[[(cb)=>{
					cga.walkList([[9, 1]], ()=>{
						cga.waitForLocation({mapindex : 1404}, cb);
						cga.turnDir(7);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
						});
				});
				}, null, 1404],],
				// 升官图导览间
				1423:[[0, 9, 1424]],
				// 升官图走廊
				1424:[[4, 0, 1404]],
				// 竞技场
				1450:[[15, 8, 1403]],
				// 竞技场
				1451:[[22, 13, 1450]],
				// 竞技场
				1452:[[15, 8, 1451]],
				// 竞技场
				1453:[[22, 8, 1452]],
				// 竞技场
				1454:[[15, 8, 1453]],
				// 竞技场
				1455:[[21, 17, 1454]],
				// 休息室
				1456:null,
				// 竞技预赛会场
				1457:null,
				// 里谢里雅堡
				1500:[[41, 98, 1000],],
				// 厨房
				1502:[[9, 16, 1520],],
				// 图书室
				1504:[[29, 18, 1521],],
				// 食堂
				1506:[[17, 19, 1521],],
				// 客房
				1507:[[8, 14, 1521],],
				// 客房
				1508:[[8, 14, 1521],],
				// 客房
				1509:[[8, 14, 1521],],
				// 客房
				1510:[[8, 14, 1521],],
				// 谒见之间
				1511:[[9, 19, 1521],],
				// 寝室
				1512:[[0, 7, 1518],],
				// 走廊
				1518:[[0, 3, 1511],],
				// 里谢里雅堡 1楼
				1520:[[74, 40, 1500],],
				// 里谢里雅堡 2楼
				1521:[[49, 80, 1500],],
				// 启程之间
				1522:[[25, 24, 1520],],
				// 召唤之间
				1530:[[3, 7, 1500],],
				// 召唤之间
				1533:[[3, 7, 1500],],
				// 召唤之间
				1534:[[3, 7, 1500],],
				// 召唤之间
				1535:[[3, 7, 1500],],
				// 召唤之间
				1536:[[3, 7, 1500],],
				// 召唤之间
				1537:[[3, 7, 1500],],
				// 饲养师之家
				1810:[[10, 17, 1000],],
				// 客房
				32830:[[2, 7, 1102]],
			},
		},
		'圣拉鲁卡村':{
			mainName : '圣拉鲁卡村',
			mainindex : 2300,
			minindex : 2300,
			maxindex : 2399,
			stoneNPCpos: [15, 3],
			mapTranslate:{
				'主地图' : 2300,
				'圣拉鲁卡村' : 2300,
				'装备品店':2301,
				'1楼小房间':2302,
				'地下工房':2303,
				'食品店':2306,
				'酒吧':2308,
				'医院':2310,
				'医院 2楼':2311,
				'村长的家':2312,
				'村长的家 2楼':2313,
				'民家':2320,//民家，学强力风刃魔法
				'传送石':2399
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2300:[],
				// 装备品店
				2301:[[32, 70, 2301],],
				// 1楼小房间
				2302:[[32, 70, 2301],[14, 4, 2302],],
				// 地下工房
				2303:[[32, 70, 2301],[14, 4, 2302],[9, 3, 2303],],
				// 食品店
				2306:[[50, 64, 2306],],
				// 赛杰利亚酒吧
				2308:[[39, 70, 2308],],
				// 医院
				2310:[[37, 50, 2310],],
				// 医院 2楼
				2311:[[37, 50, 2310],[14, 11, 2311],],
				// 村长的家
				2312:[[49, 81, 2312],],
				// 村长的家 2楼
				2313:[[49, 81, 2312],[6, 14, 2313],],
				// 传送石
				2399:[[49, 81, 2312],[8, 10, 2399],],
			},
			walkReverse:{
				// 装备品店
				2301:[[19, 15, 2300],],
				// 1楼小房间
				2302:[[11, 5, 2301],[19, 15, 2300],],
				// 地下工房
				2303:[[23, 4, 2302],[11, 5, 2301],[19, 15, 2300],],
				// 食品店
				2306:[[1, 8, 2300]],
				// 赛杰利亚酒吧
				2308:[[2, 9, 2300]],
				// 医院
				2310:[[1, 9, 2300]],
				// 医院 2楼
				2311:[[14, 12, 2310]],
				// 村长的家
				2312:[[2, 9, 2300],],
				// 村长的家 2楼
				2313:[[7, 8, 2312],],
				// 传送石
				2399:[[7, 3, 2312],],
			},
		},
		'伊尔村':{
			mainName : '伊尔村',
			mainindex : 2000,
			minindex : 2000,
			maxindex : 2099,
			stoneNPCpos: [21, 10],
			mapTranslate:{
				'主地图' : 2000,
				'伊尔村' : 2000,
				'装备店' : 2001,
				'酒吧' : 2002,
				'旧金山酒吧' : 2002,
				'医院' : 2010,
				'村长的家' : 2012,
				'泰勒的家' : 2013,
				'巴侬的家' : 2014,
				'传送石':2099,
				'伊尔':33219,
				'港湾管理处':33214,
				'往阿凯鲁法栈桥':40001,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2000:[],
				// 装备店
				2001:[[35, 25, 2001],],
				// 酒吧
				2002:[[32, 65, 2008],],
				// 医院
				2010:[[52, 39, 2010],],
				// 村长的家
				2012:[[47, 83, 2012],],
				// 泰勒的家
				2013:[[35, 42, 2013],],
				// 巴侬的家
				2014:[[42, 72, 2014],],
				// 传送石
				2099:[[47, 83, 2012],[14, 17, 2099],],
				// 伊尔
				33219:(r)=>{
					var nowindex = cga.GetMapIndex().index3
					if (nowindex == 2000){
						cga.walkList([
							[58, 71],
						], ()=>{
							cga.turnTo(60, 71);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'伊尔'}, r);
							}, 1000);	
						});
					}else{
						cga.travel.autopilot('伊尔村',()=>{
							cga.travel.autopilot(33219,r)
						})
					}
				},
				// 港湾管理处
				33214:(r)=>{
					var nowindex = cga.GetMapIndex().index3
					if (nowindex == 2000){
						cga.walkList([
							[58, 71],
						], ()=>{
							cga.turnTo(60, 71);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'伊尔'}, ()=>{
									cga.walkList([
										[30, 21, 33214],
									], r);
								});
							}, 1000);	
						});
					}else{
						cga.travel.autopilot('伊尔村',()=>{
							cga.travel.autopilot(33214,r)
						})
					}
				},
				// 往阿凯鲁法栈桥
				40001:(r)=>{
					var nowindex = cga.GetMapIndex().index3
					if (nowindex == 2000){
						cga.walkList([
							[58, 71],
						], ()=>{
							cga.turnTo(60, 71);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'伊尔'}, ()=>{
									cga.walkList([
										[30, 21, 33214],
										[23, 25],
									], ()=>{
										cga.TurnTo(23, 23);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(32, -1);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(4, -1);
												cga.AsyncWaitMovement({map:'往阿凯鲁法栈桥'}, r);
											});
										});
									});
								});
							}, 1000);	
						});
					}else{
						cga.travel.autopilot('伊尔村',()=>{
							cga.travel.autopilot(40001,r)
						})
					}
				},
			},
			walkReverse:{
				// 装备店
				2001:[[5, 13, 2000],],
				// 酒吧
				2002:[[7, 19, 2000],],
				// 医院
				2010:[[14, 20, 2000],],
				// 村长的家
				2012:[[6, 13, 2000]],
				// 泰勒的家
				2013:[[9, 16, 2000],],
				// 巴侬的家
				2014:[[2, 9, 2000],],
				// 传送石
				2099:[[12, 17, 2012],],
				// 伊尔
				33219:(r)=>{
					cga.walkList([
						[24, 19],
					], ()=>{
						cga.turnTo(24, 17);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitMovement({map:'伊尔村'}, r);
						}, 1000);	
					});
				},
				// 港湾管理处
				33214:[[9, 22, 33219],],
				// 往阿凯鲁法栈桥
				40001:(r)=>{
					cga.walkList([
						[19, 55],
					], ()=>{
						cga.TurnTo(19, 53);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitMovement({map:'港湾管理处'}, r);
						});
					});
				}
			},
		},
		'亚留特村':{
			mainName : '亚留特村',
			mainindex : 2400,
			minindex : 2400,
			maxindex : 2499,
			stoneNPCpos: [5, 14],
			mapTranslate:{
				'主地图' : 2400,
				'伊尔村' : 2400,
				'杂货店' : 2401,
				'医院' : 2410,
				'村长的家' : 2412,
				'民家' : 2420,
				'南希的家' : 2421,
				'传送石':2499,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2400:[],
				// 杂货店
				2401:[[37, 44, 2401],],
				// 医院
				2410:[[52, 63, 2410],],
				// 村长的家
				2412:[[56, 48, 2412],],
				// 民家
				2420:[[48, 37, 2420],],
				// 南希的家
				2421:[[31, 54, 2421],],
				// 传送石
				2499:[[56, 48, 2412],[22, 9, 2499],],
			},
			walkReverse:{
				// 杂货店
				2401:[[15, 22, 2400],],
				// 医院
				2410:[[2, 9, 2400],],
				// 村长的家
				2412:[[6, 13, 2400]],
				// 民家
				2420:[[9, 16, 2400],],
				// 南希的家
				2421:[[2, 9, 2400],],
				// 传送石
				2499:[[8, 3, 2412],],
			},
		},
		'维诺亚村':{
			mainName : '维诺亚村',
			mainindex : 2100,
			minindex : 2100,
			maxindex : 2199,
			stoneNPCpos: [5, 4],
			mapTranslate:{
				'主地图' : 2100,
				'维诺亚村' : 2100,
				'装备品店' : 2101,
				'医院' : 2110,
				'医院2楼' : 2111,
				'村长的家' : 2112,
				'糖店' : 2113,//卖糖NPCpos[12,6]，人物购买点[11,6]
				'荷特尔咖哩店' : 2120,
				'民家' : 2121,
				'村长家的小房间' : 2198,
				'传送石':2199
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2100:[],
				// 装备品店
				2101:[[62, 42, 2101],],
				// 医院
				2110:[[61, 53, 2110],],
				// 医院2楼
				2111:[[61, 53, 2110],[6, 14, 2111],],
				// 村长的家
				2112:[[40, 36, 2112],],
				// 糖店
				2113:[[40, 36, 2112],[18, 10, 2198],[9, 5, 2113],],
				// 荷特尔咖哩店
				2120:[[49, 58, 2120],],
				// 民家
				2121:[[37, 52, 2121],],
				// 村长家的小房间
				2198:[[40, 36, 2112],[18, 10, 2198],],
				// 传送石
				2199:[[40, 36, 2112],[18, 10, 2198],[8, 2, 2199],],
			},
			walkReverse:{
				// 装备品店
				2101:[[19, 17, 2100],],
				// 医院
				2110:[[2, 9, 2100],],
				// 医院2楼
				2111:[[9, 12, 2110],],
				// 村长的家
				2112:[[9, 16, 2100],],
				// 糖店
				2113:[[3, 11, 2198]],
				// 荷特尔咖哩店
				2120:[[3, 9, 2100]],
				// 民家
				2121:[[3, 9, 2100]],
				// 村长家的小房间
				2198:[[0, 5, 2112]],
				// 传送石
				2199:[[5, 1, 2198],],
			},
		},
		'奇利村':{
			mainName : '奇利村',
			mainindex : 3200,
			minindex : 3200,
			maxindex : 3299,
			stoneNPCpos: [13, 8],
			mapTranslate:{
				'主地图' : 3200,
				'奇利村' : 3200,
				'装备品店' : 3201,
				'杂货店' : 3202,
				'酒吧' : 3208,
				'医院' : 3210,
				'村长的家' : {
					3212:'村长主客厅',
					3213:'村长左手边屋子',
					3214:'村长右手边屋子，通往传送石',
				},
				// 诱拐任务相关
				'民家' : 3220,
				// 诱拐任务相关
				'老夫妇的家' : 3221,
				'传送石':3299
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				3200:[],
				// 装备品店
				3201:[[66, 77, 3201],],
				// 杂货店
				3202:[[66, 77, 3201],[23, 14, 3202],],
				// 酒吧
				3208:[[46, 78, 3208],],
				// 医院
				3210:[[64, 56, 3210],],
				// 民家
				3220:[[71, 63, 3220],],
				// 老夫妇的家
				3221:[[50, 54, 3221],],
				// 村长的家
				3212:[[50, 63, 3212],],
				// 村长的家
				3213:[[50, 63, 3212],[10, 2, 3213],],
				// 村长的家
				3214:[[50, 63, 3212],[10, 15, 3214],],
				// 传送石
				3299:[[50, 63, 3212],[10, 15, 3214],[5, 3, 3299],],
			},
			walkReverse:{
				// 装备品店
				3201:[[12, 14, 3200],],
				// 杂货店
				3202:[[13, 12, 3201],],
				// 酒吧
				3208:[[2, 3, 3200],],
				// 医院
				3210:[[3, 9, 3200],],
				// 民家
				3220:[[3, 9, 3200],],
				// 老夫妇的家
				3221:[[9, 15, 3200],],
				// 村长的家
				3212:[[1, 8, 3200]],
				// 村长的家
				3213:[[7, 13, 3212]],
				// 村长的家
				3214:[[7, 1, 3212]],
				// 传送石
				3299:[[7, 6, 3214],],
			},
		},
		'加纳村':{
			mainName : '加纳村',
			mainindex : 3000,
			minindex : 3000,
			maxindex : 3099,
			stoneNPCpos: [15, 7],
			mapTranslate:{
				'主地图' : 3000,
				'加纳村' : 3000,
				'装备品店' : 3001,
				'杂货店' : 3002,
				'酒吧' : 3008,
				'医院' : 3010,
				'村长的家' : {
					3012:'村长主客厅',
					3013:'村长左手边屋子',
					3014:'村长右手边屋子',
				},
				'传承者之家' : 3021,
				'传送石':3099,
				'井的底部':5005,
				'希尔薇亚的家':5006,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				3000:[],
				// 装备品店
				3001:[[63, 61, 3001],],
				// 杂货店
				3002:[[63, 61, 3001],[24, 14, 3002],],
				// 酒吧
				3008:[[51, 34, 3008],],
				// 医院
				3010:[[52, 72, 3010],],
				// 村长的家
				3012:[[36, 40, 3012],],
				// 村长的家
				3013:[[36, 40, 3012],[10, 16, 3013],],
				// 村长的家
				3014:[[36, 40, 3012],[10, 3, 3014],],
				// 传承者之家
				3021:[[34, 53, 3021],],
				// 传送石
				3099:[[36, 40, 3012],[17, 6, 3099],],
				// 井的底部
				5005:[[(cb)=>{
					cga.walkList(
						[[53, 56]], ()=>{
							cga.turnTo(53, 55);
							cga.AsyncWaitMovement({map:'井的底部', delay:1000, timeout:5000}, cb);
						});
				}, null, 5005],],
				// 希尔薇亚的家
				5006:[[(cb)=>{
					cga.walkList(
						[[53, 56]], ()=>{
							cga.turnTo(53, 55);
							cga.AsyncWaitMovement({map:'井的底部', delay:1000, timeout:5000}, cb);
						});
				}, null, 5005],[18, 14, 5006]],
			},
			walkReverse:{
				// 装备品店
				3001:[[13, 14, 3000],],
				// 杂货店
				3002:[[13, 11, 3001],],
				// 酒吧
				3008:[[3, 3, 3000],],
				// 医院
				3010:[[3, 9, 3000],],
				// 村长的家
				3012:[[1, 9, 3000]],
				// 村长的家
				3013:[[7, 1, 3012]],
				// 村长的家
				3014:[[7, 13, 3012]],
				// 传承者之家
				3021:[[9, 15, 3000],],
				// 传送石
				3099:[[5, 12, 3012],],
				// 井的底部
				5005:[[5, 4, 3000],],
				// 希尔薇亚的家
				5006:[[7, 10, 5005],],
			},
		},
		'杰诺瓦镇':{
			mainName : '杰诺瓦镇',
			mainindex : 4000,
			minindex : 4000,
			maxindex : 4099,
			stoneNPCpos: [7, 7],
			mapTranslate:{
				'主地图' : 4000,
				'杰诺瓦镇' : 4000,
				'杂货店' : 4001,
				'装备品店' : 4002,
				'酒吧' : 4008,
				'酒吧的地下室' : 4009,
				'客房' : {
					4021:'咒术师德托拉',
					4022:'空房间',
				},
				'医院' : 4010,
				'医院2楼' : 4011,
				'村长的家' : {
					4012:'村长主客厅',
					4013:'村长右手边屋子，空房间',
				},
				// 起司的任务相关
				'民家' : 4020,
				'传送石':4099,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4000:[],
				// 杂货店
				4001:[[43, 23, 4001],],
				// 装备品店
				4002:[[43, 23, 4001],[9, 6, 4002],],
				// 酒吧
				4008:[[48, 53, 4008],],
				// 酒吧的地下室
				4009:[[48, 53, 4008],[19, 6, 4009],],
				// 医院
				4010:[[44, 33, 4010],],
				// 医院2楼
				4011:[[44, 33, 4010],[15, 13, 4011],],
				// 民家
				4020:[[38, 59, 4020]],
				// 客房
				4021:[[48, 53, 4008],[19, 6, 4009],[3, 13, 4021],],
				// 客房
				4022:[[48, 53, 4008],[19, 6, 4009],[3, 5, 4022],],
				// 村长的家
				4012:[[58, 43, 4012],],
				// 村长的家
				4013:[[58, 43, 4012],[15, 16, 4013],],
				// 传送石
				4099:[[58, 43, 4012],[13, 7, 4099],],
			},
			walkReverse:{
				// 杂货店
				4001:[[9, 16, 4000],],
				// 装备品店
				4002:[[7, 4, 4001],],
				// 酒吧
				4008:[[4, 9, 4000],],
				// 酒吧的地下室
				4009:[[8, 4, 4008],],
				// 医院
				4010:[[1, 9, 4000],],
				// 医院2楼
				4011:[[15, 11, 4010],],
				// 村长的家
				4012:[[1, 9, 4000]],
				// 村长的家
				4013:[[7, 1, 4012]],
				// 民家
				4020:[[1, 10, 4000]],
				// 客房
				4021:[[12, 6, 4009],],
				// 客房
				4022:[[12, 6, 4009],],
				// 传送石
				4099:[[14, 6, 4012],],
			},
		},
		'蒂娜村':{
			mainName : '蒂娜村',
			mainindex : 4200,
			minindex : 4200,
			maxindex : 4299,
			stoneNPCpos: [6, 5],
			mapTranslate:{
				'主地图' : 4200,
				'蒂娜村' : 4200,
				'酒吧' : 4208,
				'医院' : 4210,
				'医院2楼' : 4211,
				'村长的家' : {
					4212:'村长家走廊',
					4213:'村长家客厅',
					4214:'传送石前面的屋子',
				},
				'民家' : 4220,
				'传送石':4299,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4200:[],
				// 酒吧
				4208:[[46, 56, 4208],],
				// 医院
				4210:[[34, 25, 4210],],
				// 医院2楼
				4211:[[34, 25, 4210],[15, 13, 4211],],
				// 村长的家
				4212:[[29, 60, 4212],],
				// 村长的家
				4213:[[29, 60, 4212],[9, 6, 4213],],
				// 村长的家
				4214:[[29, 60, 4212],[9, 6, 4213],[7, 12, 4214],],
				// 民家
				4220:[[35, 37, 4220]],
				// 传送石
				4299:[[29, 60, 4212],[9, 6, 4213],[7, 12, 4214],[12, 6, 4299],],
			},
			walkReverse:{
				// 酒吧
				4208:[[6, 7, 4200],],
				// 医院
				4210:[[1, 9, 4200],],
				// 医院2楼
				4211:[[15, 11, 4210],],
				// 村长的家
				4212:[[1, 6, 4200]],
				// 村长的家
				4213:[[1, 6, 4212]],
				// 村长的家
				4214:[[7, 1, 4213]],
				// 民家
				4220:[[1, 10, 4200]],
				// 传送石
				4299:[[11, 2, 4214],],
			},
		},
		'夜晚蒂娜村':{//主地图4201的33，25处有1级绿鬼捕捉点
			mainName : '蒂娜村',
			mainindex : 4201,
			minindex : 4201,
			maxindex : 4299,
			mapTranslate:{
				'主地图' : 4201,
				'蒂娜村' : 4201,
				'夜晚蒂娜村' : 4201,
				'酒吧' : 4230,
				'村长的家' : {
					4212:'村长主客厅',
					4213:'村长右手边屋子，空房间',
				},
				'传送石':4299,
				'海贼指挥部' : 14018,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4201:[],
				// 酒吧
				4230:[[46, 56, 4230],],
				// 村长的家
				4212:[[58, 43, 4212],],
				// 村长的家
				4213:[[58, 43, 4212],[15, 16, 4213],],
				// 传送石
				4299:[[29, 60, 4212],[9, 6, 4213],[7, 12, 4214],[12, 6, 4299],],
				// 海贼指挥部
				14018:(r)=>{
					var nowindex = cga.GetMapIndex().index3
					if (nowindex == 4230){
						cga.walkList([
							[22, 11],
						], ()=>{
							cga.turnTo(22, 13);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitMovement({map:14018}, r);
							}, 1000);	
						});
					}else{
						cga.travel.autopilot('夜晚蒂娜村',()=>{
							cga.travel.autopilot(4230,()=>{
								cga.travel.autopilot(14018,r)
							})
						})
					}
				},
			},
			walkReverse:{
				// 酒吧
				4230:[[6, 7, 4201],],
				// 村长的家
				4212:[[1, 9, 4200]],
				// 村长的家
				4213:[[7, 1, 4212]],
				// 传送石
				4299:[[14, 6, 4212],],
			},
		},
		'阿巴尼斯村':{
			mainName : '阿巴尼斯村',
			mainindex : 4300,
			minindex : 4300,
			maxindex : 4399,
			stoneNPCpos: [5, 15],
			mapTranslate:{
				'主地图' : 4300,
				'阿巴尼斯村' : 4300,
				'酒吧' : 4308,
				'酒吧的地下室' : 4309,
				'客房' : {
					4321:'空房间',
					4322:'也是空房间',
				},
				'医院' : 4310,
				'村长的家' : {
					4312:'村长家走廊',
					4313:'村长的屋子',
				},
				'民家' : 4320,
				'传送石':4399,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4300:[],
				// 酒吧
				4308:[[67, 64, 4308],],
				// 酒吧的地下室
				4309:[[67, 64, 4308],[11, 14, 4309],],
				// 医院
				4310:[[47, 64, 4310],],
				// 民家
				4320:[[38, 59, 4320]],
				// 客房
				4321:[[67, 64, 4308],[11, 14, 4309],[12, 4, 4321],],
				// 客房
				4322:[[67, 64, 4308],[11, 14, 4309],[7, 4, 4322],],
				// 村长的家
				4312:[[36, 54, 4312],],
				// 村长的家
				4313:[[36, 54, 4312],[6, 5, 4313],],
				// 民家
				4320:[[40, 30, 4320],],
				// 传送石
				4399:[[36, 54, 4312],[6, 5, 4313],[9, 9, 4399],],
			},
			walkReverse:{
				// 酒吧
				4308:[[5, 8, 4300],],
				// 酒吧的地下室
				4309:[[5, 7, 4308],],
				// 医院
				4310:[[1, 8, 4300],],
				// 村长的家
				4312:[[6, 13, 4300]],
				// 村长的家
				4313:[[6, 13, 4312]],
				// 民家
				4320:[[11, 17, 4300]],
				// 客房
				4321:[[7, 12, 4309],],
				// 客房
				4322:[[7, 12, 4309],],
				// 传送石
				4399:[[5, 4, 4313],],
			},
		},
		'魔法大学':{
			mainName : '魔法大学',
			mainindex : 4400,
			minindex : 4400,
			maxindex : 4499,
			mapTranslate:{
				'主地图' : 4400,
				'魔法大学' : 4400,
				// 说话选【是】，可以进到牢房，里面有19级左右史莱姆
				'实验室' : 4401,
				'地下实验室' : 4402,
				'青龙的洞窟 1楼' : 4403,
				'魔法大学内部' : 4410,
				// 魔法大学内部即为补给处，这里自定义为医院，用于cga.tohospital()
				'医院' : 4410,
				// 幻之钢、幻之银压条。木材、矿石换钱
				'技术室' : 4411,
				// 6级、8级布
				'更衣室' : 4412,
				// 只能卖给NPC物品，猜测是狩猎物品
				'调理室' : 4413,
				// 三转的第一个房间，无法直接进入，必须做任务。可以走出去，传送至魔法大学内部。
				'教室' : 4415,
				'教师室' : 4416,
				'音乐室' : 4417,
				'礼堂' : 4418,
				'学长室' : 4419,
				'保健室' : 4420,
				// 三转的晋级资格对话房间，无法直接进入，必须做任务。可以走出去，传送至礼堂。
				'合格房间' : 4421,
				'家畜小屋' : {
					4422:'空房子',
					4423:'也是空房子',
					4424:'还是空房子',
				},
				// 里面有僵尸可以拿到调音器，估计是任务
				'夜晚音乐室' : 4431,
				// 18,9处（玩家站立18,10处）购买魔法手套。由于另外4个仓库内部的房子里面没有有用的NPC，故省略
				'仓库内部' : 4455,
				'地底湖 地下1楼' : 4456,
				'地底湖 地下2楼' : 4457,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4400:[],
				// 实验室
				4401:[[133, 49, 4401],],
				// TODO地下实验室，需要对话才可进入
				4402:[],
				// 青龙的洞窟 1楼
				4403:[[106, 54, 4403],],
				// 魔法大学内部
				4410:[[75, 93, 4410],],
				// 技术室
				4411:[[75, 93, 4410],[50, 43, 4411],],
				// 更衣室
				4412:[[75, 93, 4410],[29, 43, 4412],],
				// 调理室
				4413:[[75, 93, 4410],[14, 43, 4413],],
				// 教师室
				4416:[[75, 93, 4410],[4, 30, 4416],],
				// 音乐室
				4417:[[75, 93, 4410],[76, 30, 4417],],
				// 礼堂
				4418:[[75, 93, 4410],[44, 17, 4418],],
				// 学长室
				4419:[[75, 93, 4410],[44, 17, 4418],[4, 9, 4419],],
				// 保健室
				4420:[[75, 93, 4410],[44, 17, 4418],[24, 9, 4420],],
				// 家畜小屋
				4422:[[55, 140, 4422],],
				// 家畜小屋
				4423:[[55, 147, 4423],],
				// 家畜小屋
				4424:[[55, 154, 4424],],
				// 夜晚音乐室
				4431:[[75, 93, 4410],[76, 30, 4431],],
				// 仓库内部
				4455:[[117, 164, 4455],],
				// 地底湖 地下1楼
				4456:[[(cb)=>{
					cga.walkList(
						[[36, 31]], ()=>{
							cga.turnTo(36, 29);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({map:'地底湖 地下1楼'}, cb);
								});
							})
						});
				}, null, 4456],],
				// 地底湖 地下2楼
				4457:[[(cb)=>{
					cga.walkList(
						[[36, 31]], ()=>{
							cga.turnTo(36, 29);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({map:'地底湖 地下1楼'}, cb);
								});
							})
						});
				}, null, 4456],[6, 23, 4457]],
			},
			walkReverse:{
				// 实验室
				4401:[[5, 14, 4400],],
				// 地下实验室
				4402:[[22, 7, 4401],],
				// 青龙的洞窟 1楼
				4403:[[24, 49, 4400],],
				// 魔法大学内部
				4410:[[40, 59, 4400],],
				// 技术室
				4411:[[7, 18, 4410],],
				// 更衣室
				4412:[[14, 18, 4410],],
				// 调理室
				4413:[[12, 18, 4410],],
				// 教室
				4415:[[29, 9, 4410],],
				// 教师室
				4416:[[15, 25, 4410],],
				// 音乐室
				4417:[[15, 25, 4410],],
				// 礼堂
				4418:[[15, 32, 4410],],
				// 学长室
				4419:[[17, 4, 4418],],
				// 保健室
				4420:[[3, 4, 4418],],
				// 合格房间
				4421:[[10, 2, 4418],],
				// 家畜小屋
				4422:[[7, 16, 4400],],
				// 家畜小屋
				4423:[[7, 16, 4400],],
				// 家畜小屋
				4424:[[6, 16, 4400],],
				// 夜晚音乐室
				4431:[[15, 25, 4410],],
				// 仓库内部
				4455:[[6, 14, 4400],],
				// 地底湖 地下1楼
				4456:[[10, 32, 4400],],
				// 地底湖 地下2楼
				4457:[[(cb)=>{
					var xy = cga.GetMapXY();
					if(xy.x >= 34 && xy.x <= 41 && xy.y >= 47 && xy.y <= 51){
						cga.walkList(
							[[38, 51]], ()=>{
								cga.turnDir(2);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({x : 38, y : 54}, ()=>{
										cga.walkList([
										[14, 5,4456],
										], cb);
									});
								})
							});
					}else{
						cga.walkList([
							[14, 5,4456],
							], cb);
					}
				}, null, 4456],],
			},
		},
		'曙光骑士团营地':{
			mainName : '曙光骑士团营地',
			mainindex : 27001,
			minindex : 27001,
			maxindex : 27999,
			mapTranslate:{
				'主地图' : 27001,
				'曙光骑士团营地' : 27001,
				'曙光储备室':27011,
				'曙光营地医院':27012,
				'医院':27012,
				// mapindex是唯一索引，TODO寻找同一index不同pos的索引方法
				// '曙光营地医院 2楼':27012,
				'酒吧':27013,
				'曙光营地酒吧':27013,
				'辛希亚探索指挥部':{
					// 一楼二楼是一个index
					27014:'一楼',
					27014:'二楼',
					27101:'传送石',
				},
				// 三个房间都是27015
				'曙光营地指挥部':27015,
				'传送石':2399
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				27001:[],
				// 曙光储备室
				27011:[[44, 49, 27011],],
				// 曙光营地医院
				27012:[[42, 56, 27012],],
				// // 曙光营地医院 2楼
				// 27012:[[42, 56, 27012],[15, 12, 27012],],
				// 曙光营地酒吧
				27013:[[55, 58, 27012]],
				// 曙光营地指挥部
				27015:[[52, 67, 27015]],
				// 传送石
				27101:[[55, 47, '辛希亚探索指挥部'],[7,4, '辛希亚探索指挥部', 91, 6],[95,9, 27101],],
			},
			walkReverse:{
				// 曙光储备室
				27011:[[12, 22, 27001],],
				// 曙光营地医院
				27012:[[1, 8, 27001],],
				// 曙光营地酒吧
				27013:[[4, 19, 27001],],
				// 辛希亚探索指挥部
				27014:[[(cb)=>{
					var XY = cga.GetMapXY();
					if(XY.x > 50){
						cga.walkList([[91, 6, '辛希亚探索指挥部',7, 4],], cb);
						return
					}else{
						cga.walkList([[1, 10, 27001],], cb);
						return
					}
				}, null, 27001],],
				// 曙光营地指挥部
				27015:[[(cb)=>{
					var XY = cga.GetMapXY();
					if(XY.x > 80){
						cga.walkList([[85, 2, '曙光营地指挥部',69, 69],], cb);
						return
					}else if(XY.x > 40){
						cga.walkList([[53, 80, 27001],], cb);
						return
					}else{// TODO x<40还有一个房间，暂时没去过
						cga.walkList([[85, 2, '曙光营地指挥部',69, 69],], cb);
						return
					}
				}, null, 27001],],
				// 传送石
				27101:[[19, 28, 27014],],
			},
		},
		'圣骑士营地':{
			mainName : '圣骑士营地',
			mainindex : 44690,
			minindex : 44690,
			maxindex : 44699,
			mapTranslate:{
				'主地图' : 44690,
				'酒吧' : 44691,
				'医院' : 44692,
				'工房' : 44693,
				'总部1楼' : 44694,
				'银行' : 44698,
				'商店' : 44699,// 水晶封印卡talkpos14,26，dir0；鉴定talkpos14,16，dir0
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				44690:[],
				// 酒吧
				44691:[[116, 55, 44691],],
				// 医院
				44692:[[95, 72, 44692],],
				// 工房
				44693:[[87, 72, 44693],],
				// 总部1楼
				44694:[[116, 69, 44694],],
				// 银行
				44698:[[116, 105, 44698],],
				// 商店
				44699:[[92, 118, 44699],],
			},
			walkReverse:{
				// 酒吧
				44691:[[0, 23, 44690],],
				// 医院
				44692:[[0, 20, 44690],],
				// 工房
				44693:[[30, 37, 44690],],
				// 总部1楼
				44694:[[4, 47, 44690],],
				// 银行
				44698:[[3, 23, 44690],],
				// 商店
				44699:[[0, 14, 44690],],
			},
		},
		'哥拉尔镇':{
			mainName : '哥拉尔镇',
			mainindex : 43100,
			minindex : 43100,
			maxindex : 43999,
			mapTranslate:{
				'主地图' : 43100,
				'医院' : 43110,
				'银行' : 43125,
				'宠物商店' : 43145,
				'杂货店' : 43165,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				43100:[],
				// 医院
				43110:[[165, 90, 43110],],
				// 银行
				43125:[[167, 66, 43125],],
				// 宠物商店
				43145:[[109, 80, 43145],],
				// 杂货店
				43165:[[147, 79, 43165],],
			},
			walkReverse:{
				// 医院
				43110:[[9, 22, 43100],],
				// 银行
				43125:[[11, 12, 43100],],
				// 宠物商店
				43145:[[18, 30, 43100],],
				// 杂货店
				43165:[[18, 30, 43100],],
			},
		},
		'艾尔莎岛':{
			mainName : '艾尔莎岛',
			mainindex : 59520,
			minindex : 59520,
			maxindex : 59599,
			mapTranslate:{
				'主地图' : 59520,
				'神殿　伽蓝' : 59530,
				'医院' : 59530,
				'银行' : 59548,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				59520:[],
				// 神殿　伽蓝
				59530:[[201, 96, 59530],],
				// 银行
				59548:[[(cb)=>{
					cga.walkList([
						[158, 94],
					], ()=>{
						cga.turnTo(158, 93);
						cga.AsyncWaitMovement({map:'艾夏岛'}, ()=>{
							cga.travel.autopilot('银行',cb)
						});
					});
				}, null, 59548],],
			},
			walkReverse:{
				// 神殿　伽蓝
				59530:[[59, 95, 59520],],
				// 银行
				59548:[[(cb)=>{
					cga.travel.autopilot('主地图',cb)
				}, null, 59548],],
			},
		},
		'艾夏岛':{
			mainName : '艾尔莎岛',
			mainindex : 59521,
			minindex : 59521,
			maxindex : 59999,
			mapTranslate:{
				'主地图' : 59521,
				'银行' : 59548,
				'冒险者旅馆' : 59538,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				59521:[],
				// 冒险者旅馆
				59538:[[102, 115, 59538],],
				// 银行
				59548:[[114, 104, 59548],],
			},
			walkReverse:{
				// 冒险者旅馆
				59538:[[38, 48, 59521],],
				// 银行
				59548:[[27, 34, 59521],],
			},
		},
		/**
		 * UNAecho:将利夏岛与雪拉威森塔整合在一起，变为利夏岛。
		 * 雪拉威森塔每层的index是有顺序的，不是随机迷宫
		 * index598开头，第**层就是598**。如：第1层59801，第10层59810，第25层59825。
		 * 只有1层和每5层有传送石，其他层没有。
		 * 95层（含）以前无限制95通往96层，需要4转及以上才能通过。
		 * 96-99层的模式是：96层开始NPC给你一个护身符，双击回到此NPC处，交给下一层NPC，传送至下一层
		 * 99-100层也是一样，100层是顶层，可以拿王冠、公主头冠、小猫帽
		 * 相关任务：圣域守护者
		 * 王冠可以飞辛梅尔，公主头冠飞丘斯特村，小猫帽是人物技能加成
		 * 支线任务：迷之箱
		 * 雪拉威森塔96~100楼会随机触发BOSS战
		 * 击倒奇美拉类BOSS后随机获得【奇美拉的羽毛】
		 * 击倒海怪类BOSS后随机获得【龙的鳞片】
		 * 击倒死神随机获得【迷语箱4】，击倒海怪类的BOSS随机获得【谜语箱1】，双击后随机获得奖品
		 */
		'利夏岛':{
			mainName : '利夏岛',
			mainindex : 59522,
			minindex : 59801,
			maxindex : 59553,
			mapTranslate:{
				'主地图' : 59522,
				'国民会馆' : 59552,
				'竞技场' : 59553,
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 雪拉威森塔各楼层
				59801:[[90, 99, 59552],[108, 39, 59801],],
				59810:[[90, 99, 59552],[108, 39, 59801],[76, 58, 59810],],
				59815:[[90, 99, 59552],[108, 39, 59801],[76, 56, 59815],],
				59820:[[90, 99, 59552],[108, 39, 59801],[76, 54, 59820],],
				59825:[[90, 99, 59552],[108, 39, 59801],[76, 52, 59825],],
				59830:[[90, 99, 59552],[108, 39, 59801],[72, 60, 59830],],
				59835:[[90, 99, 59552],[108, 39, 59801],[72, 58, 59835],],
				59840:[[90, 99, 59552],[108, 39, 59801],[72, 56, 59840],],
				59845:[[90, 99, 59552],[108, 39, 59801],[72, 54, 59845],],
				59850:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],],
				59855:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[27, 55, 59855],],
				59860:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[25, 55, 59860],],
				59865:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[23, 55, 59865],],
				59870:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[21, 55, 59870],],
				59875:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[24, 44, 59875],],
				59880:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[22, 44, 59880],],
				59885:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[20, 44, 59885],],
				59889:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[18, 44, 59890],[59, 50, 59889],],
				59890:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[18, 44, 59890],],
				59895:[[90, 99, 59552],[108, 39, 59801],[75, 50, 59850],[16, 44, 59895],],
				// 主地图
				59522:[],
				// 国民会馆
				59552:[[90, 99, 59552],],
				// 竞技场
				59553:[[90, 99, 59552],[108, 61, 59553],],
			},
			walkReverse:{
				// 国民会馆
				59552:[[97, 50, 59522],],
				// 竞技场
				59553:[[106, 50, 59552],],
				// 雪拉威森塔各楼层
				59801:[[33, 99, 59552],],
				59810:[[54, 38, 59801],],
				59815:[[137, 69, 59801],],
				59820:[[88, 146, 59801],],
				59825:[[95, 57, 59801],],
				59830:[[68, 33, 59801],],
				59835:[[104, 26, 59801],],
				59840:[[98, 95, 59801],],
				59845:[[98, 29, 59801],],
				59850:[[78, 59, 59801],],
				59855:[[133, 93, 59850],],
				59860:[[95, 144, 59850],],
				59865:[[118, 54, 59850],],
				59870:[[78, 55, 59850],],
				59875:[[137, 133, 59850],],
				59880:[[162, 122, 59850],],
				59885:[[58, 131, 59850],],
				59889:[[162, 93, 59890],],
				59890:[[61, 39, 59850],],
				59895:[[102, 44, 59850],],
			},
		},
	}
/**
 * UNA: 写了一个全自动导航的API，可以在城镇地图中任意一个地方去另一个任意的地方，无需登出。
 * 由于比较复杂，如果使用起来有问题，请联系yadhr582855555@hotmail.com来优化
 * @param {*} targetMap 目的地名称或者index3
 * @param {*} cb 回调
 * @returns 
 */
	cga.travel.autopilot = (targetMap, cb)=>{

		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 获取当前主地图名称
		var villageName = cga.travel.switchMainMap()
		// 目标地图index
		var targetindex = null
		// 仅在自定义地点时，此变量生效
		var customerPos = null
		// 所有静态信息
		const info = cga.travel.info[villageName]
		if(typeof targetMap == 'string'){
			targetindex = info.mapTranslate[targetMap]
			if(typeof targetindex == 'object'){
				var sayString = '【UNA脚本提示】您输入的【' + targetMap + '】存在多个，请选择';
				for(var i in targetindex){
					sayString += '['+ (parseInt(i)) + ']' + targetindex[i] + ',';
				}
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, val)=>{
					if(val !== null && val > 0 && val <= 99999){
						cga.travel.autopilot(val,cb)
						return false;
					}
					return true;
				});
				return
			}
		}else if(typeof targetMap == 'number'){
			targetindex = targetMap
		}else{
			cb(new Error('[UNA脚本警告]:targetMap[' + targetMap +']输入有误，必须输入目标地图名称或mapindex来索引'));
		}
		// 如果没找到地图，多数原因为主地图不同导致，比如在法兰城中搜索奇利村的mapindex。
		if(!targetindex || !info.walkForward[targetindex]){
			// 如果输入是number类型的地图，因为具有唯一性，这里进行全部地图信息遍历搜索，然后特殊处理。
			if(typeof targetindex == 'number'){
				let villages = Object.keys(cga.travel.info)
				for (let i = 0; i < villages.length; i++) {
					if(cga.travel.info[villages[i]].walkForward.hasOwnProperty(targetindex)){
						// 特殊切换，直接写成静态逻辑
						if((villageName == '艾尔莎岛' || villageName == '艾夏岛')&& villages[i] == '法兰城'){
							console.log('你输入的目标index并不存在于当前大地图区域，为你搜索到你的目的地为:【' + villages[i]+ '】')
							cga.travel.autopilot('主地图',()=>{
								cga.travel.falan.toStone('C', (r)=>{
									cga.travel.autopilot(targetMap,cb)
								});
							})
							return
						}

					}
				}
			}
			// 其他情况则抛异常
			throw new Error('[UNA脚本警告]:targetMap:[' + targetMap +']输入有误，请确认地图中是否有输入的名称地点。')
		}
		
		try {
			// 如果运行时，自己在队伍中，且是队员
			let teamplayers = cga.getTeamPlayers();
			if(teamplayers.length && teamplayers[0].name != cga.GetPlayerInfo().name){
				console.log('监测到你是队员，等待队长将自己带到指定index:' + targetindex)
				cga.waitForLocation({ mapindex: targetindex }, () => {
					console.log('抵达:' + targetindex)
					setTimeout(cb, 1000);
				});
				return
			}

			// 目标路径信息
			var targetPath = info.walkForward[targetindex]
			// 如果目标是自定义地点，更改targetindex为倒数第二个index，因为倒数第一个list是不切换地图的。
			if(typeof targetindex == 'string'){
				var walkListlength = info.walkForward[targetindex].length
				customerPos = info.walkForward[targetindex][walkListlength - 1]
				targetindex = info.walkForward[targetindex][walkListlength - 2][2]
			}
			// 自动导航路径
			var tmplist = null
			// 主逻辑分歧点
			if(mapindex == targetindex){
				// 如果是自定义地点
				var curPos = cga.GetMapXY();
				if (customerPos && (curPos.x != customerPos[0] || curPos.y != customerPos[1])){
					cga.walkList(
						[customerPos], cb);
					return
				}else{
					if (cb) cb(null)
					return
				}
			}else if(mapindex == info.mainindex){
				tmplist = targetPath
			}else{// 自动导航逻辑
				// 遍历寻找是否可以从当前地图直接走到目标地图
				for (let i = 0; i < targetPath.length; i++) {
					if(targetPath && targetPath[i][2] == mapindex){
						tmplist = targetPath.slice(i+1)
						break
					}
				}
			}
			// 如果上面for循环没找到前进路径，则递归回到主地图。
			if(tmplist == null){
				var backLogic = info.walkReverse[mapindex]
				if(!backLogic){
					console.error('错误，当前地图或上一层地图的链路，存在无法通过走路返回的情况，请登出')
					return
				}
				tmplist = backLogic.slice(0,1)
			}
			// 如果要执行function才能进入下一个地图，则执行方法并调用递归
			if(typeof tmplist[0][0] == 'function'){
				tmplist[0][0](()=>{
					cga.travel.autopilot(targetMap,cb)
				})
				return
			}else{
				// 遍历寻找找本次路径有没有自定义func，如果有，则截取至自定义func之前的walklist一口气走完，并调用递归。递归后会进入上面的if逻辑，执行自定义func。
				for (let i = 0; i < tmplist.length; i++) {
					if(tmplist && tmplist[i] && typeof tmplist[i][0] == 'function'){
						tmplist = tmplist.slice(0,i)
						break
					}
				}
			}
			// 递归逻辑
			cga.walkList(
				tmplist, ()=>{
					cga.travel.autopilot(targetMap,cb)
				});
		} catch (error) {
			console.log('[UNA脚本警告]:可能由于【输入不存在的地图index/名称】【地图未读取完毕】，导致错误。')
			console.error('targetMap:',targetMap)
			console.error('error:',error)
		}
		return
	}
	// UNA:添加全域自动导航至医院补给。isPro为true是去资深护士处补给，否则是普通护士补给
	cga.travel.toHospital = (cb, isPro = false)=>{
		// 不需要补血则跳过
		if(!cga.needSupplyInitial({  })){
			cga.travel.autopilot('主地图',()=>{
				if (cb) cb(null)
			})
			return
		}
		
		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 获取当前主地图名称
		var villageName = cga.travel.switchMainMap()
		// 法兰城直接在里谢里雅堡回补，效率高
		if(villageName == '法兰城'){
			cga.travel.falan.toStone('C', (r)=>{
				cga.walkList([
					[34, 89]
				], ()=>{
						cga.turnDir(7)
						setTimeout(() => {
							cga.travel.autopilot('主地图',()=>{
								if (cb) cb(null)
							})
						}, 5000);
						return
					}
				);
			});
			return
		}
		// 所有医院的cga.GetMapIndex().index3集合
		const hospitalList = [
			1111,
			1112,
			27012,
			2310,
			2010,
			2410,
			2110,
			3210,
			3010,
			4010,
			4210,
			4310,
			4410,
			43110,
			59530,
		] 
		if (hospitalList.indexOf(mapindex) == -1){
			cga.travel.autopilot('医院',()=>{
				cga.travel.toHospital(cb, isPro)
			})
			return
		}
		var tmplist = []
		var tmpTurnDir = null

		if(villageName == '圣拉鲁卡村'){
			tmplist.push(isPro == true ? [10, 3] : [15, 8])
			tmpTurnDir = isPro == true ? 0 : 6
		}else if(villageName == '伊尔村'){
			tmplist.push(isPro == true ? [18, 14] : [10, 15])
			tmpTurnDir = isPro == true ? 0 : 6
		}else if(villageName == '亚留特村'){
			tmplist.push(isPro == true ? [14, 9] : [10, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		}else if(villageName == '维诺亚村'){
			tmplist.push(isPro == true ? [15, 9] : [11, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		}else if(villageName == '奇利村'){
			tmplist.push(isPro == true ? [7, 2] : [11, 6])
			tmpTurnDir = isPro == true ? 0 : 6
		}else if(villageName == '加纳村'){
			tmplist.push(isPro == true ? [12, 14] : [9, 9])
			tmpTurnDir = 0
		}else if(villageName == '杰诺瓦镇'){
			tmplist.push(isPro == true ? [15, 9] : [10, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		}else if(villageName == '夜晚蒂娜村'){

		}else if(villageName == '蒂娜村'){
			tmplist.push(isPro == true ? [8, 5] : [12, 9])
			tmpTurnDir = isPro == true ? 0 : 6
		}else if(villageName == '阿巴尼斯村'){
			tmplist.push(isPro == true ? [14, 10] : [10, 6])
			tmpTurnDir = isPro == true ? 6 : 0
		}else if(villageName == '魔法大学'){
			tmplist.push(isPro == true ? [33, 48] : [35, 48])
			tmpTurnDir = 6
		}else if(villageName == '曙光骑士团营地'){
			tmplist.push(isPro == true ? [11, 8] : [7, 4])
			tmpTurnDir = isPro == true ? 6 : 0
		}else if(villageName == '法兰城'){

		}else if(villageName == '艾尔莎岛'){

		}else{
			throw new Error('[UNA脚本警告]:未知地图index，请联系作者更新。')
		}

		cga.walkList(
			tmplist, ()=>{
				cga.turnDir(tmpTurnDir)
				setTimeout(() => {
					cga.travel.autopilot('主地图',()=>{
						if (cb) cb(null)
						return
					})
				}, 5000);
				return
			}
		);
		return
	}
	// UNA: 在村镇开启传送石之后补给。isPro为true是去资深护士处补给
	cga.travel.saveAndSupply = (isPro, cb) => {
		// 准备保存开传状态
		var config = cga.loadPlayerConfig();
		if(!config){
			config = {};
		}
		
		var villageName = cga.travel.switchMainMap()

		// 魔法大学没有传送石，直接转为回补模式
		if(villageName == '魔法大学'){
			console.log('魔法大学没有传送点，跳过开启传送阶段。')
			cga.travel.toHospital(()=>{
				if (cb) cb(null)
				return
			}, isPro)
			return
		}
		
		// 如果已经开启过传送，则直接补给并结束函数
		if(config[villageName]){
			console.log('你已开启过【'+villageName+'】传送石，跳过开启传送阶段。')
			cga.travel.toHospital(()=>{
				if (cb) cb(null)
				return
			}, isPro)
			return
		}
		// 如果没开启过传送，则去开启并记录状态。
		const info = cga.travel.info[villageName]
		cga.travel.autopilot('传送石',()=>{
			cga.walkList(
				[cga.getRandomSpace(info.stoneNPCpos[0], info.stoneNPCpos[1])], ()=>{
					cga.TurnTo(info.stoneNPCpos[0], info.stoneNPCpos[1]);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg && (dlg.message.indexOf('金币') >= 0 || dlg.message.indexOf('欢迎') >= 0)){
							setTimeout(() => {
								// 如果开传成功，则记录状态
								config[villageName] = true
								cga.savePlayerConfig(config, ()=>{
									console.log('【'+villageName+'】传送石已开启，离线信息已记录完毕')
									// 记录之后去补给
									cga.travel.toHospital(()=>{
										if (cb) cb(null)
										return
									}, isPro)
								});
							}, 1000);
						}
					});
					return
				}
			);
		})
	}

	// 
	/**
	 * UNAecho:添加全域自动导航至银行，与柜员对话。// TODO 完善哥拉尔和阿凯鲁法银行
	 * @param {*} cb 打开银行界面后的回调函数，需要自定义传入
	 * @returns 
	 */
	cga.travel.toBank = (cb)=>{
		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 所有银行的cga.GetMapIndex().index3集合
		const bankList = [
			// 法兰城
			1121,
			// 哥拉尔
			43125,
			// 艾尔莎岛
			59548,
			// TODO 阿凯鲁法
		] 
		if (bankList.indexOf(mapindex) == -1){
			cga.travel.autopilot('银行',(err,reason)=>{
				if (err && err.message.indexOf('请确认地图中是否有输入的名称地点') != -1){
					console.log('当前地图区域没有银行，登出..')
					cga.logBack(()=>{
						cga.travel.autopilot('银行',(err,reason)=>{
							cga.travel.toBank(cb)
						})
					})
					return
				}
				cga.travel.toBank(cb)
			})
			return
		}
		var tmplist = []
		var tmpTurnDir = null

		var villageName = cga.travel.switchMainMap()
		if(villageName == '法兰城'){
			tmplist.push([11, 8])
			tmpTurnDir = 0
		}else if(villageName == '哥拉尔镇'){
			tmplist.push([25, 10])
			tmpTurnDir = 0
		}else if(villageName == '艾尔莎岛' || '艾夏岛'){
			tmplist.push([49, 25])
			tmpTurnDir = 0
		}else if(villageName == '阿凯鲁法村'){
			tmplist.push([20, 17])
			tmpTurnDir = 0
		}else{
			throw new Error('[UNA脚本警告]:未知地图index，请联系作者更新。')
		}

		cga.walkList(
			tmplist, ()=>{
				cga.turnDir(tmpTurnDir)
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(err && err.message.indexOf('timeout') > 0){
						cb(new Error('读取银行超时，请检查网络'))
					}else{
						cb(null)
					}
				});
				return
			}
		);
		return
	}

	cga.travel.isInVillage = () => {
		var villageArr = ['圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇','魔法大学','阿巴尼斯村','蒂娜村','曙光骑士团营地'] 
		var mainMapName = cga.travel.switchMainMap()
		if(villageArr.indexOf(mainMapName) != -1){
			return true
		}
		return false
	}
	
	/**
	 * 
	 * @param {*} villageName
	 * @param {*} cb 
	 * @param {*} finalVillage 
	 */
	cga.travel.toVillage = (villageName, cb, finalVillage = null) => {
		var config = cga.loadPlayerConfig();
		if(!config){
			config = {};
		}
		if(finalVillage){
			console.log('当前目标为【' + villageName+ '】，最终目标为【' + finalVillage + '】')
		}
		var mainMapName = cga.travel.switchMainMap()

		if(cga.needSupplyInitial({  })){
			console.log('人物没有满状态，先回补。')
			if(cga.travel.isInVillage()){
				cga.travel.toHospital(false,()=>{
					cga.travel.toVillage(villageName, cb, finalVillage)
				})
			}else{
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(() => {
						cga.travel.toVillage(villageName, cb, finalVillage)
					}, 2500);
				})
			}
			return
		}

		var villageArray = [
			['圣拉鲁卡村'],
			['伊尔村'],
			['维诺亚村', '奇利村', '加纳村'],
			['亚留特村'],
			['杰诺瓦镇', '蒂娜村'],
			['杰诺瓦镇', '阿巴尼斯村', '魔法大学'],
		]

		var tmpPath = null
		var tmpIndex = null

		for (var i = 0; i < villageArray.length; i++){
			for(var j = 0; j < villageArray[i].length; j++){
				if(villageArray[i][j] == villageName){
					tmpPath = villageArray[i]
					tmpIndex = j
					break
				}
			}
		}
		if(!tmpPath || tmpIndex === null){
			throw new Error('错误，请传入正确的村庄名称。你输入的村庄名称为【'+ villageName +'】')
		}

		var next = (cb) => {
			cga.travel.saveAndSupply(false, ()=>{
				if(finalVillage && villageName != finalVillage){
					console.log('抵达【' + villageName + '】，最终目标为【 ' + finalVillage + ' 】下一步前往【' + tmpPath[tmpIndex + 1] +'】。')
					cga.travel.toVillage(tmpPath[tmpIndex + 1], cb, finalVillage)
				}else{
					console.log('抵达【' + villageName + '】。')
					if (cb) cb(null)
				}
				return
			})
		}

		// 如果需要赶路，先读取单人战斗配置
		cga.loadBattleConfig('生产赶路')

		if(config[villageName]){
			console.log('你已经开过【' + villageName + '】传送，直接使用传送石抵达。')
			if(mainMapName == villageName){
				next(cb)
			}else{
				cga.travel.falan.toTeleRoom(villageName, ()=>{
					next(cb)
				})
			}
			return
		}else if(villageName != '魔法大学'){
			console.log('你没有开启【' + villageName + '】传送权限，开始计算最优步行模式...')
		}
		// 用于判断角色的过关资格
		var playerInfo = cga.GetPlayerInfo()
		// tmpIndex > 0情况，也就是自定义序列的非首位，尝试选择去前一个村庄抄近路，再徒步前往目的地。
		if(tmpIndex > 0){
			if(mainMapName == tmpPath[tmpIndex - 1]){
				if(villageName == '奇利村'){
					// 提取本地职业数据，查询人物是战斗系还是生产系。
					const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
					var category = getprofessionalInfos(playerInfo.job).category
					var ring = cga.findItem('欧兹尼克的戒指')
					if(category != '制造系' && category != '初始系' && ring == -1){
						throw new Error('你不是制造系或游民，需要【欧兹尼克的戒指】过海底。')
					}
					cga.travel.autopilot('主地图', ()=>{
						cga.walkList([
							[67, 46, '芙蕾雅'],
							[343, 497, '索奇亚海底洞窟 地下1楼'],
							[18, 34, '索奇亚海底洞窟 地下2楼'],
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							[7,37]
						], ()=>{
							cga.TurnTo(8, 37);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, -1)
									cga.AsyncWaitMovement({map:'索奇亚', delay:1000, timeout:5000}, (err)=>{
										if(err){
											console.error('出错，请检查..')
											return;
										}
										cga.walkList([
											[274, 294, '奇利村'],
										], ()=>{
											next(cb)
											});
										});
									});
								});
						});
					})
				}else if(villageName == '加纳村'){
					cga.travel.autopilot('主地图', ()=>{
						cga.walkList([
							[79, 76, '索奇亚'],
							[356, 334, '角笛大风穴'],
							[133, 26, '索奇亚'],
						], ()=>{
							cga.walkList([
								[704, 147, '加纳村'],
							], ()=>{
								next(cb)
								})
						});
					})
				}else if(villageName == '阿巴尼斯村'){
					cga.travel.autopilot('主地图', ()=>{
						cga.walkList([
							[24, 40, '莎莲娜'],
							[235,338,'莎莲娜西方洞窟'],
							[45,9,14001],
							[57,13,14002],
							[36,7,'莎莲娜'],
							[183,161,'阿巴尼斯村'],
						], ()=>{
							next(cb)
						});
					})
				}else if(villageName == '蒂娜村'){
					if (!cga.travel.canEntryDina()){
						console.log('现在不可进入蒂娜村，开始等待至白天...')
						setTimeout(() => {
							cga.travel.toVillage(villageName, cb, finalVillage)
						}, 60000);
						return
					}
					cga.travel.autopilot('主地图', ()=>{
						cga.walkList([
							[71, 18, 400],
							[570, 275, '蒂娜村'],
						], ()=>{
							next(cb)
						});
					})
				}else if(villageName == '魔法大学'){
					cga.travel.autopilot('主地图', ()=>{
						cga.walkList([
							[37, 71, '莎莲娜'],
							[118, 100, '魔法大学'],
							], ()=>{
								next(cb)
							})
					})
				}
				return
			}else{
				console.log('要去【' + villageName + '】，先去【' + tmpPath[tmpIndex - 1] +'】抄一下近路。')
				cga.travel.toVillage(tmpPath[tmpIndex - 1], cb, finalVillage ? finalVillage : villageName)
			}
			return
		}else{// tmpIndex == 0情况，也就是自定义序列的首位，只能选择徒步前进
			var go = (cb) => {
				cga.travel.falan.toStone('C', ()=>{
					if(villageName == '圣拉鲁卡村'){
						cga.walkList([
							[17, 53, '法兰城'],
							[22, 88,'芙蕾雅'],
							[134, 218, '圣拉鲁卡村'],
						], ()=>{
							next(cb)
						})
					}else if(villageName == '伊尔村'){
						cga.walkList([
							[65, 53, '法兰城'],
							[281, 88,'芙蕾雅'],
							[681, 343, '伊尔村'],
						], ()=>{
							next(cb)
						})
					}else if(villageName == '亚留特村'){
						cga.walkList([
							[27, 82],
							[41,98,'法兰城'],
							[281, 88, '芙蕾雅'],
							[672,223,'哈巴鲁东边洞穴 地下1楼'],
							[41,8,'哈巴鲁东边洞穴 地下2楼'],
							[17,18]
							], ()=>{
								cga.ForceMove(6, true);
								cga.ForceMove(6, true);
								cga.walkList([
									[16,11,'哈巴鲁东边洞穴 地下1楼'],
									[30,4,'芙蕾雅'],
									[596,84,'亚留特村'],
									], ()=>{
										next(cb)
									});
							});
					}else if(villageName == '维诺亚村'){
						if(playerInfo.level < 20){
							throw new Error('过维诺亚村洞穴需要至少20级，或制造系携带3级物品通过')
						}
						cga.walkList([
							[41, 98, '法兰城'],
							//南门
							[153, 241, '芙蕾雅'],
							[473, 316],
						], ()=>{
							cga.TurnTo(472, 316);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'维诺亚洞穴 地下1楼', delay:1000, timeout:5000}, (err)=>{
									if(err){
										console.error('出错，请检查..')
										return;
									}
									cga.walkList([
										[20,59,'维诺亚洞穴 地下2楼'],
										[24,81,'维诺亚洞穴 地下3楼'],
										[26,64,'芙蕾雅'],
										[330,480,'维诺亚村'],
										], ()=>{
											next(cb)
											});
									});
								});
						})
					}else if(villageName == '杰诺瓦镇'){
						if(playerInfo.level < 40){
							throw new Error('过莎莲娜海底隧道需要至少40级')
						}
						cga.walkList([
							//里谢里雅堡西门
							[17, 53, '法兰城'],
							//西门
							[22, 88, '芙蕾雅'],
						], ()=>{
							cga.walkList([
								[201, 166],
							], ()=>{
								cga.TurnTo(201, 165);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1)
									cga.AsyncWaitMovement({map:15000, delay:1000, timeout:5000}, (err)=>{
										if(err){
											console.error('出错，请检查..')
											return;
										}
										cga.walkList([
											[20,8,'莎莲娜海底洞窟 地下2楼'],
											[11,9,'莎莲娜海底洞窟 地下1楼'],
											[24,11,'莎莲娜'],
											[217,455,'杰诺瓦镇'],
											], ()=>{
												next(cb)
												});
										});
									});
								});
						})
					}
				});
			}
			
			if(mainMapName == villageName){
				next(cb)
			}else{
				go(cb)
			}
		}
		return
	}
	/**
	 * UNAecho:是否可以进入白天蒂娜村的API
	 * 蒂娜准确时间为游戏时间内的下午16:00 - 凌晨6点为夜晚蒂娜村。
	 * 考虑到人物走路至传送石，或步行至蒂娜村也需要消耗时间，所以在15:00以后则视为夜晚蒂娜村。
	 */
	cga.travel.canEntryDina = ()=>{
		var sysTime = cga.GetSysTime();
		// 16:00才算作夜晚蒂娜村，但需要预留1小时的步行时间，所以15:00就视为夜晚蒂娜村
		if(sysTime.hours > 6 && sysTime.hours < 15){
			return true
		}
		return false
	}

	cga.travel.shenglaluka = {}
	// 去圣拉鲁卡村医院
	cga.travel.shenglaluka.toHospital = (cb, isPro)=>{
		cga.travel.autopilot('医院',()=>{
			cga.walkList(
				[
					isPro == true ? [10, 3] : [15, 8]
				], ()=>{
					cga.turnDir(isPro == true ? 0 : 6);
					if(cb){
						setTimeout(cb, 1000,null);
					}
				});
		})
	}

	cga.travel.yaliute = {};
	// 亚留特村医院
	cga.travel.yaliute.toHospital = (cb, isPro)=>{
		if(cga.GetMapName() != '亚留特村'){
			cb(new Error('必须从亚留特村启动'));
			return;
		}
		cga.walkList(
		[
			[52, 63, '医院'],
			isPro == true ? [14, 9] : [10, 5],
		], ()=>{
			isPro == true ? cga.turnDir(6) : cga.turnDir(0)
			cb(null);
		});
	}

	cga.travel.qili = {};

	// 奇利村医院
	cga.travel.qili.toHospital = (cb, isPro)=>{
		var name = '奇利村'
		var mapindex = cga.GetMapIndex().index3
		if(mapindex < 3200 || mapindex >= 3300){
			cb(new Error('必须从'+name+'启动'));
			return;
		}
		var tmplist = 		[
			isPro == true ? [7, 2] : [11, 6],
		]
		switch (mapindex) {
			case 3299:
				tmplist.unshift(
					// 去传送房间的过道房间是3214
					[7, 6, 3214],
					// 村长的家map.index3是3212
					[7, 1, 3212],
					[1, 8, '奇利村'],
					[64, 56,'医院'],
					);
				break;
			case 3214:
				tmplist.unshift(
					[7, 1, 3212],
					[1, 8, '奇利村'],
					[64, 56,'医院'],
					);
				break;
			case 3212:
				tmplist.unshift(
					[1, 8, '奇利村'],
					[64, 56,'医院'],
					);
				break;
			case 3200:
				tmplist.unshift(
					[64, 56, '医院'],
					);
				break;
			case 3210:
				break;
			default:
				break;
		}
		cga.walkList(
		tmplist, ()=>{
			cga.turnDir(isPro == true ? 0 : 6);
			cb(null);
		});
	}

	cga.travel.jienuowa = {};
	
	// 杰诺瓦镇医院
	cga.travel.jienuowa.toHospital = (cb, isPro)=>{
		var name = '杰诺瓦镇'
		var mapindex = cga.GetMapIndex().index3
		if(mapindex < 4000 || mapindex >= 4100){
			cb(new Error('必须从'+name+'启动'));
			return;
		}
		var tmplist = 		[
			isPro == true ? [15, 9] : [10, 5],
		]
		switch (mapindex) {
			case 4099:
				tmplist.unshift(
					// 村长的家map.index3是4012
					[14, 6, 4012],
					[1, 9, '杰诺瓦镇'],
					[44, 33,'医院'],
					);
				break;
			case 4012:
				tmplist.unshift(
					[1, 9, '杰诺瓦镇'],
					[44, 33,'医院'],
					);
				break;
			case 4000:
				tmplist.unshift(
					[44, 33,'医院'],
					);
				break;
			default:
				break;
		}
		cga.walkList(
		tmplist, ()=>{
			cga.turnDir(isPro == true ? 6 : 0);
			cb(null);
		});
	}
	//从法兰坐船前往某城镇
	cga.travel.falan.toCity = function(city, cb){
		switch(city){
			case '新城':case '艾尔莎岛':
				cga.travel.falan.toNewIsland(cb);
				return;
			case '阿凯鲁法':case '阿凯鲁法村':
				cga.travel.falan.toAKLF(cb);
				return;
			case '哥拉尔':case '哥拉尔镇':
				cga.travel.falan.toGelaer(cb);
				return;
		}
		throw new Error('未知的城市名:'+city);
	}
	
	cga.travel.newisland = {};
		
	cga.travel.newisland.isSettled = ()=>{

		var config = cga.loadPlayerConfig();

		if(config)
			return config.settledCity == '艾尔莎岛' ? true : false;

		return false;
	}
	
	cga.travel.newisland.xy2name = function(x, y, mapname){
		if(x == 140 && y == 105 && mapname == '艾尔莎岛')
			return 'X';
		if(x == 158 && y == 94 && mapname == '艾尔莎岛')
			return 'A';
		if(x == 84 && y == 112 && mapname == '艾夏岛')
			return 'B';
		if(x == 164 && y == 159 && mapname == '艾夏岛')
			return 'C';
		if(x == 151 && y == 97 && mapname == '艾夏岛')
			return 'D';

		return null;
	}
	
	cga.travel.newisland.isvalid = function(stone){
		switch(stone.toUpperCase()){
			case 'A': return true;
			case 'B': return true;
			case 'C': return true;
			case 'D': return true;
			case 'X': return true;
		}
		return false;
	}

	cga.travel.newisland.toStoneInternal = (stone, cb)=>{
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		const desiredMap = ['艾尔莎岛', '艾夏岛'];
		if(curMap == '艾尔莎岛' || curMap == '艾夏岛'){
			
			var curStone = cga.travel.newisland.xy2name(curXY.x, curXY.y, curMap);
			if(curStone !== null) {
				var turn = false;
				if(stone.length >= 2 && curStone.charAt(1) == stone.charAt(1)) {
					if(curStone == stone){
						cb(true);
						return;
					}
					turn = true;
				} else if(stone.length < 2){
					if(curStone.charAt(0) == stone.charAt(0)){
						cb(true);
						return;
					}
					turn = true;
				}
				if(turn){
					switch(curStone){
						case 'X':{
							cga.walkList([
							[158, 94],
							], ()=>{
								cga.travel.newisland.toStoneInternal(stone, cb);
							});
							return;
						}
						case 'A':{
							if(stone == 'X'){
								cga.walkList([
								[140, 105],
								], ()=>{
									cga.travel.newisland.toStoneInternal(stone, cb);
								});
								return;
							}
							
							cga.turnDir(6);
							break;
						}
						case 'B':cga.turnDir(4);break;
						case 'C':cga.turnDir(5);break;
						case 'D':cga.turnDir(4);break;
					}
					cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
						if(err){
							cb(err, reason);
							return;
						}
						cga.travel.newisland.toStoneInternal(stone, cb);
					});
					return;
				}
			}
			
			if(curMap == '艾尔莎岛'){
				cga.walkList([
				stone == 'X' ? [140, 105] : [158, 94],
				], ()=>{
					cga.travel.newisland.toStoneInternal(stone, cb);
				});
				return;
			}
		}

		if(cga.travel.newisland.isSettled()){
			cga.logBack(()=>{
				cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
					if(err){
						cb(err, reason);
						return;
					}
					cga.travel.newisland.toStoneInternal(stone, cb);
				});
			});
		}else if(cga.travel.falan.isSettled()){
			console.log('检测到你的记录点在法兰，登出测试是否已经记录在了艾尔莎岛，如果是，则更新');
			cga.logBack(()=>{
				cga.AsyncWaitMovement({map:desiredMap, delay:1000, timeout:5000}, (err, reason)=>{
					if(err){
						cb(err, reason);
						return;
					}
					cga.travel.newisland.toStoneInternal(stone, cb);
				});
			});
		}else{
			console.log('你没有记录在艾尔莎岛，登出检测你的记录点..')
			cga.logBack(cb);
		}
	}
	
	//参数1：传送石名称，有效参数：A B C D
	//参数2：回调函数function(result), result 为true或false
	cga.travel.newisland.toStone = (stone, cb)=>{
		if(!cga.travel.newisland.isvalid(stone)){
			throw new Error('无效的目的地名称');
			return;
		}

		cga.travel.newisland.toStoneInternal(stone, cb);
	}
	
	//前往新城冒险者旅馆
	cga.travel.newisland.toPUB = (cb)=>{
		cga.travel.newisland.toStone('B', (r)=>{
			cga.walkList([
			[102,115, '冒险者旅馆'],
			], (r)=>{
				cb(r);
			});
		});
	}
	
	//前往新城银行
	cga.travel.newisland.toBank = (cb)=>{
		cga.travel.newisland.toStone('B', (r)=>{
			cga.walkList([
			[114, 104, '银行'],
			[49, 25]
			], (r)=>{
				cb(r);
			});
		});
	}

	//前往新城立夏岛
	cga.travel.newisland.toLiXiaIsland = (cb)=>{
		cga.travel.newisland.toStone('X', (r)=>{
			var teamplayers = cga.getTeamPlayers();
	
			cga.walkList(
			teamplayers.length > 1 ?
			[
			[165,153],
			[164,153],
			[165,153],
			[164,153],
			[165,153],
			] :
			[
			[165,153],
			]
			, (r)=>{
				cga.TurnTo(165, 155);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, 0);
						setTimeout(cb, 1500, true);
					});
				});
			});
		});
	}
	
	cga.travel.gelaer = {};
	
	cga.travel.gelaer.isSettled = ()=>{

		var config = cga.loadPlayerConfig();

		if(config)
			return config.settledCity == '哥拉尔镇' ? true : false;

		return false;
	}
	
	cga.travel.gelaer.xy2name = function(x, y, mapname){
		if(x == 120 && y == 107 && mapname == '哥拉尔镇')
			return 'N';
		if(x == 118 && y == 214 && mapname == '哥拉尔镇')
			return 'S';
		return null;
	}
	
	cga.travel.gelaer.isvalid = function(stone){
		switch(stone.toUpperCase()){
			case 'N': return true;
			case 'S': return true;
		}
		return false;
	}

	cga.travel.gelaer.toStoneInternal = (stone, cb)=>{
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		if(curMap == '哥拉尔镇'){			
			var curStone = cga.travel.gelaer.xy2name(curXY.x, curXY.y, curMap);
			if(curStone !== null) {
				if(curStone == stone){
					cb(null);
					return;
				}
				
				var desiredTarget = undefined;
				switch(curStone){
					case 'N':
						cga.turnDir(6);
						desiredTarget = [118, 214];
						break;
					case 'S':
						cga.turnDir(0);
						desiredTarget = [120, 107];
						break;
				}
				cga.AsyncWaitMovement({x : desiredTarget[0], y : desiredTarget[1], delay:1000, timeout:5000}, (err, reason)=>{
					if(err){
						cb(err, reason);
						return;
					}
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
				return;
			} else if(!cga.travel.gelaer.isSettle){
				var northPath = cga.calculatePath(curXY.x, curXY.y, 118, 214, null, null, null, []);
				northPath = PF.Util.expandPath(northPath);
				
				var southPath = cga.calculatePath(curXY.x, curXY.y, 120, 107, null, null, null, []);
				southPath = PF.Util.expandPath(southPath);
				
				var path = northPath;
				var target = [118, 214];

				if(path.length > southPath.length)
				{
					path = southPath;
					target = [120, 107];
				}
				
				cga.walkList([target], ()=>{
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
				return;
			}
		}

		if(cga.travel.gelaer.isSettled()){
			cga.logBack(()=>{
				cga.AsyncWaitMovement({map:'哥拉尔镇', delay:1000, timeout:5000}, (err, reason)=>{
					if(err){
						cb(err, reason);
						return;
					}
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
			});
		}
	}
	
	//参数1：传送石名称，有效参数：N S
	cga.travel.gelaer.toStone = (stone, cb)=>{
		if(!cga.travel.gelaer.isvalid(stone)){
			throw new Error('无效的目的地名称');
			return;
		}
		
		cga.travel.gelaer.toStoneInternal(stone, cb);
	}
	
	//前往到哥拉尔医院
	cga.travel.gelaer.toHospital = (cb, isPro)=>{
		if(cga.GetMapName() != '哥拉尔镇'){

			if(cga.travel.gelaer.isSettled()){
				cga.logBack(()=>{
					setTimeout(cga.travel.gelaer.toHospital, 1000, cb, isPro);
				});				
				return;
			}

			cb(new Error('"前往哥拉尔医院"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', ()=>{
			cga.walkList([
				[165, 91, '医院'],
				isPro ? [28, 25] : [29, 26],
			], ()=>{
				if(isPro)
					cga.turnTo(28, 24);
				else
					cga.turnTo(30, 26);
				cb(null);
			});
		});
	}

	//前往到哥拉尔银行
	cga.travel.gelaer.toBank = (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇'){

			if(cga.travel.gelaer.isSettled()){
				cga.logBack(()=>{
					setTimeout(cga.travel.gelaer.toBank, 1000, cb);
				});				
				return;
			}

			cb(new Error('"前往哥拉尔银行"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', ()=>{
			cga.walkList([
				[167, 66, '银行'],
				[25, 10],
			], ()=>{
				cga.turnDir(0);
				cb(null);
			});
		});
	}

	// 前往哥拉尔启程之间
	cga.travel.gelaer.toTeleRoomTemplate = (villageName, npcPos, npcPos2, npcPos3, cb)=>{
		cga.travel.gelaer.toStone('S', ()=>{
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
			
			var list = [
				// 白之宫殿外面index是43200
				[140, 214, 43200],
				// 白之宫殿里面index是43210
				[47, 39, 43210],
				[23, 70, '启程之间'],
			];
			
			if(isTeamLeader){
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
				list.push(npcPos2);				
				list.push(npcPos);
			} else {
				list.push(npcPos);
			}
			
			cga.walkList(list, ()=>{
				var go = ()=>{
					cga.TurnTo(npcPos3[0], npcPos3[1]);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(typeof dlg.message == 'string' && (dlg.message.indexOf('对不起') >= 0 || dlg.message.indexOf('很抱歉') >= 0)){
							cb(new Error('无法使用前往'+villageName+'的传送石'));
							return;
						}
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitMovement({map:villageName+'的传送点', delay:1000, timeout:5000}, cb);
					});
				}
				if(isTeamLeader){
					setTimeout(()=>{
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(go, 1500);
					}, 1500);
				} else {
					go();
				}
			});
		});
	}
	
	cga.travel.gelaer.toTeleRoom = (villageName, cb)=>{
		
		switch(villageName){
			case '米诺基亚镇':
				cga.travel.gelaer.toTeleRoomTemplate('米诺基亚镇', [11, 8], [11, 9], [13, 7], cb);
				break;
			default:
				throw new Error('未知的村子名称');
		}
	}

	//前往鲁米那斯村
	cga.travel.gelaer.toLumi = (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇'){

			if(cga.travel.gelaer.isSettled()){
				cga.logBack(()=>{
					setTimeout(cga.travel.gelaer.toLumi, 1000, cb);
				});
				return;
			}

			cb(new Error('"前往鲁米那斯村"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', ()=>{
			cga.walkList([
				[176,105,'库鲁克斯岛'],
				[477,525],
			], ()=>{
				cga.turnTo(477, 526);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitMovement({x : 476, y : 528, delay:1000, timeout:5000}, ()=>{
						cga.walkList([
						[322, 883,'鲁米那斯']
						], ()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.travel.lumi = {};
	
	//前往鲁村商店
	cga.travel.lumi.toStore = (cb)=>{
		if(cga.GetMapName() != '鲁米那斯'){
			cb(new Error('必须从鲁米那斯启动'));
			return;
		}
		cga.walkList([
			[88, 51,'杂货店'],
			[11, 12],
		], ()=>{
			cga.turnTo(13, 12);
			cb(null);
		});
	}
	
	//前往鲁村医院
	cga.travel.lumi.toHospital = (cb, isPro)=>{
		if(cga.GetMapName() != '鲁米那斯'){
			cb(new Error('必须从鲁米那斯启动'));
			return;
		}
		cga.walkList(
		[
			[87, 35, '医院'],
			isPro == true ? [17, 5] : [17, 16],
		], ()=>{
			cga.turnDir(0);
			cb(null);
		});
	}

	cga.travel.weinuoya = {};
	
	cga.travel.weinuoya.toHospital = (cb, isPro)=>{
		var name = '维诺亚村'
		var mapindex = cga.GetMapIndex().index3
		if(mapindex < 2100 || mapindex >= 2200){
			cb(new Error('必须从'+name+'启动'));
			return;
		}
		var tmplist = 		[
			isPro == true ? [15, 9] : [11, 5],
		]
		switch (mapindex) {
			case 2199:
				tmplist.unshift(
					[5, 1, '村长家的小房间'],
					[0, 5, '村长的家'],
					[10, 16, '维诺亚村'],
					[61, 53, '医院'],
					);
				break;
			case 2198:
				tmplist.unshift(
					[0, 5, '村长的家'],
					[10, 16, '维诺亚村'],
					[61, 53, '医院'],
					);
				break;
			case 2112:
				tmplist.unshift(
					[10, 16, '维诺亚村'],
					[61, 53, '医院'],
					);
				break;
			case 2110:
				break;
			default:
				break;
		}
		cga.walkList(
			tmplist, ()=>{
			cga.turnDir(isPro == true ? 6 : 0);
			cb(null);
		});
	}

	cga.travel.minuojiya = {};
	
	cga.travel.minuojiya.toHospital = (cb, isPro)=>{
		if(cga.GetMapName() != '米诺基亚镇'){
			cb(new Error('必须从米诺基亚镇启动'));
			return;
		}
		cga.walkList(
		[
			[45, 87, '医院'],
			isPro == true ? [7, 6] : [11, 8],
		], ()=>{
			cga.turnDir(0);
			cb(null);
		});
	}
	//从哥拉尔到法兰
	cga.travel.gelaer.toFalan = (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇'){
			cb(new Error('必须从哥拉尔镇启动'));
			return;
		}

		var stage4 = ()=>{
			cga.walkList([
				[47, 83, '村长的家'],
				[14, 17, '伊尔村的传送点'],
				[20, 10],
			], (r)=>{
				cga.TurnTo(22, 10);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'启程之间'}, ()=>{
						cga.walkList([
							[25, 24, '里谢里雅堡 1楼'],
							[74, 40, '里谢里雅堡'],
						], cb);
					});
				});
			});
		}
		
		var stage3 = ()=>{
			cga.walkList([
				[19, 55],
			], (r)=>{
				cga.TurnTo(19, 53);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'港湾管理处'}, ()=>{
						cga.walkList([
							[9, 22, '伊尔'],
							[24, 19],
						], ()=>{
							cga.TurnTo(24, 17);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({map:'伊尔村'}, stage4);
							});
						});
					});
				});
			});
		}
		
		var retry2 = ()=>{
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg)=>{				
				if(dlg && dlg.message.indexOf('现在正停靠在伊尔村') >= 0 && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'往哥拉尔栈桥'}, ()=>{
						stage3();
					});
					return;
				}
				
				setTimeout(retry2, 5000);
			});
		}

		var retry = ()=>{
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'铁达尼号'}, retry2);
					return;
				}
				
				setTimeout(retry, 5000);
			});
		}
		
		cga.walkList([
			[96, 211, '哥拉尔镇 港湾管理处'],
			[8, 5],
		], ()=>{
			cga.TurnTo(8, 3);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(32, -1);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({map:'往伊尔栈桥'}, ()=>{
						cga.walkList([
						[51, 50],
						], retry);
					});
				});
			});
		});
	}

	cga.isPathAvailable = (curX, curY, targetX, targetY)=>{
		var walls = cga.buildMapCollisionMatrix();
		var grid = new PF.Grid(walls.matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		});

		var frompos = [curX - walls.x_bottom, curY - walls.y_bottom];
		var topos = [targetX - walls.x_bottom, targetY - walls.y_bottom];

		if(frompos[0] >= 0 && frompos[0] < walls.x_size && 
		frompos[1] >= 0 && frompos[1] < walls.y_size &&
			topos[0] >= 0 && topos[0] < walls.x_size && 
			topos[1] >= 0 && topos[1] < walls.y_size){
		
			//console.log('using AStar path finder...');
			
			var path = finder.findPath(frompos[0], frompos[1], topos[0], topos[1], grid);
			
			if(path.length)
			{
				return true;
			}
		}
		
		return false;
	}

	cga.calculatePath = (curX, curY, targetX, targetY, targetMap, dstX, dstY, newList)=>{
		var walls = cga.buildMapCollisionMatrix();
		var grid = new PF.Grid(walls.matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		});
		
		//console.log('x_size ' + walls.x_size);
		//console.log('y_size ' + walls.y_size);
		
		//console.log('xbot ' + walls.x_bottom);
		//console.log('ybot ' + walls.y_bottom);

		var frompos = [curX - walls.x_bottom, curY - walls.y_bottom];
		var topos = [targetX - walls.x_bottom, targetY - walls.y_bottom];
		//console.log('寻路起始坐标 ('  + (frompos[0]) + ', '+ (frompos[1]) + ')');
		//console.log('寻路目的坐标 ('  + (topos[0]) +', '+(topos[1]) + ')');
		
		if(frompos[0] >= 0 && frompos[0] < walls.x_size && 
		frompos[1] >= 0 && frompos[1] < walls.y_size &&
			topos[0] >= 0 && topos[0] < walls.x_size && 
			topos[1] >= 0 && topos[1] < walls.y_size){
		
			//console.log('using AStar path finder...');
			
			var path = finder.findPath(frompos[0], frompos[1], topos[0], topos[1], grid);
			
			if(path.length)
			{
				var joint = PF.Util.compressPath(path);
				for(var i in joint){
					joint[i][0] += walls.x_bottom;
					joint[i][1] += walls.y_bottom;
					if(joint[i][0] == targetX && joint[i][1] == targetY){
						joint[i][2] = targetMap;
						joint[i][3] = dstX;
						joint[i][4] = dstY;
					}
					joint[i][5] = true;
				}

				//console.log('result joints');					
				//console.log(joint);

				newList = joint.concat(newList);
				
				//console.log('新寻路列表:');			
				//console.log(newList);
				
				return newList;
			}
		}
		
		throw new Error('发现严重错误：寻路失败！\n' 
		+ '地图最小值坐标 ('  + (walls.x_bottom) + ', '+ (walls.y_bottom) + ')'
		+ '地图最大值坐标 ('  + (walls.x_size) +', '+(walls.y_size) + ')'
		+ '寻路起始坐标 ('  + (frompos[0]) + ', '+ (frompos[1]) + ')'
		+ '寻路目的坐标 ('  + (topos[0]) +', '+(topos[1]) + ')'
		+ '【注意】此错误多数情况下是由于地图未下载完全导致，请手动在【地图】模式中下载地图再试试'
		);
		//return [];
	}
	
	cga.getMapXY = ()=>{
		var f = cga.GetMapXYFloat();
		return {x: parseInt(f.x/64.0), y:parseInt(f.y/64.0)};
	}
	
	cga.NoRollbackMap = [
	'艾尔莎岛',
	'艾夏岛',
	'利夏岛',
	'法兰城',
	'里谢里雅堡',
	'医院',
	'工房',
	'村长的家',
	'曙光骑士团营地',
	'辛希亚探索指挥部',
	'圣骑士营地',
	'哥拉尔镇',
	'鲁米那斯',
	'阿凯鲁法村',
	'坎那贝拉村',
	'加纳村',
	'奇利村',
	'杰诺瓦镇',
	'伊尔村',
	'伊尔',
	'维诺亚村',
	'乌克兰村',
	'亚留特村',
	'圣拉鲁卡村',
	'地下工房',
	'阿巴尼斯村',
	'魔法大学',
	'魔法大学内部',
	'杂货店',
	'启程之间',
	'追忆之路',
	'港湾管理处',
	'往哥拉尔栈桥',
	'往伊尔栈桥',
	'哥拉尔 港湾管理处',
	];
	
	/*自动寻路走路，调用方式：

		//走到指定地点：
		cga.walkList({
			[坐标x, 坐标y]
		}, cb回调)

		//走到指定地点并切图：
		cga.walkList({
			[坐标x, 坐标y, 地图名]
		}, cb回调)

		//走到指定地点并切图：
		cga.walkList({
			[坐标x, 坐标y, 地图索引]
		}, cb回调)
		
		//走到指定地点并传送至同一张地图的另一坐标（比如辛西娅探索指挥部的楼梯）：
		cga.walkList({
			[坐标x, 坐标y, 地图索引, 传送目标x, 传送目标y]
		}, cb回调)

	*/
	cga.walkList = (list, cb)=>{
		
		//console.log('初始化寻路列表');
		//console.log(list);
		
		if(cga.isMoveThinking){
			throw new Error('发现严重错误：已有walkList在运行中');
		}

		cga.isMoveThinking = true;

		if(!cga.moveThink('walkList')){
			console.log('walkList被中断');
			cga.isMoveThinking = false;
			return;
		}

		var walkedList = [];
		var newList = list.slice(0);
		
		var walkCb = ()=>{

			if(newList.length == 0){
				cga.isMoveThinking = false;
				cb(null);
				return;
			}

			var targetX = newList[0][0];
			var targetY = newList[0][1];
			var targetMap = newList[0][2];
			var dstX = newList[0][3];
			var dstY = newList[0][4];
			var isAStarPath = newList[0][5];
			
			var walked = newList[0].slice(0);
			walkedList.push(walked);
			newList.shift();
			
			var curmap = cga.GetMapName();
			var curpos = cga.GetMapXY();
			var curmapindex = cga.GetMapIndex().index3;

			// console.log('当前地图: ' + curmap + ', 序号 ' + curmapindex);
			// console.log('当前 (%d, %d) -> 目标 (%d, %d)', curpos.x, curpos.y, targetX, targetY);
			if(targetMap)
			{
				// console.log('目标地图');
				// console.log(targetMap);
			}
			
			var end = (arg)=>{
				
				if(cga.NoRollbackMap.find((n)=>{
					return n == curmap;
				}) != undefined)
				{
					cga.isMoveThinking = false;
					cb(null);
					return;
				}

				var waitBattle2 = ()=>{
					if(!cga.isInNormalState()){
						setTimeout(waitBattle2, 1500);
						return;
					}

					if(!cga.moveThink('walkList')){
						console.log('walkList被中断');
						cga.isMoveThinking = false;
						return;
					}

					var curpos = cga.GetMapXY();
					if(typeof walkedList[walkedList.length-1][2] != 'string' &&
					typeof walkedList[walkedList.length-1][2] != 'number' &&
						(curpos.x != walkedList[walkedList.length-1][0] || 
						curpos.y != walkedList[walkedList.length-1][1])
						){
						
						//console.log(curpos);
						//console.log(walkedList);
						console.log('坐标错误，回滚到最后一个路径点');
						
						var endpos = walkedList.pop();
						newList = cga.calculatePath(curpos.x, curpos.y, endpos[0], endpos[1], endpos[2], null, null, newList);
						walkCb();
						return;
					}
					
					cga.isMoveThinking = false;
					cb(null);
					return;
				}
				setTimeout(waitBattle2, 1500);
			}
			
			var walker = (err, reason)=>{
				
				if(!cga.moveThink('walkList')){
					console.log('walkList被中断');
					cga.isMoveThinking = false;
					return;
				}

				//console.log(result);
				//console.log(reason);

				if(err){
					
					if(reason == 4){
						//console.log('地图发生非预期的切换！');
						var curmap = cga.GetMapName();
						var curmapindex = cga.GetMapIndex().index3;
						
						console.log('当前地图: ' + curmap);
						console.log('当前地图序号: ' + curmapindex);
					}
				
					//we are in battle status, wait a second then try again until battle is end
					//or we are forcely moved back to an position by server
					if(reason == 2 || reason == 5){
						
						var waitBattle = ()=>{
							if(!cga.isInNormalState()){
								setTimeout(waitBattle, 1000);
								return;
							}
							
							var curmap = cga.GetMapName();
							var curmapindex = cga.GetMapIndex().index3;
							var curpos = cga.GetMapXY();
							
							// console.log('战斗回滚');
							// console.log('当前地图 ：' + curmap);
							// console.log('当前地图序号 ：' + curmapindex);
							// console.log('当前坐标：' + curpos.x + ', ' + curpos.y);
							
							if(typeof targetMap == 'string' && curmap == targetMap){
								
								if(newList.length == 0){
									console.log('寻路正常结束1');
									end({ map : targetMap });
									return;
								}
								
								walkCb();
								return;
							}
							else if(typeof targetMap == 'number' && curmapindex == targetMap){
								
								if(newList.length == 0){
									console.log('寻路正常结束2');
									end({ map : targetMap });
									return;
								}
								
								walkCb();
								return;
							}
							else if(typeof walkedList[walkedList.length-1] != 'undefined' && 
								typeof walkedList[walkedList.length-1][2] == 'string' && 
								walkedList[walkedList.length-1][2] != '' &&
								curmap != walkedList[walkedList.length-1][2])
							{
								console.log('目标地图错误，回滚到上一路径');
								console.log('预期地图 ' + walkedList[walkedList.length-1][2] + ', 当前地图 ' + curmap);
								
								var temp = walkedList.pop();
								newList = cga.calculatePath(curpos.x, curpos.y, temp[0], temp[1], temp[2], null, null, newList);
							}
							else if(typeof walkedList[walkedList.length-2] != 'undefined' && 
								typeof walkedList[walkedList.length-2][2] == 'string' && 
								walkedList[walkedList.length-2][2] != '' && 
								curmap != walkedList[walkedList.length-2][2])
							{
								console.log('目标地图错误，回滚到上上个路径');
								console.log('预期地图 ' + walkedList[walkedList.length-2][2] + ', 当前地图 ' + curmap);
								
								walkedList.pop();
								var temp = walkedList.pop();
								
								newList = cga.calculatePath(curpos.x, curpos.y, temp[0], temp[1], temp[2], null, null, newList);
							} else {
								
								newList = cga.calculatePath(curpos.x, curpos.y, targetX, targetY, targetMap, dstX, dstY, newList);
							}

							walkCb();
						}
						
						setTimeout(waitBattle, 1000);
						return;
					} else if(reason == 3){
						
						//console.log('当前寻路卡住，抛出错误！');
						throw new Error('发现严重错误：当前寻路卡住！');
					}

					cga.isMoveThinking = false;
					cb(err, reason);
					return;
				}

				if(newList.length == 0){
					// console.log('寻路正常结束3');
					end( {pos : [targetX, targetY], map : targetMap} );
					return;
				}
				
				walkCb();
			}
				
			if(targetX == curpos.x && targetY == curpos.y){		
				var isEntrance = typeof targetMap == 'string' || typeof targetMap == 'number' || (targetMap instanceof Array) ? true : false;
				if(isEntrance){
					cga.FixMapWarpStuck(1);
					cga.AsyncWalkTo(targetX, targetY, targetMap, null, null, walker);
					return;
				}
				walkCb();
				return;
			}

			if(isAStarPath !== true){
				newList = cga.calculatePath(curpos.x, curpos.y, targetX, targetY, targetMap, dstX, dstY, newList);
				walkCb();
				return;
			}
			
			cga.AsyncWalkTo(targetX, targetY, targetMap, dstX, dstY, walker);
		};
		
		walkCb();
	}
			
	//查找玩家技能，返回技能对象，找不到返回null
	//参数1：技能名
	//参数2：完全匹配
	cga.findPlayerSkill = function(name){
		var match = arguments[1] ? arguments[1] : true;
		var skill = cga.GetSkillsInfo().find((sk)=>{
			if(match && sk.name == name){
				return true;
			}
			if(!match && sk.name.indexOf(name) != -1){
				return true;
			}
			return false;
		});

		return skill != undefined ? skill : null;
	}
	
	//查找宝箱
	cga.findCrate = function(filter){
		var unit = cga.GetMapUnits().find((u)=>{
			if(u.valid == 2 && u.type == 2 && u.model_id != 0 && (u.flags & 1024) != 0)
				return filter(u);
			
			return false;
		});
		
		return unit != undefined ? unit : null;
	}
	
	//搜索NPC，支持过滤器
	cga.findNPCEx = function(filter){
		var unit = cga.GetMapUnits().find((u)=>{
			if(u.valid == 2 && u.type == 1 && u.model_id != 0 && (u.flags & 4096) != 0)
				return filter(u);
			
			return false;
		});
		
		return unit != undefined ? unit : null;
	}

	//按名称搜索NPC
	cga.findNPC = function(name){
		return cga.findNPCEx((u)=>{
			return (u.unit_name == name);
		});
	}
	
	//按坐标搜索NPC
	cga.findNPCByPosition = function(name, x, y){
		return cga.findNPCEx((u)=>{
			return (u.unit_name == name && x == u.xpos && y == u.ypos);
		});
	}

	//取背包中的物品数量
	//参数1：物品名, 或#物品id，或过滤函数
	//参数2：是否包括装备栏
	cga.getItemCount = function(filter){
		var includeEquipment = arguments[1] === true ? true : false;
		var items = cga.GetItemsInfo();
		var count = 0;
		if(typeof filter == 'string' && filter.charAt(0) == '#'){
			var itemid = parseInt(filter.substring(1));
			items.forEach((item)=>{
				if(!includeEquipment && item.pos < 8)
					return false;
				if(item.itemid == itemid)
					count += item.count > 0 ? item.count : 1;
			});
		} else if(typeof filter == 'number'){
			var itemid = filter;
			items.forEach((item)=>{
				if(!includeEquipment && item.pos < 8)
					return false;
				if(item.itemid == itemid)
					count += item.count > 0 ? item.count : 1;
			});
		} else if(typeof filter == 'function'){
			var itemid = filter;
			items.forEach((item)=>{
				if(!includeEquipment && item.pos < 8)
					return false;
				if(filter(item) == true)
					count += item.count > 0 ? item.count : 1;
			});
		} else {
			items.forEach((item)=>{
				if(!includeEquipment && item.pos < 8)
					return false;
				if(item.name == filter)
					count += item.count > 0 ? item.count : 1;
			});
		}
		return count;
	}
	
	//任务
	cga.task = {};
	
	//任务对象构造函数
	cga.task.Task = function(name, stages, requirements){
		
		this.stages = stages;
		this.name = name;
		this.anyStepDone = true;
		
		this.requirements = requirements
		
		this.isDone = function(index){
			for(var i = this.requirements.length - 1; i >= index; --i){
				if(typeof this.requirements[i] == 'function' && this.requirements[i]())
					return true;
			}
			return false;
		}
		
		this.isDoneSingleStep = function(index){
			if(typeof this.requirements[index] == 'function' && this.requirements[index]())
				return true;
			return false;
		}
		
		this.doNext = function(index, cb){
			if(index >= this.stages.length){
				console.log('任务：'+this.name+' 已完成！');
				if(cb)
					cb(true);
			} else {
				this.doStage(index, cb);
			}
		}
	
		this.doStage = function(index, cb){
			if(this.anyStepDone){
				if(this.isDone(index)){
					console.log('第'+(index+1)+'/'+stages.length+'阶段已完成，跳过。');
					this.doNext(index+1, cb);
					return;
				}
			} else {
				if(this.isDoneSingleStep(index)){
					console.log('第'+(index+1)+'/'+stages.length+'阶段已完成，跳过。');
					this.doNext(index+1, cb);
					return;
				}
			}
			console.log('开始执行第'+(index+1)+'阶段：');
			console.log(this.stages[index].intro);
			var objThis = this;
			objThis.stages[index].workFunc(function(r,jumpIndex){
				if(r === false || r instanceof Error){
					if(cb)
						cb(r);
					return;
				}
				//console.trace()
				
				if(r === true || r === null){
					console.log('第'+(index+1)+'阶段执行完成。');
					objThis.doNext(index + 1, cb);
				} else if( r == 'restart stage' ){
					console.log('第'+(index+1)+'阶段请求重新执行。');
					objThis.doNext(index, cb);
				} else if( r == 'restart task' ){
					console.log('第'+(index+1)+'阶段请求重新执行。');
					objThis.doNext(index, cb);
				} else if( r == 'jump' && typeof jumpIndex == 'number'){
					console.log('第'+(index+1)+'阶段请求跳转至第'+(jumpIndex+1)+'阶段');
					objThis.doNext(jumpIndex, cb);
				} else  {
					throw new Error('无效参数');
				}
			// 注意这里UNA添加了index参数进入任务的workFunc中，与cb同级别。目的是为了stage中可以拿到当前index的参数，判断当前task的进度。
			},index);
		}

		this.doTask = function(cb){
			console.log('任务：'+this.name+' 开始执行，共'+this.stages.length+'阶段。');
			this.doStage( (typeof this.jumpToStep != 'undefined') ? this.jumpToStep : 0, cb);
		}
		
		return this;
	}
	
	//等待NPC出现
	cga.task.waitForNPC = (filter, cb)=>{
		if(!cga.findNPC(filter)){
			setTimeout(cga.task.waitForNPC, 10000, filter, cb);
			cga.SayWords('', 0, 3, 1);
			return;
		}
		// 加个时间提醒
		if(typeof filter == 'string')
			console.log('【' + filter + '】出现，时间:',cga.GetSysTime())
		cb(null);
	}

	cga.gather = {};
	
	cga.gather.stats = function(itemname, itemgroupnum){
		this.begintime = moment();
		this.prevcount = cga.getItemCount(itemname);
		this.itemname = itemname;
		this.itemgroupnum = itemgroupnum;
		this.printStats = function(){
			var count = cga.getItemCount(this.itemname) - this.prevcount;
			
			console.log('一次采集完成，耗时' + moment.duration(moment() - this.begintime, 'ms').locale('zh-cn').humanize());
			console.log('获得 '+ itemname +' x '+count+'，共 ' + parseInt(count / this.itemgroupnum) + ' 组。');
			
			this.begintime = moment();
		}
		return this;
	}

	cga.craft = {}
		
	cga.craft.buyFabricLv1Multi = (arr, cb)=>{
		cga.travel.falan.toFabricStore(()=>{
			cga.walkList([
			[8, 7],
			], ()=>{
				cga.TurnTo(8, 6);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.craft.buyFabricLv1 = (id, count, cb)=>{
		cga.craft.buyFabricLv1Multi([{index:id, count:count}], cb);
	}
	
	cga.craft.buyFabricLv2Multi = (arr, cb)=>{
		cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
			cga.walkList([
			[5, 1, '村长家的小房间'],
			[0, 5, '村长的家'],
			[9, 16, '维诺亚村'],
			[56, 42, '装备品店'],
			[13, 8],
			], ()=>{
				cga.TurnTo(13, 6);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.craft.buyFabricLv2 = (id, count, cb)=>{
		cga.craft.buyFabricLv2Multi([{index:id, count:count}], cb);
	}
	
	cga.craft.buyFabricLv3Multi = (arr, cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[43, 23, '杂货店'],
			[11, 12],
			], ()=>{
				cga.TurnTo(13, 12);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.craft.buyFabricLv3 = (id, count, cb)=>{
		cga.craft.buyFabricLv3Multi([{index:id, count:count}], cb);
	}
	
	cga.craft.buyFabricLv4Multi = (arr, cb)=>{
		cga.travel.falan.toTeleRoom('魔法大学', ()=>{
			cga.walkList([
			[74, 93, '魔法大学内部'],
			[29, 43, '更衣室'],
			[11, 8],
			], ()=>{
				cga.TurnTo(11, 6);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.craft.buyFabricLv4 = (id, count, cb)=>{
		cga.craft.buyFabricLv4Multi([{index:id, count:count}], cb);
	}
	
	cga.craft.buyFabricLv5Multi = (arr, cb)=>{
		cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
			cga.walkList([
			[5, 4, 4313],
			[13, 5],
			], ()=>{
				cga.TurnTo(13, 3);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(()=>{
							cb(null);
						});
					});
				});
			});
		});
	}
	
	cga.craft.buyFabricLv5 = (id, count, cb)=>{
		cga.craft.buyFabricLv5Multi([{index:id, count:count}], cb);
	}
	
	//搜索第一个可鉴定的物品
	cga.findAssessableItem = ()=>{
		var skill = cga.findPlayerSkill('鉴定');
		var mp = cga.GetPlayerInfo().mp;
		var found = cga.getInventoryItems().find((item)=>{
			return !item.assessed && skill.lv >= item.level && mp >= item.level * 10;
		});
		return found == undefined ? null : found;
	}
	
	//鉴定背包中所有的物品
	cga.assessAllItems = (cb)=>{
		var item = cga.findAssessableItem();
		if(item)
		{
			cga.manipulateItemEx({
				skill : '鉴定',
				itempos : item.pos,
				immediate : true,
			}, (err, results)=>{
				setTimeout(cga.assessAllItems, 500, cb);
			})
		} else {
			cb(null);
			return;
		}
	}
	
	cga.findItem = (filter) =>{
		
		var items = cga.getInventoryItems();

		if(typeof filter == 'string' && filter.charAt(0) == '#'){
			var found = items.find((item)=>{
				return item.itemid == parseInt(filter.substring(1));
			})
			
			return found != undefined ? found.pos : -1;
		}
		
		var found = items.find((item)=>{
			if(typeof filter == 'string')
				return item.name == filter;
			else if (typeof filter == 'number')
				return item.itemid == filter;
			else if (typeof filter == 'function')
				return filter(item);
		})
			
		return found != undefined ? found.pos : -1;
	}
	/**
	 * UNA添加查询宠物API，仅返回第一个匹配的宠物。
	 * filter:查询函数，如果return true，则返回对应宠物index
	 * customerName:，Boolean类型，是否使用宠物自定义名称来查询。默认为false。
	 *  */ 
	cga.findPet = (filter, customerName = false) =>{
		var pets = cga.GetPetsInfo();
		var found = pets.find((pet)=>{
			if(typeof filter == 'string'){
				if (!customerName && pet.realname == filter){
					return true
				}else if(customerName && pet.name == filter){
					return true
				}
				return false
			}
			else if (typeof filter == 'number')
				return pet.index == filter;
			else if (typeof filter == 'function')
				return filter(pet);
		})
		return found != undefined ? found.index : -1;
	}
	
	//寻找背包里符合条件的物品，并整合成符合cga.SellStore和cga.AddTradeStuffs的数组格式
	cga.findItemArray = (filter) =>{
		
		var arr = [];
		var items = cga.getInventoryItems();
		
		if(typeof filter == 'function'){
			items.forEach((item)=>{
				if(filter(item)){
					arr.push({
					itempos : item.pos,
					itemid : item.itemid,
					name : item.name,
					count : (item.count < 1) ? 1 : item.count,
					type : item.type,
					});
				}
			})
			return arr;
		}
		
		if(typeof filter =='string' && filter.charAt(0) == '#'){
			items.forEach((item)=>{
				if(item.itemid == filter.substring(1)){
					arr.push({
					itempos : item.pos,
					itemid : item.itemid,
					count : (item.count < 1) ? 1 : item.count,
					});
				}
			})
			return arr;
		}
		
		items.forEach((item)=>{
			if(filter instanceof RegExp){
				//console.log(itemname.exec(items[i].name));
				if(filter.exec(item.name)){
					arr.push({
					itempos : item.pos,
					itemid : item.itemid,
					count : (item.count < 1) ? 1 : item.count,
					});
				}
			}
			else if(typeof filter =='string'){
				if(item.name == filter){
					arr.push({
					itempos : item.pos,
					itemid : item.itemid,
					count : (item.count < 1) ? 1 : item.count,
					});
				}
			}
		});
		return arr;
	}
	
	//出售物品
	cga.sellArray = (sellarray, cb)=>{
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			if(err){
				cb(err);
				return;
			}
			var numOpt = dlg.message.charAt(dlg.message.length-1);
			cga.ClickNPCDialog(0, numOpt == '3' ? 1 : 0);
			cga.AsyncWaitNPCDialog(()=>{
				cga.SellNPCStore(sellarray);
				cga.AsyncWaitNPCDialog(()=>{
					cb(true);
				});
			});
		});
	}
	
	//获取背包里能够出售的物品
	cga.getSellStoneItem = ()=>{
		var pattern = /(.+)的卡片/;
		var sellArray = []
		cga.getInventoryItems().forEach((item)=>{
			// UNAecho:有时候会不小心捡到未鉴定的封印卡，其名称也是【卡片？】如果不作判断，会直接卡在商店处一直无法动弹。
			if(item.name == '魔石' || (item.name == '卡片？' && item.type != 40) || pattern.exec(item.name) ){
				sellArray.push({
					itempos : item.pos,
					itemid : item.itemid,
					count : (item.count < 1) ? 1 : item.count,
				});
			}				
		})		
		return sellArray;
	}
	
	//清理背包里无用的物品
	cga.cleanInventory = (count, cb)=>{
		if(cga.getInventoryItems().length >= 21 - count)
		{
			var items = cga.getSellStoneItem();
			if(items.length > 0){
				cga.DropItem(items[0].itempos);
				if(cb)
					setTimeout(cga.cleanInventory, 500, count, cb);
			} else {
				cb(new Error('没有可以扔的物品了'));
			}
		} else {
			cb(null);
		}
	}
	
	//循环清理背包里无用的物品直到无东西可清
	cga.cleanInventoryEx = (filter, cb)=>{
		var items = cga.getInventoryItems().filter(filter);
		if(items.length > 0){
			cga.DropItem(items[0].pos);
			setTimeout(cga.cleanInventory, 500, count, filter, cb);
		} else {
			cb(null);
		}
	}
	
	//出售魔石
	cga.sellStone = (cb)=>{
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			if(err){
				cb(err);
				return;
			}
			
			var numOpt = dlg.message.charAt(dlg.message.length-1);
			cga.ClickNPCDialog(0, numOpt == '3' ? 1 : 0);
			cga.AsyncWaitNPCDialog(()=>{
				cga.SellNPCStore(cga.getSellStoneItem());
				setTimeout(cb, 1000, null);
			});
		});
	}
	
	//获取坐标之间的距离
	cga.getDistance = (x1, y1, x2, y2)=>{		
		return Math.sqrt((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2));
	}
	
	//判断坐标之间的距离是否小于等于1
	cga.isDistanceClose = (x1, y1, x2, y2)=>{
		if(x1 - x2 <= 1 && x1 - x2 >= -1 && y1 - y2 <= 1 && y1 - y2 >= -1)
			return true;
		return false;
	}

	//保存每个人物自己的个人配置文件，用于保存银行格信息和登出点信息
	cga.savePlayerConfig = (config, cb) => {
		console.log('正在保存个人配置文件...');

		var configPath = __dirname+'\\个人配置';
		var configName = configPath+'\\个人配置_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';

		fs.mkdir(configPath, (err)=>{
			if(err && err.code != 'EEXIST'){
				console.log('个人配置文件保存失败：');
				console.log(err);
				if(cb) cb(err);
				return;
			}

			fs.writeFile(configName, JSON.stringify(config), (err)=>{
				if(err){
					console.log('个人配置文件保存失败：');
					console.log(err);
					if(cb) cb(err);
					return;
				}			
				console.log('个人配置文件保存成功!...');
				// 有时候写入文件与玩家登出可能间隔很短，因为登出也会写入个人配置，所以加一个回调延迟，防止同时写入
				if(cb){
					setTimeout(cb, 300);
				}
			});
		});		
	}

	//读取每个人物自己的个人配置文件
	cga.loadPlayerConfig = () => {
		console.log('正在读取个人配置文件...');

		var configPath = __dirname+'\\个人配置';
		var configName = configPath+'\\个人配置_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';

		try
		{
			var json = fs.readFileSync(configName, 'utf8');
				
			if(typeof json != 'string' || !json.length)
				throw new Error('个人配置文件格式错误或文件不存在');

			var obj = JSON.parse(json);

			return obj;
		}
		catch(e)
		{
			if(e.code != 'ENOENT'){
				console.log('读取个人配置时发生错误：');
				console.log(e);
			} else {
				console.log('读取个人配置文件不存在');
			}

		}
		
		return null;
	}
	/**
	 * UNA :写了一个持久化人物任务完成情况的方法，用于离线记录人物的一些数据，便于查询。
	 * 请注意，关于任务的称号，我自己也没有做过全部的任务，所以请自行添加需要的任务名称，我只写了一个开启者
	 * 【注意】采集系在3转后自动可以传送至小岛，相当于战斗系做完了半山6/地狱的回响。
	 * 但是如果采集系参与了半山1-5的话，则必须按照战斗系的流程走完。所以建议采集系不要做半山任务。逻辑没空写。
	 * 
	 * @param {object} missionObj 需要更新的任务对象，
	 * key 为 任务string名称，请注意输入的任务名称要全项目统一，不然会出现检测出错的情况。如【树精长老】和【树精】【一转】等会被认为是不同的任务。
	 * value 为任务状态，类型任意。true为已完成，false为未完成。int为任务完成的步骤标记，或者string自定义，你自己认识就好。
	 * example : missionObj = {"树精长老的末日" : true ,"挑战神兽" : true ,"神之召唤" : 2 ,"洛伊夫的净化" : "收集徽记" ,}
	 * @param {*} cb 回调
	 * @returns 
	 * 
	 */
	cga.refreshMissonStatus = (missionObj, cb) => {
		var rootdir = cga.getrootdir()
		var playerInfo = cga.GetPlayerInfo();
		// 提取本地职业数据，查询人物是战斗系还是生产系，目前是几转，用于刷新各种晋级任务的状态。
		const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
		var professionalInfo = getprofessionalInfos(playerInfo.job)
		var category = professionalInfo.category
		var jobLevel = getprofessionalInfos.getJobLevel(playerInfo.job)

		// 晋级任务
		const battleMission = ['树精长老的末日', '挑战神兽', '诅咒的迷宫', '誓言之花', '洛伊夫的净化', ]
		const productMission = ['咖哩任务', '起司的任务', '魔法大学', '誓言之花', ]

		var config = cga.loadPlayerConfig();
		if(!config)
			config = {};
		if(!config.hasOwnProperty("mission")){
			config["mission"] = {}
		}
		if(!category){
			throw new Error('category数值有误，请手动检查ProfessionalInfo.js中【' + professionalInfo.jobmainname+'】的category')
		}
		// 护士和医生属于生产系，但晋级需要做战斗系的任务
		if(['护士', '医生',].indexOf(professionalInfo.jobmainname) != -1){
			category = '战斗系'
		}else if(['物理系', '魔法系', '魔物系',].indexOf(category) != -1){
			category = '战斗系'
		}else if(['猎人', '樵夫','矿工'].indexOf(professionalInfo.jobmainname) != -1){
			category = '采集系'
		}else{
			category = '生产系'
		}
		// 开始执行逻辑，首先刷新一下职业晋级任务的状态。
		if(category == '战斗系'){
			for (var i = 0 ; i < battleMission.length ; i++){
				if(i < jobLevel){
					config["mission"][battleMission[i]] = true
					continue
				}
				// 除了五转以外，重置更高级别的晋级任务状态。
				// 五转任务一生只需要做一次，不会被重置。
				if(i < 4){
					config["mission"][battleMission[i]] = false
				}
			}
		}else{
			for (var i = 0 ; i < productMission.length ; i++){
				if(i < jobLevel){
					config["mission"][productMission[i]] = true
					continue
				}
				config["mission"][productMission[i]] = false
			}
		}

		// // 采集系3转以后可以直接传送小岛，将传送flag置为true。注意：此小岛怪物仅60级，和半山5的小岛不是一个地方。
		// if(category == '采集系' && jobLevel > 2){
		// 	config["mission"]["传送小岛"] = true
		// }

		// 检查称号
		for (var i = 0 ; i < playerInfo.titles.length ; i++){
			if(playerInfo.titles[i] == '开启者'){
				config["mission"]['开启者'] = true
			}
		}
		// 刷新完称号，开始写入调用方传来的任务进度。如果没有传入，则跳过。
		if(missionObj){
			for (var key in missionObj){
				if(config["mission"][key] != missionObj[key]){
					console.log('任务【' + key + '】由原状态【' + (config["mission"][key]) + '】改为【' + missionObj[key] + '】')
					config["mission"][key] = missionObj[key]
				}
			}
		}
		// 写入状态并调用callback，函数结束。
		cga.savePlayerConfig(config, cb);
		return
	}

	/**
	 * UNAecho:获取读取战斗信息等CGA全部配置的模块，由于十分常用，现在加入cgaapi中
	 */
	cga.getCGAconfigMode = () => {
		return configMode = require(cga.getrootdir() + '/通用挂机脚本/公共模块/读取战斗配置');
	}

	/**
	 * UNAecho:读取指定文件名的战斗配置的封装API，由于十分常用，现在加入cgaapi中
	 */
	cga.loadBattleConfig = (filename) => {
		let configMode = cga.getCGAconfigMode()
		configMode.manualLoad(filename)
		return
	}

	//异步获取最大银行格，必须跟柜员对话一次
	cga.getBankMaxSlots = (filter, cb) => {
		var banks = cga.GetBankItemsInfo();

		//先从配置文件里获取
		var config = cga.loadPlayerConfig();

		if(!config)
			config = {};

		if(config.maxbankslots)
		{
			console.log('最大银行格为：'+config.maxbankslots);
			cb(null, config.maxbankslots);
			return;
		} 
		else
		{
			//看看60~79，40~59，20~39是否有物品
			var bank6079 = banks.filter((val)=>{ return val.pos >= 160 });

			if(bank6079.length > 0)
			{
				cb(null, 80);
				return;
			}
			else
			{
				var testitempos = cga.findItem(filter);
				if(testitempos != -1)
				{
					cga.MoveItem(testitempos, 160, -1);

					cga.waitSysMsgTimeout((err, msg)=>{
						if(err){
							//银行第60格物品保存成功
							if(cga.GetBankItemsInfo().find((item)=>{
								return item.pos == 160;
							}) != undefined)
							{
								//第60格物品取回包里
								cga.MoveItem(160, testitempos, -1);

								config.maxbankslots = 80;
								cga.savePlayerConfig(config);
								console.log('最大银行格为：'+config.maxbankslots);
								setTimeout(cb, 1000, config.maxbankslots);

								return false;
							}
							//未知问题

							console.log('获取最大银行格时发生未知问题，可能网络不稳定或没有与柜员对话！');
							console.log('最大银行格默认为：'+20);
							setTimeout(cb, 1000, 20);
							return false;
						}

						if(msg.indexOf('您现在只能使用银行物品栏位中的第') >= 0)
						{
							var regex = msg.match(/您现在只能使用银行物品栏位中的第 (\d+)到(\d+)个！/);
							if(regex && regex.length >= 3){

								config.maxbankslots = parseInt(regex[2]);
								cga.savePlayerConfig(config);
								console.log('最大银行格为：'+config.maxbankslots);
								setTimeout(cb, 1000, config.maxbankslots);

								return false;
							}
						}

						return true;
					}, 1000);					
				}
				else
				{
					console.log('获取最大银行格失败，可能包中没有符合条件的物品！');
					console.log('最大银行格默认为：'+20);
					setTimeout(cb, 1000, 20);
					return false;
				}
			}
		}
	};

	//寻找银行中的空闲格子, 参数：物品filter、最大堆叠数量、最大银行格
	cga.findBankEmptySlot = (filter, maxcount, maxslots = 20) => {
		
		var banks = cga.GetBankItemsInfo();

		var arr = [];

		for(var i = 0; i < banks.length; ++i){
			arr[banks[i].pos-100] = banks[i];
		}
		
		for(var i = 0; i < maxslots; ++i){
			if(typeof arr[i] != 'undefined'){
				if(typeof filter == 'string' && maxcount > 0){
					if(arr[i].name == filter && arr[i].count < maxcount)
						return 100+i;
				}
				else if(typeof filter == 'number' && maxcount > 0){
					if(arr[i].itemid == filter && arr[i].count < maxcount)
						return 100+i;
				}
				else if(typeof filter == 'function' && maxcount > 0){
					if(filter(arr[i]) && arr[i].count < maxcount)
						return 100+i;
				}
			} else {
				return 100+i;
			}
		}
		
		return -1;
	}

	//寻找银行中的空闲宠物格子, 参数：物品filter、最大堆叠数量、最大银行格
	cga.findBankPetEmptySlot = (maxslots = 5) => {
		
		var pets = cga.GetBankPetsInfo()

		var arr = [];

		for(var i = 0; i < pets.length; i++){
			arr[pets[i].index-100] = pets[i];
		}
		
		for(var i = 0; i < maxslots; i++){
			if(typeof arr[i] == 'undefined'){
				return 100+i;
			}
		}
		
		return -1;
	}
	
	//寻找背包中的空闲格子
	cga.findInventoryEmptySlot = (itemname, maxcount) =>{
		
		var items = cga.GetItemsInfo();

		var arr = [];

		for(var i = 0; i < items.length; ++i){
			arr[items[i].pos-8] = items[i];
		}
		
		for(var i = 0; i < 20; ++i){
			if(typeof arr[i] != 'undefined'){
				if(typeof itemname == 'string' && maxcount > 0){
					if(arr[i].name == itemname && arr[i].count < maxcount)
						return 8+i;
				}
			} else {
				return 8+i;
			}
		}
		
		return -1;
	}

	//获取背包中的空闲格子数量
	cga.getInventoryEmptySlotCount = () =>{
		
		var items = cga.GetItemsInfo();

		var arr = [];

		for(var i = 0; i < items.length; ++i){
			arr[items[i].pos-8] = items[i];
		}
		var count = 0;
		
		for(var i = 0; i < 20; ++i){
			if(!arr[i])
				count ++;
		}
		
		return count;
	}

	//将符合条件的物品存至银行，maxcount为最大堆叠数量
	cga.saveToBankOnce = (filter, maxcount, cb)=>{
		var itempos = cga.findItem(filter);
		if(itempos == -1){
			cb(new Error('包里没有该物品, 无法存放到银行'));
			return;
		}

		cga.getBankMaxSlots(filter, (err, maxslots)=>{
			if(err){
				cb(err);
				return;
			}

			var emptyslot = cga.findBankEmptySlot(filter, maxcount, maxslots);
			if(emptyslot == -1){
				cb(new Error('银行没有空位, 无法存放到银行'));
				return;
			}
			
			cga.MoveItem(itempos, emptyslot, -1);

			setTimeout(()=>{
				var bankitem = cga.GetBankItemsInfo().find((item)=>{
					return item.pos == emptyslot;
				});
				if(bankitem != undefined)
				{
					//保存成功
					console.log(bankitem.name+' 成功将物品存到银行第 ' + (bankitem.pos - 100 + 1) + ' 格!');
					cb(null);
				}
				else
				{
					cb(new Error('保存到银行失败，可能银行格子已满、未与柜员对话或网络问题'));
				}
			}, 1000);
		});
	}

	// UNAecho:将符合条件的物品从银行取出，maxcount为最大堆叠数量
	// filter仅支持String。TODO filter支持number、#开头的String类型itemid（参考其他背包类API）以及func自定义函数
	cga.drawFromBankOnce = (filter, maxcount, cb)=>{
		var targetItem = cga.GetBankItemsInfo().find((it)=>{
			if(it.name == filter)
				return true
		});
		
		if(!targetItem){
			cb(new Error('银行里没有该物品, 无法取出。'));
			return;
		}

		var emptyslot = cga.findInventoryEmptySlot(filter, maxcount);
		if(emptyslot == -1){
			cb(new Error('背包没有空位, 无法从银行取出'));
			return;
		}
		
		cga.MoveItem(targetItem.pos, emptyslot, -1);

		setTimeout(()=>{
			var item = cga.GetItemsInfo().find((item)=>{
				return item.pos == emptyslot;
			});
			if(item != undefined)
			{
				//取出成功
				console.log(item.name+' 成功从银行中取出到背包第 ' + (item.pos - 8 + 1) + ' 格!');
				cb(null);
			}
			else
			{
				cb(new Error('从银行取物品失败，可能背包格子已满、未与柜员对话或网络问题'));
			}
		}, 1000);
	}
	
	//将符合条件的宠物存至银行
	cga.savePetToBankOnce = (filter, customerName, cb)=>{
		var petindex = cga.findPet(filter, customerName);

		if(petindex == -1){
			cb(new Error('包里没有该宠物, 无法存放到银行'));
			return;
		}

		var emptyslot = cga.findBankPetEmptySlot();
		if(emptyslot == -1){
			cb(new Error('银行没有空位, 无法存放到银行'));
			return;
		}
		
		cga.MovePet(petindex, emptyslot);

		setTimeout(()=>{
			var bankpet = cga.GetBankPetsInfo().find((pet)=>{
				return pet.index == emptyslot;
			});
			if(bankpet != undefined)
			{
				//保存成功
				console.log(bankpet.name+' 成功将宠物存到银行第 ' + (bankpet.index - 100 + 1) + ' 格!');
				cb(null);
			}
			else
			{
				cb(new Error('保存到银行失败，可能银行格子已满、未与柜员对话或网络问题'));
			}
		}, 1000);
	}

	//循环将符合条件的物品存至银行，maxcount为最大堆叠数量
	cga.saveToBankAll = (filter, maxcount, cb)=>{
		console.log('开始批量保存物品到银行...');
		var repeat = ()=>{
			cga.saveToBankOnce(filter, maxcount, (err)=>{
				if(err){
					console.log(err);
					cb(err);
					return;
				}
				if(cga.findItem(filter) == -1){
					console.log('包里已经没有指定物品，批量保存到银行执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}
		
		repeat();		
	}

	// UNAecho:循环将符合条件的物品从银行取出，maxcount为最大堆叠数量
	// filter仅支持String。TODO filter支持number、#开头的String类型itemid（参考其他背包类API）以及func自定义函数
	cga.drawFromBankAll = (filter, maxcount, cb)=>{
		console.log('开始批量从银行取出物品...');
		var repeat = ()=>{
			cga.drawFromBankOnce(filter, maxcount, (err)=>{
				if(err){
					console.log(err);
					cb(err);
					return;
				}
				var targetItem = cga.GetBankItemsInfo().find((it)=>{
					if(it.name == filter)
						return true
					return false
				});
				if(targetItem == undefined){
					console.log('银行里已经没有指定物品，批量从银行取出物品执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}
		
		repeat();		
	}

	//循环将符合条件的宠物存至银行。
	cga.savePetToBankAll = (filter, customerName, cb)=>{
		console.log('开始批量保存宠物到银行...');
		var repeat = ()=>{
			cga.savePetToBankOnce(filter, customerName, (err)=>{
				if(err){
					console.log(err);
					cb(err);
					return;
				}
				if(cga.findPet(filter, customerName) == -1){
					console.log('包里已经没有指定宠物，批量保存到银行执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}
		
		repeat();		
	}

	//原地高速移动，dir为方向
	cga.freqMove = function(dir){
		var freqMoveDirTable = [ 4, 5, 6, 7, 0, 1, 2, 3 ];
		var freqMoveDir = dir;
		var pos = cga.GetMapXY();
		var index3 = cga.GetMapIndex().index3;
		var counter = 0;
		var move = ()=>{
			var result = true;
			try
			{
				var tmpIndex3 = cga.GetMapIndex().index3;
				if(tmpIndex3 == index3)
				{
					var curpos = cga.GetMapXY();
					if(freqMoveDir == 0){
						if(pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 4){
						if(pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 2){
						if(pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 6){
						if(pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 1){
						if(pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 5){
						if(pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 3){
						if(pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if(freqMoveDir == 7){
						if(pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					
					counter++;
					if(counter % 4 == 0){
						if(!cga.moveThink('freqMove')){
							console.log('freqMove被中断');
							cga.isMoveThinking = false;
							return;
						}
					}
				}
				else
				{
					if(!cga.moveThink('freqMoveMapChanged')){
						console.log('freqMoveMapChanged被中断');
						cga.isMoveThinking = false;
						return;
					}
					console.log('地图不同，freqMove暂停运行');
				}
			}
			catch(e){
				console.log(e);
			}
			
			setTimeout(move, 300);
		}
		
		move();
	}
	
	//从NPC对话框内容解析商店购物列表
	cga.parseBuyStoreMsg = (dlg)=>{
		
		if(!dlg){
			throw new Error('解析商店购物列表失败，可能对话超时!');
			return null;
		}

		if(!dlg.message){
			throw new Error('解析商店购物列表失败，可能对话超时!');
			return null;
		}

		//28?
		if(dlg.type != 6){
			throw new Error('解析商店购物列表失败，可能对话不是购物商店!');
			return null;
		}
		
		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);
		
		if(match.length < 5){
			throw new Error('解析商店购物列表失败，格式错误!');
			return null;
		}

		if((match.length - 5) % 6 != 0){
			throw new Error('解析商店购物列表失败，格式错误!');
			return null;
		}
		
		var storeItemCount = (match.length - 5) / 6;
		
		var obj = {
			storeid : match[0],
			name : match[1],
			welcome : match[2],
			insuff_funds : match[3],
			insuff_inventory : match[4],
			items : []
		}
		for(var i = 0; i < storeItemCount; ++i){
			obj.items.push({
				index : i,
				name : match[5 + 6 * i + 0],
				image_id : parseInt(match[5 + 6 * i + 1]),
				cost : parseInt(match[5 + 6 * i + 2]),
				attr : match[5 + 6 * i + 3],
				batch : parseInt(match[5 + 6 * i + 4]),//最少买多少
				max_buy : parseInt(match[5 + 6 * i + 5]),//最多买多少
			});
		}
		return obj;
	}

	//从NPC对话框内容解析兑换列表
	/**
	 * UNA注释：作者可能没有发现兑换商店(type=28)的json体，结构和商店购物(type=6)不同
	 * 购买商店是RegExp(/([^|\n]+)/g)解析后，前5行是商店信息，然后每6行是每个商品的信息。
	 * 而兑换商店是RegExp(/([^|\n]+)/g)解析后，前7行是商店信息，包含2条兑换材料信息（如用曙光医院2楼，用蕃窃换小麦粉）然后每5行是每个商品的信息。
	 * */
	cga.parseExchangeStoreMsg = (dlg)=>{

		if(!dlg){
			throw new Error('解析兑换列表失败，可能对话超时!');
			return null;
		}

		if(!dlg.message){
			throw new Error('解析兑换列表失败，可能对话超时!');
			return null;
		}

		if(dlg.type != 28){
			throw new Error('解析兑换列表失败，可能对话不是兑换商店!');
			return null;
		}
		
		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);
		var storeInfoLen = 7
		var goodsInfoLen = 5
		if(match.length < storeInfoLen){
			throw new Error('解析兑换列表失败，格式错误!');
			return null;
		}

		if((match.length - storeInfoLen) % goodsInfoLen != 0){
			throw new Error('解析兑换列表失败，格式错误!');
			return null;
		}
		
		var storeItemCount = (match.length - storeInfoLen) / goodsInfoLen;
		
		var obj = {
			storeid : match[0],
			name : match[1],
			welcome : match[2],
			insuff_funds : match[3],
			insuff_inventory : match[4],
			// UNA注释：和type=6不同，type=28的时候，有兑换材料信息。其实可以理解为6的原材料是魔币，而28的原材料是物品。
			required_image_id : match[5],
			required : match[6],
			items : []
		}
		for(var i = 0; i < storeItemCount; ++i){
			obj.items.push({
				index : i,
				// UNA注释：由于物品拼字后面会带一个(堆叠数)，故用正则去掉
				name : (match[storeInfoLen + goodsInfoLen * i + 0]).match(new RegExp(/([^\d\(\)]+)/g))[0],
				// UNA注释：保留原名称，方便后续debug
				raw_name : match[storeInfoLen + goodsInfoLen * i + 0],
				image_id : parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
				count : parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),//count个required才能换取一个
				batch : parseInt(match[storeInfoLen + goodsInfoLen * i + 3]),//UNA注释：该商品每组的堆叠数量
				attr : match[storeInfoLen + goodsInfoLen * i + 4],
			});
		}
		return obj;
	}

	/**
	 * UNA:和NPC交换物品API
	 * goods:目标物品名称
	 * count:交易数量，注意并不是物品堆叠数，而是游戏商店中"+"和"-"号点出的交换数量。如果不输入，则默认将材料全部兑换。
	 *  */ 
	cga.exchangeItemFromStore = (cb,goods,count)=>{
		setTimeout(() => {
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(0, 0);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					var store = cga.parseExchangeStoreMsg(dlg);
					if(!store)
					{
						cb(new Error('兑换商品时，商店内容解析失败'));
						return;
					}
					if(!store.required || store.required.length == 0){
						cb(new Error('兑换商品时，商店需求材料解析失败'));
						return;
					}
		
					var buyitem = [];
					// 后续用-1判断是全兑换，还是指定数量
					var buyCount = ((count === undefined || count === null) ? -1 : count)
					store.items.forEach((it)=>{
						if(it.name == goods){
							buyitem.push({index: it.index, count: (buyCount == -1 ? parseInt(cga.getItemCount(store.required) / it.count):buyCount)});
						}
					});
		
					cga.BuyNPCStore(buyitem);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if (cb) cb(null)
						return;
					});
				});
			});
		}, 1500);
	}
	//从NPC对话框内容解析宠物技能学习列表
	cga.parsePetSkillStoreMsg = (dlg)=>{
		
		if(!dlg){
			throw new Error('解析宠物学习技能列表失败，可能对话超时!');
			return null;
		}

		if(!dlg.message){
			throw new Error('解析宠物学习技能列表失败，可能对话超时!');
			return null;
		}

		if(dlg.type != 24){
			throw new Error('解析宠物学习技能列表失败，可能对话不是宠物技能商店!');
			return null;
		}

		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);
		
		if(match.length < 5){
			throw new Error('解析宠物学习技能列表失败，格式错误!');
			return null;
		}
		
		if((match.length - 5) % 4 != 0){
			throw new Error('解析宠物学习技能列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - 5) / 4;
		
		var obj = {
			storeid : match[0],
			name : match[1],
			welcome : match[2],
			insuff_funds : match[3],
			insuff_pets : match[4],
			skills : []
		}

		for(var i = 0; i < storeItemCount; ++i){
			obj.skills.push({
				index : i,
				name : match[5 + 4 * i + 0],
				mana : parseInt(match[5 + 4 * i + 1]),
				cost : parseInt(match[5 + 4 * i + 2]),
				info : match[5 + 4 * i + 3],
			});
		}
		return obj;
	}
	
	//从NPC对话框内容解析遗忘技能列表
	cga.parseForgetSkillStoreMsg = (dlg)=>{
		
		if(!dlg){
			throw new Error('解析遗忘技能列表失败，可能对话超时!');
			return null;
		}

		if(!dlg.message){
			throw new Error('解析遗忘技能列表失败，可能对话超时!');
			return null;
		}

		if(dlg.type != 18){
			throw new Error('解析遗忘技能列表失败，可能对话不是遗忘技能!');
			return null;
		}
		
		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);
		
		if(match.length < 3){
			throw new Error('解析遗忘技能列表失败，格式错误!');
			return null;
		}
		
		if((match.length - 3) % 3 != 0){
			throw new Error('解析遗忘技能列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - 3) / 3;
		
		var obj = {
			storeid : match[0],
			name : match[1],
			welcome : match[2],
			skills : []
		}

		for(var i = 0; i < storeItemCount; ++i){
			obj.skills.push({
				index : i,
				name : match[3 + 3 * i + 0],
				level : parseInt(match[3 + 3 * i + 1]),
				slots : parseInt(match[3 + 3 * i + 2]),
			});
		}
		return obj;
	}

	//获取队伍成员详细信息
	cga.getTeamPlayers = ()=>{
		var teaminfo = cga.GetTeamPlayerInfo();
		var units = cga.GetMapUnits();
		var playerinfo = cga.GetPlayerInfo();
		for(var i in teaminfo){
		
			for(var j in units){
				if(units[j].type == 8 && units[j].unit_id == teaminfo[i].unit_id){
					teaminfo[i].name = units[j].unit_name;
					teaminfo[i].nick = units[j].nick_name;
					teaminfo[i].xpos = units[j].xpos;
					teaminfo[i].ypos = units[j].ypos;
					teaminfo[i].level = units[j].level;
					teaminfo[i].injury = units[j].injury;
					break;
				}
			}
			if(playerinfo.unitid == teaminfo[i].unit_id){
				teaminfo[i].name = playerinfo.name;
				teaminfo[i].nick = playerinfo.nick;
				teaminfo[i].level = playerinfo.level;
				teaminfo[i].injury = playerinfo.health > 0 ? 1 : 0;
				teaminfo[i].is_me = true;
			}
		}
		return teaminfo;
	}
	
	//和名字为name的玩家组队（必须在附近1x1范围）
	cga.addTeammate = (name, cb)=>{
		var unit = cga.findPlayerUnit(name);
		var mypos = cga.GetMapXY();
		if(unit == null || 
		!cga.isDistanceClose(unit.xpos, unit.ypos, mypos.x, mypos.y) || 
		(unit.xpos == mypos.x && unit.ypos == mypos.y)){
			
			cb(false);
			return;
		}

		setTimeout(()=>{
			unit = cga.findPlayerUnit(name);
			
			if(unit == null){
				cb(false);
				return;
			}
			
			cga.TurnTo(unit.xpos, unit.ypos);
			setTimeout(()=>{
				cga.DoRequest(cga.REQUEST_TYPE_JOINTEAM);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					var stripper = "你要和谁组成队伍？";
					if(dlg && dlg.message && dlg.message.indexOf(stripper) >= 0){
						var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
						strip = strip.replace(/\\z/g,"|");
						strip = strip.replace(/\\n/g,"|");
						var reg = new RegExp(/([^|\n]+)/g)
						var match = strip.match(reg);
						//console.log(match);
						for(var j = 0; j < match.length; ++j){
							if(match[j] == name){
								console.log(j);
								cga.ClickNPCDialog(0, j);
							}
						}
					}

					setTimeout(()=>{
						var teamPlayers = cga.getTeamPlayers();

						if(teamPlayers.length && teamPlayers[0].name == name){
							cb(true);
							return;
						} else if(teamPlayers.length && teamPlayers[0].name != name){
							cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						}
						
						cb(false);
						return;
					}, 1500);
				}, 1500);
			}, 1500);
		}, 1000);
	}
	
	/**
	 * UNAecho:简易踢人API
	 * @param {*} kickArr 被踢者列表，例:['UNAの小号1','UNAの小号2']
	 * @param {*} cb 
	 */
	cga.kickPlayer = (kickArr, cb)=>{
		console.log('踢人名单:',kickArr)
		let kick = ()=>{
			let name = kickArr.shift()
			// 如果列表中还有没踢完的人
			if(name){
				cga.waitSysMsg((r)=>{
					if(r.indexOf('被你请出队伍') != -1 || r.indexOf('离开') != -1){
						setTimeout(kick, 1000);
						return false
					}
					return true
				})
				console.log('开始踢人..')
				cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					var stripper = "你要把谁踢出队伍？";
					if(dlg && dlg.message && dlg.message.indexOf(stripper) >= 0){
						var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
						strip = strip.replace(/\\z/g,"|");
						strip = strip.replace(/\\n/g,"|");
						var reg = new RegExp(/([^|\n]+)/g)
						var match = strip.match(reg);
						for(var j = 0; j < match.length; ++j){
							if(match[j] == name){
								console.log('【'+ match[j] +'】不符合入队条件，踢出。')
								cga.ClickNPCDialog(0, j / 2);
								break;
							}
						}
					}
				});
			}else{// 列表已经没有被踢的人
				console.log('踢人完毕..')
				cb(null)
				return
			}
		}

		kick()
		return
	}

	//等待名字在teammates列表中的的玩家组队，并自动踢出不符合teammates列表的陌生人。
	cga.waitTeammates = (teammates, cb)=>{
				
		var teamplayers = cga.getTeamPlayers();
		
		if(teammates.length == 0 && teamplayers.length == 0)
		{
			setTimeout(cb, 2000, true);
			return;
		}
		
		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		// UNAecho: 改为大于等于，用等于会出现无限等待的bug
		if(teamplayers.length >= teammates.length){
			for(var i = 0; i < teamplayers.length; ++i){
				// 自己不能踢自己
				if (teamplayers[i].is_me){
					continue
				}
				if(!is_array_contain(teammates, teamplayers[i].name)){
					//Unknown teammates, kick
					cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						var stripper = "你要把谁踢出队伍？";
						if(dlg && dlg.message && dlg.message.indexOf(stripper) >= 0){
							var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
							strip = strip.replace(/\\z/g,"|");
							strip = strip.replace(/\\n/g,"|");
							// console.log(strip);
							var reg = new RegExp(/([^|\n]+)/g)
							var match = strip.match(reg);
							//console.log(match);
							for(var j = 0; j < match.length; ++j){
								if(match[j] == teamplayers[i].name){
									console.log('【'+ teamplayers[i].name +'】不符合入队条件，踢出。')
									cga.ClickNPCDialog(0, j / 2);
									break;
								}
							}
						}
					});
					cb(false);
					return;
				}
			}
			
			setTimeout(cb, 2000, true);
			return;
		}else{
			let lateList = [].concat(teammates)
			for (let i = 0; i < teamplayers.length; i++) {
				// 将已经在队伍的人删除。由于teammates每次都传入，所以不用顾虑刷新问题
				let index = lateList.indexOf(teamplayers[i].name)
				// 如果已经就位，则从名单上划掉
				if(index != -1){
					lateList.splice(index, 1)
				}
				
			}
			// 不但返回组队false，并且还要附上迟到名单
			cb(false, lateList);
		}
	}
	/**
	 * UNAecho: 固定组队的封装API，包含了队长和队员的逻辑，调用时，仅需传入固定的队伍名单与队长坐标即可
	 * 此API逻辑与cga.buildTeam一致，唯一区别在于cga.buildTeam有超时的选项
	 * 
	 * 此API为历史版本，已弃用。有上位替代，名字也是cga.buildTeam
	 * @param {Array} teammates 
	 * @param {Array} pos 组队时，队长所处坐标
	 * @param {*} cb 
	 */
	// cga.buildTeam = (teammates,pos,cb)=>{
	// 	if(!teammates instanceof Array || !pos instanceof Array){
	// 		throw new Error('teammates和pos必须均为Array')
	// 	}
	// 	if(!teammates.length){
	// 		console.log('传入的数组为空，退出cga.buildTeam')
	// 		cb(null)
	// 		return
	// 	}
	// 	if(pos.length != 2){
	// 		throw new Error('pos必须为2维int型数组')
	// 	}
	// 	var playerInfo = cga.GetPlayerInfo();
	// 	var teamplayers = cga.getTeamPlayers();
	// 	var isleader = teammates[0] == playerInfo.name ? true : false
	// 	var mapXY = cga.GetMapXY();

	// 	if(isleader){
	// 		var waitFor = ()=>{
	// 			cga.waitTeammates(teammates, (r)=>{
	// 				if(r){
	// 					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
	// 					cb(true);
	// 					return;
	// 				}
	// 				setTimeout(waitFor, 1000);
	// 			});
	// 		}
	// 		if(mapXY.x == pos[0] && mapXY.y == pos[1]){
	// 			waitFor()
	// 		}else{
	// 			cga.walkList([
	// 				pos
	// 			], () => {
	// 				waitFor()
	// 			});
	// 		}
	// 	}else {
	// 		var waitAdd = ()=>{
	// 			cga.addTeammate(teammates[0], (r)=>{
	// 				if(r){
	// 					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
	// 					cb(true);
	// 					return;
	// 				}
	// 				setTimeout(waitAdd, 1000);
	// 			});
	// 		}

	// 		// 如果在队伍中，先判断是不是在指定队伍中
	// 		if(teamplayers.length){
	// 			if(teamplayers[0].name == teammates[0]){
	// 				console.log('已经在指定队伍中，cga.buildTeam执行完毕')
	// 				cb(true)
	// 				return
	// 			}else{
	// 				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
	// 				setTimeout(cb,1000)
	// 				return
	// 			}
	// 		}else{// 如果不在队伍里，再执行正常逻辑
	// 			var memberPos = cga.getRandomSpace(pos[0], pos[1]);
	// 			if(mapXY.x == memberPos[0] && mapXY.y == memberPos[1]){
	// 				waitAdd()
	// 			}else{
	// 				cga.walkList([
	// 					memberPos
	// 				], () => {
	// 					waitAdd()
	// 				});
	// 			}

	// 		}
	// 	}
	// }

	/**
	 * UNAecho: 带有名称过滤的组队模式
	 * @param {String | Function} filter 如果是string，踢出名称中不含此string的队员。如果是func，踢掉返回false的队员
	 * 如果输入null或undefined，则退化为只看人数的自由组队
	 * @param {Number} minTeamMemberCount 队伍最小人数
	 * @param {*} cb 
	 * @returns 
	 */
	cga.waitTeammatesWithFilter = (filter, minTeamMemberCount,cb)=>{

		var teamplayers = cga.getTeamPlayers();
		
		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		
		if(teamplayers.length >= minTeamMemberCount){
			// 如果不输入，则退化为自由组队
			if (!filter){
				setTimeout(cb, 2000, true);
				return
			}

			for(var i = 0; i < teamplayers.length; ++i){
				if (teamplayers[i].is_me){
					continue
				}
				if(
					(typeof filter == 'string' && teamplayers[i].name.indexOf(filter) == -1) ||
					(typeof filter == 'function' && !filter(teamplayers[i].name))
				){
					//Unknown teammates, kick
					cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						var stripper = "你要把谁踢出队伍？";
						if(dlg && dlg.message && dlg.message.indexOf(stripper) >= 0){
							var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
							strip = strip.replace(/\\z/g,"|");
							strip = strip.replace(/\\n/g,"|");
							// console.log(strip);
							var reg = new RegExp(/([^|\n]+)/g)
							var match = strip.match(reg);
							// console.log(match);
							for(var j = 0; j < match.length; ++j){
								if(match[j] == teamplayers[i].name){
									console.log('【'+ teamplayers[i].name +'】不符合入队条件，踢出。')
									cga.ClickNPCDialog(0, j / 2);
									break;
								}
							}
						}
					});
					cb(false);
					return;
				}
			}
			
			setTimeout(cb, 2000, true);
			return;
		}
		
		cb(false);
	}
	
	/**
	 * UNAecho : 队长队员通用加队API，可设定超时范围。
	 * 寻找队伍并加入（双方必须在附近1x1范围），并判断队员是否与预期相符。
	 * @param {Array} teammates 队伍成员信息，数据结构为String数组，必须为队员名称。
	 * 【注意】队长的判定是teammates第一个人的名字
	 * @param {int} timeout 超时时间，以毫秒为单位。如果填0则视为无限等待。
	 * @param {Array} pos 可选，队长站立坐标，如果传入，则全队会先走至合适的位置，再进行组队逻辑
	 * @param {*} cb 回调函数，所有队员齐全则传入'ok'，如果不满足条件或没有队伍，会等待至超时，调用cb并传入'timeout'
	 */
	cga.buildTeam = (teammates, timeout, pos, cb) => {
		// 由于cga.waitTeammates判定组队ready延迟2秒return，所以本API需要至少3秒延迟。
		// 如果延迟为0，则视为无限等待
		if (timeout > 0 && timeout < 2000) {
			timeout = 3000
		}

		if (!pos instanceof Array) {
			throw new Error('pos如果传入，类型必须为Array')
		}
		if (pos.length != 2) {
			throw new Error('pos如果传入，则必须是长度为2的int型Array')
		}

		var playerInfo = cga.GetPlayerInfo();
		var isLeader = teammates[0] == playerInfo.name ? true : false
		var mapXY = cga.GetMapXY();
		var start = Date.now()
		// 两个队伍信息的临时变量
		var curTeam = null
		var tmpTeam = null

		// 队员专用，检查其他队员是否与预期成员相符
		const checkOthers = () => {
			tmpTeam = cga.getTeamPlayers();
			if (tmpTeam.length < teammates.length) {
				// console.log('人数不足，checkOthers返回false')
				return false
			}

			for (let t = 0; t < tmpTeam.length; t++) {
				/**
				 * UNAecho开发提醒:
				 * cga.getTeamPlayers()是根据地图上的单位获取信息的，游戏出现BUG时(看不到附近的玩家、NPC等)会导致cga.getTeamPlayers()出现返回队员的信息是全0的情况
				 * 也就是hp、maxhp等信息全0，导致逻辑无法进行。所以这里遇到异常数据（以maxhp==0为异常判断，maxhp > 0是正常数据）时，直接跳过，防止逻辑异常
				 */
				if (tmpTeam[t].maxhp > 0 && teammates.indexOf(tmpTeam[t].name) == -1) {
					console.log('队员:',tmpTeam[t].name,'与预期队伍:', teammates ,'不匹配，checkOthers返回false')
					return false
				}
			}
			return true
		}

		var retry = () => {
			let currentTime = new Date()
			// 间隔报时
			if (currentTime.getSeconds() % 10 == 0) {
				console.log('已等待' + Math.floor((currentTime.getTime() - start) / 1000) + '秒')
			}

			if (timeout > 0 && (currentTime.getTime() - start) >= timeout) {
				cb('timeout')
				return
			}

			if (isLeader) {
				cga.waitTeammates(teammates, (r, lateList) => {
					if (r) {
						cb('ok')
						return
					}
					// 间隔报迟到队员
					if (lateList && currentTime.getSeconds() % 10 == 0) {
						console.log('迟到队员:', lateList)
					}
					setTimeout(retry, 1000);
					return
				})
			} else {
				curTeam = cga.getTeamPlayers();
				if (curTeam.length && checkOthers()) {
					cb('ok')
					return
				} else if (!curTeam.length) {
					cga.addTeammate(teammates[0], (r) => {
						if (r && checkOthers()) {
							cb('ok')
							return
						}
						setTimeout(retry, 1000);
					})
					return
				}
				setTimeout(retry, 1000);
				return
			}
		}

		// 如果已经在队伍中，直接进入retry
		if(cga.getTeamPlayers().length){
			retry()
			return
		}

		if(isLeader){
			if(mapXY.x == pos[0] && mapXY.y == pos[1]){
				retry()
			}else{
				cga.walkList([
					pos
				], () => {
					retry()
				});
			}
		}else{
			var memberPos = cga.getRandomSpace(pos[0], pos[1]);
			if(mapXY.x == memberPos[0] && mapXY.y == memberPos[1]){
				retry()
			}else{
				cga.walkList([
					memberPos
				], () => {
					retry()
				});
			}
		}
		return
	}

	//监听队友聊天信息
	cga.waitTeammateSay = (cb)=>{
		
		cga.AsyncWaitChatMsg((err, r)=>{

			if(!r){
				cga.waitTeammateSay(cb);
				return;
			}
			
			var listen = true;
			var fromTeammate = null;
			var teamplayers = cga.getTeamPlayers();

			if(!teamplayers.length){
				var playerInfo = cga.GetPlayerInfo();
				if(playerInfo.unitid == r.unitid){
					fromTeammate = playerInfo;
					fromTeammate.index = 0;
					fromTeammate.is_me = true;
				}
			}

			for(var i in teamplayers){
				if(teamplayers[i].unit_id == r.unitid){
					fromTeammate = teamplayers[i];
					fromTeammate.index = i;
					break;
				}
			}
			
			if(fromTeammate){
				var msgheader = fromTeammate.name + ': ';
				if(r.msg.indexOf(msgheader) >= 0){
					var msg = r.msg.substr(r.msg.indexOf(msgheader) + msgheader.length);
					
					if (msg.indexOf('[交易]') == 0)
						msg = msg.substr('[交易]' .length);
					listen = cb(fromTeammate, msg);
				}
			}

			if(listen == true)
				cga.waitTeammateSay(cb);
		}, 1000);
	}
	
	//监听队友聊天信息 队友必须说“1”
	cga.waitTeammateSayNextStage = (teammates, cb)=>{
	
		var teammate_state = {};
		var teammate_ready = 0;

		cga.waitTeammateSay((player, msg)=>{

			if(msg == '1' && teammate_state[player.name] !== true){
				teammate_state[player.name] = true;
				teammate_ready ++;
			}

			if((teammates.length && teammate_ready >= teammates.length) || (!teammates.length && teammate_ready == 1)){
				//all teammates are ready
				cb(true);
				return false;
			}
			
			return true;
		});
	}
	
	//监听队友聊天信息 队友必须说“1”或“2”
	cga.waitTeammateSayNextStage2 = (teammates, cb)=>{
		var teammate_state = {};
		var teammate_ready = 0;
		var teammate_notready = 0;

		cga.waitTeammateSay((player, msg)=>{

			if(teammate_state[player.name] !== true && teammate_state[player.name] !== false){
				if(msg == '1'){
					teammate_state[player.name] = true;
					teammate_ready ++;
				} else if(msg == '2'){
					teammate_state[player.name] = false;
					teammate_notready ++;
				}
				// console.log(teammate_state)
				// console.log('teammate_ready:' + teammate_ready)
				// console.log('teammate_notready:' + teammate_notready)
			}

			if((teammates.length && teammate_ready >= teammates.length) || (!teammates.length && teammate_ready == 1)){
				//all teammates are ready
				// console.log('all teammates are ready')
				cb(true);
				return false;
			}
			
			if((teammates.length && teammate_ready + teammate_notready >= teammates.length) || (!teammates.length && teammate_ready + teammate_notready == 1)){
				//some teammates are not ready
				// console.log('some teammates are not ready')
				cb(false);
				return false;
			}
			
			return true;
		});
	}

	cga.waitTeammateSayandreturninfo = (teammates, positivemsg,nativemsg,cb)=>{
		var teammate_info = {
			teammate_ready : 0,
			teammate_answercount:0
		};

		cga.waitTeammateSay((player, msg)=>{

			if(teammate_info[player.name] !== true && teammate_info[player.name] !== false){
				console.log('msg :  ' + msg.indexOf(positivemsg))
				if(msg.indexOf(positivemsg) >= 0){
					teammate_info[player.name] = true;
					teammate_info.teammate_ready ++;
					teammate_info.teammate_answercount ++;
				} else if((msg.indexOf(nativemsg) >= 0)){
					teammate_info[player.name] = false;
					teammate_info.teammate_answercount ++;
				}
			}
			console.log('teammates.teammate_ready ' + teammate_info.teammate_ready+ 'readycount : ' + teammate_info.teammate_answercount)
			if((teammates.length && teammate_info.teammate_answercount >= teammates.length) || (!teammates.length && teammate_answercount == 1)){
				//all teammates are ready
				cb(teammate_info);
				return false;
			}
			
			return true;
		});
	}

	// UNAecho:队内使用自定义称号进行交流，注意称号有16字节长度限制
	cga.waitTeammateInfo = (teammates, infoFunc, cb)=>{
		// 如果没传入指定队伍，则自动以队内人员为准。
		if(!teammates)
			teammates = cga.getTeamPlayers()
		if(!teammates.length){
			console.log('没有队员，退出cga.waitTeammateInfo，回调参数传入null')
			setTimeout(cb, 1000, null);
			return
		}
		
		const identifier = ["z","j","f","m","a"]
		const reg = new RegExp(/[zjfma]{1}[oknu\d]{2}/g)
		const infoFuncValue = infoFunc()
		
		var teammate_info = {};
		cga.isTeamLeader = (teammates[0].name == cga.GetPlayerInfo().name || teammates.length == 0) ? true : false;

		var checkTeammates = (cb)=>{
			var listen = true

			// 注意这里是刷新队内状态，一切以teamCommunicateTest传入的teammates为验证数据的基础。
			// 因为可能在验证期间，有非teammates的角色（如：其他玩家）错加入队伍。
			var teamplayers = cga.getTeamPlayers()

			if(teammates.length != teamplayers.length){
				console.warn('队内玩家数量与预期玩家数量不符')
				setTimeout(checkTeammates, 1000, cb);
				return
			}

			for (let t = 0; t < teamplayers.length; t++) {
				let tmpNick = identifier[t].toString() + infoFuncValue
				if(teamplayers[t].is_me){
					if(teamplayers[t].nick != tmpNick){
						cga.ChangeNickName(tmpNick)
						console.log("更改nickname:【" + tmpNick + "】")
					}
					continue
				}
				
				if(!cga.isTeamLeader && t > 0)
					continue
				
				memberNick = teamplayers[t].nick.match(reg)
				if(!memberNick){
					continue	
				}
				memberNick.forEach((n)=>{
					let k = identifier.indexOf(n[0])
					if(k == -1)
						return
					let v = n.slice(1,3)
					let result = infoFunc(v)
					if(result === true){
						teammate_info[teamplayers[k].name] = v
						return
					}
				})
			}

			listen = cb(teammate_info)
			if(listen == true)
				setTimeout(checkTeammates, 1000, cb);
		}
		
		checkTeammates((teammate_info)=>{
			let readycount = cga.isTeamLeader ? teammates.length - 1 : 1
			if(Object.keys(teammate_info).length == readycount){
				cb(teammate_info)
				return false
			}
			return true
		})
	}

	/**
	 * UNAecho:队员之间共享全队信息。
	 * 使用修改【玩家称号】作为传递手段。注意玩家自定义的称号有【16字节】长度限制
	 * @param {*} memberCnt 仅队长使用，队内人数满足的时候，开启问题轮询
	 * @param {Array} reqSequence 轮询内容，有格式限制。必须为String数组，且每个元素必须带有【前置特殊符号】。
	 * 特殊符号具体为以下几种：
	 * i:item名称，询问全体队员是否持有某种道具，队员返回道具数量
	 * #:与i相同，但询问的是道具id，队员返回道具数量
	 * t:称号持有清空，询问全体队员是否拥有某种称号，队员返回0表示没有，1表示有
	 * m:任务完成情况，记录在【个人配置中】。队员返回任务完成情况，0表示没完成，1表示已完成
	 * 例：['i承认之戒','#491677','t背叛者','m小岛之谜']
	 * 表示分别询问队员道具【承认之戒】、道具id【491677】、称号【背叛者】持有情况，以及任务【小岛之谜】是否已完成
	 * 
	 * @param {*} cb 回调函数，全员信息收集完毕后制作成object，调用cb并将object传入
	 * @returns 
	 */
	cga.shareTeammateInfo = (memberCnt, reqSequence, cb)=>{

		var teamplayers = cga.getTeamPlayers();
		if(!teamplayers.length){
			console.log('共享信息时失去与队伍的连接，共享API结束，回调函数传入false..')
			setTimeout(cb, 1000, false);
			return
		}
		var playerInfo = cga.GetPlayerInfo()
		var isleader = teamplayers[0].name == playerInfo.name ? true : false

		if(isleader && teamplayers.length < memberCnt){
			// console.log('等待人齐，还差【',memberCnt - teamplayers.length,'】人')
			setTimeout(cga.shareTeammateInfo, 3000, memberCnt, reqSequence, cb);
			return
		}

		// 获取人物原来自定义昵称，函数结束时，需要恢复
		var originNick = playerInfo.nick ? playerInfo.nick : ''
		// 队伍信息缓存，也是本函数最终return的变量
		var teammate_info = {};
		// 人物称号缓存，记录每个人的当前称号。用于一些逻辑的性能节约
		var nickCache = {}
		// 如果自己已经拿到全队信息，就在所有修改昵称动作时，末尾加上此标记，用来判断全队是否退出cga.shareTeammateInfo
		// 初始化为空串，在已经收集齐信息后，需要给他赋值。建议使用$符号
		var allDoneStr = ''
		// 用英语首字母zjfma代表0、1、2、3、4。其中z是zero首字母，jfma是1234月份首字母
		const identifier = ["z","j","f","m","a"]
		// 类型缩写翻译
		const translateDict = {
			"i" : "item",
			"#" : "item",
			"t" : "title",
			"m" : "mission",
			"r" : "role",
		}
		const reqReg = new RegExp(/([zjfma]{1})([i#tmr])([\d\u4e00-\u9fa5]+)/)
		const resReg = new RegExp(/([i#tmr])([\d\u4e00-\u9fa5]+)([zjfma]{1})([\d\u4e00-\u9fa5]+)/)

		//检查的func集合
		const reqAct = {
			"item" : (input)=>{
				if(isNaN(parseInt(input))){
					return cga.getItemCount(input,true)
				}
				return cga.getItemCount('#' + input,true)
			},
			"title" : (input)=>{
				return cga.findTitle(input) == -1 ? 0 : 1
			},
			"mission" : (input)=>{
				let config = cga.loadPlayerConfig();
				if(config && config["mission"] && config["mission"][input]){
					return 1
				}
				return 0
			},
			"role" : (input)=>{
				var res = cga.role.battleRoleArr.indexOf(input)
				if(res == -1){
					// 定义0为异常值
					console.error('错误:cga.role.battleRoleArr中没有设定你输入的【'+ input + '】职责')
					return 0
				}

				var json = null
				try
				{
					var rootdir = cga.getrootdir()
					var configPath = rootdir+'\\脚本设置';
					var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';
					var json = fs.readFileSync(configName, 'utf8');
					
					if(typeof json != 'string' || !json.length)
						throw new Error('配置文件格式错误');
				}catch(e){
					if(e.code != 'ENOENT'){
						console.log('role error:' + e)
					}
				}

				var obj = JSON.parse(json)
				// roleObj对象的结构大致为{part : "队长", role: "输出"}，role的值参考cga.role.battleRoleArr
				if(obj && obj.hasOwnProperty('roleObj') && obj.roleObj.hasOwnProperty('role')){
					let index = cga.role.battleRoleArr.indexOf(obj.roleObj.role)
					if(index == -1){
						console.error('脚本设置中的role值【'+ obj.roleObj.role + '】有误，具体数值请参考cga.role.battleRoleArr')
						return 0
					}
					if(input == obj.roleObj.role){
						res = 1
					}else{
						res = 0
					}
				}else{
					throw new Error('错误:脚本设置文件夹下的数据格式有误，没有检查到roleObj对象。请检查')
				}
				return res
			},
		}

		const resAct = (regObj, teams)=>{
			if(!teams[identifier.indexOf(regObj[3])]){
				console.log('队员',identifier.indexOf(regObj[3]) + 1,'号缺失，猜测是被踢或掉线了')
				return
			}
			if(!teammate_info[teams[identifier.indexOf(regObj[3])].name]){
				teammate_info[teams[identifier.indexOf(regObj[3])].name] = {lv : teams[identifier.indexOf(regObj[3])].level}	
			}

			Object.keys(reqAct).forEach((k)=>{
				if(!teammate_info[teams[identifier.indexOf(regObj[3])].name][k]){
					teammate_info[teams[identifier.indexOf(regObj[3])].name][k] = {}	
				}
			})

			if(regObj[1] == "i" || regObj[1] == "#"){
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["item"][regObj[2]] = regObj[4]
			}else if(regObj[1] == "t"){
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["title"][regObj[2]] = regObj[4]
			}else if(regObj[1] == "m"){
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["mission"][regObj[2]] = regObj[4]
			}else if(regObj[1] == "r"){
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["role"][regObj[2]] = regObj[4]
			}else{
				throw new Error('暗号类型错误，请检查')
			}
		}

		var listener = (cb) => {
			let curTeamplayers = cga.getTeamPlayers()
			if(!curTeamplayers.length){
				cb(false)
				return
			}
			let leaderNick = curTeamplayers[0].nick
			if(leaderNick.indexOf('restart') != -1){
				cb(false)
				return
			}
			if(isleader && curTeamplayers.length != memberCnt){
				cga.ChangeNickName('z' + 'restart' + allDoneStr)
				cb(false)
				return
			}
			if(leaderNick.indexOf('check') != -1){
				cb(true)
				return
			}
			// 先要遍历一次，获取自己在队伍中的序列。
			let indexStr = null
			for (let t = 0; t < curTeamplayers.length; t++) {
				if(curTeamplayers[t].is_me){
					indexStr = identifier[t]
				}
			}
			// 统计队内有几人已经完全收集队内信息，如果全员均收集，则中断队长的speaker
			let doneCnt = 0
			// 然后再遍历全队，获取正则匹配值，进行主要逻辑
			for (let t = 0; t < curTeamplayers.length; t++) {
				if(nickCache[curTeamplayers[t].name] == curTeamplayers[t].nick){
					continue
				}
				nickCache[curTeamplayers[t].name] = curTeamplayers[t].nick
				// 累加此队员是否已经完全收集全队信息
				if(curTeamplayers[t].nick.indexOf('$') != -1){
					doneCnt +=1
				}
				if(isleader && doneCnt == curTeamplayers.length && doneCnt == Object.keys(teammate_info).length){
					console.log('全队员已经收集队内所有信息，中断speaker')
					clearTimeout(speakerMeter)
					setTimeout(() => {
						cga.ChangeNickName("z" + "check"+allDoneStr)
					}, 1000);
					setTimeout(listener, 2000, cb);
					return
				}
				// reqObj具体结果举例
				// [
				// 	'z#720313',
				// 	'z',
				// 	'#',
				// 	'720313',
				// 	index: 0,
				// 	input: 'z#720313',
				// 	groups: undefined
				//   ]
				let reqObj = curTeamplayers[t].nick.match(reqReg)
				// resObj具体结果举例
				// [
				// 	'#720313j1',
				// 	'#',
				// 	'720313',
				// 	'j',
				// 	'1',
				// 	index: 0,
				// 	input: '#720313j1',
				// 	groups: undefined
				//   ]
				let resObj = curTeamplayers[t].nick.match(resReg)
				if(reqObj){
					let answer = reqAct[translateDict[reqObj[2]]](reqObj[3])
					setTimeout(() => {
						cga.ChangeNickName(reqObj[2]+reqObj[3]+indexStr+answer+allDoneStr)
					}, isleader ? 2000 : 0);
					continue
				}
				if(resObj){
					resAct(resObj,curTeamplayers)
					continue
				}
			}

			setTimeout(listener, 1000, cb);
			return
		}

		var speakerMeter = null
		// 由于统计不全时，会重新调用speaker()，导致多个speaker()线程同时修改队长称号，现在加入修复逻辑
		// 如果reqArr中还有未询问完的问题，那么直接return
		var speaker = () => {
			
			if(reqArr.length){
				// console.log('speaker正在运行中..')
				return
			}
			// console.log('speaker..')

			refreshList()

			// 如果队友allDoneStr为空，则正常按顺序问问题。
			// 如果全员都有allDoneStr标识，则直接跳过询问问题，队长在称号标记check，全员进入check模式
			var changeNick = ()=>{
				let curReqStr = reqArr.shift()
				if(curReqStr){
					cga.ChangeNickName("z" + curReqStr+allDoneStr)
					speakerMeter = setTimeout(changeNick, 7000);
					return
				}
			}

			changeNick()
		}

		// 制作临时请求序列
		var refreshList = ()=>{
			reqSequence.forEach(str => {
				reqArr.push(str)
			});
			reqArr.push('check')
			return reqArr
		}
		
		var check = (flag)=>{

			let delay = 5000
			if(flag === false){
				clearTimeout(speakerMeter)
				console.log('check结果为false，恢复原称号，',delay/1000,'秒后重新进入cga.shareTeammateInfo..')
				setTimeout(()=>{
					cga.ChangeNickName(originNick)
					cga.shareTeammateInfo(memberCnt, reqSequence, cb)
					return
				}, delay);
				return
			}else if(flag === true){
				let checkKey = null
				let checkValue = null
				let checkKeys = Object.keys(teammate_info)
				let teams = cga.getTeamPlayers();
				if(checkKeys.length < teams.length){
					console.log('队员信息中，人数统计缺失，',delay/1000,'秒后重新进入mainLogic..')
					// 队员缺失，重置统计信息
					teammate_info = {}
					// 如果人员缺失，那么信息收集齐全的flag要重置。
					allDoneStr = ''
					setTimeout(mainLogic, delay);
					return
				}
				for (let i = 0; i < reqSequence.length; i++) {
					checkKey = translateDict[reqSequence[i][0]]
					checkValue = reqSequence[i].substring(1)
					for (let k in checkKeys) {
						let v = teammate_info[checkKeys[k]];
						if(!v || !v[checkKey] || !v[checkKey].hasOwnProperty(checkValue)){
							let isInTeam = false
							for (let t = 0; t < teams.length; t++) {
								if(teams[t].name == checkKeys[k]){
									isInTeam = true
									break
								}
							}
							// 如果缺失的队员不在队伍中，则删除其数据。（可能是队伍成员构成不满足条件，不能拼成合格的发车队伍）
							// 如果在队伍中，则保留其数据，方便下次迭代补全。
							if(!isInTeam){
								console.log('队员信息中【' + checkKeys[k] + '】数据缺失，且该名队员已经离队。删除其数据，',delay/1000,'秒后重新进入mainLogic..')
								delete teammate_info[checkKeys[k]]
							}else{
								console.log('队员信息中【' + checkKeys[k] + '】数据缺失，但该名队员还在队伍中，保留其数据，',delay/1000,'秒后重新进入mainLogic..')
							}
							setTimeout(mainLogic, delay);
							return
						}
					}
				}
				// 如果人数正确，数据收集也齐全，将自己的done标记加在后续的昵称末尾
				allDoneStr = '$'
				for (let t = 0; t < teams.length; t++) {
					if(teams[t].nick.indexOf(allDoneStr) == -1){
						setTimeout(mainLogic, delay);
						return
					}
				}
				// 写入队伍信息，方便外部使用。目的是为了队伍信息的一致性。否则外面再重新获取队伍信息，有可能出现偏差（掉线、解散过快导致没获取到队伍信息等等）
				if (!teammate_info['teammates']){
					let teammates = []
					for(var i in teams){
						teammates[i] = teams[i].name;
					}
					teammate_info['teammates'] = teammates
				}
				// 此API出口
				// 复原昵称时，等待2秒，防止其他队员没有读取完毕，这边就改昵称了。
				setTimeout(() => {
					cga.ChangeNickName(originNick)
					cb(teammate_info)
				}, 2000);
				return
			}
		}

		var mainLogic = ()=>{

			if(isleader){
				speaker()
			}
			listener((r)=>{
				check(r)
			})
		}

		// 从这里开始是此API入口
		var reqArr = []
		mainLogic()
		return
	}
	/**
	 * UNAecho:开发一个自动组建自定义队伍的API
	 * 统计的方式是使用cga.shareTeammateInfo，具体可以统计的数据类型，参照cga.shareTeammateInfo。
	 * 本API的主要功能是实现类似SQL中的group功能，可以统计cga.shareTeammateInfo中的各个信息的聚合结果。
	 * 聚合功能有3种：
	 * 1、sum：全队持有某信息的家和。比如全队持有承认之戒的总和、长老之证的总和等等。
	 * 2、min：全队人均最低持有数量，比如每人至少拥有1个承认之戒，或者地龙的鳞片等等。
	 * 3、max：与2逻辑一致，只不过是最多持有数量，不常用。一般不会对道具做最大持有数判断。
	 * 
	 * 实现此3个功能的判断，需要在cusObj.check中写入。
	 * 举例：
	 * 1、如果要求全队最少每人有1个承认之戒，可以将cusObj.check = { 'i承认之戒': { min: 1 }}
	 * 2、如果要求全队最少每人都做过犹大任务，可以将cusObj.check = { 't开启者': { min: 1 }}
	 * 
	 * 还有个实用的功能，就是根据职责组队
	 * 举例：
	 * 1、我想组建一个5人队伍来练级或者做任务，队伍中必须包含3位输出，1位治疗，和1个小号，那么cusObj.check = { 'r输出': { sum: 3 }, 'r治疗': { sum: 1 }, 'r小号': { sum: 1 } }
	 * 【注意】职责不可以使用min为最小统计，因为min是以每人为单位，必须使用sum才能以队伍为单位统计
	 * 关于职责的设定，以及cusObj.check中的奇怪参数前缀i、t、r等等，请参考cga.shareTeammateInfo代码，日后可能会更改读取位置以及方式。
	 * 
	 * @param {*} cusObj 自定义的obj对象，数据结构举例
	 * cusObj = {
		'check': { 'i承认之戒': { min: 0 }, 'r输出': { sum: 3 }, 'r治疗': { sum: 1 }, 'r小号': { sum: 1 } },
		'part': thisobj.autoRing.part,
		'leaderPos': [thisobj.autoRing.leaderX, thisobj.autoRing.leaderY],
		'leaderFilter': thisobj.autoRing.leaderFilter,
		'dangerLevel': 0,
		'doneNick': doneNick,
		}
	 * @param {*} cb 
	 * @returns 
	 */
	cga.buildCustomerTeam = (cusObj,cb)=>{
		// 检查数据完整度，定义通用方法
		let checkInputData = (obj,key,typeStr)=>{
			if(!obj.hasOwnProperty(key)){
				throw new Error('key【'+key+'】不存在，请检查')
			}
			if(typeStr == 'array' && !obj[key] instanceof Array){
				throw new Error('key:'+key+'的value:'+obj[key]+'与预期类型:'+typeStr+'不符，请检查')
			}else if(typeStr != 'array' && typeof obj[key] != typeStr){
				throw new Error('key:'+key+'的value:'+obj[key]+'与预期类型:'+typeStr+'不符，请检查')
			}
		}
		
		// 组队站位，但并不是队员寻找队长的逻辑，只是单纯赶去队长的站立地点，方便组队。队员寻找队长逻辑在下面昵称过滤部分。
		let muster = (isLeader ,leaderPos, cb)=>{
			if(dangerLevel > 0){
				cga.loadBattleConfig('生产赶路')
			}
			let XY = cga.GetMapXY()
			if (isLeader){
				if(XY.x == leaderPos[0] && XY.y == leaderPos[1]){
					cb(null)
					return
				}
				cga.walkList([leaderPos], cb);
				return
			}else{
				// 由于cga.getRandomSpace不是真随机，所以对于同一个坐标，每次计算结果都是一样的
				let targetPos = cga.getRandomSpace(leaderPos[0], leaderPos[1]);
				if(XY.x == targetPos[0] && XY.y == targetPos[1]){
					cb(null)
					return
				}
				cga.walkList([targetPos], cb);
				return
			}
		}
		// 共享队员信息
		var share = (memberCnt, shareArr,cb) => {
			cga.shareTeammateInfo(memberCnt, shareArr, (r) => {
				if (typeof r == 'object') {
					cb(r)
				} else if (typeof r == 'boolean' && r === false) {
					console.log('cga.shareTeammateInfo失败，执行回调函数..')
					cb(false)
				} else {
					throw new Error('cga.shareTeammateInfo返回参数类型异常，请检查')
				}
				return
			})
		}
		if(typeof cusObj != 'object'){
			throw new Error('cusObj类型必须为object')
		}

		// 必须全员判定的属性
		// 检查对象，此核心数据
		checkInputData(cusObj,'check','object')
		// 队长队员
		checkInputData(cusObj,'part','string')
		let isLeader = cusObj.part == '队长'? true : false

		// 队长站立坐标
		checkInputData(cusObj,'leaderPos','array')
		if(isLeader){
			// 人数大于等于此数字，开始共享信息
			checkInputData(cusObj,'memberCnt','number')
		}
		// 队长昵称暗号
		checkInputData(cusObj,'leaderFilter','string')
		// 组队地点的危险等级，如果有危险，在走到队长这段过程需要改变战斗配置（逃跑），防止组队前暴毙
		checkInputData(cusObj,'dangerLevel','number')
		// 此API成功时的称号，队长和队员在完成逻辑后，均会将称号置为此值。
		checkInputData(cusObj,'doneNick','string')

		// API输入数据
		let checkObj = cusObj.check
		let leaderPos = cusObj.leaderPos
		let leaderFilter = cusObj.leaderFilter
		let dangerLevel = cusObj.dangerLevel
		let doneNick = cusObj.doneNick

		if(doneNick.length > 16){
			throw new Error('doneNick长度不得大于16')
		}

		// 队长专用数据
		let memberCnt= cusObj.memberCnt
		// 如果不输入，则默认允许任何人进队
		let nameFilter= cusObj.nameFilter
		var blacklist = {}
		var blacklistTimeout = Math.floor(Math.random() * (180000 - 5000 + 1) + 5000);
		// 队员监听队长是否踢自己
		const leaderReg = new RegExp(/你被队长“(.+)”请出队伍/)
		// 监听队长踢自己的超时时间，超过就判断队伍是否合格
		const leaerKickMeTimeout = 10000
		let mainLogic = ()=>{
			if(isLeader){
				var check = (shareInfoObj, cusObj) => {
					// 清空上一次踢人的黑名单
					blacklist = {}
					// 统计对象
					let statObj = {}
					// 不满足check条件的原因
					let reason = null
					for (let k in cusObj.check) {
						// cusObj.check中的key数据，开头有前缀，所以要从index1开始截断。
						// 例如i代表item，m代表mission。'i承认之戒'.substring(1)就取到了【承认之戒】这个值
						let key = k.substring(1)
						for (let i of shareInfoObj.teammates) {
							// 找到检查key的flag，如果遍历之后依旧没找到，则直接返回此人不合格
							let hasFoundKey = false
							for(let j in shareInfoObj[i]){
								// 部分key的value不是object，比如lv是number。
								if(Object.prototype.toString.call(shareInfoObj[i][j]) == '[object Object]'){
									if(shareInfoObj[i][j].hasOwnProperty(key)){
										hasFoundKey = true
										let value = parseInt(shareInfoObj[i][j][key])
										if(statObj.hasOwnProperty(key)){
											// 如果对某信息不设限，则sum处写-1，这里就不会判断是否超过阈值
											if (cusObj.check[k].sum != -1 && statObj[key].sum + value > cusObj.check[k].sum){
												reason = '当前key【' + key + '】总和【' + statObj[key].sum +'】由于队员【' + i +'】的value【' +value +'】加入，已超出全队总和阈值【' +cusObj.check[k].sum + '】，将此队员加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}else{
												statObj[key].sum += value
											}

											if(value < statObj[key].min){
												statObj[key].min = value
											}
											if (value < cusObj.check[k].min){
												reason = '队员【' +i+ '】key【' + key + '】value【' +value +'】低于每人最低值【' +cusObj.check[k].min + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
			
											}
											if(value > statObj[key].max){
												statObj[key].max = value
												
											}
											if (value > cusObj.check[k].max){
												reason = '队员【' +i+ '】key【' + key + '】value【' +value +'】高于每人最高值【' +cusObj.check[k].max + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
										}else{
											// 初始化，sum为全队持有总和，min为每人最低持有数量，max为每人最高持有数量
											// 先检查数值是否合格
											if(cusObj.check[k].sum != -1 && value > cusObj.check[k].sum){
												reason = '当前key【' + key + '】总和【' + statObj[key].sum +'】由于队员【' + i +'】的value【' +value +'】加入，已超出全队总和阈值【' +cusObj.check[k].sum + '】，将此队员加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
											if (value < cusObj.check[k].min){
												reason = '队员【' +i+ '】key【' + key + '】value【' +value +'】低于每人最低值【' +cusObj.check[k].min + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
			
											}
											if (value > cusObj.check[k].max){
												reason = '队员【' +i+ '】key【' + key + '】value【' +value +'】高于每人最高值【' +cusObj.check[k].max + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
											// 都合格就初始化
											statObj[key] = {
												sum : value,
												min : value,
												max : value,
											}
										}
									}
								}
							}
							if(!hasFoundKey){
								reason = '队员【' +i+ '】统计信息【' + j +'】不包含key【' + key + '】'
								console.log(reason)
								blacklist[i] = Date.now()
								continue
							}
						}

					}
					return
				}

				var wait = () => {
					// 同一时间只能有一个队长允许队员上车，其他队长通过控制昵称，暂时不允许其他人进入队伍。防止多个车队进入死锁。
					var leader = cga.findPlayerUnit((u) => {
						if ((u.xpos == leaderPos[0] && u.ypos == leaderPos[1])
							&& (!leaderFilter || u.nick_name.indexOf(leaderFilter) != -1)
						) {
							return true;
						}
						return false
					});
					// 如果已经有其他队长允许上车，则自己先进入休眠。
					if (leader && cga.getTeamPlayers().length != memberCnt) {
						let randomTime = Math.floor(Math.random() * (10000 - 3000) + 3000)
						console.log('检测到有其他司机【' + leader.unit_name + '】在等待拼车，暂时停止招人，' + randomTime /1000 + '秒后重新判断..')
						// 挂上标记，队员才能识别队长
						if (cga.GetPlayerInfo().nick == leaderFilter) {
							console.log('去掉leaderFilter，防止队员进入')
							cga.ChangeNickName('')
						}
						setTimeout(wait, randomTime);
						return
					}

					// 挂上标记，队员才能识别队长。设置延迟，防止其他称号覆盖
					if (cga.GetPlayerInfo().nick != leaderFilter) {
						setTimeout(() => {
							cga.ChangeNickName(leaderFilter)
						}, 2000);
					}

					cga.waitTeammatesWithFilter(nameFilter, memberCnt, (r) => {
						if (r) {
							share(memberCnt,Object.keys(checkObj),(shareInfoObj) => {
								// 如果共享信息时有人离队
								if (shareInfoObj === false) {
									setTimeout(wait, 1000);
									return
								}
								// 检查完之后，黑名单会有所更新
								check(shareInfoObj, cusObj)
								let kickArr = Object.keys(blacklist)
								// 提取黑名单中的玩家名称，交给踢人API
								if(kickArr.length){
									setTimeout(() => {
										cga.kickPlayer(kickArr, wait)
									}, 1000);
									return
								}else{// 如果都合格，则退出此API
									// 防止shareinfo的speaker又把称号刷掉
									setTimeout(cga.ChangeNickName,2000,doneNick)
									// 防止小号还没有检测队长是否done，队长那边已经把队伍解散了
									setTimeout(cb,leaerKickMeTimeout + 2000,shareInfoObj)
									return
								}
							})
							return;
						}
						setTimeout(wait, 5000);
						return
					})
				}

				cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);

				wait();
				return
			}else{
				var retry = (cb) => {
					let teamplayers = cga.getTeamPlayers();
					if (teamplayers.length) {
						share(memberCnt,Object.keys(checkObj),(shareInfoObj) => {
							// 如果共享信息时有人离队
							if (shareInfoObj === false) {
								setTimeout(retry, 1000, cb);
								return
							}
							console.log('共享信息结束，等待队长判断，如果被踢，则一段时间内不会再加入到此队之中，防止同职责挤兑。比如小号全挤在一个队伍之中')
							// 持续监控队长是否踢人
							// 【UNAecho开发提醒】：cga.waitSysMsg类API监测所有屏幕出现的对话，包括玩家。
							// 虽然此类API判断了unitid!= -1(即非系统消息)则递归自己，但可能有潜在bug
							// 猜测：当玩家说话过于频繁，特别是脚本密集的新城记录点，可能会遗漏队长踢人的信息。
							// 建议将地点选在玩家说话少的地方运行。
							cga.waitSysMsgTimeout((err,sysMsg)=>{
								if(err && !sysMsg){
									console.log('队长没有踢自己，判断队伍是否合格..')
									let teamplayers = cga.getTeamPlayers();
									// 队伍合格
									if (teamplayers.length && teamplayers[0].nick == doneNick) {
										console.log('队长判定队伍合格，将称号置为和队长一致，并调用cb，结束此API。')
										cga.ChangeNickName(doneNick)
										cb(shareInfoObj)
									}else{// 队伍不合格，重新进入retry
										console.log('队伍不合格，重新进入retry')
										setTimeout(retry, 1000, cb);
									}
									return false
								}
								
								let matchObj = sysMsg.match(leaderReg)
								// match数据格式
								// [
								// 	'你被队长“UNAの格斗1”请出队伍',
								// 	'UNAの格斗1',
								// 	index: 0,
								// 	input: '你被队长“UNAの格斗1”请出队伍！',
								// 	groups: undefined
								// ]
								if(matchObj != null){
									blacklist[matchObj[1]] = Date.now()
									console.log('队长【' + matchObj[1] +'】将自己踢出，' + blacklistTimeout / 1000 + '秒之内不再加入其队伍')
									setTimeout(retry, 1000, cb);
									return false
								}
								return true
							},leaerKickMeTimeout)// 监控队长是否踢自己，如果被踢则将队长加入黑名单，一段时间之内不再加入其队伍
							return
						})
						return
					} else {
						let curTime = Date.now()
						var leader = cga.findPlayerUnit((u) => {
							if (blacklist.hasOwnProperty(u.unit_name)) {
								let remain = (blacklistTimeout - (curTime - blacklist[u.unit_name])) / 1000
								if(remain > 0){
									console.log('由于不满足队长【' + u.unit_name + '】的队伍配置要求，暂时离队。' + remain + '秒内不能加入【', u.unit_name, '】队伍')
								}else{
									console.log('队长【' + u.unit_name + '】的黑名单时间已到，可以重新加入队伍')
									delete blacklist[u.unit_name]
								}
							}
							if (
								(u.xpos == leaderPos[0] && u.ypos == leaderPos[1])
								&& (!leaderFilter || u.nick_name.indexOf(leaderFilter) != -1)
								&& ((!blacklist.hasOwnProperty(u.unit_name) || (curTime - blacklist[u.unit_name] > blacklistTimeout)))
							) {
								delete blacklist[u.unit_name]
								return true;
							}
							return false
						});
						if (leader) {
							var target = cga.getRandomSpace(leader.xpos, leader.ypos);
							cga.walkList([
								target
							], () => {
								cga.addTeammate(leader.unit_name, () => {
									setTimeout(retry, 1000, cb);
									return
								});
							});
						} else {
							setTimeout(retry, 1000, cb);
							return
						}
					}
				}

				retry(cb);
				return
			}
		}
		// 集合，并进入主逻辑
		muster(isLeader,leaderPos, mainLogic)
		return
	}

	/**
	 * UNAecho:等待队员自定义动作的API，可用于BOSS前更改战斗配置等自定义动作
	 * 自定义动作需要返回一个完成任务的标识符，可以是Number也可以是String，使用修改【玩家称号】展示结果。
	 * 注意玩家自定义的称号有【16字节】长度限制。
	 * 
	 * @param {*} teammates String数组。期望队员名称的数组形式，传null视为自动获取当前队员。
	 * @param {*} func 
	 * 自定义动作函数，此函数必须被定义为：
	 * 1、内部动作不限，如跟NPC对话拿物品，修改战斗配置等。但最好在3秒内结束。
	 * 2、必须调用回调函数，并且传入Ready的标识符，否则逻辑不会继续。
	 * 3、Ready标识符，格式为Number时，是小于3位的数字；格式位String时，是2位String字符串。
	 * 4、Ready标识符为字符串的值有限制，只能使用"ok"，"no"，"un"这3种String
	 * @param {*} cb 回调函数，全员信息收集完毕后制作成object，调用cb并将object传入
	 * @returns 
	 * 
	 * 【注意】此API有一个不足之处，由于check是递归，每次拿固定的teammates去比较现队伍人数
	 * teammates仅在API开始的时候定好，所以先加队的队员将无法感知到后加入的队员信息
	 * 所以尽量用在队员不会改变的情况，如已经组好队，或者事先就传入teammates
	 */
	cga.waitTeammateReady = (teammates, func, cb) => {
		// 如果没传入指定队伍，则自动以队内人员为准。
		if(!teammates)
			teammates = cga.getTeamPlayers()
		if(!teammates.length){
			// console.log('没有队员，退出cga.waitTeammateReady，回调参数传入null')
			func((res)=>{
				setTimeout(cb, 1000, null);
			})
			return
		}
		// 用英语首字母zjfma代表0、1、2、3、4。其中z是zero首字母，jfma是1234月份首字母
		const identifier = ["z","j","f","m","a"]
		// 正则匹配类似z01jok这种字符，每3个一组。
		// 例：z01就是队长数值为"01"，jok就是第2个队员数值为"ok"
		const reg = new RegExp(/[zjfma]{1}[oknu\d]{2}/g)
		// 获取人物原来自定义昵称，函数结束时，需要恢复
		var playerInfo = cga.GetPlayerInfo()
		const originNick = playerInfo.nick

		var teammate_info = {};
		cga.isTeamLeader = (teammates[0].name == playerInfo.name || teammates.length == 0) ? true : false;

		var check = (funcValue, cb)=>{
			var listen = true

			// 注意这里是刷新队内状态，一切以cga.waitTeammateReady传入的teammates为验证数据的基础。
			// 因为可能在验证期间，有非teammates的角色（如：其他玩家）错加入队伍。
			var curTeamplayers = cga.getTeamPlayers()
			// 如果人数与预期不符，则等待
			if(teammates.length != curTeamplayers.length){
				console.warn('队内玩家数量与预期玩家数量不符，清空数据记录情况')
				teammate_info = {}
				setTimeout(check, 1000, funcValue, cb);
				return
			}

			for (let t = 0; t < curTeamplayers.length; t++) {
				// 以自己在队内的序号来拼接类似z01j02的自定义称号
				let tmpNick = identifier[t] + funcValue
				if(curTeamplayers[t].is_me){
					if(curTeamplayers[t].nick != tmpNick){
						cga.ChangeNickName(tmpNick)
						console.log("更改nickname:【" + tmpNick + "】")
					}
					// 更新自己的实时数据
					teammate_info[identifier[t]] = isNaN(parseInt(funcValue)) ? funcValue : parseInt(funcValue)
					continue
				}
				
				var memberNick = curTeamplayers[t].nick
				if(!memberNick){
					continue
				}

				memberNick.match(reg).forEach((n)=>{
					// 如果解析的3位字符串不以zjfma为开头，则跳过
					if(identifier.indexOf(n[0]) == -1)
						return
					let v = n.slice(1,3)
					v = isNaN(parseInt(v)) ? v : parseInt(v)
					teammate_info[n[0]] = v
				})
			}
			// 为true则持续监听
			listen = cb(teammate_info)
			if(listen == true)
				setTimeout(check, 1000, funcValue, cb);
		}

		func((funcValue)=>{
			// 数值验证以及格式处理
			if(typeof funcValue == 'number'){
				if(parseInt(funcValue, 10) != funcValue){
					throw new Error('错误，必须输入3位以下整数或字符串')
				}else if(funcValue >= 0 && funcValue < 10){
					funcValue = "0" + funcValue.toString()
				}else if(funcValue >= 10 && funcValue < 100){
					funcValue = funcValue.toString()
				}else{
					throw new Error('错误，必须输入3位以下整数或字符串')
				}
			}else if(typeof funcValue == 'string' && funcValue.length != 2){
				throw new Error('错误，必须输入3位以下整数或字符串')
			}
			if(!funcValue.match(new RegExp(/[oknu\d]{2}/g))){
				throw new Error('错误，必须输入3位以下整数或"ok"，"no"，"un"3种字符串')
			}

			check(funcValue, (result)=>{
				// 验证完整性，通过了才能进行回调
				if(Object.keys(result).length == teammates.length){
					// 翻译数据，将数字的String转换为int传给cb
					var obj = {}
					const identifier = {"z" : 0, "j" : 1, "f" : 2, "m" : 3, "a" : 4}
					var teamplayers = cga.getTeamPlayers()
					Object.keys(result).forEach(k =>{
						obj[teamplayers[identifier[k]].name] = result[k]
					})
					// 恢复人物原本称号
					console.log('2.5秒后恢复称号..')
					setTimeout(()=>{
						cga.ChangeNickName(originNick)
					}, 2500);
					// 本函数出口
					cb(obj)
					return false
				}
				return true
			})
		})
	}
	/**
	 * UNAecho:一个与NPC打交道的API，持续与NPC交互，直到获取某个东西，或看到NPC某句话
	 * @param {String | Number} map NPC所处地图，可以是名称也可以是index
	 * @param {Array} npcPos NPC坐标
	 * @param {String | Number | Object} obj 目标对象
	 * 如果传入String或Number时，默认是索取物品String名称或物品Int型id，并且所有选项都选积极选项
	 * obj格式以及各个key的功能：
	 * obj.act : 与NPC交互的动作目的。有item，msg，map3种类型可选：
		item: 找NPC拿道具，物品栏出现此道具则调用cb，函数结束
		msg: 找NPC对话，直至NPC出现此msg的内容，调用cb，函数结束
		map: 找NPC对话，直至人物被传送至此地图，调用cb，函数结束
		skill: 找NPC对话，直至人物学习完技能或学习失败，调用cb，函数结束
		forget: 找NPC对话，直至人物忘记技能，调用cb，函数结束
		job: 找NPC对话，直至人物就职或转职，调用cb，函数结束
		promote: 找NPC对话，直至人物职业晋级，调用cb，函数结束
	 * obj.target : obj.act的目标，根据obj.act的不同，有几种情况：
		obj.act为item时，obj.target输入item的名称或数字itemid
		obj.act为msg时，obj.target输入监测NPC说话的内容切片
		obj.act为map时，obj.target输入地图的名称或index
		obj.act为skill时，obj.target输入想学的技能名称
		obj.act为forget时，obj.target输入想忘记的技能名称
		obj.act为job时，obj.target输入想就职的职业称号，可以输入任意职业阶级的称号，如【见习弓箭手】【王宫弓箭手】均指代【弓箭手】这一职业。
		obj.act为promote时，obj.target输入目标阶级数字。0：0转，见习。1：1转，正阶。2：2转，王宫。3：3转，师范。4：4转，大师。5：5转，最终阶段。
	 * [obj.neg] : 可选选项，如果与NPC说话，某句话想要选【否】【取消】等消极选项，obj.neg需要输入那句话的切片。
		比如，如果想在NPC问【你愿意吗？】的时候回答【否】，那么obj.neg可以输入"愿意"、"你愿意吗"等切片
	 * [obj.pos] : 可选选项，2维int型数组。仅在obj.act = "map"时生效，人物需要等待被NPC传送至pos这个坐标，函数才结束
	 * [obj.say] : 可选选项，string类型。人物会在与NPC交互的时候说话，因为有的NPC是需要说出对应的话才会有反应的
	 * 
	 * 【开发提醒】由于宠物学习技能时的【是】【否】界面属于特殊弹窗，cga.AsyncWaitNPCDialog无法捕获，故这里没有宠物相关功能的实现。
	 * 更新，有空可以参考cga.parsePetSkillStoreMsg制作
	 * @param {*} cb 回调函数，在obj.act不为map时，调用时会传入队伍全员信息
	 * @returns 
	 */
	cga.askNpcForObj = (map, npcPos, obj, cb) => {
		/**
		 * dialog options:
		 *     0  : 列表选择 cga.ClickNPCDialog(0, 6) 第一个参数应该是被忽略的，第二个参数选择列表序号，从0开始
		 *     1  : 确定按钮 cga.ClickNPCDialog(1, -1)
		 *     2  : 取消按钮 cga.ClickNPCDialog(2, -1)
		 *     3  : 确定取消 cga.ClickNPCDialog(1, -1) 1确定 2取消
		 *     12 : 是否按钮 cga.ClickNPCDialog(4, -1) 4是 8否
		 *     32 : 下一步 cga.ClickNPCDialog(32, -1) 32下一步
		 */

		// 检查输入类型
		if(typeof map != 'string' && typeof map != 'number'){
			throw new Error('map必须为String或Number类型')
		}
		if(!Array.isArray(npcPos) || npcPos.length != 2){
			throw new Error('npcPos必须为Int型数组，长度为2')
		}
		if(typeof obj == 'string' || typeof obj == 'number'){
			obj = {act : "item", target : obj}
		}
		if(typeof obj != 'object' || !obj.hasOwnProperty("act") || !obj.hasOwnProperty("target")){
			throw new Error('obj格式有误，见API注释')
		}
		if(obj.hasOwnProperty("pos") && (!Array.isArray(obj.pos) || obj.pos.length != 2)){
			throw new Error('obj.pos格式必须为长度为2的Number数组')
		}
		if(obj.hasOwnProperty("say") && (typeof obj.say != 'string' || obj.say.length == 0)){
			throw new Error('obj.say格式必须为长度大于0的字符串')
		}
		// 如果此flag为false，则终止重复和NPC对话
		let repeatFlag = true
		// 如果是与npc说话，则turnto只需要一次
		let turnToFlag = true
		const dialogHandler = (err, dlg)=>{
			var actNumber = -1
			if(dlg && dlg.options == 0){
				// 转职确认画面，5000金币，需要点击【好的】(cga.ClickNPCDialog(0, 0))，【算了】cga.ClickNPCDialog(0, 1)
				if(dlg.type == 2){
					actNumber = 0
					cga.ClickNPCDialog(0, actNumber);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}else if(dlg.type == 999){// TODO晋级时options是0，那么type是多少
					
				}
				/**
				 * 列表对话，多数用于学技能NPC的第一句话：
				 * 1、想学习技能
				 * 2、想遗忘技能
				 * 3、不用了
				 */
				else if(dlg.type == 16){
					if(obj.act == 'skill'){
						actNumber = 0
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}else if(obj.act == 'forget'){
						actNumber = 1
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
				}else if(dlg.type == 18){// 从dlg.options == 0 && dlg.type == 16跳转进来。遗忘技能的详细栏，选择index直接进入确定界面
					var skillIndex = cga.GetSkillsInfo().sort((a,b) => a.pos - b.pos).findIndex(s => s.name == obj.target);
					actNumber = skillIndex
					cga.ClickNPCDialog(0, actNumber);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
			}
			else if(dlg && dlg.options == 1){
				cga.ClickNPCDialog(1, 0);
				if(obj.act == "msg" && dlg.message.indexOf(obj.target) != -1){
					repeatFlag = false
					return
				}else if(obj.act == "skill" && cga.findPlayerSkill(obj.target)){
					repeatFlag = false
					return
				}else if(obj.act == "forget" && !cga.findPlayerSkill(obj.target)){
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if(dlg && dlg.options == 2){
				// 职业导师对话列表，就职、专职、晋级
				if(dlg.type == 2){
					// 就职
					if(obj.act == 'job'){
						let curJobObj = cga.job.getJob()
						if(curJobObj.curJob == '游民'){
							actNumber = 0
							cga.ClickNPCDialog(0, actNumber);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}else{
							actNumber = 1
							cga.ClickNPCDialog(0, actNumber);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}
					}
					else if(obj.act == 'promote'){
						actNumber = 2
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
					else if(obj.act == 'forget'){
						console.log('进入' + obj.act)
						actNumber = 1
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
				}
				// 从dlg.options == 0 && dlg.type == 16跳转进来。学习技能的详细栏，cga.ClickNPCDialog(0, 0)直接学习，cga.ClickNPCDialog(-1, 0)取消
				else if(dlg.type == 17){
					actNumber = 0
					cga.ClickNPCDialog(actNumber, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
			}
			else if(dlg && dlg.options == 3){
				actNumber = (obj.hasOwnProperty("neg") && dlg.message.indexOf(obj.neg) != -1) ? 2 : 1
				cga.ClickNPCDialog(actNumber, 0);
				if(obj.act == "msg" && dlg.message.indexOf(obj.target) != -1){
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if(dlg && ((dlg.options & 4) == 4 || dlg.options == 12)){
				actNumber = (obj.hasOwnProperty("neg") && dlg.message.indexOf(obj.neg) != -1) ? 8 : 4
				cga.ClickNPCDialog(actNumber, 0);
				if(obj.act == "msg" && dlg.message.indexOf(obj.target) != -1){
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if(dlg && (dlg.options & 32) == 32){
				cga.ClickNPCDialog(32, 0);
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			return
		}

		// 为任务物品清理背包中的魔石
		var dropStoneForMissionItem = (item)=>{
			// 持续递归，直至背包中存在目标任务物品才结束
			if(cga.findItem(item) == -1){
				var inventory = cga.getInventoryItems();
				var stone = cga.findItem('魔石');
				if(inventory.length == 20 && stone == -1){
					throw new Error('错误，请手动清理物品，否则任务无法继续')
				}
				if(inventory.length >= 18){
					console.log('物品大于18个，开始搜索背包中的魔石并丢弃..')
					if(stone != -1){
						console.log('丢弃魔石..')
						cga.DropItem(stone);
					}
					setTimeout(dropStoneForMissionItem, 1000);
				}
			}
		}

		var askAndCheck = ()=>{
			var retry = (cb)=>{
				if(!repeatFlag){
					cb("ok")
					return
				}
				if(obj.act == "item" && cga.findItem(obj.target) != -1){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}else if(obj.act == "map" && (obj.target == cga.GetMapName() || obj.target == cga.GetMapIndex().index3) && (!obj.pos || (cga.GetMapXY().x == obj.pos[0] && cga.GetMapXY().y == obj.pos[1]))){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}else if(obj.act == "skill" && (cga.findPlayerSkill(obj.target))){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}else if(obj.act == "forget" && (!cga.findPlayerSkill(obj.target))){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}else if(obj.act == "job" && cga.job.getJob(obj.target).job == cga.job.getJob().job){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}else if(obj.act == "promote" && cga.job.getJob().jobLv >= obj.target){
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				}

				// 自定义与NPC交谈的内容
				if(obj.say){
					if (turnToFlag){
						cga.turnTo(npcPos[0], npcPos[1])
						turnToFlag = false
					}
					setTimeout(() => {
						cga.SayWords(obj.say, 0, 3, 1);
					}, 500);
				}else{
					cga.turnTo(npcPos[0], npcPos[1])
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				setTimeout(retry, 3500, cb);
				return
			}

			// 如果目标是map，切换地图会导致人物离队，其他队员无法通过称号监测到你的完成情况，故用其他逻辑代替
			// 如果目标是技能相关，则无需组队，可单人完成逻辑
			if(obj.act == "map" || obj.act == "skill" || obj.act == "forget" || obj.act == "job" || obj.act == "promote"){
				// 注意：map模式没有人物队内监测，所以不会有队内消息在cb中被返回。item、msg模式则有
				retry(cb)
				return
			}else{// item、msg等模式不离队，依旧用waitTeammateReady
				// 为任务物品留位置
				dropStoneForMissionItem(obj.target)

				cga.waitTeammateReady(null, (r)=>{
					retry(r)
				}, (r)=>{
					cb(r)
					return
				})
			}
		}

		let mapName = cga.GetMapName();
		let mapIndex = cga.GetMapIndex().index3;

		if(typeof map == 'string'){
			if(map != mapName){
				// console.log("等待地图:", map)
				setTimeout(cga.askNpcForObj, 1500, map, npcPos, obj, cb);
				return
			}
		}else if(typeof map == 'number'){
			if(map != mapIndex){
				// console.log("等待地图:", map)
				setTimeout(cga.askNpcForObj, 1500, map, npcPos, obj, cb);
				return
			}
		}else{
			throw new Error('map对象必须为String或Number类型')
		}

		var playerInfo = cga.GetPlayerInfo();
		var teamplayers = cga.getTeamPlayers();
		var isLeader = false
        isLeader = ((teamplayers.length && teamplayers[0].name == playerInfo.name) || teamplayers.length == 0) ? true : false;

		if(isLeader){
			// 如果NPC周围只有1格空闲地形，改用cga.getRandomSpace
			var spaceList = null
			let tmpArr = []
			try {
				spaceList = cga.get2RandomSpace(npcPos[0],npcPos[1])
				// 最终站位
				tmpArr.push(spaceList[0])
				// 如果是组队，把队员都拉到NPC周围
				if (teamplayers.length){
					tmpArr.push(spaceList[1])
					tmpArr.push(spaceList[0])
					tmpArr.push(spaceList[1])
					tmpArr.push(spaceList[0])
				}
			} catch (error) {
				if(error.message.indexOf('只有一格') != -1){
					// TODO 队员自行离队对话
					console.log('NPC周围只有1格，改为cga.getRandomSpace来计算。【注意】，由于NPC周围只有1格，部分队员无法在不离队的情况下原地与NPC对话，请修改逻辑')
					spaceList = cga.getRandomSpace(npcPos[0],npcPos[1])
					// TODO 如果在柜台后面，想办法处理
					if(spaceList == null){
						throw new Error('NPC周围1格站位也没有，猜测在柜台后面，或数据有误，请手动处理。')
					}
					// cga.getRandomSpace返回是1维数组，cga.get2RandomSpace返回是2维数组
					tmpArr.push(spaceList)
				}
			}
			cga.walkList(tmpArr, askAndCheck);
		}else{
			cga.waitForLocation({pos : npcPos}, askAndCheck)
		}
	}

	/**
	 * UNAecho:人物战斗准备，多数用于BOSS战前调整战斗配置使用，如W站位、读取战斗配置等
	 * @param {String | Number} map 目标地图，只有处于当前地图名称或index才能进行
	 * @param {Array} bossPos BOSS坐标
	 * @param {Function} prepareFunc 战斗准备函数。
	 * 执行完毕后，必须在外面调用回调函数并传入Ready结束标识符，否则此API逻辑不会继续
	 * 结束标识符限定为：【ok】【no】【un】均可
	 * @param {*} cb 
	 * @returns 
	 */
	cga.prepareToBattle = (map, bossPos, prepareFunc, cb) => {
		// 检查输入类型
		if(typeof map != 'string' && typeof map != 'number'){
			throw new Error('map必须为String或Number类型')
		}
		if(!Array.isArray(bossPos) || bossPos.length != 2){
			throw new Error('bossPos必须为Int型数组，长度为2')
		}

		var prepare = ()=>{
			cga.waitTeammateReady(null, (r)=>{
				prepareFunc(r)
				return
			}, (r)=>{
				console.log('全队准备完毕，等待5秒队员复原称号后执行回调..')
				setTimeout(() => {
					cb(r)
				}, 5000);
				return
			})
		}

		let mapName = cga.GetMapName();
		let mapIndex = cga.GetMapIndex().index3;

		if(typeof map == 'string'){
			if(map != mapName){
				// console.log("等待地图:", map)
				setTimeout(cga.prepareToBattle, 1500, map, bossPos, prepareFunc, cb);
				return
			}
		}else if(typeof map == 'number'){
			if(map != mapIndex){
				// console.log("等待地图:", map)
				setTimeout(cga.prepareToBattle, 1500, map, bossPos, prepareFunc, cb);
				return
			}
		}else{
			throw new Error('map对象必须为String或Number类型')
		}

		var playerInfo = cga.GetPlayerInfo();
		var teamplayers = cga.getTeamPlayers();
        cga.isTeamLeader = ((teamplayers.length && teamplayers[0].name == playerInfo.name) || teamplayers.length == 0) ? true : false;

		if(cga.isTeamLeader){
			var tmpPos = cga.get2RandomSpace(bossPos[0],bossPos[1])
			let tmpArr = [tmpPos[0]]
			if (teamplayers.length){
				tmpArr.push(tmpPos[1])
				tmpArr.push(tmpPos[0])
				tmpArr.push(tmpPos[1])
				tmpArr.push(tmpPos[0])
			}
			cga.walkList(tmpArr, prepare);
		}else{
			cga.waitForLocation({pos : bossPos}, prepare)
		}
	}
	
	//把队友带至posArray指定的位置
	cga.walkTeammateToPosition = (posArray, cb) =>{
		
		console.log('cga.walkTeammateToPosition stage1');
		
		if(cga.getTeamPlayers().length == 0)
		{
			cb(null);
			return;
		}
		
		var index = 0;
		
		var walk = ()=>{
			console.log('cga.walkTeammateToPosition walk');
			
			cga.AsyncWalkTo(posArray[index][0], posArray[index][1], null, null, null, checkTeammateAtPosition);
		}
		
		var checkTeammateAtPosition = (err)=>{
			
			console.log('checkTeammateAtPosition 0');
			
			if(!cga.isInNormalState())
			{
				console.log('checkTeammateAtPosition 1');
				setTimeout(checkTeammateAtPosition, 1000);
				return;
			}
			
			var teamplayers = cga.getTeamPlayers();
			var someoneNotInPosArray = false;
			for(var i in teamplayers) {
				var isInPosArray = false;
				for(var j in posArray) {
					if(teamplayers[i].xpos == posArray[j][0] && teamplayers[i].ypos == posArray[j][1]) {
						isInPosArray = true;
						break;
					}
				}
				
				if(!isInPosArray){
					someoneNotInPosArray = true;
					break;
				}
			}
			
			if(someoneNotInPosArray){
				console.log('someoneNotInPosArray');
				
				index ++;
				if(index > posArray.length - 1)
					index = 0;
				walk();
				return;
			}
			
			cga.waitForChatInput((msg, val)=>{
				if(msg.indexOf('遇敌防卡住') >= 0)
				{
					//restart the walk procedure
					if(!cga.isInNormalState())
					{
						console.log('waitForChatInput 0');
						setTimeout(checkTeammateAtPosition, 1000);
					}
					else
					{
						console.log('waitForChatInput 1');
						//or we are at position
						cb(null);
					}
					return false;
				}
				
				return true;
			});
			
			cga.SayWords('遇敌防卡住', 0, 3, 1);
		}
		
		walk();
	}

	// UNAecho:通用检查队伍是否已经ready的简单逻辑，持续等待，直至全员都持有某称号
	cga.checkTeamAllDone = (doneNick, cb) => {
		var teamplayers = cga.getTeamPlayers()
		if(!teamplayers.length){
			console.log('队伍已经解散，退出cga.checkTeamAllDone..')
			setTimeout(cb, 1000);
			return
		}
		for (let i = 0; i < teamplayers.length; i++) {
			if(teamplayers[i].nick != doneNick){
				setTimeout(cga.checkTeamAllDone, 1000, doneNick, cb);
				return
			}
		}
		console.log('所有队员称号均为【' + doneNick + '】，cga.checkTeamAllDone结束。')
		setTimeout(cb, 1000);
		return
	}

	// UNAecho:通用离队逻辑，队长主动解散队伍，队员被动等待队伍解散。
	// 循环上述逻辑，直至不在队伍中，执行callback
	cga.disbandTeam = (cb) => {
		var teamplayers = cga.getTeamPlayers()
		if(!teamplayers.length){
			setTimeout(cb, 1000);
			return
		}
		var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
		if(isTeamLeader){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
		}
		
		setTimeout(cga.disbandTeam, 1000, cb);
	}

	/**
	 * UNAecho: cga.AsyncWaitNPCDialog的简单封装。
	 * 与NPC无限对话，只选积极选项(是、确定、下一页等)，较为常用。
	 * 有自己的超时时间，不需要对其递归进行处理。
	 * 
	 * @param {*} err 
	 * @param {*} dlg 
	 * @returns 
	 */
	cga.dialogHandler = ()=>{
		var dialogHandler = (err, dlg)=>{
			if(dlg){
				if((dlg.options & 4) == 4){
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}else if((dlg.options & 32) == 32){
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}else if(dlg.options == 1){
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}else if(dlg.options == 3){
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}else if(dlg.options == 12){
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
			}
			return
		}

		cga.AsyncWaitNPCDialog(dialogHandler);
		return
	}

	//监听自己聊天输入（只支持数字）
	cga.waitForChatInput = (cb)=>{
		cga.waitTeammateSay((player, msg)=>{

			if(player.is_me == true){
				var pattern_number=/^[1-9]\d*$|^0$/;
				
				if(cb(msg, pattern_number.test(msg) ? parseInt(msg) : null ) == false)
					return false;
			}

			return true;
		});
	}

	/**
	 * UNAecho:监听系统消息
	 * 提示：可用于监听迷宫消失。
	 * 消失预警：你感觉到一股不可思议的力量，而【迷宫名称】好像快消失了。
	 * 消失瞬间：被不可思议的力量送出了【迷宫名称】。
	 * @param {*} cb 
	 */
	cga.waitSysMsg = (cb)=>{
		cga.AsyncWaitChatMsg((err, r)=>{
			if(!r || r.unitid != -1){
				cga.waitSysMsg(cb);
				return;
			}
			
			listen = cb(r.msg);

			if(listen == true)
				cga.waitSysMsg(cb);
		}, 1000);
	}

	cga.waitSysMsgTimeout = (cb, timeout)=>{
		cga.AsyncWaitChatMsg((err, r)=>{

			if(err){
				console.log('cga.waitSysMsgTimeout超时，如果cb(err)不为true，则结束监听。')
				listen = cb(err);

				if(listen == true)
					cga.waitSysMsgTimeout(cb, timeout);

				return;
			}

			if(!r || r.unitid != -1){
				cga.waitSysMsgTimeout(cb, timeout);
				return;
			}
			
			listen = cb(null, r.msg);

			if(listen == true)
				cga.waitSysMsgTimeout(cb, timeout);

		}, timeout);
	}
	
	//发送超长聊天信息
	cga.sayLongWords = (words, color, range, size)=>{

		console.log(words);

		var splitCount = words.length / 100;
		if(splitCount == 0)
			splitCount = 1;
		
		for(var i = 0;i < splitCount; ++i){
			cga.SayWords(words.substring(i * 100, i * 100 + 100), color, range, size);
		}		
	}
	
	//监听登录状态
	cga.waitConnState = (cb)=>{
		cga.AsyncWaitConnectionState((err, r)=>{
			if(err){
				cga.waitConnState(cb);
				return;
			}

			if(cb(r) == true)
				cga.waitSysMsg(cb);
		}, 10000);
	}

	/*等待到达某位置，无超时时间限制

		等待到达民家(14,10)，如果解散了队伍则自动走到(13,10)处：
			cga.waitForLocation({mapname : '民家', pos : [14, 10], leaveteam : true, walkto : [13, 10]}, cb);

		等待到达地图索引号为24074的地图的(21,12)处：
			cga.waitForLocation({mapindex: 24074, pos:[21, 12] }, cb);
	*/
	cga.waitForLocation = (obj, cb)=>{
		var name = cga.GetMapName();
		var fpos = cga.GetMapXYFloat();
		var index = cga.GetMapIndex().index3;
		
		var passCheck = true;

		if(typeof obj.mapname == 'string')
		{
			if(name != obj.mapname)
			{
				passCheck = false;
			}
		}
		if(typeof obj.mapindex == 'number')
		{
			if(index != obj.mapindex)
			{
				passCheck = false;
			}
		}
		
		if(obj.moving !== true && !(parseInt(fpos.x) % 64 == 0 && parseInt(fpos.y) % 64 == 0))
		{
			passCheck = false;
		}
		
		if(obj.pos instanceof Array)
		{	
			/**
			 * UNA注:这里的算法是计算队员是否走到指定坐标obj.pos的周围处。仅限周围1格以内passCheck为true，超出1格，则passCheck依然为false
			 * */ 
			if (!(Math.abs(fpos.x - obj.pos[0] * 64.0) < 1.001 * 64.0 && Math.abs(fpos.y - obj.pos[1] * 64.0) < 1.001 * 64.0))
			{
				passCheck = false;
			}
		}

		if(obj.leaveteam === true)
		{
			var teamplayersnow = cga.getTeamPlayers();

			if(teamplayersnow.length){
				passCheck = false;
			}
			/**
			 * UNA注:这里if的第一个参数!passCheck写法疑似bug，因为走到obj.pos附近处，passCheck会判定为true。
			 * 而当队长解散队伍时，teamplayersnow.length为0，passCheck还是为true，所以造成队员不进行cga.WalkTo的动作
			 * 将!passCheck暂时改为passCheck继续使用，如有问题在日后改回来
			 * */ 

			// if(!passCheck && obj.walkto && !teamplayersnow.length && (index == obj.mapindex || name == obj.mapname))
			// {
			// 	cga.WalkTo(obj.walkto[0], obj.walkto[1]);
			// }
			if(passCheck && obj.walkto && !teamplayersnow.length && (index == obj.mapindex || name == obj.mapname))
			{	
				cga.WalkTo(obj.walkto[0], obj.walkto[1]);
			}
		}
		
		if(obj.desired_teamplayers != undefined)
		{
			var teamplayersnow = cga.getTeamPlayers();
			
			if(teamplayersnow.length < obj.desired_teamplayers.length)
			{
				cb(new Error('当前队伍人数 '+teamplayersnow.length+' 小于预期值 '+obj.desired_teamplayers.length+', 可能队伍已解散，取消等待。'));
				return;
			}
		}
		
		if(passCheck){
			cb(null);
			return;
		}
		
		setTimeout(cga.waitForLocation, 1000, obj, cb);
	}
	
	/*等待到达某位置，无超时时间限制
		和cga.waitForLocation一样，只是可以等待多个位置，只要满足其中一个就能触发回调。
	*/
	cga.waitForMultipleLocation = (arr)=>{
		var name = cga.GetMapName();
		var fpos = cga.GetMapXYFloat();
		var index = cga.GetMapIndex().index3;

		for(var i = 0; i < arr.length; ++i){
			var obj = arr[i];
		
			var passCheck = true;

			if(typeof obj.mapname == 'string')
			{
				if(name != obj.mapname)
				{
					passCheck = false;
				}
			}
			if(typeof obj.mapindex == 'number')
			{
				if(index != obj.mapindex)
				{
					passCheck = false;
				}
			}
			if(obj.moving !== true && !(parseInt(fpos.x) % 64 == 0 && parseInt(fpos.y) % 64 == 0))
			{
				passCheck = false;
			}
			
			if(obj.pos instanceof Array)
			{
				if (!(Math.abs(fpos.x - obj.pos[0] * 64.0) < 1.001 * 64.0 && Math.abs(fpos.y - obj.pos[1] * 64.0) < 1.001 * 64.0))
				{
					passCheck = false;
				}
			}

			if(obj.leaveteam === true)
			{
				var teamplayersnow = cga.getTeamPlayers();

				if(teamplayersnow.length)
					passCheck = false;
				
				if(!passCheck && obj.walkto && !teamplayersnow.length && (index == obj.mapindex || name == obj.mapname) )
				{
					cga.WalkTo(obj.walkto[0], obj.walkto[1]);
				}
			}
			
			if(passCheck){
				if(obj.cb(null) == true)
					return;
			}
		}
		
		if(obj.desired_teamplayers != undefined)
		{
			var teamplayersnow = cga.getTeamPlayers();
			
			if(teamplayersnow.length < obj.desired_teamplayers.length)
			{
				if( obj.cb(new Error('当前队伍人数 '+teamplayersnow.length+' 小于预期值 '+obj.desired_teamplayers.length+', 可能队伍已解散，取消等待。')) == true)
					return;
			}
		}
		
		setTimeout(cga.waitForMultipleLocation, 1000, arr);
	}

	/**
	 * UNAecho : 曼哈顿距离
	 * @param {number} x 起始X坐标
	 * @param {number} y 起始Y坐标
	 * @param {number} targetX 目标X坐标
	 * @param {number} targetY 目标Y坐标
	 * @returns
	 */
	cga.manhattanDistance = (x, y, targetX,targetY) => {
		return Math.abs(targetX - x) + Math.abs(targetY - y);
	}

	/**
	 * UNAecho : 切比雪夫距离
	 * @param {number} x 起始X坐标
	 * @param {number} y 起始Y坐标
	 * @param {number} targetX 目标X坐标
	 * @param {number} targetY 目标Y坐标
	 * @return {number}
	 */
	cga.chebyshevDistance = (x, y, targetX,targetY) => {
		return Math.max(Math.abs(targetX - x), Math.abs(targetY - y))
	}

	cga.cachedMapTileMatrix = null;
	cga.cachedMapTileMatrixTime = 0;
	
	cga.buildMapTileMatrix = ()=>{
		var curtime = (new Date()).getTime();
		if(1 || cga.cachedMapTileMatrix == null || curtime > cga.cachedMapTileMatrixTime + 200)
		{
			var wall = cga.GetMapTileTable(true);
			var matrix = [];
			for(var y = 0; y < wall.y_size; ++y){
				if(!matrix[y])
					matrix[y] = [];
				for(var x = 0; x < wall.x_size; ++x){
					matrix[y][x] = wall.cell[x + y * wall.x_size];
				}
			}
			
			cga.cachedMapTileMatrix = curtime;
			cga.cachedMapTileMatrix = {matrix : matrix, x_bottom : wall.x_bottom, y_bottom : wall.y_bottom, x_size : wall.x_size, y_size : wall.y_size};
		}
		return cga.cachedMapTileMatrix;
	}
	/**
	 * UNAecho阅读注释：
	 * 此API数据来源为cga.GetMapCollisionTableRaw(true)
	 * 作用为制作cga.GetMapCollisionTableRaw(true)的2维矩阵形式的数据，本质上没有其他的数据处理，数据无变化。
	 */
	cga.cachedMapCollisionRawMatrix = null;
	cga.cachedMapCollisionRawMatrixTime = 0;
	
	cga.buildMapCollisionRawMatrix = ()=>{
		var curtime = (new Date()).getTime();
		if(1 || cga.cachedMapCollisionRawMatrix == null || curtime > cga.cachedMapCollisionRawMatrixTime + 200)
		{
			var wall = cga.GetMapCollisionTableRaw(true);
			var matrix = [];
			for(var y = 0; y < wall.y_size; ++y){
				if(!matrix[y])
					matrix[y] = [];
				for(var x = 0; x < wall.x_size; ++x){
					matrix[y][x] = wall.cell[x + y * wall.x_size];
				}
			}
			
			cga.cachedMapCollisionRawMatrixTime = curtime;
			cga.cachedMapCollisionRawMatrix = {matrix : matrix, x_bottom : wall.x_bottom, y_bottom : wall.y_bottom, x_size : wall.x_size, y_size : wall.y_size};
		}
		
		return cga.cachedMapCollisionRawMatrix;
	}
	
	cga.cachedMapCollisionMatrix = null;
	cga.cachedMapCollisionMatrixTime = 0;
	/**
	 * UNAecho阅读注释：
	 * 由于cga.GetMapCollisionTable()返回的cell碰撞数据是array格式，不够直观，本API返回处理后的对象数据，其中包含碰撞数组。
	 * 返回值里，matrix为碰撞数组，其中1为碰撞单位，0为非碰撞单位。
	 * exitIsBlocked，为true时，调用cga.GetMapObjectTable来辅助判断。
	 * cga.GetMapObjectTable()是较为接近raw数据的地图API，其中cell里的某个格子的值需要0xFF后进行判断
	 * (cell & 0xFF) == 2可能是碰撞（路过碰撞也算）的NPC BOSS。
	 * (cell & 0xFF) == 3猜测为【目的地并不是唯一的index】的切换点，例如野外随机迷宫传送石、有昼夜去别的地图入口等。（随机迷宫里的上下楼梯也是3，猜测为迷宫本身的index就是随机的）
	 * (cell & 0xFF) == 10猜测为和3一样是地图切换口，只不过【目的地唯一】比如法兰城各种门。
	 * @param {*} exitIsBlocked 
	 * @returns 
	 */
	cga.buildMapCollisionMatrix = (exitIsBlocked)=>{
		var curtime = (new Date()).getTime();
		if(1 || cga.cachedMapCollisionMatrix == null || curtime > cga.cachedMapCollisionMatrixTime + 200)
		{
			var wall = cga.GetMapCollisionTable(true);
			var objs = null;
			if(exitIsBlocked == true)
				objs = cga.GetMapObjectTable(true);
			var matrix = [];
			for(var y = 0; y < wall.y_size; ++y){
				if(!matrix[y])
					matrix[y] = [];
				for(var x = 0; x < wall.x_size; ++x){
					matrix[y][x] = wall.cell[x + y * wall.x_size] == 1 ? 1 : 0;
					if(exitIsBlocked == true){
						if(objs.cell[x + y * objs.x_size] & 0xff){
							matrix[y][x] = 1;
						}
					}
				}
			}
		
			cga.cachedMapCollisionMatrixTime = curtime;
			cga.cachedMapCollisionMatrix = {matrix : matrix, x_bottom : wall.x_bottom, y_bottom : wall.y_bottom, x_size : wall.x_size, y_size : wall.y_size};
		}

		return cga.cachedMapCollisionMatrix;
	}
	
	cga.cachedMapObjectMatrix = null;
	cga.cachedMapObjectMatrixTime = 0;
	
	cga.buildMapObjectMatrix = ()=>{
		var curtime = (new Date()).getTime();
		if(1 || cga.cachedMapObjectMatrix == null || curtime > cga.cachedMapObjectMatrixTime + 200)
		{
			var wall = cga.GetMapObjectTable(true);
			var matrix = [];
			for(var y = 0; y < wall.y_size; ++y){
				if(!matrix[y])
					matrix[y] = [];
				for(var x = 0; x < wall.x_size; ++x){
					matrix[y][x] = wall.cell[x + y * wall.x_size] & 0xff;
				}
			}
			
			cga.cachedMapObjectMatrixTime = curtime;
			cga.cachedMapObjectMatrix = {matrix : matrix, x_bottom : wall.x_bottom, y_bottom : wall.y_bottom, x_size : wall.x_size, y_size : wall.y_size};
		}
		
		return cga.cachedMapObjectMatrix;
	}
	
	cga.cachedMapObjects = null;
	cga.cachedMapObjectsTime = 0;
	
	cga.getMapObjects = ()=>{
		var curtime = (new Date()).getTime();
		if(1 || cga.cachedMapObjects == null || curtime > cga.cachedMapObjectsTime + 200)
		{
			var wall = cga.GetMapObjectTable(true);
			var objs = [];
			for(var y = 0; y < wall.y_size; ++y){
				for(var x = 0; x < wall.x_size; ++x){
					if((wall.cell[x + y * wall.x_size] & 0xff) != 0)
						objs.push({
							x:x,
							y:y,
							mapx:x+wall.x_bottom,
							mapy:y+wall.y_bottom,
							cell:wall.cell[x + y * wall.x_size] & 0xff,
							rawcell:wall.cell[x + y * wall.x_size]
						});
				}
			}
			
			cga.cachedMapObjectsTime = curtime;
			cga.cachedMapObjects = objs;
		}
		
		return cga.cachedMapObjects;
	}

	//搜索玩家单位
	cga.findPlayerUnit = (filter)=>{
		var found = cga.GetMapUnits().find((u)=>{
			return u.valid == 2 && u.type == 8 && (u.flags & 256) == 256 && ((typeof filter == 'function' && filter(u)) || (typeof filter == 'string' && filter == u.unit_name)) ;
		});
		return found != undefined ? found : null;
	}
	
	/**
	 * UNAecho: 记录一些常用迷宫的信息
	 * key选用迷宫名称的一部分，方便调用时使用。寻找迷宫入口可配合cga.getRandomMazeEntrance使用
	 * 可全文搜索【特定的迷宫】来查看部分楼梯信息
	 * 
	 * 【开发注意】使用cga.GetMapCollisionTableRaw()可判断迷宫中的上下楼梯。
	 * 但要注意几点（以下说明中所有的cell值，仅指cga.GetMapCollisionTableRaw()返回的obj中的cell对象，其他API的cell则不行）：
	 * 1、迷宫的出入口以及上下楼梯，cell值并不是相同的。
	 * 2、迷宫的上下楼梯，其实是有方向的，不论外观是向上还是向下，总是其中一种楼梯是楼层+1，另一种楼梯是楼层-1。不要看地图名称中写地上还是地下。
	 * 3、迷宫的上下楼梯，使楼层+1或-1的cell值，是固定的。比如诅咒的迷宫，楼层+1的cell值总是13997，楼层-1的cell值总是13996
	 * 4、迷宫的入口，一般是1层的传送水晶。cell值与上下楼梯均不相同，猜测cell值为0
	 * 5、迷宫的出口，一般是顶层的传送水晶。cell值与上下楼梯均不相同。
	 * 6、也就是说，迷宫中的传送碰撞点，一共有4种：入口、楼层+1楼梯、楼层-1楼梯、出口。
	 * 
	 * 注意，一些有缓步台（中间有固定地图，连接2个随机迷宫的出入口）的大迷宫，比如5转的4属性洞窟、蜥蜴洞穴、半山腰等等，可能是由2个（或多个，我没见过2个以上的）迷宫拼接起来的
	 * 比如5转任务的4属性迷宫，表面看起来，迷宫是1-9层+10层缓步台+11-19层+BOSS房间。但实际是下面2个独立迷宫拼凑起来的。下面分解：
	 * 1、第一个独立迷宫：入口为肯吉罗岛水晶，主体为1-9层迷宫，出口为第10层缓步台。出口的缓步台（第10层）为固定index地图；
	 * 如果迷宫重置，则被传送至迷宫入口肯吉罗岛
	 * 2、第二个独立迷宫：入口为第10层缓步台固定地图，主体为11-19层迷宫，出口为BOSS房间。BOSS房间为固定index地图；
	 * 如果迷宫重置，则被传送至迷宫入口第10层。
	 * 3、这两个迷宫完全独立，拥有自己的刷新时间。只是外观上看起来名字一样。类似的情况还有【半山腰】等地图。
	 */
	cga.mazeInfo = {
		/**
		 * 出口是个BOSS房间，可以选择跟勇者开战，或者和BOSS阴影开战。可能是个任务。我记得法兰城有两个并排在别墅区站着，让你抓什么东西
		 */
		'诅咒之迷宫' : {
			entryMap : '芙蕾雅',
			exitMap : '炼金术师的工作室',
			posList : [[263, 149], [284, 140], [295, 127]],
			xLimit : [260, 273],
			yLimit : [133, 164],
			prefix:'诅咒之迷宫地下',
			suffix:'楼',
			forwardEntryTile : 13997,
			backEntryTile : 13996,
			backTopPosList : [[99, 191,'']],
		},
		'废墟' : {
			entryMap : 27101,
			exitMap : 44707,
			posList : [[44,22]],
			xLimit : [44,44],
			yLimit : [22,22],
			prefix:'废墟地下',
			suffix:'层',
			forwardEntryTile : 17955,
			backEntryTile : 17954,
			backTopPosList : [[15, 16,'']],
		},
		'布满青苔的洞窟' : {
			entryMap : '芙蕾雅',
			exitMap : '叹息之森林',
			posList : [[380,353]],
			xLimit : [380,380],
			yLimit : [353,353],
			prefix:'布满青苔的洞窟',
			suffix:'楼',
			forwardEntryTile : 17964,
			backEntryTile : 17965,
			backTopPosList : [[99, 191,'']],// TODO坐标不对，确认坐标
		},
		/**	
		 * 共5层
		 * 蜥蜴洞穴其实是和4转洞窟一样的带有缓步台的迷宫，分为上层迷宫和下层迷宫。
		 * 不论上层还是下层，都是清一色的石化蜥蜴
		 * 上层是我们最常使用的90+练级地点。上层的1层大概95怪，顶层5层大概108级怪
		 * 上层出口的【蜥蜴最下层（index30401）】缓步台房间中，有几个对象：
		 * 1、传送石：[15, 16]回到刚才上层迷宫5层的传送石
		 * 2、传送石：[13, 3]前往蜥蜴洞穴下层迷宫第1层（另一个随机迷宫，可能是个任务）
		 * 3、BOSS：一个士兵的石像NPC（BOSS），对话点确定会进入战斗，是9只100级石化蜥蜴。
		 * 如果已经持有【士兵的石像#800201 @26】，则对话点确定也不会进入战斗
		 * 战斗除了对方石化比较猛以外，没有什么难度。
		 * 战斗胜利后进入【蜥蜴洞穴】（index30402，和入口不是同一张地图），房间中有刚刚对话的NPC。
		 * 对话点【确定】被传送至肯吉罗岛[384, 254]处（入口洞穴附近）。并获得【士兵的石像#800201 @26】。
		 * 注意：一个队伍只能一个人点击NPC对话并获得石像。暂时不知道什么用处。
		 */
		'蜥蜴洞穴上层' : {
			entryMap : '蜥蜴洞穴',
			exitMap : '蜥蜴最下层',// index30401
			posList : [[17,4]],
			xLimit : [17,17],
			yLimit : [4,4],
			prefix:'蜥蜴洞穴上层第',
			suffix:'层',
			forwardEntryTile : 12002,
			backEntryTile : 12000,
			backTopPosList : [[15, 16,'']],
		},
		/**
		 * 共5层
		 * 不论上层还是下层，都是清一色的石化蜥蜴
		 * 下层的1层大概110级怪，顶层5层大概119级怪。迷宫比上层大，不适合练级。
		 * 下层出口的【蜥蜴洞穴最下层（index30403）】BOSS房间中，有几个对象：
		 * 1、传送石：[26, 4]回到刚才下层迷宫5层的传送石
		 * 2、石碑ABCD：右键点击没反应，猜测和上层缓步台那个BOSS给的物品【士兵的石像#800201 @26】相关，但无论是否持有，点击都没有反应。
		 * 会不会是说暗号呢？
		 * 3、巨型蜥蜴：和石碑ABCD一样，无论说话、点击都没有反应。待研究。
		 */
		'蜥蜴洞穴下层' : {
			entryMap : '蜥蜴最下层',
			exitMap : '蜥蜴洞穴最下层',// index30403
			posList : [[13,3]],
			xLimit : [13,13],
			yLimit : [3,3],
			prefix:'蜥蜴洞穴下层第',
			suffix:'层',
			forwardEntryTile : 12002,
			backEntryTile : 12000,
			backTopPosList : [[26, 4,'']],
		},
		/**
		 * 层数不定，9-11层均出现过顶层
		 * 1层大概108级怪，顶层11层大概132级怪
		 * 出口房间是个看起来真的像房间的地图，还有红地毯。房间名称就叫【黑龙沼泽（index30404）】
		 * 但是房间前面有白骨哦。。
		 * NPC:发光的石板，点击对话【颇为显眼】，但点击确定没有任何反应，猜测是任务
		 * 传送石[11,17]：回到黑龙沼泽11层
		 * 
		 * 【注意】总有人在出口传送石附近练级，我怀疑可能有任务道具直接传送至出口房间，然后直接在出口房间传送石回到顶层练级。
		 * 另一种想法是，如果顶层数字并不确定，可能许多脚本的逻辑是走到顶层再走回来，这也可能是大家都在出口出练级的原因
		 */
		'黑龙沼泽' : {
			entryMap : '肯吉罗岛',
			exitMap : 30404,// 出口房间名称就叫【黑龙沼泽】，容易混淆，改用index记录
			posList : [[424,345]],
			xLimit : [420,430],
			yLimit : [340,350],
			prefix:'黑龙沼泽',
			suffix:'区',
			forwardEntryTile : 12002,
			backEntryTile : 12000,
			backTopPosList : [[11, 17,'']],
		},
		/**
		 * 旧日之地很特殊：
		 * 1、他的入口与出口，全都是楼梯。而且楼梯的colraw值，和上下楼梯一致。TODO 需要调整searchmap的逻辑，与其适配
		 * 入口的colraw值与往后的楼梯一致，是13274
		 * 出口的colraw值与往前的楼梯一致，是13275
		 * 2、和其他随机迷宫一样有重置时间，会【你感到一股不可思议的力量，而迷宫快要消失了】
		 * 3、每一层怪物的等级都是一样的，1层是120级，2-6层固定121级，7-11层固定122级，没有浮动。后面的层数不计了，太麻烦。20层顶层是124级。
		 * 
		 * BOSS房间index44711。
		 * BOSS：李贝留斯的幻影，pos[12,5],125级。只有BOSS一个人
		 * ◆Lv.125李贝留斯的幻影，血量约25000，邪魔系，属性：全25；技能：攻击、防御、超强冰冻魔法、超强风刃魔法、吸血魔法、吸血攻击、圣盾
		 * 一直合击就行，没有威胁，很简单，与接下来的旧日之地BOSS法尼迪斯形成天壤之别。
		 * 战斗胜利后被传送至小房间【旧日之塔入口6, 8, index 44712】
		 * 房间中[9,5]是进入下一个随机迷宫旧日之塔1层的入口。
		 * 
		 * 曙光2/强化丘比特任务相关
		 */
		'旧日迷宫' : {
			entryMap : '迷宫入口',
			exitMap : 44711,// 出口房间名称就叫【旧日之地】，容易混淆，改用index记录
			posList : [[9,5]],
			xLimit : [9,9],
			yLimit : [5,5],
			prefix:'旧日迷宫第',
			suffix:'层',
			forwardEntryTile : 13275,
			backEntryTile : 13274,
			backTopPosList : [[11, 17,'']],// TODO坐标不对，确认坐标
		},
		/**
		 * 战胜旧日迷宫BOSS李贝留斯的幻影后，才能抵达这个迷宫的入口
		 * 入口地图index44712
		 * 怪物等级1-12层128级，12-20层129级
		 * 【注意】如果你想抵达旧日之塔出口，你需要走爬完旧日之地20层，再爬旧日之塔20层，平均127+等级怪的40层地图。准备好满包的料理和传教士职业，消耗极大。
		 * BOSS超级能消耗，请准备【巫师】等非常能消耗的职业。
		 * 
		 * BOSS房间index44713
		 * BOSS：法尼迪斯，pos[45,46]，对话说【凡人是不该到这里来的】，点确定进入战斗
		 * ◆Lv.130法尼迪斯，血量约30000，邪魔系，属性：全30；技能：陨石（单、强、超）魔法、火焰魔法、乾坤一掷、阳炎、崩击、连击、补血魔法
		 * BOSS只有1人，会单补血、单火、强地、超地魔法、崩击、乾坤一掷、阳炎、连击。
		 * 对战建议：
		 * 1、【重点】超级消耗战！！一定保持好血量不要死亡，BOSS会用单火补刀，非常讨厌，尽量不要阵亡，不然拉起来还是被单火崩死
		 * 2、崩击使用频率较高，尽量不要防御。残血被崩到基本要回家了。
		 * 3、单补9000左右，非常能消耗。
		 * 4、折磨你的手段大致是：先通过群攻挠痒痒，然后出其不意地一直乾坤把你打残血，然后疯狂用单火补刀，让你永远无法救活阵亡的角色。
		 * 5、这样慢慢就因为补给不够而全员阵亡。
		 * 6、BOSS一般是强、超石磨血，单火打残血补刀。
		 */
		'旧日之塔' : {
			entryMap : '旧日之塔入口',
			exitMap : '旧日之塔顶层',// index 44713
			posList : [[9,5]],
			xLimit : [9,9],
			yLimit : [5,5],
			prefix:'旧日之塔第',
			suffix:'层',
			forwardEntryTile : 13996,
			backEntryTile : 13997,
			backTopPosList : [[11, 17,'']],// TODO坐标不对，确认坐标
		},
		/**
		 * 出口为半山腰，160级练级处。
		 * 注意通往山顶的路是没有经验的！但是烧技能却可以，恶心的设定。
		 */
		'通往山顶的路' : {
			entryMap : '小岛',
			exitMap : '半山腰',
			posList : [[64,45]],
			xLimit : [64,64],
			yLimit : [45,45],
			prefix:'通往山顶的路',
			suffix:'00M',
			forwardEntryTile : 13996,
			backEntryTile : 13997,
			backTopPosList : [[11, 17,'']],// TODO坐标不对，确认坐标
		},
		/**
		 * 如果你做完半山6【地狱的回响】，和大祭司对话进入的小岛，最后在破冰面下面进入的地狱入口是这个。
		 * 非常好走，几乎不会遇敌，单人逃跑即可！
		 */
		'地狱入口' : {
			entryMap : '圣山内部',
			exitMap : '地狱入口',// index57473
			posList : [[19,7]],
			xLimit : [19,19],
			yLimit : [7,7],
			prefix:'通往地狱的道路地下',
			suffix:'层',
			forwardEntryTile : 17957,
			backEntryTile : 17956,
			backTopPosList : [[11, 17,'']],// TODO坐标不对，确认坐标
		},
	}

	//下载地图的部分区域并等待下载完成
	cga.downloadMapEx = (xfrom, yfrom, xsize, ysize, cb)=>{

		throw new Error('警告：2022年1月18日一次更新后服务器对下载地图功能增加了验证，不再推荐使用该API!');
		cb(null);
		return;
		var last_index3 = cga.GetMapIndex().index3;
		var x = xfrom, y = yfrom;
		var recursiveDownload = ()=>{
			cga.RequestDownloadMap(x, y, x+24, y+24);
			x += 24;
			if(x > xsize){
				y += 24;
				x = xfrom;
			}
			if(y - ysize >= 24){
				var waitDownloadEnd = (timeout = 3000) => cga.AsyncWaitDownloadMap((err, msg) => {
					if (err) {
						if(last_index3 != cga.GetMapIndex().index3){
							cb(new Error('地图发生变化，下载失败'));
							return;
						}
						cb(null);
						return;
					}

					if ((msg.xtop >= xsize && msg.ytop >= ysize) || (msg.xbase == 0 && msg.ybase == 0)) {
						waitDownloadEnd(500);
					} else {
						waitDownloadEnd(timeout);
					}
				}, timeout);
				waitDownloadEnd();
				return;
			}
			setTimeout(recursiveDownload, 500);
		}
		recursiveDownload();
	}
	
	//下载整张地图并等待下载完成
	cga.downloadMap = (cb)=>{
		var walls = cga.buildMapCollisionMatrix(true);
		cga.downloadMapEx(0, 0, walls.x_size, walls.y_size, cb);
	}
	
	/**
	 * 走一层迷宫
		target_map :  走到目标地图就停止，填null则自动解析地图名中的楼层，填''则允许任何形式的地图作为目标楼层。
		filter (可选) : {
			layerNameFilter : 自定义解析地图名的方法
			entryTileFilter : 自定义解析楼梯的方法
		}
	 * UNAecho阅读注释：
	 * 如果想自动上下楼梯，可利用参数中的filter对象。
	 * 此API会给filter函数传入colraw（识别楼梯是前进还是后退，具体说明可参考cga.mazeInfo的开发笔记），和obj（识别传送石，也就是出入口）
	 * 可以将这2个配合使用，达成准确辨别切换地图的目的。
	 * 但如果想分辨是否是迷宫出入口，只能在遍历中加入全局数据，在函数外面重新遍历，具体下面注释有写。（为了不破坏API结构）
	 */
	cga.walkMaze = (target_map, cb, filter)=>{

		var objs = cga.getMapObjects();
				
		var newmap = null;

		if(typeof target_map != 'string'){
			var mapname = cga.GetMapName();
			
			var regex = mapname.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;

			if(regex && regex.length >= 3){
				layerIndex = parseInt(regex[2]);
			}
			
			if(layerIndex == 0){
				cb(new Error('无法从地图名中解析出楼层'));
				return;
			}
			
			if(filter && (typeof filter.layerNameFilter == 'function'))
			{
				newmap = filter.layerNameFilter(layerIndex, regex);
			}
			else
			{
				newmap = regex[1] + ((layerIndex >= 100) ? (layerIndex + 100) : (layerIndex + 1));
				if(typeof regex[3] == 'string')
					newmap += regex[3];
			}
		} else {
			newmap = target_map;
		}

		var target = null;
		
		if(filter && (typeof filter.entryTileFilter == 'function'))
		{
			var tiles = cga.buildMapTileMatrix();
			var colraw = cga.buildMapCollisionRawMatrix();
			objs.forEach((obj)=>{
				if(target == null && obj.cell == 3 && obj.mapx < colraw.x_size && obj.mapy < colraw.y_size && filter.entryTileFilter({
					tile : tiles.matrix[obj.mapy][obj.mapx],
					colraw : colraw.matrix[obj.mapy][obj.mapx],
					obj : obj,
					// UNAecho:为了不破坏API原有结构，又能在模块外全局识别迷宫出口以及楼梯方向，只能在这个遍历里面消耗一点空间，加入全局数据。
					objs : objs,
					colraws : colraw,
				}) == true &&
				// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
				cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)){
					target = obj;
					return false;
				}
			});
		}
		else
		{
			objs.forEach((obj)=>{

				if(cga.walkMazeStartPosition != null){
					if(obj.mapx == cga.walkMazeStartPosition.x && obj.mapy == cga.walkMazeStartPosition.y){
						return;
					}
				}
				// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
				if(target == null && obj.cell == 3  && cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)){
					target = obj;
					return false;
				}
			});
		}
		
		if(target == null){
			cb(new Error('无法找到迷宫的出口'));
			return;
		}

		console.log('迷宫楼层:【'+ cga.GetMapName() + '】，本层迷宫出口:('+target.mapx+', '+target.mapy+')');

		var pos = cga.GetMapXY();
		// UNAecho:这里计算迷宫出口路径，如果上面没有验证迷宫出口是否路径可达，就会报错。
		var walklist = cga.calculatePath(pos.x, pos.y, target.mapx, target.mapy, newmap, null, null, []);
		if(walklist.length == 0){
			cb(new Error('无法计算到迷宫出口的路径'));
			return;
		}

		cga.walkMazeStartPosition = null;

		cga.walkList(walklist, (err, reason)=>{
			if(err == null){
				cga.waitUntilMapLoaded(()=>{
					cb(err, reason);
				});
				return;
			}
			cb(err, reason);
			return;
		});
	}
	
	cga.waitUntilMapLoaded = (cb)=>{
		var curpos = cga.GetMapXY();
		if(cga.getRandomSpace(curpos.x, curpos.y) != null){
			cb(null);
			return;
		}
		console.log('地图未下载完成，服务器可能卡住，等待1秒后再试...');
		setTimeout(cga.waitUntilMapLoaded, 1000, cb);
	}

	//走随机迷宫
	cga.walkMazeStartPosition = null;
	cga.walkRandomMaze = (target_map, cb, filter)=>{

		cga.waitUntilMapLoaded(()=>{

			if(cga.walkMazeStartPosition == null)
			{
				cga.walkMazeStartPosition = cga.GetMapXY();
				// console.log('开始走随机迷宫...');
				// console.log('起始坐标：('+cga.walkMazeStartPosition.x+', '+cga.walkMazeStartPosition.y+')');
			}
			else
			{
				console.log('继续走随机迷宫...');
				console.log('起始坐标：('+cga.walkMazeStartPosition.x+', '+cga.walkMazeStartPosition.y+')');
			}
			cga.walkMaze(target_map, (err, reason)=>{
				if(err && err.message == '无法找到迷宫的出口'){
					cga.searchMap(()=>{
						/**
						 * UNAecho: 重写searchmap中的targetFinder逻辑
						 * 旧逻辑并没有考虑到如果外层cga.walkMaze的filter中，如果包含了自定义filter.entryTileFilter函数逻辑，则对楼梯的识别方式并不是只有cell==3就可以了的。
						 * 需要在有filter.entryTileFilter的情况下，加一层filter.entryTileFilter判断楼梯是否为意向的楼梯。
						 * */ 
						let objs = cga.getMapObjects()
						let target = undefined
						// 有filter.entryTileFilter的情况下，对门的判断需要经过filter.entryTileFilter的逻辑
						if(filter && (typeof filter.entryTileFilter == 'function')){
							// console.log('存在自定义判断楼梯的逻辑，自动排除视野内不符合预期的楼梯')
							let colraw = cga.buildMapCollisionRawMatrix();
							objs.forEach((obj)=>{
								if(target == null && obj.cell == 3 && obj.mapx < colraw.x_size && obj.mapy < colraw.y_size && filter.entryTileFilter({
									colraw : colraw.matrix[obj.mapy][obj.mapx],
									obj : obj,
									objs : objs,
									colraws : colraw,
								}) == true &&
								// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
								cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)){
									target = obj;
									return false;
								}
							});
						}else {// 没有自定义filter.entryTileFilter的普通情况
							objs.forEach((obj)=>{
								if(cga.walkMazeStartPosition != null){
									if(obj.mapx == cga.walkMazeStartPosition.x && obj.mapy == cga.walkMazeStartPosition.y){
										return;
									}
								}
								// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
								if(target == null && obj.cell == 3  && cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)){
									target = obj;
									return false;
								}
							});
						}
						
						return target != undefined ? true : false;
					}, (err)=>{
						if(err && err.message.indexOf('无法找到') >= 0){
							cga.walkRandomMaze(target_map, cb, filter);
							return;
						}
						console.log('成功寻找到随机迷宫出口');
						cga.walkMaze(target_map, cb, filter);
					});
					return;
				}
				cb(err, reason);
			}, filter);
		});
	}
	/**
	 * UNAecho:开发一个走迷宫API的封装
	 * 只需要输入你的目标楼层(1-99)或者目标地图名称(如黑龙沼泽9区)，或者迷宫的出口(如半山腰)，即可在迷宫中自动解析楼梯，以及行进方向。
	 * @param {string|number} targetMap 目标地点，可输入2种类型数值，string或者number。具体举例如下：
	 * 1、string：可输入楼层名称，或者入口、出口名称，如：'黑龙沼泽9区'，或者'半山腰'，或者'小岛'。可自动从迷宫中前进或后退至迷宫的入口/指定楼层/出口。
	 * 2、number：可输入楼层数字(1-99)、mapindex3数字(仅限出入口这种index固定的地图)。可自动从迷宫中前进或后退至迷宫的入口/指定楼层/出口。
	 * 
	 * 【注意】此API只能在迷宫中运行，入口、出口均直接调用回调函数。如需迷宫的入口寻找、自动走迷宫等功能，请使用cga.findAndWalkMaze()
	 * @param {*} cb 
	 * @returns 
	 */
	cga.walkRandomMazeAuto = (targetMap, cb) => {
		// 人物前进方向，true为向楼层增加方向走，false反之。
		var isForward = null
		// 获取静态地图数据
		var mazes = Object.values(cga.mazeInfo)
		var map = cga.GetMapName();
		var mazeInfo = mazes.find((m)=>{
			if(map.indexOf(m.prefix) != -1){
				return true
			}
		})

		const regexLayer = (str)=>{
			var regex = str.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;
	
			if(regex && regex.length >= 3){
				layerIndex = parseInt(regex[2]);
			}
			
			if(layerIndex == 0){
				throw new Error('无法从地图名中解析出楼层');
			}
			
			// 半山特殊数字处理，因为是以100为单位的。
			if(map.indexOf('通往山顶的路') != -1){
				layerIndex = layerIndex / 100
			}

			return layerIndex
		}
		// 对目标地图的解析，以及分析该向前还是向后走
		// 多个if else不能合并写，因为涉及到文字和数字混合判断地图。
		var newmap = null
		if(typeof targetMap == 'string'){
			newmap = targetMap
			if (targetMap == mazeInfo.entryMap){
				isForward = false
			}else if(targetMap == mazeInfo.exitMap){
				isForward = true
			}else if (regexLayer(targetMap) < regexLayer(map)){
				isForward = false
			}else if(regexLayer(targetMap) > regexLayer(map)){
				isForward = true
			}
		}else if(typeof targetMap == 'number'){
			if(targetMap > 0 && targetMap < 100){
				newmap = mazeInfo.prefix + targetMap + mazeInfo.suffix
				if (targetMap < regexLayer(map)){
					isForward = false
				}else if(targetMap > regexLayer(map)){
					isForward = true
				}
			}else{
				newmap = targetMap
				if (targetMap == mazeInfo.entryMap){
					isForward = false
				}else if(targetMap == mazeInfo.exitMap){
					isForward = true
				}
			}
		}else{
			throw new Error('targetMap必须为number或string')
		}

		if(cga.GetMapName() == newmap || cga.GetMapIndex().index3 == newmap){
			cb('ok')
			return
		}

		// 异常情况
		if (isForward === null){
			throw new Error('isForward必须为true或false，true为往楼层增加的方向走，false反之')
		}

		// 主逻辑
		var go = ()=> {
			let curmap = cga.GetMapName()
			let curmapIndex = cga.GetMapIndex().index3
			// 如果走一半迷宫消失了，则调用回调函数，交给外面逻辑处理
			if(curmap == mazeInfo.entryMap || curmapIndex == mazeInfo.entryMap){
				cb('entryMap');
				return;
			}else if(curmap == mazeInfo.exitMap || curmapIndex == mazeInfo.exitMap){
				console.log('进入楼梯时意外走出迷宫，推测输入的楼层数比迷宫最深处还多。')
				cb('exitMap');
				return;
			}

			// console.log('目标地图:【',newmap,'】，当前地图【',map,'】，需要往【',isForward ? '前':'后','】走')

			// cga.walkRandomMaze传入''，代表walklist中的空串，也就是walklist切换任何地图都不报异常。
			cga.walkRandomMaze('',(err,reason)=>{
				if(cga.GetMapName() == newmap || cga.GetMapIndex().index3 == newmap){
					cb('ok')
					return
				}else{
					go()
					return
				}
			},{
				entryTileFilter : (e)=>{
					let objs = e.objs
					// debug用
					// console.log("cga.walkRandomMaze e:", e)
					if(e.colraw == 0){
						for (let i = 0; i < objs.length; i++) {
							if(!isForward && objs[i].cell == 3 && e.colraws.matrix[objs[i].mapy][objs[i].mapx] == mazeInfo.forwardEntryTile){
								console.log('地图中存在前进楼梯，判定传送石为入口')
								return true
							}else if(isForward && objs[i].cell == 3 && e.colraws.matrix[objs[i].mapy][objs[i].mapx] == mazeInfo.backEntryTile){
								console.log('地图中存在后退楼梯，判定传送石为出口')
								return true
							}
							
						}
					}else if(isForward && e.colraw == mazeInfo.forwardEntryTile){
						return true
					}else if(!isForward && e.colraw == mazeInfo.backEntryTile){
						return true
					}
					return false
				}
			})
		}
		go()
		return
	}
	/**
	 * UNAecho:开发一个对cga各个迷宫API的全方位封装。功能为自动寻找迷宫、自动重新进入迷宫、自动探索迷宫、自动走迷宫至目标地图。
	 * 只需要输入迷宫名称、你的目标楼层(1-99)或者目标地图名称(如黑龙沼泽9区)，或者迷宫的出口(如半山腰)，即可在迷宫中自动解析楼梯，以及行进方向。
	 * @param {string} mazeName 迷宫名称，只能输入特定string。具体数值参考cga.mazeInfo中的各个key值。
	 * @param {string|number} targetMap 目标地点，可输入2种类型数值，string或者number。具体举例如下：
	 * 1、string：可输入楼层名称，或者入口、出口名称，如：'黑龙沼泽9区'，或者'半山腰'，或者'小岛'。可自动从迷宫中前进或后退至迷宫的入口/指定楼层/出口。
	 * 2、number：可输入楼层数字(1-99)、mapindex3数字(仅限出入口这种index固定的地图)。可自动从迷宫中前进或后退至迷宫的入口/指定楼层/出口。
	 * 
	 * @param {*} cb 
	 * @returns 
	 */
	cga.findAndWalkMaze = (mazeName, targetMap, cb) => {
		let find = (targetMap, cb)=>{
			let randomMazeArgs = {
				table : mazeInfo.posList,
				filter : (obj)=>{
					return obj.cell == 3 && obj.mapx >= mazeInfo.xLimit[0] && obj.mapx <= mazeInfo.xLimit[1] && obj.mapy >= mazeInfo.yLimit[0] && obj.mapy <= mazeInfo.yLimit[1];
				},
				blacklist : [],
				expectmap : mazeInfo.prefix + '1' + mazeInfo.suffix,
			};
			cga.getRandomMazeEntrance(randomMazeArgs, (err)=>{
				if(err && err.message && err.message.indexOf('没有找到迷宫入口') >= 0){
					console.log('可能迷宫重置并未刷新，重新进行寻找...')
					setTimeout(find, 3000, targetMap, cb);
					return;
				}
				go(targetMap, cb)
			});
		}

		let back = (cb)=>{
			cga.walkList(mazeInfo.backTopPosList, (err, reason)=>{
				if(err == null){
					cga.waitUntilMapLoaded(()=>{
						console.log('输入楼层大于迷宫最深层，已返回迷宫最深层，API结束。')
						cb(err, reason);
					});
					return;
				}
				cb(err, reason);
				return;
			});
		}

		let go = (targetMap, cb)=>{
			cga.walkRandomMazeAuto(targetMap, (r)=>{
				if(r){
					cga.waitUntilMapLoaded(()=>{
						if(r == 'ok'){
							console.log('抵达预期地图，API结束。')
							setTimeout(cb, 1500);
							return
						}else if(r == 'entryMap'){
							console.log('走迷宫失败，可能由于迷宫重置被传送至入口。重新进入迷宫...')
							setTimeout(find, 3000,targetMap, cb);
							return
						}else if(r == 'exitMap'){
							console.log('非预期的走出迷宫')
							setTimeout(back, 1500, cb);
							return
						}
						throw new Error('非预期的回调，请检查r:',r)
					});
				}else{
					throw new Error('非预期的回调，请检查r:',r)
				}
			})
		}

		let map = cga.GetMapName();
		let mapIndex = cga.GetMapIndex().index3
		let mazeInfo = cga.mazeInfo[mazeName]
		
		if(map == targetMap || mapIndex == targetMap){
			console.log('已经在目标地图中，API结束。')
			setTimeout(cb, 1500);
			return
		}
		if(map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1){
			go(targetMap, cb)
		}else if(map == mazeInfo.entryMap || mapIndex == mazeInfo.entryMap){
			find(targetMap, cb)
		}else if(map == mazeInfo.exitMap || mapIndex == mazeInfo.exitMap){
			back(cb)
		}else{
			throw new Error('未知迷宫地图，请检查。map:', map)
		}
		return
	}

	cga.getRandomMazeEntrance = (args, cb, index = 0)=>{

		if(index == undefined)
			index = 0;

		if(args.table[index] == undefined)
		{
			cb(new Error('所有区域都已搜索完毕，没有找到迷宫入口！'));
		}

		console.log('前往区域['+(args.table[index])+']搜索迷宫入口..');
	
		cga.walkList([
			args.table[index]
		], ()=>{
			console.log('正在区域['+(args.table[index])+']搜索迷宫入口...');
			var entrance = cga.getMapObjects().find((obj)=>{
	
				if(args.blacklist && args.blacklist.find((e)=>{
					return e.mapx == obj.mapx && e.mapy == obj.mapy;
				}) != undefined)
				{
					return false;
				}
	
				return args.filter(obj);
			});

			if(entrance == undefined){
				console.log('未找到迷宫入口,尝试下一区域...');
				cga.getRandomMazeEntrance(args, cb, index+1);
			} else {
				if(args.expectmap)
				{
					var originalmap = cga.GetMapName();
					cga.walkList([
						[entrance.mapx, entrance.mapy, args.expectmap]
					], (err)=>{
						if(err && err.message == 'Unexcepted map changed.'){
							var xy = cga.GetMapXY();
							args.blacklist.push(entrance);
							cga.walkList([
								[xy.x, xy.y, originalmap],
							], ()=>{
								console.log('未找到迷宫入口,尝试下一区域...');
								cga.getRandomMazeEntrance(args, cb, index+1);
							});
							return;
						}
						cb(entrance);
					});
				}
				else
				{
					cb(entrance);
				}
			}
		});
	}
	// UNAecho: 弃用原探索迷宫API，注释备用

	// cga.searchMap = (targetFinder, cb) => {
	// 	const getMovablePoints = (map, start) => {
	// 		const foundedPoints = {};
	// 		foundedPoints[start.x + '-' + start.y] = start;
	// 		const findByNextPoints = (centre) => {
	// 			const nextPoints = [];
	// 			const push = (p) => {
	// 				if (p.x > map.x_bottom && p.x < map.x_size && p.y > map.y_bottom && p.y < map.y_size) {
	// 					if (map.matrix[p.y][p.x] === 0) {
	// 						const key = p.x + '-' + p.y;
	// 						if (!foundedPoints[key]) {
	// 							foundedPoints[key] = p;
	// 							nextPoints.push(p);
	// 						}
	// 					}
	// 				}
	// 			};
	// 			push({x: centre.x + 1, y: centre.y});
	// 			push({x: centre.x + 1, y: centre.y + 1});
	// 			push({x: centre.x, y: centre.y + 1});
	// 			push({x: centre.x - 1, y: centre.y + 1});
	// 			push({x: centre.x - 1, y: centre.y});
	// 			push({x: centre.x - 1, y: centre.y - 1});
	// 			push({x: centre.x, y: centre.y - 1});
	// 			push({x: centre.x + 1, y: centre.y - 1});
	// 			nextPoints.forEach(findByNextPoints);
	// 		};
	// 		findByNextPoints(start);
	// 		return foundedPoints;
	// 	};
	// 	const getFarthestEntry = (current) => {
	// 		return cga.getMapObjects().filter(e => [3,10].indexOf(e.cell) >= 0 && (e.mapx != current.x || e.mapy != current.y)).sort((a, b) => {
	// 			const distanceA = Math.abs(a.mapx - current.x) + Math.abs(a.mapy - current.y);
	// 			const distanceB = Math.abs(b.mapx - current.x) + Math.abs(b.mapy - current.y);
	// 			return distanceB - distanceA;
	// 		}).shift();
	// 	};
	// 	const getTarget = (noTargetCB) => {
	// 		const target = targetFinder(cga.GetMapUnits());
	// 		if (typeof target == 'object') {
	// 			console.log('成功找到有效目标2');
	// 			const walkTo = cga.getRandomSpace(target.xpos, target.ypos);
	// 			if (walkTo) {
	// 				cga.walkList([walkTo], () => cb(null, target));
	// 			} else {
	// 				noTargetCB();
	// 			}
	// 		} else if (target === true){
	// 			console.log('成功找到有效目标1');
	// 			cb(null);
	// 		} else{
	// 			console.log('未找到有效目标');
	// 			noTargetCB();
	// 		}
	// 	};
	// 	const toNextPoint = (points, current, toNextCB) => {
	// 		const remain = points.filter(p => {
	// 			const xd = Math.abs(p.x - current.x);
	// 			const yd = Math.abs(p.y - current.y);
	// 			p.d = xd + yd;
	// 			return !(xd < 12 && yd < 12);
	// 		}).sort((a,b) => a.d - b.d);
	// 		const next = remain.shift();
	// 		if (next)
	// 		{
	// 			if(cga.isPathAvailable(current.x, current.y, next.x, next.y))
	// 			{
	// 				cga.walkList([[next.x,next.y]], () => getTarget(() => toNextPoint(remain, next, toNextCB)));
	// 			}
	// 			else
	// 			{
	// 				getTarget(() => toNextPoint(remain, next, toNextCB))
	// 			}
	// 		}
	// 		else 
	// 		{
	// 			toNextCB();
	// 		}
	// 	};
	// 	//const start = cga.GetMapXY();
	// 	//let entry = null;
	// 	const findNext = (walls) => {
	// 		const current = cga.GetMapXY();
	// 		//if (!entry && recursion) entry = getFarthestEntry(start);
	// 		toNextPoint(Object.values(getMovablePoints(walls, current)), current, () => {
	// 			cb(new Error('无法找到符合条件的对象'));
	// 		});
	// 	};
	// 	getTarget(() => {
	// 		let walls = cga.buildMapCollisionMatrix();
	// 		/*if(walls.matrix[0][0] == 1
	// 			|| walls.matrix[walls.y_size-1][0] == 1
	// 			|| walls.matrix[walls.y_size-1][walls.x_size-1] == 1
	// 			|| walls.matrix[0][walls.x_size-1] == 1
	// 		) {
	// 			cga.downloadMap(() => findNext(cga.buildMapCollisionMatrix()));
	// 		} else findNext(walls);*/
	// 		findNext(walls);
	// 	});
	// }
	
	/**
	 * UNAecho：
	 * 重写cga.searchMap方法。原方法有很多注释掉的代码，再涂改则容易混乱，所以考虑自己新写一个。
	 * 写探索地图的逻辑的初衷是因为：目前官方封禁了下载功能，无法调用download去加载全部地图。
	 * 
	 * 原cga.searchMap的原理大致为：
	 * 1、寻找出口，如果没找到，则进入迷宫探索模式
	 * 2、探索模式下，使用cga.buildMapCollisionMatrix()来获取所有的非碰撞(0点，碰撞点值为1）
	 * 3、初次迭代，计算以自己为中心，曼哈顿距离大于24(x,y均大于12)的点作为目标点进行移动
	 * 4、进入迭代，每次取第3步最近的坐标。如果候选集走完，则重新回到第1步，来刷新当前地图状态。
	 * 
	 * 由于上面第4步每次迭代，是选取目标地点作为下一次迭代的中心，这么做有3个弊端：
	 * 1、会选到墙外的0点，这种点无法到达，而这种点很多。
	 * 2、当1说的情况出现时，迭代中会以墙外点作为下一次计算曼哈顿距离大于24的点，这样会导致目标过于随机
	 * 3、目标过于随机，人物会经常重复走已探索过的区域。
	 * 4、由于随机，极端情况下甚至无法走出迷宫。
	 * 
	 * 但也有优点，速度快，性能较优。
	 * 
	 * 现在，重新一个新的地图探索逻辑：
	 * 
	 * 1、使用cga.buildMapCollisionMatrix(true)获取全图碰撞矩阵，里面0为非碰撞，1为碰撞。
	 * 2、建立黑名单矩阵，与1中的数组长宽一致。使用null值进行初始化填充。
	 * 3、所有逻辑以碰撞点（以下称作1点）为目标，将所有非碰撞点（以下称为0点）均加入至黑名单。
	 * 4、勘测碰撞矩阵周围8格存在0点的1点，也就是找到周围8格有可达点的墙壁
	 * 5、第4步中的墙壁，如果周围8格的墙壁超过5（包含）个，则视为待探索区域。追加到候选集中
	 * 6、将第5步的候选集过滤，仅保留切比雪夫距离大于12的点，并且以距离人物最近的点为升序进行排序。（也就是选择优先前往距离自己最近的未探索区域，而不是未探索区域面积最大的地方）
	 * 7、由于已探索完毕，将第6步所有探索过的墙壁点加入黑名单，降低人物消耗
	 * 8、6-7步中，每走一步监测地图是否有变化。
	 * 9、如果第8步有变化，则要么寻找地图出口，要么回到第4步并调用cga.buildMapCollisionMatrix刷新矩阵，迭代逻辑。
	 * 10、无论第8步是否有变化，都将探索过的墙壁都加入黑名单，因为探索一次即可。
	 * 
	 * 这个方法有缺点，虽然肯定会找到迷宫出口，但性能较差，运行时间长。TODO性能优化
	 * 注意：
	 * 不要使用new Array(y_size).fill(new Array(x_size).fill(null))这种方式创建2维全null数组
	 * 这样会变成使用同一个new Array(x_size).fill(null)去填充1维数组
	 * 后果就是更改任何一列，其他列的数值也都跟着替换，因为是浅拷贝！
	 * 
	 * @param {Function} targetFinder
	 * @param {callback} cb 
	 */
	cga.searchMap = (targetFinder, cb) => {
		// 用cga.GetMapCollisionTableRaw()来获取地图大小，给下面黑名单数组初始化
		var mapCollisionTableRaw = cga.GetMapCollisionTableRaw(true)
		// 黑名单，用于记录不需要探索的墙壁，注意深浅拷贝的问题，容易debug很久
		var cacheBlacklistWalls = new Array(mapCollisionTableRaw.y_size)
		for (let i = 0; i < cacheBlacklistWalls.length; i++) {
			cacheBlacklistWalls[i] = new Array(mapCollisionTableRaw.x_size).fill(null)
		}
		// 计算周围8点有多少碰撞点
		var calCnt = (walls,x,y)=>{
			var cnt = 0
			if(walls[y][x-1] == 1)
				cnt += 1
			if(walls[y][x+1] == 1)
				cnt += 1
			if(walls[y-1][x] == 1)
				cnt += 1
			if(walls[y+1][x] == 1)
				cnt += 1
			if(walls[y+1][x+1] == 1)
				cnt += 1
			if(walls[y+1][x-1] == 1)
				cnt += 1
			if(walls[y-1][x+1] == 1)
				cnt += 1
			if(walls[y-1][x-1] == 1)
				cnt += 1
			
			return cnt;
		}

		const getTarget = (noTargetCB) => {
			const target = targetFinder(cga.GetMapUnits());
			if (typeof target == 'object') {
				console.log('成功找到有效目标');
				const walkTo = cga.getRandomSpace(target.xpos, target.ypos);
				if (walkTo) {
					cga.walkList([walkTo], () => cb(null, target));
				} else {
					noTargetCB();
				}
			} else if (target === true){
				console.log('成功找到楼梯...');
				cb(null);
			} else{
				console.log('未找到有效目标');
				noTargetCB();
			}
		};

		const go = (collisionMatrix, next, cb)=>{
			let point = next.shift()
			if(point){
				cga.walkList(
					[point], 
					() => {
						if(collisionMatrix.join() === cga.buildMapCollisionMatrix(true).matrix.join()){
							console.log('视野无变化，将x',point[0],'y',point[1],'加入黑名单，并继续探索剩余坐标。')
							cacheBlacklistWalls[point[1]][point[0]]
							go(collisionMatrix, next, cb);
						}else{
							// console.log('视野有变化，重新进入getTarget...')
							cacheBlacklistWalls[point[1]][point[0]]
							getTarget(() => toNextPoint(cb))	
						}
					}
				);	
			}else{
				console.log('【注意】未找到符合条件的未探索墙壁，请检查。')
				cb(null)
			}
		}

		const toNextPoint = (toNextCB) => {
			// 考虑到迷宫可能非常大，cga.buildMapCollisionMatrix需要全图加载，所以传入true
			let collisionMatrix = cga.buildMapCollisionMatrix(true).matrix;
			const current = cga.GetMapXY();
            let next = []

			// 注意y和x与平时相反，因为常用的xy代表游戏坐标，而cga.buildMapCollisionMatrix().matrix的xy代表横纵轴
        	// 地图边缘不参与计算，所以改为index从1开始，length - 1结束
			for (let y = 1; y < collisionMatrix.length - 1; y++) {
				for (let x = 1; x < collisionMatrix[y].length - 1; x++) {
					// 在黑名单中则跳过此点的计算
                    if(cacheBlacklistWalls[y][x] !== null){
                        continue
					}
					// 非碰撞点不参与计算
					if(collisionMatrix[y][x] == 0){
                        cacheBlacklistWalls[y][x] = 0
						continue
                    }
					// 四周都是碰撞点，可能是未探索区域，只跳过，不加黑名单
                    if(collisionMatrix[y][x-1] == 1 && collisionMatrix[y][x+1] == 1 &&
                        collisionMatrix[y-1][x] == 1 && collisionMatrix[y+1][x] == 1)
							continue
                    if(collisionMatrix[y][x-1] == 0 && cga.isPathAvailable(current.x, current.y, x - 1, y)){
                        if(calCnt(collisionMatrix, x, y) < 5){
							cacheBlacklistWalls[y][x] = 1
                        }else{
                            next.push([x-1,y])
                        }
						continue
                    }
					if(collisionMatrix[y][x+1] == 0 && cga.isPathAvailable(current.x, current.y, x + 1, y)){
                        if(calCnt(collisionMatrix, x, y) < 5){
							cacheBlacklistWalls[y][x] = 1
                        }else{
                            next.push([x+1,y])
                        }
						continue
                    }
					if(collisionMatrix[y-1][x] == 0 && cga.isPathAvailable(current.x, current.y, x, y - 1)){
                        if(calCnt(collisionMatrix, x, y) < 5){
							cacheBlacklistWalls[y][x] = 1
                        }else{
                            next.push([x,y-1])
                        }
						continue
                    }
					if(collisionMatrix[y+1][x] == 0 && cga.isPathAvailable(current.x, current.y, x, y + 1)){
                        if(calCnt(collisionMatrix, x, y) < 5){
							cacheBlacklistWalls[y][x] = 1
                        }else{
                            next.push([x,y+1])
                        }
						continue
                    }
				}
			}
			// 规则过滤与排序
			// 目标点过滤逻辑为，删除距离自己切比雪夫距离小于12的点（因为已在视野内）
			// 排序逻辑为，以切比雪夫距离最近的点为优先，而不是以周围8格墙壁数最多的墙为优先。
			next = next.filter((p)=>{
				return cga.chebyshevDistance(current.x, current.y, p[0], p[1]) > 12 ? true : false
			}).sort((a,b) => cga.chebyshevDistance(current.x, current.y, a[0], a[1]) - cga.chebyshevDistance(current.x, current.y, b[0], b[1]))

			go(collisionMatrix, next, toNextCB)

		};
		getTarget(() => {
			toNextPoint(() => {
				cb(new Error('无法找到符合条件的对象'));
			});
		});
	}
	
	//获取一格(x,y)周围1x1区域内的空闲地形格子
	cga.getRandomSpace = (x, y)=>{
		var walls = cga.buildMapCollisionMatrix(true);
		if(walls.matrix[y][x-1] == 0)
			return [x-1, y];
		if(walls.matrix[y][x+1] == 0)
			return [x+1, y];
		if(walls.matrix[y-1][x] == 0)
			return [x, y-1];
		if(walls.matrix[y+1][x] == 0)
			return [x, y+1];
		if(walls.matrix[y+1][x+1] == 0)
			return [x+1,y+1];
		if(walls.matrix[y+1][x-1] == 0)
			return [x-1,y+1];
		if(walls.matrix[y-1][x+1] == 0)
			return [x+1,y-1];
		if(walls.matrix[y-1][x-1] == 0)
			return [x-1,y-1];
		
		return null;
	}
	
	//获取一格(x,y)周围1x1区域内的空闲地形的2个格子，多用于组队和NPC对话
	cga.get2RandomSpace = (x, y)=>{
		var walls = cga.buildMapCollisionMatrix(true);
		var result = []
		var pos = []
		
		if(walls.matrix[y][x-1] == 0)
			pos.push([x-1, y]);
		if(walls.matrix[y][x+1] == 0)
			pos.push([x+1, y]);
		if(walls.matrix[y-1][x] == 0)
			pos.push([x, y-1]);
		if(walls.matrix[y+1][x] == 0)
			pos.push([x, y+1]);
		if(walls.matrix[y+1][x+1] == 0)
			pos.push([x+1,y+1]);
		if(walls.matrix[y+1][x-1] == 0)
			pos.push([x-1,y+1]);
		if(walls.matrix[y-1][x+1] == 0)
			pos.push([x+1,y-1]);
		if(walls.matrix[y-1][x-1] == 0)
			pos.push([x-1,y-1]);
		if(pos.length <= 1){
			throw new Error('NPC周围最多可能只有一格空闲地形，无法返回多个坐标。')
		}
		// 第一次优先找x或y轴相邻的坐标
		for (var i in pos){
			for(var j in pos){
				if (pos[i][0] == pos[j][0] && pos[i][1] == pos[j][1])
					continue
				if (result.length < 2
					&& (Math.abs(pos[i][0] - pos[j][0]) < 2 && Math.abs(pos[i][1] - pos[j][1]) < 2)
				 	&& (Math.abs(pos[i][0] - pos[j][0]) == 0 || Math.abs(pos[i][1] - pos[j][1]) == 0)
					){
					result.push(pos[i],pos[j])
					return result
				}
			}
		}
		// 如果没找到相邻的空闲格子，就找x与y都不相等的斜方向格子
		for (var i in pos){
			for(var j in pos){
				if (pos[i][0] == pos[j][0] && pos[i][1] == pos[j][1])
					continue
				if (result.length < 2 && (Math.abs(pos[i][0] - pos[j][0]) < 2 && Math.abs(pos[i][1] - pos[j][1]) < 2)){
					result.push(pos[i],pos[j])
					return result
				}
			}
		}

		return null
	}
	
	//获取一格(x,y)周围1x1区域内的空闲地形格子，并判断其方向
	cga.getRandomSpaceDir = (x, y)=>{
		var walls = cga.buildMapCollisionMatrix(true);
		if(walls.matrix[y][x-1] == 0)
			return 4;
		if(walls.matrix[y][x+1] == 0)
			return 0;
		if(walls.matrix[y-1][x] == 0)
			return 6;
		if(walls.matrix[y+1][x] == 0)
			return 2;
		if(walls.matrix[y+1][x+1] == 0)
			return 1;
		if(walls.matrix[y+1][x-1] == 0)
			return 3;
		if(walls.matrix[y-1][x+1] == 0)
			return 7;
		if(walls.matrix[y-1][x-1] == 0)
			return 5;
		
		return null;
	}
	
	cga.tradeInternal = (stuff, checkParty, resolve, playerName, timeout) => {
		
		var savePartyName = null;
		var tradeFinished = false;
		var receivedStuffs = {};
		var beginTime = (new Date()).getTime();
		
		var waitTradeMsg = ()=>{
			
			cga.waitSysMsg((msg)=>{

				if(tradeFinished)
					return false;
																
				if(msg.indexOf('交易完成') >= 0){
					tradeFinished = true;
					resolve({
						success: true,
						received: receivedStuffs,
						reason : '交易成功',
					});
					return false;
				} else if(msg.indexOf('交易中止') >= 0){

					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason : '交易被拒绝',
					});
					return false;
				} else if(msg.indexOf('因物品栏已满所以无法交易') >= 0){

					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason : '物品栏已满',
					});
					return false;
				} else if(msg.indexOf('没有可交易的对象') >= 0){
					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason : '没有可交易的对象',
					});
					return false;
				}
				
				return true;
			});	
		}
		
		var waitDialog = ()=>{
			
			if(tradeFinished)
				return;
			
			var getInTradeStuffs = false;
			var tradeStuffsChecked = false;
						
			var waitTradeStuffs = ()=>{

				cga.AsyncWaitTradeStuffs((err, type, args) => {
				
					if(!args){

						if(getInTradeStuffs == false && !tradeFinished)
							waitTradeStuffs();
						
						return;
					}
					
					if(type >= cga.TRADE_STUFFS_ITEM && type <= cga.TRADE_STUFFS_GOLD )
						console.log('正在等待获取交易内容：' + cga.TRADE_STUFFS_TRANSLATION[type]);

					getInTradeStuffs = true;
						
					if(type == cga.TRADE_STUFFS_ITEM){
						receivedStuffs.items = args;
					}else if(type == cga.TRADE_STUFFS_PET){
						receivedStuffs.pet = [];
						receivedStuffs.pet[args.index] = args;
					}else if(type == cga.TRADE_STUFFS_PETSKILL){
						if(!(receivedStuffs.pet instanceof Array))
							receivedStuffs.pet = [];
						if(receivedStuffs.pet[args.index])
							receivedStuffs.pet[args.index].skills = args;
					}else if(type == cga.TRADE_STUFFS_GOLD){
						receivedStuffs.gold = args;
					}
				
				}, 1000);
			}
			
			var waitTradeState = () => {

				cga.AsyncWaitTradeState((err, state) => {

					if(tradeFinished)
						return;

					var timeout_trade = (typeof timeout == 'number') ? timeout : 30000;
					if( (new Date()).getTime() > beginTime + timeout_trade){
						tradeFinished = true;
						cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
						resolve({
							success: false,
							reason : '交易被拒绝',
						});
						return;
					}
					
					if(state != undefined)
						console.log('交易状态变更为：' + cga.TRADE_STATE_TRANSLATION[state]);
					
					if(!err){
						if (state == cga.TRADE_STATE_READY || state == cga.TRADE_STATE_CONFIRM) {
							getInTradeStuffs = true;
							if (!checkParty || tradeStuffsChecked || checkParty(playerName ? playerName : savePartyName, receivedStuffs)) {
								tradeStuffsChecked = true;
								console.log('确认交易...');
								cga.DoRequest(cga.REQUEST_TYPE_TRADE_CONFIRM);
							} else {
								console.log('拒绝交易...');
								cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
							}
						} else if (state == cga.TRADE_STATE_SUCCEED || state == cga.TRADE_STATE_CANCEL) {
							getInTradeStuffs = true;
						}
					}

					waitTradeState();
				}, 1000);
			}

			waitTradeStuffs();
			
			waitTradeState();
			
			const itemFilter = (stuff && typeof stuff.itemFilter == 'function') ? stuff.itemFilter : () => false;
			const petFilter = (stuff && typeof stuff.petFilter == 'function') ? stuff.petFilter : () => false;
			const tradeItems = cga.getInventoryItems().filter(itemFilter).map(e => {
				return {itemid: e.itemid, itempos: e.pos, count: (e.count > 1 ? e.count : 1)};
			});

			const tracePets = cga.GetPetsInfo().filter(petFilter).map((e)=>{
				return e.index;
			});

			cga.TradeAddStuffs(
				tradeItems,
				tracePets,
				(stuff && stuff.gold) ? stuff.gold : 0
			);
		}
		
		cga.AsyncWaitTradeDialog((err, partyName, partyLevel) => {
			
			if(tradeFinished)
				return;
			
			console.log('正在等待交易对话框...');
			
			savePartyName = partyName;
			
			if (!err && partyLevel > 0) {
				waitDialog();
			} else {
				cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
				tradeFinished = true;
				resolve({
					success: false,
					reason : '等待交易对话框超时',
				});
			}
		}, 10000);
		
		waitTradeMsg();
	};

	//主动向名字为name的玩家发起交易，给他stuff里指定的东西，成功或失败时回调resolve，在checkParty里可以根据对方名字和收到的东西判断同意还是拒绝交易
	/*
	给名字为hzqst的玩家交易3组鹿皮:
		var count = 0;
		cga.positiveTrade('hzqst', {
			itemFilter : (item)=>{
				if(item.name == '鹿皮' && item.count == 40 && count < 3){
					count ++;
					return true;
				}
				return false;
			}		
		},
		null, (arg)=>{
			if(arg.success){
				console.log('交易成功!');
			} else {
				console.log('交易失败! 原因：'+arg.reason);
			}
		});

	给名字为hzqst的玩家交易包里所有的鹿皮，并且对方必须给自己1000金币否则拒绝交易:
		cga.positiveTrade('hzqst', {
			itemFilter : (item)=>{
				return item.name == '鹿皮' && item.count == 40;
			}
		},
		(playerName, receivedStuffs)={
			if(receivedStuffs.gold != 1000){
				console.log('对方没有给自己1000金币!');
				return false;
			}
			return true;
		}, 
		(arg)=>{
			if(arg.success){
				console.log('交易成功!');
			} else {
				console.log('交易失败! 原因：'+arg.reason);
			}
		});

	给名字为hzqst的玩家交易3只哥布林，并且对方必须给自己一只红帽哥布林否则拒绝交易:
		var count = 0;
		cga.positiveTrade('hzqst', {
			petFilter : (pet)=>{
				if(pet.realname == '哥布林' && count < 3){
					count ++;
					return true;
				}
				return false;
			}
		},
		(playerName, receivedStuffs)={
			
			if(receivedStuffs && receivedStuffs.pets){
				if(receivedStuffs.pets.find((pet)=>{
					return pet.realname == '红帽哥布林';
				}) == null){
					console.log('对方没有给自己红帽哥布林!');
					return false;
				}
			}
			return true;
		}, 
		(arg)=>{
			if(arg.success){
				console.log('交易成功!');
			} else {
				console.log('交易失败! 原因：'+arg.reason);
			}
		});

		//arg中可能的返回值：
		{
			success: false,                 //是否交易成功
			received: [],                   //交易成功时接受到的物品、宠物、金币
			reason: '交易被拒绝',              //交易失败的原因
		}
	*/
	cga.positiveTrade = (name, stuff, checkParty, resolve, timeout) => {
	
		var resulted = false;

		cga.AsyncWaitPlayerMenu((err, players) => {
			
			if(resulted)
				return false;
			
			if(err){

				resulted = true;
				
				resolve({
					success: false,
					reason : '等待交易玩家选择菜单超时',
				});

				return;
			}
			
			if (!(players instanceof Array)) players = [];
			var player = players.find((e, index) => typeof name == 'number' ? index == name : e.name == name);
			if (player !== undefined) {

				resulted = true;

				cga.tradeInternal(stuff, checkParty, resolve, name, timeout);
				cga.PlayerMenuSelect(player.index);
			} else {
				
				resulted = true;

				resolve({
					success: false, 
					reason : '未找到目标交易对象',
				});

			}
		}, 5000);

		cga.waitSysMsgTimeout((err, msg)=>{

			if(resulted)
				return false;

			if(err)
				return false;

			if(msg && msg.indexOf('没有可交易的对象！') >= 0)
			{
				resulted = true;

				resolve({
					success: false, 
					reason : '没有可交易的对象',
				});

				return false;
			}

			return true;

		}, 2000);
		
		cga.DoRequest(cga.REQUEST_TYPE_TRADE);
	}
	
	//主动向name玩家发起交易（到开启交易对话框为止），成功或失败时回调resolve
	cga.requestTrade = (name, resolve) => {
		var resulted = false;
		
		cga.AsyncWaitPlayerMenu((err, players) => {
			if(resulted)
				return;

			if(err){
				resulted = true;
				
				resolve({
					success: false,
					reason : '等待交易玩家选择菜单超时',
				});

				return;
			}
			
			if (!(players instanceof Array)) players = [];
			var player = players.find((e, index) => typeof name == 'number' ? index == name : e.name == name);
			if (player !== undefined) {

				resulted = true;

				resolve({success: true});

				cga.PlayerMenuSelect(player.index);

			} else {

				resulted = true;

				resolve({
					success: false, 
					reason : '未找到目标交易对象',
				});

			}
		}, 5000);
		
		cga.waitSysMsgTimeout((err, msg)=>{

			if(resulted)
				return false;

			if(err)
				return false;

			if(msg && msg.indexOf('没有可交易的对象！') >= 0)
			{
				resulted = true;

				resolve({
					success: false, 
					reason : '没有可交易的对象',
				});

				return false;
			}

			return true;

		}, 2000);

		cga.DoRequest(cga.REQUEST_TYPE_TRADE);
	}

	//等待其他玩家向自己发起交易，成功或失败时回调resolve，在checkParty里可以根据对方名字和收到的东西判断同意还是拒绝交易
	//提示：receivedStuffs可能为空数组，所以访问receivedStuffs.items或其他成员之前必须先检查有效性！
	/*
	等待任意玩家给自己交易3组鹿皮:		
		cga.waitTrade({},
		(playerName, receivedStuffs)=>{
			if(receivedStuffs && receivedStuffs.items){
				if( receivedStuffs.items.filter((item)=>{
					return item.name == '鹿皮' && item.count == 40;
				}).length == 3 )
				{
					return true;
				}
			}
			return false;
		},
		(arg)=>{
			if(arg.success){
				console.log('交易成功!');
			} else {
				console.log('交易失败! 原因：'+arg.reason);
			}
		});
	等待名为hzqst的玩家给自己交易3组鹿皮，并给他1000金币:
		cga.waitTrade({
			gold : 1000
		},
		(playerName, receivedStuffs)=>{
			if(receivedStuffs && receivedStuffs.items){
				if( playerName == 'hzqst' && receivedStuffs.items.filter((item)=>{
					return item.name == '鹿皮' && item.count == 40;
				}).length == 3 )
				{
					return true;
				}
			}
			return false;
		},
		(arg)=>{
			if(arg.success){
				console.log('交易成功!');
			} else {
				console.log('交易失败! 原因：'+arg.reason);
			}
		});
	*/
	cga.waitTrade = (stuff, checkParty, resolve, timeout) => {
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true)
		cga.tradeInternal(stuff, checkParty, resolve, timeout);
	}
	
	//主动向名为name的玩家发起交易并同时等待名为name的玩家向自己发起交易，成功或失败时回调resolve
	cga.trade = (name, stuff, checkParty, resolve, timeout) => {
		
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
		
		cga.AsyncWaitPlayerMenu((err, players) => {
			if (!(players instanceof Array)) players = [];
			var player = players.find((e, index) => typeof name == 'number' ? index == name : e.name == name);
			if (player) {
				cga.tradeInternal(stuff, checkParty, resolve, name, timeout);
				cga.PlayerMenuSelect(player.index);
			}
		}, 5000);

		cga.DoRequest(cga.REQUEST_TYPE_TRADE);
	}

	//判断是否是满血满蓝
	cga.needSupplyInitial = (obj)=>{
		var playerinfo = cga.GetPlayerInfo();
		var petinfo = cga.GetPetInfo(playerinfo.petid);
		
		if(!obj)
			obj = {};
		
		if(!obj.playerhp)
			obj.playerhp = 1.0;
		if(!obj.playermp)
			obj.playermp = 1.0;
		if(!obj.pethp)
			obj.pethp = 1.0;
		if(!obj.petmp)
			obj.petmp = 1.0;
		
		if( playerinfo.hp < playerinfo.maxhp * obj.playerhp ||
			playerinfo.mp < playerinfo.maxmp * obj.playermp || 
			petinfo.hp < petinfo.maxhp * obj.playerhp ||
			petinfo.mp < petinfo.maxmp * obj.playermp)
			return true;
		
		return false;
	}

	//判断是否需要找医生治疗
	cga.needDoctor = ()=>{
		var playerinfo = cga.GetPlayerInfo();
		var pets = cga.GetPetsInfo();
		
		if( playerinfo.health > 0)
			return true;

		for(var i = 0;i < pets.length; ++i){
			if(pets[i].health > 0)
				return true;
		}
		
		return false;
	}
	/* 
	* 寻找最适合出战的宠物，先找最高等级，如果出现多个最高等级，则选血量最多的。
	* 如果连等级血量都是一样，选首次检测到的。
	* 不会派出受伤的宠物
	* 不会派出忠诚低于40的宠物
	*/ 
	cga.findbattlepet = ()=>{
		index = -1
		maxhp = 1 
		maxlv = 1
		var pets = cga.GetPetsInfo();

		for(var i = 0;i < pets.length; ++i){
			// 受伤宠物、忠诚低于40宠物不参与出战
			if(pets[i].health !=0 || pets[i].loyality < 40)
				continue
			
			if(pets[i].level == maxlv){
				if(pets[i].maxhp > maxhp){
					index = pets[i].index
					maxhp = pets[i].maxhp
				}else{
					continue
				}
			}else if(pets[i].level > maxlv){
				index = pets[i].index
				maxlv = pets[i].level
			}
		}
		
		return index;
	}

	//等待战斗结束
	cga.waitForBattleEnd = (cb, timeout = 30000)=>{
		
		cga.AsyncWaitBattleAction((err, result) => {
			if(err){
				cb(err);
				return;
			}
			if(result == cga.FL_BATTLE_ACTION_END)
			{
				setTimeout(cb, 1000, null, true);
			}
			else
			{
				cga.waitForBattleEnd(cb, timeout);
			}
		}, timeout);
	}

	cga.gui = {};

	cga.gui.port = null;

	cga.gui.init = ()=>{
		if(!cga.gui.port){
			var p = process.env.CGA_GUI_PORT;

			if(!p || !parseInt(p))
				throw new Error('获取CGA主进程本地服务端口失败!');
			
			cga.gui.port = parseInt(p);
		}
	}

	/*
		获取当前附加的进程的信息
		cga.gui.GetGameProcInfo((err, result)=>{
			console.log(result);
		})
	*/
	cga.gui.GetGameProcInfo = (cb)=>{

		cga.gui.init();

		request.get({
			url : "http://127.0.0.1:"+cga.gui.port+'/cga/GetGameProcInfo', 
			json : true,
		},
		function (error, response, body) {
			if(error)
			{
				cb(error);
				return;
			}
			if(response.statusCode && response.statusCode == 200){
				try{
					cb(null, body);
					return;
				}catch(e){
					cb(e);
					return;
				}
			} else {
				cb(new Error('HTTP 请求失败'));
				return;
			}
		});
	}

	/*
		获取玩家设置、物品设置、自动战斗设置
		cga.gui.GetSettings((err, result)=>{
			console.log(result);
		})
	*/
	cga.gui.GetSettings = (cb)=>{

		cga.gui.init();

		request.get({
			url : "http://127.0.0.1:"+cga.gui.port+'/cga/GetSettings', 
			json : true,
		},
		function (error, response, body) {
			if(error)
			{
				cb(error);
				return;
			}
			if(response.statusCode && response.statusCode == 200){
				try{
					cb(null, body);
					return;
				}catch(e){
					cb(e);
					return;
				}
			} else {
				cb(new Error('HTTP 请求失败'));
				return;
			}
		});
	}

	/*
		加载玩家设置、物品设置、自动战斗设置

		开启自动战斗：
		cga.gui.LoadSettings({
			battle : {
				autobattle : true
			}
		}, (err, result)=>{
			console.log(result);
		})

		参数settings的格式见CGA保存出来的玩家设置json文件，不填的选项代表保持不变
	*/
	cga.gui.LoadSettings = (settings, cb)=>{

		cga.gui.init();

		request.post({
			url : "http://127.0.0.1:"+cga.gui.port+'/cga/LoadSettings', 
			json : true,
			body: settings
		},
		function (error, response, body) {
			if(error)
			{
				cb(error);
				return;
			}
			if(response.statusCode && response.statusCode == 200){
				try{
					cb(null, body);
					return;
				}catch(e){
					cb(e);
					return;
				}
			} else {
				cb(new Error('HTTP 请求失败'));
				return;
			}
		});
	}

	/*
		加载脚本
		cga.gui.LoadScript({
			path : "路径",
			autorestart : true, //自动重启脚本开启
			autoterm : true, //自动关闭脚本开启
			injuryprot : true, //受伤保护开启
			soulprot : true, //掉魂受伤保护开启
		}, (err, result)=>{
			console.log(result);
		})
	*/
	cga.gui.LoadScript = (arg, cb)=>{

		cga.gui.init();

		request.post({
			url : "http://127.0.0.1:"+cga.gui.port+'/cga/LoadScript', 
			json : true,
			body: arg
		},
		function (error, response, body) {
			if(error)
			{
				cb(error);
				return;
			}
			if(response.statusCode && response.statusCode == 200){
				try{
					cb(null, body);
					return;
				}catch(e){
					cb(e);
					return;
				}
			} else {
				cb(new Error('HTTP 请求失败'));
				return;
			}
		});
	}

	/*
		加载自动登录设置
		cga.gui.LoadAccount({
			user : "通行证",
			pwd : "密码",
			gid : "子账号",
			game : 4, //区服
			bigserver : 1, //电信or网通
			server : 8, //线路
			character : 1, //左边or右边
			autologin : true, //自动登录开启
			skipupdate : false, //禁用登录器更新开启
		}, (err, result)=>{
			console.log(result);
		})


		调整自动登录到10线
		cga.gui.LoadAccount({
			server : 10,
		}, (err, result)=>{
			console.log(result);
		})
	*/
	cga.gui.LoadAccount = (arg, cb)=>{

		cga.gui.init();

		request.post({
			url : "http://127.0.0.1:"+cga.gui.port+'/cga/LoadAccount', 
			json : true,
			body: arg
		},
		function (error, response, body) {
			if(error)
			{
				cb(error);
				return;
			}
			if(response.statusCode && response.statusCode == 200){
				try{
					cb(null, body);
					return;
				}catch(e){
					cb(e);
					return;
				}
			} else {
				cb(new Error('HTTP 请求失败'));
				return;
			}
		});
	}

	cga.getrootdir = ()=>{

		var temppath = __dirname
		var count = 0
		while(count<10){
			if(fs.readdirSync(temppath).indexOf("cgaapi.js")!=-1){
				// console.log("根目录已找到："+ temppath)
				break
			}else{
				temppath = path.join(temppath,'../')
			}
			count+=1
		}
		return temppath
	}

	/**
	 * UNAecho:搜索指定称号，返回索引
	 * 提示：索引的顺序和游戏中称号栏的顺序并不一致，以cga.GetPlayerInfo().titles为准
	 */
	cga.findTitle = (title) => {
		var titles = cga.GetPlayerInfo().titles;
		for (var i = 0 ; i < titles.length ; i++){
			if(titles[i] == title){
				return i
			}
		}
		return -1
	}

	cga.ismaxbattletitle = ()=>{

		var playerinfo = cga.GetPlayerInfo();
		var titles = playerinfo.titles
	
		for(var i in titles){
			if(titles[i] == "无尽星空"){
				return true
			}
		}
		return false
	}

	/**
	 * UNAecho : 获取时间范围，并精确到服务器时间的分钟级别
	 * 【注意】游戏中的cga.GetSysTime()时间，虽然；hours是24小时制，秒是60秒制，但mins却不是60分钟制
	 * 游戏内的1秒比现实的1秒要长一些，但1分钟和1小时比现实短了不少，推测时分秒并不是完全相关的，各自有各自的增长时间
	 * 根据大量实验记录总结，昼夜交界线平均期望值为：
	 * 白天转黄昏，hours : 16 , mins : 105
	 * hours : 16 , mins : 104.2时为白天，hours : 16 , mins : 104.8开始为黄昏，四舍五入到105
	 * 夜晚转黎明，hours : 4 , mins : 9
	 * hours : 4 , mins : 8.25时为夜晚，hours : 4 , mins : 8.5开始为黎明，四舍五入到9
	 * 
	 * 可使用【交通脚本】中的【测试游戏时间交界.js】自行测试时间，会自动将数据落盘为【游戏内时间切换记录.json】
	 * 计算结论的方式也在脚本之中，默认不调用
	 * @returns 
	 */
    cga.getTimeRange = ()=>{
        var stages = ['黎明','白天','黄昏','夜晚'];
        var sysTime = cga.GetSysTime();
        if(!sysTime){
            return stages[1];
        }
        // console.log('当前游戏内时间:'+sysTime.hours+':'+sysTime.mins+':'+sysTime.secs);
        if(sysTime.hours < 4){
            return stages[3];
        }else if(sysTime.hours == 4){
			if(sysTime.mins < 9){
				return stages[3];
			}
			return stages[0]
        }else if(sysTime.hours <= 6){
            return stages[0];
        }else if(sysTime.hours < 16){
            return stages[1];
        }else if(sysTime.hours == 16){
			if(sysTime.mins < 105){
				return stages[1]
			}
            return stages[2];
        }else if(sysTime.hours <= 18){
            return stages[2];
        }else{
            return stages[3];
        }
    }

	// UNAecho:添加关于职业信息的API
	cga.job = {}

	// 获取本地职业数据。
	cga.job.loadJobData = () => {
		const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
		return getprofessionalInfos
	}

	// 获取本地职业声望数据。
	cga.job.loadReputationData = () => {
		const reputationInfos = require('./常用数据/reputation.js');
		return reputationInfos
	}
	/**
	 * UNAecho:获取职业数据，如果输入职业名称，获取对应职业数据。如果不输入，则获取当前职业数据。
	 * 可输入任意职业称号来代表对应职业。如【见习弓箭手】【王宫弓箭手】都是一个效果。
	 * @param {*} input 
	 * @returns 
	 */
	cga.job.getJob = (input) =>{
		var jobObj = null
		var data = cga.job.loadJobData().Professions
		var playerInfo = cga.GetPlayerInfo()
		var searchJobName = null

		if(!input || typeof input != 'string'){
			searchJobName = playerInfo.job
		}else{
			searchJobName = input
		}

		for (var i in data){
			for(var j in data[i].titles){
				if(searchJobName == data[i].titles[j]){
					jobObj = data[i]
					jobObj.job = data[i].jobmainname
					if(['物理系', '魔法系', '魔物系'].indexOf(data[i].category)!=-1){
						jobObj.jobType = '战斗系'
					}else{
						jobObj.jobType = '生产系'
					}
					jobObj.jobLv = j
					jobObj.curJob = playerInfo.job
					break
				}
			}
		}
		if(!jobObj){
			throw new Error('错误，职业数据库中暂无【' + searchJobName + '】职业信息，请添加')
		}

		var reputationData = cga.job.loadReputationData()
		var category = jobObj.category
		var titles = playerInfo.titles
		if(jobObj.jobType == '战斗系'){
			reputationData = reputationData.reputationList
			for (let i = 0; i < 15; i++) {
				for(var t in titles){
					if(titles[t].length == 0){
						continue
					}
					if(titles[t] == reputationData[i].reputation){
						jobObj.reputation = titles[t]
						jobObj.reputationLv = i
						break
					}
				}
			}
		}else{
			reputationData = reputationData.productReputationList
			for (let i = 0; i < 15; i++) {
				for(var t in titles){
					if(titles[t].length == 0){
						continue
					}
					if(titles[t] == reputationData[i].reputation){
						jobObj.reputation = titles[t]
						jobObj.reputationLv = i
						break
					}
				}
			}
		}

		return jobObj
	}

	// UNAecho:添加关于技能信息的API
	cga.skill = {}

	// 获取本地职业数据。
	cga.skill.loadSkillData = () => {
		const skills = require('./常用数据/skills.js').skillInfos;
		return skills
	}

	/**
	 * UNAecho:获取指定技能的静态信息
	 * @param {*} input 技能全称
	 * @returns 
	 */
	cga.skill.getSkill = (input) =>{
		var data = cga.skill.loadSkillData()

		if(!input || typeof input != 'string'){
			throw new Error('错误，必须输入String类型的技能名称。input:', input)
		}

		var skillObj = data.find((s) => {
			if(s.name == input){
				return true
			}
			return false
		});

		if(!skillObj){
			throw new Error('错误，技能数据库中暂无【' + input + '】职业信息，请添加')
		}


		return skillObj
	}

	cga.skill.ableToLearn = (skName) => {
		let result = 'able to learn'
		let skillObj = cga.skill.getSkill(skName)
		// 计算栏位是否足够
		let slotRemain = cga.skill.getSlotRemain()
		if (slotRemain < skillObj.fieldCost) {
			result = 'lack of slot'
		}

		// 常用的可传送村镇
		const teleVillages = ['圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇', '阿巴尼斯村', '蒂娜村']

		// 计算技能所需金币
		let gold = cga.GetPlayerInfo().gold
		let costSum = skillObj.cost
		if (teleVillages.indexOf(skillObj.teacherMainMap) != -1) {
			costSum += cga.travel.teleCost[skillObj.teacherMainMap]
		}
		if (gold < costSum) {
			console.log('学习技能:【' + skillObj.name + '】，需要:【' + costSum + '】(可能包含传送费)，你的钱:【' + gold + '】不够')
			result = 'lack of gold'
		}

		return result
	}

	/**
	 * UNAecho:通用学技能API
	 * 除了制造系，粗略统计了一下技能导师所在的主地图数量分布:
	 * {
		'法兰城': 44,
		'艾尔莎岛': 8,
		'伊尔村': 2,
		'乌克兰村': 1,
		'其他': 27,
		'？？？': 1,
		'圣拉鲁卡村': 4,
		'奇利村': 2,
		'亚留特村': 3,
		'曙光骑士团营地': 3,
		'加纳村': 5,
		'返回仙人的家的途中': 1,
		'汉克的房间': 1,
		'哥拉尔': 1
		}
	 * @param {*} skName 要学习的技能全称
	 * @param {*} cb 
	 */
	cga.skill.learn = (skName, cb) => {
		let skillObj = cga.skill.getSkill(skName)
		let reason = cga.skill.ableToLearn(skName)
		if (reason.indexOf('lack') != -1) {
			cb(reason)
			return
		}

		let go = (cb2) => {
			cga.travel.autopilot(skillObj.teacherMap, () => {
				learn(cb2)
			})
			return
		}

		let learn = (cb3) => {
			let obj = { act: 'skill', target: skillObj.name }
			cga.askNpcForObj(skillObj.teacherMap, skillObj.teacherPos, obj, cb3)
			return
		}

		// 常用的可传送村镇
		const teleVillages = ['圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇', '阿巴尼斯村', '蒂娜村']
		// 赶路所需
		cga.loadBattleConfig('生产赶路')

		// 主逻辑开始
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		// 如果已经在技能导师房间，则无需回补直接学习
		if (map == skillObj.teacherMap || mapindex == skillObj.teacherMap) {
			learn(cb)
			return
		}
		// 如果需要走路至导师房间，则需要补状态再出发
		if (cga.needSupplyInitial({})) {
			cga.travel.toHospital(() => {
				setTimeout(cga.skill.learn, 3000, skName, cb);
			})
			return
		}
		if (skillObj.teacherMainMap == '法兰城') {
			cga.travel.falan.toStone('C', () => {
				if (skillObj.teacherMap == 15009 || skillObj.teacherMap == 15010) {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88, '芙蕾雅'],
					], () => {
						cga.askNpcForObj('芙蕾雅', [201, 165], { act: 'map', target: 15000 }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
							], () => {
								cga.askNpcForObj('莎莲娜海底洞窟 地下2楼', [31, 22], { act: 'map', target: 15006, say: '咒术' }, () => {
									cga.walkList([
										[38, 37, '咒术师的秘密住处'],
										[10, 0, 15008],
										skillObj.teacherMap == 15010 ? [1, 10, 15010] : [19, 10, 15009],
									], () => {
										learn(cb)
									});
								})
							});
						})
					})
				} else {
					go(cb)
				}
			});
		} else if (teleVillages.indexOf(skillObj.teacherMainMap) != -1) {
			cga.travel.toVillage(skillObj.teacherMainMap, () => {
				go(cb)
			})
		} else {
			throw new Error('未知领域，请回到常用主城市再调用此API')
		}
	}

	/**
	 * UNAecho:获取人物技能当前的总栏位数，多数用于估量能否学习新技能。
	 * @returns 
	 */
	cga.skill.getSlotSum =()=>{
		let sum = 0
		let skills = cga.GetSkillsInfo();
		skills.forEach(s=>{
			sum += s.slotsize
		})
		return sum
	}

	/**
	 * UNAecho:获取人物技能当前剩余栏位数
	 * @returns 
	 */
	cga.skill.getSlotRemain = () => {
		return cga.GetPlayerInfo().skillslots - cga.skill.getSlotSum()
	}

	/**
	 * UNAecho:定义一个职责对象，方便全局管理一些玩家自定义职责
	 */
	cga.role = {}

	/**
	 * UNAecho:
	 * 玩家自定义的【战斗】职责，用于在智能练级战斗、任务战斗上划定分工。在这里定义，方便全局数据统一
	 * 输出：具备清怪或者打BOSS能力
	 * 治疗：顾名思义，具备回复能力
	 * 小号：被其它职业拖着走的拖油瓶，对战斗没有贡献
	 */
	cga.role.battleRoleArr = ['输出', '治疗', '小号']
	/**
	 * UNAecho:
	 * 玩家自定义的任务职责，用于在任务上划定是无限陪打任务，还是正常做任务。在这里定义，方便全局数据统一
	 * 一次性：正常一次性过任务
	 * 无限循环：已经完成过一次任务，开始无限重做任务
	 */
	cga.role.taskRoleArr = ['一次性', '无限循环']

	/**
	 * UNAecho:定义一个战斗对象，方便开发使用
	 */
	cga.battle = {}

	// 等待BOSS战结束，一般以房间号变动为基准
	cga.battle.waitBossBattle = (roomIndex , cb) => {
		if (cga.isInBattle()) {
			cga.waitForLocation({ mapindex: roomIndex }, () => {
				// 虽然战斗胜利一瞬间index就切换到战斗胜利房间，但有时候战斗动画和切屏并未结束
				// 所以要等到cga.isInNormalState()为true才能退出此API
				let waitNormal = ()=>{
					if (cga.isInNormalState()) {
						cb(true)
						return;
					}
					setTimeout(waitNormal, 1500);
				}
				waitNormal()
			});
			return;
		}
		
		setTimeout(cga.battle.waitBossBattle, 1500, roomIndex , cb);
		return
	}

	return cga;
}