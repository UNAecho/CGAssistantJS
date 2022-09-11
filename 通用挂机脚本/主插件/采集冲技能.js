var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var mineObject = null;
var healObject = require('./../公共模块/治疗自己');
var healPetObject = require('./../公共模块/治疗宠物');
var supplyObject = require('./../公共模块/通用登出回补');
var configMode = require('../公共模块/读取战斗配置');

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)
var job = professionalInfo.jobmainname
var skillname = professionalInfo.skill

// 大于这个等级的采集者才能去任何地方收集，否则最多去6级材料的地点，防止跑路的时候受伤、掉魂。
var limitLv = 80

/**
 * 原料采集信息，樵夫使用采花冲级，因为前6级都可以去花田。
 * 需要设置不能采集的物品，像砂糖不可以卖店，则需要跳过，改为打其他材料。
 * 注意使用display_name而不是name来判定材料，这样可以区分不同国家采集的物品，如辣椒和辣椒哥拉尔
 *  */ 
var mineDict = {
	'狩猎' : require('./../公共模块/狩猎.js').mineArray.filter(i=>{
		if (i.display_name != '砂糖'){
			return true
		}
		return false
	}),
	'伐木' : require('./../公共模块/采花.js').mineArray,
	'挖掘' : require('./../公共模块/挖矿.js').mineArray,
}

var chooseSkill = (cb)=>{

	var playerinfo = cga.GetPlayerInfo();
	var skill = cga.findPlayerSkill(skillname)
	if (skill && skill.lv != skill.maxlv){
		thisobj.skill = skill
		mineObject = mineDict[thisobj.skill.name].find((m)=>{
			// 低级保护，采集7级或以上材料的时候可能会出现赶路受伤掉混的情况，这时封顶使用6级物品冲技能。
			// 可能会出现6级物品被删了的情况（例如技能是狩猎时，砂糖无法卖店，故删除砂糖），所以使用m.level > 5，6级没有就用7级产品。
			if(skill.lv > 5 && m.level > 5 && playerinfo.level < limitLv){
				console.log('等级低于【'+limitLv+'】级，为了避免受伤，尽量选择6级材料来冲技能。')
				return true
			}
			if(m.level == skill.lv){
				return true
			}
			return false
		});
		console.log('检测到你是【' + job +'】，并且【'+thisobj.skill.name+'】没有烧满，出发去采集【' + mineObject.name + '】来冲技能')
		if (cb) cb(null)
		return
	}else{
		for (var key in mineDict) {
			skill = cga.findPlayerSkill(key)
			if (skill && skill.lv != skill.maxlv) {
				thisobj.skill = skill
				mineObject = mineDict[thisobj.skill.name].find((m)=>{
					// 同上，低级保护。
					if(skill.lv > 5 && m.level > 5 && playerinfo.level < limitLv){
						console.log('等级低于【'+limitLv+'】级，为了避免受伤，尽量选择6级材料来冲技能。')
						return true
					}
					if(m.level == skill.lv){
						return true
					}
					return false
				});
				console.log('检测到你是【' + job +'】，但本职技能【'+ skillname +'】已经烧满，现检测到【'+thisobj.skill.name+'】没有烧满，出发去采集【' + mineObject.name + '】来把其他采集技能冲满')
				if (cb) cb(null)
				return
			}
		}
	}
	if(!mineObject){
		mineObject = mineDict[thisobj.skill.name].find((m)=>{
			if(m.level == 1){
				return true
			}
			return false
		});
		console.log('当前所有的采集技能已经冲满，开始使用1级本职技能来刷声望，等待玩家自行采取下一步行动。')
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
		if ([23, 43].indexOf(item.type) != -1) {
			item.count /= 3
			item.count = Math.floor(item.count)
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
		cga.sayLongWords(word, 0, 3, 1);
		loop()
	},
};

module.exports = thisobj;