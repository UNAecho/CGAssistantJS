var thisobj = {
	// 0-体力，1-力量，2-防御，3-敏捷，4-魔法
	Endurance : 0,
	Strength : 1,
	Defense : 2,
	Agility : 3,
	Magical : 4,
	translate : (pair)=>{
		
		if(pair.field == 'maxEndurance'){
			pair.field = '体力目标点数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'maxStrength'){
			pair.field = '力量目标点数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}		
		if(pair.field == 'maxDefense'){
			pair.field = '防御目标点数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		if(pair.field == 'maxAgility'){
			pair.field = '敏捷目标点数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}		
		if(pair.field == 'maxMagical'){
			pair.field = '魔法目标点数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}		
		if(pair.field == 'petpoint'){
			pair.field = '出战宠物加点方案';
			switch (pair.value) {
				case 1:
					pair.value = '加体力';
					break
				case 2:
					pair.value = '加力量';
					break
				case 3:
					pair.value = '加防御';
					break
				case 4:
					pair.value = '加敏捷';
					break
				case 5:
					pair.value = '加魔法';
					break
				// 不设置加点方案
				default:
					pair.value = null
			}
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	think : (ctx)=>{
		// 战斗时无法加点
		if(cga.isInBattle()){
			return
		}
		// 宠物加点
		if(thisobj.petpoint != undefined && thisobj.petpoint > 0 && ctx.petinfo !=undefined && ctx.petinfo !=null && ctx.petinfo.detail.points_remain > 0){
			if (thisobj.petpoint <6){
				// 减1是因为cga的API为0-体力，1-力量，2-防御，3-敏捷，4-魔法
				cga.UpgradePet(ctx.petinfo.index,thisobj.petpoint-1)
			}else{
				console.log('宠物加点属性有误,仅可输入1体力2力量3防御4敏捷5魔法这五种数字。')
			}
		}
		// 人物加点
		if(ctx.playerinfo.detail.points_remain == 0){
			return;
		}
		var maxPoint = 15 + (ctx.playerinfo.level - 1) * 2
		var targetIndex = -1
		var minLoss = 999
		for (i=0;i<5;i++){
			switch (i) {
				case 0:
					var loss = thisobj.maxEndurance - ctx.playerinfo.detail.points_endurance
					// console.log('当前[体力]('+ctx.playerinfo.detail.points_endurance+')与目标值('+thisobj.maxEndurance+')残差为:['+loss+']')
					if(loss!=0 && loss <= minLoss && ctx.playerinfo.detail.points_endurance < maxPoint){
						targetIndex = i
						minLoss = loss
						// console.log('准备加['+targetIndex+']点数')
					}
					break
				case 1:
					var loss = thisobj.maxStrength - ctx.playerinfo.detail.points_strength
					// console.log('当前[力量]('+ctx.playerinfo.detail.points_strength+')与目标值('+thisobj.maxStrength+')残差为:['+loss+']')
					if(loss!=0 && loss <= minLoss && ctx.playerinfo.detail.points_strength < maxPoint){
						targetIndex = i
						minLoss = loss
						// console.log('准备加['+targetIndex+']点数')
					}
					break
				case 2:
					var loss = thisobj.maxDefense - ctx.playerinfo.detail.points_defense
					// console.log('当前[防御]('+ctx.playerinfo.detail.points_defense+')与目标值('+thisobj.maxDefense+')残差为:['+loss+']')
					if(loss!=0 && loss<= minLoss && ctx.playerinfo.detail.points_defense < maxPoint){
						targetIndex = i
						minLoss = loss
						// console.log('准备加['+targetIndex+']点数')
					}
					break
				case 3:
					var loss = thisobj.maxAgility - ctx.playerinfo.detail.points_agility
					// console.log('当前[敏捷]('+ctx.playerinfo.detail.points_agility+')与目标值('+thisobj.maxAgility+')残差为:['+loss+']')
					if(loss!=0 && loss <= minLoss && ctx.playerinfo.detail.points_agility < maxPoint){
						targetIndex = i
						minLoss = loss
						// console.log('准备加['+targetIndex+']点数')
					}
					break
				case 4:
					var loss = thisobj.maxMagical - ctx.playerinfo.detail.points_magical
					// console.log('当前[魔法]('+ctx.playerinfo.detail.points_magical+')与目标值('+thisobj.maxMagical+')残差为:['+loss+']')
					if(loss!=0 && loss <= minLoss && ctx.playerinfo.detail.points_magical < maxPoint){
						targetIndex = i
						minLoss = loss
						// console.log('准备加['+targetIndex+']点数')
					}
					break
				default:
					targetIndex = -1
					break
			}
		}

		if(thisobj.maxEndurance !== undefined && thisobj.Endurance==targetIndex && ctx.playerinfo.detail.points_endurance < maxPoint && ctx.playerinfo.detail.points_endurance < thisobj.maxEndurance){
			cga.UpgradePlayer(thisobj.Endurance)
			console.log('增加1点[体力],目标:['+thisobj.maxEndurance+']点,当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxStrength !== undefined && thisobj.Strength==targetIndex && ctx.playerinfo.detail.points_strength < maxPoint && ctx.playerinfo.detail.points_strength < thisobj.maxStrength){
			cga.UpgradePlayer(thisobj.Strength)
			console.log('增加1点[力量],目标:['+thisobj.maxStrength+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxDefense !== undefined && thisobj.Defense==targetIndex && ctx.playerinfo.detail.points_defense < maxPoint && ctx.playerinfo.detail.points_defense < thisobj.maxDefense){
			cga.UpgradePlayer(thisobj.Defense)
			console.log('增加1点[防御],目标:['+thisobj.maxDefense+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxAgility !== undefined && thisobj.Agility==targetIndex && ctx.playerinfo.detail.points_agility < maxPoint && ctx.playerinfo.detail.points_agility < thisobj.maxAgility){
			cga.UpgradePlayer(thisobj.Agility)
			console.log('增加1点[敏捷],目标:['+thisobj.maxAgility+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxMagical !== undefined && thisobj.Magical==targetIndex && ctx.playerinfo.detail.points_magical < maxPoint && ctx.playerinfo.detail.points_magical < thisobj.maxMagical){
			cga.UpgradePlayer(thisobj.Magical)
			console.log('增加1点[魔法],目标:['+thisobj.maxMagical+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
	},
	loadconfig : (obj, cb)=>{
		// console.error('obj.maxEndurance:' + obj.maxEndurance);
		// console.error('type of obj.maxEndurance:' + typeof obj.maxEndurance);
		if(obj.maxEndurance != undefined)
		{
			if(typeof obj.maxEndurance == 'string')
			{
				configTable.maxEndurance = obj.maxEndurance;
				thisobj.maxEndurance = parseInt(obj.maxEndurance);
			}
			else
			{
				configTable.maxEndurance = obj.maxEndurance;
				thisobj.maxEndurance = obj.maxEndurance;
			}
		}
		
		if(thisobj.maxEndurance === undefined){
			console.error('读取配置:自动加点【体力】，失败!');
			return false;
		}

		if(obj.maxStrength != undefined)
		{
			if(typeof obj.maxStrength == 'string')
			{
				configTable.maxStrength = obj.maxStrength;
				thisobj.maxStrength = parseInt(obj.maxStrength);
			}
			else
			{
				configTable.maxStrength = obj.maxStrength;
				thisobj.maxStrength = obj.maxStrength;
			}
		}
		
		if(thisobj.maxStrength === undefined){
			console.error('读取配置:自动加点【力量】，失败!');
			return false;
		}

		if(obj.maxDefense != undefined)
		{
			if(typeof obj.maxDefense == 'string')
			{
				configTable.maxDefense = obj.maxDefense;
				thisobj.maxDefense = parseInt(obj.maxDefense);
			}
			else
			{
				configTable.maxDefense = obj.maxDefense;
				thisobj.maxDefense = obj.maxDefense;
			}
		}
		
		if(thisobj.maxDefense === undefined){
			console.error('读取配置:自动加点【防御】，失败!');
			return false;
		}

		if(obj.maxAgility != undefined)
		{
			if(typeof obj.maxAgility == 'string')
			{
				configTable.maxAgility = obj.maxAgility;
				thisobj.maxAgility = parseInt(obj.maxAgility);
			}
			else
			{
				configTable.maxAgility = obj.maxAgility;
				thisobj.maxAgility = obj.maxAgility;
			}
		}
		
		if(thisobj.maxAgility === undefined){
			console.error('读取配置:自动加点【敏捷】，失败!');
			return false;
		}

		if(obj.maxMagical != undefined)
		{
			if(typeof obj.maxMagical == 'string')
			{
				configTable.maxMagical = obj.maxMagical;
				thisobj.maxMagical = parseInt(obj.maxMagical);
			}
			else
			{
				configTable.maxMagical = obj.maxMagical;
				thisobj.maxMagical = obj.maxMagical;
			}
		}
		
		if(thisobj.maxMagical === undefined){
			console.error('读取配置:自动加点【魔法】，失败!');
			return false;
		}

		if(thisobj.maxEndurance + thisobj.maxStrength + thisobj.maxDefense + thisobj.maxAgility + thisobj.maxMagical > 666){
			console.log('【警告】：输入的加点配置大于人物可获得的最大点数:【1*30+159*4=666】点，单个属性最高【1*15+159*2=333】点')
		}else if(thisobj.maxEndurance + thisobj.maxStrength + thisobj.maxDefense + thisobj.maxAgility + thisobj.maxMagical < 0){
			console.error('【错误】：负数加点不可取')
		}

		if(obj.petpoint != undefined)
		{
			if(typeof obj.petpoint == 'string')
			{
				configTable.petpoint = obj.petpoint;
				thisobj.petpoint = parseInt(obj.petpoint);
			}
			else
			{
				configTable.petpoint = obj.petpoint;
				thisobj.petpoint = obj.petpoint;
			}
		}
		
		if(thisobj.petpoint === undefined){
			console.log('读取配置:宠物加点配置，失败!默认不使用自动宠物加点');
			configTable.petpoint = 0;
			thisobj.petpoint = 0;
		}
		return true;
	},
	inputcb : (cb)=>{
		var ask = (cb2, name, varName)=>{
			var sayString = '【UNA人物自动加点插件】请选择【'+name+'】加点目标数值:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if (msg.length>0){
					var val = parseInt(msg);
					if(val !== NaN && val >= 0 && val <= 333)
					{
						configTable['max'+varName] = val;
						thisobj['max'+varName] = val;
						var sayString2 = '已选择:['+name+']加到[' + configTable['max'+varName] + ']点为止。';
						cga.sayLongWords(sayString2, 0, 3, 1);
						
						cb2(null);
						return false;
					}else if (val !== NaN && val > 333){
						cga.sayLongWords("错误:异常范围数据，人物单一属性最高加到333点", 0, 3, 1);
					}else if (val !== NaN && val < 0){
						cga.sayLongWords("错误:异常范围数据，反向加点不可取", 0, 3, 1);
					}else{
						console.log("错误:仅可输入数值型数据，如你打算给保姆弓加100点血，输入100");
					}
					return true
				}

			});
		}
		var askpet = (cb2)=>{
			var sayString = '【UNA人物自动加点插件】请输入出战宠物加点方案(仅输入数字,不加则输入0),1体力2力量3防御4敏捷5魔法:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if (msg.length>0){
					var val = parseInt(msg);
					if(val !== NaN && val >= 0 && val <6)
					{
						configTable['petpoint'] = val;
						thisobj['petpoint'] = val;
						switch (val) {
							case 0:
								cga.sayLongWords('已选择[跳过宠物加点方案],请手动处理', 0, 3, 1);
								break
							case 1:
								cga.sayLongWords('已选择出战宠物升级时加[体力]', 0, 3, 1);
								break
							case 2:
								cga.sayLongWords('已选择出战宠物升级时加[力量]', 0, 3, 1);
								break
							case 3:
								cga.sayLongWords('已选择出战宠物升级时加[防御]', 0, 3, 1);
								break
							case 4:
								cga.sayLongWords('已选择出战宠物升级时加[敏捷]', 0, 3, 1);
								break
							case 5:
								cga.sayLongWords('已选择出战宠物升级时加[魔法]', 0, 3, 1);
								break
							default:
								cga.sayLongWords('异常数字,请检查', 0, 3, 1);
								break
						}
						cb2(null);
						return false;
					}else if (val !== NaN && val < 0){
						cga.sayLongWords("错误:异常范围数据,你是想反向加点吗", 0, 3, 1);
					}else{
						console.log("错误:仅可输入数值型数据,如你打算加纯血,输入1");
					}
					return true
				}
			});
		}
		ask(()=>{
			ask(()=>{
				ask(()=>{
					ask(()=>{
						ask(()=>{
							askpet(()=>{
								cb(null);
							});
						}, '魔法', 'Magical');
					}, '速度', 'Agility');
				}, '防御', 'Defense');
			}, '力量', 'Strength');
		}, '体力', 'Endurance');
	}
};

module.exports = thisobj;