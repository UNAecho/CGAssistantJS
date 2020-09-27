var cga = require('../cgaapi')(function(){

	var job =cga.GetPlayerInfo().job
	// 提取本地职业信息
	const getProfessionalbehavior = require('../常用数据/Professionalbehavior.js');
	var behavior = null
	if(job == '游民'){
		cga.SayWords('您当前无业，请输入对应的职业通用名称，例：弓箭手', 0, 3, 1);
		cga.waitForChatInput((msg)=>{
			if(msg){
				job = msg
			}
		});
	}else{
		var sayString = '您想做什么？ [0]找职业导师晋级，[1]找本职技能NPC学技能，[2]找职业导师就职，[3]找职业导师转职。请输入编号';
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, val)=>{
			if(val !== null && val >= 0 && val <= 3){
				
				switch(val){
					case 0:
						behavior = 'promote'
						break
					case 1:
						behavior = 'learning'
						break
					case 2:
						behavior = 'induction'
						break
					case 3:
						behavior = 'transfer'
						break
					default:
						behavior = null
						break
				}
				getProfessionalbehavior(cga,job,behavior)
				return false;
			}
			
			return true;
		});
	}
});