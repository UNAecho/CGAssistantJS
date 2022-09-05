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

// 原料采集信息，樵夫使用采花冲级，因为前6级都可以去花田。
var mineDict = {
	'狩猎' : require('./../公共模块/狩猎.js').mineArray,
	'伐木' : require('./../公共模块/采花.js').mineArray,
	'挖掘' : require('./../公共模块/挖矿.js').mineArray,
}

var chooseSkill = (cb)=>{

	var skill = cga.findPlayerSkill(skillname)
	if (skill && skill.lv != skill.maxlv){
		thisobj.skill = skill
		mineObject = mineDict[thisobj.skill.name].find((m)=>{
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
		else if (([29, 30, 31, 32, 34, 35, 36, 40].indexOf(item.type) != -1 || item.itemid == 18211)&& item.count %20 == 0 && item.name != '魔石') {
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
				cga.sellArray(sell, cb);
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
		loop()
	},
};

module.exports = thisobj;