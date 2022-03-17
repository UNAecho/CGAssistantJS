var cga = global.cga;
var configTable = global.configTable;
const infos = require('../../常用数据/AccountInfos.js');

/**
 * 正则表达式提取字符串中的数字
 * 注意是只匹配数字，如果string中多处有数字，则不适用
 *  var s ="价格4500元，等级：2";
    var num = s.replace(/[^0-9]/ig,"");
	结果就是45002了
 */ 
var getnums = (str)=>{
	return str.replace(/[^0-9]/ig,"");
}
var getaccount = (category,bias)=>{
	var result = {}

	var playerinfo = cga.GetPlayerInfo();
	var accountInfos = infos(category)

	for (i = 0 ; i< accountInfos.length ; i++){
		for (j = 0 ; j< accountInfos[i].gid.length ; j++){
			var nameNo = getnums(playerinfo.name)
			var accountNo = getnums(accountInfos[i].gid[j])

			var index = getnums(accountInfos[i].gid[j]).indexOf(getnums(playerinfo.name))
			// 首先找到当前游戏角色是哪个账号
			// 在仓库数大于100之前，暂时先这么写。因为子账号id是2位数拼接起来的，0102对应账号人物01和02
			// 名字带的序号和子账号的第一位和第三位匹配
			if(index == 0){
				result = {user:accountInfos[i].user,pwd:accountInfos[i].pwd}
				bias == -1 ? result.gid = accountInfos[i].gid[j+bias] : result[gid] = accountInfos[i].gid[j]
				
			}else if(index == 2){
				result = {user:accountInfos[i].user,pwd:accountInfos[i].pwd}
				bias == 1 ? result.gid = accountInfos[i].gid[j+bias] : result[gid] = accountInfos[i].gid[j]
			}
			else{
				continue
			}
		}
	}

	return result
}
module.exports = {
	func : (cb,category,bias)=>{
		if(!category || category.length == 0){
			console.log('未输入账号类别，【切换同类别账号】逻辑结束')
			return;
		}

		var accountobj = getaccount(category,bias)

		// console.log('开始顺序切换同为【' + category+'】类的账号');

		// cga.gui.LoadAccount(body, (err, result)=>{
		// 	console.log(result);
		// })
	},
	isAvailable : ()=>{
		return true;
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}
}