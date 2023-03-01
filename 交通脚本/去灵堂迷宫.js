var cga = require('../cgaapi')(function(){
	/** 士兵伊岱鲁出现时间记录
	 * {
		years: 265,
		month: 5,
		days: 4,
		hours: 4,
		mins: 9,
		secs: 9,
		local_time: 1676275007,
		server_time: 1676273883
		}
	 */
	global.cga = cga
	var rootdir = cga.getrootdir()
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
	configMode.manualLoad('生产赶路')
	var go =(cb)=>{
		var time = cga.getTimeRange()
		if(time == '白天' || time == '夜晚'){
			console.log('灵堂只能清晨或黄昏进入，1分钟后再次尝试')
			setTimeout(go, 60000);
			return
		}
		healMode.func(()=>{
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[47, 85, '召唤之间'],
					[27, 8, '回廊'],
					[23, 23],
					[23, 19, '灵堂'],
					[9, 9],
				], ()=>{
					cga.task.waitForNPC('士兵伊岱鲁', ()=>{
						cga.turnTo(9, 8);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1)
								cga.waitForLocation({mapindex : 1538},()=>{
									cga.walkList([
										[15, 18, '城内的地下迷宫地下1楼'],
										], cb);
								});
							});
						});
					});
				});
			});
		})
	}
	go(()=>{console.log('成功')})

});