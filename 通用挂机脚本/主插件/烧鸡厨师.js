var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var craft_count = 0;
var craft_target = null;

var healObject = require('../公共模块/治疗自己');
var checkSettle = require('../公共模块/登出检查定居地');

//必须定居哥拉尔
cga.travel.gelaer.isSettled = true;
cga.travel.falan.isSettled = false;
cga.travel.newisland.isSettled = false;

//卖料理Flag，防止loop卖魔石步骤中的walklist和repeat中walklist冲突
var sellFlag = false;

const io = require('socket.io')();

io.on('connection', (socket) => {

	socket.emit('init', {
		craft_player: cga.GetPlayerInfo().name,
		craft_materials: craft_target ? craft_target.materials : [],
	});

	socket.on('register', (data) => {
		socket.cga_data = data;
		socket.join('buddy_' + data.job_name);
		console.log(socket.cga_data.player_name + ' 已加入烧鸡节点');
	});

	socket.on('done', (data) => {
		socket.cga_data.count = data.count;
		socket.cga_data.state = 'done';
	});

	socket.on('gathering', () => {
		socket.cga_data.state = 'gathering';
	});

	socket.on('disconnect', (err) => {
		if (socket.cga_data)
			console.log(socket.cga_data.player_name + ' 已退出烧鸡节点');
	})
});

var waitStuffs = (name, materials, cb) => {

	console.log('正在等待材料 ' + name);

	var repeat = () => {

		//修复：防止面向方向不正确导致无法交易
		if (cga.GetPlayerInfo().direction != 4) {
			cga.turnTo(120, 107);
			setTimeout(repeat, 500);
			return;
		}

		var s = io.in('buddy_' + name).sockets;
		var find_player = null;
		for (var key in s) {
			// console.log('读取线程中各个角色的状态..');
			// console.log('buddy_' + name +' : ');
			// console.log('s[key].cga_data.job_name : ' + s[key].cga_data.job_name);
			// console.log('s[key].cga_data.state : ' + s[key].cga_data.state);
			if (s[key].cga_data &&
				(s[key].cga_data.job_name == name && (s[key].cga_data.job_name == '盐' || s[key].cga_data.job_name == '鸡肉' || s[key].cga_data.job_name == '胡椒' || s[key].cga_data.job_name == '柠檬草')) &&
				s[key].cga_data.state == 'done') {
				find_player = s[key];
				console.log(s[key].cga_data.job_name + '  findplayer结束,break..');
				break;
			}
		}

		if (find_player) {
			console.log('if(find_player){..');

			find_player.cga_data.state = 'trade';
			find_player.emit('init', {
				craft_player: cga.GetPlayerInfo().name,
				craft_materials: materials,
			});

			find_player.emit('trade');

			var unit = cga.findPlayerUnit(find_player.cga_data.player_name);

			if (unit == null || unit.xpos != 120 || unit.ypos != 107) {
				setTimeout(repeat, 1000);
				return;
			}

			setTimeout(() => {
				var stuffs = { gold: 0 };

				// 根据采集任务给钱
				if (find_player.cga_data.job_name == '盐') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.75 + 0);
					console.log('累计交易金额 : '+ stuffs.gold);
				}
				if (find_player.cga_data.job_name == '鸡肉') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.5);
					console.log('累计交易金额 : '+ stuffs.gold);
				}
				if (find_player.cga_data.job_name == '胡椒') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.75 + 0);
					console.log('累计交易金额 : '+ stuffs.gold);
				}
				if (find_player.cga_data.job_name == '柠檬草') {
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.75 + 0);
					console.log('累计交易金额 : '+ stuffs.gold);
				}

				cga.positiveTrade(find_player.cga_data.player_name, stuffs, null, (result) => {
					console.log('positiveTrade..');
					
					if (result.success == true) {
						console.log('if (result.success == true){..');
						cb(null);
					} else {
						console.log('else {..');
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
	[121, 107]
	], ()=>{
		cga.turnTo(120, 107);
		setTimeout(repeat, 500);
	});

}

var getBestCraftableItem = () => {
	console.log('查看料理最高等级是否能做目标物品..');
	//refresh
	thisobj.craftSkill = cga.findPlayerSkill('料理');
	if (!thisobj.craftSkill)
		return null;

	thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);

	return thisobj.craftItemList.find((c) => {
		return c.name == '烧鸡';
	});
}

var loop = () => {

	console.log('loop()开始..');

	callSubPluginsAsync('prepare', () => {

		if(cga.GetMapName() != '哥拉尔镇'){
			console.log('登出，必须在哥拉尔镇启动..');
			cga.LogBack();
			setTimeout(loop, 1000);
			return;
		}

		craft_target = getBestCraftableItem();
		if (!craft_target) {
			throw new Error('无法制造烧鸡，可能料理技能有问题，技能没有学习或等级不够');
			return;
		}

		// 为了刷技能，改为做完料理卖店

		// if(cga.getItemCount('烧鸡') > 0){
		// 	cga.travel.gelaer.toBank(()=>{
		// 		cga.AsyncWaitNPCDialog(()=>{
		// 			cga.saveToBankAll('烧鸡', 3, (err)=>{
		// 				loop();
		// 			});
		// 		});
		// 	});
		// 	return;
		// }

		// 卖料理
		if (cga.getItemCount('烧鸡') > 3) {
			sellFlag = true;
			console.log('卖料理环节..');
			cga.walkList([
				[147, 79, '杂货店'],
				[11, 18],
			], ()=>{
				cga.TurnTo(11, 16);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						var sell = cga.findItemArray((item)=>{
							return item.name == '烧鸡';
						});
						var sellArray = sell.map((item)=>{
							item.count /= 3;
							return item;
						});
	
						cga.SellNPCStore(sellArray);
						cga.AsyncWaitNPCDialog(()=>{
							cga.walkList([
							[18, 30, '哥拉尔镇']
							], ()=>{
								cb(null);
							});
						});
					});
				});
			});
			console.log('卖料理结束..');
			sellFlag = false;
			return;
		}
		var playerInfo = cga.GetPlayerInfo();
		if (playerInfo.mp < craft_target.cost) {
			console.log('去医院补魔..');
			cga.travel.gelaer.toHospital(()=>{
				setTimeout(loop, 3000);
			});
			return;
		}

		if (playerInfo.health > 0) {
			healObject.func(loop);
			return;
		}

		io.sockets.emit('init', {
			craft_player: cga.GetPlayerInfo().name,
			craft_materials: craft_target ? craft_target.materials : [],
		});

		var lackStuffs = null;
		craft_target.materials.forEach((mat) => {
			if (cga.getItemCount(mat.name) < mat.count) {
				console.log('缺失材料 : ' + mat.name + '  需要 : ' + mat.count + '   还需 ： ' + (mat.count - cga.getItemCount(mat.name)));
				lackStuffs = mat;
				return false;
			}
		})

		if (lackStuffs !== null) {
			console.log('缺材料了，开始等待..');
			waitStuffs(lackStuffs.name, craft_target.materials, loop);
			return;
		}

		var craft = () => {

			//没蓝
			var playerInfo = cga.GetPlayerInfo();
			if (playerInfo.mp < craft_target.cost) {
				loop();
				return;
			}

			// //包满
			// if(cga.getInventoryItems().length > 15){
			// 	console.log('包满了！');
			// 	loop();
			// 	return;
			// }

			console.log('开始制造：' + craft_target.name);

			cga.craftItemEx({
				craftitem: craft_target.name,
				immediate: true
			}, (err, results) => {
				if (results && results.success) {
					craft_count++;
					console.log('已造' + craft_count + '次');
					setTimeout(craft, 500);
				} else {
					setTimeout(loop, 500);
				}

			});
		}

		craft();
	});
}

var thisobj = {
	getDangerLevel: () => {
		return 0;
	},
	translate: (pair) => {

		if (pair.field == 'listenPort') {
			pair.field = '监听端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}

		if (healObject.translate(pair))
			return true;

		return false;
	},
	loadconfig: (obj) => {

		configTable.listenPort = obj.listenPort;
		thisobj.listenPort = obj.listenPort

		if (!thisobj.listenPort) {
			console.error('读取配置：监听端口失败！');
			return false;
		}

		if (!healObject.loadconfig(obj))
			return false;

		return true;
	},
	inputcb: (cb) => {

		var stage3 = (cb2) => {

			var sayString = '【烧鸡插件】请选择服务监听端口: 1000~65535';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val >= 1000 && val <= 65535) {
					configTable.listenPort = val;
					thisobj.listenPort = val;

					var sayString2 = '当前已选择:监听端口=' + thisobj.listenPort + '。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		Async.series([stage3, healObject.inputcb], cb);
	},
	execute: () => {
		io.listen(thisobj.listenPort);

		callSubPlugins('init');

		checkSettle.func((err, map)=>{
			if(map != '哥拉尔镇')
				throw new Error('必须定居哥拉尔镇!');
			
			loop();
		});
	},
};

module.exports = thisobj;