var cga = require('bindings')('node_cga');
var moment = require('moment');
var PF = require('pathfinding');
var request = require('request');
var fs = require('fs');

global.is_array_contain = function (arr, val) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == val) {
			return true;
		}
	}

	return false;
}

/**
 * UNAecho: 定义链表数据结构以及增删改查方法
 */
class Node {
	constructor(value) {
		this.value = value;
		this.next = null;
	}
}
class LinkedList {
	constructor() {
		this.head = null;
		this.length = 0;
	}
}
LinkedList.prototype.add = function (value) {
	const newNode = new Node(value);

	if (!this.head) {
		// 如果当前链表为空，则将新节点设置为头结点
		this.head = newNode;
	} else {
		let current = this.head;

		// 找到最后一个节点
		while (current.next) {
			current = current.next;
		}

		// 将新节点链接到链表末尾
		current.next = newNode;
	}

	this.length++;
}
LinkedList.prototype.find = function (value) {
	let current = this.head;

	while (current) {
		if (current.value === value) {
			return current;
		}

		current = current.next;
	}

	return null;
}
LinkedList.prototype.remove = function (value) {
	if (!this.head) {
		return;
	}

	if (this.head.value === value) {
		// 如果是头结点，则将头结点指向下一个节点
		this.head = this.head.next;
		this.length--;
		return;
	}

	let current = this.head;

	while (current.next) {
		if (current.next.value === value) {
			// 将当前节点的next属性指向下一个节点的next属性，实现删除操作
			current.next = current.next.next;
			this.length--;
			return;
		}

		current = current.next;
	}
}

module.exports = function (callback) {
	var port = null;

	if (process.argv.length >= 3 && parseInt(process.argv[2]) > 0)
		port = parseInt(process.argv[2]);
	else if (process.env.CGA_GAME_PORT && parseInt(process.env.CGA_GAME_PORT) > 0)
		port = parseInt(process.env.CGA_GAME_PORT);

	if (typeof port != 'number')
		throw new Error('获取游戏本地服务端口失败!');

	cga.AsyncConnect(port, function (err) {
		if (err) {
			throw new Error('无法连接到本地服务端口，可能未附加到游戏或者游戏已经闪退！');
		}

		callback();
	});

	cga.TRADE_STUFFS_ITEM = 1;
	cga.TRADE_STUFFS_PET = 2;
	cga.TRADE_STUFFS_PETSKILL = 3;
	cga.TRADE_STUFFS_GOLD = 4;

	cga.TRADE_STUFFS_TRANSLATION = {
		1: '物品',
		2: '宠物',
		3: '宠物技能',
		4: '金币',
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
	cga.ENABLE_FLAG_SHOWPETS = 6;
	cga.ENABLE_FLAG_AVATAR_PUBLIC = 100;
	cga.ENABLE_FLAG_BATTLE_POSITION = 101;

	cga.TRADE_STATE_CANCEL = 0;
	cga.TRADE_STATE_READY = 1;
	cga.TRADE_STATE_CONFIRM = 2;
	cga.TRADE_STATE_SUCCEED = 3;

	cga.TRADE_STATE_TRANSLATION = {
		0: '取消交易',
		1: '准备交易',
		2: '确认交易',
		3: '交易成功',
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
	cga.MOVE_GOLD_FROMBANK = 2;
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

	/**
	 * UNAecho:获取区间随机毫秒数。
	 * @param {Number} arg1 秒级别的数字类型，可以为浮点数
	 * @param {Number} arg2 秒级别的数字类型，可以为浮点数
	 * 【注意】为了便于开发，输入是秒级别的数字，而返回是毫秒数
	 * @returns Number，毫秒数
	 */
	cga.randomDelay = (arg1, arg2) => {
		if (arg1 > arg2) {
			[arg1, arg2] = [arg2, arg1]
		}
		arg1 = arg1 * 1000
		arg2 = arg2 * 1000
		return Math.floor(Math.random() * (arg2 - arg1 + 1) + arg1)
	}

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

	/**
	 * UNAecho开发笔记：
	 * 如果想在cga.walklist中使用cga.moveThink() return false来打断人物行走，需要注意的是：
	 * 1、人物仅有在非直线行走时(x或y一直不变)，才会有对cga.moveThink()返回值的判断
	 * 2、如果人物一直处于直线行走(x或y一直不变)时，cga.moveThink() return false不会打断walklist。
	 * 3、因为1的原因，导致cga.moveThink()其实根本没有被调用。
	 * 4、不知道是不是底层C++代码实现走路的API实现的问题，还是cga.walklist()实现的问题，总之目前的情况是这样。
	 * 5、我在cga.walklist()中的if(reason == 2 || reason == 5)逻辑的waitBattle()中添加了cga.moveThink('walkList') == false则打断cga.walklist()逻辑
	 * 方便脚本在战斗中躲避指定敌人。
	 * 原cga.walklist()逻辑，在等待战斗中如果登出，cga.walklist()不会结束，导致登出之后立即出现cga.walklist()已在运行中的问题。
	 * 
	 * 现在可以令cga.moveThink() return false来在战斗中打断cga.walklist()了。
	 * 
	 * @param {*} arg 
	 * @returns 
	 */
	cga.moveThink = (arg) => {
		for (var i = 0; i < cga.moveThinkFnArray.length; ++i) {
			if (cga.moveThinkFnArray[i](arg) == false) {
				return false;
			}
		}
		return true;
	}

	cga.isMoveThinking = false;

	cga.registerMoveThink = (fn) => {
		cga.moveThinkFnArray.push(fn);
	}

	cga.isTeamLeaderEx = () => {
		return (cga.isTeamLeader == true || cga.getTeamPlayers().length <= 1);
	}

	cga.getMapInfo = () => {
		const info = cga.GetMapXY();
		info.indexes = cga.GetMapIndex();
		info.name = cga.GetMapName();
		info.index3 = info.indexes.index3;// index3最常用，加入方便调用
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

	cga.getOrientationPosition = (orientation, offset) => {
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
	cga.getStaticOrientationPosition = (staticPos, orientation, offset) => {
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
	cga.tradeDir = (dir) => {
		if (!(dir >= 0 && dir < 8)) {
			throw new Error('错误，dir朝向必须为0 - 7')
		}
		return dir < 4 ? dir + 4 : dir - 4
	}

	/*  异步登出回城
		由于2022年1月18日的一次更新之后登出回城有可能失败，故所有脚本中的登出回城操作均推荐更改为异步操作
		UNAecho : 修改写入逻辑，如果登出后的记录点与个人配置记录中一致，则跳过写入，节约I/O
	*/
	cga.logBack = (cb) => {
		cga.waitSysMsgTimeout((err, msg) => {
			if (err) {
				console.log('异步登出无反应，可能网络不稳定或者已经掉线！');
				if (cb) cb(null);
				return
			}

			if (msg.indexOf('传送点') != -1) {
				//保存登出回城的地点到配置文件
				var config = cga.loadPlayerConfig();

				if (!config)
					config = {};
				// 如果记录点没有变化，则不写入文件
				let settledCity = cga.GetMapName()
				if (config.settledCity == settledCity) {
					console.log('记录点【' + config.settledCity + '】没有变化')
					setTimeout(cb, 300);
				} else {
					config.settledCity = settledCity;
					cga.savePlayerConfig(config, cb);
				}

				return false;
			}

			var regex = msg.match(/一分钟内'回到城内登入点'最多使用5次，请过(\d+)秒钟后再用！/);

			if (regex && regex.length >= 2) {

				console.log('一分钟登出次数已达上限！等待 ' + parseInt(regex[1]) + ' 秒后重试...');

				var wait = parseInt(regex[1]) * 1000;
				setTimeout(cga.logBack, wait + 1000, cb);
				return false;
			}

			return true;
		}, 5000);
		// UNAecho:登出过快会导致cga.waitSysMsgTimeout还没运行，登出动作已经结束了。这里加个延迟。
		// 注意cga.LogBack和cga.logBack是不同的，区分大小写。cga.logBack是本API，cga.LogBack是另一个非异步API
		setTimeout(cga.LogBack, 500);
	}

	//转向(x,y)坐标，默认往前一格避免捡起面前的物品
	cga.turnTo = (x, y) => {
		cga.turnOrientation(cga.getOrientation(x, y));
	}

	//判断是否在战斗状态
	cga.isInBattle = function () {
		return (cga.GetWorldStatus() == 10) ? true : false;
	}

	//判断是否在正常状态（非切图非战斗状态）
	cga.isInNormalState = function () {
		return (cga.GetWorldStatus() == 9 && cga.GetGameStatus() == 3) ? true : false;
	}

	//将字符串转义为windows下合法的文件名
	cga.FileNameEscape = (str) => {
		return str.replace(/[\\/:\*\?"<>|]/g, (c) => { return { "\\": '%5C', '/': '%2F', ':': '%3A', '*': '%2A', '?': '%3F', '"': '%22', '<': '%3C', '>': '%3E', '|': '%7C' }[c]; });
	}

	//FileNameEscape的反向操作，反转义
	cga.FileNameUnescape = (str) => {
		return str.replace(/%(5C|2F|3A|2A|3F|22|3C|3E|7C)/g, (c) => { return { '%5C': '\\', '%2F': '/', '%3A': ':', '%2A': '*', '%3F': '?', '%22': '"', '%3C': '<', '%3E': '>', '%7C': '|' }[c]; });
	}

	//获取制造某种物品所需要的材料信息，返回材料信息object或null
	cga.getItemCraftInfo = function (filter) {
		var result = null;
		cga.GetSkillsInfo().forEach((sk) => {
			if (sk.type == 1) {
				var craftInfo = cga.GetCraftsInfo(sk.index).find((craft) => {

					if (typeof filter == 'string') {
						if (filter.charAt(0) == '#')
							return craft.itemid == parseInt(filter.substring(1));
						else
							return craft.name == filter;
					}
					else if (typeof filter == 'number') {
						return craft.itemid == filter;
					}
					else if (typeof filter == 'function') {
						return filter(craft);
					}

					return false;
				});
				if (craftInfo != undefined) {
					result = { craft: craftInfo, skill: sk };
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
	cga.manipulateItemEx = function (options, cb) {
		var skill = cga.findPlayerSkill(options.skill);
		if (!skill) {
			cb(new Error('你没有' + skillname + '的技能'));
			return;
		}

		cga.SetImmediateDoneWork(options.immediate ? true : false);

		cga.StartWork(skill.index, 0);

		if (!cga.AssessItem(skill.index, options.itempos)) {
			cb(new Error('无法操作该物品'));
			return;
		}

		var beginTime = (new Date()).getTime();

		var handler = (err, results) => {
			if (results) {
				cb(null, results);
				return;
			}

			var craftStatus = cga.GetCraftStatus();

			var curTime = (new Date()).getTime();

			if (err) {
				if (craftStatus == 0 || craftStatus == 2) {
					cga.manipulateItemEx(options, cb);
					return;
				}

				//强制重试
				var isImmediate = cga.GetImmediateDoneWorkState();
				if (isImmediate != 2 && curTime > beginTime + 1000 * 120) {
					cga.manipulateItemEx(options, cb);
					return;
				}
				else if (isImmediate == 2 && curTime > beginTime + 1000 * 5) {
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
	cga.craftNamedItem = function (craftItemName, extraItemName) {
		throw new Error('该API已经弃用，请用cga.craftItemEx')
	}

	/*制造物品，参数：
		cga.craftItemEx({
			craftitem : 制造的物品名,
			extraitem(可选) : 添加宝石
			immediate : 是否立即完成（高速制造）,
		}, cb回调)
	*/
	cga.craftItemEx = function (options, cb) {

		var err = null;

		var info = cga.getItemCraftInfo(options.craftitem);
		if (info === null)
			err = new Error('你没有制造 ' + options.craftitem + ' 的技能');

		if (err) {
			cb(err);
			return;
		}

		var inventory = cga.getInventoryItems();
		var itemArray = [];

		info.craft.materials.forEach((mat) => {
			var findRequired = inventory.find((inv) => {
				return (inv.itemid == mat.itemid && inv.count >= mat.count);
			});
			if (findRequired != undefined) {
				itemArray.push(findRequired.pos);
			} else {
				err = new Error('制造' + options.craftitem + '所需物品' + mat.name + '不足！');
				return false;
			}
		});

		if (err) {
			cb(err);
			return;
		}

		if (typeof options.extraitem == 'string') {
			var findRequired = inventory.find((inv) => {
				return (inv.name == options.extraitem);
			});
			if (findRequired != undefined) {
				itemArray[5] = findRequired.pos;
			} else {
				err = new Error('制造' + options.extraitem + '所需宝石' + options.extraitem + '不足！');
			}
		}

		if (err) {
			cb(err);
			return;
		}

		for (var i = 0; i < 6; ++i) {
			if (typeof itemArray[i] != 'number')
				itemArray[i] = -1;
		}

		cga.SetImmediateDoneWork(options.immediate ? true : false);

		cga.StartWork(info.skill.index, info.craft.index);
		cga.CraftItem(info.skill.index, info.craft.index, 0, itemArray);

		var beginTime = (new Date()).getTime();

		var handler = (err, results) => {
			if (results) {
				cb(null, results);
				return;
			}

			var craftStatus = cga.GetCraftStatus();

			var curTime = (new Date()).getTime();

			if (err) {
				if (craftStatus == 0 || craftStatus == 2) {
					cga.craftItemEx(options, cb);
					return;
				}

				//强制重试
				var isImmediate = cga.GetImmediateDoneWorkState();
				if (isImmediate != 2 && curTime > beginTime + 1000 * 120) {
					cga.craftItemEx(options, cb);
					return;
				}
				else if (isImmediate == 2 && curTime > beginTime + 1000 * 5) {
					cga.craftItemEx(options, cb);
					return;
				}

				cga.AsyncWaitWorkingResult(handler, 1000);
			}
		}

		cga.AsyncWaitWorkingResult(handler, 1000);
	}

	//获取物品栏里的物品，返回数组
	cga.getInventoryItems = function () {
		return cga.GetItemsInfo().filter((item) => {
			return item.pos >= 8 && item.pos < 100;
		});
	}

	//获取装备栏里的物品，返回数组
	cga.getEquipItems = function () {
		return cga.GetItemsInfo().filter((item) => {
			return item.pos >= 0 && item.pos < 8;
		});
	}

	//获取装备栏里的水晶信息，返回object
	cga.getEquipCrystal = function () {
		return cga.GetItemsInfo().find((item) => {
			return item.pos == 7
		});
	}

	//获取装备耐久，返回数组[当前耐久,最大耐久]
	cga.getEquipEndurance = (item) => {

		if (item.attr) {
			var regex = item.attr.match(/\$4耐久 (\d+)\/(\d+)/);
			if (regex && regex.length >= 3) {
				return [parseInt(regex[1]), parseInt(regex[2])];
			}
		}

		return null;
	}


	//获取装备种类，返回String
	cga.getEquipClass = (item) => {
		if (item.attr) {
			var regex = item.attr.match(/\$0种类 (\w+)/);
			console.log(regex)

			if (regex && regex.length >= 3) {
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
	cga.getItemsInfoDetail = () => {
		let items = cga.GetItemsInfo()
		items.forEach((item) => {
			if (item.attr) {
				var regex = item.attr.match(/\$4耐久 (\d+)\/(\d+)/);
				if (regex && regex.length >= 3) {
					item.durability = parseInt(regex[1])
					item.durabilityMax = parseInt(regex[2])
					item.durabilityPer = parseFloat((item.durability / item.durabilityMax).toFixed(2))
				}
			}
		});
		return items
	}

	/**
	 * UNAecho:获取身上或银行所有的数据，包括道具、金币与宠物。
	 * 数据取自于：
	 * 1、身上数据使用cga.getInventoryItems()、cga.GetPlayerInfo().gold、cga.GetPetsInfo()获取
	 * 2、银行数据使用cga.GetBankItemsInfo()、cga.GetBankGold()、cga.GetBankPetsInfo()
	 * 
	 * 【重要】【UNAecho开发提醒】：与bank交互的C++API：
	 * 1、cga.GetBankItemsInfo()
	 * 2、cga.GetBankGold()
	 * 3、cga.GetBankPetsInfo()
	 * 有一个通用的特性，我们暂时称其为【Session】：
	 * 只要与银行NPC对话一次，便可缓存此Session。即使不与NPC再次对话，也可获取银行的所有最新数据。
	 * 
	 * 经测试：
	 * 1、与NPC对话之后，bank类API可随时获取bank的所有最新数据，包括银行中的道具、宠物、金币。
	 * 2、此Session机制是一种缓存，即便更换账号，仍然可以获取上次与银行NPC对话游戏角色的最新数据。
	 * 3、当你再次使用新人物来与银行NPC对话时，此Session会被刷新为当前角色的Session。
	 * 4、当你把游戏.exe整个窗口关闭时，Session失效。
	 * 
	 * 结论：
	 * 推测Session为游戏本身实现的问题，CGA可能只是去获取此Session缓存，来实现的bank类API。
	 * Session缓存写在了游戏.exe中，关闭游戏，登录相同账号，Session则被重置。
	 * 
	 * 巧用此Session机制：
	 * 1、进入游戏先去与银行NPC对话一次，获取此Session。此后，可不去银行，直接查询银行所有数据。
	 * 2、但更换账号需要注意，需要去银行对话一次刷新Session，否则获取的还是上一个账号的银行数据。
	 * 
	 * @param {Boolean} isBank 是否获取银行相关数据。true获取银行数据，false获取背包数据。默认false
	 * @returns 
	 */
	cga.getAssets = (isBank = false) => {
		let items = null
		let pets = null

		let res = {
			gold: 0,
			item: [],
			pet: [],
		}

		if (isBank) {
			items = cga.GetBankItemsInfo()
			pets = cga.GetBankPetsInfo()

			res.gold = cga.GetBankGold()

		} else {
			items = cga.getInventoryItems()
			pets = cga.GetPetsInfo()

			res.gold = cga.GetPlayerInfo().gold
		}

		items.forEach(i => {
			res.item.push({ name: i.name, count: i.count > 0 ? i.count : 1, pos: i.pos })
		});
		pets.forEach(p => {
			res.pet.push({ name: p.name, realname: p.realname, index: p.index, })
		});

		return res
	}

	cga.travel = {};
	/**
	 * UNAecho:一个定义自己在哪个领域内的API
	 * 目前仅靠index3来判断地区，还不够完善
	 * 日后考虑更细致的按闭合区间判断（遍历当前所有可以走的格子，来划定某一个区域。这样可以避免用XY强硬划分，带来错误。）
	 * @returns string
	 */
	cga.travel.switchMainMap = () => {
		var result = null
		var mapindex = cga.GetMapIndex().index3;
		var XY = cga.GetMapXY();

		if (mapindex >= 2300 && mapindex <= 2399) {
			result = '圣拉鲁卡村'
		} else if (mapindex >= 2000 && mapindex <= 2099 || [33219, 33214, 40001].indexOf(mapindex) >= 0) {
			result = '伊尔村'
		} else if (mapindex >= 2400 && mapindex <= 2499) {
			result = '亚留特村'
		} else if (mapindex >= 2100 && mapindex <= 2199) {
			result = '维诺亚村'
		} else if (mapindex >= 3200 && mapindex <= 3299) {
			result = '奇利村'
		} else if ((mapindex >= 3000 && mapindex <= 3099) || [5005, 5006].indexOf(mapindex) >= 0) {
			result = '加纳村'
		} else if (mapindex >= 4000 && mapindex <= 4099) {
			result = '杰诺瓦镇'
		} else if (mapindex >= 4100 && mapindex <= 4199) {
			result = '阿斯提亚镇'
		} else if ([4201, 4230, 14018].indexOf(mapindex) >= 0) {
			result = '夜晚蒂娜村'
		} else if (mapindex >= 4200 && mapindex <= 4299) {
			result = '蒂娜村'
		} else if (mapindex >= 4300 && mapindex <= 4399) {
			result = '阿巴尼斯村'
		} else if (mapindex >= 4400 && mapindex <= 4499) {
			result = '魔法大学'
		} else if (mapindex >= 16512 && mapindex <= 16513) {// TODO 双超学习房间
			result = '静谧之间'
		} else if (mapindex >= 27001 && mapindex <= 27999) {
			result = '曙光骑士团营地'
		} else if ((mapindex >= 1000 && mapindex <= 1899) || [11015, 21011, 32830].indexOf(mapindex) != -1) {
			result = '法兰城'
		} else if (mapindex == 33000) {
			result = '米内葛尔岛'
		} else if (mapindex >= 33100 && mapindex < 33300 || [33215, 33220, 40003].indexOf(mapindex) >= 0) {// TODO完善范围
			result = '阿凯鲁法村'
		} else if (mapindex >= 30000 && mapindex < 40000) {// TODO完善范围
			result = '苏国'
		} else if (mapindex == 43000) {
			result = '库鲁克斯岛'
		} else if (mapindex >= 43100 && mapindex < 43300 || [43190, 40006].indexOf(mapindex) >= 0) {// TODO完善范围
			result = '哥拉尔镇'
		} else if (mapindex >= 44690 && mapindex < 44700) {//
			result = '圣骑士营地'
		} else if (mapindex == 44750) {// TODO 探索矮人城镇还有没有其它房间和index
			result = '矮人城镇'
		} else if (mapindex >= 40000 && mapindex < 50000) {// TODO完善范围
			result = '艾尔巴尼亚王国'
		} else if (mapindex == 300 && XY.x < 379) {// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚奇利域'
		} else if (mapindex == 300 && XY.x >= 379) {// 索奇亚地图比较规则，大于379都是洪恩大风洞的右侧
			result = '索奇亚加纳域'
		}
		// 莎莲娜岛西边区域，以【通往阿巴尼斯的地下道为界限】，包括：阿巴尼斯和魔法大学的郊外。
		else if (mapindex == 402) {
			result = '莎莲娜魔法大学域'
		}
		// 莎莲娜岛西边区域，以【通往阿巴尼斯的地下道为界限】，包括：杰诺瓦镇、蒂娜村、神兽入口等郊外区域。
		else if (mapindex == 400) {
			result = '莎莲娜杰诺瓦域'
		} else if (mapindex == 59520 || (mapindex >= 59530 && mapindex <= 59537)) {
			result = '艾尔莎岛'
		} else if ((mapindex > 59800 && mapindex < 59900) || (mapindex == 59522 || mapindex == 59552 || mapindex == 59553)) {
			result = '利夏岛'
		} else if (mapindex >= 59521 || mapindex < 60000) {// TODO完善范围
			result = '艾夏岛'
		} else if (mapindex >= 50000 && mapindex < 60000) {// TODO完善范围
			result = '神圣大陆'
		} else {
			console.warn('[UNA脚本警告]:未知地图index，请联系作者https://github.com/UNAecho更新。')
		}
		// console.log('cga.travel.switchMainMap输入mapindex:【'+mapindex+'】,识别结果为【'+result+'】')
		return result
	}

	/**
	 * UNAecho:获取人物所记录的主城市以及所在国家
	 * 国家名称参考：
	 * 1、法兰王国
	 * 2、苏国（阿凯鲁法）
	 * 3、艾尔巴尼亚王国（哥拉尔）
	 * 4、天界之域（辛梅尔）
	 * 5、神圣大陆（艾尔莎岛）
	 */
	cga.travel.getSettled = () => {
		result = {
			settledCountry: null,
			settledCity: null,
		}
		let config = cga.loadPlayerConfig();

		if (!config || !config.hasOwnProperty('settledCity')) {
			console.log('你还未记录，无法判断你的记录点和记录点所在国家。', config)
			return result
		}
		if (config.settledCity == '艾尔莎岛') {
			result.settledCountry = '神圣大陆'
			result.settledCity = config.settledCity
		} else if (config.settledCity == '法兰城') {
			result.settledCountry = '法兰王国'
			result.settledCity = config.settledCity
		} else if (config.settledCity == '阿凯鲁法村') {
			result.settledCountry = '苏国'
			result.settledCity = config.settledCity
		} else if (config.settledCity == '哥拉尔镇') {
			result.settledCountry = '艾尔巴尼亚王国'
			result.settledCity = config.settledCity
		} else if (config.settledCity == '辛梅尔') {
			result.settledCountry = '天界之域'
			result.settledCity = config.settledCity
		}
		return result;
	}

	/**
	 * UNAecho:整合切换国家的API，TODO待完善
	 * @param {*} country 要去的国家，标准国家名称可以参考cga.travel.getSettled()里面的settledCountry
	 * @param {*} needSettle 是否需要定居，默认不需要
	 * @param {*} cb 
	 * @returns 
	 */
	cga.travel.goAbroad = (country, needSettle = false, cb) => {

		// 定居
		let settle = (cb) => {
			let rootdir = cga.getrootdir()
			let mainMap = cga.travel.switchMainMap()
			let missionObj = null
			if (mainMap == '艾尔莎岛') {
				missionObj = require(rootdir + '/常用数据/missions/' + mainMap + '.js');
			} else if (mainMap == '阿凯鲁法村') {

			} else if (mainMap == '哥拉尔镇') {

			} else {
				throw new Error('不支持的地区：', mainMap)
			}

			missionObj.doTask(targetObj.param, () => {
				console.log('【', targetObj.mission, '】结束，返回prepare中重新判断是否需要其它行为..')
				thisobj.prepare(cb)
			})
			return
		}

		/**
		 * 上下船函数
		 * obj.getOnPos:上船NPC POS
		 * obj.getOffPos:下船船员NPC POS
		 * obj.shipIndex:轮船地图index
		 * obj.aimIndex:目的地港口index
		 */
		let ship = (obj, cb) => {
			cga.askNpcForObj({ act: 'msg', target: '搭船', npcpos: obj.getOnPos }, () => {
				cga.askNpcForObj({ act: 'msg', target: obj.shipIndex, npcpos: obj.getOnPos }, () => {
					cga.askNpcForObj({ act: 'msg', target: '下船', npcpos: obj.getOffPos }, () => {
						cga.askNpcForObj({ act: 'map', target: obj.aimIndex, npcpos: obj.getOffPos }, cb)
					})
				})
			})
			return
		}

		let goAbroad = (country, cb) => {
			let mainMap = cga.travel.switchMainMap()
			console.log('🚀 ~ file: cgaapi.js:935 ~ goAbroad ~ mainMap:', mainMap)
			if (mainMap == '艾尔莎岛') {
				if (country == '神圣大陆') {
					if (cb) cb(true)
					return
				} else if (country == '法兰王国') {
					cga.travel.falan.toStone('C', cb);
					return
				} else if (country == '苏国') {
					cga.travel.falan.toStone('C', (r) => {
						cga.travel.toVillage('伊尔村', () => {
							cga.travel.autopilot('往阿凯鲁法栈桥', ()=>{
								ship({
									getOnPos : [52,50],
									getOffPos : [71,26],
									shipIndex : 41001,
									aimIndex : 40003,
								},cb)
							})
						})
					});
					return
				} else if (country == '艾尔巴尼亚王国') {
					cga.travel.falan.toStone('C', (r) => {
						cga.travel.toVillage('伊尔村', () => {
							cga.travel.autopilot('往哥拉尔栈桥', ()=>{
								ship({
									getOnPos : [52,50],
									getOffPos : [71,26],
									shipIndex : 41023,
									aimIndex : 40006,
								},cb)
							})
						})
					});
					return
				}
				throw new Error('不支持的目的国家:', country)
			} else if (mainMap == '阿凯鲁法村') {
				if (country == '神圣大陆') {
					cga.travel.autopilot('主地图', () => {

					})
					return
				} else if (country == '法兰王国') {
					cga.travel.falan.toCastle(cb);
					return
				} else if (country == '苏国') {
					cga.travel.falan.toCastle(() => {
						cga.travel.falan.toAKLF(cb)
					})
					return
				} else if (country == '艾尔巴尼亚王国') {
					cga.travel.gelaer.toFalan(() => {
						cga.travel.falan.toGelaer(cb)
					})
					return
				}
				throw new Error('不支持的目的国家:', country)
			} else if (mainMap == '哥拉尔镇') {
				if (country == '神圣大陆') {
					if (cb) cb(true)
					return
				} else if (country == '法兰王国') {
					cga.travel.falan.toCastle(cb);
					return
				} else if (country == '苏国') {
					cga.travel.falan.toCastle(() => {
						cga.travel.falan.toAKLF(cb)
					})
					return
				} else if (country == '艾尔巴尼亚王国') {
					cga.travel.gelaer.toFalan(() => {
						cga.travel.falan.toGelaer(cb)
					})
					return
				}
				throw new Error('不支持的目的国家:', country)
			} else if (mainMap == '艾尔巴尼亚王国') {// 去哥拉尔
				if (mainMap == '哥拉尔镇') {
					if (cb) cb(true)
					return
				} else if (mainMap == '阿凯鲁法村') {// TODO 阿凯鲁法到哥拉尔

				}
				return
			} else {// 当前不在主城市里，需要登出检查记录点。cga.logBack()会自动写入记录点。
				cga.logBack(() => {
					setTimeout(cga.travel.goAbroad, 1000, country, cb);
				})
				return
			}
		}

		// 先去目的国家
		goAbroad(country, (r) => {
			// 如果需要定居，则执行定居逻辑
			if (needSettle) {
				settle((r) => {
					// 定居完毕，结束API
					cb(r)
				})
				return
			}
			// 不需要定居则结束API
			cb(r)
			return
		})
		return
	}

	cga.travel.falan = {};

	cga.travel.falan.isSettled = () => {

		var config = cga.loadPlayerConfig();

		if (config)
			return config.settledCity == '法兰城' ? true : false;

		return false;
	}

	cga.travel.falan.xy2name = (x, y, mapname) => {
		if (x == 242 && y == 100 && mapname == '法兰城')
			return 'E1';
		if (x == 141 && y == 148 && mapname == '法兰城')
			return 'S1';
		if (x == 63 && y == 79 && mapname == '法兰城')
			return 'W1';
		if (x == 233 && y == 78 && mapname == '法兰城')
			return 'E2';
		if (x == 162 && y == 130 && mapname == '法兰城')
			return 'S2';
		if (x == 72 && y == 123 && mapname == '法兰城')
			return 'W2';
		if (x == 46 && y == 16 && mapname == '市场三楼 - 修理专区')
			return 'M3';
		if (x == 46 && y == 16 && mapname == '市场一楼 - 宠物交易区')
			return 'M1';
		if (x == 151 && y == 122 && mapname == '法兰城')
			return 'B1';
		if (x == 155 && y == 122 && mapname == '法兰城')
			return 'B2';
		return null;
	}

	cga.travel.falan.isvalid = function (stone) {
		switch (stone.toUpperCase()) {
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

	cga.travel.falan.toStoneInternal = function (stone, cb) {
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		const desiredMap = ['法兰城', '里谢里雅堡', '艾尔莎岛', '市场一楼 - 宠物交易区', '市场三楼 - 修理专区', '召唤之间'];
		// UNAecho:如果有不能登出的道具，则考虑在法兰城内步行。
		const itemNotLogBack = ['好像很好吃的起司', '好像很好喝的酒',];
		var notLogBack = false

		if (curMap == '法兰城') {
			if (stone == 'C') {
				cga.travel.falan.toCastle(cb);
				return;
			}
			if (stone == 'B1') {
				cga.walkList([
					[151, 122]
				], cb);
				return;
			}
			if (stone == 'B2') {
				cga.walkList([
					[155, 122]
				], cb);
				return;
			}
			var curStone = cga.travel.falan.xy2name(curXY.x, curXY.y, curMap);
			if (curStone) {
				var turn = false;
				if (stone == 'M1' || stone == 'M3') {
					if (curStone == stone) {
						cb(null);
						return;
					}
					turn = true;
				}
				else if (stone.length >= 2 && curStone.charAt(1) == stone.charAt(1)) {
					if (curStone.charAt(0) == 'S' && stone.charAt(0) == 'B') {
						cga.walkList([
							stone == 'B1' ? [151, 122] : [155, 122]
						], cb);
						return;
					}
					if (curStone == stone) {
						cb(null);
						return;
					}
					turn = true;
				} else if (stone.length < 2) {
					if (curStone.charAt(0) == stone.charAt(0)) {
						cb(null);
						return;
					}
					turn = true;
				}
				if (turn) {
					switch (curStone) {
						case 'E2': cga.turnDir(6); break;
						case 'S2': cga.turnDir(0); break;
						case 'W2': cga.turnDir(0); break;
						case 'E1': cga.turnDir(0); break;
						case 'S1': cga.turnDir(6); break;
						case 'W1': cga.turnDir(6); break;
					}
					cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
						if (err) {
							cb(err, reason);
							return;
						}
						cga.travel.falan.toStoneInternal(stone, cb);
					});
					return;
				}
			}
		}

		if (curMap.indexOf('市场') >= 0 && curXY.x == 46 && curXY.y == 16) {
			if (stone == 'M1' && curMap == '市场一楼 - 宠物交易区') {
				cb(null);
				return;
			}
			if (stone == 'M3' && curMap == '市场三楼 - 修理专区') {
				cb(null);
				return;
			}
			cga.turnDir(6);
			cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
				if (err) {
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
			return;
		}
		if (curMap == '艾尔莎岛') {
			cga.walkList([
				[140, 105],
			], () => {
				cga.turnDir(7);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
						if (err) {
							cb(err, reason);
							return;
						}
						cga.travel.falan.toStoneInternal(stone, cb);
					});
				});
			})
			return;
		}
		if (curMap == '里谢里雅堡') {
			if (stone == 'C') {
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
			if (stone == 'M1')
				walks = walkOutOfCastle_2;
			else if (stone == 'M3')
				walks = walkOutOfCastle_1;
			else if (stone.length >= 2 && stone.charAt(0) == 'B')
				walks = walkOutOfCastle_3;
			else if (stone.length == 1)
				walks = walkOutOfCastle_2;
			else if (stone.length >= 2 && stone.charAt(1) == '1')
				walks = walkOutOfCastle_1;
			else
				walks = walkOutOfCastle_2;

			cga.walkList(walks, (err, reason) => {
				if (err) {
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
			return;
		}
		// UNAecho:如果持有登出就消失的道具，那么尝试回到法兰城主地图，再次执行cga.travel.falan.toStoneInternal
		for (var i in itemNotLogBack) {
			if (cga.findItem(itemNotLogBack[i]) != -1) {
				notLogBack = true
				console.log('你持有登出即消失的【' + itemNotLogBack[i] + '】道具')
				break
			}
		}
		if (notLogBack && cga.travel.switchMainMap() == '法兰城') {
			console.log('不可登出，尝试徒步至法兰城主地图')
			cga.travel.autopilot('主地图', () => {
				cga.travel.falan.toStoneInternal(stone, cb);
			})
			return
		}
		cga.logBack(() => {
			cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
				if (err) {
					cb(err, reason);
					return;
				}
				cga.travel.falan.toStoneInternal(stone, cb);
			});
		});
	}

	//参数1：传送石名称，有效参数：E1 S1 W1 E2 S2 W2 M1(道具-市场1楼) M3(道具-市场3楼)
	//参数2：回调函数function(result), result 为true或false
	cga.travel.falan.toStone = function (stone, cb) {
		if (!cga.travel.falan.isvalid(stone)) {
			cb(new Error('无效的目的地名称'));
			return;
		}

		cga.travel.falan.toStoneInternal(stone, cb, true);
	}

	//前往到法兰城东医院
	//参数1：回调函数function(result), result 为true或false
	cga.travel.falan.toEastHospital = (cb) => {
		cga.travel.falan.toStone('E', () => {
			cga.walkList([
				[221, 83, '医院']
			], cb);
		});
	}

	//前往到法兰城西医院
	//参数1：回调函数function(result), result 为true或false
	cga.travel.falan.toWestHospital = (cb) => {
		cga.travel.falan.toStone('W', (r) => {
			cga.walkList([
				[82, 83, '医院'],
			], cb);
		});
	}

	//前往到法兰城银行
	cga.travel.falan.toBank = (cb) => {

		if (cga.GetMapIndex().index3 == 1121) {
			cb(null);
			return;
		}

		cga.travel.falan.toStone('E', (r) => {
			cga.walkList([
				[238, 111, '银行'],
			], cb);
		});
	}

	//从法兰城到里谢里雅堡，启动地点：登出到法兰城即可
	cga.travel.falan.toCastle = (cb) => {

		if (cga.GetMapName() == '里谢里雅堡') {
			cb(null);
			return;
		}

		if (cga.GetMapName() == '法兰城') {
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

			if (path.length > southPath.length) {
				path = southPath;
				target = [153, 100, '里谢里雅堡'];
			}

			if (path.length > eastPath.length) {
				path = eastPath;
				target = [165, 88, '里谢里雅堡'];
			}

			if (path.length > northPath.length) {
				path = northPath;
				target = [153, 70, '里谢里雅堡'];
			}

			cga.walkList([target], cb);
		} else {
			cga.travel.falan.toStone('S', () => {
				cga.travel.falan.toCastle(cb);
			});
		}
	}

	cga.travel.falan.toCastleHospital = function (cb) {

		if (cga.GetMapName() == '里谢里雅堡') {
			var pos = cga.GetMapXY();
			if (pos.x == 34 && (pos.y >= 87 && pos.y <= 89)) {
				var turnToPos = []
				if (pos.y == 87) {
					turnToPos = [36, 89]
				} else if (pos.y == 88) {
					turnToPos = [36, 88]
				} else {
					turnToPos = [36, 87]
				}
				cga.TurnTo(turnToPos[0], turnToPos[1]);
				cb(true);
				return;
			}
			else {
				cga.walkList([
					[34, 89]
				], (r) => {
					cga.TurnTo(36, 87);
					cb(true);
				});
			}
			return;
		}

		cga.travel.falan.toStone('C', (r) => {
			cga.walkList([
				[34, 89]
			], (r) => {
				cga.TurnTo(36, 87);
				cb(true);
			});
		});
	}

	//前往里堡打卡处并打卡
	cga.travel.falan.toCastleClock = (cb) => {
		cga.travel.falan.toStone('C', (r) => {
			cga.walkList([
				[58, 83]
			], (r) => {
				cga.TurnTo(58, 84);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					if (dlg.options == 12) {
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitNPCDialog(() => {
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

	cga.travel.camp.getRegion = (mapname, mapXY) => {
		if (mapname == '肯吉罗岛') {
			if (mapXY.x <= 480 && mapXY.x >= 463 && mapXY.y <= 206 && mapXY.y >= 195) {
				return '沙滩域';
			}
			if (mapXY.x <= 316 && mapXY.y >= 325) {
				return '矮人城镇域';
			}
			if (mapXY.x >= 355 && mapXY.x <= 516 && mapXY.y <= 181) {
				return '沼泽洞穴出口域';
			}
			if (mapXY.x < 355 && mapXY.y <= 212) {
				return '沼泽洞穴出口域';
			}
			if (mapXY.x >= 535 && mapXY.y >= 309) {
				return '圣骑士营地门口域';
			}

			return '圣骑士营地域';
		} else if (mapname == '芙蕾雅') {// 曙光骑士团营地域
			if (mapXY.x <= 520 && mapXY.x >= 420 && mapXY.y <= 315 && mapXY.y >= 250) {
				return '曙光骑士团营地域';
			}
		}
		return null;
	}

	//前往圣骑士营地，noWarp为true时只进到曙光骑士团营地
	cga.travel.falan.toCamp = (cb, noWarp) => {
		var warp = () => {

			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = (teamplayers.length > 0 && teamplayers[0].is_me) == true ? true : false;

			if (isTeamLeader) {
				setTimeout(() => {
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					setTimeout(warp, 1500);
				}, 1500);
				return;
			}

			cga.TurnTo(7, 21);
			cga.AsyncWaitMovement({ map: '圣骑士营地', delay: 1000, timeout: 5000 }, cb);
		}

		var castle_2_camp = () => {

			var shouldWarp = (cga.getItemCount('承认之戒', true) > 0 && noWarp !== true) ? true : false;

			var list = shouldWarp ? [
				[55, 47, '辛希亚探索指挥部'],
				[7, 4, '辛希亚探索指挥部', 91, 6],
				[95, 9, 27101],
				[8, 21],
			] : [

			];

			if (cga.GetMapName() == '里谢里雅堡') {
				list.unshift([513, 282, '曙光骑士团营地']);
				list.unshift([153, 241, '芙蕾雅']);
				list.unshift([41, 98, '法兰城']);
			} else if (cga.GetMapName() == '法兰城') {
				list.unshift([513, 282, '曙光骑士团营地']);
				list.unshift([153, 241, '芙蕾雅']);
			} else if (cga.GetMapName() == '芙蕾雅') {
				list.unshift([513, 282, '曙光骑士团营地']);
			}

			cga.walkList(list, (shouldWarp) ? warp : cb);
		}

		var mapname = cga.GetMapName();
		if (mapname == '圣骑士营地') {
			cb(null);
			return;
		}
		var mapindex = cga.GetMapIndex().index3;
		if (mapindex == 44692) {
			cga.walkList([
				[0, 20, '圣骑士营地'],
			], cb);
			return;
		}
		if (mapindex == 44693) {
			cga.walkList([
				[30, 37, '圣骑士营地'],
			], cb);
			return;
		}
		if (mapindex == 44698) {
			cga.walkList([
				[3, 23, '圣骑士营地'],
			], cb);
			return;
		}
		if (mapindex == 44699) {
			cga.walkList([
				[0, 14, '圣骑士营地'],
			], cb);
			return;
		}
		// 传送石房间
		if (mapname == '辛希亚探索指挥部' && cga.GetMapIndex().index3 == 27101) {
			cga.walkList([[8, 21]], warp);
			return;
		}

		if (mapname == '法兰城' || mapname == '里谢里雅堡' || mapname == '芙蕾雅' || mapname == '曙光骑士团营地') {
			castle_2_camp(null);
		} else {
			cga.travel.falan.toStone('C', castle_2_camp);
		}
	}

	//前往流行商店
	cga.travel.falan.toFashionStore = cga.travel.falan.toFabricStore = (cb) => {
		if (cga.GetMapName() == '流行商店') {
			cb(null);
			return;
		}

		if (cga.GetMapName() == '法兰城') {
			cga.travel.falan.toStone('S1', () => {
				cga.walkList([
					[117, 112, '流行商店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[17, 53, '法兰城'],
					[117, 112, '流行商店'],
				], cb);
			});
		}
	}

	//前往凯蒂夫人的店
	cga.travel.falan.toKatieStore = cga.travel.falan.toAssessStore = (cb) => {
		if (cga.GetMapName() == '凯蒂夫人的店') {
			cb(null);
			return;
		}

		if (cga.GetMapName() == '法兰城') {
			cga.travel.falan.toStone('E2', function (r) {
				cga.walkList([
					[196, 78, '凯蒂夫人的店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[65, 53, '法兰城'],
					[196, 78, '凯蒂夫人的店'],
				], cb);
			});
		}
	}

	//前往达美姊妹的店
	cga.travel.falan.toDameiStore = cga.travel.falan.toCrystalStore = (cb) => {
		if (cga.GetMapName() == '达美姊妹的店') {
			cb(null);
			return;
		}

		if (cga.GetMapName() == '法兰城') {
			cga.travel.falan.toStone('W1', function (r) {
				cga.walkList([
					[94, 78, '达美姊妹的店'],
				], cb);
			});
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[17, 53, '法兰城'],
					[94, 78, '达美姊妹的店'],
				], cb);
			});
		}
	}

	//前往法兰工房，mine为要换的矿名
	cga.travel.falan.toMineStore = (mine, cb) => {
		var mineExchange = null;
		if (mine == '铜') {
			mineExchange = (cb2) => {
				cga.walkList([[26, 5]], () => {
					cga.turnTo(26, 4);
					cb2(null);
				});
			}
		}
		if (mine == '铁') {
			mineExchange = (cb2) => {
				cga.walkList([[28, 6]], () => {
					cga.turnTo(28, 5);
					cb2(null);
				});
			}
		}
		if (mine == '银') {
			mineExchange = (cb2) => {
				cga.walkList([[29, 6]], () => {
					cga.turnTo(30, 5);
					cb2(null);
				});
			}
		}
		if (mine == '纯银') {
			mineExchange = (cb2) => {
				cga.walkList([[27, 7]], () => {
					cga.turnTo(27, 5);
					cb2(null);
				});
			}
		}
		if (mine == '金') {
			mineExchange = (cb2) => {
				cga.walkList([[24, 6]], () => {
					cga.turnTo(24, 5);
					cb2(null);
				});
			}
		}
		if (mine == '白金') {
			mineExchange = (cb2) => {
				cga.walkList([[29, 6]], () => {
					cga.turnTo(30, 7);
					cb2(null);
				});
			}
		}
		if (mine == '幻之钢') {
			mineExchange = (cb2) => {
				cga.walkList([[26, 10]], () => {
					cga.turnTo(28, 10);
					cb2(null);
				});
			}
		}
		if (mine == '幻之银') {
			mineExchange = (cb2) => {
				cga.walkList([[27, 9]], () => {
					cga.turnTo(28, 8);
					cb2(null);
				});
			}
		}
		if (mine == '勒格耐席鉧') {
			mineExchange = (cb2) => {
				cga.walkList([[23, 7]], () => {
					cga.turnTo(22, 6);
					cb2(null);
				});
			}
		}
		if (mine == '奥利哈钢') {
			mineExchange = (cb2) => {
				cga.walkList([[26, 12]], () => {
					cga.turnTo(27, 12);
					cb2(null);
				});
			}
		}
		if (cga.GetMapName() == '米克尔工房') {
			if (mineExchange) {
				mineExchange(cb);
			} else {
				cb(null);
			}
			return;
		}

		if (cga.GetMapName() == '法兰城') {
			cga.travel.falan.toStone('W1', function (r) {
				cga.walkList([
					[100, 61, '米克尔工房'],
				], () => {
					if (mineExchange) {
						mineExchange(cb);
					} else {
						cb(null);
					}
				});
			});
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[17, 53, '法兰城'],
					[100, 61, '米克尔工房'],
				], () => {
					if (mineExchange) {
						mineExchange(cb);
					} else {
						cb(null);
					}
				});
			});
		}
	}

	//前往新城工房，mine为要换的矿名
	cga.travel.falan.toNewMineStore = (mine, cb) => {
		var mineExchange = null;
		if (mine == '铜') {
			mineExchange = (cb2) => {
				cga.walkList([[35, 46]], () => {
					cga.turnTo(35, 45);
					cb2(null);
				});
			}
		}
		if (mine == '铁') {
			mineExchange = (cb2) => {
				cga.walkList([[32, 47]], () => {
					cga.turnTo(31, 47);
					cb2(null);
				});
			}
		}
		if (mine == '银') {
			mineExchange = (cb2) => {
				cga.walkList([[42, 51]], () => {
					cga.turnTo(41, 51);
					cb2(null);
				});
			}
		}
		if (mine == '纯银') {
			mineExchange = (cb2) => {
				cga.walkList([[37, 49]], () => {
					cga.turnTo(37, 48);
					cb2(null);
				});
			}
		}
		if (mine == '金') {
			mineExchange = (cb2) => {
				cga.walkList([[40, 50]], () => {
					cga.turnTo(39, 49);
					cb2(null);
				});
			}
		}
		if (mine == '白金') {
			mineExchange = (cb2) => {
				cga.walkList([[38, 43]], () => {
					cga.turnTo(39, 44);
					cb2(null);
				});
			}
		}
		if (mine == '幻之钢') {
			mineExchange = (cb2) => {
				cga.walkList([[26, 10]], () => {
					cga.turnTo(28, 10);
					cb2(null);
				});
			}
		}
		if (mine == '幻之银') {
			mineExchange = (cb2) => {
				cga.walkList([[37, 44]], () => {
					cga.turnTo(38, 45);
					cb2(null);
				});
			}
		}
		if (mine == '勒格耐席鉧') {
			mineExchange = (cb2) => {
				cga.walkList([[33, 46]], () => {
					cga.turnTo(33, 45);
					cb2(null);
				});
			}
		}
		if (mine == '奥利哈钢') {
			mineExchange = (cb2) => {
				cga.walkList([[44, 48]], () => {
					cga.turnTo(43, 48);
					cb2(null);
				});
			}
		}
		if (mine == '铝') {
			mineExchange = (cb2) => {
				cga.walkList([[38, 54]], () => {
					cga.turnTo(38, 53);
					cb2(null);
				});
			}
		}
		if (cga.GetMapName() == '画廊') {
			if (mineExchange) {
				mineExchange(cb);
			} else {
				cb(null);
			}
			return;
		}

		cga.travel.newisland.toStone('B', () => {
			cga.walkList([
				[144, 120, '武器工房'],
				[28, 21, '画廊'],
			], () => {
				if (mineExchange) {
					mineExchange(cb);
				} else {
					cb(null);
				}
			});
		});
	}

	//从法兰城到新城
	cga.travel.falan.toNewIsland = (cb) => {
		cga.travel.falan.toStone('C', function (r) {
			cga.walkList([
				[28, 88]
			], (r) => {
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(32, -1);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(32, -1);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(32, -1);
								cga.AsyncWaitNPCDialog((err, dlg) => {
									if (dlg && dlg.options == 12) {
										cga.ClickNPCDialog(4, -1);
										cga.AsyncWaitMovement({ map: '？' }, () => {
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
	cga.travel.falan.toAKLF = (cb) => {

		if (cga.GetMapName() == '阿凯鲁法村') {
			cb(null);
			return;
		}

		var stage3 = () => {
			cga.walkList([
				[20, 53],
			], (r) => {
				cga.TurnTo(18, 53);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '港湾管理处' }, () => {
						cga.walkList([
							[22, 31, '阿凯鲁法'],
							[28, 30],
						], () => {
							cga.TurnTo(30, 30);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '阿凯鲁法村' }, cb);
							});
						});
					});
				});
			});
		}

		var retry2 = () => {
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg) => {

				if (dlg && dlg.message.indexOf('现在正停靠在阿凯鲁法港') >= 0 && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '往伊尔栈桥' }, () => {
						stage3();
					});
					return;
				}

				setTimeout(retry2, 5000);
			});
		}

		var retry = () => {
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '艾欧奇亚号' }, retry2);
					return;
				}

				setTimeout(retry, 5000);
			});
		}

		if (cga.GetMapName() != '伊尔村') {
			cga.travel.falan.toTeleRoom('伊尔村', () => {
				cga.walkList([
					[12, 17, '村长的家'],
					[6, 13, '伊尔村'],
				], () => {
					cga.travel.falan.toAKLF(cb);
				});
			});
			return;
		}

		cga.walkList([
			[58, 71],
		], () => {
			cga.turnTo(60, 71);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({ map: '伊尔' }, () => {
					cga.walkList([
						[30, 21, '港湾管理处'],
						[23, 25],
					], () => {
						cga.TurnTo(23, 23);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '往阿凯鲁法栈桥' }, () => {
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
	cga.travel.falan.toGelaer = (cb) => {

		if (cga.GetMapName() == '哥拉尔镇') {
			cb(null);
			return;
		}

		var stage3 = () => {
			cga.walkList([
				[84, 55],
			], () => {
				cga.turnTo(84, 53);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '哥拉尔镇 港湾管理处' }, () => {
						cga.walkList([
							[14, 15, '哥拉尔镇'],
							[118, 214],
						], cb);
					});
				});
			});
		}

		var retry2 = () => {
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg) => {

				if (dlg && dlg.message.indexOf('正停在哥拉尔港') >= 0 && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '往伊尔栈桥' }, () => {
						stage3();
					});
					return;
				}

				setTimeout(retry2, 5000);
			});
		}

		var retry = () => {
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '铁达尼号' }, retry2);
					return;
				}

				setTimeout(retry, 5000);
			});
		}

		if (cga.GetMapName() != '伊尔村') {
			cga.travel.falan.toTeleRoom('伊尔村', () => {
				cga.walkList([
					[12, 17, '村长的家'],
					[6, 13, '伊尔村'],
				], () => {
					cga.travel.falan.toGelaer(cb);
				});
			});
			return;
		}

		cga.walkList([
			[58, 71],
		], () => {
			cga.turnTo(60, 71);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({ map: '伊尔' }, () => {
					cga.walkList([
						[30, 21, '港湾管理处'],
						[25, 25],
					], () => {
						cga.TurnTo(25, 23);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '往哥拉尔栈桥' }, () => {
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

	cga.travel.AKLF.isSettled = () => {

		var config = cga.loadPlayerConfig();

		if (config)
			return config.settledCity == '阿凯鲁法村' ? true : false;

		return false;
	}

	//前往到阿凯鲁法银行
	cga.travel.AKLF.toBank = (cb) => {
		if (cga.GetMapName() != '阿凯鲁法村') {

			if (cga.travel.AKLF.isSettled()) {
				cga.logBack(() => {
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
		], () => {
			cga.turnDir(0);
			cb(null);
		});
	}

	//从阿凯鲁法到法兰
	cga.travel.AKLF.toFalan = (cb) => {
		if (cga.GetMapName() != '阿凯鲁法村') {
			cb(new Error('必须从阿凯鲁法村启动'));
			return;
		}

		var stage4 = () => {
			cga.walkList([
				[47, 83, '村长的家'],
				[14, 17, '伊尔村的传送点'],
				[20, 10],
			], (r) => {
				cga.TurnTo(22, 10);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '启程之间' }, () => {
						cga.walkList([
							[25, 24, '里谢里雅堡 1楼'],
							[74, 40, '里谢里雅堡'],
						], cb);
					});
				});
			});
		}

		var stage3 = () => {
			cga.walkList([
				[19, 55],
			], (r) => {
				cga.TurnTo(19, 53);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '港湾管理处' }, () => {
						cga.walkList([
							[9, 22, '伊尔'],
							[24, 19],
						], () => {
							cga.TurnTo(24, 17);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '伊尔村' }, stage4);
							});
						});
					});
				});
			});
		}

		var retry2 = () => {
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.message.indexOf('现在正停靠在伊尔村') >= 0 && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '往阿凯鲁法栈桥' }, () => {
						stage3();
					});
					return;
				}

				setTimeout(retry2, 5000);
			});
		}

		var retry = () => {
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '艾欧奇亚号' }, retry2);
					return;
				}

				setTimeout(retry, 5000);
			});
		}

		cga.walkList([
			[57, 176],
		], () => {
			cga.TurnTo(55, 176);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);
				cga.AsyncWaitMovement({ map: '阿凯鲁法' }, () => {
					cga.walkList([
						[16, 15, '港湾管理处'],
						[15, 12],
					], () => {
						cga.TurnTo(17, 12);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '往伊尔栈桥' }, () => {
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

	cga.travel.falan.toTeleRoomTemplate = (villageName, npcPos, npcPos2, npcPos3, cb) => {
		var logic = () => {
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;

			var list = [];

			if (isTeamLeader) {
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
			} else {
				list.push(npcPos);
			}

			cga.walkList(list, () => {
				var go = () => {
					cga.turnTo(npcPos3[0], npcPos3[1]);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						//try again if timeout
						if (err && err.message.indexOf('timeout') > 0) {
							setTimeout(go, 1500);
							return;
						}

						if (err) {
							cb(err);
							return;
						}

						if (typeof dlg.message == 'string' && (dlg.message.indexOf('对不起') >= 0 || dlg.message.indexOf('很抱歉') >= 0)) {
							cb(new Error('无法使用前往' + villageName + '的传送石，可能的原因：没开传送点'));
							return;
						}
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitMovement({ map: villageName + '的传送点', delay: 1000, timeout: 5000 }, (err) => {
							if (err) {
								cb(new Error('无法使用前往' + villageName + '的传送石，可能的原因：钱不够'));
								return;
							}

							cb(null);
						});
					});
				}
				if (isTeamLeader) {
					setTimeout(() => {
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(go, 1500);
					}, 1500);
				} else {
					go();
				}
			});
		}

		let mapindex = cga.GetMapIndex().index3;
		if (mapindex == 1522) {
			logic()
		} else if (mapindex == 1500 || mapindex == 1520) {
			cga.travel.autopilot('启程之间', logic)
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.travel.autopilot('启程之间', logic)
			});
		}
	}

	/**
	 * UNAecho:从法兰城去往各大村镇的API
	 * 修复一个逻辑：
	 * 如果你已经在目标村镇内，原来的逻辑依然会登出，重新花钱传送一遍，这完全没有意义。
	 * 现在新增判断逻辑，如果你已经在目标村镇里，包含村镇里的其它地图，API会直接结束，不会重新再走一次。
	 * @param {*} villageName 目标村镇名称
	 * @param {*} cb 
	 * @returns 
	 */
	cga.travel.falan.toTeleRoom = (villageName, cb) => {
		let mainMap = cga.travel.switchMainMap()
		// 如果已经在目标村镇（包含内部），则结束此API
		if (mainMap == villageName) {
			cb(null)
			return
		}
		switch (villageName) {
			case '亚留特村':
				cga.travel.falan.toTeleRoomTemplate('亚留特村', [43, 23], [43, 22], [44, 22], cb);
				break;
			case '伊尔村':
				cga.travel.falan.toTeleRoomTemplate('伊尔村', [43, 33], [43, 32], [44, 32], cb);
				break;
			case '圣拉鲁卡村':
				cga.travel.falan.toTeleRoomTemplate('圣拉鲁卡村', [43, 44], [43, 43], [44, 43], cb);
				break;
			case '维诺亚村':
				cga.travel.falan.toTeleRoomTemplate('维诺亚村', [9, 22], [9, 23], [8, 22], cb);
				break;
			case '奇利村':
				cga.travel.falan.toTeleRoomTemplate('奇利村', [9, 33], [8, 33], [8, 32], cb);
				break;
			case '加纳村':
				cga.travel.falan.toTeleRoomTemplate('加纳村', [9, 44], [8, 44], [8, 43], cb);
				break;
			case '杰诺瓦镇':
				cga.travel.falan.toTeleRoomTemplate('杰诺瓦镇', [15, 4], [15, 5], [16, 4], cb);
				break;
			case '阿巴尼斯村':
				cga.travel.falan.toTeleRoomTemplate('阿巴尼斯村', [37, 4], [37, 5], [38, 4], cb);
				break;
			case '蒂娜村':
				cga.travel.falan.toTeleRoomTemplate('蒂娜村', [25, 4], [25, 5], [26, 4], cb);
				break;
			case '魔法大学':
				cga.travel.falan.toTeleRoom('阿巴尼斯村', () => {
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
				throw new Error('未知的村子名称:' + villageName);
		}
	}

	cga.travel.falan.toTeleRoomPromisify = (city) => {
		return cga.promisify(cga.travel.falan.toTeleRoom, [city]);
	}

	/**
	 * 检查全部传送石开启状况，将结果保存在【个人配置】中。
	 * 为了提高效率，仅检查没有记录或者未开启的部分。
	 * */
	cga.travel.falan.checkAllTeleRoom = (cb) => {
		var config = cga.loadPlayerConfig();
		if (!config)
			config = {};
		// 如果全部开传送，将config.allstonedone置为true，无需重复检查。
		if (config.allstonedone) {
			console.log('人物已经全部开传送，无需检查。')
			if (cb) setTimeout(cb, 1000, true);
			return
		}
		var alldone = true
		var check = (villageName, pos, npcPos, cb2) => {
			if (config[villageName]) {
				console.log(villageName + '已经开过传送，跳过')
				if (cb2) {
					setTimeout(cb2, 1000, null);
				}
				return
			}
			cga.walkList([
				pos
			], () => {
				cga.turnTo(npcPos[0], npcPos[1]);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					//try again if timeout
					if (err && err.message.indexOf('timeout') > 0) {
						setTimeout(check, 1500);
						return;
					}
					if (err) {
						cb2(err);
						return;
					}
					if (typeof dlg.message == 'string' && (dlg.message.indexOf('你') >= 0 || dlg.message.indexOf('很抱歉') >= 0)) {
						alldone = false
						config[villageName] = false
						console.log('【' + villageName + '】没开传送，请开启')
					} else if (typeof dlg.message == 'string' && (dlg.message.indexOf('金币') >= 0)) {
						config[villageName] = true
					} else {
						new Error('未知错误，请手动检查传送石状态')
					}
					if (cb2) {
						setTimeout(cb2, 1000, null);
					}
				});
			});
		}
		var map = cga.GetMapName();
		if (map == '启程之间') {
			check('亚留特村', [43, 22], [44, 22], () => {
				check('伊尔村', [43, 32], [44, 32], () => {
					check('圣拉鲁卡村', [43, 43], [44, 43], () => {
						check('维诺亚村', [9, 23], [8, 22], () => {
							check('奇利村', [8, 33], [8, 32], () => {
								check('加纳村', [8, 44], [8, 43], () => {
									check('杰诺瓦镇', [15, 5], [16, 4], () => {
										check('蒂娜村', [25, 5], [26, 4], () => {
											check('阿巴尼斯村', [37, 5], [38, 4], () => {
												console.log('检查完毕')
												if (alldone) {
													cga.SayWords('恭喜，人物已经开启全部法兰王国传送石。', 0, 3, 1);
													config.allstonedone = true
												}
												cga.savePlayerConfig(config, () => {
													cb(true)
													return
												});
											})
										})
									})
								})
							})
						})
					})
				})
			})
		} else {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[41, 50, '里谢里雅堡 1楼'],
					[45, 20, '启程之间']
				], () => {
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
		'圣拉鲁卡村': 100,
		'伊尔村': 100,
		'亚留特村': 250,
		'维诺亚村': 250,
		'奇利村': 500,
		'加纳村': 600,
		'杰诺瓦镇': 750,
		'蒂娜村': 750,
		'阿巴尼斯村': 750,
		'魔法大学': 750,
	}

	cga.travel.info = {
		'法兰城': {
			mainName: '法兰城',
			mainindex: 1000,
			minindex: 1000,
			maxindex: 32830,
			entrance: {
				'东门': [470, 196, 100],
				'西门': [378, 195, 100],
				'南门': [424, 253, 100],
			},
			mapTranslate: {
				'主地图': 1000,
				'法兰城': 1000,
				'拿潘食品店': 1062,
				'职业介绍所': 1091,
				'职业公会': 1092,
				'酒吧': {
					1101: '科特利亚酒吧',// 调教技能学习地
					1170: '安其摩酒吧',// 铜钥匙购买地
				},
				'医院': {
					1111: '西门医院',
					1112: '东门医院',
				},
				'科特利亚酒吧': 1101,
				'酒吧里面': 1102,
				'凯蒂夫人的店': 1031,
				'强哥杂货店': 1051,
				'银行': 1121,
				'葛利玛的家': 1150,
				'艾文蛋糕店': 1151,
				'毕夫鲁的家': 1152,
				'冒险者旅馆': 1154,
				'冒险者旅馆 2楼': 1164,
				'流行商店': 1162,
				'安其摩酒吧': 1170,
				'弓箭手公会': 1181,
				'公寓': 1187,
				'公寓2楼': 1188,
				'美容院': 1189,
				'豪宅': {
					1193: '普通民房',
					21005: '咒术师就职任务相关',
				},
				'大圣堂的入口': 1201,
				'礼拜堂': 1202,
				'2楼客房': 1206,
				'大圣堂里面': {
					1207: '传教士职业导师房间',
					1208: '传教士职业技能房间',
				},
				'竞技场的入口': 1400,
				'竞技场': {
					1401: '学习气功弹等PK竞技场',
					1450: '打吉拉竞技场的石像说话第1层',
					1451: '打吉拉竞技场的石像说话第2层',
					1452: '打吉拉竞技场的石像说话第3层',
					1453: '打吉拉竞技场的石像说话第4层',
					1454: '打吉拉竞技场的石像说话第5层',
					1455: '打吉拉竞技场的石像说话第6层',
				},
				'后台': 1402,
				'治愈的广场': 1403,
				'休息室': 1404,
				'升官图房间2': {
					1420: '第一个升官图房间2',
					1421: '第二个升官图房间2',
				},
				'升官图': 1422,
				'升官图导览间': 1423,
				'升官图走廊': 1424,
				'休息室': 1456,
				'竞技预赛会场': 1457,
				'客房': {
					1104: '病倒的厨师',
					1105: '学调教',
					1507: '护士职业导师房间',
					1508: '封印师职业导师房间',
					1509: '骑士职业导师房间',
					1510: '阳炎学习房间',
					32830: '空房间，以前是抽奖',
				},
				'里谢里雅堡': 1500,
				'厨房': 1502,
				'图书室': 1504,
				'食堂': 1506,
				'谒见之间': 1511,
				'寝室': 1512,
				'走廊': 1518,
				'里谢里雅堡 1楼': 1520,
				'里谢里雅堡 2楼': 1521,
				'启程之间': 1522,
				'召唤之间': 1530,
				'回廊': 1531,
				// 新手房召唤之间的index是多变的，目前见过的范围是1533-36，无法从外面走入，只能走出。
				'召唤之间': 1533,
				'召唤之间': 1534,
				'召唤之间': 1535,
				'召唤之间': 1536,
				'饲养师之家': 1810,
				'灵堂': 11015,
				'镜中的豪宅  阁楼': 21011,
				'气功弹': '气功弹',
				'东门': '东门',
				'西门': '西门',
				'南门': '南门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				1000: [],
				// 凯蒂夫人的店
				1031: [[196, 78, 1031],],
				// 强哥杂货店
				1051: [[191, 37, 1051],],
				// 拿潘食品店
				1062: [[217, 53, 1062],],
				// 职业公会
				1092: [[73, 60, 1092],],
				// 科特利亚酒吧
				1101: [[219, 136, 1101],],
				// 酒吧里面
				1102: [[219, 136, 1101], [27, 20, 1102],],
				// 客房
				1104: [[219, 136, 1101], [27, 20, 1102], [10, 12, 1104],],
				// 客房
				1105: [[219, 136, 1101], [27, 20, 1102], [10, 6, 1105],],
				// 西门医院
				1111: [[82, 83, 1111],],
				// 东门医院
				1112: [[221, 83, 1112],],
				// 银行
				1121: [[238, 111, 1121],],
				// 葛利玛的家
				1150: [[216, 43, 1150],],
				// 艾文蛋糕店
				1151: [[216, 148, 1151],],
				// 毕夫鲁的家
				1152: [[206, 37, 1152],],
				// 冒险者旅馆
				1154: [[238, 64, 1154],],
				// 流行商店
				1162: [[117, 112, 1162],],
				// 冒险者旅馆 2楼
				1164: [[238, 64, 1154], [33, 27, 1164],],
				// 安其摩酒吧
				1170: [[102, 131, 1170],],
				// 弓箭手公会
				1181: [[190, 133, 1181],],
				// 公寓
				1187: [[182, 132, 1187],],
				// 公寓2楼
				1188: [[182, 132, 1187], [16, 7, 1188],],
				// 美容院
				1189: [[216, 124, 1189],],
				// 豪宅
				1193: [[96, 148, 1193],],
				// 职业介绍所
				1091: [[195, 50, 1091],],
				// 大圣堂的入口
				1201: [[154, 29, 1201],],
				// 礼拜堂
				1202: [[154, 29, 1201], [14, 7, 1202],],
				// 2楼客房
				1206: [[154, 29, 1201], [22, 9, 1206],],
				// 大圣堂里面
				1207: [[154, 29, 1201], [14, 7, 1202], [23, 0, 1207],],
				// 大圣堂里面
				1208: [[154, 29, 1201], [14, 7, 1202], [23, 0, 1207],
				[(cb) => {
					cga.walkList([[13, 6]], () => {
						cga.turnDir(0);
						cga.waitForLocation({ mapindex: 1208 }, cb);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1208],],
				// 竞技场的入口
				1400: [[(cb) => {
					cga.walkList([[124, 161]], () => {
						cga.turnDir(4);
						cga.waitForLocation({ mapindex: 1400 }, cb);
					});
				}, null, 1400],],
				// 竞技场
				1401: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [15, 6, 1401],],
				// 后台
				1402: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [15, 6, 1401], [35, 8, 1402],],
				// 治愈的广场
				1403: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],],
				// 休息室
				1404: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404],],
				// 升官图房间2
				1420: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404], [8, 9, 1424], [9, 7, 1420],],
				// 升官图房间2
				1421: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404], [8, 9, 1424], [9, 12, 1421],],
				// 升官图
				1422: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404], [8, 9, 1424], [9, 17, 1422],],
				// 升官图导览间
				1423: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404], [8, 9, 1424], [9, 2, 1423],],
				// 升官图走廊
				1424: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [2, 14, 1404], [8, 9, 1424],],
				// 竞技场
				1450: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450],],
				// 竞技场
				1451: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451],],
				// 竞技场
				1452: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452],],
				// 竞技场
				1453: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452], [22, 8, 1453],],
				// 竞技场
				1454: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452], [22, 8, 1453], [15, 8, 1454],],
				// 竞技场
				1455: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452], [22, 8, 1453], [15, 8, 1454], [22, 16, 1455],],
				// 休息室
				1456: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452], [22, 8, 1453], [15, 8, 1454], [22, 16, 1455],
				[(cb) => {
					cga.walkList([[16, 12]], () => {
						cga.turnDir(6);
						cga.AsyncWaitNPCDialog((err, dlg) => {
							if ((dlg && dlg.message.indexOf('斗士之证') >= 0)) {
								cga.ClickNPCDialog(1, -1)
								cga.travel.autopilot(1456, cb)
								return
							} else {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
									cga.AsyncWaitNPCDialog(() => {
										cga.ClickNPCDialog(4, -1);
										setTimeout(() => {
											cb2(true)
										}, 1000);
									});
								});
							}


						});
					});
				}, null, 1456],],
				// 竞技预赛会场
				1457: [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [27, 14, 1403],
				[(cb) => {
					cga.walkList([[25, 13]], () => {
						cga.waitForLocation({ mapindex: 1450 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(32, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
								});
							});
						});
					});
				}, null, 1450], [22, 13, 1451], [15, 8, 1452], [22, 8, 1453], [15, 8, 1454], [22, 16, 1455],
				[(cb) => {
					cga.walkList([[16, 12]], () => {
						cga.turnDir(6);
						cga.AsyncWaitNPCDialog((err, dlg) => {
							if ((dlg && dlg.message.indexOf('斗士之证') >= 0)) {
								cga.ClickNPCDialog(1, -1)
								cga.travel.autopilot(1456, cb)
								return
							} else {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1);
									cga.AsyncWaitNPCDialog(() => {
										cga.ClickNPCDialog(4, -1);
										setTimeout(cb, 1000);
									});
								});
							}


						});
					});
				}, null, 1456],
				[(cb) => {
					cga.waitForLocation({ mapindex: 1457 }, cb);
					cga.walkList([[16, 6]], () => {
						cga.turnDir(4);
						cga.AsyncWaitNPCDialog((err, dlg) => {
							cga.ClickNPCDialog(8, -1);
							cga.AsyncWaitNPCDialog(() => {
								cga.turnDir(7);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(4, -1);
									cga.AsyncWaitNPCDialog(() => {
										cga.ClickNPCDialog(1, -1);
									});
								});
							});
						});
					});
				}, null, 1457]],
				// 里谢里雅堡
				1500: [[153, 100, 1500],],
				// 厨房
				1502: [[153, 100, 1500], [41, 50, 1520], [104, 21, 1502],],
				// 图书室
				1504: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [0, 74, 1504],],
				// 食堂
				1506: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [95, 71, 1506],],
				// 客房
				1507: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [18, 71, 1507],],
				// 客房
				1508: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [32, 71, 1508],],
				// 客房
				1509: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [67, 71, 1509],],
				// 客房
				1510: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [79, 71, 1510],],
				// 谒见之间
				1511: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [50, 22, 1511],],
				// 寝室
				1512: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [50, 22, 1511], [16, 3, 1518], [35, 3, 1512],],
				// 走廊
				1518: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521], [50, 22, 1511], [16, 3, 1518],],
				// 里谢里雅堡 1楼
				1520: [[153, 100, 1500], [41, 50, 1520],],
				// 里谢里雅堡 2楼
				1521: [[153, 100, 1500], [41, 50, 1520], [74, 19, 1521],],
				// 启程之间
				1522: [[153, 100, 1500], [41, 50, 1520], [45, 20, 1522],],
				// 召唤之间
				1530: [[153, 100, 1500], [47, 85, 1530],],
				// 回廊
				1531: [[153, 100, 1500], [47, 85, 1530], [27, 8, 1531],],
				// 召唤之间(新手房，无法再次进入)
				1533: [[153, 100, 1500], [47, 85, 1533],],
				// 召唤之间(新手房，无法再次进入)
				1534: [[153, 100, 1500], [47, 85, 1534],],
				// 召唤之间(新手房，无法再次进入)
				1535: [[153, 100, 1500], [47, 85, 1535],],
				// 召唤之间(新手房，无法再次进入)
				1536: [[153, 100, 1500], [47, 85, 1535],],
				// 召唤之间(新手房，无法再次进入)
				1537: [[153, 100, 1500], [47, 85, 1535],],
				// 饲养师之家
				1810: [[122, 36, 1810],],
				// 灵堂
				11015: [[153, 100, 1500], [47, 85, 1530], [27, 8, 1531], [23, 19, 11015],],
				// 豪宅
				21005: [[96, 148, 21005],],
				// 镜中的豪宅  阁楼
				21011: [[(cb) => {
					cga.walkList([
						[96, 149, '豪宅'],
						[33, 22, '豪宅  地下'],
						[9, 5, '豪宅'],
						[33, 10, '镜中的豪宅'],
					], () => {
						cga.askNpcForObj({ act: 'item', target: '一楼食品库的钥匙', npcpos: [35, 1] }, () => {
							cga.askNpcForObj({ act: 'map', target: '镜中的豪宅', pos: [36, 11], npcpos: [36, 10] }, () => {
								cga.walkList([
									[27, 67, '豪宅'],
									[58, 66, '豪宅  地下'],
									[41, 23, '豪宅'],
									[59, 6, '豪宅  2楼'],
									[16, 9, '镜中的豪宅  2楼'],
								], () => {
									cga.askNpcForObj({ act: 'item', target: '二楼房间的钥匙', npcpos: [41, 10] }, () => {
										cga.askNpcForObj({ act: 'map', target: '镜中的豪宅  2楼', pos: [40, 18], npcpos: [40, 17] }, () => {
											cga.walkList([
												[17, 61, '豪宅  2楼'],
												[5, 23, '豪宅  阁楼'],
												[14, 30, '镜中的豪宅  阁楼'],
												[14, 36, '镜中的豪宅  2楼'],
											], () => {
												cga.askNpcForObj({ act: 'item', target: '阁楼的钥匙', npcpos: [12, 35] }, () => {
													cga.walkList([
														[16, 51, '镜中的豪宅  阁楼'],
													], () => {
														cga.askNpcForObj({ act: 'map', target: '镜中的豪宅  阁楼', pos: [23, 18], npcpos: [23, 19] }, () => {
															cga.walkList([
																[23, 11],
															], cb);
														})
													});
												})
											});
										})
									})
								});
							})
						})
					})
				}, null, 21007],],
				// 客房
				32830: [[219, 136, 1101], [27, 20, 1102], [10, 17, 32830],],
				// 学气功弹
				'气功弹': [[(cb) => {
					cga.travel.autopilot(1400, cb)
				}, null, 1400], [15, 6, 1401], [15, 57]],
				'东门': [[281, 88, 100],],
				'西门': [[22, 87, 100],],
				'南门': [[153, 241, 100],],
			},
			walkReverse: {
				// 拿潘食品店
				1062: [[3, 13, 1000],],
				// 职业公会
				1092: [[9, 24, 1000],],
				// 科特利亚酒吧
				1101: [[10, 16, 1000]],
				// 酒吧里面
				1102: [[4, 15, 1101]],
				// 客房
				1104: [[2, 7, 1102]],
				// 客房
				1105: [[3, 7, 1102]],
				// 西门医院
				1111: [[12, 42, 1000]],
				// 东门医院
				1112: [[12, 42, 1000]],
				// 凯蒂夫人的店
				1031: [[4, 13, 1000]],
				// 强哥杂货店
				1051: [[15, 24, 1000],],
				// 银行
				1121: [[2, 13, 1000],],
				// 葛利玛的家
				1150: [[2, 9, 1000],],
				// 艾文蛋糕店
				1151: [[0, 9, 1000],],
				// 毕夫鲁的家
				1152: [[10, 14, 1000],],
				// 冒险者旅馆
				1154: [[7, 29, 1000],],
				// 流行商店
				1162: [[0, 9, 1000],],
				// 冒险者旅馆 2楼
				1164: [[20, 24, 1154],],
				// 安其摩酒吧
				1170: [[16, 23, 1000],],
				// 弓箭手公会
				1181: [[8, 16, 1000]],
				// 公寓
				1187: [[15, 25, 1000]],
				// 公寓2楼
				1188: [[15, 9, 1187]],
				// 美容院
				1189: [[4, 14, 1000]],
				// 职业介绍所
				1091: [[2, 10, 1000]],
				// 大圣堂的入口
				1201: [[14, 23, 1000]],
				// 礼拜堂
				1202: [[12, 45, 1201]],
				// 2楼客房
				1206: [[43, 40, 1201]],
				// 大圣堂里面
				1207: [[14, 21, 1202]],
				// 大圣堂里面
				1208: [[(cb) => {
					cga.walkList([[14, 20]], () => {
						cga.waitForLocation({ mapindex: 1207 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1400],],
				// 竞技场的入口
				1400: [[15, 23, 1000]],
				// 竞技场
				1401: [[(cb) => {
					cga.walkList([[34, 67]], () => {
						cga.waitForLocation({ mapindex: 1400 }, cb);
						cga.turnDir(0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1400],],
				// 后台
				1402: [[24, 34, 1401]],
				// 治愈的广场
				1403: [[5, 31, 1400]],
				// 休息室
				1404: [[19, 4, 1400]],
				// 升官图房间2
				1420: [[(cb) => {
					cga.walkList([[9, 1]], () => {
						cga.waitForLocation({ mapindex: 1404 }, cb);
						cga.turnDir(5);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1404],],
				// 升官图房间2
				1421: [[(cb) => {
					cga.walkList([[3, 1]], () => {
						cga.waitForLocation({ mapindex: 1404 }, cb);
						cga.turnDir(5);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1404],],
				// 升官图
				1422: [[(cb) => {
					cga.walkList([[9, 1]], () => {
						cga.waitForLocation({ mapindex: 1404 }, cb);
						cga.turnDir(7);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, -1);
						});
					});
				}, null, 1404],],
				// 升官图导览间
				1423: [[0, 9, 1424]],
				// 升官图走廊
				1424: [[4, 0, 1404]],
				// 竞技场
				1450: [[15, 8, 1403]],
				// 竞技场
				1451: [[22, 13, 1450]],
				// 竞技场
				1452: [[15, 8, 1451]],
				// 竞技场
				1453: [[22, 8, 1452]],
				// 竞技场
				1454: [[15, 8, 1453]],
				// 竞技场
				1455: [[21, 17, 1454]],
				// 休息室
				1456: null,
				// 竞技预赛会场
				1457: null,
				// 里谢里雅堡
				1500: [[41, 98, 1000],],
				// 厨房
				1502: [[9, 16, 1520],],
				// 图书室
				1504: [[29, 18, 1521],],
				// 食堂
				1506: [[17, 19, 1521],],
				// 客房
				1507: [[8, 14, 1521],],
				// 客房
				1508: [[8, 14, 1521],],
				// 客房
				1509: [[8, 14, 1521],],
				// 客房
				1510: [[8, 14, 1521],],
				// 谒见之间
				1511: [[9, 19, 1521],],
				// 寝室
				1512: [[0, 7, 1518],],
				// 走廊
				1518: [[0, 3, 1511],],
				// 里谢里雅堡 1楼
				1520: [[74, 40, 1500],],
				// 里谢里雅堡 2楼
				1521: [[49, 80, 1500],],
				// 启程之间
				1522: [[25, 24, 1520],],
				// 召唤之间
				1530: [[3, 7, 1500],],
				// 回廊
				1531: [[44, 15, 1530],],
				// 召唤之间
				1533: [[3, 7, 1500],],
				// 召唤之间
				1534: [[3, 7, 1500],],
				// 召唤之间
				1535: [[3, 7, 1500],],
				// 召唤之间
				1536: [[3, 7, 1500],],
				// 召唤之间
				1537: [[3, 7, 1500],],
				// 饲养师之家
				1810: [[10, 17, 1000],],
				// 灵堂
				11015: [[31, 48, 1531],],
				// 豪宅
				21005: [[18, 34, 1000],],
				// 客房
				32830: [[2, 7, 1102]],
			},
		},
		'圣拉鲁卡村': {
			mainName: '圣拉鲁卡村',
			mainindex: 2300,
			minindex: 2300,
			maxindex: 2399,
			entrance: {
				'入口': [134, 218, 2300],
				'北门': [134, 218, 2300],
			},
			stoneNPCpos: [15, 3],
			mapTranslate: {
				'主地图': 2300,
				'圣拉鲁卡村': 2300,
				'装备品店': 2301,
				'1楼小房间': 2302,
				'地下工房': 2303,
				'食品店': 2306,
				'酒吧': 2308,
				'赛杰利亚酒吧': 2308,
				'医院': 2310,
				'医院 2楼': 2311,
				'村长的家': 2312,
				'村长的家 2楼': 2313,
				'民家': 2320,//民家，学强力风刃魔法
				'传送石': 2399,
				'出口': '北门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2300: [],
				// 装备品店
				2301: [[32, 70, 2301],],
				// 1楼小房间
				2302: [[32, 70, 2301], [14, 4, 2302],],
				// 地下工房
				2303: [[32, 70, 2301], [14, 4, 2302], [9, 3, 2303],],
				// 食品店
				2306: [[50, 64, 2306],],
				// 赛杰利亚酒吧
				2308: [[39, 70, 2308],],
				// 医院
				2310: [[37, 50, 2310],],
				// 医院 2楼
				2311: [[37, 50, 2310], [14, 11, 2311],],
				// 村长的家
				2312: [[49, 81, 2312],],
				// 村长的家 2楼
				2313: [[49, 81, 2312], [6, 14, 2313],],
				// 传送石
				2399: [[49, 81, 2312], [8, 10, 2399],],
				// 北门
				'北门': [[52, 55, 100],],
			},
			walkReverse: {
				// 装备品店
				2301: [[19, 15, 2300],],
				// 1楼小房间
				2302: [[11, 5, 2301], [19, 15, 2300],],
				// 地下工房
				2303: [[23, 4, 2302], [11, 5, 2301], [19, 15, 2300],],
				// 食品店
				2306: [[1, 8, 2300]],
				// 赛杰利亚酒吧
				2308: [[2, 9, 2300]],
				// 医院
				2310: [[1, 9, 2300]],
				// 医院 2楼
				2311: [[14, 12, 2310]],
				// 村长的家
				2312: [[2, 9, 2300],],
				// 村长的家 2楼
				2313: [[7, 8, 2312],],
				// 传送石
				2399: [[7, 3, 2312],],
			},
		},
		/**
		 * 往阿凯鲁法栈桥：上船NPC 52,50,船上地图为【艾欧奇亚号】,index41001,船员NPC 71,26
		 * 往哥拉尔栈桥：上船NPC 52,50,船上地图为【铁达尼号】,index41023,船员NPC 71,26
		 * 其实就是地图index不同，NPC位置都一样
		 */
		'伊尔村': {
			mainName: '伊尔村',
			mainindex: 2000,
			minindex: 2000,
			maxindex: 2099,
			entrance: {
				'入口': [681, 343, 2000],
				'北门': [681, 343, 2000],
			},
			stoneNPCpos: [21, 10],
			mapTranslate: {
				'主地图': 2000,
				'伊尔村': 2000,
				'装备店': 2001,
				'酒吧': 2002,
				'旧金山酒吧': 2002,
				'医院': 2010,
				'村长的家': 2012,
				'泰勒的家': 2013,
				'巴侬的家': 2014,
				'传送石': 2099,
				'伊尔': 33219,
				'港湾管理处': 33214,
				'往阿凯鲁法栈桥': 40001,
				'往哥拉尔栈桥': 40002,
				'出口': '北门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2000: [],
				// 装备店
				2001: [[35, 25, 2001],],
				// 酒吧
				2002: [[32, 65, 2008],],
				// 医院
				2010: [[52, 39, 2010],],
				// 村长的家
				2012: [[47, 83, 2012],],
				// 泰勒的家
				2013: [[35, 42, 2013],],
				// 巴侬的家
				2014: [[42, 72, 2014],],
				// 传送石
				2099: [[47, 83, 2012], [14, 17, 2099],],
				// 港湾管理处
				33214: [[(cb) => {
					cga.travel.autopilot(33219, cb)
				}, null, 33219], [30, 21, 33214]],
				// 伊尔
				33219: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33219, npcpos: [59, 71] }, cb)
				}, null, 33219],],
				// 往阿凯鲁法栈桥
				40001: [[(cb) => {
					cga.travel.autopilot(33219, cb)
				}, null, 33219], [30, 21, 33214],[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 40001, npcpos: [23, 23] }, cb)
				}, null, 40001]],
				// 往阿凯鲁法栈桥
				40002: [[(cb) => {
					cga.travel.autopilot(33219, cb)
				}, null, 33219], [30, 21, 33214],[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 40002, npcpos: [23, 23] }, cb)
				}, null, 40002]],
				// 北门
				'北门': [[45, 31, 100]]
			},
			walkReverse: {
				// 装备店
				2001: [[5, 13, 2000],],
				// 酒吧
				2002: [[7, 19, 2000],],
				// 医院
				2010: [[14, 20, 2000],],
				// 村长的家
				2012: [[6, 13, 2000]],
				// 泰勒的家
				2013: [[9, 16, 2000],],
				// 巴侬的家
				2014: [[2, 9, 2000],],
				// 传送石
				2099: [[12, 17, 2012],],
				// 伊尔
				33219:[[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 2000, npcpos: [24, 18] }, cb)
				}, null, 2000],],
				// 港湾管理处
				33214: [[9, 22, 33219],],
				// 往阿凯鲁法栈桥
				40001: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33214, npcpos: [19, 54] }, cb)
				}, null, 33214],],
				// 往哥拉尔栈桥
				40002: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33214, npcpos: [19, 54] }, cb)
				}, null, 33214],],
			},
		},
		'亚留特村': {
			mainName: '亚留特村',
			mainindex: 2400,
			minindex: 2400,
			maxindex: 2499,
			entrance: {
				'北门': [587, 51, 2400],
				'东门': [596, 84, 2400],
			},
			stoneNPCpos: [5, 14],
			mapTranslate: {
				'主地图': 2400,
				'伊尔村': 2400,
				'杂货店': 2401,
				'医院': 2410,
				'村长的家': 2412,
				'民家': 2420,
				'南希的家': 2421,
				'传送石': 2499,
				'北门': '北门',
				'东门': '东门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2400: [],
				// 杂货店
				2401: [[37, 44, 2401],],
				// 医院
				2410: [[52, 63, 2410],],
				// 村长的家
				2412: [[56, 48, 2412],],
				// 民家
				2420: [[48, 37, 2420],],
				// 南希的家
				2421: [[31, 54, 2421],],
				// 传送石
				2499: [[56, 48, 2412], [22, 9, 2499],],
				// 北门
				'北门': [[59, 31, 100],],
				// 东门
				'东门': [[66, 64, 100],],
			},
			walkReverse: {
				// 杂货店
				2401: [[15, 22, 2400],],
				// 医院
				2410: [[2, 9, 2400],],
				// 村长的家
				2412: [[6, 13, 2400]],
				// 民家
				2420: [[9, 16, 2400],],
				// 南希的家
				2421: [[2, 9, 2400],],
				// 传送石
				2499: [[8, 3, 2412],],
			},
		},
		'维诺亚村': {
			mainName: '维诺亚村',
			mainindex: 2100,
			minindex: 2100,
			maxindex: 2199,
			entrance: {
				'入口': [330, 480, 2100],
				'东门': [330, 480, 2100],
			},
			stoneNPCpos: [5, 4],
			mapTranslate: {
				'主地图': 2100,
				'维诺亚村': 2100,
				'装备品店': 2101,
				'医院': 2110,
				'医院2楼': 2111,
				'村长的家': 2112,
				'糖店': 2113,//卖糖NPCpos[12,6]，人物购买点[11,6]
				'荷特尔咖哩店': 2120,
				'民家': 2121,
				'村长家的小房间': 2198,
				'传送石': 2199,
				'出口': '东门',
				'东门': '东门'
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				2100: [],
				// 装备品店
				2101: [[62, 42, 2101],],
				// 医院
				2110: [[61, 53, 2110],],
				// 医院2楼
				2111: [[61, 53, 2110], [6, 14, 2111],],
				// 村长的家
				2112: [[40, 36, 2112],],
				// 糖店
				2113: [[40, 36, 2112], [18, 10, 2198], [9, 5, 2113],],
				// 荷特尔咖哩店
				2120: [[49, 58, 2120],],
				// 民家
				2121: [[37, 52, 2121],],
				// 村长家的小房间
				2198: [[40, 36, 2112], [18, 10, 2198],],
				// 传送石
				2199: [[40, 36, 2112], [18, 10, 2198], [8, 2, 2199],],
				// 东门
				'东门': [[67, 46, 100],],
			},
			walkReverse: {
				// 装备品店
				2101: [[19, 17, 2100],],
				// 医院
				2110: [[2, 9, 2100],],
				// 医院2楼
				2111: [[9, 12, 2110],],
				// 村长的家
				2112: [[9, 16, 2100],],
				// 糖店
				2113: [[3, 11, 2198]],
				// 荷特尔咖哩店
				2120: [[3, 9, 2100]],
				// 民家
				2121: [[3, 9, 2100]],
				// 村长家的小房间
				2198: [[0, 5, 2112]],
				// 传送石
				2199: [[5, 1, 2198],],
			},
		},
		'奇利村': {
			mainName: '奇利村',
			mainindex: 3200,
			minindex: 3200,
			maxindex: 3299,
			entrance: {
				'北门': [274, 294, 3200],
				'东门': [294, 325, 2100],
			},
			stoneNPCpos: [13, 8],
			mapTranslate: {
				'主地图': 3200,
				'奇利村': 3200,
				'装备品店': 3201,
				'杂货店': 3202,
				'酒吧': 3208,
				'医院': 3210,
				'村长的家': {
					3212: '村长主客厅',
					3213: '村长左手边屋子',
					3214: '村长右手边屋子，通往传送石',
				},
				// 诱拐任务相关
				'民家': 3220,
				// 诱拐任务相关
				'老夫妇的家': 3221,
				'传送石': 3299,
				'北门': '北门',
				'东门': '东门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				3200: [],
				// 装备品店
				3201: [[66, 77, 3201],],
				// 杂货店
				3202: [[66, 77, 3201], [23, 14, 3202],],
				// 酒吧
				3208: [[46, 78, 3208],],
				// 医院
				3210: [[64, 56, 3210],],
				// 民家
				3220: [[71, 63, 3220],],
				// 老夫妇的家
				3221: [[50, 54, 3221],],
				// 村长的家
				3212: [[50, 63, 3212],],
				// 村长的家
				3213: [[50, 63, 3212], [10, 2, 3213],],
				// 村长的家
				3214: [[50, 63, 3212], [10, 15, 3214],],
				// 传送石
				3299: [[50, 63, 3212], [10, 15, 3214], [5, 3, 3299],],
				// 北门
				'北门': [[59, 45, 300],],
				// 东门
				'东门': [[79, 76, 300],],
			},
			walkReverse: {
				// 装备品店
				3201: [[12, 14, 3200],],
				// 杂货店
				3202: [[13, 12, 3201],],
				// 酒吧
				3208: [[2, 3, 3200],],
				// 医院
				3210: [[3, 9, 3200],],
				// 民家
				3220: [[3, 9, 3200],],
				// 老夫妇的家
				3221: [[9, 15, 3200],],
				// 村长的家
				3212: [[1, 8, 3200]],
				// 村长的家
				3213: [[7, 13, 3212]],
				// 村长的家
				3214: [[7, 1, 3212]],
				// 传送石
				3299: [[7, 6, 3214],],
			},
		},
		'加纳村': {
			mainName: '加纳村',
			mainindex: 3000,
			minindex: 3000,
			maxindex: 3099,
			entrance: {
				'入口': [702, 147, 3000],
				'南门': [702, 147, 3000],
			},
			stoneNPCpos: [15, 7],
			mapTranslate: {
				'主地图': 3000,
				'加纳村': 3000,
				'装备品店': 3001,
				'杂货店': 3002,
				'酒吧': 3008,
				'医院': 3010,
				'村长的家': {
					3012: '村长主客厅',
					3013: '村长左手边屋子',
					3014: '村长右手边屋子',
				},
				'传承者之家': 3021,
				'传送石': 3099,
				'井的底部': 5005,
				'希尔薇亚的家': 5006,
				'出口': '南门',
				'南门': '南门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				3000: [],
				// 装备品店
				3001: [[63, 61, 3001],],
				// 杂货店
				3002: [[63, 61, 3001], [24, 14, 3002],],
				// 酒吧
				3008: [[51, 34, 3008],],
				// 医院
				3010: [[52, 72, 3010],],
				// 村长的家
				3012: [[36, 40, 3012],],
				// 村长的家
				3013: [[36, 40, 3012], [10, 16, 3013],],
				// 村长的家
				3014: [[36, 40, 3012], [10, 3, 3014],],
				// 传承者之家
				3021: [[34, 53, 3021],],
				// 传送石
				3099: [[36, 40, 3012], [17, 6, 3099],],
				// 井的底部
				5005: [[(cb) => {
					cga.walkList(
						[[53, 56]], () => {
							cga.turnTo(53, 55);
							cga.AsyncWaitMovement({ map: '井的底部', delay: 1000, timeout: 5000 }, cb);
						});
				}, null, 5005],],
				// 希尔薇亚的家
				5006: [[(cb) => {
					cga.walkList(
						[[53, 56]], () => {
							cga.turnTo(53, 55);
							cga.AsyncWaitMovement({ map: '井的底部', delay: 1000, timeout: 5000 }, cb);
						});
				}, null, 5005], [18, 14, 5006]],
				// 南门
				'南门': [[47, 77, 300],],
			},
			walkReverse: {
				// 装备品店
				3001: [[13, 14, 3000],],
				// 杂货店
				3002: [[13, 11, 3001],],
				// 酒吧
				3008: [[3, 3, 3000],],
				// 医院
				3010: [[3, 9, 3000],],
				// 村长的家
				3012: [[1, 9, 3000]],
				// 村长的家
				3013: [[7, 1, 3012]],
				// 村长的家
				3014: [[7, 13, 3012]],
				// 传承者之家
				3021: [[9, 15, 3000],],
				// 传送石
				3099: [[5, 12, 3012],],
				// 井的底部
				5005: [[5, 4, 3000],],
				// 希尔薇亚的家
				5006: [[7, 10, 5005],],
			},
		},
		'杰诺瓦镇': {
			mainName: '杰诺瓦镇',
			mainindex: 4000,
			minindex: 4000,
			maxindex: 4099,
			entrance: {
				'东门': [264, 434, 4000],
				'西门': [217, 456, 4000],
				'北门': [224, 443, 4000],
			},
			stoneNPCpos: [7, 7],
			mapTranslate: {
				'主地图': 4000,
				'杰诺瓦镇': 4000,
				'杂货店': 4001,
				'装备品店': 4002,
				'酒吧': 4008,
				'酒吧的地下室': 4009,
				'客房': {
					4021: '咒术师德托拉',
					4022: '空房间',
				},
				'医院': 4010,
				'医院2楼': 4011,
				'村长的家': {
					4012: '村长主客厅',
					4013: '村长右手边屋子，空房间',
				},
				// 起司的任务相关
				'民家': 4020,
				'传送石': 4099,
				'东门': '东门',
				'西门': '西门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4000: [],
				// 杂货店
				4001: [[43, 23, 4001],],
				// 装备品店
				4002: [[43, 23, 4001], [9, 6, 4002],],
				// 酒吧
				4008: [[48, 53, 4008],],
				// 酒吧的地下室
				4009: [[48, 53, 4008], [19, 6, 4009],],
				// 医院
				4010: [[44, 33, 4010],],
				// 医院2楼
				4011: [[44, 33, 4010], [15, 13, 4011],],
				// 民家
				4020: [[38, 59, 4020]],
				// 客房
				4021: [[48, 53, 4008], [19, 6, 4009], [3, 13, 4021],],
				// 客房
				4022: [[48, 53, 4008], [19, 6, 4009], [3, 5, 4022],],
				// 村长的家
				4012: [[58, 43, 4012],],
				// 村长的家
				4013: [[58, 43, 4012], [15, 16, 4013],],
				// 传送石
				4099: [[58, 43, 4012], [13, 7, 4099],],
				'东门': [[71, 18, 400],],
				'西门': [[24, 40, 400],],
				'北门': [[31, 27, 400],],
			},
			walkReverse: {
				// 杂货店
				4001: [[9, 16, 4000],],
				// 装备品店
				4002: [[7, 4, 4001],],
				// 酒吧
				4008: [[4, 9, 4000],],
				// 酒吧的地下室
				4009: [[8, 4, 4008],],
				// 医院
				4010: [[1, 9, 4000],],
				// 医院2楼
				4011: [[15, 11, 4010],],
				// 村长的家
				4012: [[1, 9, 4000]],
				// 村长的家
				4013: [[7, 1, 4012]],
				// 民家
				4020: [[1, 10, 4000]],
				// 客房
				4021: [[12, 6, 4009],],
				// 客房
				4022: [[12, 6, 4009],],
				// 传送石
				4099: [[14, 6, 4012],],
			},
		},
		'阿斯提亚镇': {// UD（开启者/时空之门）任务相关。
			mainName: '阿斯提亚镇',
			mainindex: 4100,
			minindex: 4100,
			maxindex: 4199,
			stoneNPCpos: null,
			mapTranslate: {
				'主地图': 4100,
				'阿斯提亚镇': 4100,
				'神殿': {
					4130: '阿斯提亚镇进入神殿的第一个房间',
					4141: '阿斯提亚镇回复之间对称房间，暂时没发现有什么用',
					4143: '其它任务（非UD任务）相关',
					4144: '空房间，暂时没发现有什么用',
					4145: '其它任务（非UD任务）相关',
				},
				'回复之间': 4140,
				'医院': 4140,
				'大厅': 4142,
				'出口': '南门',
				'南门': '南门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4100: [],
				// 神殿
				4130: [[101, 72, 4130],],
				// 回复之间
				4140: [[101, 72, 4130], [25, 11, 4140],],
				// 神殿
				4141: [[101, 72, 4130], [25, 32, 4141],],
				// 大厅
				4142: [[101, 72, 4130], [20, 22, 4142],],
				// 神殿
				4143: [[101, 72, 4130], [20, 22, 4142], [19, 0, 4143],],
				// 神殿
				4144: [[101, 72, 4130], [20, 22, 4142], [20, 47, 4144],],
				// 神殿
				4145: [[101, 72, 4130], [20, 22, 4142], [19, 0, 4143], [12, 4, 4145],],
				'南门': [[61, 130, 14016],],
			},
			walkReverse: {
				// 神殿
				4130: [[8, 23, 4100],],
				// 回复之间
				4140: [[5, 9, 4130],],
				// 神殿
				4141: [[3, 18, 4130],],
				// 大厅
				4142: [[9, 23, 4130],],
				// 神殿
				4143: [[13, 25, 4142],],
				// 神殿
				4144: [[15, 4, 4142],],
				// 神殿
				4145: [[16, 5, 4143],],
			},
		},
		'蒂娜村': {
			mainName: '蒂娜村',
			mainindex: 4200,
			minindex: 4200,
			maxindex: 4299,
			entrance: {
				'南门': [584, 316, '蒂娜村'],
				'北门': [570, 275, '蒂娜村'],
			},
			stoneNPCpos: [6, 5],
			mapTranslate: {
				'主地图': 4200,
				'蒂娜村': 4200,
				'酒吧': 4208,
				'医院': 4210,
				'医院2楼': 4211,
				'村长的家': {
					4212: '村长家走廊',
					4213: '村长家客厅',
					4214: '传送石前面的屋子',
				},
				'民家': 4220,
				'传送石': 4299,
				'南门': '南门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4200: [],
				// 酒吧
				4208: [[46, 56, 4208],],
				// 医院
				4210: [[34, 25, 4210],],
				// 医院2楼
				4211: [[34, 25, 4210], [15, 13, 4211],],
				// 村长的家
				4212: [[29, 60, 4212],],
				// 村长的家
				4213: [[29, 60, 4212], [9, 6, 4213],],
				// 村长的家
				4214: [[29, 60, 4212], [9, 6, 4213], [7, 12, 4214],],
				// 民家
				4220: [[35, 37, 4220]],
				// 传送石
				4299: [[29, 60, 4212], [9, 6, 4213], [7, 12, 4214], [12, 6, 4299],],
				'南门': [[43, 62, 400],],
				'北门': [[29, 21, 400],],
			},
			walkReverse: {
				// 酒吧
				4208: [[6, 7, 4200],],
				// 医院
				4210: [[1, 9, 4200],],
				// 医院2楼
				4211: [[15, 11, 4210],],
				// 村长的家
				4212: [[1, 6, 4200]],
				// 村长的家
				4213: [[1, 6, 4212]],
				// 村长的家
				4214: [[7, 1, 4213]],
				// 民家
				4220: [[1, 10, 4200]],
				// 传送石
				4299: [[11, 2, 4214],],
			},
		},
		'夜晚蒂娜村': {//主地图4201的33，25处有1级绿鬼捕捉点
			mainName: '蒂娜村',
			mainindex: 4201,
			minindex: 4201,
			maxindex: 4299,
			entrance: {
				'南门': [584, 316, '蒂娜村'],
				'北门': [570, 275, '蒂娜村'],
			},
			mapTranslate: {
				'主地图': 4201,
				'蒂娜村': 4201,
				'夜晚蒂娜村': 4201,
				'酒吧': 4230,
				'村长的家': {
					4212: '村长主客厅',
					4213: '村长右手边屋子，空房间',
				},
				'传送石': 4299,
				'海贼指挥部': 14018,
				'南门': '南门',
				'北门': '北门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4201: [],
				// 酒吧
				4230: [[46, 56, 4230],],
				// 村长的家
				4212: [[58, 43, 4212],],
				// 村长的家
				4213: [[58, 43, 4212], [15, 16, 4213],],
				// 传送石
				4299: [[29, 60, 4212], [9, 6, 4213], [7, 12, 4214], [12, 6, 4299],],
				// 海贼指挥部
				14018: (r) => {
					var nowindex = cga.GetMapIndex().index3
					if (nowindex == 4230) {
						cga.walkList([
							[22, 11],
						], () => {
							cga.turnTo(22, 13);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitMovement({ map: 14018 }, r);
							}, 1000);
						});
					} else {
						cga.travel.autopilot('夜晚蒂娜村', () => {
							cga.travel.autopilot(4230, () => {
								cga.travel.autopilot(14018, r)
							})
						})
					}
				},
				'南门': [[43, 62, 400],],
				'北门': [[29, 21, 400],],
			},
			walkReverse: {
				// 酒吧
				4230: [[6, 7, 4201],],
				// 村长的家
				4212: [[1, 9, 4200]],
				// 村长的家
				4213: [[7, 1, 4212]],
				// 传送石
				4299: [[14, 6, 4212],],
			},
		},
		'阿巴尼斯村': {
			mainName: '阿巴尼斯村',
			mainindex: 4300,
			minindex: 4300,
			maxindex: 4399,
			entrance: {
				'入口': [183, 161, 4300],
				'南门': [183, 161, 4300],
			},
			stoneNPCpos: [5, 15],
			mapTranslate: {
				'主地图': 4300,
				'阿巴尼斯村': 4300,
				'酒吧': 4308,
				'酒吧的地下室': 4309,
				'客房': {
					4321: '空房间',
					4322: '也是空房间',
				},
				'医院': 4310,
				'村长的家': {
					4312: '村长家走廊',
					4313: '村长的屋子',
				},
				'民家': 4320,
				'民家地下': {
					4331: 'UD任务相关，无法直接进入。',
					4332: 'UD任务相关，无法直接进入。',
					4333: 'UD任务相关，无法直接进入。',
					4334: 'UD任务相关，无法直接进入。',
				},
				'传送石': 4399,
				'出口': '南门',
				'南门': '南门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4300: [],
				// 酒吧
				4308: [[67, 64, 4308],],
				// 酒吧的地下室
				4309: [[67, 64, 4308], [11, 14, 4309],],
				// 医院
				4310: [[47, 64, 4310],],
				// 民家
				4320: [[38, 59, 4320]],
				// 客房
				4321: [[67, 64, 4308], [11, 14, 4309], [12, 4, 4321],],
				// 客房
				4322: [[67, 64, 4308], [11, 14, 4309], [7, 4, 4322],],
				// 村长的家
				4312: [[36, 54, 4312],],
				// 村长的家
				4313: [[36, 54, 4312], [6, 5, 4313],],
				// 民家
				4320: [[40, 30, 4320],],
				// 民家，UD任务相关
				4333: [[null, null, 4333],],
				// 民家，UD任务相关
				4334: [[9, 4, 4334],],
				// 传送石
				4399: [[36, 54, 4312], [6, 5, 4313], [9, 9, 4399],],
				// 南门
				'南门': [[37, 71, 402],],
			},
			walkReverse: {
				// 酒吧
				4308: [[5, 8, 4300],],
				// 酒吧的地下室
				4309: [[5, 7, 4308],],
				// 医院
				4310: [[1, 8, 4300],],
				// 村长的家
				4312: [[6, 13, 4300]],
				// 村长的家
				4313: [[6, 13, 4312]],
				// 民家
				4320: [[11, 17, 4300]],
				// 客房
				4321: [[7, 12, 4309],],
				// 客房
				4322: [[7, 12, 4309],],
				// 民家，UD任务相关
				4332: [[5, 3, 4333],],
				// 民家，UD任务相关
				4333: [[9, 4, 4334],],
				// 民家，UD任务相关
				4335: [[7, 3, 4320],],
				// 传送石
				4399: [[5, 4, 4313],],
			},
		},
		'魔法大学': {
			mainName: '魔法大学',
			mainindex: 4400,
			minindex: 4400,
			maxindex: 4499,
			entrance: {
				'入口': [118, 100, 4400],
				'南门': [118, 100, 4400],
			},
			mapTranslate: {
				'主地图': 4400,
				'魔法大学': 4400,
				// 说话选【是】，可以进到牢房，里面有19级左右史莱姆
				'实验室': 4401,
				'地下实验室': 4402,
				'青龙的洞窟 1楼': 4403,
				'魔法大学内部': 4410,
				// 魔法大学内部即为补给处，这里自定义为医院，用于cga.tohospital()
				'医院': 4410,
				// 幻之钢、幻之银压条。木材、矿石换钱
				'技术室': 4411,
				// 6级、8级布
				'更衣室': 4412,
				// 只能卖给NPC物品，猜测是狩猎物品
				'调理室': 4413,
				// 三转的第一个房间，无法直接进入，必须做任务。可以走出去，传送至魔法大学内部。
				'教室': 4415,
				'教师室': 4416,
				'音乐室': 4417,
				'礼堂': 4418,
				'学长室': 4419,
				'保健室': 4420,
				// 三转的晋级资格对话房间，无法直接进入，必须做任务。可以走出去，传送至礼堂。
				'合格房间': 4421,
				'家畜小屋': {
					4422: '空房子',
					4423: '也是空房子',
					4424: '还是空房子',
				},
				// 里面有僵尸可以拿到调音器，估计是任务
				'夜晚音乐室': 4431,
				// 18,9处（玩家站立18,10处）购买魔法手套。由于另外4个仓库内部的房子里面没有有用的NPC，故省略
				'仓库内部': 4455,
				'地底湖 地下1楼': 4456,
				'地底湖 地下2楼': 4457,
				'出口': '南门',
				'南门': '南门',
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				4400: [],
				// 实验室
				4401: [[133, 49, 4401],],
				// TODO地下实验室，需要对话才可进入
				4402: [],
				// 青龙的洞窟 1楼
				4403: [[106, 54, 4403],],
				// 魔法大学内部
				4410: [[75, 93, 4410],],
				// 技术室
				4411: [[75, 93, 4410], [50, 43, 4411],],
				// 更衣室
				4412: [[75, 93, 4410], [29, 43, 4412],],
				// 调理室
				4413: [[75, 93, 4410], [14, 43, 4413],],
				// 教师室
				4416: [[75, 93, 4410], [4, 30, 4416],],
				// 音乐室
				4417: [[75, 93, 4410], [76, 30, 4417],],
				// 礼堂
				4418: [[75, 93, 4410], [44, 17, 4418],],
				// 学长室
				4419: [[75, 93, 4410], [44, 17, 4418], [4, 9, 4419],],
				// 保健室
				4420: [[75, 93, 4410], [44, 17, 4418], [24, 9, 4420],],
				// 家畜小屋
				4422: [[55, 140, 4422],],
				// 家畜小屋
				4423: [[55, 147, 4423],],
				// 家畜小屋
				4424: [[55, 154, 4424],],
				// 夜晚音乐室
				4431: [[75, 93, 4410], [76, 30, 4431],],
				// 仓库内部
				4455: [[117, 164, 4455],],
				// 地底湖 地下1楼
				4456: [[(cb) => {
					cga.walkList(
						[[36, 31]], () => {
							cga.turnTo(36, 29);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({ map: '地底湖 地下1楼' }, cb);
								});
							})
						});
				}, null, 4456],],
				// 地底湖 地下2楼
				4457: [[(cb) => {
					cga.walkList(
						[[36, 31]], () => {
							cga.turnTo(36, 29);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({ map: '地底湖 地下1楼' }, cb);
								});
							})
						});
				}, null, 4456], [6, 23, 4457]],
				// 南门
				'南门': [[75, 172, 402],],
			},
			walkReverse: {
				// 实验室
				4401: [[5, 14, 4400],],
				// 地下实验室
				4402: [[22, 7, 4401],],
				// 青龙的洞窟 1楼
				4403: [[24, 49, 4400],],
				// 魔法大学内部
				4410: [[40, 59, 4400],],
				// 技术室
				4411: [[7, 18, 4410],],
				// 更衣室
				4412: [[14, 18, 4410],],
				// 调理室
				4413: [[12, 18, 4410],],
				// 教室
				4415: [[29, 9, 4410],],
				// 教师室
				4416: [[15, 25, 4410],],
				// 音乐室
				4417: [[15, 25, 4410],],
				// 礼堂
				4418: [[15, 32, 4410],],
				// 学长室
				4419: [[17, 4, 4418],],
				// 保健室
				4420: [[3, 4, 4418],],
				// 合格房间
				4421: [[10, 2, 4418],],
				// 家畜小屋
				4422: [[7, 16, 4400],],
				// 家畜小屋
				4423: [[7, 16, 4400],],
				// 家畜小屋
				4424: [[6, 16, 4400],],
				// 夜晚音乐室
				4431: [[15, 25, 4410],],
				// 仓库内部
				4455: [[6, 14, 4400],],
				// 地底湖 地下1楼
				4456: [[10, 32, 4400],],
				// 地底湖 地下2楼
				4457: [[(cb) => {
					var xy = cga.GetMapXY();
					if (xy.x >= 34 && xy.x <= 41 && xy.y >= 47 && xy.y <= 51) {
						cga.walkList(
							[[38, 51]], () => {
								cga.turnDir(2);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({ x: 38, y: 54 }, () => {
										cga.walkList([
											[14, 5, 4456],
										], cb);
									});
								})
							});
					} else {
						cga.walkList([
							[14, 5, 4456],
						], cb);
					}
				}, null, 4456],],
			},
		},
		'曙光骑士团营地': {
			mainName: '曙光骑士团营地',
			mainindex: 27001,
			minindex: 27001,
			maxindex: 27999,
			entrance: {
				'入口': [513, 282, 27001],
				'西门': [513, 282, 27001],
			},
			mapTranslate: {
				'主地图': 27001,
				'曙光骑士团营地': 27001,
				'曙光储备室': 27011,
				'曙光营地医院': 27012,
				'医院': 27012,
				// mapindex是唯一索引，TODO寻找同一index不同pos的索引方法
				// '曙光营地医院 2楼':27012,
				'酒吧': 27013,
				'曙光营地酒吧': 27013,
				'辛希亚探索指挥部': {
					// 一楼二楼是一个index
					27014: '一楼',
					27014: '二楼',
					27101: '传送石',
				},
				// 三个房间都是27015
				'曙光营地指挥部': 27015,
				'传送石': 2399
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				27001: [],
				// 曙光储备室
				27011: [[44, 49, 27011],],
				// 曙光营地医院
				27012: [[42, 56, 27012],],
				// // 曙光营地医院 2楼
				// 27012:[[42, 56, 27012],[15, 12, 27012],],
				// 曙光营地酒吧
				27013: [[55, 58, 27012]],
				// 曙光营地指挥部
				27015: [[52, 67, 27015]],
				// 传送石
				27101: [[55, 47, '辛希亚探索指挥部'], [7, 4, '辛希亚探索指挥部', 91, 6], [95, 9, 27101],],
			},
			walkReverse: {
				// 曙光储备室
				27011: [[12, 22, 27001],],
				// 曙光营地医院
				27012: [[1, 8, 27001],],
				// 曙光营地酒吧
				27013: [[4, 19, 27001],],
				// 辛希亚探索指挥部
				27014: [[(cb) => {
					var XY = cga.GetMapXY();
					if (XY.x > 50) {
						cga.walkList([[91, 6, '辛希亚探索指挥部', 7, 4],], cb);
						return
					} else {
						cga.walkList([[1, 10, 27001],], cb);
						return
					}
				}, null, 27001],],
				// 曙光营地指挥部
				27015: [[(cb) => {
					var XY = cga.GetMapXY();
					if (XY.x > 80) {
						cga.walkList([[85, 2, '曙光营地指挥部', 69, 69],], cb);
						return
					} else if (XY.x > 40) {
						cga.walkList([[53, 80, 27001],], cb);
						return
					} else {// TODO x<40还有一个房间，暂时没去过
						cga.walkList([[85, 2, '曙光营地指挥部', 69, 69],], cb);
						return
					}
				}, null, 27001],],
				// 传送石
				27101: [[19, 28, 27014],],
			},
		},
		'圣骑士营地': {
			mainName: '圣骑士营地',
			mainindex: 44690,
			minindex: 44690,
			maxindex: 44699,
			mapTranslate: {
				'主地图': 44690,
				'酒吧': 44691,
				'医院': 44692,
				'工房': 44693,
				'总部1楼': 44694,
				'银行': 44698,
				'商店': 44699,// 水晶封印卡talkpos14,26，dir0；鉴定talkpos14,16，dir0
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				44690: [],
				// 酒吧
				44691: [[116, 55, 44691],],
				// 医院
				44692: [[95, 72, 44692],],
				// 工房
				44693: [[87, 72, 44693],],
				// 总部1楼
				44694: [[116, 69, 44694],],
				// 银行
				44698: [[116, 105, 44698],],
				// 商店
				44699: [[92, 118, 44699],],
			},
			walkReverse: {
				// 酒吧
				44691: [[0, 23, 44690],],
				// 医院
				44692: [[0, 20, 44690],],
				// 工房
				44693: [[30, 37, 44690],],
				// 总部1楼
				44694: [[4, 47, 44690],],
				// 银行
				44698: [[3, 23, 44690],],
				// 商店
				44699: [[0, 14, 44690],],
			},
		},
		'矮人城镇': {
			mainName: '矮人城镇',
			mainindex: 44750,
			minindex: 44750,
			maxindex: 44750,
			mapTranslate: {
				'主地图': 44750,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				44690: [],
			},
			walkReverse: {

			},
		},
		/**
		 * 往伊尔栈桥：上船NPC 52,50,船上地图为【艾欧奇亚号】,index41001,船员NPC 71,26
		 */
		'阿凯鲁法村': {
			mainName: '阿凯鲁法村',
			mainindex: 33200,
			minindex: 33200,
			maxindex: 33299,
			mapTranslate: {
				'主地图': 33200,
				// 医院和银行在一个index，叫地图名字是【冒险者旅馆 1楼】
				'医院': 33207,
				'银行': 33207,
				'港湾管理处': 33215,
				'阿凯鲁法': 33220,
				'港口':40003,
				'往伊尔栈桥':40003,

			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				33200: [],
				// 医院
				33207: [[196, 208, 33207],],
				// 银行
				33207: [[196, 208, 33207],],
				// 港湾管理处
				33215: [[(cb) => {
					cga.travel.autopilot(33220, cb)
				}, null, 33220], [16, 15, 33215]],
				// 阿凯鲁法
				33220: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33220, npcpos: [56, 176] }, cb)
				}, null, 33220],],
				// 往伊尔栈桥
				40003: [[(cb) => {
					cga.travel.autopilot(33220, cb)
				}, null, 33220], [16, 15, 33215],[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 40003, npcpos: [17, 12] }, cb)
				}, null, 40003]],
			},
			walkReverse: {
				// 医院
				33207: [[16, 23, 33200],],
				// 银行
				33207: [[16, 23, 33200],],
				// 港湾管理处
				33215: [[22, 31, 33220],],
				// 阿凯鲁法
				33220: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33200, npcpos: [29, 30] }, cb)
				}, null, 33200],],
				// 港湾管理处
				40003: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 33215, npcpos: [19, 53] }, cb)
				}, null, 33215],],
			},
		},
		/**
		 * 往伊尔栈桥：上船NPC 52,50,船上地图为【铁达尼号】,index41023,船员NPC 71,26
		 */
		'哥拉尔镇': {
			mainName: '哥拉尔镇',
			mainindex: 43100,
			minindex: 43100,
			maxindex: 43999,
			mapTranslate: {
				'主地图': 43100,
				'医院': 43110,
				'银行': 43125,
				'宠物商店': 43145,
				'杂货店': 43165,
				'港湾管理处': 43190,
				'港口':40006,
				'往伊尔栈桥':40006,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				43100: [],
				// 医院
				43110: [[165, 90, 43110],],
				// 银行
				43125: [[167, 66, 43125],],
				// 宠物商店
				43145: [[109, 80, 43145],],
				// 杂货店
				43165: [[147, 79, 43165],],
				// 哥拉尔镇 港湾管理处
				43190: [[96, 211, 43190],],
				// 往伊尔栈桥
				40006: [[(cb) => {
					cga.travel.autopilot(43190, cb)
				}, null, 43190], [(cb) => {
					cga.askNpcForObj({ act: 'map', target: 40006, npcpos: [8, 3] }, cb)
				}, null, 40006]],
			},
			walkReverse: {
				// 医院
				43110: [[9, 22, 43100],],
				// 银行
				43125: [[11, 12, 43100],],
				// 宠物商店
				43145: [[18, 30, 43100],],
				// 杂货店
				43165: [[18, 30, 43100],],
				// 哥拉尔镇 港湾管理处
				43190: [[14, 15, 43100],],
				// 港湾管理处
				40006: [[(cb) => {
					cga.askNpcForObj({ act: 'map', target: 43190, npcpos: [84, 54] }, cb)
				}, null, 43190],],
			},
		},
		'艾尔莎岛': {
			mainName: '艾尔莎岛',
			mainindex: 59520,
			minindex: 59520,
			maxindex: 59599,
			mapTranslate: {
				'主地图': 59520,
				'神殿　伽蓝': 59530,
				'医院': 59530,
				'银行': 59548,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				59520: [],
				// 神殿　伽蓝
				59530: [[201, 96, 59530],],
				// 银行
				59548: [[(cb) => {
					cga.walkList([
						[158, 94],
					], () => {
						cga.turnTo(158, 93);
						cga.AsyncWaitMovement({ map: '艾夏岛' }, () => {
							cga.travel.autopilot('银行', cb)
						});
					});
				}, null, 59548],],
			},
			walkReverse: {
				// 神殿　伽蓝
				59530: [[59, 95, 59520],],
				// 银行
				59548: [[(cb) => {
					cga.travel.autopilot('主地图', cb)
				}, null, 59548],],
			},
		},
		'艾夏岛': {
			mainName: '艾尔莎岛',
			mainindex: 59521,
			minindex: 59521,
			maxindex: 59999,
			mapTranslate: {
				'主地图': 59521,
				'冒险者旅馆': 59538,
				'武器工房': 59541,
				'画廊': 59542,
				'银行': 59548,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				59521: [],
				// 冒险者旅馆
				59538: [[102, 115, 59538],],
				// 武器工房
				59541: [[144, 120, 59541],],
				// 画廊
				59542: [[144, 120, 59541], [28, 21, 59542],],
				// 银行
				59548: [[114, 104, 59548],],
			},
			walkReverse: {
				// 冒险者旅馆
				59538: [[38, 48, 59521],],
				// 武器工房
				59541: [[9, 24, 59521],],
				// 画廊
				59542: [[48, 47, 59541],],
				// 银行
				59548: [[27, 34, 59521],],
			},
		},
		/**
		 * UNAecho:将利夏岛与雪拉威森塔整合在一起，变为利夏岛。
		 * 雪拉威森塔每层的index是有顺序的，不是随机迷宫
		 * index598开头，第**层就是598**。如：第1层59801，第10层59810，第25层59825。
		 * 只有1层和每5层有传送石，其他层没有。
		 * 95层（含）之前，无通行限制。95通往96层，需要4转及以上才能通过。
		 * 96-99层的模式是：96层开始NPC给你一个护身符，双击回到此NPC处，交给下一层NPC，传送至下一层
		 * 99-100层也是一样，100层是顶层，可以拿王冠、公主头冠、小猫帽
		 * 100层(mapname:雪拉威森塔最上层)的index为59900
		 * 相关任务：圣域守护者
		 * 王冠可以飞辛梅尔，公主头冠飞丘斯特村，小猫帽是人物技能加成
		 * 支线任务：迷之箱
		 * 雪拉威森塔96~100楼会随机触发BOSS战
		 * 击倒奇美拉类BOSS后随机获得【奇美拉的羽毛】
		 * 击倒海怪类BOSS后随机获得【龙的鳞片】
		 * 击倒死神随机获得【迷语箱4】，击倒海怪类的BOSS随机获得【谜语箱1】，双击后随机获得奖品
		 */
		'利夏岛': {
			mainName: '利夏岛',
			mainindex: 59522,
			minindex: 59801,
			maxindex: 59553,
			mapTranslate: {
				'主地图': 59522,
				'国民会馆': 59552,
				'竞技场': 59553,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 雪拉威森塔各楼层
				59801: [[90, 99, 59552], [108, 39, 59801],],
				59810: [[90, 99, 59552], [108, 39, 59801], [76, 58, 59810],],
				59815: [[90, 99, 59552], [108, 39, 59801], [76, 56, 59815],],
				59820: [[90, 99, 59552], [108, 39, 59801], [76, 54, 59820],],
				59825: [[90, 99, 59552], [108, 39, 59801], [76, 52, 59825],],
				59830: [[90, 99, 59552], [108, 39, 59801], [72, 60, 59830],],
				59835: [[90, 99, 59552], [108, 39, 59801], [72, 58, 59835],],
				59840: [[90, 99, 59552], [108, 39, 59801], [72, 56, 59840],],
				59845: [[90, 99, 59552], [108, 39, 59801], [72, 54, 59845],],
				59850: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850],],
				59855: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [27, 55, 59855],],
				59860: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [25, 55, 59860],],
				59865: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [23, 55, 59865],],
				59870: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [21, 55, 59870],],
				59875: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [24, 44, 59875],],
				59880: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [22, 44, 59880],],
				59885: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [20, 44, 59885],],
				59889: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [18, 44, 59890], [59, 50, 59889],],
				59890: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [18, 44, 59890],],
				59895: [[90, 99, 59552], [108, 39, 59801], [75, 50, 59850], [16, 44, 59895],],
				// 主地图
				59522: [],
				// 国民会馆
				59552: [[90, 99, 59552],],
				// 竞技场
				59553: [[90, 99, 59552], [108, 61, 59553],],
			},
			walkReverse: {
				// 国民会馆
				59552: [[97, 50, 59522],],
				// 竞技场
				59553: [[106, 50, 59552],],
				// 雪拉威森塔各楼层
				59801: [[33, 99, 59552],],
				59810: [[54, 38, 59801],],
				59815: [[137, 69, 59801],],
				59820: [[88, 146, 59801],],
				59825: [[95, 57, 59801],],
				59830: [[68, 33, 59801],],
				59835: [[104, 26, 59801],],
				59840: [[98, 95, 59801],],
				59845: [[98, 29, 59801],],
				59850: [[78, 59, 59801],],
				59855: [[133, 93, 59850],],
				59860: [[95, 144, 59850],],
				59865: [[118, 54, 59850],],
				59870: [[78, 55, 59850],],
				59875: [[137, 133, 59850],],
				59880: [[162, 122, 59850],],
				59885: [[58, 131, 59850],],
				59889: [[162, 93, 59890],],
				59890: [[61, 39, 59850],],
				59895: [[102, 44, 59850],],
			},
		},
		'静谧之间': {// TODO 超补和超回复的房间信息
			mainName: '静谧之间',
			mainindex: 16512,
			minindex: 16512,
			maxindex: 16513,
			mapTranslate: {
				'主地图': 16512,
				'咒缚之帐': 16513,
			},
			walkForward: {// 正向导航坐标，从主地图到对应地图的路线
				// 主地图
				16512: [],
				// 咒缚之帐
				16513: [[26, 12, 16513],],
			},
			walkReverse: {
				// 主地图
				16512: [],
				// 咒缚之帐
				16513: [[14, 27, 16512],],
			},
		},
	}
	/**
	 * UNA: 写了一个全自动导航的API，可以在城镇地图中任意一个地方去另一个任意的地方，无需登出。
	 * 由于比较复杂，如果使用起来有问题，请联系https://github.com/UNAecho
	 * @param {*} targetMap 目的地名称或者index3
	 * @param {*} cb 回调
	 * @returns 
	 */
	cga.travel.autopilot = (targetMap, cb) => {

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
		if (typeof targetMap == 'string') {
			targetindex = info.mapTranslate[targetMap]
			if (typeof targetindex == 'object') {
				var sayString = '【UNA脚本提示】您输入的【' + targetMap + '】存在多个，请选择';
				for (var i in targetindex) {
					sayString += '[' + (parseInt(i)) + ']' + targetindex[i] + ',';
				}
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, val) => {
					if (val !== null && val > 0 && val <= 99999) {
						cga.travel.autopilot(val, cb)
						return false;
					}
					return true;
				});
				return
			}
		} else if (typeof targetMap == 'number') {
			targetindex = targetMap
		} else {
			cb(new Error('[UNA脚本警告]:targetMap[' + targetMap + ']输入有误，必须输入目标地图名称或mapindex来索引'));
		}
		// 如果没找到地图，多数原因为主地图不同导致，比如在法兰城中搜索奇利村的mapindex。
		if (!targetindex || !info.walkForward[targetindex]) {
			// 如果输入是number类型的地图，因为具有唯一性，这里进行全部地图信息遍历搜索，然后特殊处理。
			if (typeof targetindex == 'number') {
				let villages = Object.keys(cga.travel.info)
				for (let i = 0; i < villages.length; i++) {
					if (cga.travel.info[villages[i]].walkForward.hasOwnProperty(targetindex)) {
						// 特殊切换，直接写成静态逻辑
						if ((villageName == '艾尔莎岛' || villageName == '艾夏岛') && villages[i] == '法兰城') {
							console.log('你输入的目标index并不存在于当前大地图区域，为你搜索到你的目的地为:【' + villages[i] + '】')
							cga.travel.autopilot('主地图', () => {
								cga.travel.falan.toStone('C', (r) => {
									cga.travel.autopilot(targetMap, cb)
								});
							})
							return
						}

					}
				}
			}
			// 其他情况则抛异常
			cb(new Error('[UNA脚本警告]:targetMap:[' + targetMap + ']输入有误，请确认地图中是否有输入的名称地点。'))
		}

		try {
			// 目标路径信息
			var targetPath = info.walkForward[targetindex]
			/**
			 * 如果目标是自定义地点，有2种情况：
			 * 1、自定义地点为切换至某地图，则targetindex取路径倒数第1个list的mapindex或mapname。实际上逻辑与正常一致，只不过目标地图可能不是此villageName之下的地图。如：从法兰城出东门到芙蕾雅。
			 * 2、自定义地点为切换至某地图并走到某地点，则targetindex取路径倒数第2个list的mapindex或mapname，因为倒数第一个list是不切换地图的。
			 */
			if (typeof targetindex == 'string') {
				if (targetPath[targetPath.length - 1].length == 2) {
					customerPos = targetPath[targetPath.length - 1]
					targetindex = targetPath[targetPath.length - 2][2]
				} else if (targetPath[targetPath.length - 1].length == 3) {
					targetindex = targetPath[targetPath.length - 1][2]
				} else {
					throw new Error('walkForward数据错误，路径walklist数组长度必须为2或者3')
				}
			}

			// 如果运行时，自己在队伍中，且是队员
			let teamplayers = cga.getTeamPlayers();
			if (teamplayers.length && teamplayers[0].name != cga.GetPlayerInfo().name) {
				console.log('监测到你是队员，等待队长将自己带到指定index:' + targetindex)
				cga.waitForLocation({ mapindex: targetindex }, () => {
					console.log('cga.travel.autopilot()抵达:' + targetindex)
					setTimeout(cb, 1000);
				});
				return
			}

			// 自动导航路径
			var tmplist = null
			// 主逻辑分歧点
			if (mapindex == targetindex) {
				// 如果是自定义地点
				var curPos = cga.GetMapXY();
				if (customerPos && (curPos.x != customerPos[0] || curPos.y != customerPos[1])) {
					cga.walkList(
						[customerPos], cb);
					return
				} else {
					if (cb) cb(null)
					return
				}
			} else if (mapindex == info.mainindex) {
				tmplist = targetPath
			} else {// 自动导航逻辑
				// 遍历寻找是否可以从当前地图直接走到目标地图
				for (let i = 0; i < targetPath.length; i++) {
					if (targetPath && targetPath[i][2] == mapindex) {
						tmplist = targetPath.slice(i + 1)
						break
					}
				}
			}
			// 如果上面for循环没找到前进路径，则递归回到主地图。
			if (tmplist == null) {
				var backLogic = info.walkReverse[mapindex]
				if (!backLogic) {
					console.error('错误，当前地图或上一层地图的链路，存在无法通过走路返回的情况，请登出')
					return
				}
				tmplist = backLogic.slice(0, 1)
			}
			// 如果要执行function才能进入下一个地图，则执行方法并调用递归
			if (typeof tmplist[0][0] == 'function') {
				tmplist[0][0](() => {
					cga.travel.autopilot(targetMap, cb)
				})
				return
			} else {
				// 遍历寻找找本次路径有没有自定义func，如果有，则截取至自定义func之前的walklist一口气走完，并调用递归。递归后会进入上面的if逻辑，执行自定义func。
				for (let i = 0; i < tmplist.length; i++) {
					if (tmplist && tmplist[i] && typeof tmplist[i][0] == 'function') {
						tmplist = tmplist.slice(0, i)
						break
					}
				}
			}
			// 递归逻辑
			cga.walkList(
				tmplist, () => {
					// 如果自定义选择了非此主地图区域内的地图，如法兰城西门，需要判断是否还需要递归，否则会出现在野外调用报错（找不到mainmap）
					if (cga.GetMapIndex().index3 == targetindex) {
						cb(null)
						return
					}
					// 正常在村镇内逻辑
					cga.travel.autopilot(targetMap, cb)
				});
		} catch (error) {
			console.log('[UNA脚本警告]:可能由于【输入不存在的地图index/名称】【地图未读取完毕】，导致错误。')
			console.error('targetMap:', targetMap)
			console.error('error:', error)
		}
		return
	}
	// UNA:添加全域自动导航至医院补给。isPro为true是去资深护士处补给，否则是普通护士补给
	/**
	 * UNAecho: 全域自动导航至医院补给
	 * @param {*} cb 
	 * @param {*} isPro 是否去资深补给
	 * @param {*} returnToMainMap 补给后是否回到当前区域的主地图(例：里堡补完回到法兰城地图)，默认为true，回到主地图
	 * @returns 
	 */
	cga.travel.toHospital = (cb, isPro = false, returnToMainMap = true) => {
		// 不需要补血则跳过
		if (!cga.needSupplyInitial({})) {
			cga.travel.autopilot('主地图', () => {
				if (cb) cb(null)
			})
			return
		}

		// 当前地图信息
		var mapindex = cga.GetMapIndex().index3
		// 获取当前主地图名称
		var villageName = cga.travel.switchMainMap()
		// 法兰城和艾尔莎岛直接在里谢里雅堡回补，效率高
		if (villageName == '法兰城' || villageName == '艾尔莎岛') {
			cga.travel.falan.toStone('C', (r) => {
				cga.walkList([
					[34, 89]
				], () => {
					cga.turnDir(7)
					setTimeout(() => {
						cga.travel.autopilot('主地图', () => {
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
			4140,// 阿斯提亚镇回复之间，UD任务相关
			4210,
			4310,
			4410,
			43110,
			44692,// 圣骑士营地
			59530,
		]
		if (hospitalList.indexOf(mapindex) == -1) {
			cga.travel.autopilot('医院', () => {
				cga.travel.toHospital(cb, isPro, returnToMainMap)
			})
			return
		}
		var tmplist = []
		var tmpTurnDir = null

		if (villageName == '圣拉鲁卡村') {
			tmplist.push(isPro == true ? [10, 3] : [15, 8])
			tmpTurnDir = isPro == true ? 0 : 6
		} else if (villageName == '伊尔村') {
			tmplist.push(isPro == true ? [18, 14] : [10, 15])
			tmpTurnDir = isPro == true ? 0 : 6
		} else if (villageName == '亚留特村') {
			tmplist.push(isPro == true ? [14, 9] : [10, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		} else if (villageName == '维诺亚村') {
			tmplist.push(isPro == true ? [15, 9] : [11, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		} else if (villageName == '奇利村') {
			tmplist.push(isPro == true ? [7, 2] : [11, 6])
			tmpTurnDir = isPro == true ? 0 : 6
		} else if (villageName == '加纳村') {
			tmplist.push(isPro == true ? [12, 14] : [9, 9])
			tmpTurnDir = 0
		} else if (villageName == '杰诺瓦镇') {
			tmplist.push(isPro == true ? [15, 9] : [10, 5])
			tmpTurnDir = isPro == true ? 6 : 0
		} else if (villageName == '阿斯提亚镇') {
			tmplist.push([17, 9])
			tmpTurnDir = 0
		} else if (villageName == '夜晚蒂娜村') {

		} else if (villageName == '蒂娜村') {
			tmplist.push(isPro == true ? [8, 5] : [12, 9])
			tmpTurnDir = isPro == true ? 0 : 6
		} else if (villageName == '阿巴尼斯村') {
			tmplist.push(isPro == true ? [14, 10] : [10, 6])
			tmpTurnDir = isPro == true ? 6 : 0
		} else if (villageName == '魔法大学') {
			tmplist.push(isPro == true ? [33, 48] : [35, 48])
			tmpTurnDir = 6
		} else if (villageName == '曙光骑士团营地') {
			tmplist.push(isPro == true ? [11, 8] : [7, 4])
			tmpTurnDir = isPro == true ? 6 : 0
		} else if (villageName == '法兰城') {

		} else if (villageName == '艾尔莎岛') {
			tmplist.push([91, 122])
			tmpTurnDir = 0
		} else if (villageName == '圣骑士营地') {
			tmplist.push(isPro == true ? [10, 12] : [18, 15])
			tmpTurnDir = 6
		} else {
			throw new Error('[UNA脚本警告]:未知地图index，请联系作者https://github.com/UNAecho更新。')
		}

		cga.walkList(
			tmplist, () => {
				cga.turnDir(tmpTurnDir)
				setTimeout(() => {
					if (returnToMainMap) {
						cga.travel.autopilot('主地图', () => {
							if (cb) cb(null)
						})
					} else {
						if (cb) cb(null)
					}
				}, 5000);
				return
			}
		);
		return
	}

	/**
	 * UNAecho: 在村镇开启传送石之后补给。
	 * 如果持有不能记录传送权限的道具，如起司的任务中的起司和酒，则跳过开传送部分。
	 * @param {*} isPro 去资深护士处补给，为true则与资深护士对话，false则与普通护士对话
	 * @param {*} cb 
	 * @returns 
	 */
	cga.travel.saveAndSupply = (isPro, cb) => {
		const noSaveItem = ['好像很好吃的起司', '好像很好喝的酒',];
		for (let item of noSaveItem) {
			if (cga.findItem(item) != -1) {
				console.log('持有【' + item + '】不能开启传送许可权限，跳过此阶段..')
				cga.travel.toHospital(() => {
					if (cb) cb(null)
					return
				}, isPro)
				return
			}

		}
		// 准备保存开传状态
		var config = cga.loadPlayerConfig();
		if (!config) {
			config = {};
		}

		var villageName = cga.travel.switchMainMap()

		// 魔法大学没有传送石，直接转为回补模式
		if (villageName == '魔法大学') {
			console.log('魔法大学没有传送点，跳过开启传送阶段。')
			cga.travel.toHospital(() => {
				if (cb) cb(null)
				return
			}, isPro)
			return
		}

		// 如果已经开启过传送，则直接补给并结束函数
		if (config[villageName]) {
			console.log('你已开启过【' + villageName + '】传送石，跳过开启传送阶段。')
			cga.travel.toHospital(() => {
				if (cb) cb(null)
				return
			}, isPro)
			return
		}
		// 如果没开启过传送，则去开启并记录状态。
		const info = cga.travel.info[villageName]
		cga.travel.autopilot('传送石', () => {
			cga.walkList(
				[cga.getRandomSpace(info.stoneNPCpos[0], info.stoneNPCpos[1])], () => {
					cga.TurnTo(info.stoneNPCpos[0], info.stoneNPCpos[1]);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && (dlg.message.indexOf('金币') >= 0 || dlg.message.indexOf('欢迎') >= 0)) {
							setTimeout(() => {
								// 如果开传成功，则记录状态
								config[villageName] = true
								cga.savePlayerConfig(config, () => {
									console.log('【' + villageName + '】传送石已开启，离线信息已记录完毕')
									// 记录之后去补给
									cga.travel.toHospital(() => {
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
	cga.travel.toBank = (cb) => {
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
		if (bankList.indexOf(mapindex) == -1) {
			cga.travel.autopilot('银行', (err, reason) => {
				if (err && err.message.indexOf('请确认地图中是否有输入的名称地点') != -1) {
					console.log('当前地图区域没有银行，登出..')
					cga.logBack(() => {
						cga.travel.autopilot('银行', (err, reason) => {
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
		if (villageName == '法兰城') {
			tmplist.push([11, 8])
			tmpTurnDir = 0
		} else if (villageName == '哥拉尔镇') {
			tmplist.push([25, 10])
			tmpTurnDir = 0
		} else if (villageName == '艾尔莎岛' || '艾夏岛') {
			tmplist.push([49, 25])
			tmpTurnDir = 0
		} else if (villageName == '阿凯鲁法村') {
			tmplist.push([20, 17])
			tmpTurnDir = 0
		} else {
			throw new Error('[UNA脚本警告]:未知地图index，请联系作者https://github.com/UNAecho更新。')
		}

		cga.walkList(
			tmplist, () => {
				cga.turnDir(tmpTurnDir)
				cga.AsyncWaitNPCDialog((err, dlg) => {
					if (err && err.message.indexOf('timeout') > 0) {
						cb(new Error('读取银行超时，请检查网络'))
					} else {
						cb(null)
					}
				});
				return
			}
		);
		return
	}

	cga.travel.isInVillage = () => {
		var villageArr = ['法兰城', '艾尔莎岛', '圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇', '魔法大学', '阿巴尼斯村', '蒂娜村', '曙光骑士团营地', '圣骑士营地']
		var mainMapName = cga.travel.switchMainMap()
		if (villageArr.indexOf(mainMapName) != -1) {
			console.log('当前【' + mainMapName + '】属于城镇村庄内')
			return true
		}
		return false
	}

	/**
	 * UNAecho:一个自动去村镇开传送的API，会自动识别当前所处位置是否可以以最近距离赶往目标地点。
	 * 比如如果检测到当前处于奇利村，而目标地点是加纳村的话，那么无需登出，直接启程。
	 * 
	 * 一键执行，包含自动开传送、自动在旅途中补给，无需添加任何其他逻辑。
	 * @param {*} villageName
	 * @param {*} cb 
	 * @param {*} finalVillage 
	 */
	cga.travel.toVillage = (villageName, cb, finalVillage = null) => {
		// 获取当前所处主地图
		var mainMapName = cga.travel.switchMainMap()

		/**
		 * 为了节约性能，如果人物已经在村镇内，跳过cga.travel.saveAndSupply()环节
		 * 这样可以减少磁盘I/O（因为saveAndSupply()要读取配置文件判断人物是否已经开了传送）
		 * 只有当人物需要步行赶路抵达目标村庄时，再调用cga.travel.saveAndSupply()来记录开传送状态
		 */
		if (mainMapName == villageName || mainMapName == finalVillage) {
			cb(null)
			return
		}

		var config = cga.loadPlayerConfig();
		if (!config) {
			config = {};
		}
		if (finalVillage) {
			console.log('当前目标为【' + villageName + '】，最终目标为【' + finalVillage + '】')
		}

		if (cga.needSupplyInitial({})) {
			console.log('人物没有满状态，先回补。')
			if (cga.travel.isInVillage()) {
				cga.travel.toHospital(() => {
					cga.travel.toVillage(villageName, cb, finalVillage)
				}, false)
			} else {
				cga.travel.falan.toCastleHospital(() => {
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

		// 部分道具无法使用传送石。
		const noTransferItem = [18320, 18321, 18322, '好像很好吃的起司', '好像很好喝的酒',];

		var tmpPath = null
		var tmpIndex = null
		// 如果找到某个村庄路径，就不要继续遍历，防止覆盖
		var breakFlag = false

		for (var i = 0; i < villageArray.length; i++) {
			if (breakFlag) {
				breakFlag = false
				break
			}
			for (var j = 0; j < villageArray[i].length; j++) {
				if (villageArray[i][j] == villageName) {
					tmpPath = villageArray[i]
					tmpIndex = j
					breakFlag = true
					break
				}
			}
		}
		if (!tmpPath || tmpIndex === null) {
			throw new Error('错误，请传入正确的村庄名称。你输入的村庄名称为【' + villageName + '】')
		}

		var next = (cb) => {
			cga.travel.saveAndSupply(false, () => {
				if (finalVillage && villageName != finalVillage) {
					console.log('抵达【' + villageName + '】，并且已经回补、开启传送。最终目标为【 ' + finalVillage + ' 】下一步前往【' + tmpPath[tmpIndex + 1] + '】。')
					cga.travel.toVillage(tmpPath[tmpIndex + 1], cb, finalVillage)
				} else {
					console.log('抵达【' + villageName + '】并且已经回补、开启传送。')
					if (cb) cb(null)
				}
				return
			})
		}

		// 如果需要赶路，先读取单人战斗配置
		cga.loadBattleConfig('生产赶路')

		if (config[villageName]) {
			console.log('你已经开过【' + villageName + '】传送，直接使用传送石抵达。')
			if (mainMapName == villageName) {
				next(cb)
				return
			} else if (noTransferItem.some(it => { return cga.findItem(it) != -1 })) {
				console.log('身上持有不能使用传送石的道具，只能步行前往【' + villageName + '】')
			} else {
				cga.travel.falan.toTeleRoom(villageName, () => {
					next(cb)
				})
				return
			}
		} else if (villageName != '魔法大学') {
			console.log('你没有开启【' + villageName + '】传送权限，开始计算最优步行模式...')
		}
		// 用于判断角色的过关资格
		var playerInfo = cga.GetPlayerInfo()
		// tmpIndex > 0情况，也就是自定义序列的非首位，尝试选择去前一个村庄抄近路，再徒步前往目的地。
		if (tmpIndex > 0) {
			if (mainMapName == tmpPath[tmpIndex - 1]) {
				if (villageName == '奇利村') {
					var category = cga.job.getJob().jobType
					var ring = cga.findItem('欧兹尼克的戒指')
					if (category != '生产系' && category != '初始系' && ring == -1) {
						throw new Error('你不是制造系或游民，需要【欧兹尼克的戒指】过海底。')
					}
					cga.travel.autopilot('主地图', () => {
						cga.walkList([
							[67, 46, '芙蕾雅'],
							[343, 497, '索奇亚海底洞窟 地下1楼'],
							[18, 34, '索奇亚海底洞窟 地下2楼'],
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							[7, 37]
						], () => {
							cga.TurnTo(8, 37);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(1, 0);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(4, -1)
									cga.AsyncWaitMovement({ map: '索奇亚', delay: 1000, timeout: 5000 }, (err) => {
										if (err) {
											console.error('出错，请检查..')
											return;
										}
										cga.walkList([
											[274, 294, '奇利村'],
										], () => {
											next(cb)
										});
									});
								});
							});
						});
					})
				} else if (villageName == '加纳村') {
					cga.travel.autopilot('主地图', () => {
						cga.walkList([
							[79, 76, '索奇亚'],
							[356, 334, '角笛大风穴'],
							[133, 26, '索奇亚'],
						], () => {
							cga.walkList([
								[704, 147, '加纳村'],
							], () => {
								next(cb)
							})
						});
					})
				} else if (villageName == '阿巴尼斯村') {
					cga.travel.autopilot('主地图', () => {
						cga.walkList([
							[24, 40, '莎莲娜'],
							[235, 338, '莎莲娜西方洞窟'],
							[45, 9, 14001],
							[57, 13, 14002],
							[36, 7, '莎莲娜'],
							[183, 161, '阿巴尼斯村'],
						], () => {
							next(cb)
						});
					})
				} else if (villageName == '蒂娜村') {
					if (!cga.travel.canEntryDina()) {
						console.log('现在不可进入蒂娜村，开始等待至白天...')
						setTimeout(() => {
							cga.travel.toVillage(villageName, cb, finalVillage)
						}, 60000);
						return
					}
					cga.travel.autopilot('主地图', () => {
						cga.walkList([
							[71, 18, 400],
							[570, 275, '蒂娜村'],
						], () => {
							next(cb)
						});
					})
				} else if (villageName == '魔法大学') {
					cga.travel.autopilot('主地图', () => {
						cga.walkList([
							[37, 71, '莎莲娜'],
							[118, 100, '魔法大学'],
						], () => {
							next(cb)
						})
					})
				}
				return
			} else {
				console.log('要去【' + villageName + '】，先去【' + tmpPath[tmpIndex - 1] + '】抄一下近路。')
				cga.travel.toVillage(tmpPath[tmpIndex - 1], cb, finalVillage ? finalVillage : villageName)
			}
			return
		} else {// tmpIndex == 0情况，也就是自定义序列的首位，只能选择徒步前进
			var go = (cb) => {
				cga.travel.falan.toStone('C', () => {
					if (villageName == '圣拉鲁卡村') {
						cga.walkList([
							[17, 53, '法兰城'],
							[22, 88, '芙蕾雅'],
							[134, 218, '圣拉鲁卡村'],
						], () => {
							next(cb)
						})
					} else if (villageName == '伊尔村') {
						cga.walkList([
							[65, 53, '法兰城'],
							[281, 88, '芙蕾雅'],
							[681, 343, '伊尔村'],
						], () => {
							next(cb)
						})
					} else if (villageName == '亚留特村') {
						cga.walkList([
							[27, 82],
							[41, 98, '法兰城'],
							[281, 88, '芙蕾雅'],
							[672, 223, '哈巴鲁东边洞穴 地下1楼'],
							[41, 8, '哈巴鲁东边洞穴 地下2楼'],
							[17, 18]
						], () => {
							cga.ForceMove(6, true);
							cga.ForceMove(6, true);
							cga.walkList([
								[16, 11, '哈巴鲁东边洞穴 地下1楼'],
								[30, 4, '芙蕾雅'],
								[596, 84, '亚留特村'],
							], () => {
								next(cb)
							});
						});
					} else if (villageName == '维诺亚村') {
						if (playerInfo.level < 20) {
							throw new Error('过维诺亚村洞穴需要至少20级，或制造系携带3级物品通过')
						}
						cga.walkList([
							[41, 98, '法兰城'],
							//南门
							[153, 241, '芙蕾雅'],
							[473, 316],
						], () => {
							cga.TurnTo(472, 316);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '维诺亚洞穴 地下1楼', delay: 1000, timeout: 5000 }, (err) => {
									if (err) {
										console.error('出错，请检查..')
										return;
									}
									cga.walkList([
										[20, 59, '维诺亚洞穴 地下2楼'],
										[24, 81, '维诺亚洞穴 地下3楼'],
										[26, 64, '芙蕾雅'],
										[330, 480, '维诺亚村'],
									], () => {
										next(cb)
									});
								});
							});
						})
					} else if (villageName == '杰诺瓦镇') {
						if (playerInfo.level < 40) {
							throw new Error('过莎莲娜海底隧道需要至少40级')
						}
						cga.walkList([
							//里谢里雅堡西门
							[17, 53, '法兰城'],
							//西门
							[22, 88, '芙蕾雅'],
						], () => {
							cga.walkList([
								[201, 166],
							], () => {
								cga.TurnTo(201, 165);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1)
									cga.AsyncWaitMovement({ map: 15000, delay: 1000, timeout: 5000 }, (err) => {
										if (err) {
											console.error('出错，请检查..')
											return;
										}
										cga.walkList([
											[20, 8, '莎莲娜海底洞窟 地下2楼'],
											[11, 9, '莎莲娜海底洞窟 地下1楼'],
											[24, 11, '莎莲娜'],
											[217, 455, '杰诺瓦镇'],
										], () => {
											next(cb)
										});
									});
								});
							});
						})
					}
				});
			}

			if (mainMapName == villageName) {
				next(cb)
			} else {
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
	cga.travel.canEntryDina = () => {
		var sysTime = cga.GetSysTime();
		// 16:00才算作夜晚蒂娜村，但需要预留游戏时间的【1小时】步行时间，所以15:00就视为夜晚蒂娜村
		if (sysTime.hours > 6 && sysTime.hours < 15) {
			return true
		}
		return false
	}

	cga.travel.yaliute = {};
	// 亚留特村医院
	cga.travel.yaliute.toHospital = (cb, isPro) => {
		if (cga.GetMapName() != '亚留特村') {
			cb(new Error('必须从亚留特村启动'));
			return;
		}
		cga.walkList(
			[
				[52, 63, '医院'],
				isPro == true ? [14, 9] : [10, 5],
			], () => {
				isPro == true ? cga.turnDir(6) : cga.turnDir(0)
				cb(null);
			});
	}

	cga.travel.qili = {};

	// 奇利村医院
	cga.travel.qili.toHospital = (cb, isPro) => {
		var name = '奇利村'
		var mapindex = cga.GetMapIndex().index3
		if (mapindex < 3200 || mapindex >= 3300) {
			cb(new Error('必须从' + name + '启动'));
			return;
		}
		var tmplist = [
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
					[64, 56, '医院'],
				);
				break;
			case 3214:
				tmplist.unshift(
					[7, 1, 3212],
					[1, 8, '奇利村'],
					[64, 56, '医院'],
				);
				break;
			case 3212:
				tmplist.unshift(
					[1, 8, '奇利村'],
					[64, 56, '医院'],
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
			tmplist, () => {
				cga.turnDir(isPro == true ? 0 : 6);
				cb(null);
			});
	}

	cga.travel.jienuowa = {};

	// 杰诺瓦镇医院
	cga.travel.jienuowa.toHospital = (cb, isPro) => {
		var name = '杰诺瓦镇'
		var mapindex = cga.GetMapIndex().index3
		if (mapindex < 4000 || mapindex >= 4100) {
			cb(new Error('必须从' + name + '启动'));
			return;
		}
		var tmplist = [
			isPro == true ? [15, 9] : [10, 5],
		]
		switch (mapindex) {
			case 4099:
				tmplist.unshift(
					// 村长的家map.index3是4012
					[14, 6, 4012],
					[1, 9, '杰诺瓦镇'],
					[44, 33, '医院'],
				);
				break;
			case 4012:
				tmplist.unshift(
					[1, 9, '杰诺瓦镇'],
					[44, 33, '医院'],
				);
				break;
			case 4000:
				tmplist.unshift(
					[44, 33, '医院'],
				);
				break;
			default:
				break;
		}
		cga.walkList(
			tmplist, () => {
				cga.turnDir(isPro == true ? 6 : 0);
				cb(null);
			});
	}
	//从法兰坐船前往某城镇
	cga.travel.falan.toCity = function (city, cb) {
		switch (city) {
			case '新城': case '艾尔莎岛':
				cga.travel.falan.toNewIsland(cb);
				return;
			case '阿凯鲁法': case '阿凯鲁法村':
				cga.travel.falan.toAKLF(cb);
				return;
			case '哥拉尔': case '哥拉尔镇':
				cga.travel.falan.toGelaer(cb);
				return;
		}
		throw new Error('未知的城市名:' + city);
	}

	cga.travel.newisland = {};

	cga.travel.newisland.isSettled = () => {

		var config = cga.loadPlayerConfig();

		if (config)
			return config.settledCity == '艾尔莎岛' ? true : false;

		return false;
	}

	cga.travel.newisland.xy2name = function (x, y, mapname) {
		if (x == 140 && y == 105 && mapname == '艾尔莎岛')
			return 'X';
		if (x == 158 && y == 94 && mapname == '艾尔莎岛')
			return 'A';
		if (x == 84 && y == 112 && mapname == '艾夏岛')
			return 'B';
		if (x == 164 && y == 159 && mapname == '艾夏岛')
			return 'C';
		if (x == 151 && y == 97 && mapname == '艾夏岛')
			return 'D';

		return null;
	}

	cga.travel.newisland.isvalid = function (stone) {
		switch (stone.toUpperCase()) {
			case 'A': return true;
			case 'B': return true;
			case 'C': return true;
			case 'D': return true;
			case 'X': return true;
		}
		return false;
	}

	cga.travel.newisland.toStoneInternal = (stone, cb) => {
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		const desiredMap = ['艾尔莎岛', '艾夏岛'];
		if (curMap == '艾尔莎岛' || curMap == '艾夏岛') {

			var curStone = cga.travel.newisland.xy2name(curXY.x, curXY.y, curMap);
			if (curStone !== null) {
				var turn = false;
				if (stone.length >= 2 && curStone.charAt(1) == stone.charAt(1)) {
					if (curStone == stone) {
						cb(true);
						return;
					}
					turn = true;
				} else if (stone.length < 2) {
					if (curStone.charAt(0) == stone.charAt(0)) {
						cb(true);
						return;
					}
					turn = true;
				}
				if (turn) {
					switch (curStone) {
						case 'X': {
							cga.walkList([
								[158, 94],
							], () => {
								cga.travel.newisland.toStoneInternal(stone, cb);
							});
							return;
						}
						case 'A': {
							if (stone == 'X') {
								cga.walkList([
									[140, 105],
								], () => {
									cga.travel.newisland.toStoneInternal(stone, cb);
								});
								return;
							}

							cga.turnDir(6);
							break;
						}
						case 'B': cga.turnDir(4); break;
						case 'C': cga.turnDir(5); break;
						case 'D': cga.turnDir(4); break;
					}
					cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
						if (err) {
							cb(err, reason);
							return;
						}
						cga.travel.newisland.toStoneInternal(stone, cb);
					});
					return;
				}
			}

			if (curMap == '艾尔莎岛') {
				// 如果已经在艾尔莎岛，X位置不再使用cga.walkList走到传送石位置。
				if (stone == 'X') {
					cb(true);
				} else {
					cga.walkList([
						[158, 94],
					], () => {
						cga.travel.newisland.toStoneInternal(stone, cb);
					});
				}
				return;
			}
		}

		if (cga.travel.newisland.isSettled()) {
			cga.logBack(() => {
				cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
					if (err) {
						cb(err, reason);
						return;
					}
					cga.travel.newisland.toStoneInternal(stone, cb);
				});
			});
		} else if (cga.travel.falan.isSettled()) {
			console.log('检测到你的记录点在法兰，登出测试是否已经记录在了艾尔莎岛，如果是，则更新');
			cga.logBack(() => {
				cga.AsyncWaitMovement({ map: desiredMap, delay: 1000, timeout: 5000 }, (err, reason) => {
					if (err) {
						cb(err, reason);
						return;
					}
					cga.travel.newisland.toStoneInternal(stone, cb);
				});
			});
		} else {
			console.log('你没有记录在艾尔莎岛，登出检测你的记录点..')
			cga.logBack(cb);
		}
	}

	//参数1：传送石名称，有效参数：A B C D
	//参数2：回调函数function(result), result 为true或false
	cga.travel.newisland.toStone = (stone, cb) => {
		if (!cga.travel.newisland.isvalid(stone)) {
			throw new Error('无效的目的地名称');
			return;
		}

		cga.travel.newisland.toStoneInternal(stone, cb);
	}

	//前往新城冒险者旅馆
	cga.travel.newisland.toPUB = (cb) => {
		cga.travel.newisland.toStone('B', (r) => {
			cga.walkList([
				[102, 115, '冒险者旅馆'],
			], (r) => {
				cb(r);
			});
		});
	}

	//前往新城银行
	cga.travel.newisland.toBank = (cb) => {
		let go = (r) => {
			cga.walkList([
				[49, 25]
			], () => {
				cb(r);
			});
			return
		}
		if (cga.GetMapIndex().index3 == 59548) {
			go(null)
			return
		}
		cga.travel.newisland.toStone('B', (r) => {
			cga.walkList([
				[114, 104, '银行'],
			], (r) => {
				go(r)
			});
		});
	}

	//前往新城立夏岛
	cga.travel.newisland.toLiXiaIsland = (cb) => {
		cga.travel.newisland.toStone('X', (r) => {
			var teamplayers = cga.getTeamPlayers();

			cga.walkList(
				teamplayers.length > 1 ?
					[
						[165, 153],
						[164, 153],
						[165, 153],
						[164, 153],
						[165, 153],
					] :
					[
						[165, 153],
					]
				, (r) => {
					cga.TurnTo(165, 155);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, 0);
							setTimeout(cb, 1500, true);
						});
					});
				});
		});
	}

	cga.travel.gelaer = {};

	cga.travel.gelaer.isSettled = () => {

		var config = cga.loadPlayerConfig();

		if (config)
			return config.settledCity == '哥拉尔镇' ? true : false;

		return false;
	}

	cga.travel.gelaer.xy2name = function (x, y, mapname) {
		if (x == 120 && y == 107 && mapname == '哥拉尔镇')
			return 'N';
		if (x == 118 && y == 214 && mapname == '哥拉尔镇')
			return 'S';
		return null;
	}

	cga.travel.gelaer.isvalid = function (stone) {
		switch (stone.toUpperCase()) {
			case 'N': return true;
			case 'S': return true;
		}
		return false;
	}

	cga.travel.gelaer.toStoneInternal = (stone, cb) => {
		var curXY = cga.GetMapXY();
		var curMap = cga.GetMapName();
		if (curMap == '哥拉尔镇') {
			var curStone = cga.travel.gelaer.xy2name(curXY.x, curXY.y, curMap);
			if (curStone !== null) {
				if (curStone == stone) {
					cb(null);
					return;
				}

				var desiredTarget = undefined;
				switch (curStone) {
					case 'N':
						cga.turnDir(6);
						desiredTarget = [118, 214];
						break;
					case 'S':
						cga.turnDir(0);
						desiredTarget = [120, 107];
						break;
				}
				cga.AsyncWaitMovement({ x: desiredTarget[0], y: desiredTarget[1], delay: 1000, timeout: 5000 }, (err, reason) => {
					if (err) {
						cb(err, reason);
						return;
					}
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
				return;
			} else if (!cga.travel.gelaer.isSettle) {
				var northPath = cga.calculatePath(curXY.x, curXY.y, 118, 214, null, null, null, []);
				northPath = PF.Util.expandPath(northPath);

				var southPath = cga.calculatePath(curXY.x, curXY.y, 120, 107, null, null, null, []);
				southPath = PF.Util.expandPath(southPath);

				var path = northPath;
				var target = [118, 214];

				if (path.length > southPath.length) {
					path = southPath;
					target = [120, 107];
				}

				cga.walkList([target], () => {
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
				return;
			}
		}

		if (cga.travel.gelaer.isSettled()) {
			cga.logBack(() => {
				cga.AsyncWaitMovement({ map: '哥拉尔镇', delay: 1000, timeout: 5000 }, (err, reason) => {
					if (err) {
						cb(err, reason);
						return;
					}
					cga.travel.gelaer.toStoneInternal(stone, cb);
				});
			});
		}
	}

	//参数1：传送石名称，有效参数：N S
	cga.travel.gelaer.toStone = (stone, cb) => {
		if (!cga.travel.gelaer.isvalid(stone)) {
			throw new Error('无效的目的地名称');
			return;
		}

		cga.travel.gelaer.toStoneInternal(stone, cb);
	}

	//前往到哥拉尔医院
	cga.travel.gelaer.toHospital = (cb, isPro) => {
		if (cga.GetMapName() != '哥拉尔镇') {

			if (cga.travel.gelaer.isSettled()) {
				cga.logBack(() => {
					setTimeout(cga.travel.gelaer.toHospital, 1000, cb, isPro);
				});
				return;
			}

			cb(new Error('"前往哥拉尔医院"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', () => {
			cga.walkList([
				[165, 91, '医院'],
				isPro ? [28, 25] : [29, 26],
			], () => {
				if (isPro)
					cga.turnTo(28, 24);
				else
					cga.turnTo(30, 26);
				cb(null);
			});
		});
	}

	//前往到哥拉尔银行
	cga.travel.gelaer.toBank = (cb) => {
		if (cga.GetMapName() != '哥拉尔镇') {

			if (cga.travel.gelaer.isSettled()) {
				cga.logBack(() => {
					setTimeout(cga.travel.gelaer.toBank, 1000, cb);
				});
				return;
			}

			cb(new Error('"前往哥拉尔银行"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', () => {
			cga.walkList([
				[167, 66, '银行'],
				[25, 10],
			], () => {
				cga.turnDir(0);
				cb(null);
			});
		});
	}

	// 前往哥拉尔启程之间
	cga.travel.gelaer.toTeleRoomTemplate = (villageName, npcPos, npcPos2, npcPos3, cb) => {
		cga.travel.gelaer.toStone('S', () => {
			var teamplayers = cga.getTeamPlayers();
			var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;

			var list = [
				// 白之宫殿外面index是43200
				[140, 214, 43200],
				// 白之宫殿里面index是43210
				[47, 39, 43210],
				[23, 70, '启程之间'],
			];

			if (isTeamLeader) {
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
				list.push(npcPos2);
				list.push(npcPos);
			} else {
				list.push(npcPos);
			}

			cga.walkList(list, () => {
				var go = () => {
					cga.TurnTo(npcPos3[0], npcPos3[1]);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (typeof dlg.message == 'string' && (dlg.message.indexOf('对不起') >= 0 || dlg.message.indexOf('很抱歉') >= 0)) {
							cb(new Error('无法使用前往' + villageName + '的传送石'));
							return;
						}
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitMovement({ map: villageName + '的传送点', delay: 1000, timeout: 5000 }, cb);
					});
				}
				if (isTeamLeader) {
					setTimeout(() => {
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(go, 1500);
					}, 1500);
				} else {
					go();
				}
			});
		});
	}

	cga.travel.gelaer.toTeleRoom = (villageName, cb) => {

		switch (villageName) {
			case '米诺基亚镇':
				cga.travel.gelaer.toTeleRoomTemplate('米诺基亚镇', [11, 8], [11, 9], [13, 7], cb);
				break;
			default:
				throw new Error('未知的村子名称');
		}
	}

	//前往鲁米那斯村
	cga.travel.gelaer.toLumi = (cb) => {
		if (cga.GetMapName() != '哥拉尔镇') {

			if (cga.travel.gelaer.isSettled()) {
				cga.logBack(() => {
					setTimeout(cga.travel.gelaer.toLumi, 1000, cb);
				});
				return;
			}

			cb(new Error('"前往鲁米那斯村"功能必须从哥拉尔镇启动'));
			return;
		}
		cga.travel.gelaer.toStone('N', () => {
			cga.walkList([
				[176, 105, '库鲁克斯岛'],
				[477, 525],
			], () => {
				cga.turnTo(477, 526);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitMovement({ x: 476, y: 528, delay: 1000, timeout: 5000 }, () => {
						cga.walkList([
							[322, 883, '鲁米那斯']
						], () => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.travel.lumi = {};

	//前往鲁村商店
	cga.travel.lumi.toStore = (cb) => {
		if (cga.GetMapName() != '鲁米那斯') {
			cb(new Error('必须从鲁米那斯启动'));
			return;
		}
		cga.walkList([
			[88, 51, '杂货店'],
			[11, 12],
		], () => {
			cga.turnTo(13, 12);
			cb(null);
		});
	}

	//前往鲁村医院
	cga.travel.lumi.toHospital = (cb, isPro) => {
		if (cga.GetMapName() != '鲁米那斯') {
			cb(new Error('必须从鲁米那斯启动'));
			return;
		}
		cga.walkList(
			[
				[87, 35, '医院'],
				isPro == true ? [17, 5] : [17, 16],
			], () => {
				cga.turnDir(0);
				cb(null);
			});
	}

	cga.travel.weinuoya = {};

	cga.travel.weinuoya.toHospital = (cb, isPro) => {
		var name = '维诺亚村'
		var mapindex = cga.GetMapIndex().index3
		if (mapindex < 2100 || mapindex >= 2200) {
			cb(new Error('必须从' + name + '启动'));
			return;
		}
		var tmplist = [
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
			tmplist, () => {
				cga.turnDir(isPro == true ? 6 : 0);
				cb(null);
			});
	}

	cga.travel.minuojiya = {};

	cga.travel.minuojiya.toHospital = (cb, isPro) => {
		if (cga.GetMapName() != '米诺基亚镇') {
			cb(new Error('必须从米诺基亚镇启动'));
			return;
		}
		cga.walkList(
			[
				[45, 87, '医院'],
				isPro == true ? [7, 6] : [11, 8],
			], () => {
				cga.turnDir(0);
				cb(null);
			});
	}
	//从哥拉尔到法兰
	cga.travel.gelaer.toFalan = (cb) => {
		if (cga.GetMapName() != '哥拉尔镇') {
			cb(new Error('必须从哥拉尔镇启动'));
			return;
		}

		var stage4 = () => {
			cga.walkList([
				[47, 83, '村长的家'],
				[14, 17, '伊尔村的传送点'],
				[20, 10],
			], (r) => {
				cga.TurnTo(22, 10);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '启程之间' }, () => {
						cga.walkList([
							[25, 24, '里谢里雅堡 1楼'],
							[74, 40, '里谢里雅堡'],
						], cb);
					});
				});
			});
		}

		var stage3 = () => {
			cga.walkList([
				[19, 55],
			], (r) => {
				cga.TurnTo(19, 53);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '港湾管理处' }, () => {
						cga.walkList([
							[9, 22, '伊尔'],
							[24, 19],
						], () => {
							cga.TurnTo(24, 17);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, -1);
								cga.AsyncWaitMovement({ map: '伊尔村' }, stage4);
							});
						});
					});
				});
			});
		}

		var retry2 = () => {
			cga.TurnTo(71, 26);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.message.indexOf('现在正停靠在伊尔村') >= 0 && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '往哥拉尔栈桥' }, () => {
						stage3();
					});
					return;
				}

				setTimeout(retry2, 5000);
			});
		}

		var retry = () => {
			cga.TurnTo(53, 50);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				if (dlg && dlg.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '铁达尼号' }, retry2);
					return;
				}

				setTimeout(retry, 5000);
			});
		}

		cga.walkList([
			[96, 211, '哥拉尔镇 港湾管理处'],
			[8, 5],
		], () => {
			cga.TurnTo(8, 3);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(32, -1);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitMovement({ map: '往伊尔栈桥' }, () => {
						cga.walkList([
							[51, 50],
						], retry);
					});
				});
			});
		});
	}

	cga.isPathAvailable = (curX, curY, targetX, targetY) => {
		var walls = cga.buildMapCollisionMatrix();
		var grid = new PF.Grid(walls.matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		});

		var frompos = [curX - walls.x_bottom, curY - walls.y_bottom];
		var topos = [targetX - walls.x_bottom, targetY - walls.y_bottom];

		if (frompos[0] >= 0 && frompos[0] < walls.x_size &&
			frompos[1] >= 0 && frompos[1] < walls.y_size &&
			topos[0] >= 0 && topos[0] < walls.x_size &&
			topos[1] >= 0 && topos[1] < walls.y_size) {

			//console.log('using AStar path finder...');

			var path = finder.findPath(frompos[0], frompos[1], topos[0], topos[1], grid);

			if (path.length) {
				return true;
			}
		}

		return false;
	}
	/**
	 * 【UNAecho开发提醒】虽然此API使用开源包Pathfinding，但实际实现可能并不是游戏内的最短路径。
	 * 测试：
	 * 1、在法兰城安其摩酒吧的【酒吧里面】，mapindex3为1171。
	 * 2、起点[17,7]。
	 * 3、走至[9,1]，path:
	 * [ [ 17, 7 ], [ 17, 6 ], [ 16, 6 ], [ 15, 5 ], [ 14, 5 ], [ 13, 4 ], [ 12, 3 ], [ 11, 3 ], [ 10, 3 ], [ 9, 2 ], [ 9, 1, null, null, null, true ] ]
	 * 4、走至[8,7]，path:
	 * [ [ 17, 7 ], [ 17, 6 ], [ 16, 6 ], [ 15, 6 ], [ 14, 6 ], [ 13, 6 ], [ 12, 6 ], [ 11, 6 ], [ 10, 6 ], [ 9, 6 ], [ 8, 6 ], [ 8, 7, null, null, null, true ] ]
	 * 走至[9,1]路径居然比走至[8,7]的路径还短，这是有问题的。
	 * 有心情的时候，试着优化
	 * 
	 * @param {*} curX 起点x坐标
	 * @param {*} curY 起点y坐标
	 * @param {*} targetX 终点x坐标
	 * @param {*} targetY 终点y坐标
	 * @param {*} targetMap 终点传送至目标地图
	 * @param {*} dstX 如果targetMap没有发生变化，则表示传送至同地图x坐标
	 * @param {*} dstY 如果targetMap没有发生变化，则表示传送至同地图y坐标
	 * @param {*} newList 迭代Array,初始化请传空数组[]
	 * @returns Array
	 */
	cga.calculatePath = (curX, curY, targetX, targetY, targetMap, dstX, dstY, newList) => {
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

		if (frompos[0] >= 0 && frompos[0] < walls.x_size &&
			frompos[1] >= 0 && frompos[1] < walls.y_size &&
			topos[0] >= 0 && topos[0] < walls.x_size &&
			topos[1] >= 0 && topos[1] < walls.y_size) {

			//console.log('using AStar path finder...');

			var path = finder.findPath(frompos[0], frompos[1], topos[0], topos[1], grid);

			if (path.length) {
				var joint = PF.Util.compressPath(path);
				for (var i in joint) {
					joint[i][0] += walls.x_bottom;
					joint[i][1] += walls.y_bottom;
					if (joint[i][0] == targetX && joint[i][1] == targetY) {
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
			+ '地图最小值坐标 (' + (walls.x_bottom) + ', ' + (walls.y_bottom) + ')'
			+ '地图最大值坐标 (' + (walls.x_size) + ', ' + (walls.y_size) + ')'
			+ '寻路起始坐标 (' + (frompos[0]) + ', ' + (frompos[1]) + ')'
			+ '寻路目的坐标 (' + (topos[0]) + ', ' + (topos[1]) + ')'
			+ '【注意】此错误多数情况下是由于地图未下载完全导致，请手动在【地图】模式中下载地图再试试'
		);
		//return [];
	}

	/**
	 * UNAecho：一个仅对cga.calculatePath()的输入源做处理的API，用于规避路径上的NPC碰撞触发战斗的问题
	 * 多数用于探索迷宫时，走路遇见NPC，并被迫战斗
	 * 开发此API的原因是，cga.calculatePath()的A star算法使用cga.buildMapCollisionMatrix()的数据作为网格grid的输入
	 * 而cga.buildMapCollisionMatrix()是不会侦测到地图上的碰撞类NPC的，例如哈洞熊男、随机迷宫中的BOSS NPC等
	 * 这会导致cga.walklist()在走路时撞上NPC，进入战斗
	 * 此API仅对输入源cga.buildMapCollisionMatrix()传入true，使其绕开NPC走路
	 * 【注意】此API不能使用的情况：
	 * 1、想走到迷宫上下楼梯进入下一层时，或地图经常加载不好的地方
	 * 因为本质上是使用cga.buildMapCollisionMatrix(true)来进行A star算法
	 * 而传入true的cga.buildMapCollisionMatrix()会认为加载不好的地方的cell值大于0，导致寻路失败
	 * 2、在城镇内等多数地图使用，因为会规避很多门的point，效率低
	 * 
	 * @param {*} curX 起点x坐标
	 * @param {*} curY 起点y坐标
	 * @param {*} targetX 终点x坐标
	 * @param {*} targetY 终点y坐标
	 * @param {*} targetMap 终点传送至目标地图
	 * @param {*} dstX 如果targetMap没有发生变化，则表示传送至同地图x坐标
	 * @param {*} dstY 如果targetMap没有发生变化，则表示传送至同地图y坐标
	 * @param {*} newList 迭代Array,初始化请传空数组[]
	 * @returns Array
	 */
	cga.calculatePathAvoidNpc = (curX, curY, targetX, targetY, targetMap, dstX, dstY, newList) => {
		// 与cga.calculatePath()唯一不同之处是传入了true参数
		var walls = cga.buildMapCollisionMatrix(true);
		var grid = new PF.Grid(walls.matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		});

		var frompos = [curX - walls.x_bottom, curY - walls.y_bottom];
		var topos = [targetX - walls.x_bottom, targetY - walls.y_bottom];

		if (frompos[0] >= 0 && frompos[0] < walls.x_size &&
			frompos[1] >= 0 && frompos[1] < walls.y_size &&
			topos[0] >= 0 && topos[0] < walls.x_size &&
			topos[1] >= 0 && topos[1] < walls.y_size) {

			var path = finder.findPath(frompos[0], frompos[1], topos[0], topos[1], grid);

			if (path.length) {
				var joint = PF.Util.compressPath(path);
				for (var i in joint) {
					joint[i][0] += walls.x_bottom;
					joint[i][1] += walls.y_bottom;
					if (joint[i][0] == targetX && joint[i][1] == targetY) {
						joint[i][2] = targetMap;
						joint[i][3] = dstX;
						joint[i][4] = dstY;
					}
					joint[i][5] = true;
				}

				newList = joint.concat(newList);

				return newList;
			}
		}

		throw new Error('发现严重错误：寻路失败！\n'
			+ '地图最小值坐标 (' + (walls.x_bottom) + ', ' + (walls.y_bottom) + ')'
			+ '地图最大值坐标 (' + (walls.x_size) + ', ' + (walls.y_size) + ')'
			+ '寻路起始坐标 (' + (frompos[0]) + ', ' + (frompos[1]) + ')'
			+ '寻路目的坐标 (' + (topos[0]) + ', ' + (topos[1]) + ')'
			+ '【注意】此错误多数情况下是由于地图未下载完全导致，请手动在【地图】模式中下载地图再试试'
		);
	}

	cga.getMapXY = () => {
		var f = cga.GetMapXYFloat();
		return { x: parseInt(f.x / 64.0), y: parseInt(f.y / 64.0) };
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
		
		// UNAecho:【回避路径上NPC的方式】
		// 在index 6的地方传入true，则回避路径上可能碰撞的NPC，防止进入不必要的战斗，例如随即迷宫中的NPC
		cga.walkList({
			[坐标x, 坐标y, 地图索引(可为null), 传送目标x(可为null), 传送目标y(可为null),[],true]
		}, cb回调)

	*/
	/**
	* 
	* UNAecho开发提醒：cga.walkList有一个严重bug，就是在同一个地图不同的坐标之间传送（如：UD圣坛地图，[24, 76, '圣坛', 24, 71]）这种坐标时，会出现没切换坐标前就提前执行callback的情况。
	* 这会导致你传给cga.walkList的callback会提前执行，如果callback中含有坐标类的API，会直接导致报错(因为无法抵达。)
	* 使用cga.walkList时，要注意此事
	* 如果目标名称地图使用String类型，而非Number类型时，此bug出现的概率会略微降低。
	* 
	* 另外，我在参数list中，新增了一个参数，来实现躲避NPC走路的问题,具体格式见上面的调用方式
	* 【注意】当进行非探索性质的走路时（如去迷宫上下楼梯进入下一层），【不要使用】躲避NPC的方式行走。因为本身进入门的这个路程，就是踩在某个NPC单位然后检测被传送的。
	* 具体原因见cga.calculatePathAvoidNpc()的注解
	*/
	cga.walkList = (list, cb) => {

		//console.log('初始化寻路列表');
		//console.log(list);

		if (cga.isMoveThinking) {
			console.log('由于冲突，未运行的walkList:', list);
			throw new Error('发现严重错误：已有walkList在运行中');
		}

		cga.isMoveThinking = true;

		if (!cga.moveThink('walkList')) {
			// console.log('walkList被中断');
			console.log('cga.walkList被中断');
			cga.isMoveThinking = false;
			return;
		}

		var walkedList = [];
		var newList = list.slice(0);

		var walkCb = () => {

			if (newList.length == 0) {
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
			// UNAecho：如果为true，则绕开所有cga.GetMapCollisionTable(true)的cell值大于0的点
			var avoidNpc = newList[0][6];

			var walked = newList[0].slice(0);
			walkedList.push(walked);
			newList.shift();

			var curmap = cga.GetMapName();
			var curpos = cga.GetMapXY();
			var curmapindex = cga.GetMapIndex().index3;

			// console.log('当前地图: ' + curmap + ', 序号 ' + curmapindex);
			// console.log('当前 (%d, %d) -> 目标 (%d, %d)', curpos.x, curpos.y, targetX, targetY);
			if (targetMap) {
				// console.log('目标地图');
				// console.log(targetMap);
			}

			var end = (arg) => {

				if (cga.NoRollbackMap.find((n) => {
					return n == curmap;
				}) != undefined) {
					cga.isMoveThinking = false;
					cb(null);
					return;
				}

				var waitBattle2 = () => {
					if (!cga.isInNormalState()) {
						setTimeout(waitBattle2, 1500);
						return;
					}

					if (!cga.moveThink('walkList')) {
						// console.log('walkList被中断');
						console.log('cga.walkList中的end()被中断');
						cga.isMoveThinking = false;
						return;
					}

					var curpos = cga.GetMapXY();
					if (typeof walkedList[walkedList.length - 1][2] != 'string' &&
						typeof walkedList[walkedList.length - 1][2] != 'number' &&
						(curpos.x != walkedList[walkedList.length - 1][0] ||
							curpos.y != walkedList[walkedList.length - 1][1])
					) {

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

			var walker = (err, reason) => {

				if (!cga.moveThink('walkList')) {
					// console.log('walkList被中断');
					console.log('cga.walkList中的walker()被中断');
					cga.isMoveThinking = false;
					return;
				}

				//console.log(result);
				//console.log(reason);

				if (err) {

					if (reason == 4) {
						//console.log('地图发生非预期的切换！');
						var curmap = cga.GetMapName();
						var curmapindex = cga.GetMapIndex().index3;

						console.log('当前地图: ' + curmap);
						console.log('当前地图序号: ' + curmapindex);
					}

					//we are in battle status, wait a second then try again until battle is end
					//or we are forcely moved back to an position by server
					if (reason == 2 || reason == 5) {

						var waitBattle = () => {
							if (!cga.isInNormalState()) {
								// UNAecho:在这里添加一个if逻辑，使得在战斗中登出，可以被识别出来。防止登出后行走出现cga.walklist冲突的情况。
								// 逻辑开始
								if (!cga.moveThink('walkList')) {
									console.log('cga.walkList在等待战斗中被打断！');
									cga.isMoveThinking = false;
									return;
								}// 逻辑结束
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

							if (typeof targetMap == 'string' && curmap == targetMap) {

								if (newList.length == 0) {
									console.log('寻路正常结束1');
									end({ map: targetMap });
									return;
								}

								walkCb();
								return;
							}
							else if (typeof targetMap == 'number' && curmapindex == targetMap) {

								if (newList.length == 0) {
									console.log('寻路正常结束2');
									end({ map: targetMap });
									return;
								}

								walkCb();
								return;
							}
							else if (typeof walkedList[walkedList.length - 1] != 'undefined' &&
								typeof walkedList[walkedList.length - 1][2] == 'string' &&
								walkedList[walkedList.length - 1][2] != '' &&
								curmap != walkedList[walkedList.length - 1][2]) {
								console.log('目标地图错误，回滚到上一路径');
								console.log('预期地图 ' + walkedList[walkedList.length - 1][2] + ', 当前地图 ' + curmap);

								var temp = walkedList.pop();
								newList = cga.calculatePath(curpos.x, curpos.y, temp[0], temp[1], temp[2], null, null, newList);
							}
							else if (typeof walkedList[walkedList.length - 2] != 'undefined' &&
								typeof walkedList[walkedList.length - 2][2] == 'string' &&
								walkedList[walkedList.length - 2][2] != '' &&
								curmap != walkedList[walkedList.length - 2][2]) {
								console.log('目标地图错误，回滚到上上个路径');
								console.log('预期地图 ' + walkedList[walkedList.length - 2][2] + ', 当前地图 ' + curmap);

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
					} else if (reason == 3) {

						//console.log('当前寻路卡住，抛出错误！');
						throw new Error('发现严重错误：当前寻路卡住！');
					}

					cga.isMoveThinking = false;
					cb(err, reason);
					return;
				}

				if (newList.length == 0) {
					// console.log('寻路正常结束3');
					end({ pos: [targetX, targetY], map: targetMap });
					return;
				}

				walkCb();
			}

			if (targetX == curpos.x && targetY == curpos.y) {
				var isEntrance = typeof targetMap == 'string' || typeof targetMap == 'number' || (targetMap instanceof Array) ? true : false;
				if (isEntrance) {
					cga.FixMapWarpStuck(1);
					cga.AsyncWalkTo(targetX, targetY, targetMap, null, null, walker);
					return;
				}
				walkCb();
				return;
			}

			if (isAStarPath !== true) {
				if (avoidNpc) {
					// console.log('使用躲避NPC的方式寻路..')
					newList = cga.calculatePathAvoidNpc(curpos.x, curpos.y, targetX, targetY, targetMap, dstX, dstY, newList);
				} else {
					newList = cga.calculatePath(curpos.x, curpos.y, targetX, targetY, targetMap, dstX, dstY, newList);
				}
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
	cga.findPlayerSkill = function (name) {
		var match = arguments[1] ? arguments[1] : true;
		var skill = cga.GetSkillsInfo().find((sk) => {
			if (match && sk.name == name) {
				return true;
			}
			if (!match && sk.name.indexOf(name) != -1) {
				return true;
			}
			return false;
		});

		return skill != undefined ? skill : null;
	}

	/**
	 * UNAecho开发笔记：这是一个查找宝箱的API
	 * 只有当人物距离目标小于12(小于等于11的投影距离)时，cga.GetMapUnits()才会监测到其存在。
	 * 并且在战斗中、地图切换时是无效的
	 * @param {*} filter 
	 * @returns 
	 */
	cga.findCrate = function (filter) {
		var unit = cga.GetMapUnits().find((u) => {
			if (u.valid == 2 && u.type == 2 && u.model_id != 0 && (u.flags & 1024) != 0)
				return filter(u);

			return false;
		});

		return unit != undefined ? unit : null;
	}

	/**
	 * UNAecho开发笔记：这是一个搜索NPC，支持过滤器的API
	 * 只有当人物距离目标小于12(小于等于11的投影距离)时，cga.GetMapUnits()才会监测到其存在。
	 * 并且在战斗中、地图切换时是无效的
	 * @param {*} filter 
	 * @returns 
	 */
	cga.findNPCEx = function (filter) {
		var unit = cga.GetMapUnits().find((u) => {
			if (u.valid == 2 && u.type == 1 && u.model_id != 0 && (u.flags & 4096) != 0)
				return filter(u);

			return false;
		});

		return unit != undefined ? unit : null;
	}

	//按名称搜索NPC
	cga.findNPC = function (name) {
		return cga.findNPCEx((u) => {
			return (u.unit_name == name);
		});
	}

	//按坐标搜索NPC
	cga.findNPCByPosition = function (name, x, y) {
		return cga.findNPCEx((u) => {
			return (u.unit_name == name && x == u.xpos && y == u.ypos);
		});
	}

	/**
	 * UNAecho:按名称持续搜索NPC，直至找到才调用callback，停止搜索。
	 * 【注意】此API依赖cga.findNPCEx()，有小于12的距离限制，详情参考cga.findNPCEx()注释
	 * @param {*} name 
	 * @param {*} cb 
	 * @returns 
	 */
	cga.findNPCWithCallback = function (name, cb) {
		let npc = cga.findNPC(name)
		if (npc == null) {
			setTimeout(cga.findNPCWithCallback, 1000, name, cb)
			return
		}
		cb(npc)
		return
	}

	//取背包中的物品数量
	//参数1：物品名, 或#物品id，或过滤函数
	//参数2：是否包括装备栏
	cga.getItemCount = function (filter) {
		var includeEquipment = arguments[1] === true ? true : false;
		var items = cga.GetItemsInfo();
		var count = 0;
		if (typeof filter == 'string' && filter.charAt(0) == '#') {
			var itemid = parseInt(filter.substring(1));
			items.forEach((item) => {
				if (!includeEquipment && item.pos < 8)
					return false;
				if (item.itemid == itemid)
					count += item.count > 0 ? item.count : 1;
			});
		} else if (typeof filter == 'number') {
			var itemid = filter;
			items.forEach((item) => {
				if (!includeEquipment && item.pos < 8)
					return false;
				if (item.itemid == itemid)
					count += item.count > 0 ? item.count : 1;
			});
		} else if (typeof filter == 'function') {
			var itemid = filter;
			items.forEach((item) => {
				if (!includeEquipment && item.pos < 8)
					return false;
				if (filter(item) == true)
					count += item.count > 0 ? item.count : 1;
			});
		} else {
			items.forEach((item) => {
				if (!includeEquipment && item.pos < 8)
					return false;
				if (item.name == filter)
					count += item.count > 0 ? item.count : 1;
			});
		}
		return count;
	}

	/**
	 * UNAecho:取背包中宠物的数量
	 * 参数1：宠物自定义名，或过滤函数
	 * 参数2：在参数1为String的前提下，是否包含宠物的默认名称。
	 * @param {*} filter 宠物自定义名, 或过滤函数。注意，仅在filter为String类型时，参数2才会生效
	 * @returns 
	 */
	cga.getPetCount = function (filter) {
		let includeRealname = arguments[1] === true ? true : false;
		let pets = cga.GetPetsInfo()
		let count = 0;
		if (typeof filter == 'string') {
			pets.forEach((pet) => {
				if (pet.name && pet.name == filter) {
					count += 1
				} else if (includeRealname && pet.realname == filter) {
					count += 1
				}
			});
		} else if (typeof filter == 'function') {
			pets.forEach((pet) => {
				if (filter(pet) == true) {
					count += 1
				}
			});
		}
		return count;
	}

	//任务
	cga.task = {};

	//任务对象构造函数
	cga.task.Task = function (name, stages, requirements) {

		this.stages = stages;
		this.name = name;
		this.anyStepDone = true;

		this.requirements = requirements

		this.isDone = function (index) {
			for (var i = this.requirements.length - 1; i >= index; --i) {
				if (typeof this.requirements[i] == 'function' && this.requirements[i]())
					return true;
			}
			return false;
		}

		this.isDoneSingleStep = function (index) {
			if (typeof this.requirements[index] == 'function' && this.requirements[index]())
				return true;
			return false;
		}

		this.doNext = function (index, cb) {
			if (index >= this.stages.length) {
				console.log('任务：' + this.name + ' 已完成！');
				if (cb)
					cb(true);
			} else {
				this.doStage(index, cb);
			}
		}

		this.doStage = function (index, cb) {
			if (this.anyStepDone) {
				if (this.isDone(index)) {
					console.log('第' + (index + 1) + '/' + stages.length + '阶段已完成，跳过。');
					this.doNext(index + 1, cb);
					return;
				}
			} else {
				if (this.isDoneSingleStep(index)) {
					console.log('第' + (index + 1) + '/' + stages.length + '阶段已完成，跳过。');
					this.doNext(index + 1, cb);
					return;
				}
			}
			console.log('开始执行第' + (index + 1) + '阶段：');
			console.log(this.stages[index].intro);
			var objThis = this;
			objThis.stages[index].workFunc(function (r, jumpIndex) {
				if (r === false || r instanceof Error) {
					if (cb)
						cb(r);
					return;
				}
				//console.trace()

				if (r === true || r === null) {
					console.log('第' + (index + 1) + '阶段执行完成。');
					objThis.doNext(index + 1, cb);
				} else if (r == 'restart stage') {
					console.log('第' + (index + 1) + '阶段请求重新执行。');
					objThis.doNext(index, cb);
				} else if (r == 'restart task') {
					console.log('第' + (index + 1) + '阶段请求重新执行。');
					objThis.doNext(index, cb);
				} else if (r == 'jump' && typeof jumpIndex == 'number') {
					console.log('第' + (index + 1) + '阶段请求跳转至第' + (jumpIndex + 1) + '阶段');
					objThis.doNext(jumpIndex, cb);
				} else {
					throw new Error('无效参数');
				}
				// 注意这里UNA添加了index参数进入任务的workFunc中，与cb同级别。目的是为了stage中可以拿到当前index的参数，判断当前task的进度。
			}, index);
		}

		this.doTask = function (cb) {
			console.log('任务：' + this.name + ' 开始执行，共' + this.stages.length + '阶段。');
			this.doStage((typeof this.jumpToStep != 'undefined') ? this.jumpToStep : 0, cb);
		}

		return this;
	}

	/**
	 * UNAecho: 对cga.task.Task进行功能扩充升级，稳定运行后再取代cga.task.Task
	 * 带有解耦性质的playerthink功能的task模块，目的是在task中也使用playerthink的打断机制，与任务的其它属性一样，taskPlayerThink需要外部自定义函数并传入
	 * 并且新增了任务跳阶段功能，可以跳转至task的任何一个阶段
	 * @param {*} name 
	 * @param {*} stages 
	 * @param {*} requirements 
	 * @param {*} taskPlayerThink 
	 * @returns 
	 */
	cga.task.TaskWithThink = function (name, stages, requirements, taskPlayerThink) {

		this.name = name;
		this.stages = stages;
		this.requirements = requirements
		this.taskPlayerThink = taskPlayerThink

		this.anyStepDone = true;
		this.playerThinkRunning = false
		/**
		 * playerThinkTimer的运行开关。playerThinkTimer的运行机制参考练级主插件的playerThinkTimer。
		 * playerThinkTimer会持续运行taskPlayerThink()，来实现playerThink的功能。
		 * 与练级时不同，taskAPI的playerThinkTimer在任务结束时，需要关掉。将此flag置为false即可
		 */
		this.playerThinkTimerRunning = false

		var interrupt = require('./通用挂机脚本/公共模块/interrupt');
		this.taskMoveThinkInterrupt = new interrupt();
		this.taskPlayerThinkInterrupt = new interrupt();

		this.moveThink = (arg) => {

			if (this.taskMoveThinkInterrupt.hasInterrupt())
				return false;

			if (arg == 'freqMoveMapChanged') {
				this.taskPlayerThinkInterrupt.requestInterrupt();
				return false;
			}

			return true;
		}

		// 打断后所执行的逻辑。多数情况是：执行一个func()，然后回到任务的某一阶段。
		this.interruptTask = (obj, cb2) => {
			let doCallBack = (obj, cb2) => {
				if (typeof obj == 'function') {
					// 执行打断时提供的func，并传入上次打断时的任务index，方便得知任务进行到哪一步了。
					// taskIndex：外部传入，告知执行完obj()之后，回到任务的哪个index
					obj((taskIndex) => {
						if (typeof taskIndex == 'number') {
							console.log('打断任务后，被要求重新执行第' + taskIndex + '步')
							this.doNext(taskIndex, cb2);
						} else {
							console.log('打断任务之后没有传入任务再次进行的步骤,任务结束。执行this.doTask()的callback')
							this.doNext(this.stages.length, cb2);
						}
						return
					})
				} else {
					console.log('打断任务之后没有传入cb,任务结束。执行this.doTask()的callback')
					this.doNext(this.stages.length, cb2);
					return
				}
			}

			if (this.taskPlayerThinkInterrupt.hasInterrupt()) {
				console.log('objThis.taskPlayerThinkInterrupt.hasInterrupt')
				doCallBack(obj, cb2)
				return
			} else {
				/**	
				 * UNAecho:cga.walklist有一个bug，当角色一直走直线时，即便是cga.moveThink()返回false，也不会打断走路。
				 * 只有当角色出现拐弯、斜向走路时，才会打断walklist。
				 * 推测是cga.AsyncWalkTo底层实现的走路机制问题，当角色不走直线时，才会重新调用一次cga.walklist的walker()，才能触发打断机制，也就是cga.moveThink('walkList') = false
				*/
				this.taskMoveThinkInterrupt.requestInterrupt(() => {
					if (cga.isInNormalState()) {
						console.log('游戏状态为正常（非切图非战斗），尝试打断walklist。只有当人物处于非直线行走时才触发打断。')
						doCallBack(obj, cb2)
						return true;
					}
					return false;
				});
			}
		}

		this.playerThinkTimer = () => {
			if (!this.playerThinkTimerRunning) {
				console.log('由于任务结束，任务：' + this.name + ' 的playerThinkTimer已关闭。');
				return
			}
			if (this.playerThinkRunning) {
				var obj = this.taskPlayerThink()
				if (obj === false) {
					console.log('taskPlayerThink off');
					this.playerThinkRunning = false;
				} else if (typeof obj == 'function') {
					console.log('taskPlayerThink off and do function');
					this.playerThinkRunning = false;
					this.interruptTask(obj, this.taskCallback)
				}
			}

			setTimeout(this.playerThinkTimer, 1500);
		}

		this.isDone = function (index) {
			for (var i = this.requirements.length - 1; i >= index; --i) {
				if (typeof this.requirements[i] == 'function' && this.requirements[i]())
					return true;
			}
			return false;
		}

		this.isDoneSingleStep = function (index) {
			if (typeof this.requirements[index] == 'function' && this.requirements[index]())
				return true;
			return false;
		}

		this.doNext = function (index, cb) {
			if (index >= this.stages.length) {
				console.log('任务：' + this.name + ' 已完成！');
				// 关闭playerThinkTimer
				this.playerThinkTimerRunning = false
				if (cb)
					cb(true);
			} else {
				this.doStage(index, cb);
			}
		}

		this.doStage = function (index, cb) {
			if (this.anyStepDone) {
				if (this.isDone(index)) {
					console.log('第' + index + '/' + (stages.length > 0 ? stages.length - 1 : 0) + '阶段已完成，跳过。');
					this.doNext(index + 1, cb);
					return;
				}
			} else {
				if (this.isDoneSingleStep(index)) {
					console.log('第' + index + '/' + (stages.length > 0 ? stages.length - 1 : 0) + '阶段已完成，跳过。');
					this.doNext(index + 1, cb);
					return;
				}
			}
			console.log('开始执行第' + index + '阶段：');
			console.log(this.stages[index].intro);
			var objThis = this;
			objThis.stages[index].workFunc(function (r, obj) {
				if (r === false || r instanceof Error) {
					if (cb)
						cb(r);
					return;
				}
				if (r === true || r === null) {
					console.log('第' + index + '阶段执行完成。');
					objThis.doNext(index + 1, cb);
				} else if (r == 'restart stage') {
					console.log('第' + index + '阶段请求重新执行。');
					objThis.doNext(index, cb);
				} else if (r == 'task interrupt') {
					console.log('第' + index + '阶段请求中断任务。');
					objThis.interruptTask(index, obj, cb)
					return
				} else if (r == 'playerThink on') {
					if (objThis.playerThinkRunning) {
						console.log('taskPlayerThink is running');
					} else {
						objThis.taskPlayerThinkInterrupt.hasInterrupt();//restore interrupt state
						console.log('taskPlayerThink on');
						objThis.playerThinkRunning = true
					}
				} else if (r == 'jump' && typeof obj == 'number') {
					console.log('第' + index + '阶段请求跳转至第' + obj + '阶段');
					objThis.doNext(obj, cb);
				} else {
					throw new Error('无效参数r:', r);
				}
				// 注意这里UNAecho添加了index参数进入任务的workFunc中，与cb同级别。目的是为了stage中可以拿到当前index的参数，判断当前task的进度。
			}, index);
		}

		this.doTask = function (cb) {
			console.log('任务：' + this.name + ' 开始执行，共' + this.stages.length + '阶段。');

			this.taskCallback = cb

			// 如果任务自定义了属于任务自己的playerthink，则开启监听
			if (typeof this.taskPlayerThink == 'function') {
				console.log('任务：' + this.name + ' 包含自定义playerthink，将在适当的时候运行..');
				this.playerThinkTimerRunning = true
				this.playerThinkTimer()
			}

			this.doStage((typeof this.jumpToStep != 'undefined') ? this.jumpToStep : 0, this.taskCallback);
		}

		// 注册打断walklist的方法
		cga.registerMoveThink(this.moveThink);

		return this;
	}

	//等待NPC出现
	cga.task.waitForNPC = (filter, cb) => {
		if (!cga.findNPC(filter)) {
			setTimeout(cga.task.waitForNPC, 10000, filter, cb);
			cga.SayWords('', 0, 3, 1);
			return;
		}
		// 加个时间提醒
		if (typeof filter == 'string')
			console.log('【' + filter + '】出现，时间:', cga.GetSysTime())
		cb(null);
	}

	cga.gather = {};

	cga.gather.stats = function (itemname, itemgroupnum) {
		this.begintime = moment();
		this.prevcount = cga.getItemCount(itemname);
		this.itemname = itemname;
		this.itemgroupnum = itemgroupnum;
		this.printStats = function () {
			var count = cga.getItemCount(this.itemname) - this.prevcount;

			console.log('一次采集完成，耗时' + moment.duration(moment() - this.begintime, 'ms').locale('zh-cn').humanize());
			console.log('获得 ' + itemname + ' x ' + count + '，共 ' + parseInt(count / this.itemgroupnum) + ' 组。');

			this.begintime = moment();
		}
		return this;
	}

	/**
	 * UNAecho:采集技能采集某等级物品所获经验的二维矩阵
	 * 不打卡
	 */
	cga.gather.experience = [
		[2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
		[-1, 2, 1, 1, 1, 1, 1, 1, 0, 0],
		[-1, -1, 2, 1, 1, 1, 1, 1, 1, 0],
		[-1, -1, -1, 2, 1, 1, 1, 1, 1, 0],
		[-1, -1, -1, -1, 2, 1, 1, 1, 1, 0],
		[-1, -1, -1, -1, -1, 2, 1, 1, 1, 0],
		[-1, -1, -1, -1, -1, -1, 2, 1, 1, 0],
		[-1, -1, -1, -1, -1, -1, -1, 2, 1, 0],
		[-1, -1, -1, -1, -1, -1, -1, -1, 2, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	]

	/**
	 * UNAecho:采集技能采集某等级物品所获经验的二维矩阵
	 * 打卡
	 */
	cga.gather.experiencePunchclock = [
		[4, 2, 1, 1, 1, 1, 1, 1, 0, 0],
		[-1, 4, 2, 2, 1, 1, 1, 1, 1, 0],
		[-1, -1, 4, 3, 2, 2, 1, 1, 1, 0],
		[-1, -1, -1, 4, 3, 2, 2, 2, 1, 0],
		[-1, -1, -1, -1, 4, 3, 2, 2, 2, 0],
		[-1, -1, -1, -1, -1, 4, 3, 3, 2, 0],
		[-1, -1, -1, -1, -1, -1, 4, 3, 3, 0],
		[-1, -1, -1, -1, -1, -1, -1, 4, 3, 0],
		[-1, -1, -1, -1, -1, -1, -1, -1, 4, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	]

	/**
	 * 
	 * UNAecho:获取采集目标物品所得经验
	 * @param {*} itemLv 目标物品等级
	 * @param {*} skillLv 采集等级
	 * @param {*} punchclock 是否打卡
	 */
	cga.gather.getExperience = (itemLv, skillLv, punchclock = false) => {
		if (itemLv < 1 || skillLv < 1) {
			throw new Error('物品等级或技能等级不能小于1')
		}

		// 技能10级或以上不会再获得经验，返回0
		if (skillLv >= 10) {
			return 0
		}
		return punchclock ? cga.gather.experiencePunchclock[itemLv - 1][skillLv - 1] : cga.gather.experience[itemLv - 1][skillLv - 1]
	}

	cga.craft = {}

	cga.craft.buyFabricLv1Multi = (arr, cb) => {
		cga.travel.falan.toFabricStore(() => {
			cga.walkList([
				[8, 7],
			], () => {
				cga.TurnTo(8, 6);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(() => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.craft.buyFabricLv1 = (id, count, cb) => {
		cga.craft.buyFabricLv1Multi([{ index: id, count: count }], cb);
	}

	cga.craft.buyFabricLv2Multi = (arr, cb) => {
		cga.travel.falan.toTeleRoom('维诺亚村', () => {
			cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[9, 16, '维诺亚村'],
				[56, 42, '装备品店'],
				[13, 8],
			], () => {
				cga.TurnTo(13, 6);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(() => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.craft.buyFabricLv2 = (id, count, cb) => {
		cga.craft.buyFabricLv2Multi([{ index: id, count: count }], cb);
	}

	cga.craft.buyFabricLv3Multi = (arr, cb) => {
		cga.travel.falan.toTeleRoom('杰诺瓦镇', () => {
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[43, 23, '杂货店'],
				[11, 12],
			], () => {
				cga.TurnTo(13, 12);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(() => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.craft.buyFabricLv3 = (id, count, cb) => {
		cga.craft.buyFabricLv3Multi([{ index: id, count: count }], cb);
	}

	cga.craft.buyFabricLv4Multi = (arr, cb) => {
		cga.travel.falan.toTeleRoom('魔法大学', () => {
			cga.walkList([
				[74, 93, '魔法大学内部'],
				[29, 43, '更衣室'],
				[11, 8],
			], () => {
				cga.TurnTo(11, 6);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(() => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.craft.buyFabricLv4 = (id, count, cb) => {
		cga.craft.buyFabricLv4Multi([{ index: id, count: count }], cb);
	}

	cga.craft.buyFabricLv5Multi = (arr, cb) => {
		cga.travel.falan.toTeleRoom('阿巴尼斯村', () => {
			cga.walkList([
				[5, 4, 4313],
				[13, 5],
			], () => {
				cga.TurnTo(13, 3);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.BuyNPCStore(arr);
						cga.AsyncWaitNPCDialog(() => {
							cb(null);
						});
					});
				});
			});
		});
	}

	cga.craft.buyFabricLv5 = (id, count, cb) => {
		cga.craft.buyFabricLv5Multi([{ index: id, count: count }], cb);
	}

	//搜索第一个可鉴定的物品
	cga.findAssessableItem = () => {
		var skill = cga.findPlayerSkill('鉴定');
		var mp = cga.GetPlayerInfo().mp;
		var found = cga.getInventoryItems().find((item) => {
			return !item.assessed && skill.lv >= item.level && mp >= item.level * 10;
		});
		return found == undefined ? null : found;
	}

	//鉴定背包中所有的物品
	cga.assessAllItems = (cb) => {
		var item = cga.findAssessableItem();
		if (item) {
			cga.manipulateItemEx({
				skill: '鉴定',
				itempos: item.pos,
				immediate: true,
			}, (err, results) => {
				setTimeout(cga.assessAllItems, 500, cb);
			})
		} else {
			cb(null);
			return;
		}
	}

	cga.findItem = (filter) => {

		var items = cga.getInventoryItems();

		if (typeof filter == 'string' && filter.charAt(0) == '#') {
			var found = items.find((item) => {
				return item.itemid == parseInt(filter.substring(1));
			})

			return found != undefined ? found.pos : -1;
		}

		var found = items.find((item) => {
			if (typeof filter == 'string')
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
	cga.findPet = (filter, customerName = false) => {
		var pets = cga.GetPetsInfo();
		var found = pets.find((pet) => {
			if (typeof filter == 'string') {
				if (!customerName && pet.realname == filter) {
					return true
				} else if (customerName && pet.name == filter) {
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
	cga.findItemArray = (filter) => {

		var arr = [];
		var items = cga.getInventoryItems();

		if (typeof filter == 'function') {
			items.forEach((item) => {
				if (filter(item)) {
					arr.push({
						itempos: item.pos,
						itemid: item.itemid,
						name: item.name,
						count: (item.count < 1) ? 1 : item.count,
						type: item.type,
					});
				}
			})
			return arr;
		}

		if (typeof filter == 'string' && filter.charAt(0) == '#') {
			items.forEach((item) => {
				if (item.itemid == filter.substring(1)) {
					arr.push({
						itempos: item.pos,
						itemid: item.itemid,
						count: (item.count < 1) ? 1 : item.count,
					});
				}
			})
			return arr;
		}

		items.forEach((item) => {
			if (filter instanceof RegExp) {
				//console.log(itemname.exec(items[i].name));
				if (filter.exec(item.name)) {
					arr.push({
						itempos: item.pos,
						itemid: item.itemid,
						count: (item.count < 1) ? 1 : item.count,
					});
				}
			}
			else if (typeof filter == 'string') {
				if (item.name == filter) {
					arr.push({
						itempos: item.pos,
						itemid: item.itemid,
						count: (item.count < 1) ? 1 : item.count,
					});
				}
			}
		});
		return arr;
	}

	// 出售物品
	// UNAecho:增加超时选项，防止因为延迟，出现人物无限往返cb和cga.AsyncWaitNPCDialog两种状态。
	// 最常见的是双百制造桥头卖装备，与NPC对话过频导致延迟较大(可能为官方有意为之)，导致角色无限执行去扔布，和跟NPC对话卖东西。对话又弹不出框，弹出框又去扔布给取消掉。
	cga.sellArray = (sellarray, cb, timeout = 3000) => {
		cga.AsyncWaitNPCDialog((err, dlg) => {
			if (err) {
				cb(err);
				return;
			}
			var numOpt = dlg.message.charAt(dlg.message.length - 1);
			cga.ClickNPCDialog(0, numOpt == '3' ? 1 : 0);
			cga.AsyncWaitNPCDialog(() => {
				cga.SellNPCStore(sellarray);
				cga.AsyncWaitNPCDialog(() => {
					cb(true);
				});
			});
		}, timeout);
	}

	//获取背包里能够出售的物品
	cga.getSellStoneItem = () => {
		var pattern = /(.+)的卡片/;
		var sellArray = []
		cga.getInventoryItems().forEach((item) => {
			// UNAecho:有时候会不小心捡到未鉴定的封印卡，其名称也是【卡片？】如果不作判断，会直接卡在商店处一直无法动弹。
			if (item.name == '魔石' || (item.name == '卡片？' && item.type != 40) || pattern.exec(item.name)) {
				sellArray.push({
					itempos: item.pos,
					itemid: item.itemid,
					count: (item.count < 1) ? 1 : item.count,
				});
			}
		})
		return sellArray;
	}

	//清理背包里无用的物品
	cga.cleanInventory = (count, cb) => {
		if (cga.getInventoryItems().length >= 21 - count) {
			var items = cga.getSellStoneItem();
			if (items.length > 0) {
				cga.DropItem(items[0].itempos);
				if (cb)
					setTimeout(cga.cleanInventory, 500, count, cb);
			} else {
				cb(new Error('没有可以扔的物品了'));
			}
		} else {
			cb(null);
		}
	}

	//循环清理背包里无用的物品直到无东西可清
	cga.cleanInventoryEx = (filter, cb) => {
		var items = cga.getInventoryItems().filter(filter);
		if (items.length > 0) {
			cga.DropItem(items[0].pos);
			setTimeout(cga.cleanInventory, 500, count, filter, cb);
		} else {
			cb(null);
		}
	}

	/**
	 * UNAecho:循环清理背包，将超过的部分丢弃。
	 * 利用累计数量，让背包中的一个或多个道具不少于某数量
	 * 
	 * @param {String|Number|Function} itemFilter 使用方法与cga.findItem()一致，如果想指定多个道具，请使用function类型
	 * @param {Number|Function} countFilter 可为Number类型数字或者function类型函数：
	 * 1、Number类型，限制满足itemFilter的所有道具数量。例：countFilter=20，则满足itemFilter的所有道具数量均不得低于20。超过的部分会被丢弃。
	 * 2、Function类型，限制满足itemFilter的所有道具自定义数量数量。例：countFilter(it) return 20，则满足itemFilter的指定道具数量不得低于20。超过的部分会被丢弃。
	 * Function类型可以指定多种道具的数量，如指定A最少20个，B最多5个等等
	 * 
	 * 【注意】由于没有道具堆叠分割功能，故该API维持的数量会大于等于countFilter的数量。
	 * 例：itemFilter='牛肉',countFilter=20
	 * 当人物只有1格牛肉，且count=21时，此API依然会保留此格道具，因为丢弃此格道具，牛肉的count数量则会变为0了。
	 * @returns 
	 */
	cga.maintainItem = (itemFilter, countFilter) => {

		// 道具累计缓存
		let sum = {}
		let maintainFilter = (it) => {
			if (typeof itemFilter == 'string' && it.name == itemFilter) {
				return overrun(it)
			} else if (typeof itemFilter == 'number' && it.itemid == itemFilter) {
				return overrun(it)
			} else if (typeof itemFilter == 'string' && itemFilter.charAt(0) == '#' && it.itemid == parseInt(itemFilter.substring(1))) {
				return overrun(it)
			} else if (typeof itemFilter == 'function' && itemFilter(it)) {
				return overrun(it)
			} else {
				return false
			}
		}

		// 是否超过维持数量？不超过则累计，超过则丢弃
		let overrun = (it) => {
			if (!sum.hasOwnProperty(it.itemid)) {
				sum[it.itemid] = 0
			}
			if (typeof countFilter == 'number' && (sum[it.itemid] + it.count <= countFilter || (sum[it.itemid] + it.count > countFilter && sum[it.itemid] < countFilter))) {
				sum[it.itemid] += it.count
				// console.log("pos"+it.pos+"小于累计,sum:", sum)
				return false
			} else if (typeof countFilter == 'function' && (sum[it.itemid] + it.count <= countFilter(it) || (sum[it.itemid] + it.count > countFilter(it) && sum[it.itemid] < countFilter(it)))) {
				sum[it.itemid] += it.count
				return false
			} else {
				// console.log("pos"+it.pos+"大于丢弃,sum:", sum)
				return true
			}
		}

		let loop = () => {
			let pos = cga.findItem(maintainFilter)
			if (pos != -1) {
				cga.DropItem(pos);
				sum = {}
				setTimeout(loop, 1500);
				return
			}
			console.log('cga.maintainItem()清理完毕..')
			return
		}

		loop()
		return
	}

	//出售魔石
	cga.sellStone = (cb) => {
		cga.AsyncWaitNPCDialog((err, dlg) => {
			if (err) {
				cb(err);
				return;
			}

			var numOpt = dlg.message.charAt(dlg.message.length - 1);
			cga.ClickNPCDialog(0, numOpt == '3' ? 1 : 0);
			cga.AsyncWaitNPCDialog(() => {
				cga.SellNPCStore(cga.getSellStoneItem());
				setTimeout(cb, 1000, null);
			});
		});
	}

	//获取坐标之间的距离
	cga.getDistance = (x1, y1, x2, y2) => {
		return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
	}

	//判断坐标之间的距离是否小于等于1
	cga.isDistanceClose = (x1, y1, x2, y2) => {
		if (x1 - x2 <= 1 && x1 - x2 >= -1 && y1 - y2 <= 1 && y1 - y2 >= -1)
			return true;
		return false;
	}

	//保存每个人物自己的个人配置文件，用于保存银行格信息和登出点信息
	cga.savePlayerConfig = (config, cb) => {
		console.log('正在保存个人配置文件...');

		var configPath = __dirname + '\\个人配置';
		var configName = configPath + '\\个人配置_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';

		fs.mkdir(configPath, (err) => {
			if (err && err.code != 'EEXIST') {
				console.log('个人配置文件保存失败：');
				console.log(err);
				if (cb) cb(err);
				return;
			}

			fs.writeFile(configName, JSON.stringify(config), (err) => {
				if (err) {
					console.log('个人配置文件保存失败：');
					console.log(err);
					if (cb) cb(err);
					return;
				}
				console.log('个人配置文件保存成功!...');
				// 有时候写入文件与玩家登出可能间隔很短，因为登出也会写入个人配置，所以加一个回调延迟，防止同时写入
				if (cb) {
					setTimeout(cb, 300);
				}
			});
		});
	}

	//读取每个人物自己的个人配置文件
	cga.loadPlayerConfig = () => {
		console.log('正在读取个人配置文件...');

		var configPath = __dirname + '\\个人配置';
		var configName = configPath + '\\个人配置_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';

		try {
			var json = fs.readFileSync(configName, 'utf8');

			if (typeof json != 'string' || !json.length)
				throw new Error('个人配置文件格式错误或文件不存在');

			var obj = JSON.parse(json);

			return obj;
		}
		catch (e) {
			if (e.code != 'ENOENT') {
				console.log('读取个人配置时发生错误：');
				console.log(e);
			} else {
				console.log('读取个人配置文件不存在');
			}

		}

		return null;
	}

	//保存每个人物自己的个人配置文件，用于保存银行格信息和登出点信息
	cga.savePlayerOfflineData = (config, cb) => {
		console.log('正在保存个人离线数据文件...');

		var path = __dirname + '\\离线数据';
		var fileName = path + '\\离线数据_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';

		fs.mkdir(path, (err) => {
			if (err && err.code != 'EEXIST') {
				console.log('个人离线数据文件保存失败：');
				console.log(err);
				if (cb) cb(err);
				return;
			}

			fs.writeFile(fileName, JSON.stringify(config), (err) => {
				if (err) {
					console.log('个人离线数据文件保存失败：');
					console.log(err);
					if (cb) cb(err);
					return;
				}
				console.log('个人离线数据文件保存成功!...');
				if (cb) cb(null)
				return
			});
		});
	}

	//读取每个人物自己的个人配置文件
	cga.loadPlayerOfflineData = () => {
		console.log('正在读取个人离线数据文件...');

		var path = __dirname + '\\离线数据';
		var fileName = path + '\\离线数据_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';

		try {
			var json = fs.readFileSync(fileName, 'utf8');

			if (typeof json != 'string' || !json.length)
				throw new Error('个人离线数据文件格式错误或文件不存在');

			var obj = JSON.parse(json);

			return obj;
		}
		catch (e) {
			if (e.code != 'ENOENT') {
				console.log('读取个人离线数据时发生错误：');
				console.log(e);
			} else {
				console.log('读取个人离线数据文件不存在');
			}

		}

		return null;
	}

	/**
	 * UNAecho:异步读取'./离线数据'文件夹下的所有文件，制作成Object放入数组返回。
	 * 多数用于搜索仓库库存。
	 * @param {*} cb 
	 */
	cga.loadPlayerOfflineDataAll = (cb) => {
		let dir = __dirname + '\\离线数据\\';
		// 获取文件列表
		let list = fs.readdirSync(dir);
		// 获取文件数
		let fileCnt = list.length
		// 结果集
		let jsonArr = []

		try {
			list.forEach(function (file) {
				// 异步读取，节约时间
				fs.readFile(dir + file, 'utf-8', function (err, data) {
					fileCnt -= 1
					if (err) {
						throw new Error(err)
					}

					if (typeof data != 'string' || !data.length)
						throw new Error('个人离线数据文件格式错误或文件不存在');

					// 读取出的文件内容放入结果集中
					jsonArr.push(JSON.parse(data))
					// 如果全部读取，
					if (fileCnt == 0) {
						// 给回调函数传入结果集，此API结束。
						cb(jsonArr)
						return
					}
				})
			})
		}
		catch (e) {
			if (e.code != 'ENOENT') {
				console.log('读取个人离线数据时发生错误：');
				console.log(e);
			} else {
				console.log('读取个人离线数据文件不存在');
			}

		}
	}

	/**
	 * UNAecho:同步读取'./离线数据'文件夹下的所有文件，制作成Object放入数组返回。
	 * 多数用于搜索仓库库存。
	 * @param {*} cb 
	 */
	cga.loadPlayerOfflineDataAllSync = () => {
		let dir = __dirname + '\\离线数据\\';
		// 获取文件列表
		let list = fs.readdirSync(dir);
		// 结果集
		let jsonArr = []

		try {
			list.forEach(function (file) {
				// 异步读取，节约时间
				let json = fs.readFileSync(dir + file, 'utf-8')
				if (typeof json != 'string' || !json.length)
					throw new Error('个人离线数据文件格式错误或文件不存在');

				jsonArr.push(JSON.parse(json))
			})
			return jsonArr
		}
		catch (e) {
			if (e.code != 'ENOENT') {
				console.log('读取个人离线数据时发生错误：');
				console.log(e);
			} else {
				console.log('读取个人离线数据文件不存在');
			}

		}
		return null
	}

	/**
	 * UNAecho:一个简单的文件处理对象
	 */
	cga.fileObj = {}

	/**
	 * UNAecho:获取文件固定文件夹路径
	 */
	cga.fileObj.getFileDir = () => {
		return cga.getrootdir() + '\\常用数据\\'
	}

	/**
	 * UNAecho:同步读取文件
	 * @param {*} fileName
	 */
	cga.fileObj.load = (fileName) => {
		let result = null
		try {
			result = JSON.parse(fs.readFileSync(cga.fileObj.getFileDir() + fileName))
		} catch (error) {
			console.log('文件【' + fileName + '】不存在，返回初始化对象{}')
			result = {}
		}
		return result
	}

	/**
	 * UNAecho:同步写入文件
	 * @param {*} fileName 
	 */
	cga.fileObj.save = (fileName, content) => {
		let dir = cga.fileObj.getFileDir()
		if (fs.existsSync(dir) == false) {
			fs.mkdirSync(dir)
		}
		let path = cga.fileObj.getFileDir() + fileName
		fs.writeFileSync(path, JSON.stringify(content));
		console.log('文件【' + path + '】写入完毕..')
		return
	}

	/**
	 * UNAecho:统计离线数据资产的API，方便监测资产情况。
	 * 统计包括：
	 * 1、离线数据中的资产总和
	 * 2、整个离线记录中，空余道具格、魔币、宠物格的剩余空间。方便查看还可以存多少。
	 * @returns {Object}
	 */
	cga.getSumOfflineData = () => {
		let offlineData = cga.loadPlayerOfflineDataAllSync()
		let categoryType = ['inventory', 'bank']
		let type = ['item', 'gold', 'pet']

		// 为了打印顺序方便观看，这里单独定义一个dict，并在return前添加进result中
		let emptySlotCount = {
			'emptyItemSlot': 0,
			'emptyGoldSlot': 0,
			'emptyPetSlot': 0,
		}

		let result = {}

		offlineData.forEach((jsonObj) => {
			categoryType.forEach((category) => {
				type.forEach((t) => {
					if (!result.hasOwnProperty(t)) {
						if (t == 'gold') {
							result[t] = 0
						} else {
							result[t] = {}
						}
					}
					if (t == 'item') {
						jsonObj[category][t].forEach((item) => {
							if (!result[t].hasOwnProperty(item.name)) {
								result[t][item.name] = 0
							}
							result[t][item.name] += item.count
						})
						// 累加道具空余格子数量
						emptySlotCount.emptyItemSlot += (20 - jsonObj[category][t].length)
					} else if (t == 'gold') {
						result[t] += jsonObj[category][t]
						// 累加金币空余数量
						emptySlotCount.emptyGoldSlot += (1000000 - jsonObj[category][t])
					} else if (t == 'pet') {
						jsonObj[category][t].forEach((pet) => {
							if (!result[t].hasOwnProperty(pet.name)) {
								result[t][pet.name] = 0
							}
							result[t][pet.name] += 1
						})
						// 累加宠物空余格子数量
						emptySlotCount.emptyPetSlot += (5 - jsonObj[category][t].length)
					}
				})
			})
		})
		// 最后添加道具、金币、宠物空余格子统计，方便观看
		result.emptySlotCount = emptySlotCount
		return result
	}

	/**
	 * UNAecho :写了一个持久化人物任务完成情况的方法，用于离线记录人物的一些数据，便于查询。
	 * 请注意，关于任务的称号，我自己也没有做过全部的任务，所以请自行添加需要的任务名称，我只写了一个开启者
	 * 【注意】采集系在3转后自动可以传送至小岛，相当于战斗系做完了半山6/地狱的回响。
	 * 但是如果采集系参与了半山1-5的话，则必须按照战斗系的流程走完。所以建议采集系不要做半山任务。逻辑没空写。
	 * 
	 * @param {object} missionObj 需要更新的任务对象，
	 * key 为 任务string名称，请注意输入的任务名称要全项目统一，不然会出现检测出错的情况。如【树精长老】和【树精】【一转】等会被认为是不同的任务。
	 * value 为任务状态，类型任意。true为已完成，false为未完成。int为任务完成的步骤标记，或者string自定义，你自己认识就好。
	 * example : missionObj = {"树精长老" : true ,"挑战神兽" : true ,"神之召唤" : 2 ,"洛伊夫的净化" : "收集徽记" ,}
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
		const battleMission = ['树精长老', '挑战神兽', '诅咒的迷宫', '誓言之花', '洛伊夫的净化',]
		const productMission = ['咖哩任务', '起司的任务', '魔法大学', '誓言之花',]

		var config = cga.loadPlayerConfig();
		if (!config)
			config = {};
		if (!config.hasOwnProperty("mission")) {
			config["mission"] = {}
		}
		if (!category) {
			throw new Error('category数值有误，请手动检查ProfessionalInfo.js中【' + professionalInfo.name + '】的category')
		}
		// 护士和医生属于生产系，但晋级需要做战斗系的任务
		if (['护士', '医师',].indexOf(professionalInfo.name) != -1) {
			category = '战斗系'
		} else if (['物理系', '魔法系', '魔物系',].indexOf(category) != -1) {
			category = '战斗系'
		} else if (['猎人', '樵夫', '矿工'].indexOf(professionalInfo.name) != -1) {
			category = '采集系'
		} else {
			category = '生产系'
		}
		// 开始执行逻辑，首先刷新一下职业晋级任务的状态。
		if (category == '战斗系') {
			for (var i = 0; i < battleMission.length; i++) {
				if (i < jobLevel) {
					config["mission"][battleMission[i]] = true
					continue
				}
				// 除了五转以外，重置更高级别的晋级任务状态。
				// 五转任务一生只需要做一次，不会被重置。
				if (i < 4) {
					config["mission"][battleMission[i]] = false
				}
			}
		} else {
			for (var i = 0; i < productMission.length; i++) {
				if (i < jobLevel) {
					config["mission"][productMission[i]] = true
					continue
				}
				config["mission"][productMission[i]] = false
			}
		}

		// // 采集系3转以后可以直接传送小岛。注意：此小岛index和半山5的小岛index不是一个地图，怪物仅60级。
		// if(category == '采集系' && jobLevel > 2){
		// 	config["mission"]["传送小岛"] = false
		// }

		// 检查称号
		for (var i = 0; i < playerInfo.titles.length; i++) {
			if (playerInfo.titles[i] == '开启者') {
				config["mission"]['开启者'] = true
			}
		}
		// 刷新完称号，开始写入调用方传来的任务进度。如果没有传入，则跳过。
		if (missionObj) {
			for (var key in missionObj) {
				if (config["mission"][key] != missionObj[key]) {
					console.log('任务【' + key + '】由原状态【' + (config["mission"][key]) + '】改为【' + missionObj[key] + '】')
					config["mission"][key] = missionObj[key]
				}
			}
		}

		console.log('cga.refreshMissonStatus开始写入个人配置..')
		// 写入状态并调用callback，函数结束。
		cga.savePlayerConfig(config, cb);
		return
	}

	/**
	 * UNAecho: 与刷新称号的NPC对话，获得与目前声望相符的称号。
	 * TODO：适配其它国家的NPC
	 * @param {*} cb 
	 */
	cga.refreshReputation = (cb) => {
		cga.travel.falan.toStone('E2', () => {
			cga.walkList([
				[230, 82],
			], () => {
				cga.turnDir(2);
				setTimeout(cb, 2000);
			});
		});
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

		if (!config)
			config = {};

		if (config.maxbankslots) {
			console.log('最大银行格为：' + config.maxbankslots);
			cb(null, config.maxbankslots);
			return;
		}
		else {
			//看看60~79，40~59，20~39是否有物品
			var bank6079 = banks.filter((val) => { return val.pos >= 160 });

			if (bank6079.length > 0) {
				cb(null, 80);
				return;
			}
			else {
				var testitempos = cga.findItem(filter);
				if (testitempos != -1) {
					cga.MoveItem(testitempos, 160, -1);

					cga.waitSysMsgTimeout((err, msg) => {
						if (err) {
							//银行第60格物品保存成功
							if (cga.GetBankItemsInfo().find((item) => {
								return item.pos == 160;
							}) != undefined) {
								//第60格物品取回包里
								cga.MoveItem(160, testitempos, -1);

								config.maxbankslots = 80;
								cga.savePlayerConfig(config);
								console.log('最大银行格为：' + config.maxbankslots);
								setTimeout(cb, 1000, config.maxbankslots);

								return false;
							}
							//未知问题

							console.log('获取最大银行格时发生未知问题，可能网络不稳定或没有与柜员对话！');
							console.log('最大银行格默认为：' + 20);
							setTimeout(cb, 1000, 20);
							return false;
						}

						if (msg.indexOf('您现在只能使用银行物品栏位中的第') >= 0) {
							var regex = msg.match(/您现在只能使用银行物品栏位中的第 (\d+)到(\d+)个！/);
							if (regex && regex.length >= 3) {

								config.maxbankslots = parseInt(regex[2]);
								cga.savePlayerConfig(config);
								console.log('最大银行格为：' + config.maxbankslots);
								setTimeout(cb, 1000, config.maxbankslots);

								return false;
							}
						}

						return true;
					}, 1000);
				}
				else {
					console.log('获取最大银行格失败，可能包中没有符合条件的物品！');
					console.log('最大银行格默认为：' + 20);
					setTimeout(cb, 1000, 20);
					return false;
				}
			}
		}
	};

	/**
	 * UNAecho:寻找银行中的空闲格子, 参数：物品filter、最大堆叠数量、最大银行格
	 * 
	 * 原API有一个bug：
	 * 当传入参数maxcount>0（例如血瓶、料理），而银行中的道具出现count=0的情况（如装备）时
	 * 此时遍历银行，如果arr[i].count < maxcount，则视为此格子可以往里叠加目标道具。
	 * 而arr[i]是装备，arr[i].count = 0，必然小于3
	 * 但往装备上叠加道具显然是有错误的，所以这里添加continue逻辑:arr[i].count==0时，continue
	 * 也就是当银行中的装备只有count>0时，才考虑在上面叠加，否则视为不可往上面叠加目标道具
	 * 
	 * @param {*} filter 
	 * @param {Number|Function} maxcount 
	 * @param {*} maxslots 
	 * @returns 
	 */
	cga.findBankEmptySlot = (filter, maxcount, maxslots = 20) => {

		if (typeof maxcount != 'number' && typeof maxcount != 'function') {
			throw new Error('maxcount类型必须为Number或Function类型')
		}

		var banks = cga.GetBankItemsInfo();

		var arr = [];

		for (var i = 0; i < banks.length; ++i) {
			arr[banks[i].pos - 100] = banks[i];
		}

		for (var i = 0; i < maxslots; ++i) {
			if (typeof arr[i] != 'undefined') {
				// UNAecho:count=0的装备无法继续堆叠，跳过此格
				if (arr[i].count == 0) {
					continue
				}
				if (typeof filter == 'string' && (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount) > 0) {
					if (arr[i].name == filter && arr[i].count < (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount))
						return 100 + i;
				}
				else if (typeof filter == 'number' && (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount) > 0) {
					if (arr[i].itemid == filter && arr[i].count < (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount))
						return 100 + i;
				}
				else if (typeof filter == 'function' && (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount) > 0) {
					if (filter(arr[i]) && arr[i].count < (typeof maxcount == 'function' ? maxcount(arr[i]) : maxcount))
						return 100 + i;
				}
			} else {
				return 100 + i;
			}
		}

		return -1;
	}

	//寻找银行中的空闲宠物格子
	cga.findBankPetEmptySlot = (maxslots = 5) => {

		var pets = cga.GetBankPetsInfo()

		var arr = [];

		for (var i = 0; i < pets.length; i++) {
			arr[pets[i].index - 100] = pets[i];
		}

		for (var i = 0; i < maxslots; i++) {
			if (typeof arr[i] == 'undefined') {
				return 100 + i;
			}
		}

		return -1;
	}

	//寻找背包中的空闲格子
	cga.findInventoryEmptySlot = (itemname, maxcount) => {

		var items = cga.GetItemsInfo();

		var arr = [];

		for (var i = 0; i < items.length; ++i) {
			arr[items[i].pos - 8] = items[i];
		}

		for (var i = 0; i < 20; ++i) {
			if (typeof arr[i] != 'undefined') {
				if (typeof itemname == 'string' && maxcount > 0) {
					if (arr[i].name == itemname && arr[i].count < maxcount)
						return 8 + i;
				}
			} else {
				return 8 + i;
			}
		}

		return -1;
	}

	//获取背包中的空闲格子数量
	cga.getInventoryEmptySlotCount = () => {

		var items = cga.GetItemsInfo();

		var arr = [];

		for (var i = 0; i < items.length; ++i) {
			arr[items[i].pos - 8] = items[i];
		}
		var count = 0;

		for (var i = 0; i < 20; ++i) {
			if (!arr[i])
				count++;
		}

		return count;
	}

	//寻找背包中的宠物空闲格子
	cga.findInventoryPetEmptySlot = () => {
		let pets = cga.GetPetsInfo()

		for (let i = 0; i < 5; ++i) {
			if (pets[i] == undefined) {
				return i;
			}
		}

		return -1;
	}

	//获取背包中的宠物空闲格子数量
	cga.getInventoryPetEmptySlotCount = () => {
		return 5 - cga.GetPetsInfo().length
	}

	//将符合条件的物品存至银行，maxcount为最大堆叠数量
	cga.saveToBankOnce = (filter, maxcount, cb) => {
		var itempos = cga.findItem(filter);
		if (itempos == -1) {
			cb(new Error('包里没有该物品, 无法存放到银行'));
			return;
		}

		cga.getBankMaxSlots(filter, (err, maxslots) => {
			if (err) {
				cb(err);
				return;
			}

			var emptyslot = cga.findBankEmptySlot(filter, maxcount, maxslots);
			if (emptyslot == -1) {
				cb(new Error('银行没有空位, 无法存放到银行'));
				return;
			}

			cga.MoveItem(itempos, emptyslot, -1);

			setTimeout(() => {
				var bankitem = cga.GetBankItemsInfo().find((item) => {
					return item.pos == emptyslot;
				});
				if (bankitem != undefined) {
					//保存成功
					console.log(bankitem.name + ' 成功将物品存到银行第 ' + (bankitem.pos - 100 + 1) + ' 格!');
					cb(null);
				}
				else {
					cb(new Error('保存到银行失败，可能银行格子已满、未与柜员对话或网络问题。注意：批量存入时，在银行未满的时候也可能报此错误，有空需要优化逻辑'));
				}
			}, 1000);
		});
	}

	/**
	 * UNAecho:将符合条件的物品从银行取出，maxcount为最大堆叠数量
	 * filter仅支持String。
	 * 【注意】由于银行中的itemid均显示为0，我提了issue:https://github.com/hzqst/CGAssistant/issues/17。
	 * 根据作者所述，游戏的服务端不会发送itemid给游戏客户端。
	 * 所以我们无法以itemid来索引银行中的物品，只能使用String类型的itemname来索引。
	 * @param {*} filter 过滤规则
	 * @param {*} maxcount 物品最大堆叠数
	 * @param {*} cb 
	 * @returns 
	 */
	cga.drawFromBankOnce = (filter, maxcount, cb) => {
		var targetItem = cga.GetBankItemsInfo().find((it) => {
			if (typeof filter == 'string' && it.name == filter) {
				return true
			} else if (typeof filter == 'function' && filter(it)) {
				return true
			}
			return false
		});

		if (!targetItem) {
			cb(new Error('银行里没有该物品, 无法取出。'));
			return;
		}

		var emptyslot = cga.findInventoryEmptySlot(filter, maxcount);
		if (emptyslot == -1) {
			cb(new Error('背包没有空位, 无法从银行取出'));
			return;
		}

		cga.MoveItem(targetItem.pos, emptyslot, -1);

		setTimeout(() => {
			var item = cga.GetItemsInfo().find((item) => {
				return item.pos == emptyslot;
			});
			if (item != undefined) {
				//取出成功
				console.log(item.name + ' 成功从银行中取出到背包第 ' + (item.pos - 8 + 1) + ' 格!');
				cb(null);
			}
			else {
				cb(new Error('从银行取物品失败，可能背包格子已满、未与柜员对话或网络问题'));
			}
		}, 1000);
	}

	//将符合条件的宠物存至银行
	cga.savePetToBankOnce = (filter, customerName, cb) => {
		var petindex = cga.findPet(filter, customerName);

		if (petindex == -1) {
			cb(new Error('包里没有该宠物, 无法存放到银行'));
			return;
		}

		var emptyslot = cga.findBankPetEmptySlot();
		if (emptyslot == -1) {
			cb(new Error('银行没有空位, 无法存放到银行'));
			return;
		}

		cga.MovePet(petindex, emptyslot);

		setTimeout(() => {
			var bankpet = cga.GetBankPetsInfo().find((pet) => {
				return pet.index == emptyslot;
			});
			if (bankpet != undefined) {
				//保存成功
				console.log(bankpet.name + ' 成功将宠物存到银行第 ' + (bankpet.index - 100 + 1) + ' 格!');
				cb(null);
			}
			else {
				cb(new Error('保存到银行失败，可能银行格子已满、未与柜员对话或网络问题'));
			}
		}, 1000);
	}

	//将符合条件的宠物从银行取出
	cga.drawPetFromBankOnce = (filter, customerName = false, cb) => {
		let targetPet = cga.GetBankPetsInfo().find((pet) => {
			if (typeof filter == 'string' && ((!customerName && pet.realname == filter) || (customerName && pet.name == filter))) {
				return true
			} else if (typeof filter == 'function' && filter(it)) {
				return true
			}
			return false
		});

		if (!targetPet) {
			cb(new Error('银行里没有该宠物, 无法取出。'));
			return;
		}

		let emptyslot = cga.findInventoryPetEmptySlot();
		if (emptyslot == -1) {
			cb(new Error('背包没有空位, 无法从银行取出'));
			return;
		}

		cga.MovePet(targetPet.index, emptyslot);

		setTimeout(() => {
			let pet = cga.GetPetsInfo().find((p) => {
				return p.index == emptyslot;
			});
			if (pet != undefined) {
				//取出成功
				console.log('成功从银行中取出宠物' + (pet.name ? pet.name : pet.realname) + '到背包第 ' + (pet.index + 1) + ' 格!');
				cb(null);
			}
			else {
				cb(new Error('从银行取出宠物失败，可能背包格子已满、未与柜员对话或网络问题'));
			}
		}, 1000);
	}

	//循环将符合条件的物品存至银行，maxcount为最大堆叠数量
	cga.saveToBankAll = (filter, maxcount, cb) => {
		console.log('开始批量保存物品到银行...');
		var repeat = () => {
			cga.saveToBankOnce(filter, maxcount, (err) => {
				if (err) {
					console.log(err);
					cb(err);
					return;
				}
				if (cga.findItem(filter) == -1) {
					console.log('包里已经没有指定物品，批量保存到银行执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}

		repeat();
	}

	/**
	 * UNAecho:循环将符合条件的物品从银行取出，maxcount为最大堆叠数量
	 * filter仅支持String。
	 * 【注意】由于银行中的itemid均显示为0，我提了issue:https://github.com/hzqst/CGAssistant/issues/17。
	 * 根据作者所述，游戏的服务端不会发送itemid给游戏客户端。
	 * 所以我们无法以itemid来索引银行中的物品，只能使用String类型的itemname来索引。
	 * @param {*} filter 过滤规则
	 * @param {*} maxcount 物品最大堆叠数
	 * @param {*} cb 
	 * @returns 
	 */
	cga.drawFromBankAll = (filter, maxcount, cb) => {
		console.log('开始批量从银行取出物品...');
		let repeat = () => {
			cga.drawFromBankOnce(filter, maxcount, (err) => {
				if (err) {
					console.log(err);
					cb(err);
					return;
				}
				let targetItem = cga.GetBankItemsInfo().find((it) => {
					if (typeof filter == 'string' && it.name == filter) {
						return true
					} else if (typeof filter == 'function' && filter(it)) {
						return true
					}
					return false
				});
				if (targetItem == undefined) {
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
	cga.savePetToBankAll = (filter, customerName = false, cb) => {
		console.log('开始批量保存宠物到银行...');
		let repeat = () => {
			cga.savePetToBankOnce(filter, customerName, (err) => {
				if (err) {
					console.log(err);
					cb(err);
					return;
				}
				if (cga.findPet(filter, customerName) == -1) {
					console.log('包里已经没有指定宠物，批量保存到银行执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}

		repeat();
	}

	//循环将符合条件的宠物从银行取出。
	cga.drawPetToBankAll = (filter, customerName = false, cb) => {
		console.log('开始批量从银行取出宠物...');
		let repeat = () => {
			cga.drawPetFromBankOnce(filter, customerName, (err) => {
				if (err) {
					console.log(err);
					cb(err);
					return;
				}
				let targetPet = cga.GetBankPetsInfo().find((pet) => {
					if (typeof filter == 'string' && ((!customerName && pet.realname == filter) || (customerName && pet.name == filter))) {
						return true
					} else if (typeof filter == 'function' && filter(pet)) {
						return true
					}
					return false
				});
				if (targetPet == undefined) {
					console.log('银行里已经没有指定宠物，批量从银行取出宠物执行完毕！');
					cb(null);
					return;
				}
				setTimeout(repeat, 1000);
			});
		}

		repeat();
	}

	//原地高速移动，dir为方向
	cga.freqMove = function (dir) {
		var freqMoveDirTable = [4, 5, 6, 7, 0, 1, 2, 3];
		var freqMoveDir = dir;
		var pos = cga.GetMapXY();
		var index3 = cga.GetMapIndex().index3;
		var counter = 0;
		var move = () => {
			var result = true;
			try {
				var tmpIndex3 = cga.GetMapIndex().index3;
				if (tmpIndex3 == index3) {
					var curpos = cga.GetMapXY();
					if (freqMoveDir == 0) {
						if (pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 4) {
						if (pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 2) {
						if (pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 6) {
						if (pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 1) {
						if (pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 5) {
						if (pos.x == curpos.x)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 3) {
						if (pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}
					else if (freqMoveDir == 7) {
						if (pos.y == curpos.y)
							cga.ForceMove(freqMoveDir, false);
						else
							cga.ForceMove(freqMoveDirTable[freqMoveDir], false);
					}

					counter++;
					if (counter % 4 == 0) {
						if (!cga.moveThink('freqMove')) {
							console.log('freqMove被中断');
							cga.isMoveThinking = false;
							return;
						}
					}
				}
				else {
					if (!cga.moveThink('freqMoveMapChanged')) {
						console.log('freqMoveMapChanged被中断');
						cga.isMoveThinking = false;
						return;
					}
					console.log('地图不同，freqMove暂停运行');
				}
			}
			catch (e) {
				console.log(e);
			}

			setTimeout(move, 300);
		}

		move();
	}

	//从NPC对话框内容解析商店购物列表
	cga.parseBuyStoreMsg = (dlg) => {

		if (!dlg) {
			throw new Error('解析商店购物列表失败，可能对话超时!');
			return null;
		}

		if (!dlg.message) {
			throw new Error('解析商店购物列表失败，可能对话超时!');
			return null;
		}

		//28?
		if (dlg.type != 6) {
			throw new Error('解析商店购物列表失败，可能对话不是购物商店!');
			return null;
		}

		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);

		if (match.length < 5) {
			throw new Error('解析商店购物列表失败，格式错误!');
			return null;
		}

		if ((match.length - 5) % 6 != 0) {
			throw new Error('解析商店购物列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - 5) / 6;

		var obj = {
			storeid: match[0],
			name: match[1],
			welcome: match[2],
			insuff_funds: match[3],
			insuff_inventory: match[4],
			items: []
		}
		for (var i = 0; i < storeItemCount; ++i) {
			obj.items.push({
				index: i,
				name: match[5 + 6 * i + 0],
				image_id: parseInt(match[5 + 6 * i + 1]),
				cost: parseInt(match[5 + 6 * i + 2]),
				attr: match[5 + 6 * i + 3],
				batch: parseInt(match[5 + 6 * i + 4]),//最少买多少
				max_buy: parseInt(match[5 + 6 * i + 5]),//最多买多少
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
	cga.parseExchangeStoreMsg = (dlg) => {

		if (!dlg) {
			throw new Error('解析兑换列表失败，可能对话超时!');
			return null;
		}

		if (!dlg.message) {
			throw new Error('解析兑换列表失败，可能对话超时!');
			return null;
		}

		if (dlg.type != 28) {
			throw new Error('解析兑换列表失败，可能对话不是兑换商店!');
			return null;
		}

		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);
		var storeInfoLen = 7
		var goodsInfoLen = 5
		if (match.length < storeInfoLen) {
			throw new Error('解析兑换列表失败，格式错误!');
			return null;
		}

		if ((match.length - storeInfoLen) % goodsInfoLen != 0) {
			throw new Error('解析兑换列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - storeInfoLen) / goodsInfoLen;

		var obj = {
			storeid: match[0],
			name: match[1],
			welcome: match[2],
			insuff_funds: match[3],
			insuff_inventory: match[4],
			// UNA注释：和type=6不同，type=28的时候，有兑换材料信息。其实可以理解为6的原材料是魔币，而28的原材料是物品。
			required_image_id: match[5],
			required: match[6],
			items: []
		}
		for (var i = 0; i < storeItemCount; ++i) {
			obj.items.push({
				index: i,
				// UNA注释：由于物品拼字后面会带一个(堆叠数)，故用正则去掉
				name: (match[storeInfoLen + goodsInfoLen * i + 0]).match(new RegExp(/([^\d\(\)]+)/g))[0],
				// UNA注释：保留原名称，方便后续debug
				raw_name: match[storeInfoLen + goodsInfoLen * i + 0],
				image_id: parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
				count: parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),//count个required才能换取一个
				batch: parseInt(match[storeInfoLen + goodsInfoLen * i + 3]),//UNA注释：该商品每组的堆叠数量
				attr: match[storeInfoLen + goodsInfoLen * i + 4],
			});
		}
		return obj;
	}

	/**
	 * UNAecho:解析各种类型的商店，包括：
	 * 1、购买商店（如法兰城里堡门口桥的2个武器/防具售卖NPC）
	 * 2、售卖商店（如各种卖石NPC，1的桥头NPC也有售卖商店，他们是同一种）
	 * 3、兑换商店（如曙光营地，蕃茄兑换小麦粉、葱等）
	 * 4、鉴定商店（如凯蒂夫人的店）
	 * 
	 * 开发笔记：
	 * 不论什么商店，dlg.message都是主体，需要用正则表达式RegExp(/([^|\n]+)/g)去解析
	 * 此API使用正则匹配后的长度来判断商店类型。也可以使用dlg的type + dialog_id来判断。
	 * 各种商店数据:
	 * 1、购买商店:
	 * type=6,options=0,dialog_id=335
	 * dlg.message正则解析后，前5行是商店信息，之后每6行信息是商品信息。
	 * 2、售卖商店:
	 * type=7,options=0,dialog_id=334
	 * dlg.message正则解析后，前3行是商店信息，之后每9行信息是商品信息。
	 * 3、兑换商店:
	 * type=28,options=0,dialog_id=345
	 * dlg.message正则解析后，前7行是商店信息，之后每5行信息是商品信息。
	 * 4、鉴定商店：
	 * dlg.type=28,dialog_id=345
	 * dlg.message正则解析后，前2行是商店信息，之后每5行信息是商品信息。
	 * 
	 * 
	 * 【sell模式开发提醒】
	 * 当你持有未鉴定物品、抽奖闪卡（如火焰鼠闪卡）时，sell模式需要特殊处理商店信息。
	 * 由于使用dlg.type、dialog_id和商店msg正则匹配后的长度取余来判断商店类型，所以物品信息的数量至关重要。
	 * 普通物品一共9个信息，包括名称、count、pos等。这些信息会在dlg.message正则匹配后的数组中有序存放。
	 * 而特殊物品不同：
	 * 1、未鉴定物品由于没有物品描述，所以只有9-1=8个物品信息。
	 * 2、抽奖闪卡由于多了一行彩票结果，例如BBDDCA，所以导致有9+1=10个物品信息
	 * 当你持有这些特殊物品时，他会打乱取余的结果，造成商店信息识别失败。
	 * 目前实现的解决方式：
	 * 1、未鉴定物品的名称一定带全角？号。（可能某些物品描述也带问号，但后续售卖单价、堆叠数一般会避免把物品描述当作物品名称）
	 * 2、未鉴定物品的售卖单价一定是1魔币。
	 * 3、未鉴定物品的堆叠数count一定是1。
	 * 4、在整个正则RegExp(/([^|\n]+)/g)匹配的结果array中，使用index偏移来判断这些数值，如name的index+1便是count。其他属性自行在API代码中查找。
	 * 5、举例，未鉴定物品的name的index+1是count，name的index+3是售卖单价等等。
	 * 6、在通过上面某种逻辑确定后，可以得到你想插入/删除/修改的index。比如未鉴定物品的name index+6便是需要添加物品描述的index。
	 * 7、将原数组数据顺序插入新建空数组中，当遇到你想插入/删除/修改的index时，执行你希望的逻辑。建议：彩票卡删除抽奖结果，因为物品描述中已包含。
	 * 8、这样就达到了修改商店msg的目的，为后续解析商店类型提供辅助。
	 * 
	 * 【提示】
	 * 当你不清楚一个道具的最大堆叠数是多少时，可以使用此API辅助查询，方法如下：
	 * 1、找到一个可以购买此道具（如果有的话）的NPC(dlg的type=6,options=0,dialog_id=335)，与其对话，打开商店界面。
	 * 2、商店界面其实是一个对话dlg，将其传给此API
	 * 3、cga.parseStoreMsg()返回的obj中，obj.items会包含背包中的各个道具属性，其中maxcount就是官方堆叠数。
	 * */
	cga.parseStoreMsg = (dlg) => {

		if (!dlg) {
			throw new Error('解析商店失败，可能对话超时!');
		}

		if (!dlg.message) {
			throw new Error('解析商店内容失败，可能对话超时!');
		}

		// 解析商店dlg中的message内容
		let reg = new RegExp(/([^|\n]+)/g)
		let match = dlg.message.match(reg);
		let matchLength = match.length

		// 鉴定商店的信息长度最少，为2。当你空背包时，商店长度只有2。
		if (!matchLength || matchLength < 2) {
			throw new Error('解析商店内容失败，可能并未与商店NPC交谈');
		}

		// 最终返回结果
		let resultObj = {
			// 商店id
			storeid: match[0],
			// 商店NPC名称
			name: match[1],
			// 商品件数
			len: 0,
		}

		// 开发用变量
		// 商店信息的长度
		let storeInfoLen = -1
		// 物品信息的长度
		let goodsInfoLen = -1

		/**
		 * 识别未鉴定物品的函数。
		 * 特点：
		 * 1、未鉴定物品的名称一定带全角？号。（可能某些物品描述也带问号，但后续售卖单价、堆叠数一般会避免把物品描述当作物品名称）
		 * 2、未鉴定物品的price_group一定是1魔币。不可卖的物品，price_group也是1。
		 * 3、未鉴定物品的堆叠数count一定是1。
		 * 
		 * 【提醒】未鉴定物品可以用cga.GetItemInfo(item.pos)返回的的Object.assessed == false判断。
		 * 方法是获得到name的index后，index+4就是pos，如果这个pos存在于item.assessed == false的数组中，则是未鉴定物品。
		 * 但使用当前方法似乎时间复杂度能少很多，先用着吧。如果判断不准确，再使用item.assessed == false判断。
		*/
		const unknownItemCheckFunc = (i, arr) => {
			let res = -1
			// 排除数组越界，当未鉴定物品在道具最后一格，不是name属性（倒数第8位index）直接跳过判别。
			if (i > arr.len - 8) {
				return res
			}

			if (arr[i].indexOf('？') != -1 && arr[i + 1] == '1' && arr[i + 3] == '1') {
				console.log("你身上有未鉴定物品:", arr[i], "对商店数据进行物品描述补齐操作，以免商店解析失败。")
				// 物品名称+6的偏移是物品描述。此函数目的就在于精确给出目标index位置。
				res = i + 6
			}
			return res
		}

		/**
		 * 识别抽奖闪卡的函数。
		 * 特点：
		 * 1、名称一般会带有【鼠闪卡】
		 * 2、堆叠数count一定为1
		 * 3、price_group单价和sell_group最少卖多少组一定为0（无法售卖）。
		 * 4、物品描述中，种类一定是【彩卷】
		*/
		const lottoCheckFunc = (i, arr) => {
			let res = -1
			// 排除数组越界，和未鉴定物品一样，遍历到背包最后一格时，name以后的index可以跳过。通过name的偏移来计算要return的index。
			if (i > arr.len - 8) {
				return res
			}

			if (arr[i].indexOf('卡') != -1 && arr[i + 1] == '1' && arr[i + 3] == '0' && arr[i + 7].indexOf('彩卷') != -1 && arr[i + 8] == '0') {
				console.log("你身上有抽奖闪卡:", arr[i], "对商店数据进行抽奖结果删除操作（物品描述中已经包含，可在其中查看抽奖结果），以免商店解析失败。")
				// 物品名称+6的偏移是抽奖结果。此函数目的就在于精确给出目标index位置。
				res = i + 6
			}
			return res
		}

		const updateMsgArray = (arr, type, checkFunc) => {
			// 处理后的match数组
			let result = []
			// 需要操作的index
			let updateIndex = []
			for (var i = 0; i < arr.length; ++i) {
				let res = checkFunc(i, arr)
				if (res != -1) {
					updateIndex.push(res)
				}
			}

			// 添加操作，遇到目标index则元素
			if (type == 'add') {
				for (let i = 0; i < arr.length; i++) {
					if (updateIndex.indexOf(i) != -1) {
						result.push('UNAecho:未鉴定物品，没有物品描述。')
					}
					result.push(arr[i])
				}
			} else if (type == 'delete') {// 删除操作，遇到目标index直接continue
				for (let i = 0; i < arr.length; i++) {
					if (updateIndex.indexOf(i) != -1) {
						continue
					}
					result.push(arr[i])
				}
			} else {
				throw new Error('错误的type，请检查。');
			}

			return result
		}

		// 必须要每次对商店操作都要调用一次，因为每次操作，商店msg数组的长度会发生变化，每个元素对应的index可能会不同。
		match = updateMsgArray(match, 'add', unknownItemCheckFunc)
		match = updateMsgArray(match, 'delete', lottoCheckFunc)

		// 刷新长度
		matchLength = match.length

		// 购买商店
		if (dlg.type == 6 && dlg.dialog_id == 335 && (matchLength - 5) % 6 == 0) {
			// 欢迎语
			resultObj.welcome = match[2]
			// 商店类型
			resultObj.type = 'buy'
			storeInfoLen = 5
			goodsInfoLen = 6
		} else if (dlg.type == 7 && dlg.dialog_id == 334 && (matchLength - 3) % 9 == 0) {// 售卖商店
			// 欢迎语
			resultObj.welcome = match[2]
			// 商店类型
			resultObj.type = 'sell'
			storeInfoLen = 3
			goodsInfoLen = 9
		} else if (dlg.type == 28 && dlg.dialog_id == 345 && (matchLength - 7) % 5 == 0) {// 兑换商店
			// 欢迎语
			resultObj.welcome = match[2]
			// 商店类型
			resultObj.type = 'exchange'
			storeInfoLen = 7
			goodsInfoLen = 5

			// 作为交换筹码的材料不足
			resultObj.Insufficient_funds = match[3]
			// 物品栏已满
			resultObj.Insufficient_inventory = match[4]
			// 交换筹码的贴图id
			resultObj.currency_image_id = match[5]
			// 作为交换筹码的物品，如20个蕃茄换16个小麦，此时蕃茄就是currency
			resultObj.currency = match[6]
		} else if (dlg.type == 20 && dlg.dialog_id == 337 && (matchLength - 2) % 5 == 0) {// 鉴定商店
			resultObj.type = 'appraisal'
			// 鉴定商店暂时无法获取欢迎语
			// resultObj.welcome = null
			storeInfoLen = 2
			goodsInfoLen = 5
		}

		if (!resultObj.type) {
			throw new Error('解析商店内容失败，未知商店类型，请联系作者https://github.com/UNAecho更新。');
		}

		// 商品个数
		resultObj.len = Math.ceil((matchLength - storeInfoLen) / goodsInfoLen)

		// 遍历每个商品，填充数据
		resultObj.items = []
		for (var i = 0; i < resultObj.len; ++i) {
			if (resultObj.type == 'sell') {
				resultObj.items.push({
					// 物品名称
					name: match[storeInfoLen + goodsInfoLen * i + 0],
					// 物品数量
					count: parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
					// 物品贴图id
					item_image_id: parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),
					// 物品一组的售卖单价，但不可售卖的未鉴定物品的值也是1，暂不知为何。
					price_group: parseInt(match[storeInfoLen + goodsInfoLen * i + 3]),
					// 物品在背包的pos(包括装备，物品第一格从pos = 8开始)
					pos: parseInt(match[storeInfoLen + goodsInfoLen * i + 4]),
					// TODO 未知属性，待研究
					unknown_key: match[storeInfoLen + goodsInfoLen * i + 5],
					// 商品详细信息，包括名称、等级、描述等。
					attr: match[storeInfoLen + goodsInfoLen * i + 6],
					// 该道具能卖多少组，如40个苹果薄荷，就能卖2组。sell_group=2
					sell_group: parseInt(match[storeInfoLen + goodsInfoLen * i + 7]),
					// 售卖数量的最小单位。如【铜】最少卖20个。但水晶碎片的此属性，显示是999，暂时不知为何。
					sell_unit_count: parseInt(match[storeInfoLen + goodsInfoLen * i + 8]),
				});

				// 监督unknown_key的值，如果不是0，提醒自己观察数据
				if (match[storeInfoLen + goodsInfoLen * i + 5] != '0') {
					console.log('【UNAecho脚本提醒】物品【', match[storeInfoLen + goodsInfoLen * i + 0], '】resultObj.unknown_key = ', match[storeInfoLen + goodsInfoLen * i + 5], '并不是0，请观察。')
				}
			} else if (resultObj.type == 'buy') {
				resultObj.items.push({
					// 商品的index
					index: i,
					// 商品名称
					name: match[storeInfoLen + goodsInfoLen * i + 0],
					// 物品贴图id
					item_image_id: parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
					// 价格
					price: parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),
					// 商品详细信息，包括名称、等级、描述等。
					attr: match[storeInfoLen + goodsInfoLen * i + 3],
					// 该道具最少买多少
					buy_unit_count: parseInt(match[storeInfoLen + goodsInfoLen * i + 4]),
					// 该道具的堆叠数
					maxcount: parseInt(match[storeInfoLen + goodsInfoLen * i + 5]),
				});
			} else if (resultObj.type == 'exchange') {
				resultObj.items.push({
					// 商品的index
					index: i,
					// 由于交换商店，物品名字后面会带一个(堆叠数)，故用正则去掉
					name: match[storeInfoLen + goodsInfoLen * i + 0].match(new RegExp(/([^\d\(\)]+)/g))[0],
					// 物品名字的原始数值，保留备用。业务上直接使用上面处理好的name即可
					raw_name: match[storeInfoLen + goodsInfoLen * i + 0],
					// 物品贴图id
					item_image_id: parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
					// 换算比，或者最小兑换数。exchange_unit_count与商品的数量比例是exchange_unit_count:1，exchange_unit_count是exchange_unit_count个resultObj.currency，而1是商店给出的+-数量，具体能获得多少目标物品并不确定。
					// 如曙光骑士团20个蕃茄换16个小麦，这里exchange_unit_count就是20，1就是1组小麦，而实际20个蕃茄兑换出的小麦的数量为16，每个商店有自己的规则。暂时无法获取这种规则。
					// 但曙光骑士团20个蕃茄同时还可以换成12个鸡蛋或者8个葱/青椒。所以20个exchange_unit_count能换到多少数量的商品，并不确定。
					exchange_unit_count: parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),
					// 该商品的堆叠数量，一个maxcount数的商品占1个背包格子
					maxcount: parseInt(match[storeInfoLen + goodsInfoLen * i + 3]),
					// 商品详细信息，包括名称、等级、描述等。
					attr: match[storeInfoLen + goodsInfoLen * i + 4],
				});
			} else if (resultObj.type == 'appraisal') {
				resultObj.items.push({
					// 鉴定商店不需要index，只会和背包内的物品交互
					// index: i,
					// 被鉴定的物品名称
					name: match[storeInfoLen + goodsInfoLen * i + 0],
					// 物品贴图id
					item_image_id: parseInt(match[storeInfoLen + goodsInfoLen * i + 1]),
					// 鉴定价格
					cost: parseInt(match[storeInfoLen + goodsInfoLen * i + 2]),
					// 待鉴定物品的pos。注意物品栏的pos是从8开始，0-7为装备。
					pos: parseInt(match[storeInfoLen + goodsInfoLen * i + 3]),
					// 商品堆叠数（未确定，猜测）
					'maxcount(未确定，猜测)': parseInt(match[storeInfoLen + goodsInfoLen * i + 4]),
				});
			}
		}
		return resultObj;
	}

	/**
	 * UNAecho:通用商店API
	 * 支持购买、出售、兑换等操作。
	 * 但不支持学技能动作，因为cga.askNpcForObj已经实现此逻辑。
	 * 
	 * {
  type: 5,
  options: 0,
  dialog_id: 333,
  npc_id: 12997,
  message: '14670|全都卖商人的弟子|欢迎光临，你有什么事吗？|2'
}{
  type: 5,
  options: 0,
  dialog_id: 333,
  npc_id: 12117,
  message: '14535|平民武器贩售处|\\n欢迎光临，\\n你有什么事吗？|3'
}{
  type: 27,
  options: 0,
  dialog_id: 344,
  npc_id: 13630,
  message: '231068|食疗专家小枫|教团骑士们喜欢从蕃茄中摄取他们需要的能量！我可以用小麦粉、鸡蛋、青椒或是葱和你换蕃茄。'
}
	 */
	cga.storeTrade = (obj) => {

		if (typeof obj.type != 'string' || !['buy', 'sell', 'exchange'].includes(obj.type)) {
			throw new Error('type必须为"buy","sell","exchange"的其中一种')
		}

		if (!obj.pos instanceof Array) {
			throw new Error('必须传入商店NPC坐标pos的一维数组')
		}

		if (obj.type == 'buy') {

		} else if (obj.type == 'sell') {

		} else if (obj.type == 'exchange') {

		}

		let numOpt = dlg.message.charAt(dlg.message.length - 1);
		cga.ClickNPCDialog(0, numOpt == '3' ? 1 : 0);
	}

	/**
	 * UNAecho:封装一个通用的购买API
	 * @param {*} item 物品名称
	 * @param {*} count 购买数量，注意是商品+-的数量，和要买物品的数量没有直接关系。
	 * @param {*} pos 商店NPC的坐标
	 * @param {*} cb 
	 */
	cga.buyItems = (itemName, count, pos, cb) => {
		var XY = cga.GetMapXY()
		var talkPos = cga.getRandomSpace(pos[0], pos[1])
		if (XY.x != talkPos[0] || XY.y != talkPos[1]) {
			cga.walkList([
				talkPos
			], () => {
				setTimeout(cga.buyItems, 1000, itemName, count, pos, cb);
			});
			return
		}
		cga.turnTo(pos[0], pos[1]);
		cga.AsyncWaitNPCDialog(() => {
			cga.ClickNPCDialog(0, 0);
			cga.AsyncWaitNPCDialog((err, dlg) => {
				var store = cga.parseBuyStoreMsg(dlg);
				if (!store) {
					cb(new Error('商店内容解析失败'));
					return;
				}

				var buyitem = [];
				var emptySlotCount = cga.getInventoryEmptySlotCount();
				if (emptySlotCount == 0) {
					cb(new Error('背包没有空位'));
					return
				}

				store.items.forEach((it) => {
					if (it.name == itemName && emptySlotCount > 0) {
						buyitem.push({ index: it.index, count: count });
					}
				});

				cga.BuyNPCStore(buyitem);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					if (dlg && dlg.message.indexOf('不够')) {
						cb(new Error('你的钱不够'));
						return
					}
					setTimeout(cb, 2000, true);
					return;
				});
			});
		});
	}

	/**
	 * UNAecho:和NPC交换物品API
	 * goods:目标物品名称
	 * count:交易数量，注意并不是物品堆叠数，而是游戏商店中"+"和"-"号点出的交换数量。如果不输入，则默认将材料全部兑换。
	 *  */
	cga.exchangeItemFromStore = (cb, goods, count) => {
		setTimeout(() => {
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(0, 0);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					var store = cga.parseExchangeStoreMsg(dlg);
					if (!store) {
						cb(new Error('兑换商品时，商店内容解析失败'));
						return;
					}
					if (!store.required || store.required.length == 0) {
						cb(new Error('兑换商品时，商店需求材料解析失败'));
						return;
					}

					var buyitem = [];
					// 后续用-1判断是全兑换，还是指定数量
					var buyCount = ((count === undefined || count === null) ? -1 : count)
					store.items.forEach((it) => {
						if (it.name == goods) {
							buyitem.push({ index: it.index, count: (buyCount == -1 ? parseInt(cga.getItemCount(store.required) / it.count) : buyCount) });
						}
					});

					cga.BuyNPCStore(buyitem);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (cb) cb(null)
						return;
					});
				});
			});
		}, 1500);
	}
	//从NPC对话框内容解析宠物技能学习列表
	cga.parsePetSkillStoreMsg = (dlg) => {

		if (!dlg) {
			throw new Error('解析宠物学习技能列表失败，可能对话超时!');
			return null;
		}

		if (!dlg.message) {
			throw new Error('解析宠物学习技能列表失败，可能对话超时!');
			return null;
		}

		if (dlg.type != 24) {
			throw new Error('解析宠物学习技能列表失败，可能对话不是宠物技能商店!');
			return null;
		}

		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);

		if (match.length < 5) {
			throw new Error('解析宠物学习技能列表失败，格式错误!');
			return null;
		}

		if ((match.length - 5) % 4 != 0) {
			throw new Error('解析宠物学习技能列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - 5) / 4;

		var obj = {
			storeid: match[0],
			name: match[1],
			welcome: match[2],
			insuff_funds: match[3],
			insuff_pets: match[4],
			skills: []
		}

		for (var i = 0; i < storeItemCount; ++i) {
			obj.skills.push({
				index: i,
				name: match[5 + 4 * i + 0],
				mana: parseInt(match[5 + 4 * i + 1]),
				cost: parseInt(match[5 + 4 * i + 2]),
				info: match[5 + 4 * i + 3],
			});
		}
		return obj;
	}

	//从NPC对话框内容解析遗忘技能列表
	cga.parseForgetSkillStoreMsg = (dlg) => {

		if (!dlg) {
			throw new Error('解析遗忘技能列表失败，可能对话超时!');
			return null;
		}

		if (!dlg.message) {
			throw new Error('解析遗忘技能列表失败，可能对话超时!');
			return null;
		}

		if (dlg.type != 18) {
			throw new Error('解析遗忘技能列表失败，可能对话不是遗忘技能!');
			return null;
		}

		var reg = new RegExp(/([^|\n]+)/g)
		var match = dlg.message.match(reg);

		if (match.length < 3) {
			throw new Error('解析遗忘技能列表失败，格式错误!');
			return null;
		}

		if ((match.length - 3) % 3 != 0) {
			throw new Error('解析遗忘技能列表失败，格式错误!');
			return null;
		}

		var storeItemCount = (match.length - 3) / 3;

		var obj = {
			storeid: match[0],
			name: match[1],
			welcome: match[2],
			skills: []
		}

		for (var i = 0; i < storeItemCount; ++i) {
			obj.skills.push({
				index: i,
				name: match[3 + 3 * i + 0],
				level: parseInt(match[3 + 3 * i + 1]),
				slots: parseInt(match[3 + 3 * i + 2]),
			});
		}
		return obj;
	}

	/**
	 * UNAecho: 获取队伍成员详细信息。
	 * 并将GetMapUnits()的model_id加入到结果信息中，以此来辨别角色的人物信息。如性别、武器持有状态、官方汉化名称等。
	 * 数据依据：cga.GetPlayerInfo()中的image_id，就是cga.GetMapUnits()中的model_id。二者是相同值。
	 * @returns 
	 */
	cga.getTeamPlayers = () => {
		var teaminfo = cga.GetTeamPlayerInfo();
		var units = cga.GetMapUnits();
		var playerinfo = cga.GetPlayerInfo();
		for (var i in teaminfo) {

			for (var j in units) {
				if (units[j].type == 8 && units[j].unit_id == teaminfo[i].unit_id) {
					teaminfo[i].model_id = units[j].model_id;
					teaminfo[i].name = units[j].unit_name;
					teaminfo[i].nick = units[j].nick_name;
					teaminfo[i].xpos = units[j].xpos;
					teaminfo[i].ypos = units[j].ypos;
					teaminfo[i].level = units[j].level;
					teaminfo[i].injury = units[j].injury;
					break;
				}
			}
			if (playerinfo.unitid == teaminfo[i].unit_id) {
				teaminfo[i].model_id = playerinfo.image_id;
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
	cga.addTeammate = (name, cb) => {
		var unit = cga.findPlayerUnit(name);
		var mypos = cga.GetMapXY();
		if (unit == null ||
			!cga.isDistanceClose(unit.xpos, unit.ypos, mypos.x, mypos.y) ||
			(unit.xpos == mypos.x && unit.ypos == mypos.y)) {

			cb(false);
			return;
		}

		setTimeout(() => {
			unit = cga.findPlayerUnit(name);

			if (unit == null) {
				cb(false);
				return;
			}

			cga.TurnTo(unit.xpos, unit.ypos);
			setTimeout(() => {
				cga.DoRequest(cga.REQUEST_TYPE_JOINTEAM);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					var stripper = "你要和谁组成队伍？";
					if (dlg && dlg.message && dlg.message.indexOf(stripper) >= 0) {
						var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
						strip = strip.replace(/\\z/g, "|");
						strip = strip.replace(/\\n/g, "|");
						var reg = new RegExp(/([^|\n]+)/g)
						var match = strip.match(reg);
						//console.log(match);
						for (var j = 0; j < match.length; ++j) {
							if (match[j] == name) {
								console.log(j);
								cga.ClickNPCDialog(0, j);
							}
						}
					}

					setTimeout(() => {
						var teamPlayers = cga.getTeamPlayers();

						if (teamPlayers.length && teamPlayers[0].name == name) {
							cb(true);
							return;
						} else if (teamPlayers.length && teamPlayers[0].name != name) {
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
	cga.kickPlayer = (kickArr, cb) => {
		console.log('踢人名单:', kickArr)

		// 由于cga.waitSysMsg经常会出现超时或者监测信息丢失的bug，现改为用人数监测踢人结果。如果踢前踢后人数有变化，则视为踢人成功。
		let tmpLen = cga.getTeamPlayers().length

		let kick = () => {
			let name = kickArr.shift()
			// 如果列表中还有没踢完的人
			if (name) {
				let waitForKick = () => {
					if (tmpLen != cga.getTeamPlayers().length) {
						setTimeout(kick, 1000);
						return
					}
					setTimeout(waitForKick, 1000);
					return
				}

				// 踢之前，先打开监测
				waitForKick()
				// 开始踢人
				console.log('开始踢人..')
				cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					var stripper = "你要把谁踢出队伍？";
					if (dlg && dlg.message && dlg.message.indexOf(stripper) >= 0) {
						var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
						strip = strip.replace(/\\z/g, "|");
						strip = strip.replace(/\\n/g, "|");
						var reg = new RegExp(/([^|\n]+)/g)
						var match = strip.match(reg);
						for (var j = 0; j < match.length; ++j) {
							if (match[j] == name) {
								console.log('【' + match[j] + '】不符合入队条件，踢出。')
								cga.ClickNPCDialog(0, j / 2);
								break;
							}
						}
					}
				});
			} else {// 列表已经没有被踢的人
				console.log('踢人完毕..')
				cb(null)
				return
			}
		}

		kick()
		return
	}

	//等待名字在teammates列表中的的玩家组队，并自动踢出不符合teammates列表的陌生人。
	cga.waitTeammates = (teammates, cb) => {

		var teamplayers = cga.getTeamPlayers();

		if (teammates.length == 0 && teamplayers.length == 0) {
			setTimeout(cb, 2000, true);
			return;
		}

		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		// UNAecho: 改为大于等于，用等于会出现无限等待的bug
		if (teamplayers.length >= teammates.length) {
			for (var i = 0; i < teamplayers.length; ++i) {
				// 自己不能踢自己
				if (teamplayers[i].is_me) {
					continue
				}
				if (!is_array_contain(teammates, teamplayers[i].name)) {
					//Unknown teammates, kick
					cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						var stripper = "你要把谁踢出队伍？";
						if (dlg && dlg.message && dlg.message.indexOf(stripper) >= 0) {
							var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
							strip = strip.replace(/\\z/g, "|");
							strip = strip.replace(/\\n/g, "|");
							// console.log(strip);
							var reg = new RegExp(/([^|\n]+)/g)
							var match = strip.match(reg);
							//console.log(match);
							for (var j = 0; j < match.length; ++j) {
								if (match[j] == teamplayers[i].name) {
									console.log('【' + teamplayers[i].name + '】不符合入队条件，踢出。')
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
		} else {
			let lateList = [].concat(teammates)
			for (let i = 0; i < teamplayers.length; i++) {
				// 将已经在队伍的人删除。由于teammates每次都传入，所以不用顾虑刷新问题
				let index = lateList.indexOf(teamplayers[i].name)
				// 如果已经就位，则从名单上划掉
				if (index != -1) {
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
	cga.waitTeammatesWithFilter = (filter, minTeamMemberCount, cb) => {

		var teamplayers = cga.getTeamPlayers();

		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);

		if (teamplayers.length >= minTeamMemberCount) {
			// 如果不输入，则退化为自由组队
			if (!filter) {
				setTimeout(cb, 2000, true);
				return
			}

			for (var i = 0; i < teamplayers.length; ++i) {
				if (teamplayers[i].is_me) {
					continue
				}
				if (
					(typeof filter == 'string' && teamplayers[i].name.indexOf(filter) == -1) ||
					(typeof filter == 'function' && !filter(teamplayers[i].name))
				) {
					//Unknown teammates, kick
					cga.DoRequest(cga.REQUEST_TYPE_KICKTEAM);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						var stripper = "你要把谁踢出队伍？";
						if (dlg && dlg.message && dlg.message.indexOf(stripper) >= 0) {
							var strip = dlg.message.substr(dlg.message.indexOf(stripper) + stripper.length);
							strip = strip.replace(/\\z/g, "|");
							strip = strip.replace(/\\n/g, "|");
							// console.log(strip);
							var reg = new RegExp(/([^|\n]+)/g)
							var match = strip.match(reg);
							// console.log(match);
							for (var j = 0; j < match.length; ++j) {
								if (match[j] == teamplayers[i].name) {
									console.log('【' + teamplayers[i].name + '】不符合入队条件，踢出。')
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
	 * @param {Object} obj API所需参数，具体如下：
	 * 
	 * @param {Array} obj.teammates 队伍成员信息，数据结构为String数组，但可以实现固定组队与自由组队
	 * 1、固定组队：数组的元素必须为String，且均为队员名称。长度小于等于5
	 * 2、自由组队：与固定组队相同，但是从第2个名称开始，数组元素可以为null，代表不限制除队长以外的人加入队伍。长度必须为1-5
	 * 
	 * 【注意】
	 * 1、判断是否是队长：teammates第一个人的名字
	 * 2、一旦数组中出现null值，则转化为自由组队，除了队长，所有队员名称均无效。
	 * 3、自由组队目前有bug，不建议使用。具体内容是：出现并发情况时，无法准确地判定队伍是否人数正确。
	 * 原因是：在递归等待时，队长出现人数判定的失误。
	 * 比如2名队员，其中1名队员加入队伍时，队长刚好retry递归开始运行，判定人数合格。但队长在关闭组队开关前，另一名队员刚好加入。
	 * 此时队伍人数就比预定要多
	 * 
	 * 因为觉得自由组队的创意不错，所以保留了这个自由组队的逻辑。
	 * 
	 * TODO: 想办法修复，在此之前，请尽量使用固定组队。
	 * @param {int} obj.timeout 超时时间，以毫秒为单位。如果填0则视为无限等待。
	 * @param {Array} obj.pos 可选，队长站立坐标，如果传入，必须为int型数组，长度必须为2。全队会先走至合适的位置，再进行组队逻辑
	 * @param {Array} obj.dangerLevel 可选，组队所在地图的危险等级，只要大于0，人物在走动时会自动读取逃跑类战斗配置
	 * @param {*} cb 回调函数，所有队员齐全则传入'ok'，如果不满足条件或没有队伍，会等待至超时，调用cb并传入'timeout'
	 */
	cga.buildTeam = (obj, cb) => {
		if (!obj.teammates instanceof Array || obj.teammates.length > 5) {
			throw new Error('obj.teammates必须为String数组，且长度小于等于5')
		}
		// 先获取自己的人物信息
		var playerInfo = cga.GetPlayerInfo();
		if (obj.teammates.length == 0 || (obj.teammates.length == 1 && ((obj.teammates[0] == playerInfo.name) || (obj.teammates[0] == null)))) {
			console.warn('obj.teammates为空数组，或数组中只有自己的名字或只有1个null。视为不组队。退出cga.buildTeam()逻辑，callback传入ok。')
			cb('ok')
			return
		}
		// 由于cga.waitTeammates判定组队ready延迟2秒return，所以本API需要至少3秒延迟。
		// 如果延迟为0，则视为无限等待
		if (obj.hasOwnProperty('timeout') && obj.timeout > 0 && obj.timeout < 2000) {
			obj.timeout = 3000
		}

		if (obj.pos) {
			if (!obj.pos instanceof Array) {
				throw new Error('pos如果传入，类型必须为Array')
			}
			if (obj.pos.length != 2) {
				throw new Error('pos如果传入，则必须是长度为2的int型Array')
			}
		}

		var isLeader = obj.teammates[0] == playerInfo.name ? true : false
		var mapXY = cga.GetMapXY();
		var start = Date.now()
		// 两个队伍信息的临时变量
		var curTeam = null
		var tmpTeam = null

		// 队员专用，检查其他队员是否与预期成员相符
		const checkOthers = () => {
			tmpTeam = cga.getTeamPlayers();
			if (tmpTeam.length < obj.teammates.length) {
				// console.log('人数不足，checkOthers返回false')
				return false
			}
			// 这里要使用等于而不是大于等于，因为无法在多人加入队伍的瞬间判定人数是否正确。如果用大于等于，会出现人数多于要求人数，但API返回true的bug
			if (obj.teammates.includes(null)) {
				if (tmpTeam.length == obj.teammates.length) {
					console.log('当前为自由组队，除队长【', obj.teammates[0], '】以外，均不检查其它队员是否在名单中出现。当前队伍满足条件，checkOthers返回true。')
					return true
				} else {
					console.log('当前为自由组队，除队长【', obj.teammates[0], '】以外，均不检查其它队员是否在名单中出现。当前队伍不满足条件，checkOthers返回false。')
					return false
				}
			}

			for (let t = 0; t < tmpTeam.length; t++) {
				/**
				 * UNAecho开发提醒:
				 * cga.getTeamPlayers()是根据地图上的单位获取信息的，游戏出现BUG时(看不到附近的玩家、NPC等)会导致cga.getTeamPlayers()出现返回队员的信息是全0的情况
				 * 也就是hp、maxhp等信息全0，导致逻辑无法进行。所以这里遇到异常数据（以maxhp==0为异常判断，maxhp > 0是正常数据）时，直接跳过，防止逻辑异常
				 */
				if (tmpTeam[t].maxhp > 0 && obj.teammates.indexOf(tmpTeam[t].name) == -1) {
					console.log('队员:', tmpTeam[t].name, '与预期队伍:', obj.teammates, '不匹配，checkOthers返回false')
					return false
				}
			}
			return true
		}

		var retry = () => {
			let currentTime = new Date()
			// 间隔报时
			if (currentTime.getSeconds() % 10 == 0) {
				console.log('已等待' + Math.floor((currentTime.getTime() - start) / 1000) + '秒' + (obj.timeout > 0 ? ('，' + Math.floor(obj.timeout / 1000).toString() + '秒后超时。') : ''))
			}

			if (obj.timeout > 0 && (currentTime.getTime() - start) >= obj.timeout) {
				cb('timeout')
				return
			}

			if (isLeader) {
				if (obj.teammates.includes(null)) {
					// console.log('cga.buildTeam:检测到当前为自由组队，仅判断队长名称是否符合预期，队员名称全部忽略，只判断人数是否足够')
					let curTeam = cga.getTeamPlayers()
					// 人数足够，但还要修整人数。原因：比如在1秒内同时加入队伍的人，而队伍人数是有要求的，像神兽必须为2人。所以需要踢掉一部分。
					if (curTeam.length >= obj.teammates.length) {
						// 人数满足，关闭组队
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);

						// 延迟一段时间再执行逻辑，更加稳定
						setTimeout(() => {
							let kickArr = []
							for (let i = 0; i < curTeam.length; i++) {
								if (i < obj.teammates.length) {
									continue
								}
								kickArr.push(curTeam[i].name)
							}
							// 如果真有需要踢的人
							if (kickArr.length) {
								cga.kickPlayer(kickArr, () => {
									cb('ok')
								})
								return
							}
							// 如果没有需要踢的人，正常结束
							cb('ok')
							return
						}, 1500);
						return
					}
					// 间隔报迟到队员
					if (currentTime.getSeconds() % 10 == 0) {
						console.log('自由组队，人数还缺:', obj.teammates.length - cga.getTeamPlayers().length)
					}
					setTimeout(retry, 1000)
					return
				} else {
					cga.waitTeammates(obj.teammates, (r, lateList) => {
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
				}
			} else {
				curTeam = cga.getTeamPlayers();
				if (curTeam.length && checkOthers()) {
					cb('ok')
					return
				} else if (!curTeam.length) {
					cga.addTeammate(obj.teammates[0], (r) => {
						/**
						 * 自由组队时，当1秒内2名或以上队员同时加入队伍中时，在加入之后的瞬间，无法判断队伍人数，因为在自己的脚本内存中，人数都是2。
						 * 这里加一个延迟，因为队长会在人数满足之后，踢掉多余的人。
						 * 注意这个延迟要比队长的踢人判定延迟大一些，否则会计算人数失误
						 */
						setTimeout(() => {
							if (r && checkOthers()) {
								cb('ok')
								return
							}
							setTimeout(retry, 1000);
						}, 2000);
					})
					return
				}
				setTimeout(retry, 1000);
				return
			}
		}

		// 逻辑开始前，全队打开队伍开关
		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);

		// 如果已经在队伍中，直接进入retry
		if (cga.getTeamPlayers().length) {
			retry()
			return
		}

		// 如果没有传入pos，则直接进入retry
		if (!obj.pos) {
			retry()
			return
		}

		// 如果传入了危险等级，则需要读取逃跑策略。避免因为为了组队而走动导致遇敌，却按照组队的战斗策略导致阵亡。
		if (obj.dangerLevel > 0) {
			console.log('由于传入了危险等级:', obj.dangerLevel, '读取逃跑类的战斗配置，防止因组队导致遇敌而阵亡。')
			cga.loadBattleConfig('生产赶路')
		}

		if (isLeader) {
			if (mapXY.x == obj.pos[0] && mapXY.y == obj.pos[1]) {
				retry()
			} else {
				cga.walkList([
					obj.pos
				], () => {
					retry()
				});
			}
		} else {
			var memberPos = cga.getRandomSpace(obj.pos[0], obj.pos[1]);
			// 如果已经站好位，或者已经在pos的1x1范围内，则跳过走路
			if ((mapXY.x == memberPos[0] && mapXY.y == memberPos[1]) || cga.isAroundPos(obj.pos)) {
				retry()
			} else {
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
	cga.waitTeammateSay = (cb) => {

		cga.AsyncWaitChatMsg((err, r) => {

			if (!r) {
				cga.waitTeammateSay(cb);
				return;
			}

			var listen = true;
			var fromTeammate = null;
			var teamplayers = cga.getTeamPlayers();

			if (!teamplayers.length) {
				var playerInfo = cga.GetPlayerInfo();
				if (playerInfo.unitid == r.unitid) {
					fromTeammate = playerInfo;
					fromTeammate.index = 0;
					fromTeammate.is_me = true;
				}
			}

			for (var i in teamplayers) {
				if (teamplayers[i].unit_id == r.unitid) {
					fromTeammate = teamplayers[i];
					fromTeammate.index = i;
					break;
				}
			}

			if (fromTeammate) {
				var msgheader = fromTeammate.name + ': ';
				if (r.msg.indexOf(msgheader) >= 0) {
					var msg = r.msg.substr(r.msg.indexOf(msgheader) + msgheader.length);

					if (msg.indexOf('[交易]') == 0)
						msg = msg.substr('[交易]'.length);
					listen = cb(fromTeammate, msg);
				}
			}

			if (listen == true)
				cga.waitTeammateSay(cb);
		}, 1000);
	}

	//监听队友聊天信息 队友必须说“1”
	cga.waitTeammateSayNextStage = (teammates, cb) => {

		var teammate_state = {};
		var teammate_ready = 0;

		cga.waitTeammateSay((player, msg) => {

			if (msg == '1' && teammate_state[player.name] !== true) {
				teammate_state[player.name] = true;
				teammate_ready++;
			}

			if ((teammates.length && teammate_ready >= teammates.length) || (!teammates.length && teammate_ready == 1)) {
				//all teammates are ready
				cb(true);
				return false;
			}

			return true;
		});
	}

	//监听队友聊天信息 队友必须说“1”或“2”
	cga.waitTeammateSayNextStage2 = (teammates, cb) => {
		var teammate_state = {};
		var teammate_ready = 0;
		var teammate_notready = 0;

		cga.waitTeammateSay((player, msg) => {

			if (teammate_state[player.name] !== true && teammate_state[player.name] !== false) {
				if (msg == '1') {
					teammate_state[player.name] = true;
					teammate_ready++;
				} else if (msg == '2') {
					teammate_state[player.name] = false;
					teammate_notready++;
				}
				// console.log(teammate_state)
				// console.log('teammate_ready:' + teammate_ready)
				// console.log('teammate_notready:' + teammate_notready)
			}

			if ((teammates.length && teammate_ready >= teammates.length) || (!teammates.length && teammate_ready == 1)) {
				//all teammates are ready
				// console.log('all teammates are ready')
				cb(true);
				return false;
			}

			if ((teammates.length && teammate_ready + teammate_notready >= teammates.length) || (!teammates.length && teammate_ready + teammate_notready == 1)) {
				//some teammates are not ready
				// console.log('some teammates are not ready')
				cb(false);
				return false;
			}

			return true;
		});
	}

	cga.waitTeammateSayandreturninfo = (teammates, positivemsg, nativemsg, cb) => {
		var teammate_info = {
			teammate_ready: 0,
			teammate_answercount: 0
		};

		cga.waitTeammateSay((player, msg) => {

			if (teammate_info[player.name] !== true && teammate_info[player.name] !== false) {
				console.log('msg :  ' + msg.indexOf(positivemsg))
				if (msg.indexOf(positivemsg) >= 0) {
					teammate_info[player.name] = true;
					teammate_info.teammate_ready++;
					teammate_info.teammate_answercount++;
				} else if ((msg.indexOf(nativemsg) >= 0)) {
					teammate_info[player.name] = false;
					teammate_info.teammate_answercount++;
				}
			}
			console.log('teammates.teammate_ready ' + teammate_info.teammate_ready + 'readycount : ' + teammate_info.teammate_answercount)
			if ((teammates.length && teammate_info.teammate_answercount >= teammates.length) || (!teammates.length && teammate_answercount == 1)) {
				//all teammates are ready
				cb(teammate_info);
				return false;
			}

			return true;
		});
	}

	/**
	 * UNAecho:等待队内指定玩家名称的人说话，如果该人物离队，则结束监听。
	 * 参考cga.waitTeammateSay所写
	 * @param {*} cb 
	 */
	cga.waitLockTeammateSay = (lockPlayerName, cb) => {
		cga.AsyncWaitChatMsg((err, r) => {
			if (!r) {
				let curTeamPlayerInfos = cga.GetTeamPlayerInfo()
				for (let t of curTeamPlayerInfos) {
					if (t.name == lockPlayerName) {
						cga.waitLockTeammateSay(lockPlayerName, cb);
						return
					}
				}
				console.log('监听【' + lockPlayerName + '】失败！该队员已离队。cga.waitLockTeammateSay结束..')
				cb(null, null)
				return;
			}

			var listen = true;
			var fromTeammate = null;
			var teamplayers = cga.getTeamPlayers();

			if (!teamplayers.length) {
				console.log('队伍已解散，cga.waitLockTeammateSay结束..')
				// 队伍解散时，lockPlayerName置为null，方便外部判断。
				cb(null, null)
				return;
			}

			for (var i in teamplayers) {
				if (teamplayers[i].unit_id == r.unitid) {
					fromTeammate = teamplayers[i];
					fromTeammate.index = i;
					break;
				}
			}

			if (fromTeammate) {
				var msgheader = fromTeammate.name + ': ';
				if (r.msg.indexOf(msgheader) >= 0) {
					var msg = r.msg.substr(r.msg.indexOf(msgheader) + msgheader.length);

					if (msg.indexOf('[交易]') == 0)
						msg = msg.substr('[交易]'.length);
					listen = cb(fromTeammate, msg);
				}
			}

			if (listen == true) {
				cga.waitLockTeammateSay(lockPlayerName, cb);
			}
		}, 1000);
	},

		// UNAecho:队内使用自定义称号进行交流，注意称号有16字节长度限制
		cga.waitTeammateInfo = (teammates, infoFunc, cb) => {
			// 如果没传入指定队伍，则自动以队内人员为准。
			if (!teammates)
				teammates = cga.getTeamPlayers()
			if (!teammates.length) {
				console.log('没有队员，退出cga.waitTeammateInfo，回调参数传入null')
				setTimeout(cb, 1000, null);
				return
			}

			const identifier = ["z", "j", "f", "m", "a"]
			const reg = new RegExp(/[zjfma]{1}[oknu\d]{2}/g)
			const infoFuncValue = infoFunc()

			var teammate_info = {};
			cga.isTeamLeader = (teammates[0].name == cga.GetPlayerInfo().name || teammates.length == 0) ? true : false;

			var checkTeammates = (cb) => {
				var listen = true

				// 注意这里是刷新队内状态，一切以teamCommunicateTest传入的teammates为验证数据的基础。
				// 因为可能在验证期间，有非teammates的角色（如：其他玩家）错加入队伍。
				var teamplayers = cga.getTeamPlayers()

				if (teammates.length != teamplayers.length) {
					console.warn('队内玩家数量与预期玩家数量不符')
					setTimeout(checkTeammates, 1000, cb);
					return
				}

				for (let t = 0; t < teamplayers.length; t++) {
					let tmpNick = identifier[t].toString() + infoFuncValue
					if (teamplayers[t].is_me) {
						if (teamplayers[t].nick != tmpNick) {
							cga.ChangeNickName(tmpNick)
							console.log("更改nickname:【" + tmpNick + "】")
						}
						continue
					}

					if (!cga.isTeamLeader && t > 0)
						continue

					memberNick = teamplayers[t].nick.match(reg)
					if (!memberNick) {
						continue
					}
					memberNick.forEach((n) => {
						let k = identifier.indexOf(n[0])
						if (k == -1)
							return
						let v = n.slice(1, 3)
						let result = infoFunc(v)
						if (result === true) {
							teammate_info[teamplayers[k].name] = v
							return
						}
					})
				}

				listen = cb(teammate_info)
				if (listen == true)
					setTimeout(checkTeammates, 1000, cb);
			}

			checkTeammates((teammate_info) => {
				let readycount = cga.isTeamLeader ? teammates.length - 1 : 1
				if (Object.keys(teammate_info).length == readycount) {
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
	 * m:任务完成情况，记录在【个人配置中】。队员返回任务完成情况，0表示没完成，1表示已完成。
	 * p:职业相关信息，记录在【来自于cga.job.getJob()】。队员返回指定的查询属性数值。
	 * 例：['i承认之戒','#491677','t背叛者','m小岛之谜','p职业等级']
	 * 表示分别询问队员道具【承认之戒】、道具id【491677】、称号【背叛者】持有情况，任务【小岛之谜】是否已完成，以及当前职业等级数字（1转为1，2转为2）
	 * 
	 * 【注意】使用传递信息名称的字节数，最多支持12（含）字节，剩下4字节用来表示回应队长和被询问信息的回答。
	 * 全角字符最多支持6(含)个字，半角字符最多支持12(含)个字。
	 * 也是由于此原因，【树精长老的末日】全项目更名为【树精长老】。
	 * 
	 * @param {*} cb 回调函数，全员信息收集完毕后制作成object，调用cb并将object传入
	 * @returns 
	 */
	cga.shareTeammateInfo = (memberCnt, reqSequence, cb) => {

		var teamplayers = cga.getTeamPlayers();
		if (!teamplayers.length) {
			console.log('共享信息时失去与队伍的连接，共享API结束，回调函数传入false..')
			setTimeout(cb, 1000, false);
			return
		}
		var playerInfo = cga.GetPlayerInfo()
		var config = cga.loadPlayerConfig();
		var jobObj = cga.job.getJob()
		var isleader = teamplayers[0].name == playerInfo.name ? true : false

		if (isleader && teamplayers.length < memberCnt) {
			// console.log('等待人齐，还差【',memberCnt - teamplayers.length,'】人')
			setTimeout(cga.shareTeammateInfo, 3000, memberCnt, reqSequence, cb);
			return
		}

		// 不再复原称号，因为会对调用此API的函数产生干扰
		// var originNick = playerInfo.nick ? playerInfo.nick : ''

		// 队伍信息缓存，也是本函数最终return的变量
		var teammate_info = {};
		// 人物称号缓存，记录每个人的当前称号。用于一些逻辑的性能节约
		var nickCache = {}
		// 如果自己已经拿到全队信息，就在所有修改昵称动作时，末尾加上此标记，用来判断全队是否退出cga.shareTeammateInfo
		// 初始化为空串，在已经收集齐信息后，需要给他赋值。建议使用$符号
		var allDoneStr = ''
		// 用英语首字母zjfma代表0、1、2、3、4。其中z是zero首字母，jfma是1234月份首字母
		const identifier = ["z", "j", "f", "m", "a"]
		// 类型缩写翻译
		const translateDict = {
			"i": "item",
			"#": "item",
			"t": "title",
			"m": "mission",
			"r": "role",
			"p": "profession",
		}
		const reqReg = new RegExp(/([zjfma]{1})([i#tmrp])([\d\u4e00-\u9fa5]+)/)
		const resReg = new RegExp(/([i#tmrp])([\d\u4e00-\u9fa5]+)([zjfma]{1})([\d\u4e00-\u9fa5]+)/)

		//检查的func集合
		const reqAct = {
			"item": (input) => {
				if (isNaN(parseInt(input))) {
					return cga.getItemCount(input, true)
				}
				return cga.getItemCount('#' + input, true)
			},
			"title": (input) => {
				return cga.findTitle(input) == -1 ? 0 : 1
			},
			"mission": (input) => {
				if (config && config["mission"] && config["mission"][input]) {
					return 1
				}
				/**
				 * UNAecho:这里可能会有一个小问题
				 * 比如你是一个已经生产1转的职业，而这时候恰巧队长问你'挑战神兽'任务完成与否
				 * 由于生产系无需做战斗系的任务，所以对你来说'挑战神兽'当然没有完成，return 0
				 * 但是如果是这样，就可能会触发队长带你去做'挑战神兽'任务，而这是一个生产系不需要的任务
				 * 所以这里做出调整，如果是不为医师和护士的非战斗系，则直接谎报事实，避免被队长带去做不必要的任务
				 */
				if (jobObj.jobType != '战斗系' && jobObj.job != '医师' && jobObj.job != '护士') {
					if (input == '挑战神兽' || input == '诅咒的迷宫') {
						console.log('你并非战斗系，且不是医师和护士，如果被问神兽或诅咒是否完成，需要撒谎说已完成，不然会被带去做不必要的任务。')
						return 1
					}
				}
				return 0
			},
			"role": (input) => {
				var res = cga.role.battleRoleArr.indexOf(input)
				if (res == -1) {
					// 定义0为异常值
					console.error('错误:cga.role.battleRoleArr中没有设定你输入的【' + input + '】职责')
					return 0
				}

				var json = null
				try {
					var rootdir = cga.getrootdir()
					var configPath = rootdir + '\\脚本设置';
					var configName = configPath + '\\通用挂机脚本_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';
					var json = fs.readFileSync(configName, 'utf8');

					if (typeof json != 'string' || !json.length)
						throw new Error('配置文件格式错误');
				} catch (e) {
					if (e.code != 'ENOENT') {
						console.log('role error:' + e)
					}
				}

				var obj = JSON.parse(json)
				// roleObj对象的结构大致为{part : "队长", role: "输出"}，role的值参考cga.role.battleRoleArr
				if (obj && obj.hasOwnProperty('roleObj') && obj.roleObj.hasOwnProperty('role')) {
					let index = cga.role.battleRoleArr.indexOf(obj.roleObj.role)
					if (index == -1) {
						console.error('脚本设置中的role值【' + obj.roleObj.role + '】有误，具体数值请参考cga.role.battleRoleArr')
						return 0
					}
					if (input == obj.roleObj.role) {
						res = 1
					} else {
						res = 0
					}
				} else {
					throw new Error('错误:脚本设置文件夹下的数据格式有误，没有检查到roleObj对象。请检查')
				}
				return res
			},
			"profession": (input) => {
				let jobObj = cga.job.getJob();
				if (input == '职业等级') {
					return jobObj.jobLv
				} else {
					throw new Error('未支持的查询参数:', input);
				}
			},
		}

		const resAct = (regObj, teams) => {
			if (!teams[identifier.indexOf(regObj[3])]) {
				console.log('队员', identifier.indexOf(regObj[3]) + 1, '号缺失，猜测是被踢或掉线了')
				return
			}
			if (!teammate_info[teams[identifier.indexOf(regObj[3])].name]) {
				teammate_info[teams[identifier.indexOf(regObj[3])].name] = { lv: teams[identifier.indexOf(regObj[3])].level }
			}

			Object.keys(reqAct).forEach((k) => {
				if (!teammate_info[teams[identifier.indexOf(regObj[3])].name][k]) {
					teammate_info[teams[identifier.indexOf(regObj[3])].name][k] = {}
				}
			})

			if (regObj[1] == "i" || regObj[1] == "#") {
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["item"][regObj[2]] = regObj[4]
			} else if (regObj[1] == "t") {
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["title"][regObj[2]] = regObj[4]
			} else if (regObj[1] == "m") {
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["mission"][regObj[2]] = regObj[4]
			} else if (regObj[1] == "r") {
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["role"][regObj[2]] = regObj[4]
			} else if (regObj[1] == "p") {
				teammate_info[teams[identifier.indexOf(regObj[3])].name]["profession"][regObj[2]] = regObj[4]
			} else {
				throw new Error('暗号类型错误，请检查')
			}
			console.log('队员', teams[identifier.indexOf(regObj[3])].name, '更新', translateDict[regObj[1]], regObj[2], '的值【', regObj[4], '】')
		}
		/**
		 * type : i,#,t,m,r,p等缩写
		 * name : 查询的信息名称，如承认之戒、传送小岛、输出、治疗、小号、开启者、职业等级等等
		 */
		var answer = (type, name) => {
			let res = reqAct[translateDict[type]](name)
			// 在回答的同时，在队伍信息里直接更新自己的信息，listener里遍历到自身，则跳过，防止多个地方写入
			if (!teammate_info[playerInfo.name]) {
				teammate_info[playerInfo.name] = {}
			}
			if (!teammate_info[playerInfo.name][translateDict[type]]) {
				teammate_info[playerInfo.name][translateDict[type]] = {}
			}
			teammate_info[playerInfo.name].lv = playerInfo.level
			teammate_info[playerInfo.name][translateDict[type]][name] = res
			// console.log('写入自身的信息，',teammate_info)
			return res
		}

		var listener = (cb) => {
			let curTeamplayers = cga.getTeamPlayers()
			if (!curTeamplayers.length) {
				cb(false)
				return
			}
			let leaderNick = curTeamplayers[0].nick
			if (leaderNick && leaderNick.indexOf('restart') != -1) {
				cb(false)
				return
			}
			if (isleader && curTeamplayers.length != memberCnt) {
				cga.ChangeNickName('z' + 'restart' + allDoneStr)
				cb(false)
				return
			}
			if (leaderNick && leaderNick.indexOf('check') != -1) {
				cb(true)
				return
			}
			// 先要遍历一次，获取自己在队伍中的序列。
			let indexStr = null
			for (let t = 0; t < curTeamplayers.length; t++) {
				if (curTeamplayers[t].is_me) {
					indexStr = identifier[t]
				}
			}
			// 然后再遍历全队，获取正则匹配值，进行主要逻辑
			for (let t = 0; t < curTeamplayers.length; t++) {
				// 自己的信息在answer里面已经写入，这里跳过。无论队长还是队员均是如此。
				if (curTeamplayers[t].is_me) {
					continue
				}
				if (nickCache[curTeamplayers[t].name] == curTeamplayers[t].nick) {
					// console.log('[' +curTeamplayers[t].name + ']缓存[' + nickCache[curTeamplayers[t].name] + ']没变')
					continue
				}
				nickCache[curTeamplayers[t].name] = curTeamplayers[t].nick
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
				if (reqObj) {
					let answerStr = answer(reqObj[2], reqObj[3])
					// 队长的answer已经不在listen里面制作，
					// setTimeout(() => {
					cga.ChangeNickName(reqObj[2] + reqObj[3] + indexStr + answerStr + allDoneStr)
					// }, isleader ? 2000 : 0);
					continue
				}
				if (resObj) {
					resAct(resObj, curTeamplayers)
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

			if (reqArr.length) {
				// console.log('speaker正在运行中..')
				return
			}
			// console.log('speaker..')

			refreshList()

			// 如果队友allDoneStr为空，则正常按顺序问问题。
			// 如果全员都有allDoneStr标识，则直接跳过询问问题，队长在称号标记check，全员进入check模式
			var changeNick = () => {
				let teams = cga.getTeamPlayers();
				let breakFlag = true
				for (let t = 0; t < teams.length; t++) {
					if (teams[t].nick.indexOf('$') == -1) {
						breakFlag = false
						break
					}
				}

				if (breakFlag) {
					console.log('检测到全员的信息共享已经收集完毕，中断speaker..')
					reqArr = []
					cga.ChangeNickName('check' + '$')
					return
				}

				let curReqStr = reqArr.shift()
				if (curReqStr) {
					cga.ChangeNickName(curReqStr + allDoneStr)
					speakerMeter = setTimeout(changeNick, 2500);
					return
				}
			}

			changeNick()
		}

		// 队长的问题以及回答
		var refreshList = () => {
			reqSequence.forEach(str => {
				let type = str[0]
				let name = str.substring(1)
				reqArr.push('z' + str)
				reqArr.push(type + name + 'z' + answer(type, name))
			});
			reqArr.push('check')
			return reqArr
		}

		var check = (flag) => {
			let delay = 5000
			if (flag === false) {
				clearTimeout(speakerMeter)
				console.log('check结果为false，清除缓存', delay / 1000, '秒后重新进入cga.shareTeammateInfo..')
				setTimeout(() => {
					nickCache = {}
					// 不再恢复原称号，因为会和一些外层调用的API发生称号修改冲突，导致外层判断出现失误
					// cga.ChangeNickName(originNick)

					// 函数结束，回调传入false。在外部可以重新执行此API以继续逻辑
					setTimeout(cb, 1000, false);
					return
				}, delay);
				return
			} else if (flag === true) {
				let checkKey = null
				let checkValue = null
				let checkKeys = Object.keys(teammate_info)
				let teams = cga.getTeamPlayers();
				if (checkKeys.length < teams.length) {
					console.log('队员信息中，人数统计缺失，', delay / 1000, '秒后重新进入mainLogic..')
					// 队员缺失，重置统计信息
					teammate_info = {}
					// 缓存信息也清除
					nickCache = {}
					// 如果人员缺失，那么信息收集齐全的flag要重置。
					allDoneStr = ''
					setTimeout(mainLogic, isleader ? delay : 0);
					return
				}
				for (let i = 0; i < reqSequence.length; i++) {
					checkKey = translateDict[reqSequence[i][0]]
					checkValue = reqSequence[i].substring(1)
					for (let k in checkKeys) {
						let v = teammate_info[checkKeys[k]];
						if (!v || !v[checkKey] || !v[checkKey].hasOwnProperty(checkValue)) {
							let isInTeam = false
							for (let t = 0; t < teams.length; t++) {
								if (teams[t].name == checkKeys[k]) {
									isInTeam = true
									break
								}
							}
							// 如果缺失的队员不在队伍中，则删除其数据。（可能是队伍成员构成不满足条件，不能拼成合格的发车队伍）
							// 如果在队伍中，则保留其数据，方便下次迭代补全。
							if (!isInTeam) {
								console.log('队员信息中【' + checkKeys[k] + '】数据缺失，且该名队员已经离队。删除其数据，', delay / 1000, '秒后重新进入mainLogic..')
								delete teammate_info[checkKeys[k]]
								// 缓存信息也清除
								delete nickCache[checkKeys[k]]
							} else {
								console.log('队员信息中【' + checkKeys[k] + '】数据缺失，但该名队员还在队伍中，保留其数据，', delay / 1000, '秒后重新进入mainLogic..')
								console.log(teammate_info[checkKeys[k]])
							}
							setTimeout(mainLogic, isleader ? delay : 1500);
							return
						}
					}
				}
				// 如果人数正确，数据收集也齐全，将自己的done标记加在后续的昵称末尾
				allDoneStr = '$'
				for (let t = 0; t < teams.length; t++) {
					if (teams[t].nick.indexOf(allDoneStr) == -1) {
						setTimeout(mainLogic, delay);
						return
					}
				}
				// 写入队伍信息，方便外部使用。目的是为了队伍信息的一致性。否则外面再重新获取队伍信息，有可能出现偏差（掉线、解散过快导致没获取到队伍信息等等）
				if (!teammate_info['teammates']) {
					let teammates = []
					for (var i in teams) {
						teammates[i] = teams[i].name;
					}
					teammate_info['teammates'] = teammates
				}
				// 此API出口
				// 缓冲2秒。并不再恢复原称号，因为会和一些外层调用的API发生称号修改冲突，导致外层判断出现失误
				setTimeout(() => {
					// cga.ChangeNickName(originNick)
					cb(teammate_info)
				}, 2000);
				return
			}
		}

		var mainLogic = () => {

			if (isleader) {
				speaker()
			}
			listener((r) => {
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
	 * 1、sum：全队持有某信息的加和。比如全队持有承认之戒的总和、长老之证的总和等等。
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
	cga.buildCustomerTeam = (cusObj, cb) => {
		// 检查数据完整度，定义通用方法
		let checkInputData = (obj, key, typeStr) => {
			if (!obj.hasOwnProperty(key)) {
				throw new Error('key【' + key + '】不存在，请检查')
			}
			if (typeStr == 'array' && !obj[key] instanceof Array) {
				throw new Error('key:' + key + '的value:' + obj[key] + '与预期类型:' + typeStr + '不符，请检查')
			} else if (typeStr != 'array' && typeof obj[key] != typeStr) {
				throw new Error('key:' + key + '的value:' + obj[key] + '与预期类型:' + typeStr + '不符，请检查')
			}
		}

		// 组队站位，但并不是队员寻找队长的逻辑，只是单纯赶去队长的站立地点，方便组队。队员寻找队长逻辑在下面昵称过滤部分。
		let muster = (isLeader, leaderPos, cb) => {
			if (dangerLevel > 0) {
				cga.loadBattleConfig('生产赶路')
			}
			let XY = cga.GetMapXY()
			if (isLeader) {
				if (XY.x == leaderPos[0] && XY.y == leaderPos[1]) {
					cb(null)
					return
				}
				cga.walkList([leaderPos], cb);
				return
			} else {
				if (cga.getTeamPlayers().length) {
					cb(null)
					return
				}
				// 如果已经在队长1x1范围，则跳过走路。
				if (cga.isAroundPos(leaderPos)) {
					cb(null)
					return
				}
				// 由于cga.getRandomSpace不是真随机，所以对于同一个坐标，每次计算结果都是一样的
				let targetPos = cga.getRandomSpace(leaderPos[0], leaderPos[1]);
				cga.walkList([targetPos], cb);
				return
			}
		}
		// 共享队员信息
		var share = (memberCnt, shareArr, cb) => {
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
		if (typeof cusObj != 'object') {
			throw new Error('cusObj类型必须为object')
		}

		// 必须全员判定的属性
		// 检查对象，此核心数据
		checkInputData(cusObj, 'check', 'object')
		// 队长队员
		checkInputData(cusObj, 'part', 'string')
		let isLeader = cusObj.part == '队长' ? true : false

		// 队长站立坐标
		checkInputData(cusObj, 'leaderPos', 'array')
		if (isLeader) {
			// 人数大于等于此数字，开始共享信息
			checkInputData(cusObj, 'memberCnt', 'number')
		}
		// 队长昵称暗号
		checkInputData(cusObj, 'leaderFilter', 'string')
		// 组队地点的危险等级，如果有危险，在走到队长这段过程需要改变战斗配置（逃跑），防止组队前暴毙
		checkInputData(cusObj, 'dangerLevel', 'number')
		// 此API成功时的称号，队长和队员在完成逻辑后，均会将称号置为此值。
		checkInputData(cusObj, 'doneNick', 'string')

		// API输入数据
		let checkObj = cusObj.check
		let leaderPos = cusObj.leaderPos
		let leaderFilter = cusObj.leaderFilter
		let dangerLevel = cusObj.dangerLevel
		let doneNick = cusObj.doneNick

		if (doneNick.length > 16) {
			throw new Error('doneNick长度不得大于16')
		}

		// 队长专用数据
		let memberCnt = cusObj.memberCnt
		// 如果不输入，则默认允许任何人进队
		let nameFilter = cusObj.nameFilter

		// 明确指出不需要某种item，在挂上leaderFilter来招募队员时，与!号一起，拼接在leaderFilter的后面。多数用于告知不再需要某r职责。如：不再需要输出/治疗/小号等
		let noNeedStr = ''
		// 队员使用，监测队长是否明确不需要自己的职责。需要配合cga.role.battleRoleArr使用
		const noNeedExp = new RegExp(/(?<=\!)(r\d)*/)
		// 黑名单相关
		var blacklist = {}
		var blacklistTimeout = Math.floor(Math.random() * (180000 - 5000 + 1) + 300000);
		// 队员监听队长是否踢自己
		const leaderReg = new RegExp(/你被队长“(.+)”请出队伍/)
		// 监听队长踢自己的超时时间，超过就判断队伍是否合格
		const leaerKickMeTimeout = 4000
		let mainLogic = () => {
			if (isLeader) {
				var check = (shareInfoObj, cusObj) => {
					// 清空上一次踢人的黑名单
					blacklist = {}
					// 重置不需要的职责，因为队员可能是全新的人员，职责可能有变动
					noNeedStr = ''
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
							for (let j in shareInfoObj[i]) {
								// 部分key的value不是object，比如lv是number。
								if (Object.prototype.toString.call(shareInfoObj[i][j]) == '[object Object]') {
									if (shareInfoObj[i][j].hasOwnProperty(key)) {
										hasFoundKey = true
										let value = parseInt(shareInfoObj[i][j][key])
										if (statObj.hasOwnProperty(key)) {
											// 如果对某信息不设限，则sum处写-1，这里就不会判断是否超过阈值
											if (cusObj.check[k].sum != -1 && statObj[key].sum + value > cusObj.check[k].sum) {
												reason = '当前key【' + key + '】总和【' + statObj[key].sum + '】由于队员【' + i + '】的value【' + value + '】加入，已超出全队总和阈值【' + cusObj.check[k].sum + '】，将此队员加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												// 如果是职责数量超过预设值，则接下来招募时，称号体现出拒绝某职责的队员
												if (k[0] == 'r') {
													let roleIndex = cga.role.battleRoleArr.indexOf(key)
													// 如果cga.role.battleRoleArr职责表中有这种职责，并且noNeedStr中没有记录过，则记录。以免重复记录职责
													if (roleIndex != -1) {
														if (noNeedStr.indexOf(k[0] + roleIndex) == -1) {
															noNeedStr = noNeedStr.concat(k[0] + roleIndex)
														}
														console.log('职责【' + key + '】数量已经超过预设值，在招募队员时，称号会体现出拒绝【' + key + '】职责')
													} else {
														throw new Error('错误，cga.role.battleRoleArr中未储存职责:', key)
													}
												}
												continue
											} else {
												statObj[key].sum += value
											}

											if (value < statObj[key].min) {
												statObj[key].min = value
											}
											if (value < cusObj.check[k].min) {
												reason = '队员【' + i + '】key【' + key + '】value【' + value + '】低于每人最低值【' + cusObj.check[k].min + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue

											}
											if (value > statObj[key].max) {
												statObj[key].max = value

											}
											if (value > cusObj.check[k].max) {
												reason = '队员【' + i + '】key【' + key + '】value【' + value + '】高于每人最高值【' + cusObj.check[k].max + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
										} else {
											// 初始化，sum为全队持有总和，min为每人最低持有数量，max为每人最高持有数量
											// 先检查数值是否合格
											if (cusObj.check[k].sum != -1 && value > cusObj.check[k].sum) {
												reason = '当前key【' + key + '】总和【' + statObj[key].sum + '】由于队员【' + i + '】的value【' + value + '】加入，已超出全队总和阈值【' + cusObj.check[k].sum + '】，将此队员加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
											if (value < cusObj.check[k].min) {
												reason = '队员【' + i + '】key【' + key + '】value【' + value + '】低于每人最低值【' + cusObj.check[k].min + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue

											}
											if (value > cusObj.check[k].max) {
												reason = '队员【' + i + '】key【' + key + '】value【' + value + '】高于每人最高值【' + cusObj.check[k].max + '】加入黑名单'
												console.log(reason)
												blacklist[i] = Date.now()
												continue
											}
											// 都合格就初始化
											statObj[key] = {
												sum: value,
												min: value,
												max: value,
											}
										}
									}
								}
							}
							if (!hasFoundKey) {
								reason = '队员【' + i + '】统计信息【' + j + '】不包含key【' + key + '】'
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
						console.log('检测到有其他司机【' + leader.unit_name + '】在等待拼车，暂时停止招人，' + randomTime / 1000 + '秒后重新判断..')
						// 挂上标记，队员才能识别队长
						if (cga.GetPlayerInfo().nick.indexOf(leaderFilter) != -1) {
							console.log('去掉leaderFilter，防止队员进入')
							cga.ChangeNickName('')
						}
						setTimeout(wait, randomTime);
						return
					}
					// 招募队员的称号，如果有需要的职责，则与!拼接，形成类似'bus!r0r1'的称号，告知不需要某种职业。
					// 如果没有不需要的职责，则退化成leaderFilter
					let hc = noNeedStr == '' ? leaderFilter : leaderFilter.concat('!').concat(noNeedStr)

					// 挂上标记，队员才能识别队长。设置延迟，防止其他称号覆盖
					if (cga.GetPlayerInfo().nick != hc) {
						setTimeout(() => {
							cga.ChangeNickName(hc)
						}, 2000);
					}

					cga.waitTeammatesWithFilter(nameFilter, memberCnt, (r) => {
						if (r) {
							share(memberCnt, Object.keys(checkObj), (shareInfoObj) => {
								// 如果共享信息时有人离队
								if (shareInfoObj === false) {
									setTimeout(wait, 1000);
									return
								}
								// 检查完之后，黑名单会有所更新
								check(shareInfoObj, cusObj)
								let kickArr = Object.keys(blacklist)
								// 提取黑名单中的玩家名称，交给踢人API
								if (kickArr.length) {
									setTimeout(() => {
										cga.kickPlayer(kickArr, wait)
									}, 1000);
									return
								} else {// 如果都合格，则退出此API
									// 防止shareinfo的speaker又把称号刷掉
									setTimeout(cga.ChangeNickName, 2000, doneNick)
									// 防止小号还没有检测队长是否done，队长那边已经把队伍解散了
									console.log('队伍合格，队员组成:', shareInfoObj.teammates)
									setTimeout(cb, leaerKickMeTimeout + 2000, shareInfoObj)
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
			} else {
				var retry = (cb) => {
					let teamplayers = cga.getTeamPlayers();
					if (teamplayers.length) {
						share(memberCnt, Object.keys(checkObj), (shareInfoObj) => {
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
							cga.waitSysMsgTimeout((err, sysMsg) => {
								console.log('cga.waitSysMsgTimeout返回err:', err)
								if (err && !sysMsg) {
									console.log('队长没有踢自己，判断队伍是否合格..')
									let teamplayers = cga.getTeamPlayers();
									// 队伍合格
									if (teamplayers.length && teamplayers[0].nick == doneNick) {
										console.log('队长判定队伍合格，将称号置为和队长一致，并调用cb，结束此API。')
										cga.ChangeNickName(doneNick)
										cb(shareInfoObj)
									} else {// 队伍不合格，重新进入retry
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
								if (matchObj != null) {
									blacklist[matchObj[1]] = Date.now()
									console.log('队长【' + matchObj[1] + '】将自己踢出，' + blacklistTimeout / 1000 + '秒之内不再加入其队伍')
									setTimeout(retry, 1000, cb);
									return false
								}
								console.log('cga.waitSysMsgTimeout返回true，继续监听..')
								return true
							}, leaerKickMeTimeout)// 监控队长是否踢自己，如果被踢则将队长加入黑名单，一段时间之内不再加入其队伍
							return
						})
						return
					} else {
						let curTime = Date.now()
						var leader = cga.findPlayerUnit((u) => {
							if (blacklist.hasOwnProperty(u.unit_name)) {
								let remain = (blacklistTimeout - (curTime - blacklist[u.unit_name])) / 1000
								if (remain > 0) {
									console.log('由于不满足队长【' + u.unit_name + '】的队伍配置要求，暂时离队。' + remain + '秒内不能加入【', u.unit_name, '】队伍')
								} else {
									console.log('队长【' + u.unit_name + '】的黑名单时间已到，可以重新加入队伍')
									delete blacklist[u.unit_name]
								}
							}
							if (
								(u.xpos == leaderPos[0] && u.ypos == leaderPos[1])
								&& (!leaderFilter || u.nick_name.indexOf(leaderFilter) != -1)
								&& ((!blacklist.hasOwnProperty(u.unit_name) || (curTime - blacklist[u.unit_name] > blacklistTimeout)))
							) {
								// 由于(curTime - blacklist[u.unit_name] > blacklistTimeout)，判定为黑名单已超时，所以将不能加入队伍的黑名单中，去掉该队长的名字。
								delete blacklist[u.unit_name]
								// 检查一下队长是否有不需要的职责，看看是不是自己。如果是，则不加入此队。
								let matchObj = u.nick_name.match(noNeedExp)
								if (matchObj) {
									let scriptConfigObj = cga.LoadScriptConfigFile()
									let roleIndex = cga.role.battleRoleArr.indexOf(scriptConfigObj.roleObj.role)
									if (matchObj[0].indexOf('r' + roleIndex) != -1) {
										console.log('队长【' + u.unit_name + '】' + '不需要自己的职责【' + scriptConfigObj.roleObj.role + '】，放弃加入队伍。')
										return false
									}
								}

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
		muster(isLeader, leaderPos, mainLogic)
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
		if (!teammates)
			teammates = cga.getTeamPlayers()
		if (!teammates.length) {
			// console.log('没有队员，退出cga.waitTeammateReady，回调参数传入null')
			func((res) => {
				setTimeout(cb, 1000, res);
			})
			return
		}
		// 用英语首字母zjfma代表0、1、2、3、4。其中z是zero首字母，jfma是1234月份首字母
		const identifier = ["z", "j", "f", "m", "a"]
		// 正则匹配类似z01jok这种字符，每3个一组。
		// 例：z01就是队长数值为"01"，jok就是第2个队员数值为"ok"
		const reg = new RegExp(/[zjfma]{1}[oknu\d]{2}/g)
		// 获取人物原来自定义昵称，函数结束时，需要恢复
		var playerInfo = cga.GetPlayerInfo()
		const originNick = playerInfo.nick

		var teammate_info = {};
		cga.isTeamLeader = (teammates[0].name == playerInfo.name || teammates.length == 0) ? true : false;

		var check = (funcValue, cb) => {
			var listen = true

			// 注意这里是刷新队内状态，一切以cga.waitTeammateReady传入的teammates为验证数据的基础。
			// 因为可能在验证期间，有非teammates的角色（如：其他玩家）错加入队伍。
			var curTeamplayers = cga.getTeamPlayers()
			// 如果人数与预期不符，则等待
			if (teammates.length != curTeamplayers.length) {
				console.warn('队内玩家数量与预期玩家数量不符，清空数据记录情况')
				teammate_info = {}
				setTimeout(check, 1000, funcValue, cb);
				return
			}

			for (let t = 0; t < curTeamplayers.length; t++) {
				// 以自己在队内的序号来拼接类似z01j02的自定义称号
				let tmpNick = identifier[t] + funcValue
				if (curTeamplayers[t].is_me) {
					if (curTeamplayers[t].nick != tmpNick) {
						cga.ChangeNickName(tmpNick)
						console.log("更改nickname:【" + tmpNick + "】")
					}
					// 更新自己的实时数据
					teammate_info[identifier[t]] = isNaN(parseInt(funcValue)) ? funcValue : parseInt(funcValue)
					continue
				}

				var memberNick = curTeamplayers[t].nick
				if (!memberNick) {
					continue
				}
				memberNick = memberNick.match(reg)
				if (!memberNick) {
					continue
				}

				memberNick.forEach((n) => {
					// 如果解析的3位字符串不以zjfma为开头，则跳过
					if (identifier.indexOf(n[0]) == -1)
						return
					let v = n.slice(1, 3)
					v = isNaN(parseInt(v)) ? v : parseInt(v)
					teammate_info[n[0]] = v
				})
			}
			// 为true则持续监听
			listen = cb(teammate_info)
			if (listen == true)
				setTimeout(check, 1000, funcValue, cb);
		}

		func((funcValue) => {
			// 数值验证以及格式处理
			if (typeof funcValue == 'number') {
				if (parseInt(funcValue, 10) != funcValue) {
					throw new Error('错误，必须输入3位以下整数或字符串')
				} else if (funcValue >= 0 && funcValue < 10) {
					funcValue = "0" + funcValue.toString()
				} else if (funcValue >= 10 && funcValue < 100) {
					funcValue = funcValue.toString()
				} else {
					throw new Error('错误，必须输入3位以下整数或字符串')
				}
			} else if (typeof funcValue == 'string' && funcValue.length != 2) {
				throw new Error('错误，必须输入3位以下整数或字符串')
			}
			if (!funcValue.match(new RegExp(/[oknu\d]{2}/g))) {
				throw new Error('错误，必须输入3位以下整数或"ok"，"no"，"un"3种字符串')
			}

			check(funcValue, (result) => {
				// 验证完整性，通过了才能进行回调
				if (Object.keys(result).length == teammates.length) {
					// 翻译数据，将数字的String转换为int传给cb
					var obj = {}
					const identifier = { "z": 0, "j": 1, "f": 2, "m": 3, "a": 4 }
					var teamplayers = cga.getTeamPlayers()
					Object.keys(result).forEach(k => {
						obj[teamplayers[identifier[k]].name] = result[k]
					})
					// 恢复人物原本称号
					console.log('2.5秒后恢复称号..')
					setTimeout(() => {
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
	 * @param {Array} npcpos NPC坐标
	 * @param {String | Number | Object} obj 参数对象，包含诸多规定输入值，具体如下：
	 * obj格式以及各个key的功能：
	 * obj.waitLocation : 目标NPC所处的地图，在组队时必须传入。因为队长需要走至此地图，而队员只需等待队长将自己带到此地图。
	 * obj.npcpos : 目标NPC所处的坐标，必须传入。
	 * obj.act : 与NPC交互的动作目的。有item，msg，map等几种种类型可选：
		item: 找NPC拿道具，物品栏出现此道具则调用cb，函数结束
		msg: 找NPC对话，直至NPC出现此msg的内容，调用cb，函数结束
		map: 找NPC对话，直至人物被传送至此地图，调用cb，函数结束
		skill: 找NPC对话，直至人物学习完技能或学习失败，调用cb，函数结束
		forget: 找NPC对话，直至人物忘记技能，调用cb，函数结束
		job: 找NPC对话，直至人物就职或转职，调用cb，函数结束
		promote: 找NPC对话，直至人物职业晋级，调用cb，函数结束
		battle: 找NPC对话进入战斗，直至战斗完毕，调用cb，函数结束
	 * obj.target : obj.act的目标，根据obj.act的不同，有几种情况：
		obj.act为item时，obj.target输入item的名称或数字itemid
		obj.act为msg时，obj.target输入监测NPC说话的内容切片
		obj.act为map时，obj.target输入地图的名称或index
		obj.act为skill时，obj.target输入想学的技能名称
		obj.act为forget时，obj.target输入想忘记的技能名称
		obj.act为job时，obj.target输入想就职的职业称号，可以输入任意职业阶级的称号，如【见习弓箭手】【王宫弓箭手】均指代【弓箭手】这一职业。
		obj.act为promote时，obj.target输入目标阶级数字。0：0转，见习。1：1转，正阶。2：2转，王宫。3：3转，师范。4：4转，大师。5：5转，最终阶段。
		obj.act为battle时，obj.target输入Object，包含：
			1、battle:'与NPC战斗时使用的战斗配置文件名'
			2、normal:'不与NPC战斗时使用的战斗配置文件名'
			例如：{battle:'手动BOSS',normal:'练级'}
	 * [obj.neg] : 可选选项，如果与NPC说话，某句话想要选【否】【取消】等消极选项，obj.neg需要输入那句话的切片。
		比如，如果想在NPC问【你愿意吗？】的时候回答【否】，那么obj.neg可以输入"愿意"、"你愿意吗"等切片
	 * [obj.pos] : 可选选项，2维int型数组。仅在obj.act = "map"时生效，人物需要等待被NPC传送至pos这个坐标，函数才结束
	 * [obj.say] : 可选选项，string类型。人物会在与NPC交互的时候说话，因为有的NPC是需要说出对应的话才会有反应的
	 * [obj.notalk] : 可选选项，function类型。自定义函数，如果不想让某个条件的队员与NPC对话，在此函数返回true。
	 * 比如，长老之证的阴影，如果持有7个队员与阴影正在对话时，其它队员同时与阴影对话的话，自己的对话框会被挤掉。
	 * 将长老之证的少于7的人return true，即可实现让其不与NPC对话。可以减少互相覆盖的概率。
	 * 
	 * 【开发提醒】由于宠物学习技能时的【是】【否】界面属于特殊弹窗，cga.AsyncWaitNPCDialog无法捕获，故这里没有宠物相关功能的实现。
	 * 更新，有空可以参考cga.parsePetSkillStoreMsg制作
	 * @param {*} cb 回调函数，在obj.act不为map时，调用时会传入队伍全员信息
	 * @returns 
	 */
	cga.askNpcForObj = (obj, cb) => {
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
		if (Object.prototype.toString.call(obj) != '[object Object]') {
			throw new Error('参数obj必须为object类型')
		}
		if (obj.hasOwnProperty('waitLocation') && typeof obj.waitLocation != 'string' && typeof obj.waitLocation != 'number') {
			throw new Error('obj.map必须为String或Number类型')
		}
		if (obj.hasOwnProperty('notalk') && typeof obj.notalk != 'function') {
			throw new Error('obj.notalk必须为function类型')
		}
		if (obj.hasOwnProperty('npcpos') && (!Array.isArray(obj.npcpos) || obj.npcpos.length != 2)) {
			throw new Error('obj.npcpos如果传入，必须为Int型数组，长度为2')
		}
		if (typeof obj != 'object' || !obj.hasOwnProperty("act") || !obj.hasOwnProperty("target")) {
			throw new Error('obj格式有误，见API注释')
		}
		if (obj.act == 'job' && (typeof obj.target != 'string')) {
			throw new Error('obj.act为job时，obj.target必须为string类型的职业统称。')
		}
		if (obj.act == 'promote' && (typeof obj.target != 'number')) {
			throw new Error('obj.act为promote时，obj.target必须为int类型的职业level。')
		}
		if ((obj.act == 'skill' || obj.act == 'forget') && (typeof obj.target != 'string')) {
			throw new Error('obj.act为skill或forget时，obj.target必须为string类型的技能名称。')
		}
		if (['buy', 'sell', 'exchange', 'appraisal'].indexOf(obj.act) != -1) {
			if (Object.prototype.toString.call(obj.target) != '[object Object]') {
				throw new Error('obj.act为buy、sell、exchange或appraisal时，obj.target必须为Object类型。')
			}
			/**
			 * 检查value，必须为Number类型。如果为-1，则视为该物品买至包满/全部卖出。buy、exchange如果需要使用-1模式，只允许指定1个商品。否则会有歧义（不能在买满/全部兑换多个商品的前提下继续买/兑换别的商品）。
			 *  */
			let objLength = Object.keys(obj.target).length
			Object.entries(obj.target).forEach(function ([key, value]) {
				if (typeof value != 'number') {
					throw new Error('obj.act为buy、sell、exchange或appraisal时，key :' + key + '的value必须为Number。')
				}
				// 购买和兑换模式只允许一个商品可以使用-1值。
				if (['buy', 'exchange'].indexOf(obj.act) != -1 && value == -1 && objLength > 1) {
					throw new Error('obj.act为buy或exchange时，只能指定唯一一个商品的value为-1。否则会有歧义。')
				}
			});
		}
		if (obj.hasOwnProperty("pos") && (!Array.isArray(obj.pos) || obj.pos.length != 2)) {
			throw new Error('obj.pos格式必须为长度为2的Number数组')
		}
		if (obj.hasOwnProperty("say") && (typeof obj.say != 'string' || obj.say.length == 0)) {
			throw new Error('obj.say格式必须为长度大于0的字符串')
		}
		if (obj.hasOwnProperty("battle") && Object.prototype.toString.call(obj.target) != '[object Object]') {
			throw new Error('obj.act为battle时，obj.target必须为Object，包含战斗前后的战斗配置文件名。具体格式见API注释')
		}
		if (obj.act == 'function' && typeof obj.target != 'function') {
			throw new Error('obj.act为function时，obj.target必须为function()')
		}

		// 如果是学技能，判断技能栏剩余数和金币剩余数是否充足
		if (obj.hasOwnProperty('skill')) {
			let reason = cga.skill.ableToLearn(obj.target)
			if (reason.indexOf('slot') != -1) {
				throw new Error('技能栏位不足')
			} else if (reason.indexOf('gold') != -1) {
				throw new Error('学习技能金币不足')
			}
		}

		// 如果此flag为false，则终止重复和NPC对话
		let repeatFlag = true
		// 如果是与npc说话，则turnto只需要一次
		let turnToFlag = true
		// console打印信息的防刷屏flag
		let mute = false

		const dialogHandler = (err, dlg) => {
			var actNumber = -1
			if (dlg && dlg.options == 0) {
				// 转职、晋级确认画面，需要消耗一定数量的金币，选项：【好的】(cga.ClickNPCDialog(0, 0))，【算了】cga.ClickNPCDialog(0, 1)
				// UNAecho:已经确定，无论是转职还是晋级，options都是0，type都是2。
				if (dlg.type == 2) {
					actNumber = 0
					cga.ClickNPCDialog(0, actNumber);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
				/**	
				 * 买、卖商店类NPC的第1步对话框
				 * 商店类NPC的对话有2步，第1步是选择交易类型，第2步才是商店界面
				 * 但第1步可能有2种情况:
				 * 1、里堡卖魔石商店老板，或者营地、雪拉威森塔的全都卖老板，选项只有一个【卖】
				 * 2、里堡门口的桥头武器、防具老板，既能买，又能卖
				 * 仅通过dlg的属性(options=0,type=5,dialog_id=333)无法判别这两种情况
				 * 需要使用dlg.message的最后一位String类型数字来判断是哪一种商店:
				 * 1、如果dlg.message的最后一位String类型数字=2，则代表只有卖【卖】的商店
				 * 2、如果dlg.message的最后一位String类型数字=3，则代表【买】【卖】均有的商店
				 */
				else if (dlg.type == 5) {
					let numOpt = dlg.message.charAt(dlg.message.length - 1);
					// 所有的【买】和numOpt == '2'类商店的【卖】均为第1项
					if ((obj.act == 'buy' && numOpt == '3') || (obj.act == 'sell' && numOpt == '2')) {
						actNumber = 0
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					} else if (obj.act == 'sell' && numOpt == '3') {
						actNumber = 1
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
				}
				/**	
				 * 购买商店的第2步对话框
				*/
				else if (dlg.type == 6) {
					let store = cga.parseStoreMsg(dlg);
					// cga.parseStoreMsg()的items初始化为[]，不会为null
					let items = store.items.filter((it) => {
						return obj.target.hasOwnProperty(it.name)
					})
					if (items.length == 0) {
						cb(new Error('商店没有目标物品，请检查输入的obj.target对象是否有误。key必须为商品名称，value必须为购买数量'));
						return;
					}

					// 购买数组
					let buyArr = []
					// 检查空闲格子与金币是否足够
					let needGold = 0
					let needSlotCount = 0
					// log打印使用
					let logStr = '购买'

					let emptySlotCount = cga.getInventoryEmptySlotCount()
					let curGold = cga.GetPlayerInfo().gold

					// 如果只有1种商品能购买
					if (items.length == 1) {
						let it = items[0]
						let itemCount = 0
						// 全购买模式，将背包买满
						if (obj.target[it.name] == -1) {
							itemCount = emptySlotCount * it.maxcount
							needGold = it.price * itemCount
							needSlotCount = emptySlotCount
						} else {// 指定数量模式
							itemCount = obj.target[it.name]
							needGold = it.price * itemCount
							needSlotCount = Math.ceil(itemCount / it.maxcount)
						}

						buyArr.push({ index: it.index, count: itemCount })
						logStr += '【' + it.name + '】' + itemCount + '个，'
					} else {// 购买多种商品
						items.forEach((it) => {
							needGold += it.price * obj.target[it.name]
							needSlotCount += Math.ceil(obj.target[it.name] / it.maxcount)
							buyArr.push({ index: it.index, count: obj.target[it.name] })

							logStr += '【' + it.name + '】' + obj.target[it.name] + '个，'
						})
					}
					logStr += '需要【' + needSlotCount + '】格【' + needGold + '】金币。'
					if (needSlotCount > emptySlotCount || needGold > curGold) {
						logStr += '条件不满足，请检查空闲格子数量或金币是否充足。'
						cb(new Error(logStr));
						return
					}

					console.log(logStr)
					// 底层C++封装的购买API
					cga.BuyNPCStore(buyArr);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('谢谢') >= 0) {
							cb('购买完毕');
							return;
						} else {
							cb(new Error('购买失败，可能是网络不好导致的对话超时'));
							return;
						}
					});
				}
				/**	
				 * 售卖商店的第2步对话框
				 * 不论第1步对话框是2类还是3类商店，售卖商店的第2步对话框都是一样的
				 * 【注意】售卖Array中，必须要有物品id，否则底层API cga.SellNPCStore()不会生效。
				 */
				else if (dlg.type == 7) {
					let store = cga.parseStoreMsg(dlg);
					// 身上魔币
					let curGold = cga.GetPlayerInfo().gold;
					// 售卖所得魔币
					let sellGold = 0
					// log打印使用
					let logStr = '售卖'

					let sellArray = []
					store.items.forEach((it) => {
						if (obj.target.hasOwnProperty(it.name) && it.sell_group > 0) {
							let item = cga.GetItemInfo(it.pos)
							let sellCnt = obj.target[it.name] == -1 ? it.sell_group : Math.floor(Math.min(obj.target[it.name], it.count) / it.sell_unit_count)
							sellArray.push({
								itempos: it.pos,
								itemid: item.itemid,
								// -1模式就全卖，其他数量模式则最大限度卖要求的数量。如果obj.target[it.name]的数量大于持有的数量，以持有数量为准。
								count: sellCnt,
							});
							sellGold += sellCnt
							logStr += '【' + it.name + '】' + sellCnt + '个，'
						}
					})

					logStr += '共收入【' + sellGold + '】金币。'
					// 如果背包装不下钱，则报错
					if (curGold + sellGold > 1000000) {
						logStr += '条件不满足，请检查卖完商品后，魔币大于1000000。'
						cb(new Error(logStr));
						return
					}

					console.log(logStr)
					cga.SellNPCStore(sellArray);
					cga.AsyncWaitNPCDialog(() => {
						cb('售卖完毕');
					});
					return
				}
				/**
				 * 列表对话，多数用于学技能NPC的第一句话：
				 * 1、想学习技能
				 * 2、想遗忘技能
				 * 3、不用了
				 */
				else if (dlg.type == 16) {
					if (obj.act == 'skill') {
						actNumber = 0
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					} else if (obj.act == 'forget') {
						actNumber = 1
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
				} else if (dlg.type == 18) {// 从dlg.options == 0 && dlg.type == 16跳转进来。遗忘技能的详细栏，选择index直接进入确定界面
					var skillIndex = cga.GetSkillsInfo().sort((a, b) => a.pos - b.pos).findIndex(s => s.name == obj.target);
					actNumber = skillIndex
					cga.ClickNPCDialog(0, actNumber);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
				/**	
				 * 鉴定商店对话框，没有类似买卖、交易的第1步窗口，对话直接进入商店鉴定窗口（如法兰城凯蒂夫人的店）
				 *   type: 20,options: 0,dialog_id: 337,
				 * 鉴定商品由于不能堆叠，所以value的数量填什么都行。
				 */
				else if (dlg.type == 20) {
					let store = cga.parseStoreMsg(dlg);
					// 身上魔币
					let curGold = cga.GetPlayerInfo().gold;
					// 鉴定所需魔币
					let needGold = 0
					// log打印使用
					let logStr = '鉴定'

					let appraisalArray = []
					store.items.forEach((it) => {
						if (obj.target.hasOwnProperty(it.name)) {
							let item = cga.GetItemInfo(it.pos)
							let cost = it.cost
							appraisalArray.push({
								itempos: it.pos,
								itemid: item.itemid,
								// 未鉴定物品数量只能为1
								count: 1,
							});
							needGold += cost
							logStr += '【' + it.name + '】，'
						}
					})

					logStr += '需要【' + needGold + '】金币。'
					// 如果背包装不下钱，则报错
					if (needGold > curGold) {
						logStr += '条件不满足，请检查是否有足够魔币支付鉴定费用。'
						cb(new Error(logStr));
						return
					}
					console.log(logStr)
					cga.SellNPCStore(appraisalArray);
					cga.AsyncWaitNPCDialog(() => {
						cb('鉴定完毕');
					});
					return
				}
				/**	
				 * 物品兑换商店第1步对话框
				 *   type: 27,options: 0,dialog_id: 344,
				 */
				else if (dlg.type == 27) {
					actNumber = 0
					cga.ClickNPCDialog(0, actNumber);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
				/**	
				 * 物品兑换商店第2步对话框
				 *   type: 28,options: 0,dialog_id: 345,
				 * 【注意】兑换商店，obj.target中value为兑换的组数，而非商品的堆叠数。因为每个商店无法得知兑换比例。
				 */
				else if (dlg.type == 28) {
					let store = cga.parseStoreMsg(dlg);
					// cga.parseStoreMsg()的items初始化为[]，不会为null
					let items = store.items.filter((it) => {
						return obj.target.hasOwnProperty(it.name)
					})
					if (items.length == 0) {
						cb(new Error('商店没有目标物品，请检查输入的obj.target对象是否有误。key必须为商品名称，value必须为兑换件数'));
						return;
					}

					// 该兑换商店所需要的原料物品名称。如铜条商店的铜，曙光骑士团医院2楼的蕃茄
					let currency = store.currency
					// 持有的原料数量
					let currencyCnt = cga.getItemCount(currency)
					// 本次兑换需要的原料数量。兑换商店似乎会自动处理物品栏满的情况，暂时不对格子进行逻辑处理。
					let needCurrency = 0
					// log打印使用
					let logStr = '兑换'

					let exchangeArr = []
					// 如果只有1种商品能兑换
					if (items.length == 1) {
						let it = items[0]
						let itemCount = 0
						// 全兑换模式，将所有材料换完。
						if (obj.target[it.name] == -1) {
							itemCount = Math.floor(currencyCnt / it.exchange_unit_count)
							needCurrency = itemCount * it.exchange_unit_count
						} else {// 指定数量模式，如果输入数量超过兑换能力，则最大限度兑换。
							itemCount = Math.min(obj.target[it.name], Math.floor(currencyCnt / it.exchange_unit_count))
							needCurrency = itemCount * it.exchange_unit_count
						}

						exchangeArr.push({ index: it.index, count: itemCount })
						logStr += '【' + it.name + '】' + itemCount + '单位，'
					} else {// 兑换多种商品TODO未开发完
						items.forEach((it) => {
							needCurrency += obj.target[it.name] * it.exchange_unit_count
							exchangeArr.push({ index: it.index, count: obj.target[it.name] })

							logStr += '【' + it.name + '】' + obj.target[it.name] + '个，'
						})
					}
					logStr += '需要【' + needCurrency + '】个【' + currency + '】。'
					if (needCurrency > currencyCnt) {
						logStr += '条件不满足，请检查是否持有充足的原料。'
						cb(new Error(logStr));
						return
					}

					console.log(logStr)
					// 底层C++封装的购买API
					cga.BuyNPCStore(exchangeArr);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						cb('兑换完毕');
						return;
					});
				}
			}
			else if (dlg && dlg.options == 1) {
				cga.ClickNPCDialog(1, 0);
				if (obj.act == "msg" && dlg.message.indexOf(obj.target) != -1) {
					repeatFlag = false
					return
				} else if (obj.act == "skill" && cga.findPlayerSkill(obj.target)) {
					repeatFlag = false
					return
				} else if (obj.act == "forget" && !cga.findPlayerSkill(obj.target)) {
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if (dlg && dlg.options == 2) {
				// 职业导师对话列表，就职、转职、晋级
				if (dlg.type == 2) {
					let curJobObj = cga.job.getJob()
					// 就职
					if (obj.act == 'job') {
						if (curJobObj.curJob == '游民') {
							actNumber = 0
							cga.ClickNPCDialog(0, actNumber);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						} else {// 转职
							// 如果战斗系转战斗系没有转职保证书，则禁止转职。防止声望归零
							let targetJobObj = cga.job.getJob(obj.target)
							if (!targetJobObj) {
								throw new Error('目标职业【' + obj.target + '】不存在数据库中')
							} else if (curJobObj.jobType == '战斗系' && targetJobObj.jobType == '战斗系' && cga.getItemCount('转职保证书') == 0) {
								throw new Error('你是战斗系转战斗系，但背包里没有【转职保证书】')
							}
							actNumber = 1
							cga.ClickNPCDialog(0, actNumber);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}
					}
					else if (obj.act == 'promote') {
						actNumber = 2
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
					else if (obj.act == 'forget') {
						console.log('进入' + obj.act)
						actNumber = 1
						cga.ClickNPCDialog(0, actNumber);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
				}
				// 从dlg.options == 0 && dlg.type == 16跳转进来。学习技能的详细栏，cga.ClickNPCDialog(0, 0)直接学习，cga.ClickNPCDialog(-1, 0)取消
				else if (dlg.type == 17) {
					actNumber = 0
					cga.ClickNPCDialog(actNumber, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
			}
			else if (dlg && dlg.options == 3) {
				actNumber = (obj.hasOwnProperty("neg") && dlg.message.indexOf(obj.neg) != -1) ? 2 : 1
				cga.ClickNPCDialog(actNumber, 0);
				if (obj.act == "msg" && dlg.message.indexOf(obj.target) != -1) {
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if (dlg && ((dlg.options & 4) == 4 || dlg.options == 12)) {
				actNumber = (obj.hasOwnProperty("neg") && dlg.message.indexOf(obj.neg) != -1) ? 8 : 4
				cga.ClickNPCDialog(actNumber, 0);
				if (obj.act == "msg" && dlg.message.indexOf(obj.target) != -1) {
					repeatFlag = false
					return
				}
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			else if (dlg && (dlg.options & 32) == 32) {
				cga.ClickNPCDialog(32, 0);
				cga.AsyncWaitNPCDialog(dialogHandler);
				return;
			}
			return
		}
		// 取消此逻辑，如果背包已满，则人物会卡在与npc对话中，由玩家自行手动处理背包
		// // 为任务物品清理背包中的魔石 
		// let dropStoneForMissionItem = (item)=>{
		// 	// 持续递归，直至背包中存在目标任务物品才结束
		// 	if(cga.findItem(item) == -1){
		// 		let inventory = cga.getInventoryItems();
		// 		let stone = cga.findItem('魔石');
		// 		if(inventory.length == 20 && stone == -1){
		// 			throw new Error('错误，请手动清理物品，否则任务无法继续')
		// 		}
		// 		if(inventory.length >= 18){
		// 			console.log('物品大于18个，开始搜索背包中的魔石并丢弃..')
		// 			if(stone != -1){
		// 				console.log('丢弃魔石..')
		// 				cga.DropItem(stone);
		// 			}
		// 			setTimeout(dropStoneForMissionItem, 1000);
		// 		}
		// 	}
		// }

		let checkBattleFailed = () => {
			let teamplayers = cga.getTeamPlayers()
			// 如果是单人，并且血量已经是1，判断战斗失败
			if (!teamplayers.length) {
				return cga.GetPlayerInfo().hp == 1
			}
			// 如果是组队的情况，sum所有血量为1的队友，如果sum等于队员数，则判断战斗失败
			let failCnt = 0
			for (let i = 0; i < teamplayers.length; i++) {
				if (teamplayers[i].maxhp > 0 && teamplayers[i].hp == 1) {
					failCnt++
					console.log('队员', teamplayers[i].name, '体力为1')
				}
			}

			return failCnt == teamplayers.length
		}

		let askAndCheck = (npcpos, cb) => {
			// 监测与NPC对话是否有战斗
			let battleFlag = false

			let retry = (cb) => {
				// 地图判断的时候，可能涉及到BOSS战的切图，这里加入cga.isInNormalState()，等战斗结束再判断
				if (!cga.isInNormalState()) {
					battleFlag = true
					setTimeout(retry, 1000, cb);
					return
				}
				// 如果判断已经完成此次API的逻辑，进入调用cb环节
				if (!repeatFlag) {
					// 如果是就职或者转职，晋级任务的状态需要重置。但战斗系5转和UD则不用，一生做一次即可全程有效
					if (obj.act == 'job') {
						cga.refreshMissonStatus({
							"树精长老": false,
							"挑战神兽": false,
							"诅咒的迷宫": false,
							"誓言之花": false,
							"咖哩任务": false,
							"起司的任务": false,
							"魔法大学": false,
						}, () => {
							// 调用cb，API结束
							cb("ok")
						})
						return
					}
					// 如果是战斗，则需要恢复normal战斗配置
					if (obj.act == "battle") {
						cga.loadBattleConfig(obj.target.normal)
					}
					// 调用cb，API结束
					cb("ok")
					return
				}
				if (obj.act == "item" && cga.findItem(obj.target) != -1) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "map" && (obj.target == cga.GetMapName() || obj.target == cga.GetMapIndex().index3) && (!obj.pos || (cga.GetMapXY().x == obj.pos[0] && cga.GetMapXY().y == obj.pos[1]))) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "skill" && (cga.findPlayerSkill(obj.target))) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "forget" && (!cga.findPlayerSkill(obj.target))) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "job" && cga.job.getJob(obj.target).job == cga.job.getJob().job) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "promote" && cga.job.getJob().jobLv >= obj.target) {
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "battle" && battleFlag) {// 如果是战斗，并且战斗flag已经置为true。由于逻辑走到这里已经是非战斗状态，那么battleFlag=true则代表已经战斗完毕。
					repeatFlag = false
					setTimeout(retry, 1000, cb);
					return
				} else if (obj.act == "function") {// 自定义function，拥有最高自由度。
					obj.target((r) => {
						if (r === false) {
							repeatFlag = false
						}
						setTimeout(retry, 1000, cb);
					})
					return
				}

				// 自定义与NPC交谈的内容
				if (obj.say) {
					if (turnToFlag) {
						cga.turnTo(npcpos[0], npcpos[1])
						turnToFlag = false
					}
					setTimeout(() => {
						cga.SayWords(obj.say, 0, 3, 1);
					}, 500);
				} else {
					// 如果传入了notalk函数，return true的情况下不与NPC对话，只监测结果。
					if (obj.hasOwnProperty('notalk') && obj.notalk()) {
						console.log('notalk函数不允许自己与NPC对话..')
					} else {
						if (battleFlag && checkBattleFailed()) {
							cga.gui.LoadScript({
								autorestart: false,
							}, (err, result) => {
								throw new Error('战斗失败，全队血量为1，请检查队伍整体战斗力，或战斗配置。安全起见，终止自动重启脚本。')
							})
							throw new Error('战斗失败，全队血量为1，请检查队伍整体战斗力，或战斗配置。安全起见，终止自动重启脚本。')
						}
						// 有时候，队长还没在NPC面前调整好位置，队员先与NPC对话直接令全队地图改变了，导致队长walklist报错。这里加一个与NPC对话的小延迟。
						setTimeout(() => {
							cga.turnTo(npcpos[0], npcpos[1])
						}, cga.getTeamPlayers().length ? 1500 : 0);
					}
				}

				// 打开与NPC互动的API
				cga.AsyncWaitNPCDialog(dialogHandler);

				// 商店类行为不需要retry循环，1次即可完成逻辑(dialogHandler会执行完整的商店逻辑)
				if (!['buy', 'sell', 'exchange', 'appraisal'].includes(obj.act)) {
					setTimeout(retry, 4000, cb);
				}
				return
			}

			// 如果目标是map，切换地图会导致人物离队，其他队员无法通过称号监测到你的完成情况，故用其他逻辑代替
			// 如果目标是技能相关，则无需组队，可单人完成逻辑
			if (obj.act == "map" || obj.act == "skill" || obj.act == "forget" || obj.act == "job" || obj.act == "promote") {
				// 注意：map模式没有人物队内监测，所以不会有队内消息在cb中被返回。item、msg模式则有
				retry(cb)
				return
			} else {// item、msg等模式不离队，依旧用waitTeammateReady

				// 不再自动清理背包，改为由玩家手动清理
				// // 为任务物品留位置，如果obj.target为func，会导致cga.findItem(obj.target)将obj.target当作item的filter函数来遍历所有道具。
				// // 如果需要清理道具，请在obj.target直接写逻辑
				// if(obj.act != 'function'){
				// 	dropStoneForMissionItem(obj.target)
				// }

				/**
				 * UNAecho:这里逻辑比较绕，说明一下。
				 * 1、cga.waitTeammateReady()首先等待至ready，并调用其第二个参数func，这个func就包含了retry()逻辑。
				 * 2、retry(cb2)会反复进行，直至调用cb2并return
				 * 3、cb2其实是cga.waitTeammateReady()调用第二个参数时传入的callback。
				 * 4、也就是retry()中，调用cb2就是在执行cga.waitTeammateReady()传入的callback。
				 * 5、这个callback实际上就是调用cga.waitTeammateReady()时，传入的第三个参数cb。在这里，直接就代表了API的出口cb
				 * 6、调用此出口cb，结束API。并返回一个参数r，传给askNpcForObj()的调用方。
				 */
				cga.waitTeammateReady(null, (cb2) => {
					// 与NPC互动前，如果是战斗，则需要读取battle战斗配置
					if (obj.act == "battle") {
						cga.loadBattleConfig(obj.target.battle)
					}
					retry(cb2)
				}, (r) => {
					// 此API出口
					console.log("🚀 ~ file: cgaapi.js:11711 ~ cga.waitTeammateReady~ cb:", 'API出口')
					cb(r)
					return
				})
			}
		}

		let go = (cb) => {

			// 队员等待函数，因为队员需要等待队长把自己带到obj.waitLocation地图中，再执行逻辑
			let memberWait = (cb) => {
				let waitObj = {}
				if (typeof obj.waitLocation == 'string') {
					waitObj.mapname = obj.waitLocation
				} else if (typeof obj.waitLocation == 'number') {
					waitObj.mapindex = obj.waitLocation
				} else {
					if (!isLeader()) {
						throw new Error('此次是组队模式，必须传入队员等待专用的waitLocation值，否则队员行为会发生异常')
					}
				}

				cga.waitForLocation(waitObj, () => {
					console.log('检测到队长已经带队至NPC目标地图..')
					cb(null)
				})
				return
			}
			// 判断此次act是否需要特殊走路引导，如就职、学技能等
			let tmpObj = null
			if (obj.act == 'job') {
				tmpObj = cga.job.getJob(obj.target)
			} else if (obj.act == 'promote') {
				tmpObj = cga.job.getJob()
			} else if (obj.act == 'skill') {
				tmpObj = cga.skill.getSkill(obj.target)
			} else {// 如果没有特殊走路引导，进入队长队员判断
				// 队长带队
				if (isLeader()) {
					walkToNPC(obj.npcpos, cb)
					return
				}
				// 队员等待队长带队至指定地图
				memberWait(() => {
					walkToNPC(obj.npcpos, cb)
				})
				return
			}

			if (cga.needSupplyInitial({}) && cga.travel.isInVillage()) {
				console.log('当前在城镇，并且需要补充状态。')
				cga.travel.toHospital(() => {
					setTimeout(go, 3000, cb);
				})
				return
			}

			// 常用的可传送村镇
			const teleVillages = ['圣拉鲁卡村', '伊尔村', '亚留特村', '维诺亚村', '奇利村', '加纳村', '杰诺瓦镇', '阿巴尼斯村', '蒂娜村']

			let startFunc = null
			let walkFunc = null
			let searchFunc = null

			// 首先装载登出起点函数
			if (tmpObj.npcMainMap == '法兰城') {
				startFunc = (cb) => {
					cga.travel.falan.toStone('C', cb)
				}
			} else if (teleVillages.indexOf(tmpObj.npcMainMap) != -1) {
				startFunc = (cb) => {
					cga.travel.toVillage(tmpObj.npcMainMap, cb)
				}
			} else if (tmpObj.npcMainMap == '曙光骑士团营地') {
				startFunc = (cb) => {
					if (cga.travel.switchMainMap() == '曙光骑士团营地') {
						cb(null)
					} else {
						cga.travel.falan.toCamp(cb, true)
					}
				}
			} else if (tmpObj.npcMainMap == '圣骑士营地') {
				startFunc = (cb) => {
					if (cga.travel.switchMainMap() == '圣骑士营地') {
						cb(null)
					} else {
						cga.travel.falan.toCamp(cb)
					}
				}
			} else if (tmpObj.npcMainMap == '其它') {// 无法通过走路直接抵达的地图，startFunc执行跳过。如：只有做任务才能抵达。
				console.log('其它地图需要自定义如何寻路')
				startFunc = (cb) => {
					cb(null)
				}
			} else {
				throw new Error('API未支持的npcMainMap领域【' + tmpObj.npcMainMap + '】请联系作者https://github.com/UNAecho更新')
			}

			// 其次装载赶往NPC地图的函数
			// 咒术师相关。
			// 注意：如果你不携带咒术师推荐信，跟门童小孩对话，进入的是15011房间，这个房间的职业导师只是一个普通NPC，没有职业功能。对话会让你做咒术师就职任务
			// 如果持有咒术师推荐信，则进入正常的15012职业导师房间
			if (tmpObj.npcMap >= 15009 && tmpObj.npcMap <= 15012) {
				walkFunc = (cb) => {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88, '芙蕾雅'],
					], () => {
						cga.askNpcForObj({ act: 'map', target: 15000, npcpos: [201, 165] }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
							], () => {
								cga.askNpcForObj({ act: 'map', target: 15006, say: '咒术', npcpos: [31, 22] }, () => {
									cga.walkList([
										[38, 37, '咒术师的秘密住处'],
										[10, 0, 15008],
									], () => {
										// 职业相关
										if (tmpObj.npcMap == 15012) {
											cga.askNpcForObj({ act: 'map', target: 15012, npcpos: [11, 0] }, cb)
											return
										}
										// 技能相关
										let roomWalkList = null
										if (tmpObj.npcMap == 15010) {// 强力咒术魔法相关
											roomWalkList = [1, 10, 15010]
										} else {// 抗性技能相关
											roomWalkList = [19, 10, 15009]
										}
										cga.walkList([
											roomWalkList,
										], cb);
									});
								})
							});
						})
					})
				}
			} else if (tmpObj.npcMap == 100) {// 芙蕾雅全域
				walkFunc = (cb) => {
					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88, '芙蕾雅'],
					], cb)
				}
			} else if (tmpObj.npcMap == 23603) {// 格斗士
				walkFunc = (cb) => {
					cga.travel.autopilot('东门', () => {
						cga.walkList([
							[318, 336],// 防止走路在石头中卡住
							[356, 334, '角笛大风穴'],
							[133, 26, '索奇亚'],
							[380, 324, 23600],
						], () => {
							let obj = { act: 'map', target: tmpObj.npcMap, npcpos: [23, 23] }
							cga.askNpcForObj(obj, cb)
						})
					})
				}
			} else if (tmpObj.npcMap == '小村正之洞窟') {// 铸剑工、武器修理工
				walkFunc = (cb) => {
					cga.travel.autopilot('西门', () => {
						cga.walkList([
							[446, 101, '小村正之洞窟'],
						], cb)
					})
				}
			} else if (tmpObj.npcMap == '小备前之洞窟') {// 铠甲工、防具修理工
				walkFunc = (cb) => {
					cga.travel.autopilot('南门', () => {
						cga.walkList([
							[421, 308, '小备前之洞窟'],
						], cb)
					})
				}
			} else if (tmpObj.npcMap == 27015) {// 教团骑士，由于肯吉罗岛相关的地图很多都是一个mapindex多个房间，这里自定义一下func
				walkFunc = (cb) => {
					cga.travel.autopilot(27015, () => {
						let XY = cga.GetMapXY()
						if (XY.x < 15) {
							cb(null)
						} else if (XY.x >= 15 && XY.x < 85) {
							cga.walkList([
								[69, 70, '曙光营地指挥部', 85, 3],
							], () => {
								walkFunc(cb)
							})
						} else {
							cga.askNpcForObj({
								act: 'map',
								target: 27015,
								npcpos: [97, 14],
								pos: [11, 0],
							}, () => {
								walkFunc(cb)
							})
						}
					})
				}
			} else if (tmpObj.npcMap == 3351 || tmpObj.npcMap == 3354) {// 攻击吸收/魔法吸收。在露比战斗胜利房间才能执行
				walkFunc = (cb) => {
					cga.askNpcForObj({
						act: 'map',
						target: tmpObj.npcMap,
						npcpos: tmpObj.npcMap == 3351 ? [22, 16] : [25, 16],
					}, cb)
				}
			} else if (tmpObj.npcMap == 3352 || tmpObj.npcMap == 3353) {// 巫师职业导师房间、洁净魔法/恢复魔法房间
				walkFunc = (cb) => {
					if (cga.job.getJob().job != '巫师') {
						throw new Error('冯奴的家只有巫师职业才可以学习洁净、恢复魔法')
					}
					cga.travel.autopilot('东门', () => {
						cga.walkList([
							[349, 261, 3350]
						], () => {
							cga.askNpcForObj({
								act: 'map',
								target: tmpObj.npcMap,
								npcpos: tmpObj.npcMap == 3352 ? [14, 1] : [11, 14],
							}, cb)
						});
					})
				}
			} else {
				walkFunc = (cb) => {
					cga.travel.autopilot(tmpObj.npcMap, cb)
				}
			}

			// 然后装载NPC寻找函数，因为某些NPC出现位置不是固定的，例如狩猎技能NPC猎人拉修
			if (tmpObj.npcpos instanceof Array) {
				searchFunc = (cb) => {
					cb(tmpObj.npcpos)
				}
			} else if (tmpObj.name == '狩猎') {
				searchFunc = (cb) => {
					let npc = cga.findNPC('猎人拉修')
					if (npc) {
						cb([npc.xpos, npc.ypos])
						return
					} else {
						if (!isLeader()) {
							setTimeout(searchFunc, 1000, cb);
							return
						}
						let ranX = Math.trunc(Math.random() * (500 - 472) + 472)
						let ranY = Math.trunc(Math.random() * (220 - 198) + 198)
						let target = cga.getRandomSpace(ranX, ranY);
						cga.walkList([
							target,
						], () => {
							searchFunc(cb)
						});
					}
				}
			} else {
				throw new Error('API未支持的npcpos领域【' + tmpObj.npcpos + '】请联系作者https://github.com/UNAecho更新')
			}

			// 制作好3种导航函数之后，顺序执行
			// 但要区分是队长还是队员

			if (isLeader()) {
				// 曙光骑士团营地（27015）是新地图结构，不能跳过赶路模块。
				if (cga.isInMap(tmpObj.npcMap) && tmpObj.npcMainMap != '曙光骑士团营地') {
					console.log('已经在目标地图，跳过赶路模块')
					searchFunc((npcpos) => {
						walkToNPC(npcpos, cb)
					})
					return
				}
				startFunc(() => {
					walkFunc(() => {
						searchFunc((npcpos) => {
							walkToNPC(npcpos, cb)
						})
					})
				})
			} else {
				memberWait(() => {
					searchFunc((npcpos) => {
						walkToNPC(npcpos, cb)
					})
				})
			}
		}

		let walkToNPC = (npcpos, cb) => {
			// 如果NPC周围只有1格空闲地形，改用cga.getRandomSpace
			let spaceList = null
			try {
				spaceList = cga.get2RandomSpace(npcpos[0], npcpos[1])
			} catch (error) {
				if (error.message.indexOf('只有一格') != -1) {
					spaceList = cga.getRandomSpace(npcpos[0], npcpos[1])
				} else {
					throw new Error('未知错误,error:' + error)
				}
			}
			// 如果NPC周围1x1均无法抵达，尝试检测隔墙的空闲位置，例如驯兽师导师
			if (spaceList === null) {
				// console.log('NPC pos:',npcpos,'，周围1x1均无法抵达，尝试检测隔墙的空闲位置，例如驯兽师导师')
				spaceList = cga.getRandomSpaceThroughWall(npcpos[0], npcpos[1])
			}

			let carryTeamToPosArr = (npcpos, arr1, arr2, leaveteam, cb) => {
				let tmpArr = []
				// 如果是组队，把队员都拉到NPC周围
				if (isLeader()) {
					// 单人或者队长最终站位
					tmpArr.push(arr1)
					/**
					 * 如果是队长，并且在带队，那么需要把队友拉到NPC周围
					 * 由于类似UD传送水晶，队长在水晶附近走来回走的次数较少，导致队员会小概率被甩到NPC1x1以外的位置
					 * 这里多加一些队长在NPC1x1内来回走的逻辑，使队员平稳落在NPC1x1内的位置
					 */
					let curTeamplayers = cga.getTeamPlayers()
					if (curTeamplayers.length) {
						tmpArr.push(arr2)
						tmpArr.push(arr1)
						tmpArr.push(arr2)
						tmpArr.push(arr1)
						tmpArr.push(arr2)
						tmpArr.push(arr1)
					}
					cga.walkList(tmpArr, () => {
						// 如果队长带队，走到NPC附近要稍微顿一下再与NPC对话。
						// 防止队员的cga.waitForLocation没等走到NPC附近执行cb，队长这边已经对话完毕并切换地图了，导致队员直接卡在cga.waitForLocation中，无法调用cb。
						setTimeout(() => {
							if (leaveteam) {
								cga.disbandTeam(() => {
									askAndCheck(npcpos, cb)
								})
								return
							}
							askAndCheck(npcpos, cb)
						}, curTeamplayers.length ? 1500 : 0)
					});
				} else {// 如果是队员
					// 如果需要NPC周围只有1格，需要解散队伍后自行走至NPC面前
					if (leaveteam) {
						console.log('NPC周围只有1格，需要等待队长解散队伍..')
						tmpArr.push(arr1)
						cga.disbandTeam(() => {
							cga.walkList(tmpArr, () => {
								askAndCheck(npcpos, cb)
							});
						})
						return
					}
					cga.waitForLocation({ pos: [npcpos[0], npcpos[1]] }, () => {
						askAndCheck(npcpos, cb)
					})
				}
			}
			// 如果是队员：目标NPC的附近无法抵达，可能是有墙阻隔。需要等待队长将自己带至无阻隔位置，再继续逻辑。
			// 如果是队长：不处理，后续代码会抛出异常。因为队长必须有逻辑支持他抵达NPC附近，否则逻辑无法进行
			if (!isLeader() && spaceList === null) {
				if (!mute) {
					console.log('你是队员，且NPC', npcpos, '无法抵达。等待队长将自己带至可抵达NPC的位置再继续逻辑..')
					mute = true
				}
				setTimeout(walkToNPC, 1000, npcpos, cb);
				return
			}

			// NPC周围只有1格可站立。cga.getRandomSpace返回是1维数组，cga.get2RandomSpace返回是2维数组
			if (typeof spaceList[0] == 'number') {
				console.log('NPC周围只有1格，改为cga.getRandomSpace来计算。')
				/**
				 * UNAecho: 这里考虑到类似海底说【咒术】的透明NPC周围仅有1格可站立，且组队的情况。
				 * 逻辑是：如果NPC周围只有1格，那么这1格必有另外1格可站立，否则此格无法抵达。
				 * 队长先使用NPC周围仅存的1格来获取另外1格空闲格子，使用此空闲格子+NPC周围空闲格子做成walklist，这样减少了队员离队自行走路的危险性。
				 * 由于NPC周围只有1格可站立，部分队员无法在不离队的情况下与NPC对话。所以这里要考虑队员离队与NPC对话的做法。
				 */
				let spaceList2 = cga.getRandomSpace(spaceList[0], spaceList[1])
				// 如果是对话战斗的情况，不要离开队伍。例如战斗系五转的隐秘之洞最底层BOSS处，BOSS周围只有1格，但不可以解散队伍。
				// 如果不是战斗，则离开或解散队伍。例如去咒术导师处，海里洞窟里与透明NPC对话说【咒术】那里
				carryTeamToPosArr(npcpos, spaceList, spaceList2, (obj.act == 'battle' ? false : true), cb)
			} else if (spaceList[0] instanceof Array) {// 正常情况，NPC周围有2格或以上可站立
				carryTeamToPosArr(npcpos, spaceList[0], spaceList[1], false, cb)
			}

		}

		// 实时判断是否为队长
		let isLeader = () => {
			let playerInfo = cga.GetPlayerInfo();
			let teamplayers = cga.getTeamPlayers();
			return ((teamplayers.length && teamplayers[0].name == playerInfo.name) || teamplayers.length == 0)
		}

		go(cb)
		return
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
		if (typeof map != 'string' && typeof map != 'number') {
			throw new Error('map必须为String或Number类型')
		}
		if (!Array.isArray(bossPos) || bossPos.length != 2) {
			throw new Error('bossPos必须为Int型数组，长度为2')
		}

		var prepare = () => {
			cga.waitTeammateReady(null, (r) => {
				prepareFunc(r)
				return
			}, (r) => {
				console.log('全队准备完毕，等待5秒队员复原称号后执行回调..')
				setTimeout(() => {
					cb(r)
				}, 5000);
				return
			})
		}

		let mapName = cga.GetMapName();
		let mapIndex = cga.GetMapIndex().index3;

		if (typeof map == 'string') {
			if (map != mapName) {
				// console.log("等待地图:", map)
				setTimeout(cga.prepareToBattle, 1500, map, bossPos, prepareFunc, cb);
				return
			}
		} else if (typeof map == 'number') {
			if (map != mapIndex) {
				// console.log("等待地图:", map)
				setTimeout(cga.prepareToBattle, 1500, map, bossPos, prepareFunc, cb);
				return
			}
		} else {
			throw new Error('map对象必须为String或Number类型')
		}

		var playerInfo = cga.GetPlayerInfo();
		var teamplayers = cga.getTeamPlayers();
		cga.isTeamLeader = ((teamplayers.length && teamplayers[0].name == playerInfo.name) || teamplayers.length == 0) ? true : false;

		if (cga.isTeamLeader) {
			var tmpPos = cga.get2RandomSpace(bossPos[0], bossPos[1])
			let tmpArr = [tmpPos[0]]
			if (teamplayers.length) {
				tmpArr.push(tmpPos[1])
				tmpArr.push(tmpPos[0])
				tmpArr.push(tmpPos[1])
				tmpArr.push(tmpPos[0])
			}
			cga.walkList(tmpArr, prepare);
		} else {
			cga.waitForLocation({ pos: bossPos }, prepare)
		}
	}

	//把队友带至posArray指定的位置
	cga.walkTeammateToPosition = (posArray, cb) => {

		console.log('cga.walkTeammateToPosition stage1');

		if (cga.getTeamPlayers().length == 0) {
			cb(null);
			return;
		}

		var index = 0;

		var walk = () => {
			console.log('cga.walkTeammateToPosition walk');

			cga.AsyncWalkTo(posArray[index][0], posArray[index][1], null, null, null, checkTeammateAtPosition);
		}

		var checkTeammateAtPosition = (err) => {

			console.log('checkTeammateAtPosition 0');

			if (!cga.isInNormalState()) {
				console.log('checkTeammateAtPosition 1');
				setTimeout(checkTeammateAtPosition, 1000);
				return;
			}

			var teamplayers = cga.getTeamPlayers();
			var someoneNotInPosArray = false;
			for (var i in teamplayers) {
				var isInPosArray = false;
				for (var j in posArray) {
					if (teamplayers[i].xpos == posArray[j][0] && teamplayers[i].ypos == posArray[j][1]) {
						isInPosArray = true;
						break;
					}
				}

				if (!isInPosArray) {
					someoneNotInPosArray = true;
					break;
				}
			}

			if (someoneNotInPosArray) {
				console.log('someoneNotInPosArray');

				index++;
				if (index > posArray.length - 1)
					index = 0;
				walk();
				return;
			}

			cga.waitForChatInput((msg, val) => {
				if (msg.indexOf('遇敌防卡住') >= 0) {
					//restart the walk procedure
					if (!cga.isInNormalState()) {
						console.log('waitForChatInput 0');
						setTimeout(checkTeammateAtPosition, 1000);
					}
					else {
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
		if (!teamplayers.length) {
			console.log('队伍已经解散，退出cga.checkTeamAllDone..')
			setTimeout(cb, 1000);
			return
		}
		for (let i = 0; i < teamplayers.length; i++) {
			if (teamplayers[i].nick != doneNick) {
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
		if (!teamplayers.length) {
			setTimeout(cb, 1000);
			return
		}
		var isTeamLeader = teamplayers.length > 0 && teamplayers[0].is_me == true ? true : false;
		if (isTeamLeader) {
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
	cga.dialogHandler = () => {
		var dialogHandler = (err, dlg) => {
			if (dlg) {
				if ((dlg.options & 4) == 4) {
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				} else if ((dlg.options & 32) == 32) {
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				} else if (dlg.options == 1) {
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				} else if (dlg.options == 3) {
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				} else if (dlg.options == 12) {
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
	cga.waitForChatInput = (cb) => {
		cga.waitTeammateSay((player, msg) => {

			if (player.is_me == true) {
				var pattern_number = /^[1-9]\d*$|^0$/;

				if (cb(msg, pattern_number.test(msg) ? parseInt(msg) : null) == false)
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
	cga.waitSysMsg = (cb) => {
		cga.AsyncWaitChatMsg((err, r) => {
			if (!r || r.unitid != -1) {
				cga.waitSysMsg(cb);
				return;
			}

			listen = cb(r.msg);

			if (listen == true)
				cga.waitSysMsg(cb);
		}, 1000);
	}

	/**
	 * UNAecho: 此API有一个潜在bug，会出现明明有timeout的前提下，不会超时，导致程序一直阻塞。
	 * 猜测是底层API:cga.AsyncWaitChatMsg的超时实现有bug。
	 * 经过测试，超时时间在大于等于4000毫秒的时候，会出现非常严重的不稳定情况，4000毫秒时可能会等待20000毫秒才会超时，甚至更长。
	 * 
	 * 【注意】由于看不到cga.AsyncWaitChatMsg的源码，请慎用此API
	 * @param {*} cb 
	 * @param {*} timeout 
	 */
	cga.waitSysMsgTimeout = (cb, timeout) => {
		cga.AsyncWaitChatMsg((err, r) => {

			if (err) {
				// console.log('cga.waitSysMsgTimeout超时，如果cb(err)不为true，则结束监听。')
				listen = cb(err);

				if (listen == true)
					cga.waitSysMsgTimeout(cb, timeout);

				return;
			}

			if (!r || r.unitid != -1) {
				cga.waitSysMsgTimeout(cb, timeout);
				return;
			}

			listen = cb(null, r.msg);

			if (listen == true)
				cga.waitSysMsgTimeout(cb, timeout);

		}, timeout);
	}

	/**
	 * UNAecho: 维持深蓝药剂生效，如果药剂吃完了，则回调error
	 * 系统提示信息：
	 * 1、使用:[使用了香水：深蓝九号！]
	 * 2、失效:[道具的效果消失了。]
	 * 3、持续期间遇敌:[感觉到魔族的气息，但是却看不到踪影。]
	 * 
	 * 【注意】此API使用的香水：深蓝九号(itemid:18526)，是魔法大学任务NPC交回鉴定师所鉴定出来的道具，并非药剂师做出来的道具。
	 * 获取方式：药剂师制作香水：深蓝九号，去魔法大学进入考场，将香水：深蓝九号交给考官。考官返回【药？】鉴定后成为此API所需的香水：深蓝九号(itemid:18526)
	 * 
	 * 【BUG记录】
	 * 1、如果吃深蓝的一瞬间遇敌，那么其实是没有吃成功的，此时API将会陷入无限监听，不会再次触发的死循环。
	 * TODO 可能需要根据使用的系统消息【使用了香水：深蓝九号！】来判断道具是否使用成功
	 * @param {*} cb 
	 */
	cga.keepDeepBlueEffect = (cb) => {
		/**
		 * 由于cga.waitSysMsg无法主动关闭，必须依赖监听到系统消息才能触发cb逻辑，这里设置一个flag来实现间接关闭此API。
		 * 原理是当loopFlag=false时，只要人物登出、站街等任何触发系统提示的时候，cga.waitSysMsg触发cb，然后根据loopFlag结束监听。
		 */
		let loopFlag = true

		let useItem = () => {
			let pos = cga.findItem(18526)
			if (pos == -1) {
				loopFlag = false
				cb(new Error('[香水：深蓝九号]已耗尽，请补充'))
				return
			}
			setTimeout(() => {
				cga.UseItem(pos);
			}, 1000)
			return
		}

		// 持续监听
		cga.waitSysMsg((msg) => {
			if (loopFlag == false) {
				console.log('cga.keepDeepBlueEffect()结束监听..')
				return false
			}
			if (msg && msg.indexOf('道具的效果消失了') != -1) {
				useItem()
			}
			return true
		})

		// 首次进入API，先使用1个香水：深蓝九号
		useItem()
		return
	}

	//发送超长聊天信息
	cga.sayLongWords = (words, color, range, size) => {

		console.log(words);

		var splitCount = words.length / 100;
		if (splitCount == 0)
			splitCount = 1;

		for (var i = 0; i < splitCount; ++i) {
			cga.SayWords(words.substring(i * 100, i * 100 + 100), color, range, size);
		}
	}

	//监听登录状态
	cga.waitConnState = (cb) => {
		cga.AsyncWaitConnectionState((err, r) => {
			if (err) {
				cga.waitConnState(cb);
				return;
			}

			if (cb(r) == true)
				cga.waitSysMsg(cb);
		}, 10000);
	}

	/*等待到达某位置，无超时时间限制

		等待到达民家(14,10)，如果解散了队伍则自动走到(13,10)处：
			cga.waitForLocation({mapname : '民家', pos : [14, 10], leaveteam : true, walkto : [13, 10]}, cb);

		等待到达地图索引号为24074的地图的(21,12)处：
			cga.waitForLocation({mapindex: 24074, pos:[21, 12] }, cb);
	*/
	cga.waitForLocation = (obj, cb) => {
		var name = cga.GetMapName();
		var fpos = cga.GetMapXYFloat();
		var index = cga.GetMapIndex().index3;

		var passCheck = true;

		if (typeof obj.mapname == 'string') {
			if (name != obj.mapname) {
				passCheck = false;
			}
		}
		if (typeof obj.mapindex == 'number') {
			if (index != obj.mapindex) {
				passCheck = false;
			}
		}

		if (obj.moving !== true && !(parseInt(fpos.x) % 64 == 0 && parseInt(fpos.y) % 64 == 0)) {
			passCheck = false;
		}

		if (obj.pos instanceof Array) {
			/**
			 * UNA注:这里的算法是计算队员是否走到指定坐标obj.pos的周围处。仅限周围1格以内passCheck为true，超出1格，则passCheck依然为false
			 * */
			if (!(Math.abs(fpos.x - obj.pos[0] * 64.0) < 1.001 * 64.0 && Math.abs(fpos.y - obj.pos[1] * 64.0) < 1.001 * 64.0)) {
				passCheck = false;
			}
		}

		if (obj.leaveteam === true) {
			var teamplayersnow = cga.getTeamPlayers();

			if (teamplayersnow.length) {
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
			if (passCheck && obj.walkto && !teamplayersnow.length && (index == obj.mapindex || name == obj.mapname)) {
				cga.WalkTo(obj.walkto[0], obj.walkto[1]);
			}
		}

		if (obj.desired_teamplayers != undefined) {
			var teamplayersnow = cga.getTeamPlayers();

			if (teamplayersnow.length < obj.desired_teamplayers.length) {
				cb(new Error('当前队伍人数 ' + teamplayersnow.length + ' 小于预期值 ' + obj.desired_teamplayers.length + ', 可能队伍已解散，取消等待。'));
				return;
			}
		}

		if (passCheck) {
			cb(null);
			return;
		}

		setTimeout(cga.waitForLocation, 1000, obj, cb);
	}

	/*等待到达某位置，无超时时间限制
		和cga.waitForLocation一样，只是可以等待多个位置，只要满足其中一个就能触发回调。
	*/
	cga.waitForMultipleLocation = (arr) => {
		var name = cga.GetMapName();
		var fpos = cga.GetMapXYFloat();
		var index = cga.GetMapIndex().index3;

		for (var i = 0; i < arr.length; ++i) {
			var obj = arr[i];

			var passCheck = true;

			if (typeof obj.mapname == 'string') {
				if (name != obj.mapname) {
					passCheck = false;
				}
			}
			if (typeof obj.mapindex == 'number') {
				if (index != obj.mapindex) {
					passCheck = false;
				}
			}
			if (obj.moving !== true && !(parseInt(fpos.x) % 64 == 0 && parseInt(fpos.y) % 64 == 0)) {
				passCheck = false;
			}

			if (obj.pos instanceof Array) {
				if (!(Math.abs(fpos.x - obj.pos[0] * 64.0) < 1.001 * 64.0 && Math.abs(fpos.y - obj.pos[1] * 64.0) < 1.001 * 64.0)) {
					passCheck = false;
				}
			}

			if (obj.leaveteam === true) {
				var teamplayersnow = cga.getTeamPlayers();

				if (teamplayersnow.length)
					passCheck = false;

				if (!passCheck && obj.walkto && !teamplayersnow.length && (index == obj.mapindex || name == obj.mapname)) {
					cga.WalkTo(obj.walkto[0], obj.walkto[1]);
				}
			}

			if (passCheck) {
				if (obj.cb(null) == true)
					return;
			}
		}

		if (obj.desired_teamplayers != undefined) {
			var teamplayersnow = cga.getTeamPlayers();

			if (teamplayersnow.length < obj.desired_teamplayers.length) {
				if (obj.cb(new Error('当前队伍人数 ' + teamplayersnow.length + ' 小于预期值 ' + obj.desired_teamplayers.length + ', 可能队伍已解散，取消等待。')) == true)
					return;
			}
		}

		setTimeout(cga.waitForMultipleLocation, 1000, arr);
	}

	/**
	 * UNAecho:一个简单的等待地图切换API
	 * @param {String|Number} map 地图切片名称或地图index。
	 * 例1：想等待进入诅咒之迷宫地下1楼，输入任意切片名称，可输入【诅咒】【之迷宫】【1楼】等等。
	 * 例2：想等待进入某个index，输入任意int型index，参见cga.GetMapIndex().index3。
	 * 因为简单，且无超时时间，调用时请注意
	 * @param {*} cb 
	 */
	cga.waitForMap = (map, cb) => {
		if (typeof map == 'string' && cga.GetMapName().indexOf(map) >= 0) {
			console.log('cga.waitForMap:已抵达名字带有【', map, '】的地图')
			cb('ok')
			return
		} else if (typeof map == 'number' && cga.GetMapIndex().index3 == map) {
			console.log('cga.waitForMap:已抵达index【', map, '】的地图')
			cb('ok')
			return
		}
		setTimeout(cga.waitForMap, 1500, map, cb);
	}

	/**
	 * UNAecho:一个简单的地图判断封装，判断角色是否在当前地图中
	 * @param {String|Number} map 地图名称或地图index。
	 * @param {Boolean} fuzzy 是否模糊查询，map为String时生效。例如：诅咒之迷宫，输入【诅咒】或者【迷宫】也返回true。
	 */
	cga.isInMap = (map, fuzzy = false) => {
		if (typeof map == 'string') {
			let curMap = cga.GetMapName()
			if (fuzzy && curMap.indexOf(map) != -1) {
				console.log('cga.isInMap:已在【', map, '】地图中')
				return true
			} else if (curMap == map) {
				console.log('cga.isInMap:已在【', map, '】地图中')
				return true
			}
			return false
		} else if (typeof map == 'number' && cga.GetMapIndex().index3 == map) {
			console.log('cga.isInMap:已在mapindex【', map, '】地图中')
			return true
		}
		return false
	}

	/**
	 * UNAecho : 视野距离，多数用于人物探索地图。取人物对目标坐标的2条垂线距离最大值
	 * projection : n. 预测;推断;设想;投射;放映;投影;放映的影像;投影图;突起物;（嗓音或声音的）发送，传送，放开;（思想感情的）体现，形象化
	 * @param {number} x 起始X坐标
	 * @param {number} y 起始Y坐标
	 * @param {number} targetX 目标X坐标
	 * @param {number} targetY 目标Y坐标
	 * @returns
	 */
	cga.projectDistance = (x, y, targetX, targetY) => {
		return Math.max(Math.abs(targetX - x), Math.abs(targetY - y));
	}

	/**
	 * UNAecho : 曼哈顿距离
	 * @param {number} x 起始X坐标
	 * @param {number} y 起始Y坐标
	 * @param {number} targetX 目标X坐标
	 * @param {number} targetY 目标Y坐标
	 * @returns
	 */
	cga.manhattanDistance = (x, y, targetX, targetY) => {
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
	cga.chebyshevDistance = (x, y, targetX, targetY) => {
		return Math.max(Math.abs(targetX - x), Math.abs(targetY - y))
	}

	cga.cachedMapTileMatrix = null;
	cga.cachedMapTileMatrixTime = 0;

	cga.buildMapTileMatrix = () => {
		var curtime = (new Date()).getTime();
		if (1 || cga.cachedMapTileMatrix == null || curtime > cga.cachedMapTileMatrixTime + 200) {
			var wall = cga.GetMapTileTable(true);
			var matrix = [];
			for (var y = 0; y < wall.y_size; ++y) {
				if (!matrix[y])
					matrix[y] = [];
				for (var x = 0; x < wall.x_size; ++x) {
					matrix[y][x] = wall.cell[x + y * wall.x_size];
				}
			}

			cga.cachedMapTileMatrix = curtime;
			cga.cachedMapTileMatrix = { matrix: matrix, x_bottom: wall.x_bottom, y_bottom: wall.y_bottom, x_size: wall.x_size, y_size: wall.y_size };
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

	cga.buildMapCollisionRawMatrix = () => {
		var curtime = (new Date()).getTime();
		if (1 || cga.cachedMapCollisionRawMatrix == null || curtime > cga.cachedMapCollisionRawMatrixTime + 200) {
			var wall = cga.GetMapCollisionTableRaw(true);
			var matrix = [];
			for (var y = 0; y < wall.y_size; ++y) {
				if (!matrix[y])
					matrix[y] = [];
				for (var x = 0; x < wall.x_size; ++x) {
					matrix[y][x] = wall.cell[x + y * wall.x_size];
				}
			}

			cga.cachedMapCollisionRawMatrixTime = curtime;
			cga.cachedMapCollisionRawMatrix = { matrix: matrix, x_bottom: wall.x_bottom, y_bottom: wall.y_bottom, x_size: wall.x_size, y_size: wall.y_size };
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
	cga.buildMapCollisionMatrix = (exitIsBlocked) => {
		var curtime = (new Date()).getTime();
		if (1 || cga.cachedMapCollisionMatrix == null || curtime > cga.cachedMapCollisionMatrixTime + 200) {
			var wall = cga.GetMapCollisionTable(true);
			var objs = null;
			if (exitIsBlocked == true)
				objs = cga.GetMapObjectTable(true);
			var matrix = [];
			for (var y = 0; y < wall.y_size; ++y) {
				if (!matrix[y])
					matrix[y] = [];
				for (var x = 0; x < wall.x_size; ++x) {
					matrix[y][x] = wall.cell[x + y * wall.x_size] == 1 ? 1 : 0;
					if (exitIsBlocked == true) {
						if (objs.cell[x + y * objs.x_size] & 0xff) {
							matrix[y][x] = 1;
						}
					}
				}
			}

			cga.cachedMapCollisionMatrixTime = curtime;
			cga.cachedMapCollisionMatrix = { matrix: matrix, x_bottom: wall.x_bottom, y_bottom: wall.y_bottom, x_size: wall.x_size, y_size: wall.y_size };
		}

		return cga.cachedMapCollisionMatrix;
	}

	cga.cachedMapObjectMatrix = null;
	cga.cachedMapObjectMatrixTime = 0;

	cga.buildMapObjectMatrix = () => {
		var curtime = (new Date()).getTime();
		if (1 || cga.cachedMapObjectMatrix == null || curtime > cga.cachedMapObjectMatrixTime + 200) {
			var wall = cga.GetMapObjectTable(true);
			var matrix = [];
			for (var y = 0; y < wall.y_size; ++y) {
				if (!matrix[y])
					matrix[y] = [];
				for (var x = 0; x < wall.x_size; ++x) {
					matrix[y][x] = wall.cell[x + y * wall.x_size] & 0xff;
				}
			}

			cga.cachedMapObjectMatrixTime = curtime;
			cga.cachedMapObjectMatrix = { matrix: matrix, x_bottom: wall.x_bottom, y_bottom: wall.y_bottom, x_size: wall.x_size, y_size: wall.y_size };
		}

		return cga.cachedMapObjectMatrix;
	}

	cga.cachedMapObjects = null;
	cga.cachedMapObjectsTime = 0;

	cga.getMapObjects = (load_all = true) => {
		var curtime = (new Date()).getTime();
		if (1 || cga.cachedMapObjects == null || curtime > cga.cachedMapObjectsTime + 200) {
			var wall = cga.GetMapObjectTable(load_all);
			var objs = [];
			for (var y = 0; y < wall.y_size; ++y) {
				for (var x = 0; x < wall.x_size; ++x) {
					if ((wall.cell[x + y * wall.x_size] & 0xff) != 0)
						objs.push({
							x: x,
							y: y,
							mapx: x + wall.x_bottom,
							mapy: y + wall.y_bottom,
							cell: wall.cell[x + y * wall.x_size] & 0xff,
							rawcell: wall.cell[x + y * wall.x_size]
						});
				}
			}

			cga.cachedMapObjectsTime = curtime;
			cga.cachedMapObjects = objs;
		}

		return cga.cachedMapObjects;
	}

	//搜索玩家单位
	cga.findPlayerUnit = (filter) => {
		var found = cga.GetMapUnits().find((u) => {
			return u.valid == 2 && u.type == 8 && (u.flags & 256) == 256 && ((typeof filter == 'function' && filter(u)) || (typeof filter == 'string' && filter == u.unit_name));
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
	 * 
	 * 部分属性解释：
	 * name: 迷宫名称，需要与cga.mazeInfo的key保持一致。
	 * entryMap: 迷宫入口水晶所在的地图，如诅咒的迷宫所在的地图是芙蕾雅
	 * exitMap:迷宫出口所在地图，如布满青苔的洞窟出口是叹息之森林（树精长老任务相关）
	 * posList:迷宫入口所在水晶的推荐检测坐标，如诅咒的迷宫出现的位置是随机的，可以自定义几个坐标，让脚本遍历走这几个位置去寻找水晶
	 * 走到这些位置，脚本会自动检索附近的入口水晶 TODO：如果出现多个迷宫的入口水晶，可能会进错，需要添加类似五转地洞那里的黑名单规则
	 * xLimit:迷宫出现位置的x范围，坐标0对应的值是x的下限，1是上限
	 * yLimit:迷宫出现位置的y范围，坐标0对应的值是y的下限，1是上限
	 * prefix:迷宫楼层的名称前缀，所有迷宫前缀+楼层+后缀。以诅咒的迷宫举例，前缀为【诅咒之迷宫地下】。【注意】许多API都是利用前缀来判断角色当前在哪个迷宫里。
	 * suffix:迷宫楼层的名称后缀，所有迷宫前缀+楼层+后缀。以诅咒的迷宫举例，后缀为【楼】
	 * forwardEntryTile:在cga.buildMapCollisionRawMatrix()及其同类API中，其属性matrix矩阵对应的xy数值。此数值代表迷宫中的楼梯功能是楼层+1
	 * backEntryTile:同forwardEntryTile，只不过此值对应的是楼层-1
	 * 
	 * tile:迷宫地板数据的大致取值范围，数据采集来自cga.buildMapTileMatrix()。数据为Array格式。如【奇怪的洞窟】的pictureTile为[7845,7997]
	 * 因为部分迷宫，如4个隐秘之洞，仅靠地图名字无法得知是哪一个迷宫，需要靠地板的图像数据来分辨是哪一个迷宫。
	 * 
	 * 此数据可由CGA的【玩家信息】选项卡中的【显示游戏内文本】快捷查看。
	 * 我们以里谢里雅堡[30,92]的石狮子单位数据说明：
	 * （30，92）[13AA,1,28A0,C000]
	 * 此数据采集的是【鼠标指向】地板的数据，而非人物所在地板的数据。
	 * 前面括号代表鼠标指向的坐标，后面的数组每一个代表：
	 * 1、第0位13AA，就是tile的16进制数据；
	 * 2、第1位1，0代表不可通行，1可通行；猜测为cga.buildMapCollisionMatrix()的colraw值
	 * 3、第2位28A0，在cga.buildMapCollisionRawMatrix()的colraw16进制数值。也就是forwardEntryTile和backEntryTile的16进制数值
	 * 4、第3位一直为C000或C100，暂时不知道是什么数据。但是传送水晶为C003，猜测为cell值
	 * 
	 * backTopPosList:迷宫出口水晶所在的坐标，用于返回迷宫。如黑龙的顶层不是固定的，可以由此坐标返回黑龙的顶层
	 */
	cga.mazeInfo = {
		'奇怪的洞窟': {
			name: '奇怪的洞窟',
			entryMap: '芙蕾雅',
			exitMap: 15505,
			posList: [[543, 38], [531, 38],],
			xLimit: [523, 558],
			yLimit: [14, 49],
			prefix: '奇怪的洞窟地下',
			suffix: '楼',
			forwardEntryTile: 12002,
			backEntryTile: 12000,
			tile: [7845, 7997],
			backTopPosList: [[40, 6, '']],
		},
		/**
		 * 出口是个BOSS房间，可以选择跟勇者开战，或者和BOSS阴影开战。可能是个任务。我记得法兰城有两个并排在别墅区站着，让你抓什么东西
		 */
		'诅咒之迷宫': {
			name: '诅咒之迷宫',
			entryMap: '芙蕾雅',
			exitMap: '炼金术师的工作室',
			posList: [[263, 149], [284, 140], [295, 127]],
			xLimit: [260, 273],
			yLimit: [133, 164],
			prefix: '诅咒之迷宫地下',
			suffix: '楼',
			forwardEntryTile: 13997,
			backEntryTile: 13996,
			backTopPosList: [[98, 191, '']],// 此值发生过修改，原来是99，现在是98。不确定此值是否也像入口一样变动
		},
		'废墟': {
			name: '废墟',
			entryMap: 27101,
			exitMap: 44707,
			posList: [[44, 22]],
			xLimit: [44, 44],
			yLimit: [22, 22],
			prefix: '废墟地下',
			suffix: '层',
			forwardEntryTile: 17955,
			backEntryTile: 17954,
			backTopPosList: [[15, 16, '']],
		},
		'布满青苔的洞窟': {
			name: '布满青苔的洞窟',
			entryMap: '芙蕾雅',
			exitMap: '叹息之森林',
			posList: [[380, 353]],
			xLimit: [380, 380],
			yLimit: [353, 353],
			prefix: '布满青苔的洞窟',
			suffix: '楼',
			forwardEntryTile: 17964,
			backEntryTile: 17965,
			backTopPosList: [[99, 191, '']],// TODO坐标不对，确认坐标
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
		'蜥蜴洞穴上层': {
			name: '蜥蜴洞穴上层',
			entryMap: '蜥蜴洞穴',
			exitMap: '蜥蜴最下层',// index30401
			posList: [[17, 4]],
			xLimit: [17, 17],
			yLimit: [4, 4],
			prefix: '蜥蜴洞穴上层第',
			suffix: '层',
			forwardEntryTile: 12002,
			backEntryTile: 12000,
			backTopPosList: [[15, 16, '']],
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
		'蜥蜴洞穴下层': {
			name: '蜥蜴洞穴下层',
			entryMap: '蜥蜴最下层',
			exitMap: '蜥蜴洞穴最下层',// index30403
			posList: [[13, 3]],
			xLimit: [13, 13],
			yLimit: [3, 3],
			prefix: '蜥蜴洞穴下层第',
			suffix: '层',
			forwardEntryTile: 12002,
			backEntryTile: 12000,
			backTopPosList: [[26, 4, '']],
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
		'黑龙沼泽': {
			name: '黑龙沼泽',
			entryMap: '肯吉罗岛',
			exitMap: 30404,// 出口房间名称就叫【黑龙沼泽】，容易混淆，改用index记录
			posList: [[424, 345]],
			xLimit: [420, 430],
			yLimit: [340, 350],
			prefix: '黑龙沼泽',
			suffix: '区',
			forwardEntryTile: 12002,
			backEntryTile: 12000,
			backTopPosList: [[11, 17, '']],
		},
		/**
		 * 旧日之地很特殊：
		 * 1、他的入口与出口，全都是楼梯。而且楼梯的colraw值，和上下楼梯一致。TODO 需要调整searchmap的逻辑，与其适配
		 * 入口的colraw值与前进的楼梯一致，是13274
		 * 出口的colraw值与后退的楼梯一致，是13275
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
		'旧日迷宫': {
			name: '旧日迷宫',
			entryMap: '迷宫入口',
			exitMap: 44711,// 出口房间名称就叫【旧日之地】，容易混淆，改用index记录
			posList: [[9, 5]],
			xLimit: [9, 9],
			yLimit: [5, 5],
			prefix: '旧日迷宫第',
			suffix: '层',
			forwardEntryTile: 13275,
			backEntryTile: 13274,
			backTopPosList: [[11, 17, '']],// TODO坐标不对，确认坐标
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
		'旧日之塔': {
			name: '旧日之塔',
			entryMap: '旧日之塔入口',
			exitMap: '旧日之塔顶层',// index 44713
			posList: [[9, 5]],
			xLimit: [9, 9],
			yLimit: [5, 5],
			prefix: '旧日之塔第',
			suffix: '层',
			forwardEntryTile: 13996,
			backEntryTile: 13997,
			backTopPosList: [[11, 17, '']],// TODO坐标不对，确认坐标
		},
		/**
		 * 出口为半山腰，160级练级处。
		 * 注意通往山顶的路是没有经验的！但是烧技能却可以，恶心的设定。
		 */
		'通往山顶的路': {
			name: '通往山顶的路',
			entryMap: '小岛',
			exitMap: '半山腰',
			posList: [[64, 45]],
			xLimit: [64, 64],
			yLimit: [45, 45],
			prefix: '通往山顶的路',
			suffix: '00M',
			forwardEntryTile: 13996,
			backEntryTile: 13997,
			backTopPosList: [[11, 17, '']],// TODO坐标不对，确认坐标
		},
		/**
		 * 琥珀之卵4，刷长老之证的海底墓场外苑迷宫
		 * 【注意】这是一个闭环迷宫，从index的59714的122, 69的传送水晶进入1层，会从顶层的传送水晶出来，回到index为59714的142, 69处。
		 * 也就是出口和入口是同一个地图，不同的pos，很特殊。
		 */
		'海底墓场外苑': {
			name: '海底墓场外苑',
			entryMap: 59714,
			exitMap: 59714,
			posList: [[122, 69]],
			xLimit: [122, 122],
			yLimit: [69, 69],
			prefix: '海底墓场外苑第',
			suffix: '地带',
			forwardEntryTile: 17967,//0x462F
			backEntryTile: 17966,//0x462E
			backTopPosList: [],
		},
		/**
		 * 如果你做完半山6【地狱的回响】，和大祭司对话进入的小岛，最后在破冰面下面进入的地狱入口是这个。
		 * 非常好走，几乎不会遇敌，单人逃跑即可！
		 */
		'地狱入口': {
			name: '地狱入口',
			entryMap: '圣山内部',
			exitMap: '地狱入口',// index57473
			posList: [[19, 7]],
			xLimit: [19, 19],
			yLimit: [7, 7],
			prefix: '通往地狱的道路地下',
			suffix: '层',
			forwardEntryTile: 17957,
			backEntryTile: 17956,
			backTopPosList: [[11, 17, '']],// TODO坐标不对，确认坐标
		},
		/**
		 * 战斗二转，神兽迷宫
		 */
		'贝兹雷姆的迷宫': {
			name: '贝兹雷姆的迷宫',
			entryMap: 16510,
			exitMap: 16511,
			posList: [[25, 7]],
			xLimit: [25, 25],
			yLimit: [7, 7],
			prefix: '贝兹雷姆的迷宫',
			suffix: '楼',
			forwardEntryTile: 12000,
			backEntryTile: 12002,
			backTopPosList: [[26, 72, '']],
		},
		/**
		 * 战斗四转，黑色方舟迷宫
		 */
		'黑色方舟': {
			name: '黑色方舟',
			entryMap: 59933,
			exitMap: 59934,
			posList: [[100, 95]],
			xLimit: [100, 100],
			yLimit: [95, 95],
			prefix: '黑色方舟第',
			suffix: '层',
			forwardEntryTile: 17980,
			backEntryTile: 17981,
			backTopPosList: [[26, 72, '']],// TODO
		},
		/**
		 * 战斗五转，隐秘之洞（地）
		 * 由于每个洞都有2个部分，我自定义取了名字，方便辨别：
		 * 隐秘之[地水火风]洞[上下]层
		 */
		'隐秘之地洞上层': {
			name: '隐秘之地洞上层',
			entryMap: 61000,
			exitMap: 27303,
			// 地之洞窟范围超大，经常可能刷在海边，注意探索覆盖度要足够
			posList: [[504, 300], [485, 272], [461, 259], [449, 247], [462, 222], [506, 235], [538, 257], [521, 269], [547, 284], [545, 257]],
			xLimit: [450, 600],
			yLimit: [200, 300],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17971,
			backEntryTile: 17970,
			tile: [9523, 9538],
			backTopPosList: [[29, 11, '']],
		},
		'隐秘之地洞下层': {
			name: '隐秘之地洞下层',
			entryMap: 27303,
			exitMap: 27304,
			posList: [[16, 38]],
			xLimit: [16, 16],
			yLimit: [38, 38],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17971,
			backEntryTile: 17970,
			tile: [9523, 9538],
			backTopPosList: [[17, 17, '']],
		},
		'隐秘之水洞上层': {
			name: '隐秘之水洞上层',
			entryMap: 61000,
			exitMap: 27306,
			posList: [[379, 459], [358, 488]],
			xLimit: [300, 400],
			yLimit: [500, 550],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17967,
			backEntryTile: 17966,
			tile: [9491, 9506],
			backTopPosList: [[26, 72, '']],// TODO
		},
		'隐秘之水洞下层': {
			name: '隐秘之水洞下层',
			entryMap: 27306,
			exitMap: 27307,
			posList: [[43, 16]],
			xLimit: [43, 43],
			yLimit: [16, 16],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17967,
			backEntryTile: 17966,
			tile: [9491, 9506],
			backTopPosList: [[17, 31, '']],
		},
		'隐秘之火洞上层': {
			name: '隐秘之火洞上层',
			entryMap: 61000,
			exitMap: 27309,
			posList: [[422, 417], [412, 439]],
			xLimit: [400, 450],
			yLimit: [400, 450],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17983,
			backEntryTile: 17982,
			tile: [9618, 9633],
			backTopPosList: [[9, 14, '']],
		},
		'隐秘之火洞下层': {
			name: '隐秘之火洞下层',
			entryMap: 27309,
			exitMap: 27310,
			posList: [[39, 27]],
			xLimit: [39, 39],
			yLimit: [27, 27],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17983,
			backEntryTile: 17982,
			tile: [9618, 9633],
			backTopPosList: [[31, 31, '']],
		},
		'隐秘之风洞上层': {
			name: '隐秘之风洞上层',
			entryMap: 61000,
			exitMap: 27312,
			posList: [[396, 250], [395, 224], [399, 204]],
			xLimit: [300, 450],
			yLimit: [150, 300],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17991,
			backEntryTile: 17990,
			tile: [9682, 9697],
			backTopPosList: [[7, 14, '']],
		},
		'隐秘之风洞下层': {
			name: '隐秘之风洞下层',
			entryMap: 27312,
			exitMap: 27313,
			posList: [[35, 16]],
			xLimit: [35, 35],
			yLimit: [16, 16],
			prefix: '隐秘之洞地下',
			suffix: '层',
			forwardEntryTile: 17991,
			backEntryTile: 17990,
			tile: [9682, 9697],
			backTopPosList: [[31, 17, '']],
		},
		'黑色的祈祷': {
			name: '黑色的祈祷',
			entryMap: 16507,
			exitMap: 16508,
			posList: [[14, 14]],
			xLimit: [14, 14],
			yLimit: [14, 14],
			prefix: '黑色的祈祷地下',
			suffix: '楼',
			forwardEntryTile: 17975,
			backEntryTile: 17974,
			backTopPosList: [[39, 5, '']],
		},
	}
	/**
	 * UNAecho:获取当前地图所处的随机迷宫信息
	 * @param {*} inputObj 地图数据，需要至少包括1个String类信息或Number信息
	 * 数据格式：
	 * {
	 * 		name : '隐秘之洞地下10层',
	 * 		index : 27303,
	 * }
	 * 因为有的地图无法根据mapindex确定（如随机迷宫楼层中的mapindex是随机的），或者根据mapname确定（'隐秘之洞地下10层'无法分辨出是地水火风哪一个迷宫的）
	 * 所以当出现这种难以分辨信息的时候，要注意传入可以唯一索引的信息。实在不知道传哪个，建议都传。
	 * @returns 返回cga.mazeInfo中的迷宫Obj信息
	 */
	cga.getMazeInfo = (inputObj) => {
		if (!inputObj.hasOwnProperty('name') && !inputObj.hasOwnProperty('index')) {
			throw new Error('cga.getMazeInfo():必须输入至少一种类型的信息：1、String类型的地图名称name。2、Number类型的地图index')
		}
		if (inputObj.hasOwnProperty('name') && typeof inputObj.name != 'string') {
			throw new Error('地图名称name必须为String类型')
		}
		if (inputObj.hasOwnProperty('index') && typeof inputObj.index != 'number') {
			throw new Error('地图index必须为Number类型')
		}
		// 提取地图层数
		const regexLayer = (str) => {
			var regex = str.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;

			if (regex && regex.length >= 3) {
				layerIndex = parseInt(regex[2]);
			}

			if (layerIndex == 0) {
				throw new Error('无法从地图名中解析出楼层');
			}

			// 半山特殊数字处理，因为是以100为单位的。
			if (str.indexOf('通往山顶的路') != -1) {
				layerIndex = Math.floor(layerIndex / 100)
			}

			return layerIndex
		}

		for (let obj of Object.values(cga.mazeInfo)) {
			// 有的时候可以使用迷宫的出口来归纳当前地图属于哪个迷宫，例如隐秘之洞10层其实是上层的出口。而BOSS房间其实是下层的出口
			// 由于map类型已经在开始就已经检验完毕，这里无需区分是String还是Number，直接判断相等即可。除非String类型的迷宫出口名称有重复（Number类型是不会有重复的）。
			// 隐秘之洞的第10层其实并非随机迷宫，而是上层的出口地图（固定不变）。会在这里直接返回
			if ((inputObj.name && inputObj.name == obj.exitMap) || (inputObj.index && inputObj.index == obj.exitMap)) {
				return obj
			}
			// 隐秘之洞不能通过前缀判断，因为地水火风4个洞都是一样的名称，必须要加入tile值判断
			else if (inputObj.name && inputObj.name.indexOf('隐秘之洞') != -1 && obj.hasOwnProperty('tile')) {
				let XY = cga.GetMapXY()
				let tile = cga.buildMapTileMatrix().matrix
				// 地板图标匹配后，还要区分是上层还是下层
				if (tile[XY.y][XY.x] >= obj.tile[0] && tile[XY.y][XY.x] <= obj.tile[1]) {
					// 解析层数
					let layerIndex = regexLayer(inputObj.name)
					if (layerIndex < 10 && obj.name.indexOf('上层') != -1) {
						return obj
					} else if (layerIndex > 10 && obj.name.indexOf('下层') != -1) {
						return obj
					}
					// layerIndex == 10的情况会在上面的exitMap被短路，这里不需要再写逻辑
				}
			}
			// 最常见的判断方式，但必须在if逻辑的最后出现，因为会短路其它特殊地图的判断。
			else if (inputObj.name && inputObj.name.indexOf(obj.prefix) != -1) {
				return obj
			}
		}
		console.warn('你不在迷宫中，或该迷宫的数据暂未收录。')
		return null
	}

	//下载地图的部分区域并等待下载完成
	cga.downloadMapEx = (xfrom, yfrom, xsize, ysize, cb) => {

		throw new Error('警告：2022年1月18日一次更新后服务器对下载地图功能增加了验证，不再推荐使用该API!');
		cb(null);
		return;
		var last_index3 = cga.GetMapIndex().index3;
		var x = xfrom, y = yfrom;
		var recursiveDownload = () => {
			cga.RequestDownloadMap(x, y, x + 24, y + 24);
			x += 24;
			if (x > xsize) {
				y += 24;
				x = xfrom;
			}
			if (y - ysize >= 24) {
				var waitDownloadEnd = (timeout = 3000) => cga.AsyncWaitDownloadMap((err, msg) => {
					if (err) {
						if (last_index3 != cga.GetMapIndex().index3) {
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
	cga.downloadMap = (cb) => {
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
	cga.walkMaze = (target_map, cb, filter) => {

		var objs = cga.getMapObjects();

		var newmap = null;

		if (typeof target_map != 'string') {
			var mapname = cga.GetMapName();

			var regex = mapname.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;

			if (regex && regex.length >= 3) {
				layerIndex = parseInt(regex[2]);
			}

			if (layerIndex == 0) {
				cb(new Error('无法从地图名中解析出楼层'));
				return;
			}

			if (filter && (typeof filter.layerNameFilter == 'function')) {
				newmap = filter.layerNameFilter(layerIndex, regex);
			}
			else {
				newmap = regex[1] + ((layerIndex >= 100) ? (layerIndex + 100) : (layerIndex + 1));
				if (typeof regex[3] == 'string')
					newmap += regex[3];
			}
		} else {
			newmap = target_map;
		}

		var target = null;

		if (filter && (typeof filter.entryTileFilter == 'function')) {
			var tiles = cga.buildMapTileMatrix();
			var colraw = cga.buildMapCollisionRawMatrix();
			objs.forEach((obj) => {
				if (target == null && obj.cell == 3 && obj.mapx < colraw.x_size && obj.mapy < colraw.y_size && filter.entryTileFilter({
					tile: tiles.matrix[obj.mapy][obj.mapx],
					colraw: colraw.matrix[obj.mapy][obj.mapx],
					obj: obj,
					// UNAecho:为了不破坏API原有结构，又能在模块外全局识别迷宫出口以及楼梯方向，只能在这个遍历里面消耗一点空间，加入全局数据。
					objs: objs,
					colraws: colraw,
				}) == true &&
					// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
					cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)) {
					target = obj;
					return false;
				}
			});
		}
		else {
			objs.forEach((obj) => {

				if (cga.walkMazeStartPosition != null) {
					if (obj.mapx == cga.walkMazeStartPosition.x && obj.mapy == cga.walkMazeStartPosition.y) {
						return;
					}
				}
				// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
				if (target == null && obj.cell == 3 && cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)) {
					target = obj;
					return false;
				}
			});
		}

		if (target == null) {
			cb(new Error('无法找到迷宫的出口'));
			return;
		}

		console.log('迷宫楼层:【' + cga.GetMapName() + '】，本层迷宫出口:(' + target.mapx + ', ' + target.mapy + ')');

		var pos = cga.GetMapXY();
		// UNAecho:这里计算迷宫出口路径，如果上面没有验证迷宫出口是否路径可达，就会报错。
		var walklist = cga.calculatePath(pos.x, pos.y, target.mapx, target.mapy, newmap, null, null, []);
		if (walklist.length == 0) {
			cb(new Error('无法计算到迷宫出口的路径'));
			return;
		}

		cga.walkMazeStartPosition = null;

		cga.walkList(walklist, (err, reason) => {
			if (err == null) {
				cga.waitUntilMapLoaded(() => {
					cb(err, reason);
				});
				return;
			}
			cb(err, reason);
			return;
		});
	}

	cga.waitUntilMapLoaded = (cb) => {
		var curpos = cga.GetMapXY();
		if (cga.getRandomSpace(curpos.x, curpos.y) != null) {
			cb(null);
			return;
		}
		console.log('地图未下载完成，服务器可能卡住，等待1秒后再试...');
		setTimeout(cga.waitUntilMapLoaded, 1000, cb);
	}

	//走随机迷宫
	cga.walkMazeStartPosition = null;
	cga.walkRandomMaze = (target_map, cb, filter) => {

		cga.waitUntilMapLoaded(() => {

			if (cga.walkMazeStartPosition == null) {
				cga.walkMazeStartPosition = cga.GetMapXY();
				// console.log('开始走随机迷宫...');
				// console.log('起始坐标：('+cga.walkMazeStartPosition.x+', '+cga.walkMazeStartPosition.y+')');
			}
			else {
				console.log('继续走随机迷宫...');
				console.log('起始坐标：(' + cga.walkMazeStartPosition.x + ', ' + cga.walkMazeStartPosition.y + ')');
			}
			cga.walkMaze(target_map, (err, reason) => {
				if (err && err.message == '无法找到迷宫的出口') {
					cga.searchMap(() => {
						/**
						 * UNAecho: 重写searchmap中的targetFinder逻辑
						 * 旧逻辑并没有考虑到如果外层cga.walkMaze的filter中，如果包含了自定义filter.entryTileFilter函数逻辑，则对楼梯的识别方式并不是只有cell==3就可以了的。
						 * 需要在有filter.entryTileFilter的情况下，加一层filter.entryTileFilter判断楼梯是否为意向的楼梯。
						 * */
						let objs = cga.getMapObjects()
						let target = undefined
						// 有filter.entryTileFilter的情况下，对门的判断需要经过filter.entryTileFilter的逻辑
						if (filter && (typeof filter.entryTileFilter == 'function')) {
							// console.log('存在自定义判断楼梯的逻辑，自动排除视野内不符合预期的楼梯')
							let colraw = cga.buildMapCollisionRawMatrix();
							objs.forEach((obj) => {
								if (target == null && obj.cell == 3 && obj.mapx < colraw.x_size && obj.mapy < colraw.y_size && filter.entryTileFilter({
									colraw: colraw.matrix[obj.mapy][obj.mapx],
									obj: obj,
									objs: objs,
									colraws: colraw,
								}) == true &&
									// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
									cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)) {
									target = obj;
									return false;
								}
							});
						} else {// 没有自定义filter.entryTileFilter的普通情况
							objs.forEach((obj) => {
								if (cga.walkMazeStartPosition != null) {
									if (obj.mapx == cga.walkMazeStartPosition.x && obj.mapy == cga.walkMazeStartPosition.y) {
										return;
									}
								}
								// UNAecho:如果这里不加上isPathAvailable判断，会出现隔墙看到迷宫出口导致下面calculatePath直接报错的情况
								if (target == null && obj.cell == 3 && cga.isPathAvailable(cga.GetMapXY().x, cga.GetMapXY().y, obj.mapx, obj.mapy)) {
									target = obj;
									return false;
								}
							});
						}

						return target != undefined ? true : false;
					}, (err) => {
						if (err && err.message.indexOf('无法找到') >= 0) {
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
		var map = cga.GetMapName();
		var mapindex = cga.GetMapIndex().index3;
		var mazeInfo = cga.getMazeInfo({
			name: map,
			index: mapindex,
		})

		// 如果运行时，自己在队伍中，且是队员
		let teamplayers = cga.getTeamPlayers();
		if (teamplayers.length && teamplayers[0].name != cga.GetPlayerInfo().name) {

			if (typeof targetMap == 'number' && targetMap >= 90) {
				console.log('cga.walkRandomMazeAuto:监测到你是队员，且输入楼层大于90层以上，推测是想到达迷宫顶层而非走出迷宫。')
				console.log('cga.walkRandomMazeAuto()判断，抵达终点时，与你目前的判断逻辑（生命值监测、道具监测等）无异，可直接调用callback退出cga.walkRandomMazeAuto()。')
				cb('ok')
				return
			}

			let waitMap = typeof targetMap == 'number' ? mazeInfo.prefix + targetMap + mazeInfo.suffix : targetMap
			console.log('cga.walkRandomMazeAuto:监测到你是队员，等待队长将自己带到指定地点:', waitMap)
			cga.waitForMap(waitMap, () => {
				cb('ok')
			})
			return
		}

		const regexLayer = (str) => {
			var regex = str.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;

			if (regex && regex.length >= 3) {
				layerIndex = parseInt(regex[2]);
			}

			if (layerIndex == 0) {
				throw new Error('无法从地图名中解析出楼层');
			}

			// 半山特殊数字处理，因为是以100为单位的。
			if (str.indexOf('通往山顶的路') != -1) {
				layerIndex = Math.floor(layerIndex / 100)
			}

			return layerIndex
		}
		// 对目标地图的解析，以及分析该向前还是向后走
		// 多个if else不能合并写，因为涉及到文字和数字混合判断地图。
		var newmap = null
		if (typeof targetMap == 'string') {
			newmap = targetMap
			if (targetMap == mazeInfo.entryMap) {
				isForward = false
			} else if (targetMap == mazeInfo.exitMap) {
				isForward = true
			} else if (regexLayer(targetMap) < regexLayer(map)) {
				isForward = false
			} else if (regexLayer(targetMap) > regexLayer(map)) {
				isForward = true
			}
		} else if (typeof targetMap == 'number') {
			if (targetMap > 0 && targetMap < 100) {
				newmap = mazeInfo.prefix + targetMap + mazeInfo.suffix
				if (targetMap < regexLayer(map)) {
					isForward = false
				} else if (targetMap > regexLayer(map)) {
					isForward = true
				}
			} else {
				newmap = targetMap
				if (targetMap == mazeInfo.entryMap) {
					isForward = false
				} else if (targetMap == mazeInfo.exitMap) {
					isForward = true
				}
			}
		} else {
			throw new Error('targetMap必须为number或string')
		}

		if (cga.GetMapName() == newmap || cga.GetMapIndex().index3 == newmap) {
			cb('ok')
			return
		}

		// 异常情况
		if (isForward === null) {
			throw new Error('isForward必须为true或false，true为往楼层增加的方向走，false反之')
		}

		// 主逻辑
		var go = () => {
			let curmap = cga.GetMapName()
			let curmapIndex = cga.GetMapIndex().index3
			// 如果走一半迷宫消失了，则调用回调函数，交给外面逻辑处理
			if (curmap == mazeInfo.entryMap || curmapIndex == mazeInfo.entryMap) {
				cb('entryMap');
				return;
			} else if (curmap == mazeInfo.exitMap || curmapIndex == mazeInfo.exitMap) {
				console.log('进入楼梯时意外走出迷宫，推测输入的楼层数比迷宫最深处还多。')
				cb('exitMap');
				return;
			}

			// console.log('目标地图:【',newmap,'】，当前地图【',map,'】，需要往【',isForward ? '前':'后','】走')

			// cga.walkRandomMaze传入''，代表walklist中的空串，也就是walklist切换任何地图都不报异常。
			cga.walkRandomMaze('', (err, reason) => {
				if (cga.GetMapName() == newmap || cga.GetMapIndex().index3 == newmap) {
					cb('ok')
					return
				} else {
					go()
					return
				}
			}, {
				entryTileFilter: (e) => {
					let objs = e.objs
					// debug用
					// console.log("cga.walkRandomMaze e:", e)
					if (e.colraw == 0) {
						for (let i = 0; i < objs.length; i++) {
							if (!isForward && objs[i].cell == 3 && e.colraws.matrix[objs[i].mapy][objs[i].mapx] == mazeInfo.forwardEntryTile) {
								console.log('地图中存在前进楼梯，判定传送石为入口')
								return true
							} else if (isForward && objs[i].cell == 3 && e.colraws.matrix[objs[i].mapy][objs[i].mapx] == mazeInfo.backEntryTile) {
								console.log('地图中存在后退楼梯，判定传送石为出口')
								return true
							}

						}
					} else if (isForward && e.colraw == mazeInfo.forwardEntryTile) {
						return true
					} else if (!isForward && e.colraw == mazeInfo.backEntryTile) {
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
	 * 特殊用法：由于targetMap输入数字可以抵达指定楼层。但如果输入数字比迷宫最大层数还大，导致脚本以为进入下一层，其实是走出迷宫的话，脚本会自动返回迷宫。
	 * 那么此性质可以用来自动抵达迷宫最大层数，像黑龙顶层练级，或神兽回迷宫顶层刷鳞片等等。
	 * 因为迷宫的输入数字范围为1-99，而没有迷宫真的有99层，所以可以用数字99来走至迷宫最大层数的水晶出口处。注意是可以抵达迷宫水晶出口处，而非顶层的楼梯处，使用起来更方便。
	 * 
	 * @param {*} cb 
	 * @returns 
	 */
	cga.findAndWalkMaze = (mazeName, targetMap, cb) => {
		let find = (targetMap, cb) => {
			let randomMazeArgs = {
				table: mazeInfo.posList,
				filter: (obj) => {
					return obj.cell == 3 && obj.mapx >= mazeInfo.xLimit[0] && obj.mapx <= mazeInfo.xLimit[1] && obj.mapy >= mazeInfo.yLimit[0] && obj.mapy <= mazeInfo.yLimit[1];
				},
				blacklist: [],
				expectmap: mazeInfo.prefix + '1' + mazeInfo.suffix,
			};
			cga.getRandomMazeEntrance(randomMazeArgs, (err) => {
				if (err && err.message && err.message.indexOf('没有找到迷宫入口') >= 0) {
					console.log('可能迷宫重置并未刷新，重新进行寻找...')
					setTimeout(find, 3000, targetMap, cb);
					return;
				}
				go(targetMap, cb)
			});
		}

		let back = (cb) => {
			cga.walkList(mazeInfo.backTopPosList, (err, reason) => {
				if (err == null) {
					cga.waitUntilMapLoaded(() => {
						console.log('输入楼层大于迷宫最深层，已返回迷宫最深层，API结束。')
						cb(err, reason);
					});
					return;
				}
				cb(err, reason);
				return;
			});
		}

		let go = (targetMap, cb) => {
			cga.walkRandomMazeAuto(targetMap, (r) => {
				if (r) {
					cga.waitUntilMapLoaded(() => {
						if (r == 'ok') {
							console.log('抵达预期地图，API结束。')
							setTimeout(cb, 1500);
							return
						} else if (r == 'entryMap') {
							console.log('走迷宫失败，可能由于迷宫重置被传送至入口。重新进入迷宫...')
							setTimeout(find, 3000, targetMap, cb);
							return
						} else if (r == 'exitMap') {
							console.log('非预期的走出迷宫')
							setTimeout(back, 1500, cb);
							return
						}
						throw new Error('非预期的回调，请检查r:', r)
					});
				} else {
					throw new Error('非预期的回调，请检查r:', r)
				}
			})
		}

		let map = cga.GetMapName();
		let mapIndex = cga.GetMapIndex().index3
		let mazeInfo = cga.mazeInfo[mazeName]

		// 如果运行时，自己在队伍中，且是队员
		let teamplayers = cga.getTeamPlayers();
		if (teamplayers.length && teamplayers[0].name != cga.GetPlayerInfo().name) {

			if (typeof targetMap == 'number' && targetMap >= 90) {
				console.log('cga.findAndWalkMaze:监测到你是队员，且输入楼层大于90层以上，推测是想到达迷宫顶层而非走出迷宫。')
				console.log('cga.findAndWalkMaze()判断，抵达终点时，与你目前的判断逻辑（生命值监测、道具监测等）无异，可直接调用callback退出cga.walkRandomMazeAuto()。')
				cb('ok')
				return
			}

			let waitMap = typeof targetMap == 'number' ? mazeInfo.prefix + targetMap + mazeInfo.suffix : targetMap
			console.log('cga.findAndWalkMaze:监测到你是队员，等待队长将自己带到指定地点:', waitMap)
			cga.waitForMap(waitMap, () => {
				cb('ok')
			})
			return
		}

		if (map == targetMap || mapIndex == targetMap) {
			console.log('已经在目标地图中，API结束。')
			setTimeout(cb, 1500);
			return
		}
		if (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1) {
			go(targetMap, cb)
		} else if (map == mazeInfo.entryMap || mapIndex == mazeInfo.entryMap) {
			find(targetMap, cb)
		} else if (map == mazeInfo.exitMap || mapIndex == mazeInfo.exitMap) {
			back(cb)
		} else {
			throw new Error('未知迷宫地图，请检查。map:', map)
		}
		return
	}

	/**
	 * UNAecho:此API有一个bug，就是如果过远侦测到随机迷宫入口，其实是游戏内部的缓存。
	 * 如果迷宫已经刷新，则实际入口与cga.getMapObjects()远距离侦测到的入口不一致。
	 * 此时如果使用cga.walklist去进入迷宫，就会出现在错误的坐标站着等待进入迷宫，直至超时，cga.walklist()抛出寻路卡住的Error
	 * 
	 * 这里加一个逻辑：
	 * 1、走到侦测到的迷宫附近，重新执行cga.getMapObjects()。
	 * 2、如果第2次的cga.getMapObjects()的迷宫坐标与在远处侦测到的迷宫入口坐标一致，则进入
	 * 3、如果不一致，则使用第最近一次获取的迷宫坐标。
	 * 其余逻辑不变
	 * 
	 * @param {*} args 
	 * @param {*} cb 
	 * @param {*} index 
	 */
	cga.getRandomMazeEntrance = (args, cb, index = 0) => {

		if (index == undefined)
			index = 0;

		if (args.table[index] == undefined) {
			cb(new Error('所有区域都已搜索完毕，没有找到迷宫入口！'));
		}

		console.log('前往区域[' + (args.table[index]) + ']搜索迷宫入口..');

		cga.walkList([
			args.table[index]
		], () => {
			console.log('正在区域[' + (args.table[index]) + ']搜索迷宫入口...');
			var entrance = cga.getMapObjects().find((obj) => {

				if (args.blacklist && args.blacklist.find((e) => {
					return e.mapx == obj.mapx && e.mapy == obj.mapy;
				}) != undefined) {
					return false;
				}

				return args.filter(obj);
			});

			if (entrance == undefined) {
				console.log('未找到迷宫入口,尝试下一区域...');
				cga.getRandomMazeEntrance(args, cb, index + 1);
			} else {
				if (args.expectmap) {
					var originalmap = cga.GetMapName();
					let entranceNearby = cga.getRandomSpace(entrance.mapx, entrance.mapy)
					cga.walkList([
						entranceNearby
					], () => {
						let curEntrance = cga.getMapObjects().find((obj) => {
							// 黑名单依然需要生效
							if (args.blacklist && args.blacklist.find((e) => {
								return e.mapx == obj.mapx && e.mapy == obj.mapy;
							}) != undefined) {
								return false;
							}

							return args.filter(obj);
						});

						// 如果远处看到了，走近却消失了，可能是迷宫在远处走近的过程中刚好刷新。继续下一个区域寻找
						if (curEntrance == undefined) {
							console.log('未找到迷宫入口,尝试下一区域...');
							cga.getRandomMazeEntrance(args, cb, index + 1);
						} else {// 如果近处侦测到了迷宫，则继续逻辑

							// 如果两次迷宫坐标一致，则视为入口坐标正确
							if (entrance.mapx == curEntrance.mapx && entrance.mapy == curEntrance.mapy) {
								console.log('远、近2次获取迷宫的坐标[' + entrance.mapx + ',' + entrance.mapy + ']一致，视为可进入迷宫..')
							} else {// 如果两次迷宫入口坐标不一致，则以最近一次获取为准
								console.log('远处获取迷宫的坐标[' + entrance.mapx + ',' + entrance.mapy + ']与近处获取的迷宫坐标[' + curEntrance.mapx + ',' + curEntrance.mapy + ']不一致')
							}

							// 无论远处、近处侦测到的迷宫是否一致，都要尝试进入近处侦测到的迷宫
							cga.walkList([
								[curEntrance.mapx, curEntrance.mapy, args.expectmap]
							], (err) => {
								if (err && err.message == 'Unexcepted map changed.') {
									console.log('坐标[' + curEntrance.mapx + ',' + curEntrance.mapy + ']的迷宫不是预期迷宫，将其加入黑名单..')
									var xy = cga.GetMapXY();
									args.blacklist.push(curEntrance);
									cga.walkList([
										[xy.x, xy.y, originalmap],
									], () => {
										console.log('未找到迷宫入口,尝试下一区域...');
										cga.getRandomMazeEntrance(args, cb, index + 1);
									});
									return;
								}
								// 如果是预期迷宫，则结束API
								cb(curEntrance);
							});
						}
					});
				} else {
					// 如果没有传入预期进入的地图，则结束API
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
	 * 由于上面第4步每次迭代，是选取目标地点作为下一次迭代的中心，这么做有弊端：
	 * 1、目标过于随机，人物会经常重复走已探索过的区域。
	 * 2、由于1的原因，极端情况下甚至无法走出迷宫。
	 * 
	 * 但也有优点，可以获取封闭区域，因为算法扩散至墙壁会终止扩散。而且速度快。
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
		var calCnt = (walls, x, y) => {
			var cnt = 0
			if (walls[y][x - 1] == 1)
				cnt += 1
			if (walls[y][x + 1] == 1)
				cnt += 1
			if (walls[y - 1][x] == 1)
				cnt += 1
			if (walls[y + 1][x] == 1)
				cnt += 1
			if (walls[y + 1][x + 1] == 1)
				cnt += 1
			if (walls[y + 1][x - 1] == 1)
				cnt += 1
			if (walls[y - 1][x + 1] == 1)
				cnt += 1
			if (walls[y - 1][x - 1] == 1)
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
			} else if (target === true) {
				console.log('成功找到楼梯...');
				cb(null);
			} else {
				console.log('未找到有效目标');
				noTargetCB();
			}
		};

		const go = (collisionMatrix, next, cb) => {
			let point = next.shift()
			if (point) {
				cga.walkList(
					[point],
					() => {
						if (collisionMatrix.join() === cga.buildMapCollisionMatrix(true).matrix.join()) {
							console.log('视野无变化，将x', point[0], 'y', point[1], '加入黑名单，并继续探索剩余坐标。')
							cacheBlacklistWalls[point[1]][point[0]]
							go(collisionMatrix, next, cb);
						} else {
							// console.log('视野有变化，重新进入getTarget...')
							cacheBlacklistWalls[point[1]][point[0]]
							getTarget(() => toNextPoint(cb))
						}
					}
				);
			} else {
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
					if (cacheBlacklistWalls[y][x] !== null) {
						continue
					}
					// 非碰撞点不参与计算
					if (collisionMatrix[y][x] == 0) {
						cacheBlacklistWalls[y][x] = 0
						continue
					}
					// 四周都是碰撞点，可能是未探索区域，只跳过，不加黑名单
					if (collisionMatrix[y][x - 1] == 1 && collisionMatrix[y][x + 1] == 1 &&
						collisionMatrix[y - 1][x] == 1 && collisionMatrix[y + 1][x] == 1)
						continue
					if (collisionMatrix[y][x - 1] == 0 && cga.isPathAvailable(current.x, current.y, x - 1, y)) {
						if (calCnt(collisionMatrix, x, y) < 5) {
							cacheBlacklistWalls[y][x] = 1
						} else {
							next.push([x - 1, y])
						}
						continue
					}
					if (collisionMatrix[y][x + 1] == 0 && cga.isPathAvailable(current.x, current.y, x + 1, y)) {
						if (calCnt(collisionMatrix, x, y) < 5) {
							cacheBlacklistWalls[y][x] = 1
						} else {
							next.push([x + 1, y])
						}
						continue
					}
					if (collisionMatrix[y - 1][x] == 0 && cga.isPathAvailable(current.x, current.y, x, y - 1)) {
						if (calCnt(collisionMatrix, x, y) < 5) {
							cacheBlacklistWalls[y][x] = 1
						} else {
							next.push([x, y - 1])
						}
						continue
					}
					if (collisionMatrix[y + 1][x] == 0 && cga.isPathAvailable(current.x, current.y, x, y + 1)) {
						if (calCnt(collisionMatrix, x, y) < 5) {
							cacheBlacklistWalls[y][x] = 1
						} else {
							next.push([x, y + 1])
						}
						continue
					}
				}
			}
			// 规则过滤与排序
			// 目标点过滤逻辑为，删除距离自己切比雪夫距离小于12的点（因为已在视野内）
			// 排序逻辑为，以切比雪夫距离最近的点为优先，而不是以周围8格墙壁数最多的墙为优先。
			next = next.filter((p) => {
				return cga.chebyshevDistance(current.x, current.y, p[0], p[1]) > 12 ? true : false
			}).sort((a, b) => cga.chebyshevDistance(current.x, current.y, a[0], a[1]) - cga.chebyshevDistance(current.x, current.y, b[0], b[1]))

			go(collisionMatrix, next, toNextCB)

		};
		getTarget(() => {
			toNextPoint(() => {
				cb(new Error('无法找到符合条件的对象'));
			});
		});
	}

	/**
	 * UNAecho:探索迷宫的目标寻找与执行动作逻辑，并返回指导下一步的参数
	 * 该API仅适用于探索迷宫的API调用
	 * 
	 * @param {Object} checkObj 识别函数与动作函数对象，包含了对迷宫所有对象的识别与动作函数，如开宝箱、与NPC对话、与BOSS对话开战等。
	 * 该对象必须包括:
	 * 1、identify()，识别函数，辨别目标是否为预期对象。return true是false否
	 * 2、act(cb)，动作函数，仅当identify() return true时触发，执行某动作。
	 * 其中，act(cb)需要在callback中返回部分参数来通知是否继续搜索、删除缓存对象（如开完就消失的宝箱）等逻辑，具体为以下几种:
	 * 1、cb(true)，代表继续探索迷宫
	 * 2、cb(false)，代表中断探索迷宫
	 * 3、cb('delete and continue')，代表删除该对象，并继续探索迷宫
	 * 4、cb('delete and break')，代表删除该对象，并中断探索迷宫
	 * 
	 * 现在在【奇怪的洞窟】（亚留特外的狗洞）举一个写法的例子，目标为：
	 * 1、在洞窟中寻找【无照护士米内鲁帕】，对话获得【实验药】，继续探索迷宫
	 * 2、在洞窟中寻找【人类？】，在持有【实验药】的前提下，与其对话，发生战斗，直至战斗结束，返回迷宫，继续探索迷宫
	 * 3、在洞窟中寻找【宝箱】，使用自定义方法，将其打开，并监听打开箱子的结果 TODO 没有囊括战斗，因为测试的时候没有遇到战斗的情况（如出现五色箱子的怪物），继续探索迷宫。
	 * {
				identify: (obj) => {
					if(obj.name == '无照护士米内鲁帕' && cga.getItemCount('实验药') == 0) return true
					if(obj.name == '人类？' && cga.getItemCount('实验药') > 0 && cga.getItemCount(遗物「丝巾」) == 0) return true
					if(obj.name == '宝箱' && cga.getItemCount('铜钥匙') > 0) return true
					return false
				},
				act: (obj, cb) => {
					if(obj.name == '无照护士米内鲁帕'){
						cga.askNpcForObj({ act: 'item', target: '实验药', npcpos: [obj.x, obj.y] }, () => {
							// 返回true是为了继续cga.exploreMaze的探索逻辑
							cb(true)
						})
						return
					}
					if(obj.name == '人类？'){
						cga.askNpcForObj({
							act: 'function', target: (cb) => {
								let hasBattle = false
    
								let retry = ()=>{
									if(!cga.isInNormalState()){
										hasBattle = true
										setTimeout(retry, 1500);
										return;
									}
									if(hasBattle){
										console.log('已手持实验药击败人类？')
										// 返回true是为了终止askNpcForObj()的retry()
										cb(false)
										return
									}
									cga.TurnTo(obj.x, obj.y);
									setTimeout(retry,1000)
								}
								retry()
							}, npcpos: [obj.x, obj.y]
						}, () => {
							// 这里不要返回'delete and continue'，因为npc不会消失，一会还会刷新
							cb(true)
						})
						return
					}
					if(obj.name == '宝箱'){
						cga.openBoxInMaze(obj,'生产赶路','练级',(r)=>{
							cb(r)
						})
						return
					}
				}
			}
	 * 【注意】
	 * 1、部分迷宫NPC在击倒过后一段时间，会被游戏隐藏，但不会消失。因为其它玩家还需要与其战斗。
	 * 此时cga.GetMapUnits()仍然可以捕获其存在，但是被隐藏后无法与其交互
	 * 所以此类NPC在act()执行完毕后，不要使用删除功能，因为他还会出现
	 * 如果想规避与其无限战斗，可以在identify()中执行规避的逻辑，如持有战斗胜利的物品，或者干脆直接代码写逻辑缓存flag也可以
	 * 2、但如果是宝箱，因为打开之后，在迷宫刷新前他是不会再出现的，所以需要act()执行完毕后，使用删除功能，将其数据删除
	 * @param {*} cb 
	 */
	cga.checkMazeCacheInternal = (layerObj, checkObj, cb) => {
		let unitKeys = Object.keys(layerObj)
		if (typeof checkObj.identify != 'function' || typeof checkObj.act != 'function') {
			throw new Error('checkObj中的每个对象都必须包含identify和act方法')
		}

		for (let key of unitKeys) {
			// 跳过无关数据
			if (key == 'id' || key == 'complete') {
				continue
			}
			// 如果识别函数返回true，则将目标对象传入动作函数，并执行。
			if (checkObj.identify(layerObj[key])) {
				console.log('发现目标:', layerObj[key])
				checkObj.act(layerObj[key], (result) => {
					// 如果checkObj中的act()返回true，或者check()返回null则为继续探索迷宫
					if (result === true) {
						cb(true)
					} else if (result === false) {// 如果checkObj中的act()返回false，则中断探索
						console.log('cga.thoroughSearchMap()返回', result, '中断探索迷宫')
						cb(false)
					} else if (result == 'delete and continue') {// 如果checkObj中的act()返回'delete and continue'，则删除缓存对应的数据，并继续探索迷宫
						console.log('checkObj中的act()返回', result, '删除对应的数据:', layerObj[key], '并继续探索迷宫')
						delete layerObj[key]
						cb(true)
					} else if (result == 'delete and break') {// 如果checkObj中的act()返回'del'，则删除缓存对应的数据
						console.log('checkObj中的act()返回', result, '删除对应的数据:', layerObj[key], '中断探索迷宫')
						delete layerObj[key]
						cb(false)
					} else {
						throw new Error('checkObj中的act()返回值异常，必须返回Boolean型数值')
					}
					return
				})
				return
			}
		}
		// 如果checkObj.identify没有检测到需要执行动作的对象，返回null
		cb(null)
		return
	}

	/**
	 * UNAecho:开发一个探索本层迷宫的API
	 * 此API与cga.searchMap()神似，但却有不同的目标。可以理解为损失函数不同。
	 * cga.searchMap()是以优先找到前进/后退的楼梯为主，发现楼梯立即进入
	 * 而cga.thoroughSearchMap()是优先以地毯式搜索地图为主，需要探索全地图，将楼梯、BOSS、NPC、宝箱、传送水晶的所有信息收集后，再退出
	 * 
	 * 此API简要逻辑为：
	 * 1、将距离自己11投影距离的各单位存入参数cache中。（距离大于11的话，cga.getMapObjects()无法观测到目标具体数据）
	 * 2、cache对象使用落盘文件，如果文件不存在，则初始化一个新的Object
	 * 3、以人物为中心，使用扩散方法获取可通行点与墙壁。该方法可避免获取到墙壁以外的不可抵达点。
	 * 4、将探索过的可通行点加入缓存中，避免重复探索迷宫，实现地毯式搜索一层迷宫
	 * 5、地毯式搜索过后，调用callback，传入更新的缓存数据，结束API
	 * 
	 * 【开发注意事项】
	 * 1、此API用到了cga.buildMapCollisionRawMatrix()与cga.buildMapCollisionMatrix()这两个函数。他们很像，却有不同的用途
	 * 2、必须使用cga.buildMapCollisionMatrix()来识别墙壁，cga.buildMapCollisionRawMatrix()会有将墙壁识别为可通行点的bug
	 * 3、cga.buildMapCollisionRawMatrix()唯一的用处是获取楼梯的colraw值，配合cga.mazeInfo来识别是前进还是后退楼梯。
	 * @param {Object} mazeInfo 当前探索的迷宫数据，需要外部传入。如果数据格式不正确，则重新获取
	 * @param {Object} cache 缓存数据，默认为{}，如果外部传入，则使用外部传入的数据
	 * @param {Object} checkObj 识别函数与动作函数对象，包含了对迷宫所有对象的识别与动作函数，如开宝箱、与NPC对话、与BOSS对话开战等。
	 * 该对象具体写法参考cga.checkMazeCacheInternal()的注释
	 * @param {*} cb 
	 * @returns 
	 */
	cga.thoroughSearchMap = (mazeInfo, cache = {}, checkObj, cb) => {

		// 本层迷宫名称
		let layerName = cga.GetMapName()
		// 本层迷宫是否刷新，没有刷新则可以沿用缓存数据
		let refresh = null

		// 如果没有迷宫数据或传入对象数据格式不正确，则重新获取
		if (Object.prototype.toString.call(mazeInfo) == '[object Object]' || !mazeInfo.hasOwnProperty('forwardEntryTile')) {
			mazeInfo = cga.getMazeInfo({ name: layerName })
		}

		// 缓存初始化
		if (!cache.hasOwnProperty(mazeInfo.name)) {
			cache[mazeInfo.name] = {}
		}
		if (!cache[mazeInfo.name].hasOwnProperty(layerName)) {
			cache[mazeInfo.name][layerName] = {}
		}

		// 本层楼是否已经探索过的缓存，key为坐标，value为Boolean，true为探索过，false为未探索过
		let viewCache = {}

		let getFoundedPoints = (map, start) => {
			let foundedPoints = {
				'available': {},
				'wall': {},
			};
			foundedPoints.available[start.x + '-' + start.y] = start;
			let findByNextPoints = (centre) => {
				let nextPoints = [];
				let push = (p) => {
					if (p.x > map.x_bottom && p.x < map.x_size && p.y > map.y_bottom && p.y < map.y_size) {
						if (map.matrix[p.y][p.x] === 0) {
							let key = p.x + '-' + p.y;
							if (!foundedPoints.available[key]) {
								foundedPoints.available[key] = p;
								nextPoints.push(p);
							}
						} else if (map.matrix[p.y][p.x] > 0) {
							let key = p.x + '-' + p.y;
							if (!foundedPoints.wall[key]) {
								foundedPoints.wall[key] = p;
							}
						}
					}
				};
				push({ x: centre.x + 1, y: centre.y });
				push({ x: centre.x + 1, y: centre.y + 1 });
				push({ x: centre.x, y: centre.y + 1 });
				push({ x: centre.x - 1, y: centre.y + 1 });
				push({ x: centre.x - 1, y: centre.y });
				push({ x: centre.x - 1, y: centre.y - 1 });
				push({ x: centre.x, y: centre.y - 1 });
				push({ x: centre.x + 1, y: centre.y - 1 });
				nextPoints.forEach(findByNextPoints);
			};
			findByNextPoints(start);
			return foundedPoints;
		}

		// 计算周围8点有多少碰撞点
		// 注意游戏坐标的xy在cga.buildMapCollisionMatrix().matrix这里要反着用，因为matrix中y是1维坐标，x是2维坐标
		let calCnt = (walls, x, y) => {
			let cnt = 0
			if (walls[y][x - 1] == 1)
				cnt += 1
			if (walls[y][x + 1] == 1)
				cnt += 1
			if (walls[y - 1][x] == 1)
				cnt += 1
			if (walls[y + 1][x] == 1)
				cnt += 1
			if (walls[y + 1][x + 1] == 1)
				cnt += 1
			if (walls[y + 1][x - 1] == 1)
				cnt += 1
			if (walls[y - 1][x + 1] == 1)
				cnt += 1
			if (walls[y - 1][x - 1] == 1)
				cnt += 1

			return cnt;
		}

		let findNext = (cb) => {
			// 当前坐标
			let current = cga.GetMapXY()
			// cga.buildMapCollisionRawMatrix()用来辨别楼梯的colraw值
			let colraw = cga.buildMapCollisionRawMatrix()
			// cga.buildMapCollisionMatrix()用来辨别是可通行点还是墙
			let walls = cga.buildMapCollisionMatrix(true)

			// 识别可通行的点与不可通行的墙壁，注意这里必须用cga.buildMapCollisionMatrix()来识别墙（而不是cga.buildMapCollisionRawMatrix()），否则会出现墙体被识别为可通行的bug
			let foundedPoints = getFoundedPoints(walls, current)
			// 将视野范围内的信息记录到缓存中
			view(current, foundedPoints, colraw)

			// 如果view()中将refresh置为false，并且地图的complete已经标记为true（完全探索）则中止探索。
			if (refresh === false && cache[mazeInfo.name][layerName].complete) {
				console.log('cga.thoroughSearchMap()判断本层迷宫没有刷新，可以沿用缓存数据')
				cb(cache, 'no refresh')
				return
			}

			// view()过后，执行识别函数与动作函数，如果有中断信号，则中断搜索迷宫。
			cga.checkMazeCacheInternal(cache[mazeInfo.name][layerName], checkObj, (result) => {
				// 如果继续探索
				if (result === true || result === null) {
					// 开始探索，先看看缓存中有没有未探索区域，如果有，则优先探索
					for (let keyPoint in viewCache) {
						if (viewCache[keyPoint] === false) {
							let next = keyPoint.split('-').map(Number)
							// index 6处传入true，代表躲避NPC走路。
							next = next.concat([null, null, null, [], true])
							if (cga.isPathAvailable(current.x, current.y, next[0], next[1])) {
								cga.walkList(
									[next],
									() => {
										findNext(cb)
									}
								)
								return
							} else {
								console.log('未探索区域:', next, '，但是无法抵达，舍弃')
							}
						}
					}

					// 再看看有没有未探索墙壁，如果有，则探索其附近可通行格子
					for (let w in foundedPoints.wall) {
						// 一个wall point周围有至少5个wall point，视为未探索wall point
						if (calCnt(colraw.matrix, foundedPoints.wall[w].x, foundedPoints.wall[w].y) > 4) {
							let next = cga.getRandomSpace(w.x, w.y)
							// index 6处传入true，代表躲避NPC走路
							next = next.concat([null, null, null, [], true])
							console.log('未探索墙壁:', next)
							cga.walkList(
								[next],
								() => {
									findNext(cb)
								}
							);
							return
						}
					}

					/**
					 * 没发现没探索过的地板或墙壁，开始检测数据是否完整。
					 * 遍历缓存数据，如果本层的水晶+上/下楼梯数量等于2的时候，才算数据合格。否则视为地图探索不正确，重新探索。
					 * 这么做的理由：
					 * 1、可能走了一半迷宫地图没下载完毕，这边直接就会变成视野范围内全部探索完毕，因为视野内的都探索过了，没探索过的还没下载完毕。
					 * 
					 * 【注意】有时候上下楼梯加和本身就是2，需要测试性进入才能辨别是出口还是楼梯。例如狗洞顶层或旧日之塔顶层，不要在这里判断是否上下楼梯齐全。
					 */
					let doorCnt = 0
					for (let key in cache[mazeInfo.name][layerName]) {
						// 跳过无用数据
						if (key == 'id' || key == 'complete') {
							continue
						}
						if (['door', 'forward', 'back'].includes(cache[mazeInfo.name][layerName][key].type)) {
							doorCnt += 1
							console.log(cache[mazeInfo.name][layerName][key], '是楼梯或水晶，当前累计数量:', doorCnt)
						}
					}
					// 如果水晶和楼梯的总计为2，视为数据合格
					if (doorCnt == 2) {
						console.log('本层已全部探索完毕..')
						// 如果既没有未探索领域，也没有未探索墙壁，则视为本层已探索完毕，callback返回缓存与非中断信号true，退出API
						cb(cache, true)
						return
					} else {// 异常情况，重新探索
						// 清空已经探索过的区域记录，否则无限循环了
						viewCache = {}
						// 重新探索
						findNext(cb)
						return
					}
				} else if (result === false) {// 如果中断探索，callback返回缓存与中断信号false，退出API
					cb(cache, false)
				}
			})
		}

		/**
		 * 虽然可以使用cga.getMapObjects(true)在地图任意位置获得碰撞类单位的信息，但是却无法获取其名称
		 * 所以这里统一使用有视野范围限制的cga.GetMapUnits()来获取信息，利用：
		 * 1、cga.getMapObjects(true)
		 * 2、cga.buildMapCollisionRawMatrix()
		 * 来辅助数据的完善，如boss名字、楼梯是前进还是后退，水晶是入口还是出口等等
		 * 【注意】大部分楼梯虽然可通过colraw的值来判断是前进还是后退，有时候却不行
		 * 狗洞（奇怪的洞窟）出口是一个后退单位，和后退的楼梯无论从外观还是cell、colraw值都一模一样，无法分辨
		 * 
		 * 建议外部调用的函数，在进入地图时，记录起始位置，来分别到底是后退楼梯还是出口
		 * 
		 * TODO 已知bug：
		 * 1、宝箱居然可以压在楼梯上，也就是宝箱坐标与楼梯重合了。有空再改吧
		 * 2、【严重bug，已解决并上线，生产环境测试中】cga.GetMapUnits()居然会有不小的概率抓取不到楼梯的数据，哪怕楼梯就在眼前(11个坐标以内)
		 * 甚至踩在楼梯上（刚刚传送过来）都无法获取。
		 * 测试：我在狗洞和黑色的祈祷随机迷宫中都曾遇到过，人物无论如何都获取不到楼梯的信息。但手动上下楼一次，就恢复正常。
		 * 由于是封装的C++类API，不好改其代码，这里只得使用cga.getMapObjects()来获取门的数据，不然会经常导致迷宫探索失败。
		 */
		let view = (current, foundedPoints, colraw) => {
			// 获取碰撞类单位，如楼梯、boss、传送水晶等
			let mapObjs = cga.getMapObjects(true)
			// 记录视野范围内的单位，如NPC、宝箱等。视野范围为11格（含）投影距离。游戏设定即为如此。
			let units = cga.GetMapUnits()
			// 当前楼层唯一识别id(mapindex + '_' + layerName)
			let id = cga.GetMapIndex().index3 + '_' + layerName

			// 分析迷宫是否刷新，先判断当前楼层有没有唯一识别id。如果有，并且没有判断过迷宫是否刷新，则进行进一步判断
			if (cache[mazeInfo.name][layerName].hasOwnProperty('id')) {
				// 如果没有确认过迷宫是否刷新
				if (refresh === null) {
					// 如果唯一识别id与缓存中一致，则进行进一步判断
					if (cache[mazeInfo.name][layerName].id == id) {
						// 获取所有水晶或楼梯单位的坐标，进行判断。如果目前地图上所有的水晶或楼梯均与缓存中一致，则视为迷宫未刷新，可继续沿用缓存数据。中止view()，停止探索。
						if (mapObjs.every(m => {
							let doorOrStair = cache[mazeInfo.name][layerName][m.mapx + '_' + m.mapy]
							if (!doorOrStair) {
								return false
							}
							// 不是水晶或楼梯的单位跳过，避免逻辑混乱
							if (!['door', 'forward', 'back'].includes(doorOrStair.type)) {
								return true
							}
							return m.mapx == doorOrStair.x && m.mapy == doorOrStair.y
						})) {
							console.log('当前地图的楼梯与水晶单位均与缓存中一致，视为迷宫未刷新，可继续沿用缓存数据。')
							refresh = false
							return
						} else {// 小概率事件，如果地图唯一识别id与缓存一致，但水晶或楼梯的坐标却发生的变化，则视为迷宫已经变化，初始化本迷宫所有数据
							console.warn('【UNAecho脚本警告】当前迷宫mapindex虽然与缓存中一致，但水晶或楼梯的坐标发生了变化。判定为迷宫已经刷新，初始化本迷宫所有数据..')
							// 迷宫已经刷新，标记状态
							refresh = true
							// 仅删除此迷宫数据，其它迷宫数据不动
							cache[mazeInfo.name] = {}
							// 刷新id
							cache[mazeInfo.name][layerName] = { id: id }
						}
					} else {// 如果唯一识别id与缓存中不同，则视为迷宫已经刷新
						console.warn('【UNAecho脚本警告】当前迷宫mapindex与缓存不符，判定为迷宫已经刷新，初始化本迷宫所有数据..')
						// 迷宫已经刷新，标记状态
						refresh = true
						// 仅删除此迷宫数据，其它迷宫数据不动
						cache[mazeInfo.name] = {}
						// 初始化id
						cache[mazeInfo.name][layerName] = { id: id }
					}
				}
			} else {// 如果没有唯一识别id，则初始化
				cache[mazeInfo.name][layerName].id = id
				// 迷宫没有探索过，refresh标记为true防止重置数据
				refresh = true
			}

			/**
			 * 先整理cga.GetMapUnits()所看到的单位。
			 * 目前有bug，对水晶、楼梯单位可能会遗漏，这里只抓取宝箱、NPC（不包括boss）、地面道具等单位。
			 */
			for (let u of units) {
				if (u.valid != 2) {
					console.log('无效目标', u, '的valid!=2，跳过')
					continue
				}
				let uid = u.xpos + '_' + u.ypos
				// 宝箱
				if (u.type == 2 && u.model_id != 0 && (u.flags & 1024) != 0) {
					if (cache[mazeInfo.name][layerName].hasOwnProperty(uid)) {
						continue
					}
					// 额外记录一下model_id，观察宝箱的model_id是否在一定范围内。否则无法判断一个物体是丢弃在地上的道具，还是宝箱
					cache[mazeInfo.name][layerName][uid] = { name: u.item_name, type: 'box', x: u.xpos, y: u.ypos, model_id: u.model_id }
				}

				if (u.type == 1 && (u.flags & 4096) != 0) {
					if (cache[mazeInfo.name][layerName].hasOwnProperty(uid)) {
						continue
					}
					// 碰撞类单位信息跳过，不在这处理
					if (mapObjs.some(m => { return m.x == u.xpos && m.y == u.ypos })) {
						continue
					} else {//NPC
						cache[mazeInfo.name][layerName][uid] = { name: u.unit_name, type: 'npc', x: u.xpos, y: u.ypos }
					}
				}
			}

			/**
			 * cga.getMapObjects()，NPC或者碰撞类单位（迷宫中可以攻击的NPC、哈洞熊男等）信息整理
			 * 此API稳定性较高，使用它的数据代替cga.GetMapUnits()的NPC或者碰撞类单位信息。
			 * 
			 * 关于迷宫中的碰撞类boss，如奇怪的洞窟里的【僵尸】、持有实验药可以攻击的【人类？】等说明：
			 * 1、cga.getMapObjects()中的cell=2或cell=5是描述此类NPC的数据。
			 * 2、cell=2是可以被攻击的情况，如果与其战斗并击败它，cell则会变为5
			 * 3、cell=5是不可被攻击的情况，游戏中无法看到，也无法与其进行战斗。也就是实现了对某类玩家隐身的特性，可能是防止玩家疯狂刷boss吧
			 * 4、无论是cell=2还是cell=5的状态，cga.GetMapUnits()也可以获取，但无法辨别他是什么状态。唯一作用是使用它获取boss的名称
			 */
			for (let m of mapObjs) {
				let uid = m.mapx + '_' + m.mapy
				if (cache[mazeInfo.name][layerName].hasOwnProperty(uid)) {
					// 如果没有名称，则不能跳过。因为boss类信息可能会由于在远处获取而不知道其名称，需要借助cga.GetMapUnits()更新
					if (cache[mazeInfo.name][layerName][uid].name != 'unknown') {
						continue
					}
				}
				// 楼梯或传送水晶，注意colraw.matrix的xy坐标与游戏相反
				if (m.cell == 3) {
					// 楼层+1的楼梯
					if (colraw.matrix[m.mapy][m.mapx] == mazeInfo.forwardEntryTile) {
						cache[mazeInfo.name][layerName][uid] = { name: '楼梯', type: 'forward', x: m.mapx, y: m.mapy, colraw: colraw.matrix[m.mapy][m.mapx] }
					} else if (colraw.matrix[m.mapy][m.mapx] == mazeInfo.backEntryTile) {// 楼层-1的楼梯
						cache[mazeInfo.name][layerName][uid] = { name: '楼梯', type: 'back', x: m.mapx, y: m.mapy, colraw: colraw.matrix[m.mapy][m.mapx] }
					} else {// 传送水晶，colraw其实是0，可以不加
						cache[mazeInfo.name][layerName][uid] = { name: '水晶', type: 'door', x: m.mapx, y: m.mapy, colraw: colraw.matrix[m.mapy][m.mapx] }
					}
				} else if (m.cell == 2 || m.cell == 5) {// 碰撞类boss，2是可见、可攻击。5是不可见、不可攻击。
					// cga.getMapObjects()没有名称信息，只能暂定unknown
					cache[mazeInfo.name][layerName][uid] = { name: 'unknown', type: 'boss', x: m.mapx, y: m.mapy }

					// 如果在cga.GetMapUnits()视野范围内，则获取其名字
					// cell=3的楼梯可能与宝箱重叠，但cell=2或5的NPC不会，可以放心为其赋值。
					for (let u of units) {
						if (u.xpos == m.mapx && u.ypos == m.mapy) {
							cache[mazeInfo.name][layerName][uid].name = u.unit_name
						}
					}
				}
			}

			// 然后记录已探索和未探索坐标
			for (let key in foundedPoints.available) {
				if (viewCache[key] === true) {
					continue
				}
				// 人物只能看到小于等于11格的东西
				if (cga.projectDistance(current.x, current.y, foundedPoints.available[key].x, foundedPoints.available[key].y) < 12) {
					viewCache[key] = true
				} else {
					viewCache[key] = false
				}
			}
		}
		findNext(cb)
		return
	}

	/**
	 * UNAecho:一个完整探索迷宫的API
	 * 核心逻辑：
	 * 1、使用cga.thoroughSearchMap()探索每一层迷宫
	 * 2、使用缓存文件记录迷宫的探索进度
	 * 3、先前进探索，如果没找到目标，则走到顶层后，折返开始反向探索遗漏点（如果有的话）
	 * 4、如果折返探索至1层，还是没有发现目标，则抛出异常，多数情况为checkObj中的identify()函数有误
	 * 5、可以一边探索，一边执行多个逻辑，如边开宝箱边找BOSS进行击倒，也可以顺道捡起其它玩家丢弃的魔石、古钱等。具体实现逻辑需要在checkObj中写好
	 * 6、迷宫的数据，依赖cga.mazeInfo
	 * 
	 * checkObj()的写法，参考参考cga.checkMazeCacheInternal()的注释
	 * 
	 * @param {*} checkObj 
	 * @param {*} cb 
	 * @returns 
	 */
	cga.exploreMaze = (checkObj, cb) => {
		// 人物前进方向，true为向楼层增加方向走，false反之。默认true
		let isForward = true
		// 获取静态地图数据
		let mapindex = cga.GetMapIndex().index3;
		let map = cga.GetMapName();
		let mazeInfo = cga.getMazeInfo({
			name: map,
			index: mapindex,
		})

		if (!mazeInfo) {
			throw new Error('cga.mazeInfo没有此迷宫信息，请联系作者https://github.com/UNAecho更新')
		}

		let file = 'mazeCache.json';
		// 读取缓存文件，如果不存在则初始化
		let cache = cga.fileObj.load(file)
		// 解析当前迷宫层数
		let regexLayer = (str) => {
			var regex = str.match(/([^\d]*)(\d+)([^\d]*)/);
			var layerIndex = 0;

			if (regex && regex.length >= 3) {
				layerIndex = parseInt(regex[2]);
			}

			// 半山特殊数字处理，因为是以100为单位的。
			if (str.indexOf('通往山顶的路') != -1) {
				layerIndex = Math.floor(layerIndex / 100)
			}

			if (layerIndex == 0) {
				throw new Error('无法从地图名中解析出楼层');
			}

			return layerIndex
		}

		// 收集完本层缓存内容后，开始行动
		let nextStep = (layerName, cb) => {
			cga.waitUntilMapLoaded(() => {
				// 获取本层各对象的key
				let keys = Object.keys(cache[mazeInfo.name][layerName])
				// 下一步要进入的楼梯
				let target = null
				// 正向则找正向楼梯，反向则找反向楼梯
				for (let key of keys) {
					if (isForward && cache[mazeInfo.name][layerName][key].colraw == mazeInfo.forwardEntryTile) {
						target = cache[mazeInfo.name][layerName][key]
						break
					} else if (!isForward && cache[mazeInfo.name][layerName][key].colraw == mazeInfo.backEntryTile) {
						target = cache[mazeInfo.name][layerName][key]
						break
					}
				}
				/**
				 * 如果没找到楼梯，可能有几种情况：
				 * 1、正向探索时，碰到特殊情况，顶层出现2个后退楼梯(如旧日迷宫顶层)，其中1个为迷宫出口，此时需要折返
				 * 2、反向探索时，碰到特殊情况，1层出现2个前进楼梯(如旧日迷宫1层)，其中1个为迷宫入口，此时返回异常（因为正向+反向2次探索都没找到目标）
				 * 3、识别函数输入有误，脚本未能发现符合条件的对象
				 * 
				 * 此API逻辑是先正向探索，正向探索至顶层依旧没有被中断的话，则折返开始反向探索。
				 * 如果反向探索至迷宫1层，仍然没有发现目标的话，会抛出异常，请检查输入函数是否有误，或者try catch后自定义逻辑
				 */
				if (!target) {
					// 如果此时为正向，则折返开始反向探索
					if (isForward) {
						console.log('探索至顶层仍未能发现目标，开始折返..')
						isForward = false
						nextStep(layerName, cb)
						return
					} else {// 如果反向也未发现目标，则抛出异常
						throw new Error('迷宫已正向+反向探索完毕，仍未找到目标，请检查。')
					}
				}

				// 如果误从迷宫入口门出去，则在外面搜索迷宫并重新进入
				let findMaze = (cb) => {
					/**
					 * 加一个延时，因为观测到迷宫刷新瞬间，cga.getRandomMazeEntrance()获取到了错误的水晶坐标。
					 * 怀疑是服务器刷新水晶入口的时间大于脚本获取的时间，导致获取到错误的坐标。
					 * 也就是说，迷宫刷新，角色被强制返回入口地图。而此时新迷宫还未刷新出来
					 */
					setTimeout(() => {
						let randomMazeArgs = {
							table: mazeInfo.posList,
							filter: (obj) => {
								return obj.cell == 3 && obj.mapx >= mazeInfo.xLimit[0] && obj.mapx <= mazeInfo.xLimit[1] && obj.mapy >= mazeInfo.yLimit[0] && obj.mapy <= mazeInfo.yLimit[1];
							},
							blacklist: [],
							expectmap: mazeInfo.prefix + '1' + mazeInfo.suffix,
						};
						cga.getRandomMazeEntrance(randomMazeArgs, (err) => {
							if (err && err.message && err.message.indexOf('没有找到迷宫入口') >= 0) {
								console.log('可能迷宫重置并未刷新，重新进行寻找...')
								setTimeout(findMaze, 3000, cb);
								return;
							}
							cb(null)
							return
						});
					}, 3000)
				}

				// 预期进入的地图，前进+1，后退-1
				let targetLayer = mazeInfo.prefix + (isForward ? regexLayer(layerName) + 1 : regexLayer(layerName) - 1) + mazeInfo.suffix

				/**
				 * 如果找到楼梯，也有几种情况：
				 * 1、正向探索时，碰到特殊情况，1层出现2个前进楼梯(如旧日迷宫1层)，其中1个为迷宫入口，如果进错了，需要返回迷宫中
				 * 2、反向探索时，碰到特殊情况，顶层出现2个后退楼梯(如旧日迷宫顶层)，其中1个为迷宫出口，如果进错了，需要返回迷宫中
				 * 3、正常进入预期的上/下一层
				 */
				cga.walkList([
					[target.x, target.y, '']
				], () => {
					cga.waitUntilMapLoaded(() => {
						let map = cga.GetMapName()
						let mapIndex = cga.GetMapIndex().index3
						if (isForward && (map == mazeInfo.entryMap || mapIndex == mazeInfo.entryMap)) {// 误入入口
							console.log('前进时误入迷宫入口，返回迷宫，将缓存数据中的此楼梯修改为迷宫入口')
							target.name = '水晶'
							target.type = 'door'
							// 删除colraw，防止被识别为楼梯
							delete target.colraw
							// 返回迷宫
							findMaze(() => {
								nextStep(layerName, cb)
							})
							return
						} else if (!isForward && (map == mazeInfo.exitMap || mapIndex == mazeInfo.exitMap)) {// 误入出口
							console.log('后退时误入迷宫出口，返回迷宫，将缓存数据中的此楼梯修改为迷宫出口')
							target.name = '水晶'
							target.type = 'door'
							// 删除colraw，防止被识别为楼梯
							delete target.colraw
							// 返回迷宫
							cga.walkList(mazeInfo.backTopPosList, () => {
								nextStep(layerName, cb)
							});
							return
						} else if (map == targetLayer) {// 正常进入预期地图
							console.log('正常进入预期地图，继续探索..')
							cb(null)
							return
						} else {// 进入预期之外的地图，抛出异常
							throw new Error('进入预期以外的地图:' + map)
						}
					});
				});
			});
		}

		let loop = () => {
			cga.waitUntilMapLoaded(() => {
				let mapindex = cga.GetMapIndex().index3
				let layerName = cga.GetMapName()

				cga.thoroughSearchMap(mazeInfo, cache, checkObj, (_, r) => {
					// 如果返回true则继续探索
					if (r === true) {
						// 将本层地图标记为完全探索
						cache[mazeInfo.name][layerName].complete = true
						// 将数据落盘
						cga.fileObj.save(file, cache)
						// 下一步动作
						nextStep(layerName, loop)
					} else if (r === false) {// 如果返回false则终止探索
						console.log('cga.thoroughSearchMap()返回', r, '中断探索迷宫')
						// 将本层地图标记为非完全探索
						cache[mazeInfo.name][layerName].complete = false
						// 将数据落盘
						cga.fileObj.save(file, cache)
						// 调用cb，返回缓存数据，结束此API
						cb(cache)
					} else if (typeof r == 'string' && r == 'no refresh') {// 如果迷宫没有刷新，还可沿用缓存数据
						// 对缓存中的对象进行处理，并处理act()之后该对象的去留。如开过的宝箱，要从缓存中删除
						cga.checkMazeCacheInternal(cache[mazeInfo.name][layerName], checkObj, (result) => {
							// 如果继续在本层探索
							if (result === true) {
								// 落盘更新状态，如开过的箱子要删除掉
								cga.fileObj.save(file, cache)
								loop()
							} else if (result === null) {// 如果checkObj.identify没有检测到需要执行动作的对象
								nextStep(layerName, loop)
							} else if (result === false) {// 如果中断探索
								// 落盘更新状态，如开过的箱子要删除掉
								cga.fileObj.save(file, cache)
								// 调用cb，返回缓存数据，结束此API
								cb(cache)
							} else {
								throw new Error('cga.checkMazeCacheInternal返回的参数错误:', result)
							}
						})
					} else {
						throw new Error('cga.thoroughSearchMap()返回的参数错误:', r)
					}
				})
			});
		}

		loop()
		return
	}

	/**
	 * UNAecho:在迷宫中打开宝箱（单人）
	 * @param {*} obj 宝箱数据，数据格式参考cga.GetMapUnits()返回数组中的Object
	 * @param {*} normalConfig 平时走迷宫探索时的战斗配置文件名，战斗完毕将恢复此配置
	 * @param {*} battleConfig 与宝箱怪战斗时的战斗配置文件名，战斗前将读取此配置
	 * @param {*} cb 
	 * @returns 
	 */
	cga.openBoxInMaze = (obj, normalConfig = '生产赶路', battleConfig = '练级', cb) => {
		// 重复开箱子的次数
		let retryCnt = 2
		// 所需的钥匙
		const keyDict = {
			'宝箱': '铜钥匙',
			'白色宝箱': '白钥匙',
			'黑色宝箱': '黑钥匙',
		}
		// 获取钥匙所在位置
		let keyPos = cga.findItem(keyDict[obj.name])
		if (keyPos == -1) {
			throw new Error('你没有对应的钥匙:' + keyDict[obj.name] + '，为了防止外层无限调用，这里抛出异常')
		}

		// 中止retry的Flag
		let stopRetry = false
		// cb返回的参数
		let result = null

		let retry = () => {
			if (!cga.isInNormalState()) {
				console.log('cga.openBoxInMaze()等待战斗..')
				setTimeout(retry, 1500)
				return;
			}
			if (stopRetry) {
				console.log('cga.openBoxInMaze()结束，result:', result)
				cga.loadBattleConfig(normalConfig)
				cb(result)
				return
			}
			cga.UseItem(keyPos);
			setTimeout(retry, 1500)
			return
		}

		let target = cga.getRandomSpace(obj.x, obj.y);
		cga.walkList([
			target,
		], () => {
			// 切换战斗配置，防止与宝箱怪战斗时逃跑
			cga.loadBattleConfig(battleConfig)

			/**
			 * 由于宝箱在系统中被视为道具，所以不会出现宝箱和道具叠加的情况
			 * 也就无需担心cga.waitSysMsg()会因为cga.TurnTo()捡起与NPC重叠的道具而直接终止监听了
			 * 
			 * 【注意】打开宝箱的瞬间，系统可能会发出2条消息
			 * 一条为【打开了宝箱】，另一条为宝箱内的内容提示，如【捡到了卡片？】
			 * 这两条消息近乎同时出现，cga.waitSysMsg()来不及反应，只能捕获1条
			 * 所以在判断msg时，要注意这件事情
			 * 
			 * 但是，如果宝箱本身是怪物，那么系统只会给出1条消息【从宝箱中出现了怪物】
			 */
			cga.waitSysMsg((msg) => {
				console.log('cga.openBoxInMaze()侦测到系统消息:' + msg)
				// 箱子内有东西，如【打开了宝箱】【捡到了卡片？】【从宝箱中出现了怪物】
				if (msg.indexOf('捡到了') != -1 || msg.indexOf('打开了宝箱') != -1 || msg.indexOf('从宝箱中出现了怪物') != -1) {
					// 中止retry
					stopRetry = true
					// 制作cga.checkMazeCacheInternal()所使用的参数
					result = 'delete and continue'
					// 中止cga.waitSysMsg()
					return false
				}
				// 如果被其他人抢先开了宝箱，防止逻辑卡住，这里设置重复次数上限
				if (msg.indexOf('没有必要使用钥匙') != -1) {
					// 开几次没有成功，则视为箱子已经消失
					if (retryCnt <= 0) {
						console.log('箱子已经消失')
						// 中止retry
						stopRetry = true
						// 通知cga.checkMazeCacheInternal()删除此箱子
						result = 'delete and continue'
						// 中止cga.waitSysMsg()
						return false
					}
					console.log('没开成功，再试' + retryCnt + '次')
					retryCnt -= 1
					return true
				}
				return true;
			});
			// 只转向一次即可
			cga.TurnTo(obj.x, obj.y);

			setTimeout(retry, 1000)
		});
		return
	}

	/**
	 * UNAecho: 生成某一点的视野范围内的坐标，多数用于查看人物所能看见的视野坐标。
	 * 比如探索迷宫时，可以大致知道人物能看到哪里。
	 * @param {*} viewDistance 视野范围，默认12
	 * @param {*} start 起点坐标，可以是cga.GetMapXY()返回的Obj类型，也可以是2维数组[123,456]类型
	 * @returns {Object} 返回一个object,数据结构为
	 * {x:
	 * 	{y:1}
	 * }
	 * 如果object.x.y==1的话，证明角色可以看到这个xy的坐标视野。
	 * 
	 * 【UNAecho更新】我在cga.thoroughSearchMap()中实现了更好的方法，此API可以弃用。
	 */
	cga.generateViewPoints = (viewDistance = 12, start) => {
		let viewPoints = {}
		let centre = {}
		if (Object.prototype.toString.call(start) == '[object Object]') {
			centre.x = start.x
			centre.y = start.y
		} else if (start instanceof Array) {
			centre.x = start[0]
			centre.y = start[1]
		}

		for (let i = -1 * viewDistance; i <= viewDistance; i++) {
			for (let j = -1 * viewDistance; j <= viewDistance; j++) {
				if (i == 0 && j == 0) {
					continue
				}
				if (viewPoints.hasOwnProperty(start.x + i)) {
					viewPoints[start.x + i][start.y + j] = 1
				} else {
					viewPoints[start.x + i] = {}
					viewPoints[start.x + i][start.y + j] = 1
				}
			}
		}
		return viewPoints
	}

	cga.getRandomMazePos = (minDistance = 12) => {
		// 坐标偏移矩阵
		let xShift = [-1, 0, 1]
		let yShift = [-1, 0, 1]

		/**
		 * 地图碰撞矩阵
		 * 注意：
		 * 1、此矩阵的xy和游戏坐标xy是相反的。
		 * 2、而cga.buildMapCollisionRawMatrix中，传送石的值其实是0，也就是可以行走
		 * 3、cga.buildMapCollisionMatrix是cga.buildMapCollisionRawMatrix经过处理后的API，无论是楼梯还是传送石，matrix数组中的xy对应的值都是1，也就是不可行走
		 * 这为判断提供了方便，因为对于此API，不管是楼梯还是传送石都需要规避。
		 */
		let collisionMatrix = cga.buildMapCollisionMatrix(true);
		let start = cga.GetMapXY();

		let foundedPoints = {}
		foundedPoints[start.x + '_' + start.y] = start;

		let findByNextPoints = (centre) => {
			let nextPoints = [];
			let push = (p) => {
				if (p.x > collisionMatrix.x_bottom && p.x < collisionMatrix.x_size && p.y > collisionMatrix.y_bottom && p.y < collisionMatrix.y_size) {
					if (collisionMatrix.matrix[p.y][p.x] === 0) {
						let key = p.x + '_' + p.y;
						if (!foundedPoints[key]) {
							foundedPoints[key] = p;
							nextPoints.push(p);
						}
					}
				}
			};

			for (let i = 0; i < xShift.length; i++) {
				for (let j = 0; j < yShift.length; j++) {
					if (i == 0 && j == 0) {
						continue
					}
					push({ x: centre.x + xShift[i], y: centre.y + yShift[j] });
				}
			}
			nextPoints.forEach(findByNextPoints);
		};

		// 缓存点
		let pointCache = null
		// 最终结果
		let resultPoints = {}
		/**
		 * UNAecho:剔除大量坐标中，相互距离小于minDistance的点
		 * 比如当minDistance = 12时，站在点[1,2]是可以看到[12,13]坐标的物体。
		 * 如果在探索地图的时候，[1,2]或者[12,13]，我们保留1个即可，因为不论走到哪一个位置，都能看到对方。
		 * 如果有大量的坐标密集地等待探索，那么就会发生不断在一个已经探索过的地方反复走重复的路（无效走路过多，因为待走的坐标都很密集）
		 * 此方法利用一个缓存点pointCache和一个结果集，来实现只保留距离大于minDistance的点。（有点类似支持向量机margin的味道）
		 * @param {*} minDistance 视野距离，默认12
		 * @param {*} points 待剔除的候选集
		 * @returns 
		 */
		let removeDuplicate = (points, minDistance = 12) => {
			// 先遍历，剔除掉与缓存点距离小于minDistance的点。
			let tmpPoints = points.filter((p) => {
				// 如果上一次缓存已经被清除，此点将成为下一个缓存点
				if (pointCache === null) {
					pointCache = p
				}
				if (cga.projectDistance(pointCache.x, pointCache.y, p.x, p.y) < minDistance) {
					return false
				}
				return true
			})
			// 如果缓存坐标不是人物站立的坐标，则加入候选集。
			if (pointCache.x != start.x || pointCache.y != start.y) {
				resultPoints[pointCache.x + '_' + pointCache.y] = pointCache
			}
			// 剔除完毕，清除缓存点
			pointCache = null
			// 如果递归至所有点已经遍历完毕，算法结束。时间复杂度O(n = points.length)
			if (tmpPoints.length == 0) {
				return resultPoints
			}
			// 如果没有遍历全部点，则将剔除后的结果集递归至next
			return removeDuplicate(tmpPoints, minDistance)
		}

		findByNextPoints(start);
		return removeDuplicate(Object.values(foundedPoints), minDistance)
	}

	/**
	 * UNAecho:获取一格(x,y)周围1x1区域的xy坐标范围
	 * 比如输入[2,7],返回[[1,3],[6,8]]。
	 * 
	 * 【注意】此API优先考虑效率，所以并不会判断墙壁、坐标是否可以抵达、返回坐标范围是否超出地图边界。
	 * @param {Array} pos 
	 * @returns Array<Array<number>> 长度为2的二维数组，0是x轴范围数组，1是轴范围数组。范围数组：0是左区间，1是右区间
	 * [[1,3],[6,8]]代表x轴范围为1-3，y轴范围6-8。
	 */
	cga.getPosAroundRange = (pos) => {
		if (!pos instanceof Array || pos.length != 2) {
			throw new Error('参数错误，pos必须为长度为2的int型数组')
		}

		return [[pos[0] - 1, pos[0] + 1], [pos[1] - 1, pos[1] + 1]];
	}

	/**
	 * UNAecho:判断人物是否处于参数坐标的1x1范围内
	 * 不包含人物与参数坐标重叠，因为这样无法与参数坐标的单位进行互动（如NPC对话、玩家加入队伍）重叠时，返回false。
	 * @param {Array|Object} posObj 目标坐标，必传，长度为2的int型数组，或者是包含mapindex的key与一维int型数组填充的二维数组组成的Object
	 * Object数据格式举例：UD任务中，多次出现与NPC对话导致队员离队，此时需要判断人物是否在指定mapindex的各个NPC周围。
	 * {
		24003:[[11, 75],[111, 34],],
		24004:[[9, 17],[135, 78],],
		24005:[[16, 82],[82, 43]],
		}
	 * 在这些坐标的1x1附近，cga.isAroundPos会返回true。
	 * @param {Object} posObj 检测对象，可以传入一维数组，也可以传入Object。数据结构：
	 * 1、传入一维数组时。类似[2,5]这样的数组，可以判断人物是否站在这个坐标周围。
	 * 2、传入Object时，要求如下：
	 * key为地图index，value为二维数组，可以判断角色是否在地图index下的各个坐标周围
	 * 例：
	 * {
			402: [[1,3],[2,5]],
			24008: [[111,222],[333,123]],
		}
	 * @param {Object} xy 人物坐标，数据结构与cga.GetMapXY()返回结果一致。可以自定义。如果不传，默认使用人物当前坐标
	 * @param {Boolean} containCenter 是否包含检测坐标。因为想要与NPC对话，人物不可以站在与NPC重叠的位置。此时需要将重叠情况视为false。
	 * 但有时则不然，例如检测人物是否在某个坐标1x1内，这时需要将重叠情况视为true。
	 * @returns 
	 */
	cga.isAroundPos = (posObj, xy = null, containCenter = false) => {
		if (!posObj instanceof Array || (typeof posObj[0] == 'number' && posObj.length != 2) || (Object.prototype.toString.call(posObj) == '[object Object]' && Object.keys(posObj).length == 0)) {
			throw new Error('参数错误，pos必须为长度为2的int型一维数组；或者是Object，key是地图index，value是一维int型数组填充的二维数组')
		}
		if (xy == null) {
			xy = cga.GetMapXY();
		}
		// 如果pos是一维数组，仅检测1个坐标
		if (typeof posObj[0] == 'number') {
			let range = cga.getPosAroundRange(posObj)
			return xy.x >= range[0][0] && xy.x <= range[0][1] && xy.y >= range[1][0] && xy.y <= range[1][1] && !(xy.x == posObj[0] && xy.y == posObj[1])
		} else if (Object.prototype.toString.call(posObj) == '[object Object]') {// 如果pos是二维数组，需要检测多个坐标
			let mapindex = cga.GetMapIndex().index3

			if (!posObj[mapindex]) {
				console.log('posObj没有当前地图坐标:', mapindex, '返回false')
				return false
			}

			let mapindexes = Object.keys(posObj)

			return mapindexes.some(index => {
				return posObj[index].some(p => {
					let range = cga.getPosAroundRange(p)
					if (containCenter) {
						return xy.x >= range[0][0] && xy.x <= range[0][1] && xy.y >= range[1][0] && xy.y <= range[1][1]
					}
					// 人物处于范围内，并且不与p的坐标重叠（重叠就没法与NPC对话了）
					return xy.x >= range[0][0] && xy.x <= range[0][1] && xy.y >= range[1][0] && xy.y <= range[1][1] && !(xy.x == p[0] && xy.y == p[1])
				})
			})
		} else {
			throw new Error('参数错误，pos:', posObj)
		}
	}

	/**
	 * UNAecho:获取一格(x,y)周围1x1区域内的空闲地形格子
	 * 修正bug:添加可达判断，如果空闲格子无法抵达(比如门、柜台的另一侧等)，则跳过此格子，因为没有意义。
	 * @param {*} x 
	 * @param {*} y 
	 * @returns 
	 */
	cga.getRandomSpace = (x, y) => {
		let walls = cga.buildMapCollisionMatrix(true);
		let XY = cga.GetMapXY();

		if (walls.matrix[y][x - 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x - 1, y))
			return [x - 1, y];
		if (walls.matrix[y][x + 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x + 1, y))
			return [x + 1, y];
		if (walls.matrix[y - 1][x] == 0 && cga.isPathAvailable(XY.x, XY.y, x, y - 1))
			return [x, y - 1];
		if (walls.matrix[y + 1][x] == 0 && cga.isPathAvailable(XY.x, XY.y, x, y + 1))
			return [x, y + 1];
		if (walls.matrix[y + 1][x + 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x + 1, y + 1))
			return [x + 1, y + 1];
		if (walls.matrix[y + 1][x - 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x - 1, y + 1))
			return [x - 1, y + 1];
		if (walls.matrix[y - 1][x + 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x + 1, y - 1))
			return [x + 1, y - 1];
		if (walls.matrix[y - 1][x - 1] == 0 && cga.isPathAvailable(XY.x, XY.y, x - 1, y - 1))
			return [x - 1, y - 1];

		return null;
	}

	/**
	 * UNAecho:获取一格(x,y)周围1x1区域内的空闲地形的2个格子，多用于组队和NPC对话
	 * 修正bug:添加可达判断，如果空闲格子无法抵达(比如门、柜台的另一侧等)，则跳过此格子，因为没有意义。
	 * @param {*} x 
	 * @param {*} y 
	 * @returns 
	 */
	cga.get2RandomSpace = (x, y) => {
		let walls = cga.buildMapCollisionMatrix(true);
		let XY = cga.GetMapXY();
		let result = []
		let pos = []

		// UNAecho:优化写法，原来穷举8个方向的方式不够灵活
		let xShift = [-1, 0, 1]
		let yShift = [-1, 0, 1]

		for (let i of xShift) {
			for (let j of yShift) {
				// xy均等于0，站在NPC坐标是无法对话的。
				if (i == 0 && j == 0) {
					continue
				}
				// 地图边缘
				if (x + i < 0 || y + j < 0) {
					continue
				}
				if (walls.matrix[y + j][x + i] == 0 && cga.isPathAvailable(XY.x, XY.y, x + i, y + j)) {
					pos.push([x + i, y + j])
				}
			}
		}

		if (pos.length <= 1) {
			throw new Error('NPC周围最多可能只有一格空闲地形，无法返回多个坐标。')
		}
		// 第一次优先找x或y轴相邻的坐标
		for (var i in pos) {
			for (var j in pos) {
				if (pos[i][0] == pos[j][0] && pos[i][1] == pos[j][1])
					continue
				if (result.length < 2
					&& (Math.abs(pos[i][0] - pos[j][0]) < 2 && Math.abs(pos[i][1] - pos[j][1]) < 2)
					&& (Math.abs(pos[i][0] - pos[j][0]) == 0 || Math.abs(pos[i][1] - pos[j][1]) == 0)
				) {
					result.push(pos[i], pos[j])
					return result
				}
			}
		}
		// 如果没找到相邻的空闲格子，就找x与y都不相等的斜方向格子
		for (var i in pos) {
			for (var j in pos) {
				if (pos[i][0] == pos[j][0] && pos[i][1] == pos[j][1])
					continue
				if (result.length < 2 && (Math.abs(pos[i][0] - pos[j][0]) < 2 && Math.abs(pos[i][1] - pos[j][1]) < 2)) {
					result.push(pos[i], pos[j])
					return result
				}
			}
		}

		if (pos.length > 1 && !result.length) {
			throw new Error('NPC周围有1格以上的空间可站立，但这些空间并不相连。cga.get2RandomSpace()判定为只有一格可与其进行对话')
		}

		return null
	}

	/**
	 * UNAecho:获取一格(x,y)周围0x2区域内的空闲地形格子，用于无法直接抵达1x1范围内的NPC。
	 * 比如驯兽师职业导师站在柜台后面，虽然周围有 cga.buildMapCollisionMatrix()==0 的格子，但无法抵达。
	 * 这时需要找到一个坐标，可以与其隔着柜台对话。
	 * 原理是获取0x2坐标，在x或y轴+2判断是否有可抵达的空闲格子
	 * @param {*} x 
	 * @param {*} y 
	 * @returns 
	 */
	cga.getRandomSpaceThroughWall = (x, y) => {
		let walls = cga.buildMapCollisionMatrix(true);
		let XY = cga.GetMapXY();

		let xShift = [-2, 0, 2]
		let yShift = [-2, 0, 2]

		for (let i of xShift) {
			for (let j of yShift) {
				// xy等于正负2，此时人物与NPC是斜方向，无法对话，舍弃。
				// xy均等于0，站在NPC坐标是无法对话的。而且使用这个API，NPC本身就是无法抵达的。
				if (i + j == 0) {
					continue
				}
				// (x == x + i && y == y + j ) 意思是必须与NPC处于一条轴上，不允许斜着对话，因为并不是在1x1的范围内对话，斜着无法触发NPC。
				if (walls.matrix[y + j][x + i] == 0 && (x == x + i || y == y + j) && cga.isPathAvailable(XY.x, XY.y, x + i, y + j)) {
					return [x + i, y + j]
				}
			}
		}

		return null;
	}

	//获取一格(x,y)周围1x1区域内的空闲地形格子，并判断其方向
	cga.getRandomSpaceDir = (x, y) => {
		var walls = cga.buildMapCollisionMatrix(true);
		if (walls.matrix[y][x - 1] == 0)
			return 4;
		if (walls.matrix[y][x + 1] == 0)
			return 0;
		if (walls.matrix[y - 1][x] == 0)
			return 6;
		if (walls.matrix[y + 1][x] == 0)
			return 2;
		if (walls.matrix[y + 1][x + 1] == 0)
			return 1;
		if (walls.matrix[y + 1][x - 1] == 0)
			return 3;
		if (walls.matrix[y - 1][x + 1] == 0)
			return 7;
		if (walls.matrix[y - 1][x - 1] == 0)
			return 5;

		return null;
	}

	cga.tradeInternal = (stuff, checkParty, resolve, playerName, timeout) => {

		var savePartyName = null;
		var tradeFinished = false;
		var receivedStuffs = {};
		var beginTime = (new Date()).getTime();

		var waitTradeMsg = () => {

			cga.waitSysMsg((msg) => {

				if (tradeFinished)
					return false;

				if (msg.indexOf('交易完成') >= 0) {
					tradeFinished = true;
					resolve({
						success: true,
						received: receivedStuffs,
						reason: '交易成功',
					});
					return false;
				} else if (msg.indexOf('交易中止') >= 0) {

					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason: '交易被拒绝',
					});
					return false;
				} else if (msg.indexOf('因物品栏已满所以无法交易') >= 0) {

					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason: '物品栏已满',
					});
					return false;
				} else if (msg.indexOf('没有可交易的对象') >= 0) {
					cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
					tradeFinished = true;
					resolve({
						success: false,
						reason: '没有可交易的对象',
					});
					return false;
				}

				return true;
			});
		}

		/**
		 * UNAecho:原版API有bug，姑且认为是bug吧。
		 * bug描述：如果交易中出现物品、金币、宠物多种类别时，receivedStuffs中只会出现1种数据。
		 * 1、优先顺序为物品、宠物、宠物技能、金币。
		 * 3、举例：如果此次交易中包含物品和金币，那么receivedStuffs中只会有【物品】一种数据。
		 * 4、举例：如果此次交易中包含宠物和金币，那么receivedStuffs中只会有【宠物】一种数据。
		 * 造成这种原因，是因为：
		 * 1、由于waitTradeStuffs()中，cga.AsyncWaitTradeStuffs这个API，只会获取1次数据，此次数据顺序使用if else判断
		 * 2、如果此次交易类型为物品、宠物、宠物技能、金币其中一个，if else逻辑会命中，然后不再继续获取其它类型的东西。
		 * 
		 * UNAecho修复逻辑：
		 * 只要还能读到args，就继续读下去，直至读取不到args为止。
		 * 由于首次读取到args时，getInTradeStuffs即被置为true。
		 * 所以当if(!args)时，不会进入if(getInTradeStuffs == false && !tradeFinished)的代码块内，而是直接return。
		 * 此时receivedStuffs包含了之前遗漏的所有数据。
		 * 
		 * 这么做是因为，当交易内容出现宠物的时候，【宠物】和【宠物技能】都会占据一次cga.AsyncWaitTradeStuffs
		 * cga.AsyncWaitTradeStuffs只能读取一种type信息。
		 * 1只宠物要占据2次cga.AsyncWaitTradeStuffs，如果此次交易还包含多个物品、金币等，就会出现漏读的现象
		 * 所以选用了【只要还能读到args，就继续读下去，直至读取不到args为止。】这种方式。
		 * 
		 * 更新：还有另外一个宠物数据的bug，下面代码处会提及。
		 */
		var waitDialog = () => {

			if (tradeFinished)
				return;

			var getInTradeStuffs = false;
			var tradeStuffsChecked = false;

			var waitTradeStuffs = () => {

				cga.AsyncWaitTradeStuffs((err, type, args) => {

					if (!args) {

						if (getInTradeStuffs == false && !tradeFinished)
							waitTradeStuffs();

						return;
					}

					if (type >= cga.TRADE_STUFFS_ITEM && type <= cga.TRADE_STUFFS_GOLD)
						console.log('正在等待获取交易内容：' + cga.TRADE_STUFFS_TRANSLATION[type]);

					getInTradeStuffs = true;

					if (type == cga.TRADE_STUFFS_ITEM) {
						receivedStuffs.items = args;
					}
					/**
					 * UNAecho:这里原作者出现了比较大的bug
					 * receivedStuffs.pet在首次判定宠物时，初始化为[]，并将宠物信息加入，这没有问题
					 * 但是一次交易出现1个以上宠物时，再次进入此逻辑，已经有数据的receivedStuffs.pet会被再次初始化为[]，丢失了之前的所有信息
					 * 所以此bug会导致不论交易多少只宠物，最后都只会剩1只
					 * 
					 * 修复逻辑：判定receivedStuffs.pet有数据时，不能初始化，只加入数据。
					 */
					else if (type == cga.TRADE_STUFFS_PET) {
						if (!receivedStuffs.pet) {
							receivedStuffs.pet = [];
						}
						receivedStuffs.pet[args.index] = args;
					} else if (type == cga.TRADE_STUFFS_PETSKILL) {
						if (!(receivedStuffs.pet instanceof Array))
							receivedStuffs.pet = [];
						if (receivedStuffs.pet[args.index])
							receivedStuffs.pet[args.index].skills = args;
					} else if (type == cga.TRADE_STUFFS_GOLD) {
						receivedStuffs.gold = args;
					}
					// UNAecho:只要还能读到args，就继续读下去，直至读取不到args为止。
					waitTradeStuffs()
				}, 1000);
			}

			var waitTradeState = () => {

				cga.AsyncWaitTradeState((err, state) => {

					if (tradeFinished)
						return;

					var timeout_trade = (typeof timeout == 'number') ? timeout : 30000;
					if ((new Date()).getTime() > beginTime + timeout_trade) {
						tradeFinished = true;
						cga.DoRequest(cga.REQUEST_TYPE_TRADE_REFUSE);
						resolve({
							success: false,
							reason: '交易被拒绝',
						});
						return;
					}

					if (state != undefined)
						console.log('交易状态变更为：' + cga.TRADE_STATE_TRANSLATION[state]);

					if (!err) {
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
				return { itemid: e.itemid, itempos: e.pos, count: (e.count > 1 ? e.count : 1) };
			});

			const tracePets = cga.GetPetsInfo().filter(petFilter).map((e) => {
				return e.index;
			});

			cga.TradeAddStuffs(
				tradeItems,
				tracePets,
				(stuff && stuff.gold) ? stuff.gold : 0
			);
		}

		cga.AsyncWaitTradeDialog((err, partyName, partyLevel) => {

			if (tradeFinished)
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
					reason: '等待交易对话框超时',
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

			if (resulted)
				return false;

			if (err) {

				resulted = true;

				resolve({
					success: false,
					reason: '等待交易玩家选择菜单超时',
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
					reason: '未找到目标交易对象',
				});

			}
		}, 5000);

		cga.waitSysMsgTimeout((err, msg) => {

			if (resulted)
				return false;

			if (err)
				return false;

			if (msg && msg.indexOf('没有可交易的对象！') >= 0) {
				resulted = true;

				resolve({
					success: false,
					reason: '没有可交易的对象',
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
			if (resulted)
				return;

			if (err) {
				resulted = true;

				resolve({
					success: false,
					reason: '等待交易玩家选择菜单超时',
				});

				return;
			}

			if (!(players instanceof Array)) players = [];
			var player = players.find((e, index) => typeof name == 'number' ? index == name : e.name == name);
			if (player !== undefined) {

				resulted = true;

				resolve({ success: true });

				cga.PlayerMenuSelect(player.index);

			} else {

				resulted = true;

				resolve({
					success: false,
					reason: '未找到目标交易对象',
				});

			}
		}, 5000);

		cga.waitSysMsgTimeout((err, msg) => {

			if (resulted)
				return false;

			if (err)
				return false;

			if (msg && msg.indexOf('没有可交易的对象！') >= 0) {
				resulted = true;

				resolve({
					success: false,
					reason: '没有可交易的对象',
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
	cga.needSupplyInitial = (obj) => {
		var playerinfo = cga.GetPlayerInfo();
		var petinfo = cga.GetPetInfo(playerinfo.petid);

		if (!obj)
			obj = {};

		if (!obj.playerhp)
			obj.playerhp = 1.0;
		if (!obj.playermp)
			obj.playermp = 1.0;
		if (!obj.pethp)
			obj.pethp = 1.0;
		if (!obj.petmp)
			obj.petmp = 1.0;

		if (playerinfo.hp < playerinfo.maxhp * obj.playerhp ||
			playerinfo.mp < playerinfo.maxmp * obj.playermp ||
			petinfo.hp < petinfo.maxhp * obj.playerhp ||
			petinfo.mp < petinfo.maxmp * obj.playermp)
			return true;

		return false;
	}

	//判断是否需要找医生治疗
	cga.needDoctor = () => {
		var playerinfo = cga.GetPlayerInfo();
		var pets = cga.GetPetsInfo();

		if (playerinfo.health > 0)
			return true;

		for (var i = 0; i < pets.length; ++i) {
			if (pets[i].health > 0)
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
	cga.findbattlepet = () => {
		index = -1
		maxhp = 1
		maxlv = 1
		var pets = cga.GetPetsInfo();

		for (var i = 0; i < pets.length; ++i) {
			// 受伤宠物、忠诚低于40宠物不参与出战
			if (pets[i].health != 0 || pets[i].loyality < 40)
				continue

			if (pets[i].level == maxlv) {
				if (pets[i].maxhp > maxhp) {
					index = pets[i].index
					maxhp = pets[i].maxhp
				} else {
					continue
				}
			} else if (pets[i].level > maxlv) {
				index = pets[i].index
				maxlv = pets[i].level
			}
		}

		return index;
	}

	//等待战斗结束
	cga.waitForBattleEnd = (cb, timeout = 30000) => {

		cga.AsyncWaitBattleAction((err, result) => {
			if (err) {
				cb(err);
				return;
			}
			if (result == cga.FL_BATTLE_ACTION_END) {
				setTimeout(cb, 1000, null, true);
			}
			else {
				cga.waitForBattleEnd(cb, timeout);
			}
		}, timeout);
	}

	cga.gui = {};

	cga.gui.port = null;

	cga.gui.init = () => {
		if (!cga.gui.port) {
			var p = process.env.CGA_GUI_PORT;

			if (!p || !parseInt(p))
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
	cga.gui.GetGameProcInfo = (cb) => {

		cga.gui.init();

		request.get({
			url: "http://127.0.0.1:" + cga.gui.port + '/cga/GetGameProcInfo',
			json: true,
		},
			function (error, response, body) {
				if (error) {
					cb(error);
					return;
				}
				if (response.statusCode && response.statusCode == 200) {
					try {
						cb(null, body);
						return;
					} catch (e) {
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
	cga.gui.GetSettings = (cb) => {

		cga.gui.init();

		request.get({
			url: "http://127.0.0.1:" + cga.gui.port + '/cga/GetSettings',
			json: true,
		},
			function (error, response, body) {
				if (error) {
					cb(error);
					return;
				}
				if (response.statusCode && response.statusCode == 200) {
					try {
						cb(null, body);
						return;
					} catch (e) {
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
	cga.gui.LoadSettings = (settings, cb) => {

		cga.gui.init();

		request.post({
			url: "http://127.0.0.1:" + cga.gui.port + '/cga/LoadSettings',
			json: true,
			body: settings
		},
			function (error, response, body) {
				if (error) {
					cb(error);
					return;
				}
				if (response.statusCode && response.statusCode == 200) {
					try {
						cb(null, body);
						return;
					} catch (e) {
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
			autorestart : 2, //自动重启脚本全开=2,半开=1,关闭=0
			autoterm : true, //自动关闭脚本开启
			injuryprot : true, //受伤保护开启
			soulprot : true, //掉魂受伤保护开启
		}, (err, result)=>{
			console.log(result);
		})
	*/
	cga.gui.LoadScript = (arg, cb) => {

		cga.gui.init();

		request.post({
			url: "http://127.0.0.1:" + cga.gui.port + '/cga/LoadScript',
			json: true,
			body: arg
		},
			function (error, response, body) {
				if (error) {
					cb(error);
					return;
				}
				if (response.statusCode && response.statusCode == 200) {
					try {
						cb(null, body);
						return;
					} catch (e) {
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
			character : 1, //1左边，2右边
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
	cga.gui.LoadAccount = (arg, cb) => {

		cga.gui.init();

		request.post({
			url: "http://127.0.0.1:" + cga.gui.port + '/cga/LoadAccount',
			json: true,
			body: arg
		},
			function (error, response, body) {
				if (error) {
					cb(error);
					return;
				}
				if (response.statusCode && response.statusCode == 200) {
					try {
						cb(null, body);
						return;
					} catch (e) {
						cb(e);
						return;
					}
				} else {
					cb(new Error('HTTP 请求失败'));
					return;
				}
			});
	}

	/**
	 * UNAecho: 开发一个静态搜索账号的API
	 * 由于CGA是不可以读取玩家的账号密码的，此API旨在使用半手动的方式获取玩家与账号的关联
	 * 实现方式：
	 * 1、玩家需要自行在./常用数据/AccountInfos.js中输入自己的账号信息。
	 * 【注意】不要将此文件进行提交，否则会泄露账号信息。
	 * 2、AccountInfos.js中的数据格式参考：
	 * 	{
		category: '仓库',
		info:[
				{	user:通行证账号,
					pwd:通行证密码,
					gid: {
						'子账号1' : {name:['UNAの仓库01','UNAの仓库02']},
					},
				},
				{	user:'',
					pwd:'',
					gid: {},
				},
		],
		},	
	{
		category: '生产',
		info:[
				{	user:通行证账号,
					pwd:通行证密码,
					gid: {
						'子账号1' : {name:['UNAの生产01','UNAの生产02']},
					},
				},
				{	user:'',
					pwd:'',
					gid: {},
				},
		],
	},
	 * 此API会根据游戏玩家名称来关联对应的账号密码。
	 * @param {String|Function} filter 过滤逻辑。可以是String也可以是Function
	 * String：默认，通过玩家名称来索引账号信息。如果输入空串或不输入，默认搜索当前人物的账号信息。
	 * Function：通过自定义函数来索引账号信息
	 * @returns {}
	 * 如果filter使用自定义Function，返回值建议使用以下格式。
	 * { category: '仓库', user: 'UNAecho', pwd: '12345', gid: 'archer', character: 0 }
	 * 其中：
	 * 1、category代表自定义账号类型，可自行在AccountInfos.js划分账号类别。
	 * 2、character代表人物在左还是右，1左2右。
	 */
	cga.gui.getAccount = (filter) => {
		let accounts = require('./常用数据/AccountInfos.js');

		let func = null
		if (!filter || typeof filter == 'string') {
			let playerName = filter ? filter : cga.GetPlayerInfo().name;
			func = (accounts) => {
				let res = {}

				for (let categoryObj of accounts) {
					// ai : accountIndex
					for (let ai in categoryObj.info) {
						let account = categoryObj.info[ai]
						// gi : gidIndex
						for (let gi in account.gids) {
							let gidObj = account.gids[gi]
							for (let name of gidObj.name) {
								if (name == playerName) {
									res.category = categoryObj.category
									res.user = account.user
									res.pwd = account.pwd
									res.gid = gidObj.gid
									// 人物在左还是右，1左2右。
									res.character = gidObj.name.indexOf(playerName) + 1
									// 子账号所在账号的索引数字
									res.accountIndex = parseInt(ai)
									// 子账号索引数字
									res.gidIndex = parseInt(gi)
									// 角色名称所在数组的索引数字
									res.characterIndex = gidObj.name.indexOf(playerName)
									return res
								}

							}

						}

					}

				}

				if (Object.keys(res).length == 0) {
					throw new Error('没有找到对应账号，请检查账号信息或输入信息是否有误。')
				}

				return null
			}
		} else if (typeof filter == 'function') {
			func = filter
		} else {
			throw new Error('filter类型错误')
		}

		return func(accounts)
	}
	/**
	 * UNAecho:一个计算账号偏移的API
	 * 具体功能为：找出AccountInfos.js中与当前玩家所在账号【相同分类(category)】下的其它账号。
	 * 根据偏移量bias来锁定偏移几个角色。
	 * 举例：假设当前账号所在的category信息为：
	 * 	{
		category: '仓库',
		info:[
				{	user:'account1',
					pwd:'account1',
					gids: [ 
						{ gid : 'saber1', name : ['UNAの剑士','UNAの剑士2'], },
						{ gid : 'saber2', name : ['UNAの剑士3','UNAの剑士4'], },
					],
				},
				{	user:'account2',
					pwd:'account2',
					gids: [
						{ gid : 'saber3', name : ['UNAの剑士5','UNAの剑士6'], },
						{ gid : 'saber4', name : ['UNAの剑士7','UNAの剑士8'], },
						{ gid : 'saber5', name : ['UNAの剑士9','UNAの剑士10'], },
					],
				},
				{	user:'account3',
					pwd:'account3',
					gids: [
						{ gid : 'saber6', name : ['UNAの剑士11','UNAの剑士12'], },
					],
				},
		],
	},
	 * 当前人物名称为【UNAの剑士】
	 * 那么当你调用cga.gui.getAccountWithBias(1)时，会返回你账号右边的UNAの剑士2角色信息，直接可以使用cga.gui.LoadAccount切换账号。
	 * 同理，当你调用cga.gui.getAccountWithBias(-1)时，会返回UNAの剑士12的信息。
	 * bias>0时偏移为顺序，bias<0时，偏移为逆序。
	 * 
	 * 当你调用cga.gui.getAccountWithBias(2)时，由于当前gid:'saber1'这个子账号最多只有1个偏移(UNAの剑士2)
	 * 所以会顺序返回当前账号的下一个子账号符合条件的人物，也就是UNAの剑士3。
	 * 
	 * 当你调用cga.gui.getAccountWithBias(5)时，由于当前user:'account1'这个账号最多只有3个偏移(UNAの剑士2-4)
	 * 所以会顺序往下找到下一个账号user:'account2'，并继续消耗偏移，直至偏移耗尽，返回UNAの剑士6的账号信息。
	 * 
	 * bias<0时同理，只不过为逆序查找。cga.gui.getAccountWithBias(-5)会逆序查找5个账号，返回UNAの剑士8的账号信息。
	 * 
	 * 此方法多数用于仓库调整账号寻找某种资源，比如挨个查找哪个账号有十年戒指、血瓶、装备等等。
	 * 
	 * @param {Number} bias 偏移数量，必须为int型，为正则顺序查找，为负则逆序查找。
	 * @returns 
	 */
	cga.gui.getAccountWithBias = (bias) => {
		if (typeof bias != 'number') {
			throw new Error('bias类型错误，必须为int型数字')
		}

		let accountsData = require('./常用数据/AccountInfos.js');
		let myAccount = cga.gui.getAccount()

		let accounts = null
		// ci : categoryIndex
		for (let ci in accountsData) {
			// 选择与当前账号category一致的账号组
			if (accountsData[ci].category == myAccount.category) {
				accounts = accountsData[ci].info
				break
			}
		}

		if (!accounts) {
			throw new Error('category【' + category + '】有误，文件中不存在此分类')
		}

		// 账号完整度检查
		for (let a of accounts) {
			if (typeof a.user != 'string' || typeof a.pwd != 'string' || !a.gids instanceof Array) {
				throw new Error('user,pwd类型必须为string，gids必须为Array')
			}
			if (!a.user || !a.pwd || !a.gids) {
				// console.log('user:',a.user,'pwd:',a.pwd)
				// console.log('gids:',a.gids)
				// console.log('以上账号数据有误，跳过。')
				continue
			}
			// 跳过没有角色登记的账号
			if (a.gids.length == 0) {
				// console.log('user:',a.user,'pwd:',a.pwd)
				// console.log('gids:',a.gids)
				// console.log('以上账号没有子账号数据，跳过。')
				continue
			}
			for (let g of a.gids) {
				if (!g.gid) {
					throw new Error('子账号gid不能为空')
				}
				if (!g.name instanceof Array) {
					throw new Error('子账号name必须为数组形式，可以为空数组。')
				}
			}
		}

		// 递归，初始化的账号为当前游戏角色的账号信息。
		let loop = (currentAccount, remainBias) => {
			// 首先看accountIndex
			// 根据当前递归对象传来的accountIndex来获取当前偏移到哪个账号了
			let curAcc = accounts[currentAccount.accountIndex]
			// 如果数组越界，则视偏移的正负判断回滚到左边缘还是右边缘
			if (!curAcc) {
				// console.log('accountIndex:',currentAccount.accountIndex,'数组越界，回滚至',remainBias > 0 ? '左':'右','边界')
				currentAccount.accountIndex = remainBias > 0 ? 0 : accounts.length - 1
				curAcc = accounts[currentAccount.accountIndex]
			}
			// 检查异常账户，如果有异常则跳过
			if (!curAcc.user || !curAcc.pwd || !curAcc.gids instanceof Array || !curAcc.gids.length) {
				// console.log('account:',curAcc,'异常，跳过此次递归。')
				currentAccount.accountIndex = (remainBias > 0 ? currentAccount.accountIndex + 1 : currentAccount.accountIndex - 1)
				return loop(currentAccount, remainBias)
			}
			// 接下来看gidIndex
			// 如果gidIndex为null，那么必然是发生账号左移。因为不知道左边账号有多少个gids。
			// 如果gid有值，则视为账号没有发生切换。
			if (currentAccount.gidIndex == null) {
				// 告诉gidIndex当前账号的右闭区间index是多少
				currentAccount.gidIndex = curAcc.gids.length - 1
			}
			// 然后根据gidIndex获取当前偏移到的gid
			let curGid = curAcc.gids[currentAccount.gidIndex]
			// 获取当前偏移账号的游戏角色名称数组
			let curNameArr = curGid.name

			// 然后看characterIndex
			// 与gidIndex逻辑一样，如果characterIndex为null，则视为发生了账号左移
			if (currentAccount.characterIndex == null) {
				currentAccount.characterIndex = curNameArr.length
			}
			// 如果剩余偏移量可被当前子账号消耗掉，那么返回当前账号结果，loop结束
			if (curNameArr[currentAccount.characterIndex + remainBias] != undefined) {
				currentAccount.user = curAcc.user
				currentAccount.pwd = curAcc.pwd
				currentAccount.gid = curAcc.gids[currentAccount.gidIndex].gid
				// currentAccount.gids = curAcc.gids
				// 将index转换为character该有的数值（1或2）
				currentAccount.character = currentAccount.characterIndex + remainBias + 1

				// 顺便把目标角色名称加进去。
				currentAccount.name = curNameArr[currentAccount.characterIndex + remainBias]

				// 最后，characterIndex顺便也修正数值，但是外部只需要关注character的值即可。
				currentAccount.characterIndex = currentAccount.characterIndex + remainBias
				return currentAccount
			} else {// 如果剩余偏移量会导致当前账号数组越界，则还需要再次切换账号或子账号
				// 偏移剩余量大于0，往右偏的情况
				if (remainBias > 0) {
					// 当前的子账号能消耗掉多少的偏移
					remainBias = remainBias - (curNameArr.length - 1 - currentAccount.characterIndex)
					currentAccount.characterIndex = -1
					currentAccount.gidIndex += 1
					if (curAcc.gids[currentAccount.gidIndex] != undefined) {
						return loop(currentAccount, remainBias)
					} else {
						currentAccount.gidIndex = 0
						currentAccount.accountIndex += 1
						return loop(currentAccount, remainBias)
					}
				} else if (remainBias < 0) {// 偏移剩余量小于0，往左偏的情况
					remainBias = remainBias + (currentAccount.characterIndex - 0)
					currentAccount.characterIndex = null
					currentAccount.gidIndex -= 1
					if (curAcc.gids[currentAccount.gidIndex] != undefined) {
						return loop(currentAccount, remainBias)
					} else {
						currentAccount.gidIndex = null
						currentAccount.accountIndex -= 1
						return loop(currentAccount, remainBias)
					}
				} else {// remainBias == 0
					throw new Error('loop逻辑不应该出现在这里，请检查')
				}
			}
		}

		return loop(myAccount, bias)
	}

	cga.getrootdir = () => {

		var temppath = __dirname
		var count = 0
		while (count < 10) {
			if (fs.readdirSync(temppath).indexOf("cgaapi.js") != -1) {
				// console.log("根目录已找到："+ temppath)
				break
			} else {
				temppath = path.join(temppath, '../')
			}
			count += 1
		}
		return temppath
	}

	// 金属名称
	cga.METALNAME = ['铜', '铁', '银', '铝', '纯银', '金', '白金', '幻之钢', '幻之银', '稀有金属', '勒格耐席鉧', '奥利哈钢',]

	// 布类名称
	cga.FABRICNAME = ['麻布', '木棉布', '毛毡', '绵', '细线', '绢布', '莎莲娜线', '杰诺瓦线', '阿巴尼斯制的线', '阿巴尼斯制的布', '细麻布', '开米士毛线',]

	cga.isMetalName = (name) => {
		return cga.METALNAME.indexOf(name) != -1
	}

	cga.isRefinedMetalName = (name) => {
		return cga.isMetalName(name) && name.endsWith('条')
	}

	cga.isFabricName = (name) => {
		return cga.FABRICNAME.indexOf(name) != -1
	}

	/**
	 * UNAecho:获取制造物品的各种信息。
	 * 其中raw_name代表物品原材料的名称。暂时只支持1个物品返回1个原材料。例如铜条的原材料是铜。如果没有，则name与raw_name一致
	 * @param {*} name 
	 * @returns 
	 */
	cga.getMaterialInfo = (name) => {
		result = {
			// 物品名称
			name: name,
			// 物品原材料名称
			raw_name: name,
		}
		if (cga.isRefinedMetalName(result.name)) {
			result.raw_name = result.name.replace('条', '')
		}
		return result
	}

	/**
	 * UNAecho:搜索指定称号，返回索引
	 * 提示：索引的顺序和游戏中称号栏的顺序并不一致，以cga.GetPlayerInfo().titles为准
	 */
	cga.findTitle = (title) => {
		var titles = cga.GetPlayerInfo().titles;
		for (var i = 0; i < titles.length; i++) {
			if (titles[i] == title) {
				return i
			}
		}
		return -1
	}

	cga.ismaxbattletitle = () => {

		var playerinfo = cga.GetPlayerInfo();
		var titles = playerinfo.titles

		for (var i in titles) {
			if (titles[i] == "无尽星空") {
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
	cga.getTimeRange = () => {
		var stages = ['黎明', '白天', '黄昏', '夜晚'];
		var sysTime = cga.GetSysTime();
		if (!sysTime) {
			return stages[1];
		}
		// console.log('当前游戏内时间:'+sysTime.hours+':'+sysTime.mins+':'+sysTime.secs);
		if (sysTime.hours < 4) {
			return stages[3];
		} else if (sysTime.hours == 4) {
			if (sysTime.mins < 9) {
				return stages[3];
			}
			return stages[0]
		} else if (sysTime.hours <= 6) {
			return stages[0];
		} else if (sysTime.hours < 16) {
			return stages[1];
		} else if (sysTime.hours == 16) {
			if (sysTime.mins < 105) {
				return stages[1]
			}
			return stages[2];
		} else if (sysTime.hours <= 18) {
			return stages[2];
		} else {
			return stages[3];
		}
	}

	// UNAecho:添加关于职业信息的API
	cga.job = {}

	// 获取本地职业数据。
	cga.job.jobData = require('./常用数据/ProfessionalInfo.js')

	// 获取本地职业声望数据。
	cga.job.reputationData = require('./常用数据/reputation.js')

	/**
	 * UNAecho:职业晋级所需的技能和声望等级表。
	 * key代表当前职业等级，也就是cga.job.getJob().jobLv。
	 * value代表这个职业等级想要晋升下一级，所需的得意技要求和声望要求。
	 * 
	 * skillLv:要晋级，必要的得意技等级。
	 * reputationLv:要晋级，声望最少需要的等级。
	 * 【注意】部分职业没有得意技要求，仅满足声望即可。例如咒术师。
	 * 如果想获取职业得意技列表，可参考ProfessionalInfo.js中的skill数组。
	 */
	cga.job.promoteInfo = {
		0: { skillLv: 4, reputationLv: 6, mission: { '战斗系': ['树精长老'], '生产系': ['树精长老', '咖哩任务'], } },
		1: { skillLv: 6, reputationLv: 9, mission: { '战斗系': ['挑战神兽'], '生产系': ['起司的任务'], } },
		2: { skillLv: 8, reputationLv: 11, mission: { '战斗系': ['诅咒的迷宫'], '生产系': ['魔法大学'], } },
		3: { skillLv: 10, reputationLv: 13, mission: { '战斗系': ['誓言之花'], '生产系': ['誓言之花'], } },
		4: { skillLv: 10, reputationLv: 14, mission: { '战斗系': ['洛伊夫的净化'], '生产系': null, } },
	}

	/**
	 * UNAecho:获取职业数据，如果输入职业名称，获取对应职业数据。如果不输入，则获取当前职业数据。
	 * 可输入任意职业称号来代表对应职业。如【见习弓箭手】【王宫弓箭手】都是一个效果。
	 * @param {*} input 
	 * @returns 
	 */
	cga.job.getJob = (input) => {
		var jobObj = null
		var data = cga.job.jobData.Professions
		var playerInfo = cga.GetPlayerInfo()
		var searchJobName = null

		if (!input || typeof input != 'string') {
			searchJobName = playerInfo.job
		} else {
			searchJobName = input
		}

		for (var i in data) {
			for (var j in data[i].titles) {
				if (searchJobName == data[i].titles[j]) {
					jobObj = data[i]
					jobObj.job = data[i].name
					if (['物理系', '魔法系', '魔物系'].indexOf(data[i].category) != -1) {
						jobObj.jobType = '战斗系'
					} else if (data[i].category == '服务系') {
						jobObj.jobType = '服务系'
					} else {
						jobObj.jobType = '生产系'
					}
					jobObj.jobLv = parseInt(j)
					jobObj.curJob = playerInfo.job
					break
				}
			}
		}
		if (!jobObj) {
			throw new Error('错误，职业数据库中暂无【' + searchJobName + '】职业信息，请添加')
		}

		var reputationData = cga.job.reputationData
		var titles = playerInfo.titles
		if (jobObj.jobType == '战斗系') {
			reputationData = reputationData.reputationList
			for (let i = 0; i < 15; i++) {
				for (var t in titles) {
					if (titles[t].length == 0) {
						continue
					}
					if (titles[t] == reputationData[i].reputation) {
						jobObj.reputation = titles[t]
						jobObj.reputationLv = i
						break
					}
				}
			}
		} else {
			reputationData = reputationData.productReputationList
			for (let i = 0; i < 15; i++) {
				for (var t in titles) {
					if (titles[t].length == 0) {
						continue
					}
					if (titles[t] == reputationData[i].reputation) {
						jobObj.reputation = titles[t]
						jobObj.reputationLv = i
						break
					}
				}
			}
		}

		return jobObj
	}


	// UNAecho:关于技能信息的API对象
	cga.skill = {}

	// 获取本地职业数据。
	cga.cachedSkillInfos = null
	cga.skill.loadSkillData = () => {
		if (!cga.cachedSkillInfos) {
			cga.cachedSkillInfos = require('./常用数据/skills.js').skillInfos;
		}
		return cga.cachedSkillInfos
	}

	/**
	 * UNAecho:获取指定技能的静态信息
	 * @param {*} input 技能全称
	 * @returns 
	 */
	cga.skill.getSkill = (input) => {
		var data = cga.skill.loadSkillData()

		if (!input || typeof input != 'string') {
			throw new Error('错误，必须输入String类型的技能名称。input:', input)
		}

		var skillObj = data.find((s) => {
			if (s.name == input) {
				return true
			}
			return false
		});

		if (!skillObj) {
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
		if (teleVillages.indexOf(skillObj.npcMainMap) != -1) {
			costSum += cga.travel.teleCost[skillObj.npcMainMap]
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
		if (reason.indexOf('slot') != -1) {
			throw new Error('技能栏位不足')
		} else if (reason.indexOf('gold') != -1) {
			throw new Error('学习技能金币不足')
		}

		let go = (cb2) => {
			cga.travel.autopilot(skillObj.npcMap, () => {
				learn(cb2)
			})
			return
		}

		let learn = (cb3) => {
			let obj = { act: 'skill', target: skillObj.name, npcpos: skillObj.npcpos }
			cga.askNpcForObj(obj, cb3)
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
		if (map == skillObj.npcMap || mapindex == skillObj.npcMap) {
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
		if (skillObj.npcMainMap == '法兰城') {
			cga.travel.falan.toStone('C', () => {
				// 咒术师相关技能
				if (skillObj.npcMap == 15009 || skillObj.npcMap == 15010) {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88, '芙蕾雅'],
					], () => {
						cga.askNpcForObj({ act: 'map', target: 15000, npcpos: [201, 165] }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
							], () => {
								cga.askNpcForObj({ act: 'map', target: 15006, say: '咒术', npcpos: [31, 22] }, () => {
									cga.walkList([
										[38, 37, '咒术师的秘密住处'],
										[10, 0, 15008],
										skillObj.npcMap == 15010 ? [1, 10, 15010] : [19, 10, 15009],
									], () => {
										learn(cb)
									});
								})
							});
						})
					})
				} else if (skillObj.name == '狩猎') {// 猎人
					var search = () => {
						var obj = cga.GetMapUnits()
						var npc = obj.find(u => u.unit_name == '猎人拉修' && u.type == 1 && u.model_id != 0)
						if (npc) {
							let obj = { act: 'skill', target: skillObj.name, npcpos: [npc.xpos, npc.ypos] }
							var target = cga.getRandomSpace(npc.xpos, npc.ypos);
							cga.askNpcForObj(obj, () => {
								cb(true)
							})
							return
						} else {
							var ranX = Math.trunc(Math.random() * (500 - 472) + 472)
							var ranY = Math.trunc(Math.random() * (220 - 198) + 198)
							var target = cga.getRandomSpace(ranX, ranY);
							cga.walkList([
								target,
							], search);
						}
						return
					}

					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88, '芙蕾雅'],
					], search)
				}
				else {
					go(cb)
				}
			});
		} else if (teleVillages.indexOf(skillObj.npcMainMap) != -1) {
			cga.travel.toVillage(skillObj.npcMainMap, () => {
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
	cga.skill.getSlotSum = () => {
		let sum = 0
		let skills = cga.GetSkillsInfo();
		skills.forEach(s => {
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
	 * 读取人物自己的脚本配置，由于比较常用，封装一个API使用
	 */
	cga.LoadScriptConfigFile = () => {
		var json = null
		try {
			var rootdir = cga.getrootdir()
			var configPath = rootdir + '\\脚本设置';
			var configName = configPath + '\\通用挂机脚本_' + cga.FileNameEscape(cga.GetPlayerInfo().name) + '.json';
			var json = fs.readFileSync(configName, 'utf8');

			if (typeof json != 'string' || !json.length)
				throw new Error('配置文件格式错误');
		} catch (e) {
			if (e.code != 'ENOENT') {
				console.log('role error:' + e)
			}
		}

		return JSON.parse(json)
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

	// 等待BOSS战结束，一般以地图变动为基准
	cga.battle.waitBossBattle = (map, cb) => {
		var obj = {}
		if (typeof map == 'string') {
			obj.mapname = map
		} else if (typeof map == 'number') {
			obj.mapindex = map
		}

		if (cga.isInBattle()) {
			cga.waitForLocation(obj, () => {
				// 虽然战斗胜利一瞬间index就切换到战斗胜利房间，但有时候战斗动画和切屏并未结束
				// 所以要等到cga.isInNormalState()为true才能退出此API
				let waitNormal = () => {
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

		setTimeout(cga.battle.waitBossBattle, 1500, map, cb);
		return
	}

	/**
	 * UNAecho:可获取角色当前所处地图的所有出入口信息，并进行聚类，所有1x1范围内相邻的门，都仅保留1个pos。
	 * 举例：如果一个门是3个pos连在一起，比如法兰城的出入口，仅保留1个pos后返回
	 * 数据来源于cga.getMapObjects()，根据观察，数据中cell=10的对象代表地图之间切换的门。
	 * 
	 * 【注意】
	 * 1、有的地图有些门处于无法抵达的位置，如隔着墙、河道、或者地图之外（如艾尔莎岛墙外面x: 124, y: 114-117居然是门）
	 * 这些门并未进行cga.isPathAvailable()的判断，外部调用需要自行判断。
	 * 本API仅为采集数据时使用，时间复杂度较高，但此API属于较低使用频率（采集静态、非变化数据）所以还可以接受。
	 * 2、地图之间的切换方式并不是只有【走进门】这一种方式，还有与NPC对话、主动使用道具（飞行券、5转迷宫使用任务水晶）、转向某个NPC（法兰城水晶传送）等其它方式。
	 * @param {*} load_all 默认为true。当值为true时，返回整张地图数据，否则返回人物附近51x51的数据。
	 * @returns 数据结构参考cga.getMapObjects()返回值
	 */
	cga.getDoorCluster = (load_all = true) => {
		let mapObjects = cga.getMapObjects(load_all)
		let resultArr = []
		let ngArr = []
		for (let mapObj of mapObjects) {
			if (mapObj.cell != 10 && mapObj.cell != 3) {
				console.log('【UNAecho脚本警告】坐标x:', mapObj.mapx, 'y:', mapObj.mapy, '，的cell=' + mapObj.cell + '，不为10，请注意。')
				continue
			}
			let exist = false
			for (let resultObj of resultArr) {
				if (cga.isAroundPos([resultObj.x, resultObj.y], { x: mapObj.mapx, y: mapObj.mapy })) {
					// console.log('坐标x:',mapObj.mapx,'y:',mapObj.mapy,'，处于结果集x:',resultObj.x,'y:',resultObj.y,'1x1内，舍弃')
					exist = true
					ngArr.push(mapObj)
					break
				}
			}
			for (let ngObj of ngArr) {
				if (cga.isAroundPos([ngObj.x, ngObj.y], { x: mapObj.mapx, y: mapObj.mapy })) {
					// console.log('坐标x:',mapObj.mapx,'y:',mapObj.mapy,'，处于重复集x:',ngObj.x,'y:',ngObj.y,'1x1内，舍弃')
					exist = true
					ngArr.push(mapObj)
					break
				}
			}
			if (!exist) {
				resultArr.push(mapObj)
			}
		}

		return resultArr
	}

	/**
	 * UNAecho:计算两个门之间的cga.calculatePath()距离
	 * @param {*} door1 
	 * @param {*} door2 
	 * @returns 
	 */
	cga.calculateDoorDistance = (door1, door2) => {
		let path = null
		try {
			path = cga.calculatePath(door1.mapx, door1.mapy, door2.mapx, door2.mapy, null, null, null, []);
		} catch (error) {
			if (error.message.indexOf('寻路失败') != -1) {
				// console.log('door1:',door1,'无法抵达door2:',door2,'距离视为-1。')
				return -1
			} else {
				throw new Error('cga.calculatePath()返回未知错误:', error)
			}

		}
		return PF.Util.expandPath(path).length
	}

	/**
	 * UNAecho:计算自己与输入的door之间的cga.calculatePath().length距离
	 * @param {*} door 数据结构参考cga.getMapObjects()返回的数组中的元素
	 */
	cga.getDoorDistance = (door) => {
		let XY = cga.GetMapXY()
		return cga.calculateDoorDistance({ mapx: XY.x, mapy: XY.y }, door)
	}

	// 获取本地静态门数据。
	cga.cachedDoorInfos = null
	cga.loadDoorInfo = () => {
		if (!cga.cachedDoorInfos) {
			let fs = require('fs');
			cga.cachedDoorInfos = JSON.parse(fs.readFileSync('./常用数据/doorInfo.json'))
		}
		return cga.cachedDoorInfos
	}
	/**
	 * UNAecho:将输入的doorId转化为Object格式
	 * @param {*} doorId String类型的id，使用下划线('_')做为分隔符。
	 * 具体形式为door所在地图的mapindex3_mapname_mapx_mapy
	 * 其中mapx与mapy为door的坐标
	 */
	cga.getDoorObj = (doorId) => {
		if (typeof doorId != 'string') {
			throw new Error('doorId必须为String类型')
		}
		let splitArr = doorId.split('_')
		let result = {}
		result.mapindex = splitArr[0]
		result.mapname = splitArr[1]
		result.mapx = splitArr[2]
		result.mapy = splitArr[3]
		return request
	}

	/**
	 * UNAecho:搜索可以抵达doorId的所有门，包含除不可抵达以外的所有形式（传送、走路、道具等等）
	 * 注意：虽然可以直接取inputDoorId可以抵达的门，但是并不能获得其它单向门传送至inputDoorId的数据，所以才写了此搜索API
	 * @param {*} inputDoorId 
	 * @returns {Array[LinkedList]} 链表型数组
	 */
	cga.searchConnectedDoor = (inputDoorId) => {
		let doorinfo = cga.loadDoorInfo()
		let resultArr = []
		for (let mapindex in doorinfo) {
			for (let door in doorinfo[mapindex]) {
				if (doorinfo[mapindex][door][inputDoorId] && doorinfo[mapindex][door][inputDoorId].dst >= 0) {
					let linkedList = new LinkedList()
					linkedList.add({
						id: door,
						dst: doorinfo[mapindex][door][inputDoorId].dst,
						gold: doorinfo[mapindex][door][inputDoorId].gold,
						item: doorinfo[mapindex][door][inputDoorId].item,
					})
					resultArr.push(linkedList)
				}
			}
		}
		return resultArr
	}
	/**
	 * UNAecho:图计算，利用静态数据，计算目标门的最优路径
	 * 初步逻辑:使用链表，将目标门制作成链表格式的数据，放入Array中
	 * 遍历此Array，将所有可抵达的门，与其相连，数量会程笛卡尔积倍增
	 * 将所有门的代价加入链表的value中，形成链表形式的数据
	 * 实现倒是实现了，但时间复杂度过高，无法正式使用
	 * TODO:使用A*等方式重写此逻辑，有空再做
	 * @param {*} obj 
	 * @returns 
	 */
	cga.getNearestPath = (obj) => {
		// let mapname = cga.GetMapName();
		let mapindexStr = cga.GetMapIndex().index3.toString()
		// let XY = cga.GetMapXY()

		let loop = (linkedListArr) => {
			let loopArr = []
			for (let linkedList of linkedListArr) {
				let tmpArr = cga.searchConnectedDoor(linkedList.head.value.id)
				for (let l of tmpArr) {
					// 终止迭代逻辑，目前并不是最优方式
					if (l.head.value.id.startsWith(mapindexStr)) {
						return loopArr
						// let doorObj = cga.getDoorObj(l.head.value.id)
						// if(cga.getDoorDistance(doorObj) >= 0){
						// 	return loopArr
						// }else{
						// 	return loop(loopArr)
						// }
					}
					l.add(linkedList)
					loopArr.push(l)
				}
			}
			return loop(loopArr)
		}
		// 初始化，并丢入递归中
		let doorId = obj.id
		return loop(cga.searchConnectedDoor(doorId))
	}

	/**
	 * UNAecho: 游戏角色对象，用于提取或保存一些常用的静态信息，或开发一些常用的API
	 */
	cga.character = {}

	/**
	 * UNAecho: 游戏中不同角色所持武器对model_id的偏差修正
	 * 详细的说明，请参考characterInfo.js的注释文档
	 */
	cga.character.weaponBias = {
		'斧': -2,
		'弓': -1,
		'无': 0,
		'剑': 1,
		'杖': 2,
		'枪': 3
	}

	cga.character.characterInfo = require('./常用数据/characterInfo.json')

	/**
	 * UNAecho: 获取角色静态信息，在特殊场合可能会有用。比如打UD时分辨性别。
	 * 所有数据来自于cga.GetMapUnits()的结果进行整理收集。可参考characterInfo.js脚本了解详细逻辑
	 */
	/**
	 * UNAecho: 获取角色静态信息，在特殊场合可能会有用。比如打UD时分辨性别。
	 * 所有数据来自于cga.GetMapUnits()的结果进行整理收集。可参考characterInfo.js脚本了解详细逻辑
	 * @param {*} input 角色的model_id，来源于cga.GetMapUnits()的model_id，或者cga.GetPlayerInfo()的image_id
	 * 输入此ID，可获取角色的静态信息，如官方汉化名称、性别、颜色、手拿何种武器等。
	 * @returns 
	 */
	cga.character.getCharacterInfo = (input = null) => {
		let data = cga.character.characterInfo
		let model_id = input === null ? cga.GetPlayerInfo().image_id : input
		// const sex = { 0 : '女', 1 : '男'}

		if (data.hasOwnProperty(model_id)) {
			// console.log('cga.character.getCharacterInfo:名称【'+data[model_id].character_name+'】，性别【'+sex[data[model_id].sex]+'】，颜色【'+data[model_id].color+'】，武器【'+data[model_id].weapon+'】')
			return data[model_id]
		} else {
			// console.warn('错误，当前数据不包含model_id:',model_id,'请使用characterInfo.js脚本在地图上更多收集数据，并根据逻辑进行人工鉴定，方可作为数据的依赖。')
			return null
		}
	}

	/**
	 * UNAecho : 获取道具叠加数
	 * 有时无法获取道具type时，只能靠道具名称查询。（比如身上没有此道具时）
	 * 
	 * 【提示】
	 * 当你不清楚一个道具的最大堆叠数是多少时，可以使用我的另一个API【cga.parseStoreMsg()】辅助查询，方法如下：
	 * 1、找到一个可以购买此道具（如果有的话）的NPC(dlg的type=6,options=0,dialog_id=335)，与其对话，打开商店界面。
	 * 2、商店界面其实是一个对话dlg，将其传给cga.parseStoreMsg()
	 * 3、cga.parseStoreMsg()返回的obj中，obj.items会包含背包中的各个道具属性，其中maxcount就是官方堆叠数。
	 */
	cga.getItemMaxcount = (item) => {
		if (!item) {
			console.log('cga.getItemMaxcount:item没有传入，返回默认值0')
			return 0
		}
		// 首先看看身上是否有该物品
		let targetItem = cga.GetItemsInfo().find((it) => {
			return it.name == item.name
		});
		// 如果有，则可获取其type，更好地辨别其堆叠数
		if (targetItem) {
			// console.log('道具【' + item.name +'】查询到其type:'+ targetItem.type+'，便于获取其堆叠数')
			item.type = targetItem.type
		}

		if (item.name.indexOf('谜语箱') >= 0) return 0;
		if (item.name.indexOf('生命力回复药') >= 0) return 3;
		if (item.name.endsWith('的水晶碎片')) return 999;
		if (['长老之证'].indexOf(item.name) >= 0) return 3;
		if (['黄蜂的蜜'].indexOf(item.name) >= 0) return 6;
		if (['魔族的水晶'].indexOf(item.name) >= 0) return 5;
		if (['巨石', '龙角', '坚硬的鳞片', '竹子', '孟宗竹'].indexOf(item.name) >= 0) return 20;
		if (item.type == 29) {// 矿
			if (item.name.endsWith('条')) return 20;
			return 40;
		}
		if (item.type == 30) return 40; // 木
		if (item.type == 23 || item.type == 43) { // 料理 血瓶
			if (item.name == '小护士家庭号' || item.name == '魔力之泉') return 10;
			return 3;
		}
		if (item.type == 31) return 20; // 布
		if ([32, 34, 35].indexOf(item.type) >= 0) { // 狩猎材料
			if (item.name.endsWith('元素碎片')) return 4;
			if (item.name.startsWith('隐秘的徽记')) return 20;
			return 40;
		}
		if (['铜钥匙', '白钥匙', '黑钥匙'].indexOf(item.name) >= 0) return 999;
		console.warn('【UNAecho脚本警告】物品', item, '没有查询到堆叠数，默认返回0。如需完善，请联系作者https://github.com/UNAecho。')
		return 0
	}

	return cga;
}
