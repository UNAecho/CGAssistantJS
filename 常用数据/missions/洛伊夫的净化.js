/**
 * UNAecho:记录一些开发所需的信息
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
 * 迷宫10层传送所需的【隐秘的水晶】可无限使用，不会消失。
 * 各BOSS所在坐标：
 * 地BOSS [20, 24]
 * 水BOSS [24, 28]
 * 火BOSS [28, 24]
 * 风BOSS [24, 20]
 * 
 * 所有属性的迷宫其实是由2个随机迷宫组成，1-9层是1个迷宫，10层是第1个迷宫的出口地图，同时是第2个迷宫的入口地图。11-最下层是另一个迷宫。
 * 也就是说在1-9层迷宫过期后会被传送回肯吉罗岛。而11-底层迷宫过期后，会被传送至第10层。
 * 
 * 地洞大概在肯吉罗岛534，272需要使用API搜寻入口，地洞范围内还可能出现一个蓝色的水晶入口，是未来之塔，需要注意躲避，可以加入黑名单。地洞甚至可能刷在最靠近海边的地方，范围很大。
 * 水洞大概在肯吉罗岛347，521，需要过桥，在一个类似民家和农田的下面靠近海边，很好找。
 * 火洞大概在肯吉罗岛431，423，在上下两个小山包之间，范围不大但没有参照物，不好找。
 * 风洞大概在肯吉罗岛398，206，在地图上看起来像是一个小坑的位置，很偏僻。可能刷在海边那里，很恶心。
 * 
 * 地洞10层index 27303，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27303，pos[20,29]。出口水晶为[16,38] cell = 3。
 * 水洞10层index 27306，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27306，pos[29,15]。队长建议走一格至pos[29,16]，出口水晶为[43,16] cell = 3。
 * 火洞10层index 27309，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27309，pos[25,21]。队长建议走一格至pos[26,21]，出口水晶为[39,27] cell = 3。
 * 风洞10层index 27312，需要使用隐秘的水晶传送过墙才可继续探索。使用后人物被传送至同一个index 27312，pos[32,31]。队长建议走一格至pos[32,30]，出口水晶为[36,17] cell = 3。
 * 隐秘之洞 地洞最底层 index 27304
 * 隐秘之洞 水洞最底层 index 27307
 * 隐秘之洞 火洞最底层 index 27310
 * 隐秘之洞 风洞最底层 index 27313
 * 
 * 
 * boss的对话框为【混乱的X之守卫咆哮的向你发起攻击。】
 * 注意战斗胜利之后mapname依然是'隐秘之洞 最底层'，坐标也完全没变。只是index3发生了变化。
 * （地属性）战斗胜利后进入 index 27305，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
 * （水属性）战斗胜利后进入 index 27308，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
 * （火属性）战斗胜利后进入 index 27311，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
 * （风属性）战斗胜利后进入 index 27314，BOSS坐标不变。mapname依旧是'隐秘之洞 最底层'，战斗胜利后所有人都在BOSS面前，可不走动直接与BOSS对话
 * 
 * BOSS第一句话按钮是【下一步】，第二句话按钮只有一个【确定】，内容为：【谢谢你救了我，凡人。当四个守卫全部被解救的时候，古树之灵将会得到净化。】点击确定后传送至肯吉罗岛(index 61000)。
 * 点击BOSS的确定按钮后，传送并收走对应属性的【隐秘的水晶】并交给你对应属性的【净化的大地/流水/火焰/烈风碎片】
 * itemid：450957，name：净化的大地碎片，type：26
 * itemid：450958，name：净化的流水碎片，type：26
 * itemid：450959，name：净化的火焰碎片，type：26
 * itemid：450960，name：净化的烈风碎片，type：26
 * 
 * 最终4个BOSS都打完后，与最后一个元素BOSS对话之后不会传送至肯吉罗岛，而是index 27315的pos[23,25]，mapname依然还是【隐秘之洞 最底层】。
 * 可不走动直接与【混乱的古树之灵】对话，NPC的pos为[24,24]，被传送至出生地，mapname：【召唤之间】，index1530，任务完毕。
 * 
 * 【混乱的古树之灵】的对话为以下内容，注意完成本任务并晋阶后，若已获得第11格技能栏，重解本任务古树会多出一个对话，可获得第12格技能栏。
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
 * 战斗相关信息：
 * 出发之前记得换克制对应属性的水晶，并备好大量深蓝药剂、血瓶和料理（10级）。
 * 路上敌人很多，消耗巨大。其中深蓝药剂能大幅降低赶路难度。尽量穿上装备，裸体打架相当困难。
 * 其中水洞的怪会超强混乱和中毒，消耗极大，一场战斗可能会出现满血人员直接伤亡。一定要吃深蓝药剂规避战斗。
 * 
 * BOSS战：
 * 对方是1元素巨人BOSS+4个对应属性的影子，敌人是W站位。
 * 【注意】BOSS会超强单体连击，裸体不穿装备130级被打一下1000血，连3-7次，全中估计必死。乾坤一掷打1300-2000血，威胁没有连击大。BOSS会用一种特殊的全屏攻击，但只遇到一次，全员掉100-200血，不疼。
 * 其中水属性BOSS会恢复魔法，每回合回复1000+血，而且使用单体连击概率很大，一回合秒人是常事。而且还会超强睡眠，非常能消耗，请迅速击杀避免被拖死。
 * 其中火属性BOSS会气功弹，攻击力不低，收割残血能力很强。但几乎不会使用秒杀的连击，而是使用乾坤和诸刃代替，攻击力很高，但没有连击威胁大。一般会打1000-1900血。
 * 4影子战斗力很弱，但有时候会使用超强补血魔法，优先合击干掉。最后打BOSS。
 */
var thisobj = {
	taskName: '洛伊夫的净化',
	taskStages: [
		{//0
			intro: '0.任务准备。刷新任务进度，并决定去哪一个洞窟。',
			workFunc: function (cb2) {
				// 判断去哪个迷宫
				thisobj.func.refreshProgress((mazeIndex) => {
					// 如果没有要去的迷宫，代表任务已完成，跳转至任务最后
					if (mazeIndex == -1) {
						cb2('jump', thisobj.taskStages.length - 1)
						return
					}
					// 如果有要去的迷宫，更新数据
					thisobj.data.curElementalObj = thisobj.data.elementalInfo[mazeIndex]

					// 补充状态、更换水晶等
					if (cga.travel.isInVillage()) {
						thisobj.func.healObj.func(() => {
							cga.travel.falan.toCamp(() => {
								// 接任务，以及换对应属性的隐秘水晶
								let obj = { act: 'item', target: thisobj.data.curElementalObj.emblemCrystal, npcpos: [100, 84], waitLocation: 44690 }
								cga.askNpcForObj(obj, () => {
									// 再补血一次，防止人物在来营地过程中耗血耗蓝
									cga.travel.toHospital(() => {
										// 水晶符合要求则跳过，不符合则购买
										thisobj.func.buyCrystal(() => {
											// 组队出发
											cga.travel.autopilot('主地图', () => {
												cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: [96, 87] }, (r) => {
													if (r && r == 'ok') {
														cb2(true)
													} else {
														throw new Error('cga.buildTeam返回类型错误')
													}
												})
											})
										})
									})
								})
							});
						})
					} else {
						console.log('当前不在城镇内，脚本停止，请自行回到城内，重新启动脚本。')
					}
				})
			}
		},
		{//1
			intro: '1.持有【隐秘的水晶】进入对应的隐秘之洞，抵达随机迷宫第10层时双击对应的【隐秘的水晶】传送至随机迷宫第11层入口处。通过迷宫后进入迷宫最底层，击败BOSS后拿到对应的净化碎片。',
			workFunc: function (cb2) {
				// 如果是跳转过来的，这里刷新要去的洞窟数据
				thisobj.func.refreshProgress((mazeIndex) => {
					// 如果没有要去的迷宫，代表任务已完成，跳转至任务最后
					if (mazeIndex == -1) {
						cb2('jump', thisobj.taskStages.length - 1)
						return
					}
					// 如果有要去的迷宫，更新数据
					thisobj.data.curElementalObj = thisobj.data.elementalInfo[mazeIndex]
					// 如果已经拿到了净化的碎片，返回任务第0步，重新规划下一步行动
					if (cga.getItemCount(thisobj.data.curElementalObj.purifiedShard) > 0) {
						cb2('jump', 0)
						return
					}
					// 如果净化的碎片没拿到，则准备通过迷宫、打BOSS

					// 读取准备好的默认或外部传入的战斗配置
					cga.loadBattleConfig(thisobj.data.normalFile)
					// 制作playerThink组队监听的例外情况，此坐标1x1内即便队伍异常也不会打断playerThink
					thisobj.data.noTeamThinkObj[thisobj.data.curElementalObj.firstMaze.exitMap] = [
						// 上层出口，这里使用水晶传送会导致队伍解散或队员离队。backTopPosList的index2为空串，这里去掉。
						thisobj.data.curElementalObj.firstMaze.backTopPosList[0].slice(0, 2),

						// 如果一个坐标是另一个坐标的1x1范围内，则可以省略。就比如落地坐标和组队坐标
						// thisobj.data.curElementalObj.afterUseEmblemCrystal,

						// 上层出口使用水晶后的队长组队坐标
						thisobj.data.curElementalObj.buildTeamPos1_1,
					]
					// 开启任务playerThink
					cb2('playerThink on')

					let mapindex = cga.GetMapIndex().index3;
					let map = cga.GetMapName();
					let curMaze = cga.getMazeInfo({name:map,index:mapindex})

					// 队长逻辑
					if (thisobj.data.isTeamLeader) {
						// 获取深蓝药剂数量
						let deepBlueCnt = cga.getItemCount(18526)
						// 本任务人物只会进入隐秘之洞这一种随机迷宫，所以可以靠能否获取到迷宫对象来判断人物是否在隐秘之洞中
						if (curMaze != null) {
							console.log('深蓝药剂剩余数量:' + deepBlueCnt)
							// // 在迷宫时（除BOSS房间），要时刻同步运行此方法，保持深蓝药剂的生效。如果药剂吃完，则抛出异常中止脚本
							// if (!thisobj.data.listening && mapindex != thisobj.data.curElementalObj.secondMaze.exitMap) {
							// 	thisobj.data.listening = true
							// 	cga.keepDeepBlueEffect((err) => {
							// 		if (err && err.message.indexOf('耗尽') != -1) {
							// 			thisobj.data.listening = false
							// 			throw new Error('深蓝药剂耗尽，请携带足够数量再重新执行本脚本')
							// 		}
							// 	})
							// }
							// 延迟一下等待深蓝药剂生效再走迷宫
							setTimeout(()=>{
								// 带队员走至迷宫出口
								cga.walkRandomMazeAuto(curMaze.exitMap, () => {
									let curMapindex = cga.GetMapIndex().index3
									let curXY = cga.GetMapXY()
									// 如果出口是上层的出口，并且人物在使用水晶传送前的区域，则使用水晶传送
									if (curMapindex == thisobj.data.curElementalObj.firstMaze.exitMap && curXY.y <= thisobj.data.curElementalObj.splitAxis) {
										thisobj.func.useEmblemCrystal(thisobj.data.curElementalObj, () => {
											cb2('restart stage')
											return
										})
									}
									// 如果出口是上层的出口，并且人物在使用水晶传送后的区域，则组队
									else if (curMapindex == thisobj.data.curElementalObj.firstMaze.exitMap && curXY.y > thisobj.data.curElementalObj.splitAxis) {
										// 传入dangerLevel：2,防止队长调整位置时遇敌导致阵亡
										cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.curElementalObj.buildTeamPos1_1, dangerLevel: 2 }, (r) => {
											if (r && r == 'ok') {
												// 进入隐秘之洞下层，或人物被迷宫刷新甩出来之后重新进入
												cga.getRandomMazeEntrance({
													table: thisobj.data.curElementalObj.secondMaze.posList,
													filter: (obj) => {
														return obj.cell == 3 && obj.mapx >= thisobj.data.curElementalObj.secondMaze.xLimit[0] && obj.mapx <= thisobj.data.curElementalObj.secondMaze.xLimit[1] && obj.mapy >= thisobj.data.curElementalObj.secondMaze.yLimit[0] && obj.mapy <= thisobj.data.curElementalObj.secondMaze.yLimit[1];
													},
													blacklist: [],
													expectmap: '隐秘之洞地下11层',
												}, () => {
													cb2('restart stage')
												})
											} else {
												throw new Error('cga.buildTeam返回类型错误')
											}
										})
									}
									// 如果出口是下层出口，则准备打BOSS 
									else if (curMapindex == thisobj.data.curElementalObj.secondMaze.exitMap) {
										// 读取准备好的默认或外部传入的战斗配置
										cga.loadBattleConfig(thisobj.data.battleFile)
										// 走到BOSS面前，等待玩家手动与BOSS开战
										cga.askNpcForObj({
											act: 'battle', target: {
												battle: thisobj.data.battleFile,
												normal: thisobj.data.normalFile,
											}, npcpos: thisobj.data.curElementalObj.bossPos, notalk: () => { return true }
										}, () => {
											// 如果战斗失败，则cga.waitForMap还可以实现等待再次战斗胜利继续脚本的效果。如果战斗胜利，cga.waitForMap也不会影响正常逻辑。
											cga.waitForMap(thisobj.data.curElementalObj.winMap, () => {
												// 解散队伍
												cga.disbandTeam(() => {
													// 与BOSS对话，获得对应的净化碎片
													let obj = { act: 'item', target: thisobj.data.curElementalObj.purifiedShard, npcpos: thisobj.data.curElementalObj.bossPos }
													cga.askNpcForObj(obj, () => {
														// 重新执行本方法，会在最初发现已经持有净化碎片，并跳转
														cb2('restart stage')
													})
												})
											})
										})
									} else {// 出口是意外地图
										throw new Error('逻辑不应该出现在这里，请检查')
									}
								})
							},2000)
						} else if (map == '圣骑士营地') {
							if (deepBlueCnt < 3) {
								console.warn('【UNAecho脚本警告】你身上深蓝药剂不足3个，预计难以维持到BOSS房间，推荐携带3-9个为宜。当深蓝药剂耗尽时，脚本将停止。')
							}
							cga.walkList([
								[36, 87, '肯吉罗岛'],
							], () => {
								cb2('restart stage')
							});
						} else if (map == '肯吉罗岛') {
							if (deepBlueCnt < 3) {
								console.warn('【UNAecho脚本警告】你身上深蓝药剂不足3个，预计难以维持到BOSS房间，推荐携带3-9个为宜。当深蓝药剂耗尽时，脚本将停止。')
							}
							cga.getRandomMazeEntrance({
								table: thisobj.data.curElementalObj.firstMaze.posList,
								filter: (obj) => {
									return obj.cell == 3 && obj.mapx >= thisobj.data.curElementalObj.firstMaze.xLimit[0] && obj.mapx <= thisobj.data.curElementalObj.firstMaze.xLimit[1] && obj.mapy >= thisobj.data.curElementalObj.firstMaze.yLimit[0] && obj.mapy <= thisobj.data.curElementalObj.firstMaze.yLimit[1];
								},
								blacklist: [],
								expectmap: '隐秘之洞地下1层',
							}, () => {
								cb2('restart stage')
							})
						} else {
							throw new Error('逻辑不应该出现在这里，请检查')
						}
					} else {// 队员逻辑
						// 本任务人物只会进入隐秘之洞这一种随机迷宫，所以可以靠能否获取到迷宫对象来判断人物是否在隐秘之洞中
						if (curMaze != null) {
							// 不论是在上层还是下层洞窟，都先等待队长带队至出口地图
							cga.waitForMap(curMaze.exitMap, () => {
								let curMapindex = cga.GetMapIndex().index3
								let curXY = cga.GetMapXY()
								// 如果出口是上层的出口，并且人物在使用水晶传送前的区域，则使用水晶传送
								if (curMapindex == thisobj.data.curElementalObj.firstMaze.exitMap && curXY.y <= thisobj.data.curElementalObj.splitAxis) {
									thisobj.func.useEmblemCrystal(thisobj.data.curElementalObj, () => {
										cb2('restart stage')
										return
									})
								}
								// 如果出口是上层的出口，并且人物在使用水晶传送后的区域，则组队
								else if (curMapindex == thisobj.data.curElementalObj.firstMaze.exitMap && curXY.y > thisobj.data.curElementalObj.splitAxis) {
									cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.curElementalObj.buildTeamPos1_1 }, (r) => {
										if (r && r == 'ok') {
											// 等待进入BOSS房间
											cga.waitForMap(thisobj.data.curElementalObj.secondMaze.exitMap, () => {
												cb2('restart stage')
												return
											})
										} else {
											throw new Error('cga.buildTeam返回类型错误')
										}
									})
								}
								// 如果出口是下层出口，则准备打BOSS 
								else if (curMapindex == thisobj.data.curElementalObj.secondMaze.exitMap) {
									// 读取准备好的默认或外部传入的战斗配置
									cga.loadBattleConfig(thisobj.data.battleFile)
									// 等待战斗胜利进入win地图
									cga.waitForMap(thisobj.data.curElementalObj.winMap, () => {
										// 等待队伍解散
										cga.disbandTeam(() => {
											// 与BOSS对话，获得对应的净化碎片
											let obj = { act: 'item', target: thisobj.data.curElementalObj.purifiedShard, npcpos: thisobj.data.curElementalObj.bossPos }
											cga.askNpcForObj(obj, () => {
												// 重新执行本方法，会在最初发现已经持有净化碎片，并跳转
												cb2('restart stage')
											})
										})
									})
								} else {// 出口是意外地图
									throw new Error('逻辑不应该出现在这里，请检查')
								}
							})
						} else {// 如果不在隐秘之洞中，那么肯定就在营地/肯吉罗岛的路上。那么开启等待进入上层出口（隐秘之洞10层）逻辑
							cga.waitForMap(thisobj.data.curElementalObj.firstMaze.exitMap, () => {
								cb2('restart stage')
							})
						}
					}
				})
			}
		},
		{//2
			intro: '2.与混乱的古树之灵对话获得晋阶资格并传送回召唤之间，任务完结。',
			workFunc: function (cb2) {
				if (cga.GetMapIndex().index3 != 27315) {
					throw new Error('此步骤仅能在混乱的古树之灵房间完成')
				}
				cga.disbandTeam(() => {
					// 与BOSS对话，直至被传送回召唤之间，任务结束。如果已经5转，并且持有第11个技能栏，这里会赠与第12格技能栏。
					let obj = { act: 'map', target: '召唤之间', npcpos: [24, 24] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				})
				return
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {// 0.任务准备。刷新任务进度，并决定去哪一个洞窟。
			let teamplayers = cga.getTeamPlayers()
			let map = cga.GetMapName()
			return teamplayers.length == thisobj.data.teammates.length || map.indexOf('隐秘之洞') != -1;
		},
		function () {// 1.持有【隐秘的水晶】进入对应的隐秘之洞，抵达随机迷宫第10层时双击对应的【隐秘的水晶】传送至随机迷宫第11层入口处。通过迷宫后进入迷宫最底层，击败BOSS后拿到对应的净化碎片。
			// 如果抵达古树之灵房间，则跳过本步骤
			return cga.GetMapIndex().index3 == 27315
		},
		function () {// 2.与混乱的古树之灵对话获得晋阶资格并传送回召唤之间，任务完结。
			return cga.GetMapName().indexOf('召唤之间') != -1
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		// 自己的职业
		jobObj: cga.job.getJob(),
		// 队伍信息缓存
		teammates: null,
		// BOSS战的默认战斗配置
		battleFile: '手动BOSS',
		// 赶路时的默认战斗配置
		normalFile: '任务',
		// playerthink禁用队伍监测的坐标位置，在此位置1x1范围内，playerthink会忽视队伍变动。
		// 洛伊夫的净化任务，会动态传入对应属性的相关数据，这里初始化即可
		noTeamThinkObj: {},
		// 监听深蓝药剂的API是否在运行中，一次任务只能运行一个，多了会出现问题
		listening: false,
		// 当前正在进行中的洞窟信息，是elemental的某一个key所对应的value。动态更新，是本任务的核心调用对象
		curElementalObj: null,
		// 任务专用的四属性信息
		elementalInfo: {
			// 地 
			0: {
				// 隐秘的徽记 itemid
				emblem: 450949,
				// 隐秘的水晶 itemid
				emblemCrystal: 450953,
				// 净化的碎片 itemid
				purifiedShard: 450957,
				// 隐秘之洞上层迷宫数据
				firstMaze: cga.mazeInfo['隐秘之地洞上层'],
				// 隐秘之洞下层迷宫数据
				secondMaze: cga.mazeInfo['隐秘之地洞下层'],
				// 战斗胜利房间
				winMap: 27305,
				/**
				 * 隐秘之洞上层出口，使用水晶传送前后区域的x/y轴分割坐标（大于/小于这个数值则视为传送前/后）
				 * 使用X/Y坐标、大于/小于以及视为传送前/后，这个逻辑由你自行决定。
				 * 默认使用y轴数值，小于等于视为传送水晶使用前
				 */
				splitAxis: 26,
				// 隐秘之洞上层出口使用水晶传送后的落地坐标
				afterUseEmblemCrystal: [20, 29],
				// 隐秘之洞上层出口使用水晶传送后的组队坐标
				buildTeamPos1_1: [21, 29],
				// BOSS坐标
				bossPos: [20, 24],
				// 打该属性洞窟需要购买的商店水晶:
				crystal: '火风的水晶（5：5）'
			},
			// 水 
			1: {},
			// 火 
			2: {},
			// 风 
			3: {},
			// 隐秘的徽记（地）
			450949: 20,
			// 隐秘的徽记（水）
			450950: 20,
			// 隐秘的徽记（火）
			450951: 20,
			// 隐秘的徽记（风）
			450952: 20,
			// 隐秘的水晶（地）
			450953: 1,
			// 隐秘的水晶（水）
			450954: 1,
			// 隐秘的水晶（火）
			450955: 1,
			// 隐秘的水晶（风）
			450956: 1,
			// 净化的大地碎片
			450957: 1,
			// 净化的流水碎片
			450958: 1,
			// 净化的火焰碎片
			450959: 1,
			// 净化的烈风碎片
			450960: 1,
		},
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		configMode: require('../../通用挂机脚本/公共模块/读取战斗配置.js'),
		// 更新当前各元素净化碎片的持有状态，将自己的称号打上标记，并将该标记返回。
		refreshProgress: (cb) => {
			let nick = ''

			if (cga.getItemCount(450957) > 0) {
				nick = nick + '1'
			} else {
				nick = nick + '0'
			}

			if (cga.getItemCount(450958) > 0) {
				nick = nick + '1'
			} else {
				nick = nick + '0'
			}
			if (cga.getItemCount(450959) > 0) {
				nick = nick + '1'
			} else {
				nick = nick + '0'
			}
			if (cga.getItemCount(450960) > 0) {
				nick = nick + '1'
			} else {
				nick = nick + '0'
			}

			if (cga.GetPlayerInfo().nick != nick) {
				console.log('更新需要打的洞窟状态【' + nick + '】')
				cga.ChangeNickName(nick)
			}
			// 给其它成员变成称号预留一定的响应时间
			let delayTime = 2000
			console.log('延迟' + delayTime + 'ms后开始统计各洞窟完成情况..')
			// 检查本次需要打哪一个洞窟。组队和个人均适用
			setTimeout(() => {
				let teamplayers = cga.getTeamPlayers()
				if (teamplayers.length) {
					for (let i in teamplayers) {
						for (let nickIdx in teamplayers[i].nick) {
							if (teamplayers[i].nick[nickIdx] == '0') {
								cb(parseInt(nickIdx))
								return
							}
						}
					}
					// 如果全员都完成，返回-1
					cb(-1)
					return
				} else {// 如果不在队伍中，则检查自己个人
					for (let nickIdx in nick) {
						if (nick[nickIdx] == '0') {
							cb(parseInt(nickIdx))
							return
						}
					}
					// 如果都完成，返回-1
					cb(-1)
					return
				}
			}, delayTime)
			return
		},
		// 检查本次需要打哪一个洞窟。如果传入特定称号，则检查传入的参数。如果没传入，则检查全队或个人
		getMazeIndex: (nick) => {
			// 如果有参数传入，检查参数
			if (nick && typeof nick == 'string') {
				for (let nickIdx in nick) {
					if (nick[nickIdx] == '0') {
						return parseInt(nickIdx)
					}
				}
				return -1
			}

			// 如果参数没传或不合规，则检查全队称号或个人称号
			let teamplayers = cga.getTeamPlayers()
			// 如果在队伍中，检查全队
			if (teamplayers.length) {
				for (let i in teamplayers) {
					for (let nickIdx in teamplayers[i].nick) {
						if (teamplayers[i].nick[nickIdx] == '0') {
							return parseInt(nickIdx)
						}
					}
				}
			} else {// 如果不在队伍中，则检查自己个人
				let playerInfo = cga.GetPlayerInfo()
				for (let nickIdx in playerInfo.nick) {
					if (playerInfo.nick[nickIdx] == '0') {
						return parseInt(nickIdx)
					}
				}
			}
			return -1
		},
		// 隐秘之洞10层使用水晶传送
		useEmblemCrystal: (elementalMazeInfo, cb) => {
			let XY = cga.GetMapXY();
			if (XY.x == elementalMazeInfo.afterUseEmblemCrystal[0] && XY.y == elementalMazeInfo.afterUseEmblemCrystal[1]) {
				cb(null)
				return
			}
			let pos = cga.findItem(elementalMazeInfo.emblemCrystal)
			if (pos == -1) {
				throw new Error('身上没有传送所需的隐秘的水晶')
			}
			cga.UseItem(pos);
			setTimeout(thisobj.func.useEmblemCrystal, 2000, elementalMazeInfo, cb)
		},
		// 更换对应属性的水晶
		buyCrystal: (cb) => {
			let curCrystalObj = cga.getEquipCrystal()
			// 如果水晶不符合要求，则换水晶
			if (curCrystalObj == undefined || curCrystalObj.name != thisobj.data.curElementalObj.crystal) {
				// 如果水晶不是需要的属性，则边走边丢弃。
				if (curCrystalObj && curCrystalObj.name != thisobj.data.curElementalObj.crystal) {
					cga.DropItem(curCrystalObj.pos);
				}
				cga.travel.autopilot('商店', () => {
					cga.walkList(
						[[14, 26]], () => {
							cga.turnDir(0);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(0, 0);
								cga.AsyncWaitNPCDialog((err, dlg) => {

									var store = cga.parseBuyStoreMsg(dlg);
									if (!store) {
										throw new Error('商店内容解析失败')
									}

									var buyitem = store.items.find((it) => {
										return it.name == thisobj.data.curElementalObj.crystal;
									});
									if (buyitem == undefined) {
										throw new Error('商店没有该种水晶出售，可能已被买完')
									}

									cga.BuyNPCStore([{ index: buyitem.index, count: 1 }]);
									cga.AsyncWaitNPCDialog((err, dlg) => {
										if (dlg && dlg.message.indexOf('谢谢') >= 0) {
											console.log('购买完成')
											let retry = () => {
												let crystal = cga.getEquipCrystal()
												if (crystal && crystal.name == thisobj.data.curElementalObj.crystal) {
													cb(null)
													return
												}

												let pos = cga.findItem(thisobj.data.curElementalObj.crystal)
												if (pos == -1) {
													throw new Error('水晶购买后不在身上，请检查')
												}
												cga.UseItem(pos);
												setTimeout(retry, 2000)
											}
											retry()
											return;
										}
										else {
											throw new Error('购买失败，可能钱不够或物品栏没有空位！')
										}
									});
								});
							});

						});
				})
				return
			}
			// 如果水晶符合条件，则退出
			cb(null)
			return
		}
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo()
		let teamplayers = cga.getTeamPlayers()
		let index = cga.GetMapIndex().index3

		// 到达指定房间后自动终止playerthink
		// 4属性BOSS战斗胜利房间，或是任务终点混乱的古树之灵房间
		if (thisobj.data.curElementalObj && index == thisobj.data.curElementalObj.secondMaze.exitMap || index == thisobj.data.curElementalObj.winMap) {
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

		if (ctx.teamplayers.length != thisobj.data.teammates.length) {
			if (cga.isAroundPos(thisobj.data.noTeamThinkObj, null, true)) {
				console.log('地图切换首末组队阶段，暂时阻止playerthink的组队监测..')
			} else {
				console.log('队伍与预设值', thisobj.param.teammates, '不符，中断任务')
				// TODO 开发过程中暂时改为 return false
				return false
				// return function (cb) {
				// 	// 返回任务的第index步
				// 	cb(0)
				// }
			}
		}

		// 受伤则中止任务
		if (ctx.playerinfo.health > 0 || ctx.playerinfo.souls > 0) {
			console.log('人物受伤，中断任务')
			// TODO 开发过程中暂时改为 return false
			return false
			// return function (cb) {
			// 	// 治疗、招魂
			// 	healMode.func(() => {
			// 		// 返回任务的第index步
			// 		cb(0)
			// 	})
			// }
		}

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param

		let playerInfo = cga.GetPlayerInfo()
		// 如果没有4转，或低于120级，则无法开始任务
		if (playerInfo.lv < 120 || thisobj.data.jobObj.jobLv < 4) {
			throw new Error('职业未达到大师阶段或等级低于120级，无法进行任务')
		}

		// 外部传入队伍信息
		if (!thisobj.param.hasOwnProperty('teammates') || !thisobj.param.teammates instanceof Array) {
			throw new Error('必须传入正确的队伍成员信息')
		}

		// 保存队伍信息
		thisobj.data.teammates = thisobj.param.teammates

		// 判断自己是队长还是队员
		thisobj.data.isTeamLeader = thisobj.data.teammates[0] == playerInfo.name

		// 外部传入的战斗配置
		if (thisobj.param.hasOwnProperty('battle')) {
			thisobj.data.battleFile = thisobj.param.battle
		} else {
			console.log('【UNAecho脚本提醒】你没有传入BOSS战所使用的战斗配置文件名，脚本使用默认文件【' + thisobj.data.battleFile + '】来战斗')
		}
		if (thisobj.param.hasOwnProperty('normal')) {
			thisobj.data.normalFile = thisobj.param.normal
		} else {
			console.log('【UNAecho脚本提醒】你没有传入赶路时所使用的战斗配置文件名，脚本使用默认文件【' + thisobj.data.normalFile + '】来战斗')
		}

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		task.doTask(() => {
			cga.refreshMissonStatus({ '洛伊夫的净化': true }, cb)
		});
		return
	},
};

module.exports = thisobj;