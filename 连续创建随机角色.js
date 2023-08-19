/**
 * UNAecho:一个批量新建随机角色的脚本。
 * 逻辑为：
 * 以AccountInfos.js中记录的账号信息为基准，每次右移动1个单位创建角色。
 * 仅会创建同category下的玩家角色，并且会滚动创建。如果触底，则返回尝试创建第1个角色。
 * 每次选角色使用cga.gui.getAccountWithBias(1)来实现
 * 运行脚本的游戏角色，必须存在于AccountInfos.js中。
 * 人物的性别、角色、眼睛类型、嘴巴类型、颜色等均为随机
 * 人物的属性固定为风10，属性点数固定为体15，敏15。如有需要，可自行修改
 * 
 * 创建人物之后，会自动放弃新手任务，将记录点登记为法兰城。
 */
var fs = require('fs');
var cga = require('./cgaapi')(function () {
	global.cga = cga
	
	var buildcharacter = ()=>{
		// 通过AccountInfos.js记录的账号来获取要创建的玩家名称
		let nextAccount = cga.gui.getAccountWithBias(1)
		var randominfo = {
			// 自动创建人物打勾
			autocreatechara : true ,
			// 自动创建的人物名称（最长16个字符 or 8个中文汉字）
			createcharaname : nextAccount.name,
			// 自动创建的人物类型（1~28）
			createcharachara : parseInt(Math.random()*28,10)+1 ,
			// 自动创建的人物眼睛类型（1~5）
			createcharaeye : parseInt(Math.random()*5,10)+1 ,
			// 自动创建的人物嘴巴类型（1~5）
			createcharamouth : parseInt(Math.random()*5,10)+1 ,
			// 自动创建的人物颜色（1~4）
			createcharacolor : parseInt(Math.random()*4,10)+1 ,
			// 自动创建的人物初始点数（必须是类似“0,15,0,15,0”这样的格式，按血攻防敏魔的顺序来填写）
			createcharapoints : "15,0,0,15,0",
			// 自动创建的人物初始水晶（必须是类似“0,0,5,5”这样的格式，按地水火风的顺序来填写）
			createcharaelements : "0,0,0,10",
		}
		// nextAccount提纯，仅保留要切换的账号必要的信息
		let account = {
			user: nextAccount.user,
			pwd: nextAccount.pwd,
			gid: nextAccount.gid,// 子账号
			character: nextAccount.character, //1左边2右边
		}
		// 将处理好的账号创建信息，全部拷贝至account对象。
		Object.assign(account, randominfo)
		// 开始切换账号并登出
		cga.gui.LoadAccount(account, (err, result) => {
			if (err) {
				throw new Error(err)
			}
			console.log('账号切换完毕，登出!');
			setTimeout(() => {
				cga.LogOut();
			}, 1000);
			return
		})
	}
	var map = cga.GetMapName();
	if (map == '召唤之间') {
		cga.walkList([
			[4, 10],
		], ()=>{
			cga.TurnTo(4, 9);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(32, -1);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, -1);
						setTimeout(() => {
							buildcharacter()
						}, 1000);
					});
				});
			});
		});
	}
	else {
		buildcharacter()
	}
});