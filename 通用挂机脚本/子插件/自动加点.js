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
			pair.field = '强度目标点数';
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
		
		return false;
	},
	think : (ctx)=>{
		if(ctx.playerinfo.detail.points_remain == 0 || cga.isInBattle()){
			return;
		}
		var maxPoint = 15 + (ctx.playerinfo.level - 1) * 2

		if(thisobj.maxEndurance !== undefined && ctx.playerinfo.detail.points_endurance < maxPoint && ctx.playerinfo.detail.points_endurance < thisobj.maxEndurance){
			cga.UpgradePlayer(thisobj.Endurance)
			console.log('增加1点[体力],目标:['+thisobj.maxEndurance+']点,当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxStrength !== undefined && ctx.playerinfo.detail.points_strength < maxPoint && ctx.playerinfo.detail.points_strength < thisobj.maxStrength){
			cga.UpgradePlayer(thisobj.Strength)
			console.log('增加1点[力量],目标:['+thisobj.maxStrength+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxDefense !== undefined && ctx.playerinfo.detail.points_defense < maxPoint && ctx.playerinfo.detail.points_defense < thisobj.maxDefense){
			cga.UpgradePlayer(thisobj.Defense)
			console.log('增加1点[强度],目标:['+thisobj.maxDefense+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxAgility !== undefined && ctx.playerinfo.detail.points_agility < maxPoint && ctx.playerinfo.detail.points_agility < thisobj.maxAgility){
			cga.UpgradePlayer(thisobj.Agility)
			console.log('增加1点[敏捷],目标:['+thisobj.maxAgility+'],当前等级最高加至['+maxPoint+']点')
			return;
		}
		if(thisobj.maxMagical !== undefined && ctx.playerinfo.detail.points_magical < maxPoint && ctx.playerinfo.detail.points_magical < thisobj.maxMagical){
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
			console.error('读取配置:自动加点【强度】，失败!');
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

		return true;
	},
	inputcb : (cb)=>{
		var ask = (cb2, name, varName)=>{
			var sayString = '【UNA自动加点插件】请选择【'+name+'】加点目标数值:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if (msg.length>0){
					var val = parseInt(msg);
					if(val !== NaN && val >= 0 && val <= 333)
					{
						configTable['max'+varName] = val;
						thisobj['max'+varName] = val + '%';
						
						var sayString2 = '已选择:['+name+']加到[' + configTable['max'+varName] + ']点为止。';
						cga.sayLongWords(sayString2, 0, 3, 1);
						
						cb2(null);
						return false;
					}else if (val !== NaN && val > 333){
						cga.sayLongWords("错误:异常范围数据，人物单一属性最高加到333点，别贪", 0, 3, 1);
					}else if (val !== NaN && val < 0){
						cga.sayLongWords("错误:异常范围数据，你是想反向加点吗", 0, 3, 1);
					}else{
						console.log("错误:仅可输入数值型数据，如你打算给保姆弓加100点血，输入[100]");
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
							cb(null);
						}, '魔法', 'Magical');
					}, '速度', 'Agility');
				}, '强度', 'Defense');
			}, '力量', 'Strength');
		}, '体力', 'Endurance');
	}
};

module.exports = thisobj;