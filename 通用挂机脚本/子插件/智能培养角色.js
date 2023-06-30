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
		let curJobObj = cga.job.getJob()
		let config = cga.loadPlayerConfig();
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
					console.log('战斗系拿完驯兽推荐信之后，先就职矿工练级，方便单人开传送。在刷声望前，随便转职。')
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
		if(!targetObj.hasOwnProperty('missionName') && playerInfo.level >= 70 && curJobObj.jobType == '生产系' && !config.allstonedone){
			targetObj.missionName = '单人开全部传送'
		}

		/**
		 * 进入转职保证书、传咒驯互转、烧声望循环的前提条件：角色在2转或以下（防止将高阶职业误转）、角色培养目标职业是战斗系、大于80级（方便战斗）、声望小于无尽星空。
		 * 这里暂时使用脚本跳转的方式，因为逻辑太复杂，没有做解耦
		 * 
		 * 如果满足了前提条件，还有2种情况判断：
		 * 1、当前职业与目标职业一致，但是声望小于奔跑的春风。因为刷满声望最终开始练级的时候，是从声望33000，也就是奔跑的春风最低数值开始的。
		 * 也就是说，在不进行离线写入、不与阿梅对话的情况下，由于无法分辨当前角色是否刷满声望，使用【当前职业与目标职业一致，并且声望小于奔跑的春风】来判断该号是否进入刷声望环节。
		 * 2、当前职业与目标职业不一致，并且不是驯兽师（驯兽师要靠练级刷，因为技能比称号更难刷满）的情况，需要进入刷声望环节。
		 */
		if(thisobj.finalJob.jobType == '战斗系' && playerInfo.level >= 80 && curJobObj.reputationLv < 14){
			if(curJobObj.jobLv > 2){
				console.log('【UNAecho脚本警告】你目标职业是战斗系，并且声望没有刷满。但你已经3转或以上，保险起见，禁止脚本转职，如果需要烧声望，请手动转职一次，再运行脚本。')
			}else if((thisobj.finalJob.job == curJobObj.job && curJobObj.reputationLv < 8) || (thisobj.finalJob.job != curJobObj.job && curJobObj.job != '驯兽师')){
				console.log('你的角色培养目标是战斗系职业，并且声望小于无尽星空，开始进入烧声望环节。包含【转职保证书】【烧声望】【传咒驯互转】3个部分')
				setTimeout(()=>{
					updateConfig.update_config({'mainPlugin' : '转职保证书'})
				},2000)
				return
			}
		}

		// 如果没有职业切换需求，开始检查技能情况
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
		}else if (typeof obj.finalJob == 'number') {
			configTable.finalJob = professionalArray[obj.finalJob].name;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		} else if (typeof obj.finalJob == 'string'){
			configTable.finalJob = obj.finalJob;
			thisobj.finalJob = cga.job.getJob(configTable.finalJob)
		}
		if (!thisobj.finalJob) {
			console.error('读取配置：自动读取战斗配置失败！必须手动指定当前角色的培养意向（当前账号最终要练什么）职业。注意需要填写职业的统称，不需要附带职业称号。如【王宫弓箭手】，就填【弓箭手】');
			return false;
		}

		if (!transferMode.loadconfig(obj))
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