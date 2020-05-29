var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	func : (cb)=>{
		console.log('执行通用登出回补...')
		var mapname_tmp = cga.GetMapName();
		var curpos = cga.GetMapXY();
		//判定米村
		if((mapname_tmp == '库鲁克斯岛' && (curpos.x > 512 && curpos.y > 842))||mapname_tmp == '米诺基亚镇'){
			console.log('当前在米村采集，进入特殊不登出回补模式')
		}
		//判定奇利村
		else if((mapname_tmp == '索奇亚' && (curpos.x > 294 && curpos.y > 324))||mapname_tmp == '奇利村'){
			console.log('当前在奇利村采集，进入特殊不登出回补模式')
		}
		//判定亚留特村
		else if((mapname_tmp == '芙蕾雅' && (curpos.x > 594 && curpos.y > 24))||mapname_tmp == '亚留特村'){
			console.log('当前在亚留特村采集，进入特殊不登出回补模式')
		}else if(mapname_tmp != '艾尔莎岛' && mapname_tmp != '里谢里雅堡' && mapname_tmp != '法兰城' && mapname_tmp != '阿凯鲁法村' && mapname_tmp != '哥拉尔镇'){
			cga.LogBack();
		}
		
		setTimeout(()=>{
			var mapname = cga.GetMapName();
			switch(mapname)
			{
				case '艾尔莎岛':case '里谢里雅堡':
					cga.travel.falan.toCastleHospital(()=>{
						setTimeout(cb, 3000);
					});
					break;
				case '哥拉尔镇':
					cga.travel.gelaer.toHospital(()=>{
						setTimeout(()=>{
							cga.walkList([
							[9, 23, '哥拉尔镇']
							], cb);
						}, 3000);
					}, false);
					break;
				case '阿凯鲁法村':
					cga.LogBack();
					cga.walkList([
					[121, 155, '夏姆吉诊所'],
					[24, 17],
					], ()=>{
						cga.TurnTo(24, 15);
						setTimeout(()=>{
							cga.walkList([
							[16, 23, '阿凯鲁法村']
							], cb);
						}, 3000);
					});
					break;

				case '法兰城':
					cga.travel.falan.toWestHospital(()=>{
						cga.walkList([
						[9, 31],
						], ()=>{
							cga.TurnTo(9, 29);
							setTimeout(()=>{
								cga.walkList([
								[12, 42, '法兰城']
								], cb);
							}, 3000);
						});
					});
					break;
				case '芙蕾雅':
					cga.walkList([
					[595, 84, '亚留特村']
					], ()=>{
						cga.travel.yaliute.toHospital(()=>{
							setTimeout(cb, 5000, null);
						}, false);
					});			
					break;
				case '亚留特村':
					cga.travel.yaliute.toHospital(()=>{
						setTimeout(cb, 5000, null);
					}, false);
					break;
				case '索奇亚':
					cga.walkList([
					[294, 325, '奇利村']
					], ()=>{
						cga.travel.qili.toHospital(()=>{
							setTimeout(cb, 5000, null);
						}, false);
					});			
					break;
				case '奇利村':
					cga.travel.qili.toHospital(()=>{
						setTimeout(cb, 5000, null);
					}, false);
					break;
				case '库鲁克斯岛':
					cga.walkList([
					[511, 842, '米诺基亚镇']
					], ()=>{
						cga.travel.minuojiya.toHospital(()=>{
							setTimeout(cb, 5000, null);
						}, false);
					});			
					break;
				case '米诺基亚镇':
					cga.travel.minuojiya.toHospital(()=>{
						setTimeout(cb, 5000, null);
					}, false);
					break;
				default: throw new Error('登出回到未知的定居地: '+mapname);
			}
		}, 1000);
		console.log('通用登出回补结束...')
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

module.exports = thisobj;