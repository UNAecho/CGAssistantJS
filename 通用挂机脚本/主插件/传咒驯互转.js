var fs = require('fs');
var Async = require('async');
var updateConfig = require('./../公共模块/修改配置文件');

var cga = global.cga;
var rootdir = cga.getrootdir()
var configTable = global.configTable;

// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
const professionalArray = getprofessionalInfos.Professions

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : '烧声望'})
	},5000)
}

// 假循环，只是为了写法一致。本loop仅执行一次。
var loop = ()=>{

	let jobObj = cga.job.getJob()

	if(jobObj.job == '暗黑骑士' || jobObj.job == '教团骑士'){
		throw new Error('暗黑骑士、教团骑士是道具服付费职业，不能依靠转职保证书刷声望，请手动处理。')
	}
	// 如果当前职业并非战斗系（除了医师和护士），则禁止使用此脚本，防止错误转职造成严重后果。
	if(thisobj.finalJob.jobType == '服务系'){
		if(thisobj.finalJob.job == '医师' || thisobj.finalJob.job == '护士'){
			console.log('医师和护士可以参与保证书的转职烧声望环节，开始转职..')
		}else{
			console.log('服务系除了医师和护士，其它人不需要通过转职来刷声望。')
			setTimeout(()=>{
				updateConfig.update_config({'mainPlugin' : '智能练级'})
			},5000)
			return
		}
	}else if(jobObj.jobType != '战斗系'){
		throw new Error('生产系禁止使用此脚本，因为生产系无法通过保证书+转职来获取声望。防止错误转职。')
	}

	cga.SayWords('欢迎使用【UNAの脚本】全自动保证书+转职+刷声望流程，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);

	// 声望第13阶段是敬畏的寂静
	if(jobObj.reputationLv > 13 && (!thisobj.needPerfectTrainSkill || (thisobj.needPerfectTrainSkill && cga.findPlayerSkill('完美调教术')))){
		setTimeout(()=>{
			updateConfig.update_config({'mainPlugin' : '智能练级'})
		},5000)
		return
	}

	// 判断转职保证书是否持有
	if(cga.getItemCount('转职保证书') == 0){
		console.log('你没有转职保证书，转职后声望会归零。现在跳转至转职保证书任务')
		setTimeout(()=>{
			updateConfig.update_config({'mainPlugin' : '转职保证书'})
		},5000)
		return
	}

	thisobj.bankObj.prepare(()=>{

		if(cga.needSupplyInitial()){
			cga.travel.toHospital(loop,false,false)
			return
		}

		let missionName = null
		if(jobObj.reputationLv > 13){
			if(thisobj.needPerfectTrainSkill){
				console.log('称号满但没有完美调教术，那么进行传咒驯互转的最后一站:转职驯兽')
				missionName = '就职驯兽师'
			}else{
				console.log('称号阶段大于13，并且不需要完美调教术，结束此脚本')
				setTimeout(()=>{
					updateConfig.update_config({'mainPlugin' : '智能练级'})
				},5000)
				return
			}
		}else if(jobObj.job == '传教士'){
			console.log('称号没满，准备转职为:咒术师')
			missionName = '就职咒术师'
		}else{
			console.log('称号没满，准备转职为:传教士')
			missionName = '就职传教士'
		}
		let missionObj = require(rootdir + '/常用数据/missions/' + missionName + '.js');
		missionObj.doTask({}, () => {
			jump()
		})
	});
}

var thisobj = {
	// 自动存取
	bankObj : require('../子插件/自动存取.js'),
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(pair.field == 'needPerfectTrainSkill'){
			pair.field = '是否需要学习完美调教术';
			pair.value = pair.value ? '需要' : '不需要';
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		if(typeof obj.needPerfectTrainSkill != 'boolean'){
			console.error('读取配置:传咒驯互转失败！必须指定角色是否需要学习完美调教术，关系到烧声望最后保留的是何种职业。')
			return false;
		}else{
			configTable.needPerfectTrainSkill = obj.needPerfectTrainSkill;
			thisobj.needPerfectTrainSkill = obj.needPerfectTrainSkill;
		}
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

		return true;
	},
	inputcb : (cb)=>{

		var stage0 = (cb) =>{

			if(configTable.hasOwnProperty('needPerfectTrainSkill') && typeof configTable.needPerfectTrainSkill == 'boolean'){
				console.log('【传咒驯互转】其它配置已经获取到完美驯兽术的需求开关，跳过输入。')
				thisobj.needPerfectTrainSkill = configTable.needPerfectTrainSkill
				cb(null)
				return
			}

			var sayString = '【传咒驯互转插件】请输入你是否需要完美调教术，如果需要，则烧声望模块会最终转职成驯兽师。0不需要1需要:';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, value) => {
				if (value !== null && (value == 0 || value == 1)) {

					let saveValue = value == 1
					let strValue = value == 1 ? '需要' : '不需要'

					configTable.needPerfectTrainSkill = saveValue;
					thisobj.needPerfectTrainSkill = saveValue

					sayString = '当前已选择:[' + strValue + '][完美调教术]，烧声望结束后[' + strValue + ']转职成驯兽师';
					cga.sayLongWords(sayString, 0, 3, 1);

					cb(null)
					return false;
				}

				return true;
			});

		}

		var stage1 = (cb2) => {

			if (configTable.finalJob) {
				console.log('【传咒驯互转】其他模块已经定义了目标职业，这里直接跳过输入')
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
			stage0,
			stage1,
		], cb);
	},
	execute : ()=>{
		callSubPlugins('init');
		loop();
	},
}

module.exports = thisobj;