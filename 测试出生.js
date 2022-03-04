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
	// 人物并未做完乐园之卵，需要删除重建
	var fail =()=>{
		global.cga = cga
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\取出生启动金.js",
			autorestart :false,
		}
		var settingpath = rootdir +'\\战斗配置\\生产赶路.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		scriptMode.call_ohter_script(body,setting)
	}
	var next = () => {
		cga.walkList([
			[141, 105]
		], () => {
			cga.turnTo(142, 105);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);
				cga.logBack();
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
													return;
												}
												console.log('恭喜，角色已经做完全部乐园之卵任务，可以继续培养了')
												console.log('准备跳转至新建角色准备工作，顺序是【取出生启动金.js】-【就职传教-全自动流程.js并学补血】-【学习其他必要技能.js】')
												jump()
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	};

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
						cga.travel.falan.toCity('艾尔莎岛', next);
					});
				});
			});
		});
	}

	else if (map == '法兰城' || map == '里谢里雅堡') {
		cga.travel.falan.toCity('艾尔莎岛', next);
	}else if (map == '艾尔莎岛') {
		next()
	}else if (map == '盖雷布伦森林' && cga.GetMapXY().x ==246 && cga.GetMapXY().y ==76) {
		fail()
	}
	else {
		jump()
	}




});