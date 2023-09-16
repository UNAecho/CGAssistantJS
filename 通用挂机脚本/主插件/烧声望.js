var supplyMode = require('./../公共模块/灵堂回补');
var updateConfig = require('./../公共模块/修改配置文件');
var configMode = require('../公共模块/读取战斗配置');

var cga = global.cga;
var interrupt = require('./../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

// 声望数据
const reputationInfos = require('../../常用数据/reputation.js');

// 用于对比称号是否有进展，如有则继续刷
var originInfo = null
// 是否为驯兽师或饲养师，因为驯兽师、饲养师和其它职业获取声望方式不同
var isTamer = false
// playerthink仅执行一次驯兽师、饲养师计数的flag，避免同一次战斗执行多次count - 1
var onceFlag = false
// 烧技能单次技能消耗，用于计算使用次数
var skillcast = 5
// 声望监听变量，可能是回补次数，也有可能是战斗次数。这取决于你是驯兽师、饲养师还是传教士、咒术师
var count = 0
// 声望进度百分比
var per = null


// 获取称号进度百分比
var getPercentage = (cb) => {
	console.log('刷新称号，并获取进度百分比')

	cga.travel.falan.toStone('E2', () => {
		cga.walkList([
			[230, 82],
		], () => {
			cga.turnDir(2);
			setTimeout(() => {
				cga.walkList([
					[235, 107],
				], () => {
					cga.turnDir(2);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('一点兴趣') >= 0 || dlg.message.indexOf('新称号而努力') >= 0) {
							per = 0
						} else if (dlg.message.indexOf('四分之一') >= 0) {
							per = 0.25
						} else if (dlg.message.indexOf('毛毛虫美少女') >= 0) {
							per = 0.5
						} else if (dlg.message.indexOf('再加把劲') >= 0) {
							per = 0.75
						} else {
							per = 1
						}
						// 刷新内存中的称号信息，不然还是和阿蒙对话前的称号
						let playerInfo = cga.GetPlayerInfo()
						// 制定接下来的烧声望计划
						let reputationState = (per == null ? '读取失败' : (per * 100).toString() + '%')
						let jobObj = cga.job.getJob()

						// 如果到达满称号，则不再继续烧
						if (jobObj.reputationLv > 13) {
							console.log('称号已达无尽星空，烧声望脚本结束')

							// 跳转前，在昵称中写一下称号状态，方便查看
							cga.ChangeNickName(jobObj.reputation)
							// 记录声望上限
							thisobj.configObj.maxreputationlv = jobObj.reputationLv
							// 落盘并跳转
							cga.savePlayerConfig(thisobj.configObj, () => {
								jump()
							});
							return
						}

						// 称号没满，开始烧声望
						let skillcount = reputationInfos.skillCount(jobObj.reputation, per)
						// 饲养师和驯兽师独有，无视是否带宠、无视调教和怪物等级，每场战斗都至少+10声望。这里默认每场仅+10声望来计算。这里count代表遇敌次数。
						if (jobObj.job == '驯兽师' || jobObj.job == '饲养师') {
							count = skillcount
							console.log('职业：【' + jobObj.job + '】，称号：【' + jobObj.reputation + '】，进度：【' + reputationState + '】，需要战斗【' + skillcount + '】次，才能升级至下一称号')
							// 将flag置为true，在playerthink中节约职业判断浪费的性能
							isTamer = true
						} else {// 其他职业需要消耗魔力，使用得意技来烧声望。这里count代表回补次数。
							count = Math.ceil(skillcount / Math.floor(playerInfo.maxmp / skillcast))
							console.log('职业：【' + jobObj.job + '】，称号：【' + jobObj.reputation + '】，进度：【' + reputationState + '】，需要使用【' + skillcount + '】次得意技，或回补【' + count + '】次才能升级至下一称号')
						}

						if (originInfo === null) {
							originInfo = {
								reputation: jobObj.reputation,
								percentage: per
							}
						} else {
							if (originInfo.reputation == jobObj.reputation && originInfo.percentage == per) {
								console.log('声望【无】进展，该去做保证书任务了')
								// 记录声望上限
								thisobj.configObj.maxreputationlv = jobObj.reputationLv
								// 落盘并跳转
								cga.savePlayerConfig(thisobj.configObj, () => {
									jump()
								});
								return
							} else {
								console.log('声望【有】进展，继续烧声望')
								originInfo.reputation = jobObj.reputation
								originInfo.percentage = per
								console.log('originInfo.reputation改为:' + originInfo.reputation)
								console.log('originInfo.percentage改为:' + originInfo.percentage)
								// 记录声望上限
								thisobj.configObj.maxreputationlv = jobObj.reputationLv
							}
						}
						// 登出回到里堡更快一些
						setTimeout(() => {
							cga.logBack(cb)
						}, 2000, null);
					});
				});
			}, 2000);
		});
	});
	return
}

var moveThink = (arg) => {

	if (moveThinkInterrupt.hasInterrupt())
		return false;

	if (arg == 'freqMoveMapChanged') {
		playerThinkInterrupt.requestInterrupt();
		return false;
	}

	return true;
}

/**	
 * 
 * 烧声望可以单人行动，这里仅保留人物的血蓝检测，其余均去掉，提升性能
 * 
 * 回补规则:
 * 1、血量低于25%
 * 2、蓝量低于5，因为无论是传教士的气绝回复，还是咒术师的石化魔法，在得意技的情况下，蓝耗都是5
 */
var playerThink = () => {

	if (!cga.isInNormalState()) {
		if (isTamer && !onceFlag && cga.isInBattle()) {
			count -= 1
			onceFlag = true
			console.log('还需遇敌' + count + '次')
		}
		return true;
	}
	// 如果结束战斗，则重置flag
	onceFlag = false

	var playerinfo = cga.GetPlayerInfo();
	var ctx = {
		playerinfo: playerinfo,
		result: null,
	}

	if (ctx.playerinfo.hp < ctx.playerinfo.maxhp * 0.25 || ctx.playerinfo.mp < 5) {
		ctx.result = 'supply'
	}

	// 从这里往下的逻辑，本来是兼容组队的。但烧声望考虑是单人进行，则去掉了组队部分的逻辑。如果后续要恢复，可以参考练级脚本中的playerThink()
	var interruptFromMoveThink = false;

	if (ctx.result == null && playerThinkInterrupt.hasInterrupt()) {
		ctx.result = 'supply';
		interruptFromMoveThink = true;
	}

	if (ctx.result == 'supply') {
		if (interruptFromMoveThink) {
			supplyMode.func(loop);
			return false;
		}
		else {
			moveThinkInterrupt.requestInterrupt(() => {
				if (cga.isInNormalState()) {
					count -= 1
					console.log('触发回补，升级至下一个称号还需回补:【' + count + '】次')
					supplyMode.func(loop);
					return true;
				}
				return false;
			});
			return false;
		}
	}

	return true;
}

var playerThinkTimer = () => {
	if (playerThinkRunning) {
		if (!playerThink()) {
			console.log('playerThink off');
			playerThinkRunning = false;
		}
	}

	setTimeout(playerThinkTimer, 1500);
}


var jump = () => {
	// 恢复出战宠物
	// 详细逻辑请看cga.findbattlepet()注释
	cga.ChangePetState(cga.findbattlepet(), cga.PET_STATE_BATTLE);
	setTimeout(() => {
		updateConfig.update_config({ 'mainPlugin': '转职保证书' })
	}, 5000)
}

var loop = () => {
	thisobj.bankObj.prepare(() => {
		if (cga.needSupplyInitial({})) {
			supplyMode.func(loop);
			return;
		}
		if (count == 0) {
			setTimeout(getPercentage, 2000, loop);
			return
		}

		let go = () => {
			cga.travel.autopilot('灵堂', () => {
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;

				cga.walkList([
					[30, 49],
				], () => {
					cga.freqMove(0);
				});
			})
		}

		// 在昵称中写一下称号状态，方便查看
		let nickname = cga.GetPlayerInfo().nickname
		let curReputation = cga.job.getJob().reputation
		if (nickname != curReputation) {
			cga.ChangeNickName(curReputation)
		}

		let mapindex = cga.GetMapIndex().index3
		if (mapindex == 1531 || mapindex == 11015) {
			go()
		} else {
			cga.travel.falan.toStone('C', go);
		}
	});
}

var thisobj = {
	job: cga.job.getJob(),
	// 自动存取
	bankObj: require('../子插件/自动存取.js'),
	configObj: cga.loadPlayerConfig(),
	checkSkill: (cb) => {
		let needLearn = null
		if (thisobj.job.job == '传教士' && !cga.findPlayerSkill('气绝回复')) {
			console.log('没找到气绝回复，去亚留特学习')
			needLearn = '气绝回复'

		} else if (thisobj.job.job == '咒术师' && !cga.findPlayerSkill('石化魔法')) {
			console.log('没找到石化魔法，去法兰城学习')
			needLearn = '石化魔法'
		}
		if (needLearn != null) {
			cga.askNpcForObj({
				act: 'skill',
				target: needLearn,
			}, () => {
				// 学完技能要回调，因为下面还有读取战斗配置的逻辑
				thisobj.checkSkill(cb)
			})
			return
		}

		if (thisobj.job.job == '咒术师') {
			cga.loadBattleConfig('咒术烧声望')
		} else if (thisobj.job.job == '传教士') {
			cga.loadBattleConfig('传教烧声望')
		} else {// 驯兽师、饲养师或其它情况。
			cga.loadBattleConfig('练级')
		}

		if (cb) cb(null)
		return
	},
	translate: (pair) => {

		if (configMode.translate(pair))
			return true;

		return false;
	},
	loadconfig: (obj) => {

		if (!configMode.loadconfig(obj))
			return false;

		return true;
	},
	inputcb: (cb) => {
		cb(null)
		return
	},
	execute: () => {
		// 脚本开始就收宠物
		let petIndex = cga.GetPlayerInfo().petid
		if (petIndex != -1) {
			console.log('当前职业不是驯兽师，取消掉出战宠物来烧技能。')
			cga.ChangePetState(petIndex, cga.PET_STATE_READY);
		}

		// 个人配置初始化
		if (!thisobj.configObj) {
			thisobj.configObj = {}
		}
		if (!thisobj.configObj.mission) {
			thisobj.configObj.mission = {}
		}

		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		// 先检查技能，再进入loop
		thisobj.checkSkill(loop);
	},
};

module.exports = thisobj;