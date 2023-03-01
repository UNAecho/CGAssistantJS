var fs = require('fs');
var cga = require('./cgaapi')(function () {
	// 人物已经默认做完全部乐园之卵任务，继续下一步跳转
	var jump =()=>{
		global.cga = cga
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\取出生启动金.js",
		}
		var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		scriptMode.call_ohter_script(body,setting)
	}

	var test2 = ()=>{

		if(cga.getItemCount('琥珀之卵') > 0){
			console.log('启用第二种验证机制，看看拿完乐园之卵，使用【朵拉】重置进度后，能不能走到长老之证的【？？？】房间')
			cga.travel.newisland.toPUB(() => {
				cga.walkList([
					[31, 21],
				], () => {
					cga.TurnTo(30, 20);
					cga.AsyncWaitNPCDialog(() => {
						cga.SayWords('朵拉', 0, 3, 1);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(1, 0);
								
								cga.travel.newisland.toStone('X', () => {
									cga.walkList([
										[130, 50, '盖雷布伦森林'],
										[246, 76, '路路耶博士的家'],
									], () => {
										cga.WalkTo(3, 10);
										cga.AsyncWaitMovement({map:['？？？'], delay:1000, timeout:10000}, (err, reason)=>{
											if(err){
												console.log('角色未能到达卵4长老处，建议删除角色重新创建，dev reason:'+reason)
												while(true){

												}
											}
											console.log('恭喜，角色已经做完全部乐园之卵任务，可以继续培养了')
											console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
											// jump()
											while(true){

											}
										});
									});
								});
							});
						});
					});
				});
			});
		}else{
			if (cga.getTimeRange() == '黎明' || cga.getTimeRange() == '白天'){
				setTimeout(test2, 10000);
				return
			}
			var retry = ()=>{
				cga.cleanInventory(1, ()=>{
					cga.turnTo(39, 21);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(!(dlg && dlg.message.indexOf('感觉脑海中有什么声响') >= 0)){
							setTimeout(retry, 5000);
							return;
						}
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(32, 0);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(32, 0);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(32, 0);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(1, 0);
												setTimeout(test2, 1000);
											});
										});
									});
								});
							});
						});
					});
				});				
			}
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[201, 96, '神殿　伽蓝'],
				[95, 104, '神殿　前廊'],
				[44, 41, '神殿　里侧大厅'],
				[34, 34, 59535],
				[48, 60, '约尔克神庙'],
				[39, 22],
				], ()=>{
					retry();
				});
			});
		}
	}

	var loadBattleConfig = ()=>{

		var settingpath = cga.getrootdir() + '\\战斗配置\\生产赶路.json'
	
		var setting = JSON.parse(fs.readFileSync(settingpath))
	
		cga.gui.LoadSettings(setting, (err, result)=>{
			if(err){
				console.log(err);
				return;
			}else{
				console.log('读取战斗配置【'+settingpath+'】成功')
			}
		})
		return
	}

	var next = () => {
		cga.walkList([
			[141, 105]
		], () => {
			cga.turnTo(142, 105);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);
				// cga.logBack();
				cga.travel.newisland.toStone('X', ()=>{
					console.log('启用第一种验证机制，去找纳塞对话，看对话内容判断乐园之卵的完成程度')
					cga.walkList([
					[130, 50, '盖雷布伦森林'],
					[244, 74],
					], ()=>{
						cga.TurnTo(245, 73);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							console.log('纳塞:' + dlg.message + '\n')
							if(dlg && dlg.message.indexOf('还留着什么') >= 0){
								/**
								 * 纳塞:　嗯？你们是？
								 * 总觉得在这个屋子里
								 * 好象还留着什么东西在的样子。
								 */
								console.log('恭喜，角色的乐园之卵进度为【卵3】，可以继续做转职保证书了。')
								console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
								while (true) {
								
								}
								// return;
							}else if(dlg && dlg.message.indexOf('组织是真的') >= 0){
								/**
								 * 纳塞:组织是真的
								 * 想要进行那个实验的。
								 */
								console.log('恭喜，角色的乐园之卵进度为【卵4拿保证书前】，可以循环做【卵4(转职保证书)】了。【请注意这个状态可以通过拿文言抄本直接获取一份转职保证书。】')
								console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
								// jump()
								// return;
								while (true) {
								
								}
							}else if(dlg && dlg.message.indexOf('活跃') >= 0){
								/*纳塞:
								　我……不对，是我们，
								　对你评价可是很高的喔。
								　而且也很期待你之后的活跃唷。
								*/
								console.log('恭喜，角色的乐园之卵进度为【卵4拿保证书后】，可以循环做【卵4(转职保证书)】了。')
								console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
								while (true) {
								
								}
								// return;
							}else if(dlg && dlg.message.indexOf('旧支配者') >= 0){
								/*UNA:纳塞的台词为【
								组织
								终于
								已经成功完成旧支配者
								的召唤了吧……。】，怀疑是全部乐园之卵都做完的状态，但下面的【自然与生命的关系】似乎比这个进度还要靠后。TODO确认纳塞这些台词到底属于什么阶段。
								推测原因：因为这个状态下，去酒吧输入【弗里德里希】重置为卵5完成后的状态，纳塞的台词依旧是【很期待你之后的活跃】，和输入【爱蜜儿】(卵4完成后)一样。
								所以这个台词疑似卵6已经做完，代表着全部乐园之卵已经完成。
								*/
								console.log('恭喜，角色已经做完全部乐园之卵任务，可以继续培养了')
								console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
								while (true) {
								
								}
								// return;
							}else if(dlg && dlg.message.indexOf('自然与生命的关系') >= 0){
								/*UNA:纳塞的台词为【
								以前有位知心朋友跟我讲过自然与生命的关系。
								他说生命的光辉和强烈的意志是能够让世界回到正确的理想状态的。
								想来人这种动物总是在追求。
								可是人所追求的就一定是正确的理想状态吗？
								人能够遵循于自然的发展吗？
								也许他是明白的。
								……但或许这是我们人类
								永远永远也无法明白的道理。
								不过呢，话又说回来了，他也只是滚滚河流里的一部分
								……所以也不能说他看到的就是唯一的真理。
								】，
								怀疑是全部乐园之卵都做完的状态，真实性待考证。
								推测原因：这个状态，无论在旅馆中输入哪一种回溯方式，都可以回溯。也就是这个阶段，是最终阶段。
								*/
								console.log('恭喜，角色已经做完全部乐园之卵任务，可以继续培养了')
								console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
								while (true) {
								
								}
								// return;
							}else if(dlg && dlg.message.indexOf('有位贤人讲过') >= 0){
								/*UNA:纳塞的台词为【
								　有位贤人讲过……。特定的规则不应该限定行为方式。
								*/
								console.log('没见过的对话，请自行抉择。')
								while (true) {
								
								}
								// return;
							}else if(dlg && dlg.message.indexOf('博士') >= 0){

								console.log('完成卵1状态')
								while (true) {
								
								}
								// return;
							}else{
								console.log('纳塞没体现出结果，推荐重新建号，请自行判断。')
								// 目前直接和纳塞对话即可判断，如果这种方式被封了，或许可以用test2方法来判断。
								// setTimeout(test2, 3000);
								while (true) {
								
								}
							}

						});
					});
				});
			});
		});
	};

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3
	loadBattleConfig()
	if (map == '召唤之间') {
		console.log('角色出生房间的index : 【', mapindex, '】')
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
						cga.travel.autopilot('里谢里雅堡',()=>{
							cga.travel.falan.toCity('艾尔莎岛', next);
						})
					});
				});
			});
		});
	}else if(map == '艾尔莎岛'){
		next()
	}
	else {
		cga.travel.falan.toCity('艾尔莎岛', next);
	}
});