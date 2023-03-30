var fs = require('fs');
const { del } = require('request');

var configModeArray = [
{	
	name : '修改配置文件',
	//noExit : 禁止自动结束脚本，以便做其他操作。
	update_config : (obj, noExit, cb)=>{
		let keys = Object.keys(obj)
		if(!keys.length){
			console.log('输入空对象，修改配置文件结束')
			if (cb) cb(null)
			return;
		}

		// 读取修改前文件
		var rootdir = cga.getrootdir()
		var configPath = rootdir + '\\脚本设置';
		var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';
		var json = fs.readFileSync(configName, 'utf8');
			
		if(typeof json != 'string' || !json.length)
			throw new Error('配置文件格式错误');
		
		var targetObj = JSON.parse(json);

		// 如果所有属性都相等，则需要跳过写入，节约I/O性能
		let skip = true

		for (let k = 0; k < keys.length; k++) {
			if(targetObj[keys[k]] && typeof targetObj[keys[k]] != typeof obj[keys[k]]){
				console.error('输入的修改value类型有误，请检查。targetObj[' + keys[k] +']:' + typeof targetObj[keys[k]] + ',obj[' + k +']:' + typeof obj[keys[k]])
				return;
			}
			if(skip && targetObj[keys[k]] != obj[keys[k]]){
				skip = false
			}
			targetObj[keys[k]] = obj[keys[k]]
			// 内存中的缓存数据也需要保持一致
			configTable[keys[k]] = obj[keys[k]]
		}

		if(skip){
			console.log('修改内容与原来一致，无需修改文件')
			if (cb) cb(null)
			return
		}

		console.log("开始写入配置文件..")
		
		// 注意此处强制设定脚本自动重启，不然程序无法自动执行下一个脚本。
		cga.gui.LoadScript({
			autorestart : true, //自动重启脚本开启
		}, (err, result)=>{
			console.log(result);
		})
		
		fs.mkdir(configPath, ()=>{
			fs.writeFile(configName, JSON.stringify(targetObj),
			(err) => {
				if (err)
				  console.log(err);
				else {
					if (!noExit){
						console.log('update_config写入成功，通过自动重启脚本重新启动。')
						setTimeout(process.exit(0), 5000);
					}else{
						console.log('update_config写入成功，但不重启脚本。')
					}
					if (cb) cb(true)
					return
				}
			  });
		});	
		return
	},
	delete_config : (keyArr, noExit, cb)=>{
		if(!keyArr instanceof Array){
			throw new Error('删除配置文件功能的输入，必须为数组形式')
		}

		if(!keyArr.length){
			console.log('输入空对象，修改配置文件结束')
			if (cb) cb(null)
			return;
		}
		
		// 读取修改前文件
		var rootdir = cga.getrootdir()
		var configPath = rootdir + '\\脚本设置';
		var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';
		var json = fs.readFileSync(configName, 'utf8');
			
		if(typeof json != 'string' || !json.length)
			throw new Error('配置文件格式错误');
		
		var targetObj = JSON.parse(json);

		// 如果所有属性都相等，则需要跳过写入，节约I/O性能
		let skip = true
		for (let k = 0; k < keyArr.length; k++) {
			if (targetObj.hasOwnProperty(keyArr[k])){
				delete targetObj[keyArr[k]]
				// 内存中的缓存数据也需要保持一致
				delete configTable[keyArr[k]]
				skip = false
			}
		}

		if(skip){
			console.log('输入对象与内存中一致，无需修改文件')
			if (cb) cb(null)
			return
		}

		console.log("开始删除配置文件中的", keyArr)
		
		// 注意此处强制设定脚本自动重启，不然程序无法自动执行下一个脚本。
		cga.gui.LoadScript({
			autorestart : true, //自动重启脚本开启
		}, (err, result)=>{
			console.log(result);
		})

		var rootdir = cga.getrootdir()
		var configPath = rootdir + '\\脚本设置';
		var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';
		
		fs.mkdir(configPath, ()=>{
			fs.writeFile(configName, JSON.stringify(targetObj),
			(err) => {
				if (err)
				  console.log(err);
				else {
					if (!noExit){
						console.log('delete_config写入成功，通过自动重启脚本重新启动。')
						setTimeout(process.exit(0), 5000);
					}else{
						console.log('delete_config写入成功，但不重启脚本。')
					}
					if (cb) cb(true)
					return
				}
			  });
		});	
		return
	},
	think : (ctx)=>{
		return
	}
},
]

var cga = global.cga;
// 与落盘无关，在修改落盘文件时，内存中的缓存数据也需要保持一致。
var configTable = global.configTable;

var thisobj = {
	update_config : (obj,noExit, cb)=>{
		thisobj.object = configModeArray[0];
		thisobj.object.update_config(obj,noExit, cb);
	},
	delete_config : (keyArr,noExit, cb)=>{
		thisobj.object = configModeArray[0];
		thisobj.object.delete_config(keyArr,noExit, cb);
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