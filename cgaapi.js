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

				config.settledCity = cga.GetMapName();

				cga.savePlayerConfig(config, cb);
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
		}else if(mapindex >= 1000 && mapindex <= 32830){
			result = '法兰城'
		}else if(mapindex == 33000){
			result = '米内葛尔岛'
		}else if(mapindex >= 33100 && mapindex < 33300){
			result = '阿凯鲁法村'
		}else if(mapindex >= 30000 && mapindex < 40000){
			result = '苏国'
		}else if(mapindex == 43000){
			result = '库鲁克斯岛'
		}else if(mapindex >= 43100 && mapindex < 43300){
			result = '哥拉尔镇'
		}else if(mapindex >= 40000 && mapindex < 50000){
			result = '艾尔巴尼亚王国'
		}else if(mapindex == 300 && XY.x < 379){// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚奇利域'
		}else if(mapindex == 300 && XY.x >= 379){// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚加纳域'
		}else if(mapindex == 59520 || (mapindex >= 59530 && mapindex <= 59537)){
			result = '艾尔莎岛'
		}else if(mapindex >= 59521 || mapindex < 60000){
			result = '艾夏岛'
		}else if(mapindex >= 50000 && mapindex < 60000){
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
			if(mapXY.x <=480 && mapXY.x >=463 && mapXY.y <= 206 && mapXY.y >=195)
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
		cga.travel.falan.toStone('C', ()=>{
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
			
			var list = [
			[41, 50, '里谢里雅堡 1楼'],
			[45, 20, '启程之间']
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
		});
	}
	
	//从启程之间传送到指定村落
	//UNAecho:修改逻辑，在对应传送石房间直接跳过本API，而不是登出重新再执行传送一遍。
	cga.travel.falan.toTeleRoom = (villageName, cb)=>{
		var mapindex = cga.GetMapIndex().index3;
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
					1101:'科特利亚酒吧',
					1170:'安其摩酒吧',
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
				// 流行商店
				1162:[[117, 112, 1162],],
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
				1504:[[153, 100, 1500],[41, 50, 1520],[74, 19, 1521],[0, 71, 1504],],
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
				// 饲养师之家
				1810:[[122, 36, 1810],],
				// 客房
				32830:[[219, 136, 1101],[27, 20, 1102],[10, 17, 32830],],
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
				// 流行商店
				1162:[[0, 9, 1000],],
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
				// 饲养师之家
				1810:[[10, 17, 1000],],
				// 客房
				32830:[[2, 7, 1102]],
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
				'曙光营地医院 2楼':27012,
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
				// 曙光营地医院 2楼
				27012:[[42, 56, 27012],[15, 12, 27012],],
			},
			walkReverse:{
				// 曙光储备室
				27011:[[12, 22, 27001],],
				// 曙光营地医院
				27012:[[1, 8, 27001],],
				// 曙光营地医院 2楼
				27012:[[97, 12, 27012],],
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
			},
			walkForward:{// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				59521:[],
				// 银行
				59548:[[114, 104, 59548],],
			},
			walkReverse:{
				// 银行
				59548:[[27, 34, 59521],],
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

		var targetindex = null
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

		if(!targetindex || !info.walkForward[targetindex]){
			throw new Error('[UNA脚本警告]:targetMap:[' + targetMap +']输入有误，请确认地图中是否有输入的名称地点。')
		}
		
		try {
			// 目标路径信息
			var targetPath = info.walkForward[targetindex]
			// 自动导航路径
			var tmplist = null
			// 主逻辑分歧点
			if(mapindex == targetindex){
				if (cb) cb(null)
				return
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
			console.log('[UNA脚本警告]:可能由于【输入不存在的地图index/名称】【地图未读取完毕】，导致错误，error:')
			console.error(error)
		}
		return
	}
	// UNA:添加全域自动导航至医院补给。isPro为true是去资深护士处补给，否则是普通护士补给
	cga.travel.toHospital = (isPro,cb)=>{
		// 不需要补血则跳过
		if(!cga.needSupplyInitial({  })){
			if (cb) cb(null)
			return
		}
		
		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 获取当前主地图名称
		var villageName = cga.travel.switchMainMap()
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
				cga.travel.toHospital(isPro,cb)
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
		// 如果已经开启过传送，则直接补给并结束函数
		if(config[villageName]){
			console.log('你已开启过【'+villageName+'】传送石，跳过开启传送阶段。')
			cga.travel.toHospital(isPro,()=>{
				if (cb) cb(null)
				return
			})
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
									cga.travel.toHospital(isPro,()=>{
										if (cb) cb(null)
										return
									})
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
	 * UNAecho:添加全域自动导航至银行，与柜员对话。
	 * @param {*} cb 打开银行界面后的回调函数，需要自定义传入
	 * @returns 
	 */
	cga.travel.toBank = (cb)=>{
		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 获取当前主地图名称
		var villageName = cga.travel.switchMainMap()

		if (cga.GetMapName().indexOf('银行') == -1){
			var goToBank = ()=>{
				cga.travel.autopilot('银行',()=>{
					cga.travel.toBank(cb)
				})
				return
			}
			try {
				goToBank()
			} catch (error) {
				console.log('错误，当前地图没有银行，登出后重试')
				cga.logBack(goToBank)
			}
			return
		}
		var tmplist = []
		var tmpTurnDir = null

		if(villageName == '法兰城'){
			tmplist.push([11, 8])
			tmpTurnDir = 0
		}else if(villageName == '艾尔莎岛' || villageName == '艾夏岛'){
			tmplist.push([49, 25])
			tmpTurnDir = 0
		}else if(villageName == '哥拉尔镇'){
			tmplist.push([25, 10])
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
				setTimeout(() => {
					if (cb) cb(null)
				}, 1500);
				return
			}
		);
		return
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
							
							console.log('战斗回滚');
							console.log('当前地图 ：' + curmap);
							console.log('当前地图序号 ：' + curmapindex);
							console.log('当前坐标：' + curpos.x + ', ' + curpos.y);
							
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
			
	//查找玩家技能，返回技能index，找不到返回-1
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
			if(item.name == '魔石' || item.name == '卡片？' || pattern.exec(item.name) ){
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
				if(cb) cb(null);
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
		}
		else if(['物理系', '魔法系', '魔物系',].indexOf(category) != -1){
			category = '战斗系'
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
		// 然后检查称号
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
					console.log(bankitem.name+' 成功存到银行第 ' + (bankitem.pos - 100 + 1) + ' 格!');
					cb(null);
				}
				else
				{
					cb(new Error('保存到银行失败，可能银行格子已满、未与柜员对话或网络问题'));
				}
			}, 1000);
		});
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
				console.log(bankpet.name+' 成功存到银行第 ' + (bankpet.index - 100 + 1) + ' 格!');
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
				var curindex3 = cga.GetMapIndex().index3;
				if(curindex3 == index3)
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
					teaminfo[i].injury = units[j].injury;
					teaminfo[i].level = units[j].level;
					break;
				}
			}
			if(playerinfo.unitid == teaminfo[i].unit_id){
				teaminfo[i].name = playerinfo.name;
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
	
	//等待名字在teammates列表中的的玩家组队，并自动踢出不符合teammates列表的陌生人。
	cga.waitTeammates = (teammates, cb)=>{
				
		var teamplayers = cga.getTeamPlayers();
		
		if(teammates.length == 0 && teamplayers.length == 0)
		{
			setTimeout(cb, 2000, true);
			return;
		}
		
		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		
		if(teamplayers.length == teammates.length){
			for(var i = 0; i < teamplayers.length; ++i){
				if(!is_array_contain(teammates, teamplayers[i].name)){
					//Unknown teammates, kick
					cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						var stripper = "你要把谁踢出队伍？";
						if(dlg && dlg.message && dlg.message.indexOf(stripper) >= 0){
							var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
							strip = strip.replace(/\\z/g,"|");
							strip = strip.replace(/\\n/g,"|");
							console.log(strip);
							var reg = new RegExp(/([^|\n]+)/g)
							var match = strip.match(reg);
							//console.log(match);
							for(var j = 0; j < match.length; ++j){
								if(match[j] == teamplayers[i].name){
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
	
	//监听系统消息
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
	
	/*走一层迷宫
		target_map :  走到目标地图就停止，填null则自动解析地图名中的楼层，填''则允许任何形式的地图作为目标楼层。
		filter (可选) : {
			layerNameFilter : 自定义解析地图名的方法
			entryTileFilter : 自定义解析楼梯的方法
		}
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
				}) == true ){
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

				if(target == null && obj.cell == 3){
					target = obj;
					return false;
				}
			});
		}
		
		if(target == null){
			cb(new Error('无法找到迷宫的出口'));
			return;
		}

		console.log('迷宫出口：('+target.mapx+', '+target.mapy+')');

		var pos = cga.GetMapXY();

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
				console.log('开始走随机迷宫...');
				console.log('起始坐标：('+cga.walkMazeStartPosition.x+', '+cga.walkMazeStartPosition.y+')');
			}
			else
			{
				console.log('继续走随机迷宫...');
				console.log('起始坐标：('+cga.walkMazeStartPosition.x+', '+cga.walkMazeStartPosition.y+')');
			}
			cga.walkMaze(target_map, (err, reason)=>{
				if(err && err.message == '无法找到迷宫的出口'){					
					cga.searchMap(()=>{
						return cga.getMapObjects().find((obj)=>{
							
							console.log('cga.walkMazeStartPosition');
							console.log(cga.walkMazeStartPosition);
							
							if(cga.walkMazeStartPosition != null && obj.mapx == cga.walkMazeStartPosition.x && obj.mapy == cga.walkMazeStartPosition.y)
								return false;
							
							if(obj.cell == 3){
								console.log(obj);
							}

							return obj.cell == 3 ? true : false;
						}) != undefined ? true : false;
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
	
	cga.getRandomMazeEntrance = (args, cb, index = 0)=>{

		if(index == undefined)
			index = 0;

		if(args.table[index] == undefined)
		{
			throw new Error('所有区域都已搜索完毕，没有找到迷宫入口！');
		}

		console.log('前往区域'+(index+1)+'搜索迷宫入口！');
	
		cga.walkList([
			args.table[index]
		], ()=>{
			console.log('正在区域'+(index+1)+'搜索迷宫入口...');
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

	/**
	 * targetFinder返回unit object 或者 true都将停止搜索
	 * cga.searchMap(units => units.find(u => u.unit_name == '守墓员' && u.type == 1) || cga.GetMapName() == '？？？', result => {
	 * 	console.log(result);
	 * });
	 */
	 //, recursion = true
	cga.searchMap = (targetFinder, cb) => {
		const getMovablePoints = (map, start) => {
			const foundedPoints = {};
			foundedPoints[start.x + '-' + start.y] = start;
			const findByNextPoints = (centre) => {
				const nextPoints = [];
				const push = (p) => {
					if (p.x > map.x_bottom && p.x < map.x_size && p.y > map.y_bottom && p.y < map.y_size) {
						if (map.matrix[p.y][p.x] === 0) {
							const key = p.x + '-' + p.y;
							if (!foundedPoints[key]) {
								foundedPoints[key] = p;
								nextPoints.push(p);
							}
						}
					}
				};
				push({x: centre.x + 1, y: centre.y});
				push({x: centre.x + 1, y: centre.y + 1});
				push({x: centre.x, y: centre.y + 1});
				push({x: centre.x - 1, y: centre.y + 1});
				push({x: centre.x - 1, y: centre.y});
				push({x: centre.x - 1, y: centre.y - 1});
				push({x: centre.x, y: centre.y - 1});
				push({x: centre.x + 1, y: centre.y - 1});
				nextPoints.forEach(findByNextPoints);
			};
			findByNextPoints(start);
			return foundedPoints;
		};
		const getFarthestEntry = (current) => {
			return cga.getMapObjects().filter(e => [3,10].indexOf(e.cell) >= 0 && (e.mapx != current.x || e.mapy != current.y)).sort((a, b) => {
				const distanceA = Math.abs(a.mapx - current.x) + Math.abs(a.mapy - current.y);
				const distanceB = Math.abs(b.mapx - current.x) + Math.abs(b.mapy - current.y);
				return distanceB - distanceA;
			}).shift();
		};
		const getTarget = (noTargetCB) => {
			const target = targetFinder(cga.GetMapUnits());
			if (typeof target == 'object') {
				console.log('成功找到有效目标2');
				const walkTo = cga.getRandomSpace(target.xpos, target.ypos);
				if (walkTo) {
					cga.walkList([walkTo], () => cb(null, target));
				} else {
					noTargetCB();
				}
			} else if (target === true){
				console.log('成功找到有效目标1');
				cb(null);
			} else{
				console.log('未找到有效目标');
				noTargetCB();
			}
		};
		const toNextPoint = (points, current, toNextCB) => {
			const remain = points.filter(p => {
				const xd = Math.abs(p.x - current.x);
				const yd = Math.abs(p.y - current.y);
				p.d = xd + yd;
				return !(xd < 12 && yd < 12);
			}).sort((a,b) => a.d - b.d);
			const next = remain.shift();
			if (next)
			{
				if(cga.isPathAvailable(current.x, current.y, next.x, next.y))
				{
					cga.walkList([[next.x,next.y]], () => getTarget(() => toNextPoint(remain, next, toNextCB)));
				}
				else
				{
					getTarget(() => toNextPoint(remain, next, toNextCB))
				}
			}
			else 
			{
				toNextCB();
			}
		};
		//const start = cga.GetMapXY();
		//let entry = null;
		const findNext = (walls) => {
			const current = cga.GetMapXY();
			//if (!entry && recursion) entry = getFarthestEntry(start);
			toNextPoint(Object.values(getMovablePoints(walls, current)), current, () => {
				cb(new Error('无法找到符合条件的对象'));
			});
		};
		getTarget(() => {
			let walls = cga.buildMapCollisionMatrix();
			/*if(walls.matrix[0][0] == 1
				|| walls.matrix[walls.y_size-1][0] == 1
				|| walls.matrix[walls.y_size-1][walls.x_size-1] == 1
				|| walls.matrix[0][walls.x_size-1] == 1
			) {
				cga.downloadMap(() => findNext(cga.buildMapCollisionMatrix()));
			} else findNext(walls);*/
			findNext(walls);
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

    cga.getTimeRange = ()=>{
        var stages = ['黎明','白天','黄昏','夜晚'];
        var sysTime = cga.GetSysTime();
        if(!sysTime){
            return stages[1];
        }
        // console.log('当前游戏内时间:'+sysTime.hours+':'+sysTime.mins+':'+sysTime.secs);
        if(sysTime.hours < 4){
            return stages[3];
        }else if(sysTime.hours <= 6){
            return stages[0];
        }else if(sysTime.hours < 16){
            return stages[1];
        }else if(sysTime.hours <= 18){
            return stages[2];
        }else{
            return stages[3];
        }
    }

	return cga;
}