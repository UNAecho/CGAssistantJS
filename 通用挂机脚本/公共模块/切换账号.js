var array = [
{
	/*
		加载自动登录设置
		cga.gui.LoadAccount({
			user : "通行证",
			pwd : "密码",
			gid : "子账号",
			game : 4, //区服
			bigserver : 1, //电信or网通
			server : 8, //线路
			character : 1, //左边or右边
			autologin : true, //自动登录开启
			skipupdate : false, //禁用登录器更新开启
		}, (err, result)=>{
			console.log(result);
		})


		调整自动登录到10线
		cga.gui.LoadAccount({
			server : 10,
		}, (err, result)=>{
			console.log(result);
		})
	*/
	name : '切换账号',
	switch_account : (body,settings)=>{

		if(!body || body.length == 0){
			console.log('未输入账号配置，【切换账号】逻辑结束')
			return;
		}

		console.log('开始切换账号，body = ' + body);

		cga.gui.LoadAccount(body, (err, result)=>{
			console.log(result);
		})

	},
	think : (ctx)=>{

		// 参考格式
		// if((ctx.teamplayers.length < thisobj.teammates.length && cga.isTeamLeader) || ctx.teamplayers.length == 0)
		// {
		// 	ctx.result = 'logback';
		// 	ctx.reason = '人数不足，登出';
		// 	return;
		// }

		return
	}
},
]

var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	switch_account : (body,settings)=>{
		thisobj.object = array[0];
		thisobj.object.switch_account(body,settings);
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		thisobj.object = array[0];
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}	
}

module.exports = thisobj;