var cga = global.cga;
var configTable = global.configTable;

var socket = null;

//挖一车，19组
const MATERIALS_MULTIPLE_COUNT = 760;

//一次交易80个（即4组）
const MATERIALS_TRADE_COUNT = 80;

//必须定居哥拉尔
cga.travel.gelaer.isSettled = true;
cga.travel.falan.isSettled = false;
cga.travel.newisland.isSettled = false;

var thisobj = {
	func : (cb) =>{
		thisobj.object.func(cb);
	},
	doneManager : (cb)=>{
		thisobj.object.doneManager(cb);
	},
	object : {
		name :'柠檬草',
		func : (cb) =>{

			console.log('开始烧鸡流水线柠檬草func...');
			if(thisobj.check_done()){
				cb(null);
				return
			}
			var mapname = cga.GetMapName();
			//43510是米村医院
			if (mapname != '米诺基亚镇' && cga.GetMapIndex().index3 != 43510){
				console.log('去米村...');
				cga.travel.gelaer.toTeleRoom('米诺基亚镇', ()=>{
					cga.walkList([
					[10, 12, '村长之家'],
					[19, 24, '米诺基亚镇'],
					[144, 115, '库鲁克斯岛'],
					[526, 853],
					], cb);
				});
			}else if(cga.GetMapIndex().index3 == 43510){
				console.log('在米村医院，出发去采集...');
				cga.walkList([
					[10, 19, '米诺基亚镇'],
					[144, 115, '库鲁克斯岛'],
					[526, 853],
					], cb);
			}else{
				cga.travel.minuojiya.toHospital(()=>{
					console.log('在米村，先去医院...');
					cga.walkList([
					[10, 19, '米诺基亚镇'],
					[144, 115, '库鲁克斯岛'],
					[526, 853],
					], cb);
				});
			
			}
		},
		gatherCount : MATERIALS_MULTIPLE_COUNT,
		doneManager : (cb)=>{
			thisobj.object.state = 'done';
			
			var repeat = ()=>{

				if(!thisobj.check_done()){
					thisobj.object.state = 'gathering';
					socket.emit('gathering');
					cb(true);
					return;
				}

				if(thisobj.object.state == 'done'){
					socket.emit('done', { count : cga.getItemCount(thisobj.object.name) });
				}
				
				setTimeout(repeat, 1500);
			}
			console.error('材料够了，开始赶往集散地..');
			cga.travel.gelaer.toStone('N', ()=>{
				cga.turnTo(121, 107);
				setTimeout(repeat, 1000);
			});
		},
		state : 'gathering',
	},
	check_done : (result)=>{
	if(cga.getItemCount(thisobj.object.name) >= 20 && cga.GetMapName() == '哥拉尔镇')
		return true;
	
	return cga.getItemCount(thisobj.object.name) >= thisobj.object.gatherCount;
	},
	translate : (pair)=>{
		
		if(pair.field == 'serverPort'){
			pair.field = '服务端口';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		
		return false;
	},
	loadconfig : (obj, cb)=>{
		configTable.serverPort = obj.serverPort;
		thisobj.serverPort = obj.serverPort;
		
		if(!thisobj.serverPort){
			console.error('读取配置：服务端口失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		var sayString = '【采集插件】请选择连接的服务端口(1000~65535):';
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, val)=>{
			if(val !== null && val >= 1000 && val <= 65535){
				configTable.serverPort = val;
				thisobj.serverPort = val;
				
				var sayString2 = '当前已选择:服务端口[' + thisobj.serverPort + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				cb(null);
				
				return false;
			}
			
			return true;
		});
	},
	init : ()=>{

		socket = require('socket.io-client')('http://localhost:'+thisobj.serverPort, { reconnection: true });

		socket.on('connect', ()=>{
			console.log('成功连接到烧鸡流水线节点');
			socket.emit('register', {
				state : thisobj.object.state,
				player_name : cga.GetPlayerInfo().name,
				job_name : thisobj.object.name,
			});
		});
		
		socket.on('init', (data)=>{
			thisobj.craft_player = data.craft_player;
			thisobj.craft_materials = data.craft_materials;
			data.craft_materials.forEach((m)=>{
				if( m.name == thisobj.object.name )
					thisobj.object.gatherCount = MATERIALS_MULTIPLE_COUNT;
			});
		});

		socket.on('trade', ()=>{

			thisobj.object.state = 'trading';
			
			var count = 0;
			var stuffs = 
			{
				itemFilter : (item)=>{
					if(count >= MATERIALS_TRADE_COUNT)
						return false;
					
					if (item.name == thisobj.object.name && item.count >= 20){
						count += item.count;
						return true;
					}
					
					return false;
				}
			}

			cga.waitTrade(stuffs, null, (result)=>{
				if(result && result.success == true)
					cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
				
				thisobj.object.state = 'done';
			});
		})

		socket.on('endtrade', ()=>{
			if(thisobj.object.state == 'trading'){
				thisobj.object.state = 'done';
				//cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false);
			}
		});

		socket.on('disconnect', ()=>{
			console.log('退出烧鸡流水线节点');
		});
	}
}

module.exports = thisobj;