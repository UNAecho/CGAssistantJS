var fs = require('fs');
var cga = require('./cgaapi')(function () {
	// 移动银行名称关键字，注意这个需要在名称开头才行。
	var namefilters = ['UNA','砂の']

	// 移动银行名字核心处
	// 移动银行站立地点
	var waitXY = {x:48,y:39}

	// 够学传教双补血+调教宠强+石化这些1级必备技能就行
	var lowerlimit = 500
	// 注意后面的$号也是判定因素之一
	var cipher = "朵拉$"

	var jump =()=>{
		global.cga = cga
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\就职传教-全自动流程.js",
		}
		var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		scriptMode.call_ohter_script(body,setting)
	}

	var trade = (targetname,cb2)=>{
		// 满足金币需求了就拍拍屁股走人
		if(cga.GetPlayerInfo().gold >= lowerlimit){
			console.log('清点钱款完毕，退出此插件')
			if(cga.getTeamPlayers().length > 0){
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				setTimeout(jump, 1500);
				return;
			}
			jump(null);
			return;
		}

		cga.SayWords(cipher, 0, 3, 1);

		// 暂定不需要暗号物品，如有需要请开发
		// var stuffs = { 				
		// 	itemFilter : (item)=>{
		// 	if (item.name == ciphername && item.count == ciphercnt){
		// 		return true;
		// 	}
			
		// 	return false;
		// },
		// 	gold : cipher == save ? 500000 : 0 };

		setTimeout(()=>{
			// 注销掉stuffs，暂定不需要暗号物品，如有需要请开发
			// cga.positiveTrade(targetname, stuffs, null, (result)=>{
			cga.positiveTrade(targetname, null, null, (result)=>{
				if (result.success == true){
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
					setTimeout(trade, 1000,targetname,cb2);
					return
				} else {
					setTimeout(trade, 2000,targetname,cb2);
				}
			});
		}, 2000);
		
	}

	var retry = (cb)=>{
		console.log('尝试寻找移动银行人物..')
		var portablebank = cga.findPlayerUnit((u)=>{
			// 检测移动银行是否是目标，方法暂时使用名称fliter+坐标
			for (var filter in namefilters){
				if(u.unit_name.indexOf(namefilters[filter]) == 0 && u.xpos == waitXY.x && u.ypos == waitXY.y){
					console.log('发现移动银行人物:'+ u.unit_name)
					return true;
				}
			}
			return false
		});
		if(portablebank && cga.getTeamPlayers().length == 0){
			var target = cga.getRandomSpace(portablebank.xpos,portablebank.ypos);
			cga.walkList([
			target
			], ()=>{
				cga.addTeammate(portablebank.unit_name, (r)=>{
					// 开启队聊，防止干扰其他玩家
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
					// 进入交易模式
					setTimeout(()=>{
						trade(portablebank.unit_name,cb)
					}, 2000);
					//TODO 这里自行加了return，如果有问题注意这里
					return
				})
			});
		} else {
			setTimeout(retry, 1500,cb);
		}
	}
	// main
	var curgold = cga.GetPlayerInfo().gold
	if(curgold >= lowerlimit)
	{
		console.log('身上金钱:['+curgold+'],大于设置启动金:['+lowerlimit+'],跳过此次提取启动金')
		jump()
		return;
	}else{
		console.log('身上金钱:['+curgold+'],小于设置启动金:['+lowerlimit+'],去移动银行取钱')
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
			[48, 38],
			], ()=>{
				setTimeout(retry, 2000);
			});
		});
	}
});