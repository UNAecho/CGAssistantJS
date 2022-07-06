var request = require('request');
// 提取本地宠物数据
const petInfoObj = require('./petInfo.js');
var petInfos = petInfoObj.getPetInfoDict

var thisobj = {
	petGrade: null,
	pretreat : (pet)=>{
		var obj = {}
		
		if(!pet || !pet.detail){
			throw new Error('无宠物信息输入，请检查。')
		}
		if(!pet.realname || !pet.level || !pet.maxhp || !pet.maxmp){
			throw new Error('宠物基本信息有误，请检查。')
		}
		obj.realname = pet.realname
		obj.level = pet.level
		obj.points_remain = pet.detail.points_remain
		obj.points_endurance = pet.detail.points_endurance
		obj.points_strength = pet.detail.points_strength
		obj.points_defense = pet.detail.points_defense
		obj.points_agility = pet.detail.points_agility
		obj.points_magical = pet.detail.points_magical
		obj.maxhp = pet.maxhp
		obj.maxmp = pet.maxmp
		obj.value_attack = pet.detail.value_attack
		obj.value_defensive = pet.detail.value_defensive
		obj.value_agility = pet.detail.value_agility
		obj.value_spirit = pet.detail.value_spirit
		obj.value_recovery = pet.detail.value_recovery
		return obj
	},
	calculate : (pet)=>{
		console.log('calculate start')
		// 清空上次结果
		thisobj.petGrade = null
		// 掉档概率
		var gradeProbability = {}

		var formData = thisobj.pretreat(pet)
		var gradeReg = new RegExp(/(?<=<td class="text-danger">)(([\s\S])*?)(?=<\/td>)/g)
		var randomReg = new RegExp(/(?<=<td class="text-info">)(([\s\S])*?)(?=<\/td>)/g)
		request.post({
			url:'http://www.molibaike.com/Tools/Analyzer',
			headers:{
				"content-type":"application/x-www-form-urlencoded"
			},
			form:{
				level:formData.level,
				id:petInfos[formData.realname].id,
				emptyPoint:formData.points_remain,
				'basePoint.Constitution':formData.points_endurance,
				'basePoint.Strength':formData.points_strength,
				'basePoint.Defense':formData.points_defense,
				'basePoint.Agile':formData.points_agility,
				'basePoint.Intelligence':formData.points_magical,
				'bodyPoint.HealthPoint':formData.maxhp,
				'bodyPoint.MagicPoint':formData.maxmp,
				'bodyPoint.AttachPoint':formData.value_attack,
				'bodyPoint.DefensePoint':formData.value_defensive,
				'bodyPoint.SpeedPoint':formData.value_agility,
				'bodyPoint.MindPoint':formData.value_spirit,
				'bodyPoint.RecoverPoint':formData.value_recovery,
			}
		},function (error,response,body) {
			if (!error && response.statusCode == 200){
				var grade = body.match(gradeReg);
				var random = body.match(randomReg);
				if(grade && random){
					// 如果算档成功，则初始化结果集
					thisobj.petGrade = {}
					// 可能档位的Array
					var petGradeArray = []
					// 掉档概率矩阵
					var gradeMatrix = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
					// 掉档和随机档顺序是一致并共存的，所以用掉档的下标作为索引
					for (i in grade){
						// 每一种档位可能的总档位，如00031就是3+1=4档
						var total = 0
						// 去掉空格
						var tmpGrade = grade[i].replace(/\s+/g, '')
						var tmpRadom = random[i].replace(/\s+/g, '')
						petGradeArray.push(
							{
								'grade':tmpGrade,
								'radom':tmpRadom
							},
							)
						for (var j = 0 ; j < 5 ; j++){
							// 这一可能的总档位
							total = total + parseInt(tmpGrade[j])
							// 概率矩阵累计
							gradeMatrix[j][parseInt(tmpGrade[j])] = gradeMatrix[j][parseInt(tmpGrade[j])] + 1
						}
						// 掉档概率累计
						if(gradeProbability[total]){
							gradeProbability[total] = gradeProbability[total] + 1
						}else{
							gradeProbability[total] = 1
						}
					}

					// 计算掉档概率
					for(var i in gradeProbability){
						gradeProbability[i] = (gradeProbability[i] / grade.length).toFixed(2)
					}

					// 计算概率矩阵
					for(var i = 0 ; i < 5 ; i++){
						for (var j = 0 ; j < 5 ; j++){
							gradeMatrix[i][j] = (gradeMatrix[i][j] / grade.length).toFixed(2)
						}	
					}
					thisobj.petGrade['宠物数据'] = formData
					thisobj.petGrade['掉档概率'] = gradeProbability
					thisobj.petGrade['掉档概率矩阵'] = gradeMatrix
					
					if(grade.length > 20){
						console.log('【UNA脚本提示】宠物掉档情况出现20种可能以上，建议提升等级之后再计算，本次计算省略可能的掉档结果')
					}else{
						thisobj.petGrade['可能结果'] = petGradeArray
					}
				}else{
					throw new Error('解析失败，请检查宠物信息录入是否有误。')
				}
			}
		})
	},
	Analysis : (info)=>{
		if (!info || info.length ==0){
			throw new Error('无宠物档位信息输入，请检查。')
		}
		var gradeDict = {}

		return gradeDict
	}
}

module.exports = thisobj;