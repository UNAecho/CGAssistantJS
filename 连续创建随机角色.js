var fs = require('fs');
var cga = require('./cgaapi')(function () {
	global.cga = cga
	
	var playerinfo = cga.GetPlayerInfo();
	// 人物名字必须是前缀+编号格式，例如【UNAの仓库01】
	var prefix = playerinfo.name.replace(/\d+/g,''); 
	var num = parseInt(playerinfo.name.replace(/[^0-9]/ig,"") , 10);
	
	if (typeof num == 'number'){
		num = num + 1
	}else{
		num = 1
	}
	
	num = num.toString()
	if(num.length && num.length == 1){
		num = '0'+ num
	}
	
	var buildcharacter = ()=>{
		var randominfo = {
			// 自动创建人物打勾
			autocreatechara : true ,
			// 自动创建的人物名称（最长16个字符 or 8个中文汉字）
			createcharaname : prefix + num,
			// 自动创建的人物类型（1~28）
			createcharachara : parseInt(Math.random()*28,10)+1 ,
			// 自动创建的人物眼睛类型（1~5）
			createcharaeye : parseInt(Math.random()*5,10)+1 ,
			// 自动创建的人物嘴巴类型（1~5）
			createcharamouth : parseInt(Math.random()*5,10)+1 ,
			// 自动创建的人物颜色（1~4）
			createcharacolor : parseInt(Math.random()*4,10)+1 ,
			// 自动创建的人物初始点数（必须是类似“0,15,0,15,0”这样的格式，按血攻防敏魔的顺序来填写）
			createcharapoints : "15,0,0,15,0",
			// 自动创建的人物初始水晶（必须是类似“0,0,5,5”这样的格式，按地水火风的顺序来填写）
			createcharaelements : "0,0,0,10",
		}
		var switchAccount = require('./通用挂机脚本/公共模块/切换同类账号');
		var switchObject = switchAccount
		switchObject.func(null,'仓库',1, randominfo);
		console.log(randominfo)
	}
	var map = cga.GetMapName();
	if (map == '召唤之间') {
		cga.walkList([
			[4, 10],
		], ()=>{
			cga.TurnTo(4, 9);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(32, -1);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, -1);
						setTimeout(() => {
							buildcharacter()
						}, 1000);
					});
				});
			});
		});
	}
	else {
		buildcharacter()
	}
});