var Async = require('async');
var supplyMode = require('./../公共模块/营地回补');
var supplyCastle = require('./../公共模块/里堡回补');
var supplyWeinuoya = require('./../公共模块/维村回补');
var teamMode = require('./../公共模块/组队模式');
var logbackEx = require('./../公共模块/登出防卡住');
var log = require('./../../unalog');

var cga = global.cga;
var configTable = global.configTable;

// 提取本地宠物数据
const petInfoObj = require('./../../常用数据/petInfo.js');
var petGrade = new require('./../../常用数据/petGrade.js');
// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)

var interrupt = require('./../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;
var calculateInterrupt = new interrupt();
var calculateRunning = false;

// 是否去银行存储宠物flag，如无需要，不要修改
var saveFlag = false
// 宠物档位记录
var gradeDict = {}
// 能力String，打印log使用
var translateArray = ['体力','力量','防御','敏捷','魔法']
// 法兰地区，需要传送石
var falanCountry = [
	'圣拉鲁卡村',
	'伊尔村',
	'亚留特村',
	'维诺亚村',
	'奇利村',
	'加纳村',
	'杰诺瓦镇',
	'蒂娜村',
	'阿巴尼斯村',]
// 艾尔巴尼亚王国
var albaniaCountry = [
	'哥拉尔镇',
	'雷克塔尔镇',
	'鲁米那斯村',
	'米诺基亚村',
]
// 苏国
var suCountry = [
	'阿凯鲁法村',
	'坎那贝拉村',
]
// 神圣大陆
var sacredContinent = [
	'艾尔莎岛',
	'丘斯特村',
]
// 天界
var Celestial = [
	'辛梅尔',
]
// 神域
var divineDomain = [
	'圣骑士营地',
	'矮人城镇',
]

var supplyArray = [supplyWeinuoya, supplyCastle, supplyMode, ];

var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}
// 获取去集散地的函数，功能为决定是使用传送石还是坐船出国
var getMap = (muster)=>{
	if(falanCountry.indexOf(muster)){
		return function (cb) {
			cga.travel.falan.toTeleRoom(muster, cb);
			return
		}
	}
	return
}

var commonPilot = (cb)=>{
	var mapindex = cga.GetMapIndex().index3;
	var muster = thisobj.targetPet.muster
	var goFunc = getMap(muster.map)

	if(mapindex == cga.travel.falan.info[muster.map].mainindex){
		setTimeout(cb, 1000);
	}
	else if(cga.travel.switchMainMap() == cga.travel.falan.info[muster.map].mainName && mapindex != cga.travel.falan.info[muster.map].mainindex){
		cga.travel.autopilot('主地图',()=>{
			commonPilot(cb)
		})
	}else{
		console.log('先去集散地:' + muster.map + ',如果有队友，则在那里组队')
		goFunc(()=>{
			commonPilot(cb)
		})
	}
	return
}

// 欢迎信息，可写入插件介绍等信息。
var welcome = ()=>{
	var welcomeWord = '欢迎使用【UNA脚本】【自动抓宠+精确算档】，当前抓【'+thisobj.petGrade+'】档及以上宠物。本脚本包含精确算档功能，请认真检查您输入的理想档位，以免丢弃理想宠物。'
	cga.sayLongWords(welcomeWord, 1, 3, 1);
	return
}

// 检查卡片信息、封印技能等
var check = ()=>{
	if(professionalInfo.jobmainname == '封印师'){
		var petCardInfo = petInfoObj.getPetCardInfo(thisobj.targetPet.realname)
		if(!petCardInfo || petCardInfo.can_catch == 0){
			throw new Error('错误，无法查询到宠物卡片登记信息，或该宠物无法封印。')
		}
		if(!cga.findPlayerSkill('精灵的盟约')){
			throw new Error('错误，你没有精灵的盟约，请学习后再运行抓宠脚本')
		}
	}else{
		console.log('你不是封印师，将进入跟队陪跑模式')
	}
	return
}

var savePets = (cb)=>{
	console.log('去存宠物..')
	cga.travel.falan.toBank(() => {
		cga.walkList([
			[11, 8],
		], () => {
			cga.turnDir(0);
			cga.AsyncWaitNPCDialog(() => {
				cga.savePetToBankAll((pet)=>{
					var petId = petGrade.generatePetId(pet)
					if(gradeDict[petId] && gradeDict[petId].dropFlag === false){
						return true
					}
					return false
				}, 
				false, 
				(r) => {
					if(r){
						if(r.message.indexOf('没有空位') >= 0 && cga.GetPetsInfo().length == 5){
							console.log('银行与身上宠物栏位均已满')
							exit(()=>{
								process.exit(0)
							})
							return
						}
					}
					setTimeout(cb, 3000);
				});
			}, 1000);
		});
	});
}

var exit =(cb)=>{
	cga.gui.LoadScript({
        autorestart : false, //自动重启脚本开启
    }, (err, result)=>{
        console.log(result);
		if (cb) cb(true)
    })
}

// TODO 如果在迷宫里，怎样进行适配，因为封印的场地经常会在随机迷宫中
var walkMazeForward = (cb)=>{
	var map = cga.GetMapName();
	if(map == '黑龙沼泽'+(thisobj.layerLevel)+'区'){
		cb(true);
		return;
	}
	if(map == '肯吉罗岛'){
		cb(false);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		if(err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('黑龙沼泽') >= 0)
		{
			cb(true);
			return;
		}
		walkMazeForward(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return '黑龙沼泽'+(layerIndex + 1)+'区';
		},
		entryTileFilter : (e)=>{
			return e.colraw == 0x2EE2;
		}
	});
}
// TODO 如果在迷宫里，怎样进行适配，因为封印的场地经常会在随机迷宫中
var walkMazeBack = (cb)=>{
	var map = cga.GetMapName();
	if(map == '肯吉罗岛'){
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err)=>{
		walkMazeBack(cb);
	}, {
		layerNameFilter : (layerIndex)=>{
			return layerIndex > 1 ? ('黑龙沼泽'+(layerIndex - 1)+'区') : '肯吉罗岛';
		},
		entryTileFilter : (e)=>{
			return (cga.GetMapName() == '黑龙沼泽1区') ? (e.colraw == 0) : (e.colraw == 0x2EE0);
		}
	});
}

var moveThink = (arg)=>{

	if(moveThinkInterrupt.hasInterrupt())
		return false;

	if(arg == 'freqMoveMapChanged')
	{
		playerThinkInterrupt.requestInterrupt();
		return false;
	}

	return true;
}

var playerThink = ()=>{

	if(!cga.isInNormalState())
		return true;
	
	var playerinfo = cga.GetPlayerInfo();
	var items = cga.GetItemsInfo();
	var pets = cga.GetPetsInfo();
	var ctx = {
		playerinfo : playerinfo,
		petinfo : playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
		teamplayers : cga.getTeamPlayers(),
		dangerlevel : thisobj.getDangerLevel(),
		inventory : items.filter((item)=>{
			return item.pos >= 8 && item.pos < 100;
		}),
		equipment : items.filter((item)=>{
			return item.pos >= 0 && item.pos < 8;
		}),
		result : null,
	}

	teamMode.think(ctx);

	global.callSubPlugins('think', ctx);

	if(cga.isTeamLeaderEx())
	{
		var interruptFromMoveThink = false;
		
		if(ctx.result == null && playerThinkInterrupt.hasInterrupt())
		{
			ctx.result = 'supply';
			interruptFromMoveThink = true;
		}

		var supplyObject = null;

		if(ctx.result == 'supply')
		{
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			supplyObject = getSupplyObject(map, mapindex);
			if(supplyObject && supplyObject.isLogBack(map, mapindex))
				ctx.result = 'logback';
		}
		
		if( ctx.result == 'supply' && supplyObject)
		{
			if(interruptFromMoveThink)
			{
				supplyObject.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						supplyObject.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}
		else if( ctx.result == 'logback' || ctx.result == 'logback_forced' )
		{
			if(interruptFromMoveThink)
			{
				logbackEx.func(loop);
				return false;
			}
			else
			{
				moveThinkInterrupt.requestInterrupt(()=>{
					if(cga.isInNormalState()){
						logbackEx.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}
	} else {
		if( ctx.result == 'logback_forced' )
		{
			logbackEx.func(loop);
			return false;
		}
	}

	// UNA添加逻辑:宠物算档，由于仅有抓宠需要算档，估直接将算档逻辑耦合在本脚本playerthing中，而非写成子插件。
	for(var i in pets){
		if(pets[i].realname == thisobj.targetPet.realname && pets[i].level <= thisobj.targetLv){
			var petId = petGrade.generatePetId(pets[i])
			// 如果有记录就直接看记录，没有就需要算
			if(gradeDict[petId]){
				if(cga.isInNormalState() && gradeDict[petId].dropFlag === true){
					cga.DropPet(pets[i].index)
				}// 给符合条件的宠物命名
				else if(cga.isInNormalState() && gradeDict[petId].dropFlag === false && (pets[i].name == pets[i].realname || pets[i].name == '')){
					var rename = gradeDict[petId]['最可能情况'].grade + '档'
					cga.ChangePetName(pets[i].index,rename)
				}// 如果目标宠物已满，则进行处理。
				else if(i == (pets.length - 1) && !calculateRunning && cga.GetPetsInfo().length == 5){
					// 如果计算器没有在运行，并且最后一个宠物也满足保留条件，则触发储存宠物flag去存储宠物。
					cga.SayWords('【UNA脚本提示】符合档位的宠物已满，需要回补!', 0, 3, 1);
					saveFlag = true

					if(interruptFromMoveThink)
					{
						savePets(loop);
						return false;
					}
					else
					{
						moveThinkInterrupt.requestInterrupt(()=>{
							if(cga.isInNormalState()){
								savePets(loop);
								return true;
							}
							return false;
						});
						return false;
					}
				}
			}else{
				calculateInterrupt.requestInterrupt(()=>{
					if(!calculateRunning){
						petGrade.calculate(pets[i])
						calculateRunning = true
					}
					if(petGrade.petGrade){
						if(petGrade.petGrade['最差掉档'].grade > thisobj.petGrade){
							// console.log('计算结果:最差为' + petGrade.petGrade['最差掉档'].grade +'档，目标档位:' + thisobj.petGrade + '档，丢弃')
							petGrade.petGrade.dropFlag = true
							var logString = (new Date()).toLocaleString() + '宠物:['+pets[i].realname+'],可能为:'+petGrade.petGrade['最可能情况'].grade+'档:'+ JSON.stringify(petGrade.petGrade)
							log.writeLine(logString)
						}else{// 如果最差掉档依然可以接受，那么判定每项能力的掉档是否满足，如果不符，继续丢弃。
							if(thisobj.minimumSingleGrade){
								var gradeMatrix = petGrade.petGrade['掉档概率矩阵']
								for(var j = 0;j < 5; j++){
									var total = 0.0
									for (var k = 0; k <= thisobj.minimumSingleGrade[j];k++){
										total = total + gradeMatrix[j][k]
									}
									// 如果从0档-目标档位加和概率小于等于50%，则视为不满足条件。
									// 例：掉档矩阵为：0档20%，1档40%，2档40%，
									// 目标是1档的话，就是0档的20%+1档的40%，也就是至少有60%概率是优于等于1档的，满足目标条件。
									// 如果目标为0档，那么0档的20%是不满足50%的，此时需要抛弃。
									if(total <= 0.5){
										console.log('['+translateArray[j] +']['+ thisobj.minimumSingleGrade[j] + ']档概率:'+String(total*100)+'%,小于50%，丢弃')
										petGrade.petGrade.dropFlag = true
										var logString = '宠物:['+pets[i].realname+'],可能为:'+petGrade.petGrade['最可能情况'].grade+'档:'+ JSON.stringify(petGrade.petGrade)
										log.writeLine(logString)
										break
									}else{
										petGrade.petGrade.dropFlag = false
									}
								}
								console.log('宠物:['+pets[i].realname+'],可能为:'+petGrade.petGrade['最可能情况'].grade+'档，满足条件')
							}else{
								petGrade.petGrade.dropFlag = false
							}
						}
						gradeDict[petId] = petGrade.petGrade

						calculateRunning = false
						return true;
					}
					return false;
				});
				// 由于是异步处理，需要加break中止循环，防止下一个playerthink又发出了同一个宠物的计算请求
				break
			}
		}
    }

	return true;
}

var playerThinkTimer = ()=>{
	if(playerThinkRunning){
		if(!playerThink()){
			console.log('playerThink off');
			playerThinkRunning = false;
		}
	}
	
	setTimeout(playerThinkTimer, 1500);
}

var loop = ()=>{
	// console.log('loop........')
	var pets = cga.GetPetsInfo();

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var isleader = cga.isTeamLeaderEx();
	// TODO 添加非playerthink阶段也能算档的逻辑，一种想法是添加和playerthink一样模式的calculateThink，在execute()阶段就执行。

	if(isleader && teamMode.is_enough_teammates()){

		if(cga.needSupplyInitial())
		{
			var supplyObject = getSupplyObject(map, mapindex);
			if(supplyObject)
			{
				supplyObject.func(loop);
				return;
			}
		}
		callSubPluginsAsync('prepare', ()=>{
			if(mapindex == thisobj.targetPet.cradle.index){
				console.log('开始去指定地点捕捉..')
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
	
				cga.walkList([
				thisobj.targetPet.cradle.pos
				], ()=>{
					var xy = cga.GetMapXY();
					var dir = cga.getRandomSpaceDir(xy.x, xy.y);
					cga.freqMove(dir);
				});
				return;
			}
			else if(mapindex == cga.travel.falan.info[thisobj.targetPet.muster.map].mainindex){
				console.log('从集散地出发去宠物捕捉地点..')
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;
	
				thisobj.targetPet.goToDestination(loop)
				return
			}
			else{
				commonPilot(loop)
				return
			}
		});
		return

	} else if(!isleader){
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;
		return;
	}
	
	if(cga.needSupplyInitial())
	{
		var supplyObject = getSupplyObject(map, mapindex);
		if(supplyObject)
		{
			supplyObject.func(loop);
			return;
		}
	}

	callSubPluginsAsync('prepare', ()=>{
		commonPilot(()=>{
			cga.walkList(
				cga.isTeamLeader ? [thisobj.targetPet.muster.pos] : [cga.getRandomSpace(thisobj.targetPet.muster.pos[0],thisobj.targetPet.muster.pos[1])], ()=>{
					teamMode.wait_for_teammates(loop);
			  });
		})
	});
}

var thisobj = {
	getDangerLevel : ()=>{// TODO:适配全局的DangerLevel逻辑
		var map = cga.GetMapName();
		
		// if(map == '肯吉罗岛' )
		// 	return 1;
		
		// if(map.indexOf('黑龙沼泽') >= 0)
		// 	return 2;
		
		// return 0;
		return 1;
	},
	translate : (pair)=>{
		
		if(pair.field == 'targetPet'){
			pair.field = '目标宠物';
			if(typeof pair.value == 'number'){
				pair.value = Object.keys(petInfoObj.getPetInfoDict)[pair.value - 1]
			}else{
				pair.value = pair.value;
			}
			pair.translated = true;
			return true;
		}
		if(pair.field == 'targetLv'){
			pair.field = '目标等级(小于等于)';
			if(typeof pair.value == 'number'){
				pair.value = pair.value
			}else{
				pair.value = parseInt(pair.value);
			}
			pair.translated = true;
			return true;
		}

		if(pair.field == 'petGrade'){
			pair.field = '期望档位';
			pair.value = pair.value + '档';
			pair.translated = true;
			return true;
		}
		if(pair.field == 'minimumSingleGrade'){
			pair.field = '宠物单项能力期望档位';
			// 因为pair.value仅接受string和number，而minimumSingleGrade是数组，
			pair.value = (pair.value == undefined ? pair.value : pair.value.join(','));
			pair.translated = true;
			return true;
		}

		if(supplyMode.translate(pair))
			return true;

		if(teamMode.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{

		if(!supplyMode.loadconfig(obj))
			return false;
		
		if(!teamMode.loadconfig(obj))
			return false;
		
		configTable.targetPet = obj.targetPet;
		
		if(typeof obj.targetPet == 'number'){
			thisobj.targetPet = petInfoObj.getPetInfoDict[Object.keys(petInfoObj.getPetInfoDict)[obj.targetPet - 1]]
		}else{
			thisobj.targetPet = petInfoObj.getPetInfoDict[obj.targetPet]
		}

		if(!thisobj.targetPet){
			console.error('读取配置：目标宠物失败！');
			return false;
		}
		
		configTable.targetLv = obj.targetLv;
		
		if(typeof obj.targetLv == 'number'){
			thisobj.targetLv = obj.targetLv
		}else{
			thisobj.targetLv = parseInt(obj.targetLv)
		}

		if(!thisobj.targetLv){
			console.error('读取配置：目标等级失败！');
			return false;
		}

		configTable.petGrade = obj.petGrade;
		thisobj.petGrade = obj.petGrade
		
		if(typeof thisobj.petGrade != 'number' && !thisobj.petGrade){
			console.error('读取配置：期望档位失败！');
			return false;
		}
				
		if((typeof thisobj.petGrade == 'number' && thisobj.petGrade > 20)){
			console.error('读取配置：期望档位失败！档位不能大于20');
			return false;
		}

		if(obj.minimumSingleGrade && obj.minimumSingleGrade.length == 5){
			var gradeCount = 0
			
			for(var i in obj.minimumSingleGrade){
				gradeCount += obj.minimumSingleGrade[i]
			}
			if(gradeCount > thisobj.petGrade){
				console.error('读取配置：单项期望档位失败！单项档位的总和不能大于期望档位。');
				return false
			}
		}else if(obj.minimumSingleGrade && obj.minimumSingleGrade.length > 0 && obj.minimumSingleGrade.length < 5){
			console.error('读取配置：单项期望档位失败！体力防敏魔5个能力均需指定。');
		}
		
		configTable.minimumSingleGrade = obj.minimumSingleGrade;
		thisobj.minimumSingleGrade = obj.minimumSingleGrade

		return true;
	},
	inputcb : (cb)=>{
		Async.series([supplyMode.inputcb, teamMode.inputcb, (cb2)=>{
			var sayString = '【UNA抓宠插件】请选择要抓的宠物，输入编号或者宠物的原始名称:[';
			var petsDict = petInfoObj.getPetInfoDict
			var petsName = Object.keys(petInfoObj.getPetInfoDict)
			for(var i in petsName){
				if(i != 0){
					sayString += ', ';
				}
				sayString += '('+ (parseInt(i)+1) + ')' + petsName[i];
			}
			sayString += ']。';
			
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 1 && petsName[val - 1]){
					configTable.targetPet = val;
					thisobj.targetPet = petInfoObj.getPetInfoDict[Object.keys(petInfoObj.getPetInfoDict)[val - 1]]
					
					var sayString2 = '当前已选择:['+thisobj.targetPet.realname+']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}else if(val !== null && typeof val == 'string' && petsDict[val]){
					configTable.targetPet = val;
					thisobj.targetPet = petInfoObj.getPetInfoDict[val];
					
					var sayString2 = '当前已选择:['+thisobj.targetPet.realname+']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}, (cb2)=>{
			var sayString = '【UNA抓宠插件】请选择捕捉宠物的等级(小于等于)，想抓1级宠物输入1。';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val < 161){
					configTable.targetLv = val;
					thisobj.targetLv = val;
					
					var sayString2 = '当前已选择抓小于等于:'+thisobj.targetLv+'级的宠物。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		},  (cb2)=>{
			var sayString = '【UNA算档插件】请选择捕捉宠物的期望档位(0~20)，大于这个档位的将被丢弃。注意档位数字越小代表越好。';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val < 21){
					configTable.petGrade = val;
					thisobj.petGrade = val;
					
					var sayString2 = '当前已选择期望档位:'+thisobj.petGrade+'档。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}, (cb2)=>{
			var minimumSingleGrade = []
			var petGradeCount = 0
			var ask = (cb3, name)=>{
				var sayString = '【UNA算档插件】请选择宠物能力【'+name+'】的期望档位，差于这个档位将被丢弃。:';
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, val)=>{
					
					if(val !== null && val >= 0 && val < 5){
						petGradeCount += val
						if(petGradeCount <= thisobj.petGrade){
							minimumSingleGrade.push(val)
							configTable.minimumSingleGrade = minimumSingleGrade;
							thisobj.minimumSingleGrade = minimumSingleGrade;
							
							var sayString2 = '已选择:'+name+'大于[' + minimumSingleGrade[minimumSingleGrade.length - 1] + ']档丢弃。';
							cga.sayLongWords(sayString2, 0, 3, 1);
							
							cb3(null);
							
							return false;
						}else{
							var sayString3 = '【UNA脚本提示】错误，您输入的单个能力档位加和累计:【'+petGradeCount+'】，已超越总期望掉档【'+thisobj.petGrade+'】，请重新运行脚本以输入';
							cga.sayLongWords(sayString3, 6, 3, 1);
						}
					}
					
					return true;
				});
			}
			
			ask(()=>{
				ask(()=>{
					ask(()=>{
						ask(()=>{
							ask(()=>{
								cb2(null);
							}, '魔法');
						}, '敏捷');
					}, '防御');
				}, '力量');
			}, '体力');
		},], cb);
	},
	execute : ()=>{
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		welcome()
		check()
		loop()
	},
};

module.exports = thisobj;