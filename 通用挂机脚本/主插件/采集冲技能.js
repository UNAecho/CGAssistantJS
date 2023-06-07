var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var mineObject = null;
var rootdir = cga.getrootdir()
var healObject = require(rootdir + '/通用挂机脚本/公共模块/治疗自己');
var healPetObject = require(rootdir + '/通用挂机脚本/公共模块/治疗宠物');
var supplyObject = require(rootdir + '/通用挂机脚本/公共模块/通用登出回补');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

var job = cga.job.getJob().job
var skillname = professionalInfo.skill

// 声望数据
const reputationInfos = require(rootdir + '/常用数据/reputation.js');

// 40级以下无法过莎莲娜海底。
var limitLv = 40
// 如果是制造系冲技能，当全满时，使用何种技能1级来挂机等待下一步人工决策。
var tmpskill = '挖掘'

/**
 * 原料采集信息。
 * 需要设置不能采集的物品，像砂糖不可以卖店，则需要跳过，改为打其他材料。
 *  */ 
var mineDict = {
	'狩猎' : require(rootdir + '/通用挂机脚本/公共模块/狩猎.js').mineArray.filter(i=>{
		if (['砂糖'].indexOf(i.name) != -1){
			return false
		}
		return true
	}),
	'伐木' : require(rootdir + '/通用挂机脚本/公共模块/采花.js').mineArray,
	'挖掘' : require(rootdir + '/通用挂机脚本/公共模块/挖矿.js').mineArray,
}

var chooseSkill = (cb)=>{

	var playerinfo = cga.GetPlayerInfo();
	var skill = null
	// 每次选目标技能，都要初始化之前的记录
	thisobj.skill = null
	mineObject = null

	if(playerinfo.level < limitLv)
		console.warn('【UNA脚本警告】：你没有【'+limitLv+'】级，冲不了10级哦。')

	for (var key in mineDict) {
		skill = cga.findPlayerSkill(key)
		// UNA：cga.GetSkillsInfo()返回的信息中，当前的技能会有大于等级上限的BUG，比如当前3级而max是2级。所以使用skill.lv < skill.maxlv来判断是否要冲
		if (skill && skill.lv < skill.maxlv) {
			thisobj.skill = skill
			mineObject = mineDict[thisobj.skill.name].find((m)=>{
				// 由于7级开始采集的效率显著降低，故改为6级开始一直打6级材料至10级。并且因此规避了去高级材料地区带来的人物阵亡风险，理论上40级即可完全冲满10级采集。
				if(skill.lv > 6){
					if(m.level == 6){
						return true
					}
				}else{
					if(skill.lv == m.level){
						return true
					}
				}
				return false
			});
		}
		// 如果本职技能冲满了需要晋级，优先做任务晋级
		else if(skill && skill.lv < 10 && skill.lv >= skill.maxlv && key == skillname){
			var playerCurrentInfo = cga.GetPlayerInfo()
			// 计算当前声望是否有资格晋级
			var jobLv = getprofessionalInfos.getJobLevel(playerCurrentInfo.job)
			var titleinfo = reputationInfos.getReputation(playerCurrentInfo.titles)
			var minimumLv = reputationInfos.promoteReputation[jobLv]
			// 必须大于等于晋级称号
			if(titleinfo['titleLv'] >= minimumLv){
				var config = cga.loadPlayerConfig()
				if(skill.lv == 4){
					if (config && config['mission']['咖哩任务']){
						setTimeout(()=>{
							jump('职业晋级')
						},2000)
					}else{
						setTimeout(()=>{
							updateConfig.update_config({'mainPlugin' : '咖哩任务'})
						},2000)
					}
					return
				}else if(skill.lv == 6){
					var manu_endurance = playerCurrentInfo['detail'].manu_endurance
					var manu_skillful = playerCurrentInfo['detail'].manu_skillful
					if(manu_endurance == 100 && manu_skillful == 100){
						if (config && config['mission']['起司的任务']){
							setTimeout(()=>{
								jump('职业晋级')
							},2000)
						}else{
							setTimeout(()=>{
								updateConfig.update_config({'mainPlugin' : '起司的任务'})
							},2000)
						}
						return
					}
				}else if(skill.lv == 8){
					if (config && config['mission']['魔法大学']){
						setTimeout(()=>{
							jump('职业晋级')
						},2000)
					}else{
						setTimeout(()=>{
							updateConfig.update_config({'mainPlugin' : '魔法大学'})
						},2000)
					}
					return
				}
			}
		}
		// 如果有本职技能没有烧满，则优先选择烧本职技能
		if(mineObject && key == skillname){
			if(cb) cb(null)
			return
		}
	}

	// 如果全都烧满了。则用1级采集赚点零钱，等待人工后续决策。
	if(!mineObject){
		// 采集系使用1级本职技能顺带刷点声望。
		if(mineDict[skillname]){
			mineObject = mineDict[skillname].find((m)=>{
				if(m.level == 1){
					return true
				}
				return false
			});
			thisobj.skill = cga.findPlayerSkill(skillname)
			console.log('【UNA脚本提示】你当前职级的采集技能已全部冲满，使用1级本职技能刷声望顺带赚点外快，等待人工后续决策。')
		}else{
			mineObject = mineDict['挖掘'][0]
			thisobj.skill = cga.findPlayerSkill(tmpskill)

			var jobLevel = getprofessionalInfos.getJobLevel(playerinfo.job)
			console.log('你当前职级的采集技能已全部冲满' + (jobLevel < 4 ? '，如需继续提升，请晋级。【注意】4转开始，制造系的采集技能上限为5级，而采集技能升到5级后，会降智力，提升耐力。已经双百的账号请注意。' : ''))
			return
		}
	}else{
		console.log('检测到你是【' + job +'】，并且【'+thisobj.skill.name+'】没有烧满，出发去采集【' + mineObject.name + '】来冲技能')
	}
}

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
		// 丢弃物品栏中不属于当前采集目标的物品，只涉及可采集的物品。
		if([29, 30, 31, 32, 34, 35, 36, 40].indexOf(item.type) != -1 && item.name != mineObject.name) {
			dropItemPos = item.pos;
			return;
		}
	});
	
	if(dropItemPos != -1)
		cga.DropItem(dropItemPos);
}

var cleanItems = (cb) =>{
	var sell = cga.findItemArray((item) => {
		// 23料理、43血瓶
		if ([23, 43].indexOf(item.type) != -1 && item.count == 3) {
			return true
		}// 29矿条、30木、31秘文之皮、32牛肉、34蕃茄、35其他食材、36花、40封印卡
		// id：18211是鹿皮，type也是26，特殊处理，因为很多其他物品type也是26
		else if (([29, 30, 31, 32, 34, 35, 36, 40].indexOf(item.type) != -1 || item.itemid == 18211)&& item.count %20 == 0 && item.name != '魔石' && item.name != '砂糖') {
			item.count /= 20
			item.count = Math.floor(item.count)
			return true
		} else if (item.name == '魔石') {
			item.count = 1
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
				cga.sellArray(sell, ()=>{
					// 如果读取完采集的目标，就计算赚钱效率
					if (mineObject){
						console.log('【'+ mineObject.name +'】效率为【'+Math.round((cga.GetPlayerInfo().gold - thisobj.startgold) / ((Date.now() - thisobj.starttime) / 1000 / 60)).toString()+'】魔币每【分钟】')
					}
					if (cb) cb()
				});
			});
		});
		return
	}else{
		if (cb) cb()
		return
	}

}

var loop = ()=>{

	chooseSkill()
	
	var playerInfo = cga.GetPlayerInfo();
	if(playerInfo.mp < playerInfo.maxmp || playerInfo.hp < playerInfo.maxhp)
	{
		supplyObject.func(loop);
		return;
	}

	if(cga.getInventoryItems().length >= 20)
	{
		cleanItems(loop)
		return;
	}

	var workwork = (err, result)=>{
		
		check_drop();
		
		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')){
			loop();
			return;
		}

		if(cga.getInventoryItems().length >= 20){
			loop();
			return;
		}
		
		if(playerInfo.health > 0){
			healObject.func(workwork);
			return;
		}

		var pets = cga.GetPetsInfo();
		for(var i = 0;i < pets.length; ++i){
			if(pets[i].health > 0)
				healPetObject.func(workwork,i);
		}
		
		if(thisobj.skill != null && !mineObject.workManager){
			cga.StartWork(thisobj.skill.index, 0);
			// cga.AsyncWaitWorkingResult使用方式见开发文档
			cga.AsyncWaitWorkingResult((err, result)=>{
				workwork(err, result);
			}, 10000);
		} else {// 如果模块有自己的采集方式，就使用自己的采集方式
			if(mineObject.workManager){
				mineObject.workManager((err,result)=>{
					workwork(err,result);
				});
			} else {
				setTimeout(workwork, 1500, null);
			}
		}
	}
	callSubPluginsAsync('prepare', ()=>{
		cleanItems(()=>{
			mineObject.func(workwork);
		})
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var map = cga.GetMapName();
		
		if(map == '芙蕾雅' )
			return 1;
		
		if(map == '米内葛尔岛' )
			return 2;
		
		if(map == '莎莲娜' )
			return 2;

		return 0;
	},
	translate : (pair)=>{
			
		if(healObject.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{

		if(!healObject.loadconfig(obj))
			return false;
		
		return true;
	},
	inputcb : (cb)=>{
		return
	},
	execute : ()=>{
		callSubPlugins('init');
		configMode.manualLoad('生产赶路')
		// 用于计算收入效率
		thisobj.starttime = Date.now()
		thisobj.startgold = cga.GetPlayerInfo().gold
		var word = '【UNA脚本】欢迎使用UNAの脚本【采集冲技能】模块，脚本会自动识别未满级的【狩猎】【伐木】【挖掘】，并调整路线自动烧技能。'
		// cga.sayLongWords(word, 0, 3, 1);
		loop()
	},
};

module.exports = thisobj;