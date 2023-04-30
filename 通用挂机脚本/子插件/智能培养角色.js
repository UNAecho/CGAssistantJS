var fs = require('fs');

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
const professionalArray = getprofessionalInfos.Professions
// 学习必要技能任务对象，用于获取需要学习的任务技能，统一静态变量，防止多处数据不统一。
const learnSkillMission = require(rootdir + '/常用数据/missions/学习必要技能.js');

var thisobj = {
	prepare: (cb) => {
		let playerInfo = cga.GetPlayerInfo();
		let curJobObj = cga.job.getJob()
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
			if (thisobj.finalJob.jobType == '战斗系') {
				if (cga.getItemCount('驯兽师推荐信') > 0) {
					targetObj.missionName = '就职传教士'
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

		// 检查技能情况
		let needLearn = learnSkillMission.func.needLearn(thisobj.finalJob.job)
		if (needLearn != null && cga.skill.ableToLearn(needLearn) == 'able to learn') {
			targetObj.missionName = '学习必要技能'
			targetObj.param.job = thisobj.finalJob.job
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
			return true
		}

		if (typeof obj.finalJob == 'number') {
			configTable.finalJob = professionalArray[obj.finalJob].jobmainname;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		} else {
			configTable.finalJob = obj.finalJob;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		}
		if (!thisobj.finalJob) {
			console.error('读取配置：自动读取战斗配置失败！必须手动指定当前角色的培养意向（当前账号最终要练什么）职业。注意需要填写职业的统称，不需要附带职业称号。如【王宫弓箭手】，就填【弓箭手】');
			return false;
		}

		return true;
	},
	inputcb: (cb) => {

		if (configTable.finalJob) {
			console.log('【智能培养角色】其他模块已经定义了目标职业，这里直接跳过输入')
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
			cb(null)
			return
		}

		var sayString = '【战斗配置插件】请选择角色的最终要练什么职业:';
		for (var i in professionalArray) {
			if (i != 0)
				sayString += ', ';
			sayString += '(' + (parseInt(i) + 1) + ')' + professionalArray[i].jobmainname;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index) => {
			if (index !== null && index >= 1 && professionalArray[index - 1]) {
				configTable.finalJob = professionalArray[index - 1].jobmainname;
				thisobj.finalJob = cga.job.getJob(configTable.finalJob)

				var sayString2 = '当前已选择:[' + thisobj.finalJob.job + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);

				cb(null);

				return false;
			}

			return true;
		});
	}
}

module.exports = thisobj;