var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
const professionalArray = getprofessionalInfos.Professions
// 不能通过转职保证书烧声望的战斗系职业
const specialJob = ['暗黑骑士', '教团骑士']
// 学习必要技能任务对象，用于获取需要学习的任务技能，统一静态变量，防止多处数据不统一。
const learnSkillMission = require(rootdir + '/常用数据/missions/学习必要技能.js');
var transferMode = require('../主插件/传咒驯互转');

var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

var thisobj = {
	prepare: (cb) => {
		let playerInfo = cga.GetPlayerInfo();
		let curJobObj = cga.job.getJob();
		let config = cga.loadPlayerConfig();
		if (!config)
			config = {};
		if (!config.hasOwnProperty("mission")) {
			config["mission"] = {}
		}
		// 小号到达一定等级才开始自行做任务，方便赶路和过门禁。
		let accessLv = 20

		if (playerInfo.level < accessLv) {
			console.log('小号等待至少【' + accessLv + '】级再开始智能培养角色，做就职任务等等。方便赶路和过门禁。')
			setTimeout(cb, 1000);
			return
		}

		// 任务对象，后续使用targetObj!=null来判断是否需要运行任务。
		let targetObj = null
		// 未就职小号
		if (curJobObj.curJob == '游民') {
			if (thisobj.finalJob.jobType == '战斗系' || thisobj.finalJob.jobType == '服务系') {
				if (cga.getItemCount('驯兽师推荐信') > 0) {
					console.log('战斗系或服务系拿完驯兽推荐信之后，先就职矿工练级，方便单人开传送。在刷声望前，随便转职。')
					targetObj = { mission: '就职矿工', param: {} }
				} else {
					// 传入letter=true意为只拿推荐信，不就职
					targetObj = { mission: '就职驯兽师', param: {letter : true} }
				}
			} else {
				if (thisobj.finalJob.job == '猎人') {
					targetObj = { mission: '就职猎人', param: {} }
				} else if (thisobj.finalJob.job == '樵夫') {
					targetObj = { mission: '就职樵夫', param: {} }
				} else if (thisobj.finalJob.job == '矿工') {
					targetObj = { mission: '就职矿工', param: {} }
				}
			}
		}

		// 生产系自行开启所有传送，至少40级才能过海，最好再高级一点，否则40级容易被飞
		if (targetObj != null && playerInfo.level >= 70 && curJobObj.jobType == '生产系' && !config.allstonedone) {
			targetObj = { mission: '单人开全部传送', param: {} }
		}

		/**
		 * 进入转职保证书、传咒驯互转、烧声望循环的前提条件：角色没有【完美调教术】、角色在2转或以下（防止将高阶职业误转）、角色培养目标职业是战斗系、服务系、大于80级（方便战斗）、声望小于无尽星空。
		 * 这里暂时使用脚本跳转的方式，因为逻辑太复杂，没有做解耦。
		 * 【暗黑骑士】【教团骑士】由于官方设定，无法进行转职保证书方式烧声望，故排除。
		 * 
		 * 如果满足了前提条件，还有2种情况判断：
		 * 1、当前职业与目标职业一致，但是声望小于奔跑的春风。
		 * 因为刷满声望最终开始练级的时候，是从声望33000，也就是奔跑的春风最低数值开始的。
		 * 也就是说，在不进行离线写入、不与阿梅对话的情况下，由于无法分辨当前角色是否刷满声望，使用【当前职业与目标职业一致，并且声望小于奔跑的春风】来判断该号是否进入刷声望环节。
		 * 2、当前职业与目标职业不一致，并且不是驯兽师（驯兽师要靠练级刷，因为技能比称号更难刷满）的情况。
		 * 或者无论是什么职业，手中没有转职保证书，而当前职业并不是目标职业时，需要进入刷声望环节。
		 */
		let perfectTrainSkill = cga.findPlayerSkill('完美调教术');
		if(perfectTrainSkill){
			console.log('【UNAecho脚本提醒】持有【'+perfectTrainSkill.name+'】的角色不参与【转职保证书】【传咒驯互转】【烧声望】环节。')
		}else{
			if ((thisobj.finalJob.jobType == '战斗系' || thisobj.finalJob.jobType == '服务系') && playerInfo.level >= 80 && !specialJob.includes(curJobObj.job)) {
				let transfer = () => {
					console.log('你的角色培养目标是战斗系或服务系职业，并且声望小于无尽星空，开始进入烧声望环节。包含【转职保证书】【烧声望】【传咒驯互转】3个部分')
					setTimeout(() => {
						updateConfig.update_config({ 'mainPlugin': '转职保证书' })
					}, 2000)
				}
				// 安全起见，2转以后的角色不参与烧声望流程，以防误转。
				if (curJobObj.jobLv > 2) {
					console.log('【UNAecho脚本警告】你目标职业是战斗系或服务系，但你已经3转或以上，保险起见，禁止脚本转职，如果需要烧声望，请手动转职一次，再运行脚本。')
				} else if (thisobj.finalJob.job != curJobObj.job && cga.getItemCount('转职保证书') == 0) {// 如果不是目标职业，必须去拿一份转职保证书。因为你终究需要一份转职保证书去转成目标职业的
					console.log('【UNAecho脚本提醒】必须去拿一份转职保证书。因为你终究需要一份转职保证书去转成目标职业的。')
					transfer()
					return
				} else if (thisobj.finalJob.job == curJobObj.job && curJobObj.reputationLv < 8) {// 如果不是刚转完目标职业（声望小于奔跑的春风，肯定不是无尽星空转来的）TODO:有严重bug，需要使用落盘的方式来记录角色是否满声望。
					transfer()
					return
				}
			}
		}

		// 如果满足目标职业的晋级条件，驯兽师即使不是最终职业，也需要晋级，因为可能会需要晋级兽王学完美调教术
		if ((thisobj.finalJob.job == curJobObj.job || curJobObj.job == '驯兽师') &&
			(
				(curJobObj.jobType == '战斗系' && curJobObj.jobLv < 5)
				|| (curJobObj.jobType == '生产系' && curJobObj.jobLv < 4)
				|| (curJobObj.jobType == '服务系' && curJobObj.jobLv < 4)
			)
		) {
			console.log('你没有达到职业的顶级，进入晋级判定..')
			// 服务系需要特殊处理，将jobType改为战斗系或者生产系，这里记录是否改过jobType
			let resetFlag = false
			let jobTypeCache = null
			if (curJobObj.jobType == '服务系') {
				// 标记改过jobType，之后要还原
				resetFlag = true
				jobTypeCache = curJobObj.jobType
				if (curJobObj.job == '医师' || curJobObj.job == '护士') {
					console.log('医师和护士，将在晋级逻辑中改为战斗系')
					curJobObj.jobType = '战斗系'
				} else {
					console.log('除了医师和护士，其余服务系将改为生产系，方便之后的分类判断')
					curJobObj.jobType = '生产系'
				}
			}
			let promoteObj = cga.job.promoteInfo[curJobObj.jobLv]
			// 如果完成了对应的进阶任务，则初步判定可能需要晋级，进入判断得意技是否达标的逻辑。
			if (promoteObj.mission[curJobObj.jobType].some(m => { return config.mission[m] })) {
				console.log('你完成了晋级必要的任务:', promoteObj.mission[curJobObj.jobType])

				// 如果是驯兽师这种特殊情况
				// 重置flag，在晋级逻辑结束时会用到
				let jobNameCache = null
				// 暂时将thisobj.finalJob赋值为驯兽师，便于逻辑复用
				if (curJobObj.job == '驯兽师') {
					jobNameCache = thisobj.finalJob.job
					thisobj.finalJob = cga.job.getJob()
				}

				/**
				 * 职业技能的晋级合格要求，以下二者选其一，满足即可通过：
				 * 1、该职业没有得意技，或没有技能等级的限制
				 * 2、有技能等级限制，且此技能等级大于等于要求
				 */
				if (!thisobj.finalJob.skill.length || (thisobj.finalJob.skill.length && thisobj.finalJob.skill.some(s => {
					let skillObj = cga.findPlayerSkill(s)
					return skillObj && skillObj.lv >= promoteObj.skillLv
				}))) {
					console.log('你满足目标职业【' + thisobj.finalJob.job + '】的得意技', thisobj.finalJob.skill, '要求')
					// 判断声望，如果满足，则晋级。
					if (curJobObj.reputationLv >= promoteObj.reputationLv) {
						console.log('当前声望【' + curJobObj.reputation + '】满足晋级要求。')
						cga.askNpcForObj({ act: 'promote', target: curJobObj.jobLv + 1, npcpos: thisobj.finalJob.npcpos }, () => {
							// 如果是驯兽师特殊情况，则需要复原
							if (jobNameCache != null) {
								thisobj.finalJob = cga.job.getJob(jobNameCache)
							}
							thisobj.prepare(cb)
						})
						return
					} else {// 如果声望不满足，则去刷新。刷新后，满足则晋级，不满足就退出
						console.log('当前声望【' + curJobObj.reputation + '】不满足晋级要求。')
						if (!thisobj.hasRefreshReputation) {
							console.log('去和阿蒙对话，刷新一下声望，看最新声望进度是否符合晋级标准')
							cga.refreshReputation(() => {
								// 将刷新flag置为true，表示已经刷新过称号
								thisobj.hasRefreshReputation = true
								// 重新赋值
								curJobObj = cga.job.getJob()

								if (curJobObj.reputationLv >= promoteObj.reputationLv) {
									console.log('刷新后，满足晋级条件，去晋级..')
									// 注意act为promote时，target需要传目标职业等级，number类型。
									cga.askNpcForObj({ act: 'promote', target: curJobObj.jobLv + 1, npcpos: thisobj.finalJob.npcpos }, () => {
										// 重置状态
										thisobj.hasRefreshReputation = false

										// 如果是驯兽师特殊情况，则需要复原
										if (jobNameCache != null) {
											thisobj.finalJob = cga.job.getJob(jobNameCache)
										}

										thisobj.prepare(cb)
									})
									return
								} else {
									console.log('刷新后，不满足晋级条件，退出晋级模块')

									// 如果是驯兽师特殊情况，则需要复原
									if (jobNameCache != null) {
										thisobj.finalJob = cga.job.getJob(jobNameCache)
									}

									thisobj.prepare(cb)
								}
							})
							return
						}
						console.log('已经与刷新NPC(阿蒙、阿姆等)对过话，依然不满足声望，退出晋级模块')
						// 重置状态
						thisobj.hasRefreshReputation = false

						// 如果是驯兽师特殊情况，则需要复原
						if (jobNameCache != null) {
							thisobj.finalJob = cga.job.getJob(jobNameCache)
						}
					}
				} else {
					console.log('你不满足晋级需求，', thisobj.finalJob.skill, '中必须满足至少1个技能大于等于', promoteObj.skillLv, '级')

					// 如果是驯兽师特殊情况，则需要复原
					if (jobNameCache != null) {
						thisobj.finalJob = cga.job.getJob(jobNameCache)
					}
				}
			} else {
				console.log('你不满足晋级需求，需要完成任务', promoteObj.mission[curJobObj.jobType], '的其中之一项，方可晋级。')
				// 如果是生产系，可自行完成晋级任务
				if (curJobObj.jobType == '生产系') {
					if (curJobObj.jobLv == 0) {
						targetObj = { mission: '咖哩任务', param: {} }
					} else if (curJobObj.jobLv == 1) {
						targetObj = { mission: '起司的任务', param: {} }
						let config = cga.loadPlayerConfig();
						if (config && config["mission"]) {
							let item = '好像很好吃的起司'
							if (cga.findItem(item) != -1 && config["mission"][item]) {
								console.log('检测到你身上有【' + item + '】，现在继续流程。')
								targetObj.param.timestamp = config["mission"][item]
							}
							item = '好像很好喝的酒'
							if (cga.findItem(item) != -1 && config["mission"][item]) {
								console.log('检测到你身上有【' + item + '】，现在继续流程。')
								targetObj.param.timestamp = config["mission"][item]
							}
						}
					} else if (curJobObj.jobLv == 2) {
						// TODO
						// targetObj.missionName = '魔法大学'
					}
				}
			}

			// 如果改过服务系的jobType，这里要还原。以免日后新增逻辑出现bug
			if (resetFlag) {
				console.log('智能培养角色的晋级逻辑判断完毕，还原改过的数据')
				curJobObj.jobType = jobTypeCache
				resetFlag = false
			}
		}

		// 如果没有职业晋级或切换需求，开始检查技能情况
		if (targetObj == null) {
			let needLearn = learnSkillMission.func.needLearn(thisobj.finalJob.job)
			if (needLearn != null && cga.skill.ableToLearn(needLearn) == 'able to learn') {
				targetObj = { mission: '学习必要技能', param: { job: thisobj.finalJob.job } }
			}
		}

		// 任务制作
		if (targetObj != null) {
			console.log('你需要运行【', targetObj.mission, '】脚本')
			let missionObj = require(rootdir + '/常用数据/missions/' + targetObj.mission + '.js');
			// 调用任务自己的dotask方法，目的是传入参数。否则cga.task.Task无法接收外部参数，只能在任务里写死，不够灵活。
			missionObj.doTask(targetObj.param, () => {
				console.log('【', targetObj.mission, '】结束，返回prepare中重新判断是否需要其它行为..')
				thisobj.prepare(cb)
			})
			return
		}
		console.log('没有培养的需求，退出本模块')
		setTimeout(cb, 1000);
		return
	},
	translate: (pair) => {
		if (pair.field == 'finalJob') {
			pair.field = '目标职业';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig: (obj) => {
		// 如果其他模块已经读取了目标职业，则直接使用
		if (configTable.finalJob) {
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		} else if (typeof obj.finalJob == 'number') {
			configTable.finalJob = professionalArray[obj.finalJob].name;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		} else if (typeof obj.finalJob == 'string') {
			configTable.finalJob = obj.finalJob;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		}
		if (!thisobj.finalJob) {
			console.error('读取配置：自动读取目标职业失败！必须手动指定当前角色的培养意向（当前账号最终要练什么）职业。注意需要填写职业的统称，不需要附带职业称号。如【王宫弓箭手】，就填【弓箭手】');
			return false;
		}

		if (thisobj.finalJob == '战斗系' && !transferMode.loadconfig(obj))
			return false;

		return true;
	},
	inputcb: (cb) => {

		var stage1 = (cb2) => {

			if (configTable.finalJob) {
				console.log('【智能培养角色】其他模块已经定义了目标职业，这里直接跳过输入')
				thisobj.finalJob = cga.job.getJob(configTable.finalJob)
				cb2(null)
				return
			}

			var sayString = '【战斗配置插件】请选择角色的最终要练什么职业:';
			for (var i in professionalArray) {
				if (i != 0)
					sayString += ', ';
				sayString += '(' + (parseInt(i) + 1) + ')' + professionalArray[i].name;
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 1 && professionalArray[index - 1]) {
					configTable.finalJob = professionalArray[index - 1].name;
					thisobj.finalJob = cga.job.getJob(configTable.finalJob)

					var sayString2 = '当前已选择:[' + thisobj.finalJob.job + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		Async.series([
			stage1,
			transferMode.inputcb,
		], cb);

	}
}

module.exports = thisobj;