var Async = require('async');
var cga = global.cga;
var configTable = global.configTable;

var gatherObject = null;
var mineObject = null;
var doneObject = require('./../公共模块/采集后操作');
var healObject = require('./../公共模块/治疗自己');
var healPetObject = require('./../公共模块/治疗宠物');
var supplyObject = require('./../公共模块/通用登出回补');
var checkSettle = require('./../公共模块/登出检查定居地');

var gatherArray = [
{
	name : '挖矿',
	skill : '挖掘',
	path : './../公共模块/挖矿',
},
{
	name : '伐木',
	skill : '伐木',
	path : './../公共模块/伐木',
},
{
	name : '采花',
	skill : '伐木',
	path : './../公共模块/采花',
},
{
	name : '狩猎',
	skill : '狩猎',
	path : './../公共模块/狩猎',
},
{
	name : '双百新城鹿皮(狩猎)',
	skill : '狩猎',
	path : './../公共模块/双百新城鹿皮',
},
{
	name : '双百伊尔鹿皮(狩猎体验)',
	skill : '狩猎体验',
	path : './../公共模块/双百伊尔鹿皮',
},
{
	name : '双百挖铜(挖矿)',
	skill : '挖掘',
	path : './../公共模块/双百挖铜',
},
{
	name : '双百轻木(伐木)',
	skill : '伐木',
	path : './../公共模块/双百轻木',
},
{
	name : '双百苹果薄荷',
	skill : '伐木',
	path : './../公共模块/双百苹果薄荷',
},
{
	name : '双百柠檬草',
	skill : '伐木',
	path : './../公共模块/双百柠檬草',
},{
	name : '双百蝴蝶花',
	skill : '伐木',
	path : './../公共模块/双百蝴蝶花',
},{
	name : '双百果梨',
	skill : '伐木',
	path : './../公共模块/双百果梨',
},{
	name : '双百桃木',
	skill : '伐木',
	path : './../公共模块/双百桃木',
},{
	name : '双百番红花',
	skill : '伐木',
	path : './../公共模块/双百番红花',
},{
	name : '双百百里香',
	skill : '伐木',
	path : './../公共模块/双百百里香',
},{
	name : '双百瞿麦',
	skill : '伐木',
	path : './../公共模块/双百瞿麦',
},{
	name : '双百茴香',
	skill : '伐木',
	path : './../公共模块/双百茴香',
},{
	name : '双百七叶树',
	skill : '伐木',
	path : './../公共模块/双百七叶树',
},
{
	name : '双百买布',
	skill : null,
	path : './../公共模块/双百买布',
},
{
	name : '深蓝毒蛇',
	skill : '狩猎',
	path : './../公共模块/深蓝毒蛇',
},
{
	name : '深蓝萝卜',
	skill : '伐木',
	path : './../公共模块/深蓝萝卜',
},
{
	name : '深蓝瞿麦',
	skill : '伐木',
	path : './../公共模块/深蓝瞿麦',
},
{
	name : '深蓝百里香',
	skill : '伐木',
	path : './../公共模块/深蓝百里香',
},
{
	name : '鉴定刷家具',
	skill : '鉴定',
	path : './../公共模块/鉴定自动1到10',
},
{
	name : '鱼翅流水线鱼翅',
	skill : '狩猎',
	path : './../公共模块/鱼翅流水线鱼翅',
},
{
	name : '鱼翅流水线葱',
	skill : '狩猎',
	path : './../公共模块/鱼翅流水线葱',
},
{
	name : '鱼翅流水线鸡蛋',
	skill : '狩猎',
	path : './../公共模块/鱼翅流水线鸡蛋',
},
{
	name : '鱼翅流水线盐',
	skill : '狩猎',
	path : './../公共模块/鱼翅流水线盐',
},
{
	name : '蕃茄酱流水线蕃茄',
	skill : '狩猎',
	path : './../公共模块/蕃茄酱流水线蕃茄',
},
{
	name : '面包流水线小麦粉',
	skill : '狩猎',
	path : './../公共模块/面包流水线小麦粉',
},
{
	name : '面包流水线牛奶',
	skill : '狩猎',
	path : './../公共模块/面包流水线牛奶',
},
{
	name : '面包流水线盐',
	skill : '狩猎',
	path : './../公共模块/面包流水线盐',
},
{
	name : '烧鸡流水线盐',
	skill : '狩猎',
	path : './../公共模块/烧鸡流水线盐',
},
{
	name : '烧鸡流水线鸡肉',
	skill : '狩猎',
	path : './../公共模块/烧鸡流水线鸡肉',
},
{
	name : '烧鸡流水线胡椒',
	skill : '狩猎',
	path : './../公共模块/烧鸡流水线胡椒',
},
{
	name : '烧鸡流水线柠檬草',
	skill : '伐木',
	path : './../公共模块/烧鸡流水线柠檬草',
},{
	name : '寿喜锅流水线葱',
	skill : '狩猎',
	path : './../公共模块/寿喜锅流水线葱',
},{
	name : '寿喜锅流水线盐',
	skill : '狩猎',
	path : './../公共模块/寿喜锅流水线盐',
},{
	name : '寿喜锅流水线酱油',
	skill : '狩猎',
	path : './../公共模块/寿喜锅流水线酱油',
},{
	name : '寿喜锅流水线砂糖',
	skill : '狩猎',
	path : './../公共模块/寿喜锅流水线砂糖',
},{
	name : '寿喜锅流水线牛肉',
	skill : '狩猎',
	path : './../公共模块/寿喜锅流水线牛肉',
},{
	name : '双百采集',
	skill : null,
	path : './../公共模块/双百采集',
},
]

var isFabricName = (name)=>{
	return name == '麻布' || name == '木棉布' || name == '毛毡';
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
		// 丢弃物品栏中不属于当前采集目标的物品。
		if([29, 30, 31, 32, 34, 35, 36, 40].indexOf(item.type) != -1 && item.name != mineObject.object.name && item.name != (mineObject.object.name + '条')) {
			dropItemPos = item.pos;
			console.log('丢弃物品栏中不属于当前采集目标的物品:' + item.name)
			return;
		}
		if(mineObject.object &&	mineObject.object.extra_dropping && mineObject.object.extra_dropping(item)) {
			dropItemPos = item.pos;
			return;
		}
	});
	
	if(dropItemPos != -1)
		cga.DropItem(dropItemPos);
}

var cleanOtherItems = (cb) =>{
	var sell = cga.findItemArray((item) => {
		// 不卖采集目标物品
		if(item.name == mineObject.object.name || item.name == mineObject.object.name + '条'){
			return false
		}
		// 布类无法卖店
		if(isFabricName(item.name)){
			return false
		}
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

	var skill = null;
	
	if(gatherObject.skill !== null){
		skill = cga.findPlayerSkill(gatherObject.skill);
		if(!skill){
			errmsg = '你没有'+gatherObject.skill+'技能';
			cga.SayWords(errmsg , 0, 3, 1);
			return;
		}
		if(mineObject.object && skill.lv < mineObject.object.level){
			var errmsg = gatherObject.skill+'技能等级不够，'+mineObject.object.name+'需要'+mineObject.object.level+'级技能，而你只有'+skill.lv+'级技能';
			cga.SayWords(errmsg , 0, 3, 1);
			return;
		}
	}
	
	var playerInfo = cga.GetPlayerInfo();
	if(playerInfo.mp < playerInfo.maxmp || playerInfo.hp < playerInfo.maxhp)
	{
		if(mineObject.supplyManager)
			mineObject.supplyManager(loop);
		else if(supplyObject.func)
			supplyObject.func(loop);
		return;
	}
	// 如果模块有自己的采集完毕的处理逻辑，就执行。
	// 否则，使用通用模块来处理。
	if(mineObject.check_done())
	{
		console.log('完成任务，当前时间:' + Date(Date.now()))
		console.log('完成任务，当前金币:' + cga.GetPlayerInfo().gold)
		console.log('一次采集流程完成，耗时【' + ((Date.now() - mineObject.object.startTime)/1000).toString() + '】秒')
		console.log('一次采集流程完成，消耗金币:【' + (mineObject.object.startGold - cga.GetPlayerInfo().gold) + '】')
		if(mineObject.doneManager)
			mineObject.doneManager(loop);
		else if(doneObject.func)
			doneObject.func(loop, mineObject.object);
		return;
	}

	var workwork = (err, result)=>{
		
		check_drop();
		
		var playerInfo = cga.GetPlayerInfo();
		if(playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')){
			loop();
			return;
		}

		if(mineObject.check_done(result)){
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
		
		if(skill != null && !mineObject.workManager){
			cga.StartWork(skill.index, 0);
			// cga.AsyncWaitWorkingResult使用方式见开发文档
			cga.AsyncWaitWorkingResult((err, result)=>{

				if(thisobj.logoutTimes > 0 && result !== undefined){
					if(thisobj.gatherTimes == undefined)
						thisobj.gatherTimes = 0;
					
					if(thisobj.gatherTimes < thisobj.logoutTimes){
						thisobj.gatherTimes ++;
						// console.log('已挖'+thisobj.gatherTimes+'次');
					} else {
						cga.LogOut();
						return false;
					}
				}
				
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
		// 成本统计
		mineObject.object.startTime = Date.now()
		mineObject.object.startGold = playerInfo.gold
		console.log('开始任务,当前时间:' + Date(mineObject.object.startTime) + ',当前金币:' + mineObject.object.startGold)
		cleanOtherItems(()=>{
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
		
		if(pair.field == 'gatherObject'){
			pair.field = '采集类型';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'logoutTimes'){
			pair.field = '采集次数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(mineObject.translate(pair))
			return true;
		
		if(doneObject.translate(pair))
			return true;
		
		if(healObject.translate(pair))
			return true;
		
		return false;
	},
	loadconfig : (obj)=>{
		
		for(var i in gatherArray){
			if(gatherArray[i].name == obj.gatherObject){
				configTable.gatherObject = gatherArray[i].name;
				gatherObject = gatherArray[i];
				break;
			}
		}
		
		if(!gatherObject){
			console.error('读取配置：采集类型失败！');
			return false;
		}
		
		if(!mineObject)
			mineObject = require(gatherObject.path);

		if(!mineObject.loadconfig(obj))
			return false;
		
		if(!mineObject.doneManager){
			if(!doneObject.loadconfig(obj))
				return false;
		}
		
		//legacy
		configTable.logoutTimes = obj.logoutTimes;
		thisobj.logoutTimes = obj.logoutTimes;
		
		if(typeof thisobj.logoutTimes == 'undefined'){
			configTable.logoutTimes = 0;
			thisobj.logoutTimes = 0;
		}
		
		if(!healObject.loadconfig(obj))
			return false;
		
		return true;
	},
	inputcb : (cb)=>{
		var logoutTimesStage = (cb2)=>{
			var sayString = '【采集插件】请选择采集多少下之后登出服务器 (0~100，0代表不登出):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 0 && index <= 100){
					configTable.logoutTimes = index;
					thisobj.logoutTimes = index;
					
					var sayString2 = '当前已选择: 采集[' + thisobj.logoutTimes + ']下之后登出服务器。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					return false;
				}
				
				return true;
			});
		}
		
		var sayString = '【采集插件】请选择采集类型:';
		for(var i in gatherArray){
			if(i != 0)
				sayString += ', ';
			sayString += '('+ (parseInt(i)+1) + ')' + gatherArray[i].name;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && gatherArray[index - 1]){
				configTable.gatherObject = gatherArray[index - 1].name;
				gatherObject = gatherArray[index - 1];
				
				var sayString2 = '当前已选择:[' + gatherObject.name + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				if(mineObject === null)
					mineObject = require(gatherObject.path);
				
				if(!mineObject.doneManager){
					Async.series([mineObject.inputcb, logoutTimesStage, doneObject.inputcb, healObject.inputcb], cb);
				} else {
					Async.series([mineObject.inputcb, logoutTimesStage, healObject.inputcb], cb);
				}
				return false;
			}
			
			return true;
		});
	},
	execute : ()=>{
		callSubPlugins('init');
		mineObject.init();
		// checkSettle.func((err, map)=>{
		// 	loop();
		// });
		loop()
	},
};

module.exports = thisobj;