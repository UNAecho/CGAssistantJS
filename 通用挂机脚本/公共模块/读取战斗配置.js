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
		// 如果ctx没有技能信息，或者被认为只需要读取一次配置时，直接return，防止无限IO
		if(!ctx.skills || thisobj.once){
			return
		}
		
		// 默认读取练级.json文件，如果有烧技能需要，则复写为JSON格式的obj
		var train = '练级'

		if(!thisobj.finalJob || (!thisobj.finalJob.skill && !thisobj.finalJob.trainskills)){
			console.log('未指定角色修炼技能或指定修炼技能已满，本次使用默认战斗配置')
			// 没有指定要烧的技能，使用默认配置并且仅读取一次。
			if(!thisobj.training && thisobj.manualLoad(train)){
				thisobj.once = true
			}
			return
		}
		// 只有战斗系的技能才需要在战斗过程中烧
		// 由于转职保证书的存在（转职后保留当前技能等级），当前技能等级可能出现比上限还高的情况，所以需要用小于来判断是否需要继续烧。
		var skill = ctx.skills.find((sk)=>{
			// 优先本职技能
			if((thisobj.finalJob.skill && thisobj.finalJob.skill.indexOf(sk.name) != -1) && sk.lv < sk.maxlv){
				train = sk.name
				return true
			}
			// 其次是自定义技能
			if((thisobj.finalJob.trainskills && thisobj.finalJob.trainskills.indexOf(sk.name) != -1) && sk.lv < sk.maxlv){
				train = sk.name
				return true
			}
			return false;
		});
		// 此处注意文件的名字，是统称+练级二字，如：格斗士练级
		if(!skill && accompany.indexOf(thisobj.finalJob.jobmainname) != -1){
			train = thisobj.finalJob.jobmainname + '练级'
		}

		setting = JSON.parse(fs.readFileSync(cga.getrootdir() + '\\战斗配置\\' + train + '.json'))
		// 如果是默认的通用格式，则直接读取，无需其他处理
		if(train.indexOf('练级') != -1 && thisobj.manualLoad(setting)){
			console.log('没有需要修炼的技能，读取通用练级模式或保姆练级模式，并不再改变战斗配置。')
			thisobj.once = true
			return
		}else if(skill){// 如果发现需要烧的技能，则调整技能顺序并选择好默认目标
			// 如果没烧完则继续
			if (skill.name == thisobj.training){
				return
			}
			// 制作要修炼技能的的战斗配置
			var skillObj = skillInfos.getSkillObj(skill.name)
			var battleObj = 
            {
                "condition": 1,
                "condition2": 2,
                "condition2rel": 0,
                "condition2val": "25%",
                "conditionrel": 0,
                "conditionval": "25%",
                "index": 0,
                "petaction": -1,
                "pettarget": -1,
                "pettargetsel": -1,
                "playeraction": 100,
                "playerskilllevel": 0,
                "playerskillname": skillObj.name,
                "playertarget": actionTarget.indexOf(skillObj.target),
                "playertargetsel": actionTargetSel[skillObj.target]
            }
			// 小于10级以下普攻战斗，节约蓝量
			var attackObj = 
            {
                "condition": 13,
                "condition2": 0,
                "condition2rel": 0,
                "condition2val": "",
                "conditionrel": 3,
                "conditionval": "10",
                "index": 0,
                "petaction": -1,
                "pettarget": -1,
                "pettargetsel": -1,
                "playeraction": 1,
                "playertarget": 0,
                "playertargetsel": 0
            }

			// 逆序置顶
			setting.battle.list.unshift(battleObj)
			setting.battle.list.unshift(attackObj)
		}
		

		// 刷新index（顺序），防止乱序
		for (var i = 0; i < setting.battle.list.length; i++){
			setting.battle.list[i]["index"] = i
		}

		if(thisobj.manualLoad(setting)){
			thisobj.training = skill.name
			console.log('正在训练【' + thisobj.training +'】技能')
		}

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

		// 读取战斗配置
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


// 提取本地技能数据
const skillInfos = require('../../常用数据/skills.js');

// 在烧技能模式中，可能需要陪同练级的职业，需要读取【职业+练级.json】的战斗配置文件。其余职业都读取默认的【练级.json】
const accompany = ['格斗士', '传教士', '弓箭手',]
// 技能作用目标顺序
const actionTarget = ['敌人', '己方', '玩家', '宠物', '条件']
// 技能作用目标选择
const actionTargetSel = {
	'敌人' : 4,
	'己方' : 3,
	'玩家' : -1,
	'宠物' : -1,
	'条件' : -1,
}

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
	manualLoad : (obj)=>{
		var setting = null
		if (typeof obj == 'object' && obj.battle && obj.battle.list && obj.battle.list.length > 0){
			setting = obj
		}else if(typeof obj == 'string'){
			setting = JSON.parse(fs.readFileSync(cga.getrootdir() + '\\战斗配置\\' + obj + '.json'))
		}else{
			throw new Error('错误，手动读取战斗配置只接受string的文件名称格式，或object类型的可加载格式（标准格式请参考战斗配置文件夹中的文件）。')
		}
		// 注意这个API是异步的，所以不能在callback里面更改变量，因为在loading成功之前，程序已经开始往下走了。
		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.error(err);
				return;
			}else{
				console.log('【战斗配置插件】读取战斗配置成功')
				return
			}
		})
		return true
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