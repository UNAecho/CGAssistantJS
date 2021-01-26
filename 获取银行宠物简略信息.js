var cga = require('./cgaapi')(function () {

	cga.travel.newisland.toBank(() => {
		cga.TurnTo(50, 25);
		cga.AsyncWaitNPCDialog(() => {
			var pets = cga.GetBankPetsInfo()
			var result = []
			for (var i in pets) {
				var tempinfo = {}
				tempinfo['名字'] = pets[i]['name']
				tempinfo['真名'] = pets[i]['realname']
				tempinfo['等级'] = pets[i]['level']
				tempinfo['生命'] = pets[i]['maxhp']
				tempinfo['魔力'] = pets[i]['maxmp']
				tempinfo['血'] = pets[i]['detail']['points_endurance']
				tempinfo['攻'] = pets[i]['detail']['points_strength']
				tempinfo['防'] = pets[i]['detail']['points_defense']
				tempinfo['敏'] = pets[i]['detail']['points_agility']
				tempinfo['魔'] = pets[i]['detail']['points_magical']
				tempinfo['攻击'] = pets[i]['detail']['value_attack']
				tempinfo['防御'] = pets[i]['detail']['value_defensive']
				tempinfo['敏捷'] = pets[i]['detail']['value_agility']
				tempinfo['精神'] = pets[i]['detail']['value_spirit']
				tempinfo['回复'] = pets[i]['detail']['value_recovery']
				tempinfo['-----------------'] = '--------------------'
				result.push(tempinfo)
			}
			console.log('银行共有宠物：【' + pets.length + '】只\n详情：')
			console.log(result)
			// 阻塞，防止不断重启脚本
			while (true) {
		
			}
		});

	});


});