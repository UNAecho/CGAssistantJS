var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
const professionalArray = getprofessionalInfos.Professions
// 学习必要技能任务对象，用于获取需要学习的任务技能，统一静态变量，防止多处数据不统一。
const learnSkillMission = require(rootdir + '/常用数据/missions/学习必要技能.js');
var transferMode = require('../主插件/传咒驯互转');

var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

var thisobj = {
	prepare: (cb) => {
		let playerInfo = cga.GetPlayerInfo();
		let curJobObj = cga.job.getJob();
		let config = cga.loadPlayerConfig();
		if(!config)
			config = {};
		if(!config.hasOwnProperty("mission")){
			config["mission"] = {}
		}
		// 小号到达一定等级才开始自行做任务，方便赶路和过门禁。
		let accessLv = 20

		if (playerInfo.level < accessLv) {
			console.log('小号等待至少【' + accessLv + '】级再开始智能培养角色，做就职任务等等。方便赶路和过门禁。')
			setTimeout(cb, 1000);
			return
		}

		// 初始化任务对象，missionName不能初始化，后续使用hasOwnProperty('missionName')来判断是否需要运行任务。
		let targetObj = { param: {} }
		// 未就职小号
		if (curJobObj.curJob == '游民') {
			if (thisobj.finalJob.jobType == '战斗系' || thisobj.finalJob.jobType == '服务系') {
				if (cga.getItemCount('驯兽师推荐信') > 0) {
					console.log('战斗系或服务系拿完驯兽推荐信之后，先就职矿工练级，方便单人开传送。在刷声望前，随便转职。')
					targetObj.missionName = '就职矿工'
				} else {
					targetObj.missionName = '拿驯兽师推荐信'
				}
			} else {
				if (thisobj.finalJob.job == '猎人') {
					targetObj.missionName = '就职猎人'
				} else if (thisobj.finalJob.job == '樵夫') {
					targetObj.missionName = '就职樵夫'
				} else if (thisobj.finalJob.job == '矿工') {
					targetObj.missionName = '就职矿工'
				}
			}
		}

		// 生产系自行开启所有传送，至少40级才能过海，最好再高级一点，否则40级容易被飞
		if (!targetObj.hasOwnProperty('missionName') && playerInfo.level >= 70 && curJobObj.jobType == '生产系' && !config.allstonedone) {
			targetObj.missionName = '单人开全部传送'
		}

		/**
		 * 进入转职保证书、传咒驯互转、烧声望循环的前提条件：角色在2转或以下（防止将高阶职业误转）、角色培养目标职业是战斗系、服务系、大于80级（方便战斗）、声望小于无尽星空。
		 * 这里暂时使用脚本跳转的方式，因为逻辑太复杂，没有做解耦。
		 * 【暗黑骑士】【教团骑士】由于官方设定，无法进行转职保证书方式烧声望，故排除。
		 * 
		 * 如果满足了前提条件，还有2种情况判断：
		 * 1、当前职业与目标职业一致，但是声望小于奔跑的春风。因为刷满声望最终开始练级的时候，是从声望33000，也就是奔跑的春风最低数值开始的。
		 * 也就是说，在不进行离线写入、不与阿梅对话的情况下，由于无法分辨当前角色是否刷满声望，使用【当前职业与目标职业一致，并且声望小于奔跑的春风】来判断该号是否进入刷声望环节。
		 * 2、当前职业与目标职业不一致，并且不是驯兽师（驯兽师要靠练级刷，因为技能比称号更难刷满）的情况；或者无论是什么职业，手中没有转职保证书，而当前职业并不是目标职业时，需要进入刷声望环节。
		 */
		if ((thisobj.finalJob.jobType == '战斗系' || thisobj.finalJob.jobType == '服务系') && playerInfo.level >= 80 && curJobObj.job != '暗黑骑士' && curJobObj.job != '教团骑士') {
			let transfer = () => {
				console.log('你的角色培养目标是战斗系或服务系职业，并且声望小于无尽星空，开始进入烧声望环节。包含【转职保证书】【烧声望】【传咒驯互转】3个部分')
				setTimeout(() => {
					updateConfig.update_config({ 'mainPlugin': '转职保证书' })
				}, 2000)
			}
			// 安全起见，2转以后的角色不参与烧声望流程，以防误转。
			if (curJobObj.jobLv > 2) {
				console.log('【UNAecho脚本警告】你目标职业是战斗系或服务系，但你已经3转或以上，保险起见，禁止脚本转职，如果需要烧声望，请手动转职一次，再运行脚本。')
			} else if (thisobj.finalJob.job != curJobObj.job && cga.getItemCount('转职保证书') == 0) {// 如果不是目标职业，必须去拿一份转职保证书。因为你终究是要去转成目标职业的
				transfer()
				return
			} else if (thisobj.finalJob.job == curJobObj.job && curJobObj.reputationLv < 8) {// 如果不是刚转完目标职业（声望小于奔跑的春风，肯定不是无尽星空转来的）
				transfer()
				return
			}
		}

		// 如果满足目标职业的晋级条件
		if (thisobj.finalJob.job == curJobObj.job &&
			(
				(curJobObj.jobType == '战斗系' && curJobObj.jobLv < 5)
				|| (curJobObj.jobType == '生产系' && curJobObj.jobLv < 4)
				|| (curJobObj.jobType == '服务系' && curJobObj.jobLv < 4)
			)
		) {
			console.log('你没有达到职业的顶级，进入晋级判定..')
			let promoteObj = cga.job.promoteInfo[curJobObj.jobLv]
			// 如果完成了对应的进阶任务，则初步判定可能需要晋级，进入判断得意技是否达标的逻辑。
			if (promoteObj.mission[curJobObj.jobType].some(m => { return config.mission[m] })) {
				console.log('你完成了晋级必要的任务:', promoteObj.mission[curJobObj.jobType])
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

										thisobj.prepare(cb)
									})
									return
								} else {
									console.log('刷新后，不满足晋级条件，退出晋级模块')
									thisobj.prepare(cb)
								}
							})
							return
						}
						console.log('已经与刷新NPC(阿蒙、阿姆等)对过话，依然不满足声望，退出晋级模块')
						// 重置状态
						thisobj.hasRefreshReputation = false
					}
				} else {
					console.log('你不满足晋级需求，', thisobj.finalJob.skill, '中必须满足至少1个技能大于等于', promoteObj.skillLv, '级')
				}
			} else {
				console.log('你不满足晋级需求，需要完成任务', promoteObj.mission[curJobObj.jobType], '的其中之一项，方可晋级。')
				// 如果是生产系，可自行完成晋级任务
				if(curJobObj.jobType == '生产系'){
					if(curJobObj.jobLv == 0){
						targetObj.missionName = '咖哩任务'
					}else if(curJobObj.jobLv == 1){
						targetObj.missionName = '起司的任务'
						let config = cga.loadPlayerConfig();
						if(config && config["mission"]){
							let item = '好像很好吃的起司'
							if(cga.findItem(item) != -1 && config["mission"][item]){
								console.log('检测到你身上有【' + item +'】，现在继续流程。')
								targetObj.param.timestamp = config["mission"][item]
							}
							item = '好像很好喝的酒'
							if(cga.findItem(item) != -1 && config["mission"][item]){
								console.log('检测到你身上有【' + item +'】，现在继续流程。')
								targetObj.param.timestamp = config["mission"][item]
							}
						}
					}else if(curJobObj.jobLv == 2){
						// TODO
						// targetObj.missionName = '魔法大学'
					}
				}
			}
		}

		// 如果没有职业晋级或切换需求，开始检查技能情况
		if (!targetObj.hasOwnProperty('missionName')) {
			let needLearn = learnSkillMission.func.needLearn(thisobj.finalJob.job)
			if (needLearn != null && cga.skill.ableToLearn(needLearn) == 'able to learn') {
				targetObj.missionName = '学习必要技能'
				targetObj.param.job = thisobj.finalJob.job
			}
		}

		// 任务制作
		if (targetObj.hasOwnProperty('missionName')) {
			console.log('你需要运行【', targetObj.missionName, '】脚本')
			let missionObj = require(rootdir + '/常用数据/missions/' + targetObj.missionName + '.js');
			// 调用任务自己的dotask方法，目的是传入参数。否则cga.task.Task无法接收外部参数，只能在任务里写死，不够灵活。
			missionObj.doTask(targetObj.param, () => {
				console.log('【', targetObj.missionName, '】结束，返回prepare中重新判断是否需要其它行为..')
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