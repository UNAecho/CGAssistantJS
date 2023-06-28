var fs = require('fs');
var Async = require('async');
var updateConfig = require('./../公共模块/修改配置文件');

var cga = global.cga;
var rootdir = cga.getrootdir()
var configTable = global.configTable;

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : '烧声望'})
	},5000)
}

// 假循环，只是为了写法一致。本loop仅执行一次。
var loop = ()=>{

	let jobObj = cga.job.getJob()

	cga.SayWords('欢迎使用【UNAの脚本】全自动保证书+转职+刷声望流程，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);

	// 声望第13阶段是敬畏的寂静
	if(jobObj.reputationLv > 13 && (!thisobj.needPerfectTrainSkill || (thisobj.needPerfectTrainSkill && cga.findPlayerSkill('完美调教术')))){
		setTimeout(()=>{
			updateConfig.update_config({'mainPlugin' : '智能练级'})
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
	// 自动存取魔币
	bankObj : require('../子插件/自动存取魔币.js'),
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
		}
		
		return true;
	},
	inputcb : (cb)=>{

		var stage0 = (cb) =>{
			var sayString = '【传咒驯互转插件】请输入你是否需要完美调教术，如果需要，则烧声望模块会最终转职成驯兽师。0不需要1需要:';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, value) => {
				if (value !== null && (value == 0 || value == 1)) {

					let saveValue = value == 1
					let strValue = value == 1 ? '需要' : '不需要'

					configTable.needPerfectTrainSkill = saveValue;
					thisobj.needPerfectTrainSkill = saveValue

					sayString = '当前已选择【' + strValue + '】【完美调教术】，烧声望结束后【' + strValue + '】转职成驯兽师';
					cga.sayLongWords(sayString, 0, 3, 1);

					cb(null)
					return false;
				}

				return true;
			});

		}
		Async.series([
			stage0,
		], cb);
	},
	execute : ()=>{
		callSubPlugins('init');
		loop();
	},
}

module.exports = thisobj;