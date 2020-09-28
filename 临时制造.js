var cga = require('./cgaapi')(function(){

	var targetname = '魅惑的哈密瓜面包'
	var craft_count = 0;
	var getBestCraftableItem = () => {
		//refresh
		var craftSkill = cga.findPlayerSkill('料理');
		if (!craftSkill)
			return null;
	
		var craftItemList = cga.GetCraftsInfo(craftSkill.index);
	
		return craftItemList.find((c) => {
			return c.name == targetname;
		});
	}

	var loop = () => {

		craft_target = getBestCraftableItem();
		if (!craft_target) {
			throw new Error('无法制造 ' + targetname + ' ，可能料理技能有问题，技能没有学习或等级不够');
		}


		var craft = () => {

			//没蓝
			var playerInfo = cga.GetPlayerInfo();
			if (playerInfo.mp < craft_target.cost) {
				loop();
				return;
			}

			console.log('开始制造：' + craft_target.name);

			cga.craftItemEx({
				craftitem: craft_target.name,
				immediate: true
			}, (err, results) => {
				if (results && results.success) {
					craft_count++;
					// console.log('已造' + craft_count + '次');
					setTimeout(craft, 500);
				} else {
					setTimeout(loop, 500);
				}

			});
		}

		craft();

	}
	loop()
});