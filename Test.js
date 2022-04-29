var fs = require('fs');
var path = require('path');
var cga = require('./cgaapi')(function () {
    global.cga = cga
    var scriptMode = require('./通用挂机脚本/公共模块/跳转其它脚本');
    // 拾荒目标
    var targetitems = ['金币', '小护士家庭号', '魔力之泉',
        '海苔',
        '印度轻木',
        '苹果薄荷',
        '面包',
        '铜',
        '鹿皮',
    ];
    // 拾荒规则
    var uselessFilter = (item) => {
        // console.log('name = ' + unit.item_name + ', flags = ' + unit.flags + ', counts = ' + unit.item_count)
        if (targetitems.indexOf(item.name) == -1) {
            return true;

        }

    }

    var playerinfo = cga.GetPlayerInfo();
    var items = cga.GetItemsInfo()
    var pets = cga.GetPetsInfo()
    var equipItems = cga.getEquipItems()
    var units = cga.GetMapUnits()
    var dropitem = cga.getInventoryItems().find(uselessFilter)
    var map = cga.getMapObjects()
    var banks = cga.GetBankGold();
    var teamplayers = cga.getTeamPlayers();
 
    var petindex = cga.findbattlepet()

	var today = new Date().toLocaleString()
    const Infos = require('./常用数据/AccountInfos.js');
    console.log(Infos('仓库'))

    // cga.gui.LoadAccount({
    //     user : "yadhrstore",
    //     gid : "store0102",
    //     server : 3, //线路
    //     character : 1, //左边or右边
    //     autologin : true, //自动登录开启
    //     skipupdate : true, //禁用登录器更新开启
    // }, (err, result)=>{
    //     console.log(result);
    // })

    // CheckTransferStone(cga,null)
    // var settings = cga.gui.LoadSettings(a,(err, result)=>{
    //     console.log(result);
    //     // process.exit([code])退出Node.js，值默认0（成功），1为失败。
    //     // setTimeout(process.exit(0), 5000);
    // })

    // var path = require("path");
    // console.log(path.join(__dirname,'./'))
    // scriptMode.call_ohter_script(body,null)

	var configPath = __dirname+'\\脚本设置';
	var configName = configPath+'\\通用挂机脚本_'+cga.FileNameEscape(cga.GetPlayerInfo().name)+'.json';

    var configTable = {
		mainPlugin : null,
		subPlugins : [],
	}
    
	var readConfig = ()=>{
		try
		{			
			var json = fs.readFileSync(configName, 'utf8');
			
			if(typeof json != 'string' || !json.length)
				throw new Error('配置文件格式错误');
			
			var obj = JSON.parse(json);
			
			if(!parsePluginList(obj))
			{
				throw new Error('解析配置文件失败');
			}
			console.log(configTable)
            configTable.mainPlugin = 'test123'

			return true;
		}
		catch(e)
		{
			if(e.code != 'ENOENT'){
				//clearConfig();
				console.log(e)
			}
		}
		
		return false;
	}

	var parsePluginList = (obj)=>{
		try{
			//read plugin names from config
			configTable.mainPlugin = obj.mainPlugin;
			for(var i in obj.subPlugins)
				configTable.subPlugins.push(obj.subPlugins[i]);

			return true;
		}catch(e)
		{
			console.log(e)
		}
		
		return false;
	}

    var saveConfig = (cb)=>{
		fs.mkdir(configPath, ()=>{
			fs.writeFile(configName, JSON.stringify(configTable), cb);
		});	
	}

    if(readConfig()){
        saveConfig(()=>{})
    }

})