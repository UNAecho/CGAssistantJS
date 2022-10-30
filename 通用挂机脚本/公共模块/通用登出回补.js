var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	func : (cb)=>{
		var mapname = cga.GetMapName();
		if(mapname != '艾尔莎岛' && mapname != '里谢里雅堡' && mapname != '法兰城' && mapname != '阿凯鲁法村' && mapname != '哥拉尔镇')
			cga.LogBack();
		
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
					// 简易判断是否在远离哥拉尔的位置
					if(cga.GetMapXY().y > 600){
						cga.walkList([
							[511, 842, '米诺基亚镇']
							], ()=>{
								cga.travel.minuojiya.toHospital(()=>{
									setTimeout(cb, 5000, null);
								}, false);
							});			
							break;
					}
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