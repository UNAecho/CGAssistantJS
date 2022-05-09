var fs = require('fs');

var configModeArray = [
{	
	name : '修改配置文件',
	//noExit : 禁止自动结束脚本，以便做其他操作。
	update_config : (key,value,noExit)=>{

		if(!key || configTable[key] == undefined || configTable[key].length == 0){
			console.error('输入的configTable key有误，请检查')
			return;
		}
		
		if(!value || typeof configTable[key] !== typeof value){
			console.error('输入的configTable value类型有误，请检查')
			return;
		}

		if(configTable[key] == value){
			console.log('目标值已存在，无需写入')
			return
		}
		
		// 注意此处强制设定脚本自动重启，不然程序无法自动执行下一个脚本。
		cga.gui.LoadScript({
			autorestart : true, //自动重启脚本开启
		}, (err, result)=>{
			console.log(result);
		})
		
		console.log('开始写入，key = ' + key + ',value = ' +value);

		var rootdir = cga.getrootdir()
		var configPath = rootdir + '\\脚本设置';
		var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';
		
		configTable[key] = value
		
		fs.mkdir(configPath, ()=>{
			fs.writeFile(configName, JSON.stringify(configTable),
			(err) => {
				if (err)
				  console.log(err);
				else {
				  console.log('写入成功，通过自动重启脚本重新启动。')
				}
			  });
		});	
		if (noExit === undefined || !noExit)
			console.log('通过自动重启脚本重新启动。')
			setTimeout(process.exit(0), 5000);
		return
	},
	think : (ctx)=>{
		return
	}
},
]

var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	update_config : (key,value)=>{
		thisobj.object = configModeArray[0];
		thisobj.object.update_config(key,value);
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		thisobj.object = configModeArray[0];
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}	
}

module.exports = thisobj;