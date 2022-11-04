var fs = require('fs');
var configModeArray = [
{
	/**
	 * 烧技能模式
	 * 全力使用某一项技能，直至烧到当前职级可达到的最高等级。
	 * 会以ProfessionalInfo中的trainskills为标准来检索每一个职业需要烧的技能，如有需要自定义调整，请修改对应职业的trainskills
	 * 烧的方式是血蓝25%以上，全力使用对应技能。如果血蓝量不足，则使用普攻代替以防止练级不加人物经验。
	 * 采用通用挂机脚本中的playerthink模式自动识别，在think里面写逻辑，func()方法备用
	 * 通用练级的.json文件名有要求，是职业统称+练级，如：格斗士练级.json就代表没有烧的技能时，读取的config文件
	 */
	name : '烧技能模式',
	func : ()=>{
		
		return
	},
	think : (ctx)=>{
		if(!ctx.skills){
			return
		}
		var filename = null

		if(!thisobj.finalJob.skill && !thisobj.finalJob.trainskills){
			console.log('未指定角色修炼技能,读取默认战斗配置')
			filename = '练级'
		}
		// 只有战斗系的技能才需要在战斗过程中烧
		if(thisobj.needLoad()){
			// 由于转职保证书的存在（转职后保留当前技能等级），当前技能等级可能出现比上限还高的情况，所以需要用小于来判断是否需要继续烧。
			var skill = ctx.skills.find((sk)=>{
				// 优先本职技能
				if((thisobj.finalJob.skill && thisobj.finalJob.skill.indexOf(sk.name) != -1) && sk.lv < sk.maxlv){
					return true
				}
				// 其次是自定义技能
				if((thisobj.finalJob.trainskills && thisobj.finalJob.trainskills.indexOf(sk.name) != -1) && sk.lv < sk.maxlv){
					return true
				}
				return false;
			});
		}else{
			filename = '练级'
		}
		// 如果技能还没烧满，则返回，防止无限读取config造成性能浪费。
		if(thisobj.training && filename && thisobj.training == filename){
			return
		}
		if(!skill){
			// 此处注意文件的名字，是统称+练级二字，如：格斗士练级
			if(accompany.indexOf(thisobj.finalJob.jobmainname) != -1){
				thisobj.manualLoad(thisobj.finalJob.jobmainname + '练级')
			}else{
				thisobj.manualLoad('练级')
			}
			return
		}

		// 读取对应需要烧的技能的战斗配置
		filename = skill.name

		thisobj.manualLoad(filename)

		return
	}
},
{
	/**
	 * 烧声望模式
	 * 用于传教使用1级气绝魔法、咒术使用1级石化魔法来提升声望。
	 * 仅用于转职保证书流程中的烧声望模块，以最低的费用，最快的速度提升声望。
	 * 在蓝量大于5（得意技耗蓝为5）的情况下进行全力使用1级技能。
	 */
	name : '烧声望模式',
	func : ()=>{
		var job = getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname
		// 如果既没有外部指定finalJob，也没有loadconfig读取到finalJob，那么中止逻辑
		if(job != '传教士' && job != '咒术师'){
			throw new Error('【自动读取战斗配置】本模块仅允许传教士和咒术师调用，请检查你的职业')
		}
		var filename = null

		if(job == '传教士'){
			filename = '传教烧声望'
		}else{
			filename = '咒术烧声望'
		}

		// 读取对应需要烧的技能的战斗配置
		thisobj.manualLoad(filename)
		return

	},
	think : (ctx)=>{
		return
	}
},
{
	/**
	 * 逃跑模式
	 * 顾名思义，单纯逃跑。
	 * 用于单人赶路，切忌在组队时使用。
	 */
	name : '逃跑模式',
	func : ()=>{
		var filename = '生产赶路'
		thisobj.manualLoad(filename)
		return

	},
	think : (ctx)=>{
		return
	}
},
{
	/**
	 * 节能模式，目的是尽可能在不补给的条件下，并且降低蓝量消耗。
	 * 一般多用于战斗系的任务赶路。
	 */
	name : '节能模式',
	func : ()=>{// TODO任务所有职业的读取
		var job = thisobj.finalJob ? thisobj.finalJob.jobmainname : getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname
		// 如果既没有外部指定finalJob，也没有loadconfig读取到finalJob，那么中止逻辑
		if(!job){
			throw new Error('请输入角色正确的最终职业名称，或者通过【通用挂机脚本系列】自动调用')
		}
		var filename = null

		if(job == '格斗士'){
			filename = '格斗士练级'
		}else if(job == '传教士'){
			filename = '传教士练级'
		}else if(job == '魔法师'){

		}else if(job == '弓箭手'){

		}else if(job == '战斧斗士'){

		}else if(job == '暗黑骑士'){

		}else if(job == '教团骑士'){

		}
		
		if(!filename){
			filename = '练级'
		}

		// 读取对应需要烧的技能的战斗配置
		thisobj.manualLoad(filename)
		return

	},
	think : (ctx)=>{
		return
	}
},
]

var cga = global.cga;
var configTable = global.configTable;
// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
const professionalArray = getprofessionalInfos.Professions

// 在烧技能模式中，可能需要陪同练级的职业，需要读取【职业+练级.json】的战斗配置文件。其余职业都读取默认的【练级.json】
const accompany = ['格斗士', '传教士', '弓箭手',]

var thisobj = {
	func : (type)=>{
		thisobj.object = configModeArray.find((c)=>{
			if(c.name == type){
				return true
			}
			return false;
		});

		if(!thisobj.object){
			throw new Error('错误，请正确输入模式名称')
		}

		thisobj.object.func()

	},
	manualLoad : (filename)=>{
		if (thisobj.training && thisobj.training == filename) {
			return
		}

		var settingpath = cga.getrootdir() + '\\战斗配置\\' + filename + '.json'
		var setting = JSON.parse(fs.readFileSync(settingpath))
	
		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.log(err);
				return;
			}else{
				thisobj.training = filename
				console.log('【战斗配置插件】读取战斗配置【'+settingpath+'】成功')
				return
			}
		})
		return
	},
	needLoad : ()=>{
		if(['物理系','魔法系','魔物系'].indexOf(thisobj.finalJob.category) != -1){
			return true
		}
		return false
	},
	think : (ctx)=>{// 暂时仅支持烧技能模式，其他模式多数都会手动调用
		configModeArray[0].think(ctx);
	},
	translate : (pair)=>{
		if(pair.field == 'finalJob'){
			pair.field = '目标职业';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		if(typeof obj.finalJob == 'number'){
			configTable.finalJob = professionalArray[obj.finalJob - 1].jobmainname;
			thisobj.finalJob = professionalArray[obj.finalJob - 1];
		}else{
			configTable.finalJob = obj.finalJob;
			thisobj.finalJob = professionalArray.find((p)=>{
				if(obj.finalJob == p.jobmainname){
					return true
				}
				return false
			})
		}
		if(!thisobj.finalJob){
			console.error('读取配置：自动读取战斗配置失败！必须手动指定当前角色的培养意向（当前账号最终要练什么）职业。注意需要填写职业的统称，不需要附带职业称号。如【王宫弓箭手】，就填【弓箭手】');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		
		var sayString = '【战斗配置插件】请选择角色的最终要练什么职业:';
		for(var i in professionalArray){
			if(i != 0)
				sayString += ', ';
			sayString += '('+ (parseInt(i)+1) + ')' + professionalArray[i].jobmainname;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && professionalArray[index - 1]){
				configTable.finalJob = index - 1;
				thisobj.object = professionalArray[index - 1];
				
				var sayString2 = '当前已选择:[' + thisobj.object.jobmainname + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);

				cb(null);

				return false;
			}
			
			return true;
		});
	}	
}

module.exports = thisobj;