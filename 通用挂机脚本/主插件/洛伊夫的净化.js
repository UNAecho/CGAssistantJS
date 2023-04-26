var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
var supplyMode = require(rootdir + '/通用挂机脚本/公共模块/营地回补');


var playerinfo = cga.GetPlayerInfo();
// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
var professionalInfo = getprofessionalInfos(playerinfo.job)
// 声望数据
const reputationInfos = require(rootdir + '/常用数据/reputation.js');

var jump = ()=>{
	// setTimeout(()=>{
	// 	updateConfig.update_config({'mainPlugin' : '传咒驯互转'})
	// },5000)
}

// 不使用动态组队，避免脚本运行时需要手动组队的麻烦。
var teammates = null
// 需要在静态teams中定义好角色所属的队伍。
var teams = [
	[
		"UNAの格斗1",
		"UNAの格斗2",
		"UNAの战斧2",
		"UNAの战斧3",
		"UNAの传教士",
	],
	[
		"UNAの格斗3",
		"UNAの格斗03",
		"UNAの格斗04",
		"UNAの暗黑骑士",
		"UNAの圣骑士",
	]
]

// cga.waitTeammateSay((player, msg)=>{

// 	if(msg.indexOf('长老之证x7 GET') >= 0 ){
// 		callZLZZ = true;
// 	}
	
// 	if(msg.indexOf('觉醒的文言抄本 GET') >= 0 ){
// 		callWYW = true;
// 	}

// 	return true;
// });

var getEmblem = (cb)=>{
	// 拿项链
	if(cga.getItemCount(450961) == 0){
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.turnTo(100, 84);
		setTimeout(getEmblem, 5000, cb);
		return
	}
	// 换地徽记
	if(cga.getItemCount(450949) >= 20){
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.turnTo(100, 84);
		setTimeout(getEmblem, 5000, cb);
		return
	}
	// 换水徽记
	if(cga.getItemCount(450950) >= 20){
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.turnTo(100, 84);
		setTimeout(getEmblem, 5000, cb);
		return
	}
	// 换火徽记
	if(cga.getItemCount(450951) >= 20){
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.turnTo(100, 84);
		setTimeout(getEmblem, 5000, cb);
		return
	}
	// 换风徽记
	if(cga.getItemCount(450952) >= 20){
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.turnTo(100, 84);
		setTimeout(getEmblem, 5000, cb);
		return
	}
	setTimeout(cb, 5000, true);
	// cga.turnTo(100, 84);
	// cga.AsyncWaitNPCDialog((err, dlg)=>{
	// 	if(dlg && dlg.options == 1 && dlg.message.indexOf('我在等待他') != -1){
	// 		throw new Error('你还不够做五转的资格，需要四转+120级以上')
	// 	}else if(dlg && (dlg.options & 32) == 32){
	// 		cga.ClickNPCDialog(32, 0);
	// 		setTimeout(getEmblem, 1000, cb);
	// 	}else if(dlg && dlg.options == 1)
	// 	{
	// 		if(dlg.message.indexOf('我们再想办法') != -1){
	// 			cb(true)
	// 			return
	// 		}
	// 		cga.ClickNPCDialog(1, 0);
	// 		setTimeout(getEmblem, 1000, cb);
	// 	}
	// });
}

var dialogHandler = (err, dlg)=>{
	if(dlg && (dlg.options & 4) == 4)
	{
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if(dlg && (dlg.options & 32) == 32)
	{
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 1)
	{
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 3)
	{
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 12)
	{
		cga.ClickNPCDialog(4, -1);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else
	{
		return;
	}
}

var task = cga.task.Task('洛伊夫的净化', [
	{//0
		intro: '0.进行一些前期处理工作。',
		workFunc: function(cb2){
			// 采用静态多队伍模式，角色会自己寻找自己在哪个队伍中。
			for (var t in teams){
				if (teams[t].indexOf(playerinfo.name) != -1){
					teammates = teams[t]
				}
			}
			cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false

			healMode.func(()=>{
				cb2(true)
			})
		}
	},
	{//1
		intro: '1.前往圣骑士营地与洛伊夫（100.84）对话，获得【洛伊夫的护身符】。集齐四种【隐秘的徽记】各20个，与洛伊夫对话，交出四种【隐秘的徽记】获得四属性【隐秘的水晶】。',
		workFunc: function(cb2){
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
					[99, 84],
					], ()=>{
						getEmblem(cb2)
					});
			});
		}
	},
	{//2
		intro: '2.持有【隐秘的水晶】进入对应的隐秘之洞，抵达随机迷宫第10层时双击对应的【隐秘的水晶】传送至随机迷宫第11层入口处。',
		workFunc: function(cb2){
			// TODO 检查4属性隐秘的水晶是否拿全，或者已经打完。水晶可无限使用，不会消失。
			// 各水晶itemid：
			// 地450953
			// 水450954
			// 火450955
			// 风450956
			// 接下来是各个洞窟的信息。注意队长在第10层传送后，是要往前走1格才能让队员进入队伍，而这时候可能遇敌！！队长1个人是无法与小怪群战斗的。注意1-10层和11-底层是分开的随机迷宫，分开计算迷宫的重置时间的。如果在11层以上被传送出迷宫，是回到10层那里。
			// 地BOSS [20, 24]
			// 水BOSS [24, 28]
			// 火BOSS [28, 24]
			// 风BOSS [24, 20]
			// 【提醒】出发之前记得换克制对应属性的水晶，并备好大量深蓝药剂、血瓶和料理（10级），路上敌人很多，消耗巨大。其中深蓝药剂能大幅降低赶路难度。尽量穿上装备，裸体打架相当困难。
			// 队长可以站在圣骑士营地的[99,85]，方便队员和老头对话完毕直接组队。
			// 其中水洞的怪会超强混乱和中毒，消耗极大，一场战斗可能会出现满血人员直接伤亡。一定要吃深蓝药剂规避战斗。
			// 所有的随机迷宫地图名称都叫【隐秘之洞地下X层】无属性区分，而且index是随机，飘忽不定。范围目前看是1000-2000之间。
			// 迷宫一共20层，但中间第10层为固定地图。1-9和11-19为随机地图，分别是独立的随机迷宫，比如11-19重置的时候，会被甩到10层入口处，而不是肯吉罗岛。
			// 地洞大概在肯吉罗岛534，272需要使用API搜寻入口，地洞范围内还可能出现一个蓝色的水晶入口，是未来之塔，需要注意躲避，可以加入黑名单。地洞甚至可能刷在最靠近海边的地方，范围很大。
			// 水洞大概在肯吉罗岛347，521，需要过桥，在一个类似民家和农田的下面靠近海边，很好找。
			// 水洞大概在肯吉罗岛431，423，在上下两个小山包之间，范围不大但没有参照物，不好找。
			// 风洞大概在肯吉罗岛398，206，在地图上看起来像是一个小坑的位置，很偏僻。可能刷在海边那里，很恶心。
			// 地洞10层index 27303，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27303，pos[20,29]。出口水晶为[16,38] cell = 3。
			// 水洞10层index 27306，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27306，pos[29,15]。队长建议走一格至pos[29,16]，出口水晶为[43,16] cell = 3。
			// 火洞10层index 27309，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27309，pos[25,21]。队长建议走一格至pos[26,21]，出口水晶为[39,27] cell = 3。
			// 风洞10层index 27312，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27312，pos[32,31]。队长建议走一格至pos[32,30]，出口水晶为[36,17] cell = 3。
			// 地洞11层开始地图index为1317或1384（经验证，index为随机，很难找规律），每一层index或增，或减，甚至可能-100多。猜测是离线制作了一定数量的地图，每次生产迷宫时随机拼凑10层。
			// 水洞11层开始地图index为1214（经验证，index为随机，很难找规律），每一层index或增，或减，甚至可能-100多。猜测是离线制作了一定数量的地图，每次生产迷宫时随机拼凑10层。
			// 水洞11层开始地图index为1306（经验证，index为随机，很难找规律），每一层index或增，或减，甚至可能-100多。猜测是离线制作了一定数量的地图，每次生产迷宫时随机拼凑10层。
			// 风11层开始地图index为1306或1384（经验证，index为随机，很难找规律），每一层index或增，或减，甚至可能-100多。猜测是离线制作了一定数量的地图，每次生产迷宫时随机拼凑10层。
			// 隐秘之洞 地洞最底层 index 27304，建议使用mapname来定位，mapname：'隐秘之洞 最底层'
			// 隐秘之洞 水洞最底层 index 27307，建议使用mapname来定位，mapname：'隐秘之洞 最底层'
			// 隐秘之洞 水洞最底层 index 27310，建议使用mapname来定位，mapname：'隐秘之洞 最底层'
			// 隐秘之洞 风洞最底层 index 27313，建议使用mapname来定位，mapname：'隐秘之洞 最底层'
			// 用以下对话方式与BOSS进入战斗，boss的对话框为【混乱的X之守卫咆哮的向你发起攻击。】
			// 战斗经验：对方是1元素巨人BOSS+4个对应属性的影子，敌人是W站位。
			//【注意】BOSS会超强单体连击，裸体不穿装备130级被打一下1000血，连3-7次，全中估计必死。乾坤一掷打1300-2000血，威胁没有连击大。BOSS会用一种特殊的全屏攻击，但只遇到一次，全员掉100-200血，不疼。
			// 其中水属性BOSS会恢复魔法，每回合回复1000+血，而且使用单体连击概率很大，一回合秒人是常事。而且还会超强睡眠，非常能消耗，请迅速击杀避免被拖死。
			// 其中火属性BOSS会气功弹，攻击力不低，收割残血能力很强。但几乎不会使用秒杀的连击，而是使用乾坤和诸刃代替，攻击力很高，但没有连击威胁大。一般会打1000-1900血。
			// 4影子战斗力很弱，但有时候会使用超强补血魔法，优先合击干掉。最后打BOSS。
			// 注意战斗胜利之后mapname依然是'隐秘之洞 最底层'，坐标也完全没变。只是index3发生了变化。
			// （地属性）战斗胜利后进入 index 27305，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
			// （水属性）战斗胜利后进入 index 27308，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
			// （火属性）战斗胜利后进入 index 27311，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
			// （风属性）战斗胜利后进入 index 27314，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
			// BOSS第一句话按钮是【下一步】，第二句话按钮只有一个【确定】，内容为：【谢谢你救了我，凡人。当四个守卫全部被解救的时候，古树之灵将会得到净化。】点击确定后传送至肯吉罗岛(index 61000)。
			// 点击BOSS的确定按钮后，传送并收走对应属性的【隐秘的水晶】并交给你对应属性的【净化的大地/流水/火焰/烈风碎片】
			// itemid：450957，name：净化的大地碎片，type：26
			// itemid：450958，name：净化的流水碎片，type：26
			// itemid：450959，name：净化的火焰碎片，type：26
			// itemid：450960，name：净化的烈风碎片，type：26

			// 最终4个BOSS都打完后，与最后一个元素BOSS对话之后不会传送至肯吉罗岛，而是index 27315的pos[23,25]，mapname依然还是【隐秘之洞 最底层】。
			// 可不走动直接与【混乱的古树之灵】对话，NPC的pos为[24,24]，被传送至出生地，mapname：【召唤之间】，index1530，任务完毕。
			/**
			 * 最终【混乱的古树之灵】的对话为以下内容，注意完成本任务并晋阶后，若已获得第11格技能栏，重解本任务古树会多出一个对话，可获得第12格技能栏。
			 * {
				type: 0,
				options: 32,
				dialog_id: 326,
				npc_id: 15700,
				message: '\n\n（四个净化的碎片与洛伊夫的护身符同时发出耀眼的光芒，古树之灵身上阴晦的气息浅浅消失。）'
				}

				{
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 15700,
				message: '\n\n谢谢你化解了我们的诅咒，勇者。你用你的力量和耐心证明了你的能力，相信有你这样的勇者在，肯吉罗岛的命运终将走向和谐的未来。'
				}

				{
				type: 0,
				options: 32,
				dialog_id: 326,
				npc_id: 15700,
				message: '\n\n为了帮助你完成你的任务，\n我将赐予你更为强大的力量。'
				}

				{
				type: 0,
				options: 1,
				dialog_id: 326,
				npc_id: 15700,
				message: '\n\n现在起你可以学习更多的技能了。\n再次感谢你，勇者。'
				}

			 *  */ 

			/**
			 * 简略写一下开发需要的流程
			 * 首先自行收集4元素的20个【隐秘的徽记】。
			 * 去圣骑士营地和洛伊夫老头对话，拿项链。再把4种20个隐秘的徽记兑换成4属性的【隐秘的水晶】，在第10层传送使用。
			 * 出发前，备好10级血瓶、料理，以及最重要的，深蓝药剂，要大量，一次大概会使用3-9个不等。
			 * 并准备好克制目标洞穴属性的水晶。
			 * 走迷宫，至10层使用【隐秘的水晶】传送，自动脱离队伍，需要重新组队。
			 * 4属性迷宫的最底层，mapname是相同的'隐秘之洞 最底层'，所有NPC的pos也相同，只有index不同。注意读取手动打BOSS配置。
			 * 与BOSS对话至战斗，战斗胜利后，传送至mapname、pos完全都相同的【隐秘之洞 最底层】，只有index不同。
			 * 这个时候队伍全员都在BOSS面前，可直接对话。
			 * 如果不是最后一个打完的BOSS，对话完毕会传送至肯吉罗岛，洞穴入口旁边。并交出隐秘的水晶，获得对应的净化碎片
			 * 如果是最后一个打完的BOSS，会传送至古树之灵房间，但只有mapname还是'隐秘之洞 最底层'，其余均不相同。其中还有4属性的水晶的传送门，但我没进去过。
			 * 与古树之灵对话，交出4属性净化碎片和洛伊夫项链，被传送至出生地【召唤之间】
			 * 如果已经5转，再次完成任务，古树会多出几句话，并给予你第12格技能栏。这里建议使用递归循环对话至【确定】键出来。
			 * 无论哪种情况，最终都会被传送至召唤之间，任务结束，可以进行晋级了。
			 * 
			 */

			cga.waitForLocation({mapname : '隐秘之洞 最底层'}, ()=>{
				configMode.manualLoad('手动BOSS')
				return
			});
		}
	},
	{//3
		intro: '3.前往盖雷布伦森林路路耶博士的家(244.76)，进入后再离开路路耶博士的家并传送至？？？。' + "\n" + '3.通过(142.69)或(122.69)处黄色传送石进入海底墓场外苑，寻找随机出现的守墓者并与之对话进入战斗。',
		workFunc: function(cb2){
			return
		}
	},
	{//4
		intro: '4.集齐7个【长老之证】后返回？？？，由持有7个【长老之证】的队员与荷特普(167.102)对话2次，选“是”交出【长老之证】并传送至盖雷布伦森林。',
		workFunc: function(cb2){}
	},
	{//5
		intro: '5.黄昏或夜晚时至神殿·伽蓝与荷特普(92.138)对话。',
		workFunc: function(cb2){}
	},
	{//6
		intro: '6.前往艾夏岛冒险者旅馆(102.115)与安洁可(55.32)对话，获得【逆十字】。',
		workFunc: function(cb2){}
	},
	{//7
		intro: '7.前往梅布尔隘地，持有【琥珀之卵】、【逆十字】与祭坛守卫(211.116)对话进入？？？。',
		workFunc: function(cb2){}
	},
	{//8
		intro: '8.击倒(136.197)一带的阻挡者后，进入(156.197)的传送石。9.击倒(213.226)、(235.202)等位置的任意一个阻挡者，随机被传送。',
		workFunc: function(cb2){}
	},
	{//9
		intro: '9.击倒(161.108)一带的阻挡者，经由(241.118)的传送石进入？？？。',
		workFunc: function(cb2){}
	},
	{//10
		intro: '10.返回盖雷布伦森林，持有【觉醒的文言抄本】与纳塞(245.73)对话，获得【转职保证书】。',
		workFunc: function(cb2){}
	},
	],
	[//任务阶段是否完成
		function(){//前期处理
			return false;
		},
	]
	);
	// task.anyStepDone = false意为关掉下面步骤做完导致上面步骤直接跳过的方式。
	// 详见cgaapi中的cga.task.Task源码
	task.anyStepDone = false;
	task.jumpToStep = 0;

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		// cga.SayWords('欢迎使用【UNAの脚本】全自动保证书+转职+刷声望流程，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			if(professionalInfo.jobmainname == '暗黑骑士' || professionalInfo.jobmainname == '教团骑士'){
				console.log('暗黑骑士和教团骑士无法通过保证书刷称号，直接进入陪打循环。')
				setTimeout(loop, 3000);
				return
			}else{
				console.log('任务完成，去阿蒙刷新一下称号。');
				cga.travel.falan.toStone('E2', ()=>{
					cga.walkList([
						[230, 82],
					], ()=>{
						cga.turnTo(230, 83);
						setTimeout(() => {
							if(cga.ismaxbattletitle() || cga.getItemCount('转职保证书') == 0 || 
							(reputationInfos.getReputation(cga.GetPlayerInfo().titles) == '敬畏的寂静' && configMode.finalJob.jobmainname == professionalInfo.jobmainname)
							){
								console.log('称号已满、包中没有保证书或已经不需要再烧声望，重新做本任务。')
								// 重置任务flag状态
								callZLZZ = false;
								callWYW = false;
								doneBOSS = false;

								setTimeout(loop, 3000);
								return
							}else{
								console.log('未到达满称号，开始转职刷声望')
								setTimeout(jump, 3000);
								return
							}
						}, 3000);
					});
				});
			}
		});
		return false;
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(teamMode.translate(pair))
			return true;
		if(configMode.translate(pair))
			return true;

		return false;
	},
	loadconfig : (obj)=>{

		if(!supplyMode.loadconfig(obj))
			return false;
		
		if(!teamMode.loadconfig(obj))
			return false;

		if(!configMode.loadconfig(obj))
			return false;
		
		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore
		
		if(thisobj.sellStore == undefined){
			console.error('读取配置：是否卖石失败！');
			return false;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([teamMode.inputcb, 
		// 	(cb2)=>{
		// 	var sayString = '【转职保证书插件】请选择服务监听端口: 1000~65535';
		// 	cga.sayLongWords(sayString, 0, 3, 1);
		// 	cga.waitForChatInput((msg, val)=>{
		// 		if(val !== null && val >= 1000 && val <= 65535){
		// 			configTable.listenPort = val;
		// 			thisobj.listenPort = val;
					
		// 			var sayString2 = '当前已选择:监听端口='+thisobj.listenPort+'。';
		// 			cga.sayLongWords(sayString2, 0, 3, 1);
					
		// 			cb2(null);
					
		// 			return false;
		// 		}
				
		// 		return true;
		// 	});
		// }
	], cb);
	},
	execute : ()=>{
		// io.listen(thisobj.listenPort);
		callSubPlugins('init');
		configMode.func('节能模式')
		loop();
	},
}

module.exports = thisobj;