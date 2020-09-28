var cga = require('./cgaapi')(function(){

	var targetname = null
	// 职业目录
	var joblist = []
	// 目标职业
	var job  = null
	// 是否为转职
	var transferflag = false
	// 提取本地职业信息
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	var professionalInfos = getprofessionalInfos('制造系')
	var professionalInfo = null
	for(p in professionalInfos){
		joblist.push(professionalInfos[p].jobmainname)
	}
	var forgetskill = (skillname)=>{
		var dialogHandler = (err, dialog)=>{
			if(dialog){
				var hasSkill = cga.findPlayerSkill(skillname) ? true : false;
				if( hasSkill )
				{
					if (dialog.type == 16) {
						cga.ClickNPCDialog(-1, 1);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
					if (dialog.type == 18) {
						const skillIndex = cga.GetSkillsInfo().sort((a,b) => a.pos - b.pos).findIndex(s => s.name == skillname);
						if (skillIndex > -1) {
							cga.ClickNPCDialog(0, skillIndex);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}
					}
				}
				if (dialog.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
				// //这是重新学习的逻辑，注释掉留日后开发备用
				// if (dialog.message.indexOf('已经删除') >= 0 || !hasSkill) {
				// 	setTimeout(()=>{
				// 		cga.TurnTo(teacher.pos[0], teacher.pos[1]);
				// 		cga.AsyncWaitNPCDialog((dlg)=>{
				// 			cga.ClickNPCDialog(0, 0);
				// 			cga.AsyncWaitNPCDialog((dlg2)=>{
				// 				cga.ClickNPCDialog(0, 0);
				// 				setTimeout(cb, 1000);
				// 			});
				// 		});
				// 	}, 1000);
				// 	return;
				// }
			}
		}
		cga.AsyncWaitNPCDialog(dialogHandler);
	}
	var task = cga.task.Task('就职制造师', [
	{
		intro: '1.决定就职武器还是防具制造师。',
		workFunc: function(cb2){
			var stage1 = ()=>{
				var sayString = '请选择想就职的制造业：[';
				for(var i in joblist){
					if(i != 0)
						sayString += ', ';
					sayString += '('+ (parseInt(i)+1) + ')' + joblist[i];
				}
				sayString += ']';
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, index)=>{
	
					if(index !== null && index >= 1 && joblist[index - 1]){
						job = joblist[index - 1];
						
						var sayString2 = '当前已选择职业:[' + joblist[index - 1] + ']。';
						professionalInfo = getprofessionalInfos(joblist[index - 1])
						// 判断是否是转职
						var currentjob = getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname
						if ((currentjob != professionalInfo.jobmainname) && currentjob != '游民'){
							transferflag = true
							sayString2 += '你选的职业和你当前职业不同，注意你是转职哦。'
						}
						cga.sayLongWords(sayString2, 0, 3, 1);
						stage2()
						
						return false;
					}
		
					return true;
				});
			}

			var stage2 = () =>{
				targetname = ['投掷','刀','斧','弓','枪','杖','剑'].find((n)=>{
					return job.indexOf(n) >= 0;
				}) == undefined ? '试炼衣' : '试炼剑';
				cb2(true)
			}
			stage1()
		}
	},
	{
		intro: '2.去买铜，商店同时还可以买铁、银、印度轻木、枞、黄月木（挖掘和伐木123级材料）。',
		workFunc: function(cb2){
			cga.travel.newisland.toStone('C', ()=>{
				cga.walkList([
					[144, 120, '武器工房'],
					[28, 21, '画廊'],
					[57, 54],
				], ()=>{
					cga.turnTo(59, 54);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							var store = cga.parseBuyStoreMsg(dlg);
							if(!store)
							{
								cb(new Error('商店内容解析失败'));
								return;
							}
				
							var buyitem = [];
							var emptySlotCount = cga.getInventoryEmptySlotCount();
				
							store.items.forEach((it)=>{
								if(it.name == '铜' && emptySlotCount > 0){
									buyitem.push({index: it.index, count: 20});
								}
							});
				
							cga.BuyNPCStore(buyitem);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(cga.getItemCount('铜') < 20){
									cb2(new Error('买铜失败，可能钱不够？'));
									return;
								}
								cb2(true);
							});
						});
					});
				});
			});
		}
	},
	{
		intro: '3.到法兰城内职业介绍所[193.51]找募集樵夫的阿空交谈并学习伐木体验技能。',
		workFunc: function(cb2){
			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[195, 50, '职业介绍所'],
					[7, 10],
				], ()=>{
					cga.turnTo(8, 11);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(0, -1);
							cga.AsyncWaitNPCDialog(()=>{
								var skill = cga.findPlayerSkill('伐木体验');
								if(!skill){
									cb2(new Error('伐木体验学习失败！可能钱不够？'));
									return;
								}
								cb2(true);
							});
						});
					});
				});
			});
		}
	},
	{
		intro: '4.学到技能后再到法兰城外的树旁使用伐木体验技能伐下20个孟宗竹。',
		workFunc: function(cb2){
			
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}
			
			cga.travel.falan.toStone('E', ()=>{
				cga.walkList([
					[281, 88, '芙蕾雅']
				], ()=>{
					var skill = cga.findPlayerSkill('伐木体验');
					cga.StartWork(skill.index, 0);
					var waitEnd = function(cb2){
						cga.AsyncWaitWorkingResult(()=>{
							var playerInfo = cga.GetPlayerInfo();
							if(playerInfo.mp == 0)
							{
								cb2(true);
								return;
							}								
							if(cga.getItemCount('孟宗竹') >= 20)
							{
								cb2(true);
								return;
							}
							var item = cga.getInventoryItems().find((it)=>{
								return ((it.name == '印度轻木' || it.name == '竹子') && it.count == 40)
							});
							if(item){
								cga.DropItem(item.pos);
							}
							cga.StartWork(skill.index, 0);
							waitEnd(cb2);
						}, 10000);
					}
					waitEnd(cb2);
				});
			});
		}
	},
	{
		intro: '5.过河拆桥,把伐木体验删了,留着占技能栏。',
		workFunc: function(cb2){

			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[195, 50, '职业介绍所'],
					[7, 10],
				], ()=>{
					cga.turnTo(8, 11);
					forgetskill('伐木体验')
					cb2(true)
				});
			});
		}
	},
	{
		intro: '6.到伊尔村(39.70)的赛杰利亚酒吧(39.70)，找NPC(16,10)学习狩猎体验技能。',
		workFunc: function(cb2){
			cga.travel.falan.toTeleRoom('伊尔村', ()=>{
				cga.walkList([
					[12, 17, '村长的家'],
					[6, 13, '伊尔村'],
					[48, 77],
					],()=>{
						cga.turnTo(48, 75);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(0, -1);
								cga.AsyncWaitNPCDialog(()=>{
									var skill = cga.findPlayerSkill('狩猎体验');
									if(!skill){
										cb2(new Error('狩猎体验学习失败！可能钱不够？'));
										return;
									}
									cb2(true);
								});
							});
						});
					});
			});
		}
	},
	
	{
		intro: '7.学到技能后再到伊尔村外面使用狩猎体验验技能打20个鹿皮。',
		workFunc: function(cb2){
			
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}
			cga.travel.falan.toStone('E1', ()=>{
				cga.walkList([
					[281, 88, '芙蕾雅'],
					[596, 247]
				], ()=>{
					var skill = cga.findPlayerSkill('狩猎体验');
					cga.StartWork(skill.index, 0);
					var waitEnd = function(cb2){
						cga.AsyncWaitWorkingResult(()=>{
							var playerInfo = cga.GetPlayerInfo();
							if(playerInfo.mp == 0)
							{
								cb2(true);
								return;
							}								
							if(cga.getItemCount('鹿皮') >= 20)
							{
								cb2(true);
								return;
							}
							var item = cga.getInventoryItems().find((it)=>{
								return ((it.name == '传说中的鹿皮') && it.count == 40)
							});
							if(item){
								cga.DropItem(item.pos);
							}
							cga.StartWork(skill.index, 0);
							waitEnd(cb2);
						}, 10000);
					}
					waitEnd(cb2);
				});
			});
		}
	},
	{
		intro: '8.过河拆桥,把狩猎体验删了,留着占技能栏。',
		workFunc: function(cb2){

			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[195, 50, '职业介绍所'],
					[7, 10],
				], ()=>{
					cga.turnTo(8, 11);
					forgetskill('狩猎体验')
					cb2(true)
				});
			});
		}
	},
	{
		intro: '9.到法兰城内职业介绍所[193.51]找募集打铁工的阿黑交谈并学习锻造体验技能。',
		workFunc: function(cb2){
			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[195, 50, '职业介绍所'],
					[9, 6],
				], ()=>{
					cga.turnTo(9, 4);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(0, -1);
							cga.AsyncWaitNPCDialog(()=>{
								var skill = cga.findPlayerSkill('锻造体验');
								if(!skill){
									cb2(new Error('锻造体验学习失败！可能钱不够？'));
									return;
								}
								cb2(true);
							});
						});
					});
				});
			});
		}
	},
	{
		intro: '10.使用技能将材料合成【试炼剑】或【试练衣】，不可交易、丢地不消失、可存银行。',
		workFunc: function(cb2){
			cga.travel.falan.toStone('C', ()=>{
				var loop = () => {

					var getBestCraftableItem = () => {
						var craftSkill = cga.findPlayerSkill('锻造体验');
						if (!craftSkill)
							return null;
					
						var craftItemList = cga.GetCraftsInfo(craftSkill.index);
					
						return craftItemList.find((c) => {
							return c.name == targetname;
						});
					}

					craft_target = getBestCraftableItem();
					if (!craft_target) {
						throw new Error('无法制造 ' + targetname + ' ，可能技能有问题，技能没有学习或等级不够');
					}
			
			
					var craft = () => {
			
						//没蓝
						var playerInfo = cga.GetPlayerInfo();
						if (playerInfo.mp < craft_target.cost) {
							cga.walkList([
								[34, 89],
							], ()=>{
								cga.turnTo(36, 89);});
							return;
						}
			
						console.log('开始制造：' + craft_target.name);
			
						cga.craftItemEx({
							craftitem: craft_target.name,
							immediate: true
						}, (err, results) => {
							if (results && results.success) {
								cb2(true)
							} else {
								console.log('出错,看看是否是材料没有带全?')
								setTimeout(loop, 500);
							}
			
						});
					}
			
					craft();
			
				}
				loop()
			});
		}
	},
	{
		intro: '11.过河拆桥,把锻造体验删了,留着占技能栏。',
		workFunc: function(cb2){

			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[195, 50, '职业介绍所'],
					[7, 10],
				], ()=>{
					cga.turnTo(8, 11);
					forgetskill('锻造体验')
					cb2(true)
				});
			});
		}
	},
	{
		intro: '12.打造之后,去找冒险者旅馆好眼力的霍依，对话，交出【试炼剑】或【试练衣】，获得【武器工推荐信】或【防具工推荐信】。',
		workFunc: function(cb2){
			cga.travel.falan.toStone('E2', ()=>{
				cga.walkList([
					[238, 64, '冒险者旅馆'],
					[14, 7]
				], ()=>{
					cga.TurnTo(14, 5);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg && (dlg.message.indexOf('真好') > 0 || dlg.message.indexOf('圣拉鲁卡村') > 0)){
							cb2(true)
						}
					});
				});
			});
		}
	},
	{
		intro: '13.去圣拉鲁卡村就职。 ',
		workFunc: function(cb2){
			if(professionalInfo.tutorlocation == undefined){
				throw new error('professioninfo未登录职业导师坐标信息,请手动就职!')
			}
			cga.travel.falan.toTeleRoom(professionalInfo.tutorlocation, ()=>{
				cga.walkList(professionalInfo.tutorwalk, ()=>{
					cga.TurnTo(professionalInfo.tutorpos[0], professionalInfo.tutorpos[1]);
					cga.AsyncWaitNPCDialog(()=>{
						// 是转职
						if(transferflag){
							cga.ClickNPCDialog(0, 1);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog((err,dlg)=>{
									console.log(dlg)
									if(dlg && dlg.options == 0){
										cga.ClickNPCDialog(0, 0);
									}
								});	
							});	
						}else{
							//是就职
							cga.ClickNPCDialog(0, 0);
						}
						cga.AsyncWaitNPCDialog(()=>{
							cb2(true);
						});
					});			
				});
			});
		}
	},
	{
		intro: '14.学习制造技能。 ',
		workFunc: function(cb2){
			if(professionalInfo.tutorlocation == undefined){
				throw new error('professioninfo未登录职业导师坐标信息,请手动学习技能!')
			}
			// 学习本职得意技
			var learn = ()=>{
				// professionalInfo.teacherwalk[professionalInfo.teacherwalk.length-1]是取teacherwalk的最后一组list,用于房内寻址.
				// 注意用于cga.walkList时,外层要套一层array,不然会报错
				cga.walkList([professionalInfo.teacherwalk[professionalInfo.teacherwalk.length-1]], ()=>{
					cga.TurnTo(professionalInfo.teacherpos[0], professionalInfo.teacherpos[1]);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							setTimeout(() => {
								cga.ClickNPCDialog(0, -1);
								setTimeout(() => {
									cga.AsyncWaitNPCDialog((err, dlg)=>{
										if(dlg && dlg.message.indexOf('技能栏位') > 0){
											throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了,同时也没有可以遗忘的廉价技能,比如伐木体验')
										}else if(dlg && dlg.message.indexOf('你的钱') > 0){
											throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
										}else{
											cb2(true)
										}
									});
								}, 1500);
							}, 1000);
						});
					});
				});
			}
			if(cga.getMapInfo().name != '地下工房'){
				cga.travel.falan.toTeleRoom(professionalInfo.tutorlocation, ()=>{
					cga.walkList(professionalInfo.teacherwalk, ()=>{
						// 寻找可以遗忘的技能
						learn()
					});
				});
			}else{
				cga.walkList([professionalInfo.teacherwalk[professionalInfo.teacherwalk.length-1]], ()=>{
				// 寻找可以遗忘的技能
				learn()
				});
			}
		}
	}
	],
	[//任务阶段是否完成
		function(){//决定就职类别
			return professionalInfo != null ? true : false;
		},
		function(){//买铜
			return (cga.getItemCount('铜') >= 20 && professionalInfo != null) ? true : false;
		},
		function(){//伐木体验
			return (cga.findPlayerSkill('伐木体验') && cga.getItemCount('铜') >= 20 && professionalInfo != null) ? true : false;
		},
		function(){//打孟宗竹
			return (cga.getItemCount('孟宗竹') >= 20 && cga.getItemCount('铜') >= 20 && professionalInfo != null) ? true : false;
		},
		function(){//遗忘伐木体验
			return (cga.getItemCount('孟宗竹') >= 20 && cga.getItemCount('铜') >= 20 && !cga.findPlayerSkill('伐木体验') && professionalInfo != null) ? true : false;
		},
		function(){//狩猎体验
			return (cga.findPlayerSkill('狩猎体验') && cga.getItemCount('孟宗竹') >= 20 && cga.getItemCount('铜') >= 20 &&professionalInfo != null) ? true : false;
		},
		function(){//打鹿皮
			return (cga.getItemCount('鹿皮') >= 20 && cga.getItemCount('铜') >= 20 && cga.getItemCount('孟宗竹') >= 20 && professionalInfo != null) ? true : false;
		},
		function(){//遗忘狩猎体验
			return (cga.getItemCount('鹿皮') >= 20 && cga.getItemCount('孟宗竹') >= 20 && cga.getItemCount('铜') >= 20 && !cga.findPlayerSkill('狩猎体验') && professionalInfo != null) ? true : false;
		},
		function(){//锻造体验
			return (cga.findPlayerSkill('锻造体验')&& cga.getItemCount('铜') >= 20 && cga.getItemCount('孟宗竹') >= 20 && cga.getItemCount('鹿皮') >= 20 && professionalInfo != null) ? true : false;
		},
		function(){//试炼物品
			return ((cga.getItemCount('试炼剑') > 0 || cga.getItemCount('试炼衣') > 0) && professionalInfo != null) ? true : false;
		},
		function(){//遗忘锻造体验
			return ((cga.getItemCount('试炼剑') > 0 || cga.getItemCount('试炼衣') > 0) && !cga.findPlayerSkill('锻造体验') && professionalInfo != null) ? true : false;
		},
		function(){//推荐信
			return ((cga.getItemCount('武器工推荐信') > 0 || cga.getItemCount('防具工推荐信') > 0)  && professionalInfo != null) ? true : false;
		},
		function(){//就职
			return (professionalInfo != null && (getprofessionalInfos(cga.GetPlayerInfo().job).jobmainname == professionalInfo.jobmainname)) ? true : false;
		},
		function(){//学得意技
			return (professionalInfo != null && cga.findPlayerSkill(professionalInfo.skill)) ? true : false;
		}
	]
	);
	
	task.doTask();
});