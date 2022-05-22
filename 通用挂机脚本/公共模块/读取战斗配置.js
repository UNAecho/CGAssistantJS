var fs = require('fs');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '\\常用数据\\ProfessionalInfo.js');

// 寻找指定技能是否需要修炼。
var needExerciseFilter = (inputskillname)=>{
	var skills = cga.GetSkillsInfo();
	var hasflag = false
	var result = false
	skills.filter((sk)=>{
		if(sk.name == inputskillname){
			hasflag = true
			if(sk.lv != sk.maxlv){
				result = true
			}
		}
		return
	});
	if(!hasflag){
		console.log('【UNA脚本警告】你没有【'+inputskillname+'】技能，不需要烧，请留意')
	}
	return hasflag ? result : hasflag;
}

var configModeArray = [
{	
	name : '自动',
	loadBattleConfig : (cb)=>{
		var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)

		var settingpath = rootdir + '\\战斗配置\\'
		// 因为传教士可能还有正在刷声望的小号，这样可以区分是保姆还是小号
		if (professionalInfo.jobmainname == '传教士'){
			if(cga.GetPlayerInfo().job.indexOf('见习') != -1){
				settingpath = settingpath + '营地组队普攻刷声望.json'
			}else{
				settingpath = settingpath + '传教练级.json'
			}
		}else if(professionalInfo.jobmainname == '格斗士'){
			settingpath = settingpath + '格斗练级.json'
		}else if(professionalInfo.jobmainname == '弓箭手'){
			settingpath = settingpath + '弓箭练级.json'
		}else if(professionalInfo.jobmainname == '剑士'){
			settingpath = settingpath + '剑士练级.json'
		}else if(professionalInfo.jobmainname == '战斧斗士'){
			settingpath = settingpath + '战斧练级.json'
		}else if(professionalInfo.jobmainname == '魔术师'){
			settingpath = settingpath + '法师练级.json'
		}else if(professionalInfo.jobmainname == '巫师'){
			settingpath = settingpath + '巫师练级.json'
		}else if(professionalInfo.jobmainname == '封印师'){
			settingpath = settingpath + '封印师练级.json'
		}else{
			settingpath = settingpath + '营地组队普攻刷声望.json'
		}

		var setting = JSON.parse(fs.readFileSync(settingpath))

		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.log(err);
				return;
			}else{
				console.log('读取战斗配置【'+settingpath+'】成功')
				if (cb){
					cb(null)
				}
			}
		})
		return
	},
	think : (ctx)=>{
		return
	}
},
]

var thisobj = {
	loadBattleConfig : (cb)=>{
		thisobj.object = configModeArray[0];
		thisobj.object.loadBattleConfig(cb);
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		thisobj.object = configModeArray[0];
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}	
}

module.exports = thisobj;