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

			var index = getnums(accountInfos[i].gid[j]).indexOf(getnums(playerinfo.name))
			// 首先找到当前游戏角色是哪个账号
			// 在仓库数大于100之前，暂时先这么写。因为子账号id是2位数拼接起来的，0102对应账号人物01和02
			// 名字带的序号和子账号的第一位和第三位匹配
			if(index == 0){
				if(bias == -1){
					if(j == 0){
						// 如果大类到【开头】的情况，无法再往上走，那么直接循环至大类末尾的账号（每个category为一【大类】）
						i = i == 0 ? accountInfos.length - 1 : i-1
						// 因为大类上移，子账号就等于上一个大类的gid末尾的账号
						j = accountInfos[i].gid.length - 1
					}else{
						j = j + bias
					}
				}
				result.user = accountInfos[i].user
				result.pwd = accountInfos[i].pwd
				result.gid = accountInfos[i].gid[j]
				// 因为当前是左边人物（index == 0），所以不管怎么切换，都是要切到右边人物。
				result.character = 2
				return result
			}else if(index == 2){
				if(bias == 1){
					if(j == accountInfos[i].gid.length - 1){
						// 如果大类到【尾部】的情况，无法再往下走，那么直接循环至大类开头的账号（每个category为一【大类】）
						i = i == accountInfos.length - 1 ? 0 : i+1
						// 因为大类下移，子账号就等于下一个大类的gid第一个账号
						j = 0
					}else{
						j = j + bias
					}
				}
				result.user = accountInfos[i].user
				result.pwd = accountInfos[i].pwd
				result.gid = accountInfos[i].gid[j]
				// 因为当前是右边人物（index == 2），所以不管怎么切换，都是要切到左边人物。
				result.character = 1
				return result
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
		console.log('准备切换至目标账号：')
		console.log(accountobj)
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