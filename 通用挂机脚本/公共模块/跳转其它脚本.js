var scriptModeArray = [
{
	/*
	加载脚本
	cga.gui.LoadScript({
		path : "路径",
		autorestart : true, //自动重启脚本开启
		autoterm : true, //自动关闭脚本开启
		injuryprot : true, //受伤保护开启
		soulprot : true, //掉魂受伤保护开启
	}, (err, result)=>{
		console.log(result);
	})
	*/
	name : '跳转其它脚本',
	call_ohter_script : (body,settings)=>{

		if(!body || body.length == 0){
			console.log('未输入脚本配置，【跳转其它脚本】逻辑结束')
			return;
		}

		if(!body.hasOwnProperty("path")){
			console.log('未输入脚本路径，【跳转其它脚本】逻辑结束')
			return;
		}

		// 注意此处强制设定脚本自动重启，不然程序无法自动执行下一个脚本。
		if(!body.hasOwnProperty("autorestart") || body.autorestart == false){
			body.autorestart = true
		}

		console.log('开始脚本跳转，path = ' + body.path);

		cga.gui.LoadScript(body,(err, result)=>{
			// 如果附带了跳转后的玩家配置，则读取
			if(typeof settings != 'undefined'){
				console.log('检测到新的玩家配置传入，开始读取。')
				cga.gui.LoadSettings(settings, (err, result)=>{
					console.log(result);
					// process.exit([code])退出Node.js，值默认0（成功），1为失败。
					setTimeout(process.exit(0), 5000);
				})
			}else{
				console.log('没有检测到玩家设置传入，程序退出。')
				// process.exit([code])退出Node.js，值默认0（成功），1为失败。
				setTimeout(process.exit(0), 5000);
			}
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
	call_ohter_script : (body,settings)=>{
		thisobj.object = scriptModeArray[0];
		thisobj.object.call_ohter_script(body,settings);
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		thisobj.object = scriptModeArray[0];
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}	
}

module.exports = thisobj;