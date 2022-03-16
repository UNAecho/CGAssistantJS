/**
 * category：自定义类别
 * user:通行证账号
 * gid：子账号
 * pwd：密码，如果和切换前密码相同，则不填。
 */

const AccountInfos = [
	{
		category: '仓库',
		info:[
				{	user:'',
					pwd:'',
					gid: [
						
					],
				},
				{	account:'',
					pwd:'',
					gid: ['haha'],
				},
		],
	},	
	{
		category: '生产系',
		info:[
				{	user:'',
					pwd:'',
					gid: [],
				},
				{	account:'',
					pwd:'',
					gid: [],
				},
		],
	},
	
];
const propertyMap = (value) => {
	let obj = [];

	AccountInfos.forEach(a =>{
		if(a.category == value){
			obj = a.info
			// console.log('t = '+ t +' inputmsg = '+ inputmsg + '')
		}
	});
	return obj
};
/**
 * value：查找自定义属性category的值，则返回该dict
 * 如value = '仓库'，则返回属性【category】为【仓库】这个dict。
 */
module.exports = function(value) {
	console.log('获取：【' + value + '】类账号列表')
	var result = null
	
	result = propertyMap(value)
	
	if(result == null || result ==undefined){
		throw new Error('错误,请检查输入账号类信息是否有误')
	}else if(Object.keys(result).length === 0){
		throw new Error('错误,未检测到账号信息,请检查输入账号信息是否有误')
	}
	return result;
};
