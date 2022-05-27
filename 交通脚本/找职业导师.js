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
		var sayString = '【UNA脚本】您想做什么？ 请输入编号\n[0]找职业导师晋级，[1]找本职技能NPC学技能，[2]找职业导师就职，[3]找职业导师转职。如果想找去的职业导师所在地，请输入职业名称+$。如：格斗士$。';
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, val)=>{
			var val = parseInt(msg);
			if(val !== NaN && val >= 0 && val <= 3){
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
			else if(msg.length>0 && msg.charAt(msg.length - 1) == '$'){// 临时默认找导师就职 TODO将所有职业列出来并编号，让玩家输入数字选择
				var inputjob = msg.substring(0, msg.length - 1);
				getProfessionalbehavior(cga,inputjob,'induction')
			}
			
			return true;
		});
	}
});