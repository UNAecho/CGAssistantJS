var Async = require('async');
var supplyMode = require('./../公共模块/维村回补');
var supplyCastle = require('./../公共模块/里堡回补');
var teamMode = require('./../公共模块/组队模式');
var logbackEx = require('./../公共模块/登出防卡住');

var cga = global.cga;
var configTable = global.configTable;
var actionArray = ['海底门口练级','抓水龙蜥','抓蜥蜴战士','刷热砂戒指']

var interrupt = require('./../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var supplyArray = [supplyMode, supplyCastle];

const mainMapInfo = cga.travel.falan.info['维诺亚村']

var ringThink = ()=>{
	if (cga.getItemCount('欧兹尼克的戒指') > 0){
		cga.SayWords('【UNA脚本提示】已经刷到欧兹尼克的戒指，进入陪打循环', 0, 3, 1);
		console.log('【UNA脚本提示】已经刷到欧兹尼克的戒指，进入陪打循环')
	}
	setTimeout(ringThink, 1000*60);
}

var action = () =>{
	var path = []
	if (thisobj.action == 0){
		path.push([10, 8])
	}else if(thisobj.action == 1){
		path.push([49, 8])
	}else if(thisobj.action == 2){
		path.push([8, 47])
	}else if(thisobj.action == 3){
		path.push([38, 48])
	}else{
		console.warn('【UNA脚本提示】输入的动作有误，请检查')
	}
	cga.walkList(path, ()=>{
		cga.freqMove(6)
	});
}
var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
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
		
	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var isleader = cga.isTeamLeaderEx();
	
	if(isleader && teamMode.is_enough_teammates()){

		// 村外
		if(mapindex == 100){
			supplyMode.func(loop);
			return;
		}
		// 走回村镇主地图
		if(mapindex != mainMapInfo.mainindex && cga.travel.switchMainMap() == mainMapInfo.mainName){
			cga.travel.autopilot('主地图',loop)
			return;
		}
		// 村镇主地图
		if(mapindex == mainMapInfo.mainindex){
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;

			cga.walkList([
				[67, 46, '芙蕾雅'],
				[343, 497, '索奇亚海底洞窟 地下1楼'],
			], loop);
			return;
		}
		var path = []
		// 具体任务地点
		// 下面的switch case只负责调整楼层，不负责具体任务地点。具体动作在action()里
		// 索奇亚海底洞窟 地下1楼
		// 靠近维诺亚侧
		if(mapindex == 15005)
		{
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			switch (thisobj.action) {
				case 0:
					break;
				case 1:
					path.push([18, 34, 15003])
					break;
				case 2:
					path.push([18, 34, 15003])
					break;
				case 3:
					path.push([18, 34, 15003])
					break;
				default:
					console.log('【UNA脚本警告】海底动作无效，请删除脚本配置重新输入。')
					break;
			}
			cga.walkList(path, action);
			return;
		}
		// 索奇亚海底洞窟 地下2楼
		if(mapindex == 15003)
		{
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			switch (thisobj.action) {
				case 0:
					path.push([49, 46, 15005])
					break;
				case 1:
					break;
				case 2:
					break;
				case 3:
					break;
				default:
					console.log('【UNA脚本警告】海底动作无效，请删除脚本配置重新输入。')
					break;
			}
			cga.walkList(path, action);
			return;
		}
		// 索奇亚海底洞窟 地下1楼
		// 靠近奇利侧
		if(mapindex == 15004)
		{
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;
			switch (thisobj.action) {
				case 0:
					path.push([24, 13, 15003],[49, 46, 15005])
					break;
				case 1:
					path.push([24, 13, 15003])
					break;
				case 2:
					path.push([24, 13, 15003])
					break;
				case 3:
					path.push([24, 13, 15003])
					break;
				default:
					console.log('【UNA脚本警告】海底动作无效，请删除脚本配置重新输入。')
					break;
			}
			cga.walkList(path, action);
			return;
		}
		
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
		cga.travel.falan.toTeleRoom('维诺亚村', (r)=>{
			cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[10, 16, '维诺亚村'],
				cga.isTeamLeader ? [60, 47] : [59, 47],
				], ()=>{
					teamMode.wait_for_teammates(loop);
				});
		});
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		var mapindex = cga.GetMapIndex().index3;
		
		if(mapindex == 100)
			return 1;
		
		if(mapindex == 15003 || mapindex == 15004 || mapindex == 15005)
			return 2;
		
		return 0;
	},
	translate : (pair)=>{
		if(pair.field == 'action'){
			pair.field = '海底动作';
			pair.value = actionArray[pair.value]
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

		configTable.action = obj.action;
		thisobj.action = obj.action
		
		if(thisobj.action == undefined){
			console.error('读取配置：海底动作失败！');
			return false;
		}

		return true;
	},
	inputcb : (cb)=>{
		Async.series([supplyMode.inputcb, teamMode.inputcb, (cb2)=>{
			var sayString = '【海底插件】请选择动作: 0海底门口练级 1抓水龙蜥 2抓蜥蜴战士 3刷热砂戒指';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val <= (actionArray.length - 1)){
					configTable.action = val;
					thisobj.action = val;
					
					var sayString2 = '当前已选择:'+actionArray[thisobj.action]+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}, 
	], cb);
	},
	execute : ()=>{
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		loop();
	},
};

module.exports = thisobj;