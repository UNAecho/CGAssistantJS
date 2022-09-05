var fs = require('fs');
var Async = require('async');
var healObject = require('./../公共模块/治疗自己');
var configMode = require('../公共模块/读取战斗配置');

var cga = global.cga;
var configTable = global.configTable;

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)
var job = professionalInfo.jobmainname
var skillname = professionalInfo.skill

// 声望数据
const reputationInfos = require('../../常用数据/reputation.js');
// 声望等级，需要大于等于【神匠】才能完成三转任务，否则只能当采集工具人
var repuLv = reputationInfos.getProductReputationLv(cga.GetPlayerInfo().titles)
// 队长职业
var leaderJob = ['厨师','药剂师','武器修理工','防具修理工']

var dialogHandler = (err, dlg) => {
	if (dlg && (dlg.options & 4) == 4) {
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if (dlg && (dlg.options & 32) == 32) {
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if (dlg && dlg.options == 12) {
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if (dlg && dlg.options == 1) {
		cga.ClickNPCDialog(1, 0);
		return;
	}
	else {
		return;
	}
}

var workwork = (err, result, item, count)=>{
		
	var playerInfo = cga.GetPlayerInfo();
	if(playerInfo.mp == 0 || (err && err.message == '治疗蓝量不足')){
		// TODO 添加在魔法大学回补模块，可能还有伊尔村牛奶的回补也要添加
		loop();
		return;
	}

	if(cga.getItemCount(item) >= count){
		loop();
		return;
	}
	
	if(playerInfo.health > 0){
		healObject.func(()=>{
			workwork(null,null,item,count)
		});
		return;
	}
	
	cga.StartWork(thisobj.skill.index, 0);
	// cga.AsyncWaitWorkingResult使用方式见开发文档
	cga.AsyncWaitWorkingResult((err, result)=>{
		workwork(err, result, item, count);
	}, 10000);
}

var prepare = (cb)=>{
	var config = cga.loadPlayerConfig();
	if(!config){
		throw new Error('未读取到个人配置信息，无法得知传送情况，请先运行【检查开传送状态.js】脚本')
	}else if(!config['阿巴尼斯村']){
		throw new Error('阿巴尼斯村没有开传送，无法传送至魔法大学')
	}

	if ((job == '厨师' || job == '药剂师' || job == '鉴定师' || job == '防具修理工' || job == '武器修理工') && repuLv < 11){
		throw new Error('关键职业（厨师、药剂师、鉴定师、武器修理工、防具修理工）的称号没有到达【神匠】级别，请提升称号再来')
	}

	thisobj.skill = cga.findPlayerSkill(skillname)

	if(!thisobj.skill){
		throw new Error('你没有【'+skillname + '】技能，无法参与三转。')
	}

	if(thisobj.skill && thisobj.skill.lv < 8){
		if (job !='猎人'){
			throw new Error('职业技能小于8级，无法参与三转')
		}
		console.warn('狩猎等级小于八级，当采集工具人都只能去挖牛奶哦..')
	}
	if(job == '猎人'){
		cga.SayWords('猎人需要单人去伊尔购买【小麦粉】并在门口狩猎【牛奶】、去维诺亚购买【砂糖】、在魔法大学楼顶打【阿巴尼斯哈密瓜】，耗时较长哦', 0, 3, 1);
	}
	setTimeout(cb, 2000);
	return
	
}

var go =(cb,target)=>{
	var pos = cga.GetMapXY()
	if (cga.GetMapName() == '魔法大学' && pos.x > 76 && pos.x < 103 && pos.y > 70 && pos.y < 83){
		// 如果在采集阿巴尼斯哈密瓜，则先从楼顶返回礼堂再进行自动寻路
		cga.walkList([
			[79, 77,'礼堂'],
		], ()=>{
			go(cb,target)
		});
		return
	}
	var mainName = cga.travel.switchMainMap()
	if(mainName == '魔法大学'){
		cga.travel.falan.autopilot(target,cb)
	}else{
		cga.travel.falan.toTeleRoom('魔法大学', ()=>{
			cga.travel.falan.autopilot(target,cb)
			return;
		});
	}
}
/**
 * 
 * @param {*} cb 
 * @param {*} mainMapName 购买道具的主地图名称，如：伊尔村、维诺亚村
 * @param {*} mapname 购买道具的商店名称，如：旧金山酒吧
 * @param {*} playerPos 玩家购买物品所站立的坐标
 * @param {*} npcPos 商店NPC坐标
 * @param {*} item 道具名称
 * @param {*} count 购买数量
 */
var buyItem = (cb, mainMapName, mapname, playerPos, npcPos, item, count)=>{
	var buy =()=>{
		cga.walkList([
			playerPos,
		], ()=>{
			cga.turnTo(npcPos[0], npcPos[1]);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(0, 0);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					var store = cga.parseBuyStoreMsg(dlg);
					if(!store)
					{
						cb(new Error('商店内容解析失败'));
						return;
					}

					var buyitem = [];
					var emptySlotCount = cga.getInventoryEmptySlotCount();

					store.items.forEach((it)=>{
						if(it.name == item && emptySlotCount > 0){
							buyitem.push({index: it.index, count: count });
						}
					});

					cga.BuyNPCStore(buyitem);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						setTimeout(cb, 1500);
						return;
					});
				});
			});});
	}

	if(cga.travel.switchMainMap() == mainMapName){
		cga.travel.falan.autopilot(mapname,buy)
	}else{
		cga.travel.falan.toTeleRoom(mainMapName, ()=>{
			cga.travel.falan.autopilot(mapname,buy)
		});
	}
}

var loop = ()=>{
	if(cga.needSupplyInitial({  })){
		if(cga.travel.switchMainMap() == '魔法大学'){
			go(()=>{
				cga.walkList([
					[35, 48],
				], ()=>{
					cga.turnDir(6);
					setTimeout(loop, 3000);
				});
			},'魔法大学内部')
		}else{
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(loop, 3000);
			});
		}
		return;
	}

	callSubPluginsAsync('prepare', ()=>{
		var inventory = cga.getInventoryItems();
		// 预留杂物和魔法手套等道具的空间
		if(inventory.length < 19){
			if(job == '猎人'){
				if (cga.getItemCount('小麦粉') < 20){
					buyItem(loop, '伊尔村', '旧金山酒吧', [18, 11], [20, 11], '小麦粉', 40)
					return
				}
				if (cga.getItemCount('牛奶') < 20){
					if(cga.travel.switchMainMap() == '伊尔村'){
						cga.travel.falan.autopilot('主地图',()=>{
							cga.walkList([
								[45, 31, '芙蕾雅'],
								[685, 334]
							], ()=>{
								workwork(null,null,'牛奶',20)
							});
						})
					}else{
						cga.travel.falan.toTeleRoom('伊尔村', ()=>{
							cga.travel.falan.autopilot('主地图',()=>{
								cga.walkList([
									[45, 31, '芙蕾雅'],
									[685, 334]
								], ()=>{
									workwork(null,null,'牛奶',20)
								});
							})
						});
					}
					return
				}
				if (cga.getItemCount('砂糖') < 20){
					buyItem(loop, '维诺亚村', '糖店', [11, 6], [12, 6], '砂糖', 20)
					return
				}
				if (thisobj.skill.lv >=8 && cga.getItemCount('阿巴尼斯哈密瓜') < 3){
					go(()=>{
						cga.walkList([
							[14, 37,4400],
						], ()=>{
							cga.walkList([
								[78, 78],
								[94, 77],
							], ()=>{
								workwork(null,null,'阿巴尼斯哈密瓜',3)
							});
						});
					},'礼堂')
					return
				}
			}else if(job == '樵夫'){
				if (cga.getItemCount('魔法红萝卜') < 10){
					if (cga.getItemCount('魔法手套') == 0){
						go(()=>{
							cga.walkList([
								[18, 10],
							], ()=>{
								cga.AsyncWaitNPCDialog(dialogHandler);
								cga.TurnTo(18, 9);
								setTimeout(loop, 3000);
							});
						},'仓库内部')
					}else{
						go(()=>{
							cga.walkList([
								[32, 167],
							], ()=>{
								workwork(null,null,'魔法红萝卜',10)
							});
						},'主地图')
					}
					return
				}
			}
		}
	
		go(()=>{
			var pos = null
			if (leaderJob.indexOf(job) != -1){
				pos = [40, 20]
			}else{
				pos = [40, 21]
			}
			cga.walkList([
				pos
				],()=>{
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
					// setTimeout(loop, 3000);
				});
		},'魔法大学内部')
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		return true;
	},
	inputcb : (cb)=>{
		return
	},
	execute : ()=>{
		configMode.manualLoad('生产赶路')
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true)
		prepare(loop)
	},
}

module.exports = thisobj;