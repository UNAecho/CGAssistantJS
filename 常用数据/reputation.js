/**
 * 声望信息，返回传入当前声望需要使用多少次得意技才能提升一个阶段。
 * 注意本功能是按照当前声望最小值来计算，因为没有办法获取当前确切声望值是多少。
 * 例如，当前是【呢喃的歌声】，那么脚本无视你当前多少声望，一律按照计算【呢喃的歌声】最低值【10000】到【地上的月影】最低值【20000】来计算。也就是需要使用1000次得意技（传教和咒术一次得意技10声望）
 * 
 * 特别注意：声望达到“水面上的小草”/“追求技巧的人”之前，NPC提示进度的回复均为【嗯？你的新称号？我一点兴趣都没有。】，不管你处于进度的多少百分比
 * 所以无法通过NPC获取当前声望已经达到多少百分比。
 * 这里将低于“水面上的小草”声望的上下限都手动提高，使得烧声望等脚本一次迭代去更多地获取声望，否则会出现烧了一部分发现声望没有变，误以为已经到达了声望锁而去转职。
 * 低于“追求技巧的人”的生产系称号不变，因为生产系不需要靠转职保证书来冲声望，随技能冲即可。
 */
const reputationList = [
	{
		reputation: '恶人',// index 0
		min: -4999,// 无下限，自定义为-4999
		max: -4000,// 原为-3000
	}, 
	{
		reputation: '忌讳的人',// index 1
		min: -3999,// 原为-2999
		max: -3000,// 原为-2000
	}, 
	{
		reputation: '受挫折的人',// index 2
		min: -2999,// 原为-1999
		max: -2000,// 原为-1000
	}, 
	{
		reputation: '无名的旅人',// index 3
		min: -1999,// 原为-999
		max: 1999,
	}, {
		reputation: '路旁的落叶',// index 4
		min: 2000,
		max: 4999,
	}, {
		reputation: '水面上的小草',// index 5
		min: 5000,
		max: 9999,
	},{
		// 晋级条件
		reputation: '呢喃的歌声',// index 6
		min: 10000,
		max: 19999,
	},{
		reputation: '地上的月影',// index 7
		min: 20000,
		max: 32999,
	},{
		reputation: '奔跑的春风',// index 8
		min: 33000,
		max: 49999,
	},{
		// 晋级条件
		reputation: '苍之风云',// index 9
		min: 50000,
		max: 69999,
	},{
		reputation: '摇曳的金星',// index 10
		min: 70000,
		max: 99999,
	},{
		// 晋级条件
		reputation: '欢喜的慈雨',// index 11
		min: 100000,
		max: 129999,
	},{
		reputation: '蕴含的太阳',// index 12
		min: 130000,
		max: 159999,
	},{
		// 晋级条件
		reputation: '敬畏的寂静',// index 13
		min: 160000,
		max: 199999,
	},{
		// 晋级条件
		reputation: '无尽星空',// index 14
		min: 200000,
		max: 999999,
	},
];
/**
 * 注意，【采集】、【制造】、【医师护士鉴定武修防修仙人侦探】虽然共用称号，但是需要的声望数量不同，采集声望需要最少，医师护士鉴定等声望需要最多，故使用医师护士的声望参考，以免过低。
 */
const productReputationList = [
	{
		reputation: '恶人',// index 0
		min: -1,
		max: -3000,
	}, 
	{
		reputation: '忌讳的人',// index 1
		min: -2999,
		max: -2000,
	}, 
	{
		reputation: '受挫折的人',// index 2
		min: -1999,
		max: -1000,
	}, 
	{
		reputation: '无名的旅人',// index 3
		min: -999,
		max: 1999,
	}, {
		reputation: '迈步前进者',// index 4
		min: 2000,
		max: 3999,
	}, {
		reputation: '追求技巧的人',// index 5
		min: 4000,
		max: 5999,
	},{
		reputation: '刻于新月之铭',// index 6
		min: 6000,
		max: 8999,
	},{
		reputation: '掌上的明珠',// index 7
		min: 9000,
		max: 12999,
	},{
		reputation: '敬虔的技巧',// index 8
		min: 13000,
		max: 18999,
	},{
		reputation: '踏入神的领域',// index 9
		min: 19000,
		max: 26999,
	},{
		reputation: '贤者',// index 10
		min: 27000,
		max: 36999,
	},{
		reputation: '神匠',// index 11
		min: 37000,
		max: 46999,
	},{
		reputation: '摘星的技巧',// index 12
		min: 47000,
		max: 56999,
	},{
		reputation: '万物创造者',// index 13
		min: 57000,
		max: 69999,
	},{
		reputation: '持石之贤者',// index 14
		min: 70000,
		max: 999999,
	},
];
var calculate =(inputreputation,percentage) => {
	let count = 0;
	for (let p of reputationList) {
		if(p.reputation == inputreputation){
			// 如果传入了当前声望百分比，那么就粗略按照已有百分比计算，节约时间与金钱
			if(percentage !=null && parseFloat(percentage) > 0 && parseFloat(percentage) < 1){
				count = Math.ceil((p.max - p.min) * parseFloat(1-percentage) / 10)
			}else{
				// 向上取整
				count = Math.ceil((p.max - p.min) / 10)
			}
			return count
		}
	}
	return count;
};
module.exports.reputationList = reputationList
module.exports.productReputationList = productReputationList
module.exports.skillCount = function(inputreputation,percentage) {
	var result = 0
	if(inputreputation == null){
		inputreputation ='路旁的落叶'
		console.log('inputreputation = null ,请注意称号是否有问题，现在默认从【路旁的落叶】开始刷')
		result = calculate(inputreputation,percentage)
	}else if(inputreputation == '无尽星空'){
		console.log('result返回0，都无尽星空了还刷神马。。')
		return result
	}
	else{
		result = calculate(inputreputation,percentage)
	}
	return result;
};

/**
 * 返回人物的称号信息以及称号级别，战斗或生产称号均可，从0-14级，从恶人到无尽星空，或者从恶人到持石之贤者。
 * 无论战斗还是生产，等级都是从0的恶人，到14的满称号无尽星空或者持石之贤者。
 * 返回人物是战斗系还是生产系，称号以及称号等级。
 * 其中，等级分别为6，9，11，13为全类别1-4转条件
 * 特殊：14级为战斗5转条件
 * 
 * @param {list} titles 人物的称号数组
 * @returns obj
 * 
 */
module.exports.getReputation = function(titles) {
	var result = {}
	for (let i = 0; i < 15; i++) {
		for(var t in titles){
			if(titles[t].length == 0){
				continue
			}
			if(titles[t] == reputationList[i].reputation){
				result['type'] = '战斗系'
				result['title'] = titles[t]
				result['titleLv'] = i
				return result
			}
		}
	}

	for (let i = 0; i < 15; i++) {
		for(var t in titles){
			if(titles[t].length == 0){
				continue
			}
			if(titles[t] == productReputationList[i].reputation){
				result['type'] = '生产系'
				result['title'] = titles[t]
				result['titleLv'] = i
				return result
			}
		}
	}
	return result
}

/**
 * 职业晋级的声望条件，和各系职业声望列表的的index有关
 * 如战斗系1转需要reputationList的reputationList[6]：呢喃的歌声才能晋升。
 */
module.exports.promoteReputation = {
	0 : 6 ,
	1 : 9 ,
	2 : 11 ,
	3 : 13 ,
	4 : 14 ,
	5 : 0 ,
}
