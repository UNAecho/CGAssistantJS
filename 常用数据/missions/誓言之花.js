/**
 * 白色方舟第1层（包括入口）index59930
 * 白色方舟第4层index59933
 * 4层几个NPC:
 * 黄组
 * 【究明者】pos 95,78
 * 【宝箱】pos 92,78
 * 绿组【定论者】106,78
 * 龙心 #622042 @26，登出即消失
 * 与目送者（火焰鼠）对话，交出龙心后，被传送至黑露比房间的[93,12]
 * 黑露比房间:index 59934 x[90,102],y[9,21]。露比 99,15
 * 完成任务后，再次回到露比房间对话，她会说【真的来了啊】然后传送至77, 96, 59934
 * 
 * 传授者[64,60]（噩梦鼠）是教11级配方的npc，如果你不是黄绿组，则传到唤醒者面前（他俩处于同一个地图，并且互相走路可抵达）
 * 唤醒者[51,132]（水蓝鼠）是给11格技能栏的NPC，同时也是传送回光之路的NPC。与其对话：
 * 1、没有11格技能栏，会给予技能栏，再次对话，视为已经持有11格技能栏，按【确定】传送回光之路
 * 2、有11格技能栏，按【确定】传送回光之路
 * 
 * BOSS要点：
 * 1、会混乱攻击，攻击力较高且高概率附加混乱状态
 */
var thisobj = {
	taskName: '誓言之花',
	taskStages: [
		{//0
			intro: '1.前往光之路调查（165.81）处石碑，选“是”进入白色方舟第一层。',
			workFunc: function (cb2) {
				return
				let talkStone = (cb)=>{
					cga.askNpcForObj({ act: 'map', target: '白色方舟·第一层', npcpos: [165, 81] }, () => {
						cb(true)
					})
				}
				let goOut = (cb)=>{
					cga.walkList([
						[207, 91, '光之路'],
					], cb);
				}
				// 使用自动存取去仓库拿王冠，注意需要先刷好足够数量的王冠。如果王冠不够，可以使用【去白色方舟.js】脚本
				thisobj.func.bankObj.manualPrepare(
					{
						"item": [{ "name": "王冠", "upper": 1, "lower": 1 },],
					}, () => {
						let mapname = cga.GetMapName()
						if(mapname == '辛梅尔'){
							goOut(()=>{
								talkStone(cb2)
							})
							return
						}
						if(mapname == '光之路'){
							talkStone(cb2)
							return
						}

						// 没出发前可以回补
						if (cga.needSupplyInitial()) {
							thisobj.func.healObj.func(() => {
								setTimeout(cb2, 1000, 'restart stage');
							})
							return;
						}
						// 赶路模式
						thisobj.func.configMode.func('逃跑模式')
						cga.travel.newisland.toLiXiaIsland(() => {
							cga.travel.autopilot(59801, () => {
								cga.askNpcForObj({ act: 'map', target: '辛梅尔', npcpos: [35, 95] }, () => {
									goOut(()=>{
										talkStone(cb2)
									})
								})
							})
						});
					})
				return
			}
		},
		{//1
			intro: '2.根据职业与对应守卫对话，获得对应的【誓言之花】并进入白色方舟迷宫。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer0(cb2);
			}
		},
		{//2
			intro: '3.地图切到换花部分',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer0b(cb2);
			}
		},
		{//3
			intro: '4.白色方舟·第一层换花。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer1(cb2);
			}
		},
		{//4
			intro: '5.白色方舟·第一层换花完成，去第二层。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer1b(cb2);
			}
		},
		{//5
			intro: '6.白色方舟·第二层换花',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer2(cb2);
			}
		},
		{//6
			intro: '7.白色方舟·第二层换花完成，去第三层。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer2b(cb2);
			}
		},
		{//7
			intro: '8.白色方舟·第三层换花',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer3(cb2);
			}
		},
		{//8
			intro: '9.白色方舟·第三层换花完成，去第四层。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer3b(cb2);
			}
		},
		{//9
			intro: '10.白色方舟·第四层,战斗系组队，生产系换花。',
			workFunc: function (cb2) {
				thisobj.data.colorObject.func_layer4(cb2);
			}
		},
		{//10
			intro: '11.红蓝组进入黑色方舟寻找BOSS并击败，传送回白色方舟，持有【龙心】的角色与目送者对话。黄组完成各自不同的考试。绿组提交道具。四组最终都会传送至露比房间。',
			workFunc: function (cb2) {
				// 黑组寻找水晶逻辑
				let find = (cb) => {
					let randomMazeArgs = {
						table: thisobj.data.mazeInfo.posList,
						filter: (obj) => {
							return obj.cell == 3 && obj.mapx >= thisobj.data.mazeInfo.xLimit[0] && obj.mapx <= thisobj.data.mazeInfo.xLimit[1] && obj.mapy >= thisobj.data.mazeInfo.yLimit[0] && obj.mapy <= thisobj.data.mazeInfo.yLimit[1];
						},
						blacklist: [],
						expectmap: thisobj.data.mazeInfo.prefix + '1' + thisobj.data.mazeInfo.suffix,
					};
					cga.getRandomMazeEntrance(randomMazeArgs, (err) => {
						if (err && err.message && err.message.indexOf('没有找到迷宫入口') >= 0) {
							console.log('可能迷宫重置并未刷新，重新进行寻找...')
							setTimeout(find, 3000);
							return;
						}
						cb('restart stage')
					});
				}

				// 首先是与考官对话的obj制作，各组目的一致，只是各自考官NPC不同。终点都是露比房间。这里以绿组为基础数据，其它组根据此对象添加自己需要的部分
				let obj = {
					act: 'map', target: 59934, npcpos: [106, 78], pos: [93, 12]
				}
				if (thisobj.data.groupName == '红组' || thisobj.data.groupName == '蓝组') {
					obj.npcpos = [149, 79]
					obj.waitLocation = 59934
					obj.notalk = () => {
						if (cga.getItemCount('龙心') == 0) {
							console.log('你没有龙心，禁止与目送者对话。')
							return true
						}
						console.log('你持有龙心，与目送者对话。')
						return false
					}
				} else if (thisobj.data.groupName == '黄组') {
					obj.npcpos = [95, 78]
				}

				// 接下来是四个组各自的逻辑
				if (thisobj.data.groupName == '红组' || thisobj.data.groupName == '蓝组') {
					// 非黑组的红蓝组工具人到此为止
					if (!thisobj.data.teammates.includes(thisobj.data.myname)) {
						console.log('非黑组的红蓝组工具人到此为止')
						// 不能完成任务，否则会记录任务已完成或报错
						// cb2(true)
						return
					}

					// 开启任务playerThink
					cb2('playerThink on')

					// 黑组队长逻辑
					if (thisobj.data.isTeamLeader) {
						let mapname = cga.GetMapName()
						// 不能直接用walklist进入迷宫，因为如果碰巧迷宫刷新，角色会走到水晶处并卡住，因为水晶还没刷出来
						if (mapname == '白色方舟·第四层') {
							find(cb2)
							return
						} else if (mapname.indexOf('黑色方舟') != -1) {
							// 黑色方舟通用战斗配置
							thisobj.func.configMode.manualLoad(thisobj.data.normalFile)
							// 寻找暗黑龙并击败，队伍随机一位玩家获得【龙心】
							cga.exploreMaze({
								identify: (obj) => { return obj.name == '暗黑龙' },
								act: (obj, cb) => {
									if (obj.name == '暗黑龙') {
										cga.askNpcForObj({
											act: 'battle', target: {
												battle: thisobj.data.battleFile,
												normal: thisobj.data.normalFile,
											}, npcpos: [obj.x, obj.y]
										}, () => {
											cb(false)
										})
										return
									}
								}
							}, (cache) => {// 返回的是迷宫各单位的缓存
								console.log('暗黑龙战斗完毕..')
								// 与暗黑龙战斗之后需要走出迷宫，来到59934
								cga.walkRandomMazeAuto(thisobj.data.mazeInfo.exitMap, () => {
									// 与目送者对话进入露比房间，这里只能由持有龙心的人对话
									cga.askNpcForObj(obj, () => {
										cb2(true)
									})
								})
							})
						} else if (mapname.indexOf('白色方舟') != -1) {// 黑色方舟出口，59934
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						} else {
							throw new Error('人物出现在错误的地图')
						}
					} else {// 黑组队员逻辑
						// 黑色方舟通用战斗配置
						thisobj.func.configMode.manualLoad(thisobj.data.normalFile)

						cga.findNPCWithCallback('暗黑龙', (npc) => {
							cga.askNpcForObj({
								act: 'battle', target: {
									battle: thisobj.data.battleFile,
									normal: thisobj.data.normalFile,
								}, npcpos: [npc.xpos, npc.ypos], waitLocation: cga.GetMapIndex().index3, notalk: () => { return true }
							}, () => {
								console.log('暗黑龙战斗完毕..')
								// 与暗黑龙战斗之后需要走出迷宫，来到59934
								cga.waitForLocation({ mapindex: 59934 }, () => {
									// 与目送者对话进入露比房间，这里只能由持有龙心的人对话
									cga.askNpcForObj(obj, () => {
										cb2(true)
									})
								})
							})
						})
					}
				} else {//黄组、绿组部分逻辑可共用 TODO黄组需要完成每个职业对应的任务
					// 调查（92.78）宝箱获得【至高之剑】，与见证者对话，修理耐久降低后的【至高之剑】，成功后再与见证者对话
					if(thisobj.data.jobObj.job == '武器修理工'){

					}
					// 调查（92.78）宝箱获得【至高之铠】，与见证者对话，修理耐久降低后的【至高之铠】，成功后再与见证者对话
					else if(thisobj.data.jobObj.job == '防具修理工'){

					}
					// 调查（92.78）宝箱获得【陨石？】，鉴定后获得【神秘陨石】，与见证者对话
					else if(thisobj.data.jobObj.job == '鉴定士'){

					}
					// 进入（92.85）处传至白色方舟第三层，通过（121.124）的传送石进入第二层或第三层的随机无遇敌区域；寻找该区域的黄色传送石继续进行随机传送（有概率被传回究明者面前）；
					// 通过随机传送抵达第二层特定区域，调查（115.114）处宝箱获得【侦探眼镜】，返回与见证者对话
					else if(thisobj.data.jobObj.job == '侦探'){

					}
					// 进入（92.85）处传至白色方舟第三层，通过（121.124）的传送石进入第二层或第三层的随机无遇敌区域；寻找该区域的黄色传送石继续进行随机传送（有概率被传回究明者面前）；
					// 通过随机传送抵达第二层特定区域，调查（115.85）处宝箱获得【仙花】，再返回与见证者对话
					else if(thisobj.data.jobObj.job == '仙人'){

					}
					// 药剂师、厨师、矿工、樵夫、猎人以及所有绿组，直接交付需要的10级物品即可
					else{
						if (cga.getItemCount(thisobj.data.productDict[thisobj.data.jobObj.job].item) > 0) {
							console.log('你已持有晋级物品【' + thisobj.data.productDict[thisobj.data.jobObj.job].item + '】，具备晋级资格')
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						} else {
							console.log('你没有晋级物品【' + thisobj.data.productDict[thisobj.data.jobObj.job].item + '】，不具备晋级资格')
						}
					}
				}
			}
		},
		{//11
			intro: '12.与露比（99.15）对话。',
			workFunc: function (cb2) {

				// 四色组obj各不相同，以绿组为默认
				let obj = { act: 'map', target: 59934, npcpos: [99, 15] }
				// 解散队伍
				cga.disbandTeam(() => {
					// 已四转人物再重解本任务的逻辑，战斗系技能栏升11格，生产系获得11级物品制作配方
					if (thisobj.data.jobObj.jobLv > 3) {
						// 被传送至59934中学技能、11格技能栏的地图区域落地坐标
						obj.pos = [77, 96]
						// ◆红蓝组：已四转人物再重解本任务，至第6步与露比对话切换地图，与唤醒者（51.132）对话，技能栏上限增加至11格，再与唤醒者对话传送回光之路
						// 魔力百科上面写着红蓝组依然与传授者对话，但是实际并没有意义啊，这里将逻辑去除
						if (thisobj.data.groupName == '红组' || thisobj.data.groupName == '蓝组') {
							// 与露比对话
							cga.askNpcForObj(obj, () => {
								// 与唤醒者对话，传送至光之路
								cga.askNpcForObj({ act: 'map', target: 59505, npcpos: [51,132] }, () => {
									cb2(true)
								})
							})
							return
						}
						// ◆黄绿组：已四转人物再重解本任务，至第6步与露比对话切换地图，与传授者（64.60）对话获得本职业Lv.11物品制作法，再与唤醒者（51.132）对话，技能栏上限增加至11，再与唤醒者或传授者对话传送回光之路
						else{
							// 与露比对话
							cga.askNpcForObj(obj, () => {
								// 与传授者对话，获得11级配方 TODO 完善逻辑
								cga.askNpcForObj({ act: 'msg', target: 59505, npcpos: [64,60] }, () => {
									// 与唤醒者对话，传送至光之路
									cga.askNpcForObj({ act: 'map', target: 59505, npcpos: [51,132] }, () => {
										cb2(true)
									})
								})
							})
							return
						}
					} else {// 未四转人物的正常逻辑
						// 一直与露比对话至传送回光之路为止
						obj.target = 59505
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					}
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {//1.前往光之路调查（165.81）处石碑，选“是”进入白色方舟第一层。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x < 23) ? true : false;
		},
		function () {//2.根据职业与对应守卫对话，获得对应的【誓言之花】并进入白色方舟迷宫。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x >= 23 && cga.GetMapXY().x <= 70) ? true : false;
		},
		function () {//3.地图切到换花部分
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x > 70 && cga.getItemCount(thisobj.data.flowerTable[0][thisobj.data.colorObject.desired_flowers[0]]) == 0) ? true : false;
		},
		function () {//4.白色方舟·第一层换花。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x >= 23 && cga.getItemCount(thisobj.data.flowerTable[0][thisobj.data.colorObject.desired_flowers[0]]) > 0) ? true : false;
		},
		function () {//5.白色方舟·第一层换花完成，去第二层。
			return (cga.GetMapName() == '白色方舟·第二层' && cga.getItemCount(thisobj.data.flowerTable[1][thisobj.data.colorObject.desired_flowers[1]]) == 0) ? true : false;
		},
		function () {//6.白色方舟·第二层换花
			return (cga.GetMapName() == '白色方舟·第二层' && cga.getItemCount(thisobj.data.flowerTable[1][thisobj.data.colorObject.desired_flowers[1]]) > 0) ? true : false;
		},
		function () {//7.白色方舟·第二层换花完成，去第三层。
			return (cga.GetMapName() == '白色方舟·第三层' && cga.getItemCount(thisobj.data.flowerTable[2][thisobj.data.colorObject.desired_flowers[2]]) == 0) ? true : false;
		},
		function () {//8.白色方舟·第三层换花
			return (cga.GetMapName() == '白色方舟·第三层' && cga.getItemCount(thisobj.data.flowerTable[2][thisobj.data.colorObject.desired_flowers[2]]) > 0) ? true : false;
		},
		function () {//9.白色方舟·第三层换花完成，去第四层。
			if (cga.GetMapName() == '白色方舟·第四层') {
				// 黄组绿组要多和水晶对话一次，更新自己的花
				if (thisobj.data.colorObject.desired_flowers[3] != undefined)
					return cga.getItemCount(thisobj.data.flowerTable[2][thisobj.data.colorObject.desired_flowers[3]]) > 0;
				else {// 红蓝组这里直接跳过
					return true
				}
			}

			return false;
		},
		function () {//10.白色方舟·第四层,战斗系组队，生产系换花。
			let mapname = cga.GetMapName()
			// 黄组绿组要多换一次花
			if (mapname == '白色方舟·第四层' && thisobj.data.colorObject.desired_flowers[3] != undefined) {
				return cga.getItemCount(thisobj.data.flowerTable[3][thisobj.data.colorObject.desired_flowers[3]]) > 0;
			}
			// 红蓝组从此分为黑组和工具人组
			if (thisobj.data.colorObject.desired_flowers[3] == undefined) {
				// 黑组完成组队
				if (thisobj.data.teammates.includes(thisobj.data.myname)) {
					let tmpTeam = cga.getTeamPlayers();
					if (tmpTeam.length < thisobj.data.teammates.length) {
						return false
					}
					for (let t = 0; t < tmpTeam.length; t++) {
						/**
						 * UNAecho开发提醒:
						 * cga.getTeamPlayers()是根据地图上的单位获取信息的，游戏出现BUG时(看不到附近的玩家、NPC等)会导致cga.getTeamPlayers()出现返回队员的信息是全0的情况
						 * 也就是hp、maxhp等信息全0，导致逻辑无法进行。所以这里遇到异常数据（以maxhp==0为异常判断，maxhp > 0是正常数据）时，直接跳过，防止逻辑异常
						 */
						if (tmpTeam[t].maxhp > 0 && !thisobj.data.teammates.includes(tmpTeam[t].name)) {
							console.log('队员:', tmpTeam[t].name, '与预期队伍:', thisobj.data.teammates, '不匹配，返回false')
							return false
						}
					}
					return true
				} else {// 工具人直接跳过
					return mapname == '白色方舟·第四层'
				}

			}
			return false;
		},
		function () {//11.红蓝组进入黑色方舟寻找BOSS并击败，传送回白色方舟，持有【龙心】的角色与目送者对话。黄组完成各自不同的考试。绿组提交道具。四组最终都会传送至露比房间。
			var index = cga.GetMapIndex().index3;
			var XY = cga.GetMapXY();
			return (index == 59934 && XY.x > 41 && XY.x < 86 && XY.y > 53 && XY.y < 137) ? true : false;
		},
		function () {//12.与见证者对话，生产系需要提前准备好晋级物品。
			return false
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		// 自己的名字
		myname: cga.GetPlayerInfo().name,
		// 自己的职业
		jobObj: cga.job.getJob(),
		// 与暗黑龙战斗时的默认战斗配置
		battleFile: '手动BOSS',
		// 黑色方舟组队通过迷宫的默认战斗配置
		normalFile: '任务',
		// 交易暗号，如果外部没有输入，则使用默认
		cipher: 'UNA誓言之花脚本',
		// 分组隶属，红蓝黄绿，默认绿组，因为绿组职业太多，穷举麻烦
		groupName: '绿组',
		// 分组逻辑的缓存，就是colorArray中属于自己分组的逻辑
		colorObject: null,
		// 各职业分组
		red: ['剑士', '骑士', '战斧斗士', '弓箭手', '格斗士', '教团骑士', '暗黑骑士', '魔术师', '传教士', '咒术师', '巫师'],
		blue: ['士兵', '忍者', '舞者', '盗贼', '封印师', '驯兽师', '饲养师', '医师', '护士'],
		yellow: ['鉴定士', '厨师', '侦探', '仙人', '药剂师', '矿工', '樵夫', '猎人', '武器修理工', '防具修理工'],
		green: [],// 默认，无需穷举
		// 黑色方舟的固定队伍，需要外部传入
		teammates: [],
		// 黑色方舟迷宫对象
		mazeInfo: cga.mazeInfo['黑色方舟'],

		// 红组白色方舟1层第1个组队坐标
		redBuildTeamPos1_1: [29, 96],
		// 红组白色方舟1层第2个组队坐标
		redBuildTeamPos1_2: [76, 93],
		// 红组白色方舟2层第1个组队坐标
		redBuildTeamPos2_1: [108, 64],
		// 红组白色方舟3层第1个组队坐标
		redBuildTeamPos3_1: [101, 85],
		// 红组白色方舟4层第1个组队坐标
		redBuildTeamPos4_1: [88, 40],
		// 红组白色方舟4层第2个组队坐标(黑色方舟入口处)
		redBuildTeamPos4_2: [100, 96],

		// 蓝组白色方舟1层第1个组队坐标
		blueBuildTeamPos1_1: [29, 108],
		// 蓝组白色方舟1层第2个组队坐标
		blueBuildTeamPos1_2: [75, 141],
		// 蓝组白色方舟2层第1个组队坐标
		blueBuildTeamPos2_1: [109, 137],
		// 蓝组白色方舟3层第1个组队坐标
		blueBuildTeamPos3_1: [77, 113],
		// 蓝组白色方舟4层第1个组队坐标
		blueBuildTeamPos4_1: [17, 105],
		// 蓝组白色方舟4层第2个组队坐标(黑色方舟入口处)
		blueBuildTeamPos4_2: [100, 96],

		// 黄组白色方舟1层第1个组队坐标
		yellowBuildTeamPos1_1: [28, 91],
		// 黄组白色方舟1层第2个组队坐标
		yellowBuildTeamPos1_2: [76, 57],
		// 黄组白色方舟2层第1个组队坐标
		yellowBuildTeamPos2_1: [53, 60],
		// 黄组白色方舟3层第1个组队坐标
		yellowBuildTeamPos3_1: [121, 73],
		// 黄组白色方舟4层第1个组队坐标
		yellowBuildTeamPos4_1: [101, 17],

		// 绿组白色方舟1层第1个组队坐标
		greenBuildTeamPos1_1: [29, 104],
		// 绿组白色方舟1层第2个组队坐标
		greenBuildTeamPos1_2: [76, 121],
		// 绿组白色方舟2层第1个组队坐标
		greenBuildTeamPos2_1: [79, 163],
		// 绿组白色方舟3层第1个组队坐标
		greenBuildTeamPos3_1: [16, 104],
		// 绿组白色方舟4层第1个组队坐标
		greenBuildTeamPos4_1: [36, 120],

		// 莎莲娜鼓动的石盘
		npcPos1: [54, 161],
		// 任务普通战斗组队开关，true则组队战斗，false则单人逃跑。
		soloBattle: false,
		// 任务BOSS战斗组队开关，true则组队战斗，false则单挑BOSS。
		soloBoss: false,
		// 黑色方舟入口组队坐标
		buildTeamPos9: [100, 94],
		// 除战斗系外需要交付的物品
		productDict: {
			'武器修理工': { item: '至高之剑', count: 1 },
			'防具修理工': { item: '至高之铠', count: 1 },
			'鉴定士': { item: '神秘陨石', count: 1 },
			'侦探': { item: '侦探眼镜', count: 1 },
			'仙人': { item: '仙花', count: 1 },
			'药剂师': { item: '生命回复药（1000）', count: 1 },
			'厨师': { item: '鳖料理', count: 1 },
			'矿工': { item: '奥利哈钢', count: 20 },
			'樵夫': { item: '梣', count: 20 },
			'猎人': { item: '甲鱼', count: 20 },
			'铸剑工': { item: '曲刀', count: 1 },
			'造枪工': { item: '异型枪', count: 1 },
			'造斧工': { item: '处刑斧', count: 1 },
			'造弓工': { item: '魔弹', count: 1 },
			'造杖工': { item: '星屑短杖', count: 1 },
			'小刀工': { item: '幻之匕首', count: 1 },
			'投掷武器工': { item: '天秤回力标', count: 1 },
			'头盔工': { item: '圣龙头盔', count: 1 },
			'铠甲工': { item: '黄金铠甲', count: 1 },
			'制靴工': { item: '龙之靴', count: 1 },
			'造盾工': { item: '勇者之盾', count: 1 },
			'帽子工': { item: '妖精之帽', count: 1 },
			'裁缝工': { item: '灵魂之服', count: 1 },
			'长袍工': { item: '奇迹之袍', count: 1 },
			'制鞋工': { item: '龙之鞋', count: 1 },
		},
		// 各层誓言之花的itemid
		flowerTable: [
			{
				'红花': 622051,
				'黄花': 622052,
				'绿花': 622053,
				'蓝花': 622054,
			},
			{
				'红花': 622055,
				'黄花': 622056,
				'绿花': 622057,
				'蓝花': 622058,
			},
			{
				'红花': 622059,
				'黄花': 622060,
				'绿花': 622061,
				'蓝花': 622062,
			},
			{
				'红花': 622059,
				'黄花': 622060,
				'绿花': 622061,
				'蓝花': 622062,
			}
		],
		// 各个组的行动逻辑
		colorArray: [
			{
				type: 1,
				name: '红组',
				desired_flowers: [
					'黄花',
					'绿花',
					'蓝花',
				],
				func_layer0: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [22, 96], pos: [28, 96] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer0b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [58, 93], pos: [75, 93] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer1: (cb) => {
					cga.walkList([
						[89, 75],
					], () => {
						thisobj.func.waitFlower(0, '红花', '黄花', [89, 73], cb);
					});
				},
				func_layer1b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第二层', npcpos: [164, 77] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer2: (cb) => {
					cga.walkList([
						[126, 100],
					], () => {
						thisobj.func.waitFlower(1, '黄花', '绿花', [126, 102], cb);
					});
				},
				func_layer2b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第三层', npcpos: [153, 88] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer3: (cb) => {
					cga.walkList([
						[122, 92],
					], () => {
						thisobj.func.waitFlower(2, '绿花', '蓝花', [122, 90], cb);
					});
				},
				func_layer3b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第四层', npcpos: [89, 40] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer4: (cb) => {
					// 如果自己不是黑色组的人，跳过
					if (!thisobj.data.teammates.includes(thisobj.data.myname)) {
						cb(true)
						return
					}
					// 黑色方舟前组队
					cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.redBuildTeamPos4_2 }, (r) => {
						if (r && r == 'ok') {
							cb(true)
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
				}
			},
			{
				type: 2,
				name: '蓝组',
				desired_flowers: [
					'绿花',
					'黄花',
					'红花',
				],
				func_layer0: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [22, 108], pos: [28, 108] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer0b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [60, 142], pos: [74, 141] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer1: (cb) => {
					cga.walkList([
						[89, 131],
					], () => {
						thisobj.func.waitFlower(0, '蓝花', '绿花', [89, 129], cb);
					});
				},
				func_layer1b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第二层', npcpos: [148, 137] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer2: (cb) => {
					cga.walkList([
						[126, 102],
					], () => {
						thisobj.func.waitFlower(1, '绿花', '黄花', [126, 100], cb);
					});
				},
				func_layer2b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第三层', npcpos: [153, 108] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer3: (cb) => {
					cga.walkList([
						[54, 120],
					], () => {
						thisobj.func.waitFlower(2, '黄花', '红花', [54, 118], cb);
					});
				},
				func_layer3b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第四层', npcpos: [37, 120] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer4: (cb) => {
					// 如果自己不是黑色组的人，跳过
					if (!thisobj.data.teammates.includes(thisobj.data.myname)) {
						cb(true)
						return
					}
					// 黑色方舟前组队
					cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.blueBuildTeamPos4_2 }, (r) => {
						if (r && r == 'ok') {
							cb(true)
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
				}
			},
			{
				type: 3,
				name: '黄组',
				desired_flowers: [
					'红花',
					'蓝花',
					'绿花',
					'黄花',
				],
				func_layer0: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [22, 92], pos: [28, 92] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer0b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [60, 63], pos: [75, 57] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer1: (cb) => {
					cga.walkList([
						[89, 73],
					], () => {
						thisobj.func.waitFlower(0, '黄花', '红花', [89, 75], cb);
					});
				},
				func_layer1b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第二层', npcpos: [137, 48] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer2: (cb) => {
					cga.walkList([
						[70, 102],
					], () => {
						thisobj.func.waitFlower(1, '红花', '蓝花', [70, 104], cb);
					});
				},
				func_layer2b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第三层', npcpos: [85, 88] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer3: (cb) => {
					cga.walkList([
						[122, 90],
					], () => {
						thisobj.func.waitFlower(2, '蓝花', '绿花', [122, 92], cb);
					});
				},
				func_layer3b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第四层', npcpos: [101, 16] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer4: (cb) => {
					cga.walkList([
						[99, 83],
					], () => {
						thisobj.func.waitFlower(3, '绿花', '黄花', [101, 83], () => {
							console.log('换花环节结束..')
							cb(true);
						});
					});
				}
			},
			{
				type: 4,
				name: '绿组',
				desired_flowers: [
					'蓝花',
					'红花',
					'黄花',
					'绿花',
				],
				func_layer0: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [22, 104], pos: [28, 104] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer0b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第一层', npcpos: [60, 122], pos: [75, 121] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer1: (cb) => {
					cga.walkList([
						[89, 129],
					], () => {
						thisobj.func.waitFlower(0, '绿花', '蓝花', [89, 131], cb);
					});
				},
				func_layer1b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第二层', npcpos: [164, 109] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer2: (cb) => {
					cga.walkList([
						[70, 104],
					], () => {
						thisobj.func.waitFlower(1, '蓝花', '红花', [70, 102], cb);
					});
				},
				func_layer2b: (cb) => {
					cga.walkList([
						[84, 112],
					], () => {
						cga.TurnTo(86, 112);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({ map: '白色方舟·第三层', delay: 1000, timeout: 5000 }, cb);
						});
					});
				},
				func_layer3: (cb) => {
					cga.walkList([
						[54, 118],
					], () => {
						thisobj.func.waitFlower(2, '红花', '黄花', [54, 120], cb);
					});
				},
				func_layer3b: (cb) => {
					let obj = { act: 'map', target: '白色方舟·第四层', npcpos: [69, 96] }
					cga.askNpcForObj(obj, () => { cb(true) })
				},
				func_layer4: (cb) => {
					cga.walkList([
						[101, 83],
					], () => {
						thisobj.func.waitFlower(3, '黄花', '绿花', [99, 83], () => {
							console.log('换花环节结束..')
							cb(true);
						});
					});
				}
			},
		],
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		configMode: require('../../通用挂机脚本/公共模块/读取战斗配置.js'),
		dropUseless: (items, cb) => {
			let itemname = items.shift()
			if (itemname) {
				let item = cga.findItem(itemname)
				if (item != -1) {
					console.log('丢弃【', itemname, '】，如果想要保留，请在脚本中将其去除。')
					cga.DropItem(item);
				}
				setTimeout(thisobj.func.dropUseless, 1500, items, cb);
				return
			}
			cb(null)
			return
		},
		// 换花func
		waitFlower: (layerIndex, myItem, waitForItem, waitForPos, cb) => {

			cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
			cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);

			cga.TurnTo(waitForPos[0], waitForPos[1]);

			var isLeft = myItem > waitForItem;

			var stuffs =
			{
				itemFilter: (item) => {
					if (item.itemid == thisobj.data.flowerTable[layerIndex][myItem]) {
						return true;
					}
					return false;
				}
			}

			var waitChat = () => {
				cga.AsyncWaitChatMsg((err, r) => {
					if (r && r.unitid != -1) {
						var findpos = r.msg.indexOf(': ' + thisobj.data.cipher);
						if (findpos > 0) {
							var playername = r.msg.substr(0, findpos);

							if (thisobj.data.myname != playername) {
								var playerunit = cga.findPlayerUnit(playername);
								if (playerunit != null && playerunit.xpos == waitForPos[0] && playerunit.ypos == waitForPos[1]) {
									cga.positiveTrade(playername, stuffs, undefined, result => {
										if (result && result.success == true) {
											cb(true);
										} else {
											waitChat();
										}
									});
									return;
								}
							}
						}
					}

					waitChat();
				}, 5000);
			}

			var waitTrade = () => {
				cga.waitTrade(stuffs, null, (results) => {
					if (results && results.success == true) {
						cb(true);
					}
					else {
						cga.SayWords(thisobj.data.cipher + '，持有[' + myItem + ']，需要交换' + '[' + waitForItem + ']。UNA全自动化脚本为您服务', 0, 3, 1);
						waitTrade();
					}
				}, 5000);
			}

			if (isLeft)
				waitChat();
			else
				waitTrade();
		},
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}
		let map = cga.GetMapName()
		let playerinfo = cga.GetPlayerInfo()
		let teamplayers = cga.getTeamPlayers()
		let index = cga.GetMapIndex().index3

		// 到达指定房间后自动终止playerthink
		if (index == 59934) {
			console.log('到达指定区域，playerthink自动终止...')
			return false
		}

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			teamplayers: teamplayers,
			result: null,
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		// 黑色方舟队伍监测，此任务没有重新组队的逻辑，所以不使用thisobj.data.noTeamThinkObj。想查询此逻辑，请去【开启者.js】任务中观看。
		if (map.indexOf('黑色方舟') != -1 && ctx.teamplayers.length != thisobj.data.teammates.length) {
			console.log('队伍与预设值', thisobj.data.teammates, '不符，中断任务')
			return function (cb) {
				// 返回任务的第index步
				cb(0)
			}
		}

		/**
		 * 由于光之路地图去一次特别麻烦，这里规定一下关于任务中受伤、掉魂的逻辑：
		 * 1、所有不参加黑色方舟暗黑龙BOSS战的人，无视受伤与掉魂。宠物有忠诚度监测，可放心赶路。
		 * 2、参加黑暗龙BOSS战的人，受伤继续，掉魂登出回城接受治疗。此时其余全员可能也需要跟着回去，因为换花逻辑无法中断继续。
		 * 3、注意，红组与蓝组也会遵循1的逻辑。
		 */
		if (thisobj.data.teammates.includes(ctx.playerinfo.name)) {
			// 受伤无视，掉魂则登出招魂
			if (ctx.playerinfo.souls > 0) {
				console.log('监测到你已经掉魂，考虑到你需要参加黑色方舟的BOSS战，中断任务，治疗和招魂之后返回第0步重新做。')
				return function (cb) {
					// 治疗、招魂
					thisobj.func.healObj.func(() => {
						// 返回任务的第index步
						cb(0)
					})
				}
			}
		}

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param

		// 如果没有3转，则无法进入白色方舟，也就无法开始任务
		if (thisobj.data.jobObj.jobLv < 3) {
			throw new Error('职业未达到师范，无法进行誓言之花任务')
		}

		// 先分组，红蓝黄绿
		if (thisobj.data.red.includes(thisobj.data.jobObj.job)) {
			thisobj.data.groupName = '红组'
		} else if (thisobj.data.blue.includes(thisobj.data.jobObj.job)) {
			thisobj.data.groupName = '蓝组'
		} else if (thisobj.data.yellow.includes(thisobj.data.jobObj.job)) {
			thisobj.data.groupName = '黄组'
		}
		// 读取分组
		thisobj.data.colorObject = thisobj.data.colorArray.find(a => {
			return a.name == thisobj.data.groupName
		})

		console.log('你的职业【' + thisobj.data.jobObj.job + '】是【' + thisobj.data.groupName + '】')

		// 如果红蓝组有需要打黑色方舟，需要外部传入队伍信息
		if (thisobj.param.hasOwnProperty('teammates')) {
			thisobj.data.teammates = thisobj.param.teammates
		} else {
			console.log('【UNAecho脚本提醒】你没有传入需要通过黑色方舟的队伍人员配置，脚本默认不执行黑色方舟逻辑')
		}

		// 黑色方舟的战斗静态数据处理
		if (thisobj.data.teammates.includes(thisobj.data.myname)) {
			console.log('【UNAecho脚本提醒】你存在于黑色方舟的队伍列表中，脚本届时将执行通过黑色方舟逻辑（包括击杀BOSS暗黑龙）')
			// 迷宫中的战斗配置
			if (thisobj.param.hasOwnProperty('battle')) {
				thisobj.data.battleFile = thisobj.param.battle
			} else {
				console.log('【UNAecho脚本提醒】你没有传入与暗黑龙战斗的战斗配置文件名，脚本使用默认文件【' + thisobj.data.battleFile + '】来战斗')
			}
			if (thisobj.param.hasOwnProperty('normal')) {
				thisobj.data.normalFile = thisobj.param.normal
			} else {
				console.log('【UNAecho脚本提醒】你没有传入在黑色方舟赶路时的战斗配置文件名，脚本使用默认文件【' + thisobj.data.normalFile + '】来战斗')
			}
		} else {
			console.log('【UNAecho脚本提醒】你不在黑色方舟战斗队伍中，如果你是红蓝组，则跳过黑色方舟。如果你是黄绿组，则没有影响。')
		}

		// 判断自己是队长还是队员
		let playerInfo = cga.GetPlayerInfo()
		thisobj.data.isTeamLeader = !thisobj.data.teammates || thisobj.data.teammates[0] == playerInfo.name

		// 换花文字内容匹配，防止和其它玩家运行的相同脚本进行交易
		if (typeof thisobj.param.cipher == 'string' && thisobj.param.cipher.length > 0) {
			thisobj.data.cipher = thisobj.param.cipher
			console.log('你采用了自定义交易喊话内容【' + thisobj.data.cipher + '】，只有说出此内容的角色，才被视为可以换花的角色')
		} else {
			console.log('你没有输入自定义交易喊话内容，使用默认内容【' + thisobj.data.cipher + '】，只有说出此内容的角色，才被视为可以换花的角色')
		}

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		task.doTask(() => {
			cga.refreshMissonStatus({ '誓言之花': true }, cb)
		});
		return
	},
};

module.exports = thisobj;