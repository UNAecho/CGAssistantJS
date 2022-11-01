var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var craft_count = 0;
var craft_target = null;
//脚本开始时人物信息，用于检测是否刷双百
var playerInfoOrigin = cga.GetPlayerInfo()

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(playerInfoOrigin.job)

//开始时间，用于计算效率
var starttime = new Date().getTime()
//统计效率时刻的时间点
var nowtime = null

//初始化总资产，socket每加入一个人就累加资产。用于计算总利益
var originassets = 0
//统计效率时刻点总资产
var generalassets = 0

//【初始化】整个生产team的socket资产信息，初始化时直接加入制造者信息
var originmoneyinfos = {}
originmoneyinfos[playerInfoOrigin.name] = playerInfoOrigin.gold
//【实时】整个生产team的socket资产信息
var moneyinfos = {}
// 【实时】整个生产team的socket分工信息
var roominfos = {}

//检查是刷双百还是单纯制造的flag
var aim_flag = false
if(playerInfoOrigin['detail'].manu_endurance == 100 && playerInfoOrigin['detail'].manu_skillful == 100){
	aim_flag = true
}
//如果刷双百，升级后判断是否达到目标的flag
var warn_flag = false

var healObject = require('../公共模块/治疗自己');

const allowMats = [
	'麻布', 
	// '印度轻木', 
	'铜条', 
	'鹿皮', 
	'毛毡', 
	'木棉布',
	// 以下为自定义材料，注意更改，以避免生产者使用高级制造配方
	'铁条',
	'银条',
	'纯银条',
	'金条',
	'白金条',
	'琵琶木',
	'苹果薄荷',
	'柠檬草',
	'蝴蝶花',
	// '果梨',
	// '桃木',
	// '番红花',
	// '百里香',
	// '瞿麦',
	// '茴香',
	// '七叶树',
	// '小麦粉',
	// '牛奶',
	'鸡蛋',
	'葱',
	'盐',
	'酱油',
	'牛肉',
	// '砂糖',
	'胡椒',
	'鱼翅',
];

const isFabricName = (name)=>{
	return name == '麻布' || name == '木棉布' || name == '毛毡';
}

const teachers = [
{
	skillname : professionalInfo.skill,
	location : professionalInfo.teacherlocation,
	path : professionalInfo.teacherwalk,
	pos : professionalInfo.teacherpos,	
},
]

const io = require('socket.io')();

io.on('connection', (socket) => { 

	socket.emit('init', {
		craft_player : cga.GetPlayerInfo().name,
		craft_materials : craft_target ? craft_target.materials : [],
	});
	
	socket.on('register', (data) => {
		socket.cga_data = data;
		socket.join('buddy_'+data.job_name);
		console.log(socket.cga_data.player_name +' 已加入双百节点');

		// 打印分工信息
		if(roominfos.hasOwnProperty(data.job_name)){
			roominfos[data.job_name]['人数'] += 1 
			roominfos[data.job_name]['组员'].push(socket.cga_data.player_name)
		}else{
			roominfos[data.job_name] = {
				'人数': 1,
				'组员': [socket.cga_data.player_name],
			}
		}
		console.log(roominfos)
		// 统计资产信息
		if(socket.cga_data.initial_funding){
			// 重新计算初始化资产
			originassets = 0
			// 更新队员加入时现金信息，如果有信息了就不做处理，没有就新增
			originmoneyinfos[socket.cga_data.player_name] > 0 ? ()=>{} : originmoneyinfos[socket.cga_data.player_name] = socket.cga_data.initial_funding
			// 总金额加和
			for(var i in originmoneyinfos){
				// 初始资产累加统计
				originassets += originmoneyinfos[i]
				// 初始化一份实时更新的dict，用于接下来与原资产进行计算，得出总利润
				moneyinfos[i] = originmoneyinfos[i]
			}
			// console.log('有新队员【' + socket.cga_data.player_name + '】加入节点，当前有【' + Object.keys(originmoneyinfos).length +'】人，队伍总资产为：【' + originassets + '】')
		}
	});
	/**
	 * TODO 通过采集者的socket.cga_data.cost来确定每一次交易给多少钱。
	 * 注意，cost是每次采集的总消耗，而交易是分批次的交易。
	 * 所以不能一次性将cost的钱都给采集，那样会使采集拿到几倍的cost，钱容易满
	 */
	socket.on('done', (data) => {
		socket.cga_data.count = data.count;
		socket.cga_data.cost = data.cost;
		socket.cga_data.state = 'done'; 
	});
	
	socket.on('gathering', (data) => {
		socket.cga_data.state = 'gathering';
		if(data){
			nowtime = null
			generalassets = 0
			// 新emit过来的队员资产信息
			moneyinfos[data.player_name] = data.gold
			// 实时制造者资产信息
			moneyinfos[playerInfoOrigin.name] = cga.GetPlayerInfo().gold
			// 交易之后，采集号去采集，此时计算总资产
			for(var i in moneyinfos){
				generalassets += moneyinfos[i]
			}
			profit = generalassets - originassets
			nowtime = new Date().getTime()
			costminutes = Math.floor((nowtime - starttime)/(60*1000)) <1 ? 1 : Math.floor((nowtime - starttime)/(60*1000))
			// console.log('当前总资产：【' + generalassets +'】，生产队【' + Object.keys(moneyinfos).length + '】人，耗时【'+costminutes+'】分钟，总利润：【' + profit + '】，每分钟获利：【' + Math.floor(profit/costminutes)+'】')

		}
	});
	
	socket.on('disconnect', (err) => {
		if(socket.cga_data)
			console.log(socket.cga_data.player_name +' 已退出双百节点');
			delete moneyinfos[socket.cga_data.player_name]
	})
});
var waitStuffs = (name, materials, cb)=>{

	console.log('正在等待材料 ' + name);

	var repeat = ()=>{
		
		//修复：防止面向方向不正确导致无法交易
		if(cga.GetPlayerInfo().direction != 4){
			cga.turnTo(32, 88);
			setTimeout(repeat, 500);
			return;
		}
		
		var s = io.in('buddy_'+name).sockets;
		var find_player = null;
		for(var key in s){
			if(s[key].cga_data &&
			((s[key].cga_data.job_name == name) || (s[key].cga_data.job_name == '买布' && isFabricName(name))) &&
			s[key].cga_data.state == 'done' ){
				find_player = s[key];
				break;
			}
		}

		if(find_player){
			// TODO 计算成本时，将注释打开，方便debug
			// console.log(find_player.cga_data)
			find_player.cga_data.state = 'trade';
			find_player.emit('init', {
				craft_player : cga.GetPlayerInfo().name,
				craft_materials : materials,
			});
			
			find_player.emit('trade');

			var unit = cga.findPlayerUnit(find_player.cga_data.player_name);

			if(unit == null || unit.xpos != 33 || unit.ypos != 88){
				setTimeout(repeat, 1000);
				return;
			}

			setTimeout(()=>{
				var stuffs = { gold:0 };
				
				if(find_player.cga_data.job_name == '买布' && Object.keys(find_player.cga_data.count).length > 0){
					for(var key in find_player.cga_data.count){
						if(key == '麻布')
							stuffs.gold += find_player.cga_data.count[key] * 20;
						else if(key == '木棉布')
							stuffs.gold += find_player.cga_data.count[key] * 25;
						else if(key == '毛毡')
							stuffs.gold += find_player.cga_data.count[key] * 29;
					}
				}
				if(find_player.cga_data.job_name == '鹿皮'){
					stuffs.gold += find_player.cga_data.count * 1;
				}
				if(find_player.cga_data.job_name == '印度轻木'){
					stuffs.gold += find_player.cga_data.count * 1;
				}
				if(find_player.cga_data.job_name == '铜条'){
					stuffs.gold += find_player.cga_data.count * 20;
				}
				if(find_player.cga_data.job_name == '铁条'){
					stuffs.gold += find_player.cga_data.count * 36;
				}
				if(find_player.cga_data.job_name == '葱'){
					stuffs.gold += Math.ceil(find_player.cga_data.count * 1.0 + 0)
				}
				if(find_player.cga_data.job_name == '盐'){
					stuffs.gold += Math.ceil(find_player.cga_data.count * 0.3 + 0)
				}
				if(find_player.cga_data.job_name == '酱油'){
					stuffs.gold += Math.ceil(find_player.cga_data.count * 1.5 + 0)
				}
				if(find_player.cga_data.job_name == '牛肉'){
					stuffs.gold += Math.ceil(find_player.cga_data.count * 4.0 + 0)
				}
				if(find_player.cga_data.job_name == '砂糖'){
					stuffs.gold += Math.ceil(find_player.cga_data.count * 4.5 + 0)
				}
				console.log('准备交易给采集员:')
				console.log(stuffs)
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

	cga.travel.falan.toStone('C', ()=>{
		cga.walkList([
		[34, 88]
		], ()=>{
			cga.turnTo(32, 88);
			setTimeout(repeat, 500);
		});
	});
}

var getBestCraftableItem = ()=>{
	
	//refresh
	thisobj.craftSkill = cga.findPlayerSkill(thisobj.craftSkill.name);
	thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
	
	var minGatherType = 999;
	
	var item = null;
	for(var i = thisobj.craftItemList.length - 1; i >= 0; i--){
		// console.log('id:'+thisobj.craftItemList[i].itemid+',name:'+thisobj.craftItemList[i].name)
		if(thisobj.craftItemList[i].level > thisobj.craftSkill.level)
			continue;
		if(!thisobj.craftItemList[i].available)
			continue;
		var allow = true;
		var gather_type = 0;

		thisobj.craftItemList[i].materials.forEach((mat)=>{

			if(allowMats.find((m)=>{ return m == mat.name} ) == undefined){
				allow = false;
				return false;
			}
			
			if(!isFabricName(mat.name))
				gather_type ++;
			
			if(mat.name.indexOf('条') != -1) {
                gather_type++;
            }
		})
				
		if(allow == false)
			continue;
		
		if(gather_type < minGatherType){
			minGatherType = gather_type;
			item = thisobj.craftItemList[i];
		}
	}
	return item;
}

var forgetAndLearn = (teacher, cb)=>{

	var goAndLearn = (cb2)=>{
		cga.walkList(teacher.path, ()=>{
			cga.turnTo(teacher.pos[0], teacher.pos[1]);
			var dialogHandler = (err, dialog)=>{
				if(dialog){
					var hasSkill = cga.findPlayerSkill(teacher.skillname) ? true : false;
					if( hasSkill )
					{
						if (dialog.type == 16) {
							cga.ClickNPCDialog(-1, 1);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}
						if (dialog.type == 18) {
							const skillIndex = cga.GetSkillsInfo().sort((a,b) => a.pos - b.pos).findIndex(s => s.name == teacher.skillname);
							if (skillIndex > -1) {
								cga.ClickNPCDialog(0, skillIndex);
								cga.AsyncWaitNPCDialog(dialogHandler);
								return;
							}
						}
					}
					if (dialog.options == 12) {
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
					if (dialog.message.indexOf('已经删除') >= 0 || !hasSkill) {
						setTimeout(()=>{
							cga.TurnTo(teacher.pos[0], teacher.pos[1]);
							cga.AsyncWaitNPCDialog((dlg)=>{
								cga.ClickNPCDialog(0, 0);
								cga.AsyncWaitNPCDialog((dlg2)=>{
									cga.ClickNPCDialog(0, 0);
									setTimeout(cb2, 1000);
								});
							});
						}, 1000);
						return;
					}
				}
			}
			cga.AsyncWaitNPCDialog(dialogHandler);
		});
	}

	if(teacher.location == '法兰城'){
		cga.travel.falan.toStone('C', () => {
			goAndLearn(cb)
		});
	}else{
		cga.travel.falan.toTeleRoom('圣拉鲁卡村', ()=>{
			goAndLearn(cb)
		});
	}
	return
}

var dropUseless = (cb)=>{
	if(cga.getInventoryItems().find((inv)=>{
		return inv.name == '木棉布';
	}) != undefined && craft_target.materials.find((mat)=>{
		return mat.name == '木棉布';
	}) == undefined){
		var itempos = cga.findItem('木棉布');
		if(itempos != -1){
			cga.DropItem(itempos);
			setTimeout(dropUseless, 500, cb);
			return;
		}
	}
	
	if(cga.getInventoryItems().find((inv)=>{
		return inv.name == '毛毡';
	}) != undefined && craft_target.materials.find((mat)=>{
		return mat.name == '毛毡';
	}) == undefined){
		var itempos = cga.findItem('毛毡');
		if(itempos != -1){
			cga.DropItem(itempos);
			setTimeout(dropUseless, 500, cb);
			return;
		}
	}
	
	cb(null);
}

var cleanUseless = (cb)=>{
	if (!thisobj.fullOfBank){
		// 装备默认堆叠数是0
		var maxcount = 0
		// TODO查询所有药剂和料理能制作的itemid范围。用于调整存银行的最大堆叠数，装备是0，料理、药剂是3.
		if (craft_target.itemid >= 15606 && craft_target.itemid <= 15615){// 药剂
			maxcount = 3
		}else if((craft_target.itemid >= 15201 && craft_target.itemid <= 15230) || craft_target.itemid == 12405){//料理，番茄酱特殊，为12405
			maxcount = 3
		}
		console.log('尝试将制作好的【' + craft_target.name + '】(堆叠数:'+maxcount+')存入银行备用..')
		cga.travel.newisland.toBank(()=>{
			cga.turnDir(0);
			cga.AsyncWaitNPCDialog(()=>{
				cga.saveToBankAll(craft_target.name, maxcount, (r)=>{
					setTimeout(() => {
						var emptySlot = cga.findBankEmptySlot(craft_target.name, maxcount)
						if(emptySlot == -1){
							console.log('银行已经无法再存放【' + craft_target.name + '】(堆叠数:'+maxcount+')了')
							thisobj.fullOfBank = true
						}
						setTimeout(cb, 1000);
						return;
					}, 1500);
				});
			}, 1000);
		});
		return
	}
	console.log('银行已存满【' + craft_target.name + '】，去桥头将背包的成品卖掉。')
	cga.travel.falan.toStone('B1', ()=>{
		cga.turnTo(150, 122);
		var sellarray = cga.findItemArray((item)=>{
			if ( thisobj.craftItemList.find((craftItem)=>{
				// 如果是料理和血瓶，count会大于0。如果是装备，count=0
				if(item.name == craftItem.name && (item.count == 0 || (item.count >0 && item.count == 3))){
					return true
				}else{
					return false
				}
			}) !== undefined){
				return true;
			}
		});
		sellarray = sellarray.map((item)=>{
			if(item.count ==3){
				item.count /= 3;
				return item;
			}else{
				return item
			}
		});
		cga.sellArray(sellarray, ()=>{
			cga.walkList([
			[153, 123]//扔布点
			], ()=>{
				dropUseless(cb);
			});
		});
	});
}

var sellFilter = (item)=>{
	if (item.name != craft_target.name){
		return false
	}
	// 料理type 23，血瓶43
	if (item.type == 23 || item.type == 43){
		if(item.count == 3){
			return true
		}
		return false
	}else{
		return true
	}
}

// 本方法需要多层if来避免循环判断带来的循环浪费
var checkaim = (playerInfo)=>{
	//如果每次制造循环都判断是否到达双百，性能过于浪费。通过开启warnflag来避免这一问题
	if(warn_flag){
		if(playerInfo['detail'].manu_endurance == 100 && playerInfo['detail'].manu_skillful == 100){
			console.log('注意：人物已经刷到了双百，再刷下去也只是金钱和声望的增长，望周知')
			return
		}
	}else{
		return
	}

}
var loop = ()=>{

	// console.log('skillname = ' + teachers[0].skillname)
	// console.log('location = ' + teachers[0].location)
	// console.log('path = ' + teachers[0].path)
	// console.log('pos = ' + teachers[0].pos)

	var craftSkillList = cga.GetSkillsInfo().filter((sk)=>{
		return (sk.name.indexOf('制') == 0 || sk.name.indexOf('造') == 0 || sk.name.indexOf('铸') == 0 || sk.name.indexOf('料理') == 0 || sk.name.indexOf('制药') == 0);
	});

	for(var i in craftSkillList){
		if(craftSkillList[i].name == configTable.craftType){				
			thisobj.craftSkill = craftSkillList[i];
			thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);
			break;
		}
	}
	
	if(!thisobj.craftSkill)
	{
		var teacher = teachers.find((t)=>{
			return t.skillname == configTable.craftType;
		})
		if(teacher != undefined){
			craft_count = 0;
			forgetAndLearn(teacher, loop);
			return;
		} else {
			throw new Error('没有学习对应的制造技能!');
		}
	}

	callSubPluginsAsync('prepare', ()=>{
		
		craft_target = getBestCraftableItem();
		if(!craft_target){
			throw new Error('没有可制造的双百物品!');
			return;
		}
		
		if(thisobj.craftSkill.lv >= thisobj.forgetSkillAt){
			var teacher = teachers.find((t)=>{
				return t.skillname == thisobj.craftSkill.name;
			})
			if(teacher != undefined){
				craft_count = 0;
				forgetAndLearn(teacher, loop);
				return;
			}
		}

		var playerInfo = cga.GetPlayerInfo();
		// UNAecho:当制作物品消耗低于35耗魔，而角色蓝量低于35并且受伤的时候，脚本会陷入无限等待的状态。添加一个35耗魔的补魔判断
		if(playerInfo.mp < 35 || playerInfo.mp < craft_target.cost) {
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(loop, 3000);
			});
			return;
		}
		
		if(playerInfo.health > 0) {
			healObject.func(loop);
			return;
		}
		
		var inventory = cga.getInventoryItems();
		// 新增法兰城判断：如果在法兰城，猜测刚卖完道具，临回去前做了一点东西，先卖掉再回里谢里雅堡等待材料，节约背包空间
		if(inventory.length >= 15 || (cga.getItemCount(sellFilter) > 0 && cga.GetMapName() == '法兰城')){
			cleanUseless(loop);
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
			
			//包满
			if(cga.getInventoryItems().length >= 15){
				loop();
				return;
			}
			
			//升级?
			if(cga.findPlayerSkill(thisobj.craftSkill.name).lv != thisobj.craftSkill.lv){
				// 开启警告flag，用于接下来提醒是否已经刷满双百
				warn_flag = true
				loop();
				return;
			}
			
			// console.log('开始制造：'+craft_target.name);

			cga.craftItemEx({
				craftitem : craft_target.name,
				immediate : true
			}, (err, results)=>{

				if(results && results.success){
					craft_count ++;
					// console.log('已造' + craft_count + '次');
					//检查是否刷满双百
					if(!aim_flag){
						checkaim(playerInfo)
					}
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
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(pair.field == 'craftType'){
			pair.field = '制造类型';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'listenPort'){
			pair.field = '监听端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'forgetSkillAt'){
			pair.field = '几级之后删除技能';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(healObject.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{
		
		configTable.craftType = obj.craftType;
				
		if(!configTable.craftType){
			console.error('读取配置：制造类型失败！');
			return false;
		}
		
		configTable.forgetSkillAt = obj.forgetSkillAt;
		thisobj.forgetSkillAt = obj.forgetSkillAt
		
		if(!thisobj.forgetSkillAt){
			console.error('读取配置：几级之后删除技能失败！');
			return false;
		}

		configTable.listenPort = obj.listenPort;
		thisobj.listenPort = obj.listenPort
		
		if(!thisobj.listenPort){
			console.error('读取配置：监听端口失败！');
			return false;
		}
		
		if(!healObject.loadconfig(obj))
			return false;
		
		return true;
	},
	inputcb : (cb)=>{

		var stage1 = (cb2)=>{
			var craftSkillList = cga.GetSkillsInfo().filter((sk)=>{
				return (sk.name.indexOf('制') == 0 || sk.name.indexOf('造') == 0 || sk.name.indexOf('铸') == 0 );
			});
			
			var sayString = '【双百插件】请选择刷的技能:';
			for(var i in craftSkillList){
				if(i != 0)
					sayString += ', ';
				sayString += '('+ (parseInt(i)+1) + ')' + craftSkillList[i].name;
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && craftSkillList[index - 1]){
					configTable.craftType = craftSkillList[index - 1].name;
					thisobj.craftSkill = craftSkillList[index - 1];
					thisobj.craftItemList = cga.GetCraftsInfo(thisobj.craftSkill.index);

					var sayString2 = '当前已选择:[' + thisobj.craftSkill.name + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					return false;
				}
				
				return true;
			});
		}
		
		var stage2 = (cb2)=>{
			
			var sayString = '【双百插件】请选择几级之后删除技能: (2~11，11为不删除) (目前已支持所有制造系技能)';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && 2 >= 2 && 11 <= 11){
					configTable.forgetSkillAt = val;
					thisobj.forgetSkillAt = val;
					
					var sayString2 = '当前已选择:'+thisobj.forgetSkillAt+'级之后删除技。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		
		var stage3 = (cb2)=>{
			
			var sayString = '【双百插件】请选择服务监听端口: 1000~65535';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 1000 && val <= 65535){
					configTable.listenPort = val;
					thisobj.listenPort = val;
					
					var sayString2 = '当前已选择:监听端口='+thisobj.listenPort+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		
		Async.series([stage1, stage2, stage3, healObject.inputcb], cb);
	},
	execute : ()=>{
	
		io.listen(thisobj.listenPort);
		callSubPlugins('init');
		loop();
	},
};

module.exports = thisobj;