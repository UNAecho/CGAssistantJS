const TransferNPCInfo = [
	{
		villageName: '圣拉鲁卡村',
		npcAroundPos1: [43, 44],
		npcAroundPos2: [43, 43],
		npcPos: [44, 43],
	}, {
		villageName: '伊尔村',
		npcAroundPos1: [43, 33],
		npcAroundPos2: [43, 32],
		npcPos: [44, 32],
	},{
		villageName: '亚留特村',
		npcAroundPos1: [43, 23],
		npcAroundPos2: [43, 22],
		npcPos: [44, 22],
	},{
		villageName: '维诺亚村',
		npcAroundPos1: [9, 22],  
		npcAroundPos2: [9, 23],
		npcPos: [8, 22],
	},{
		villageName: '奇利村',
		npcAroundPos1: [9, 33],
		npcAroundPos2: [8, 33],
		npcPos: [8, 32],
	},{
		villageName: '加纳村',
		npcAroundPos1: [9, 44],  
		npcAroundPos2: [8, 44],
		npcPos: [8, 43],
	},{
		villageName: '杰诺瓦镇',
		npcAroundPos1: [15, 4],  
		npcAroundPos2: [15, 5],
		npcPos: [16, 4],
	},{
		villageName: '蒂娜村',
		npcAroundPos1: [25, 4],
		npcAroundPos2: [25, 5],
		npcPos: [26, 4],
	},{
		villageName: '阿巴尼斯村',
		npcAroundPos1: [37, 4], 
		npcAroundPos2: [37, 5],
		npcPos: [38, 4],
	},
];

const villageNameMap = (inputmsg) => {
	let obj = {};

	Professions.forEach(p => p.villageName.forEach(t => {
		if(t == inputmsg){
			obj = p 
			// console.log('t = '+ t +' inputmsg = '+ inputmsg + '')
		}
	}));
	return obj
};

module.exports = function(inputmsg) {
	console.log('查找：【' + inputmsg + '】信息')
	var result = null
	if(inputmsg == null || inputmsg == undefined){
		return TransferNPCInfo
	}
	else{
		result = villageNameMap(inputmsg)
	}
	
	if(result == null || result ==undefined){
		throw new Error('错误,请检查输入村庄名称是否有误')
	}else if(Object.keys(result).length === 0){
		throw new Error('错误,未检测到村庄信息,请检查输入职业信息是否有误,或提交错误给作者')
	}
	// console.log('result.category = ' + result.category)
	return result;
};
