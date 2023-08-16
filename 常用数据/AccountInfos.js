/**
 * category：自定义类别
 * 每个category为一【大类】
 * user:通行证账号,String型
 * pwd：密码,String型
 * gid：object数组。数据结构参考下面举例。
 * 【注意】cga.gui.LoadAccount提供的键值对【'game':区服功能】无效（不仅无效，乱读取还会被服务器拒绝登录），不能改变服务器，所以这里设计没有加上区服的概念。
 * 影响其实也不大，毕竟不能跨星系（服务器）交易
 * 
 * AccountInfos数据结构举例：
 * 	[
	{
		category: '仓库',
		info:[
				{	user:'account1',
					pwd:'account1',
					gids: [ 
						{ gid : 'saber1', name : ['UNAの剑士','UNAの剑士2'], },
						{ gid : 'saber2', name : ['UNAの剑士3','UNAの剑士4'], },
					],
				},
				{	user:'account2',
					pwd:'account2',
					gids: [
						{ gid : 'saber3', name : ['UNAの剑士5','UNAの剑士6'], },
						{ gid : 'saber4', name : ['UNAの剑士7','UNAの剑士8'], },
						{ gid : 'saber5', name : ['UNAの剑士9',], },
					],
				},
				{	user:'account3',
					pwd:'account3',
					gids: [
						{ gid : 'saber6', name : ['UNAの剑士11','UNAの剑士12'], },
					],
				},
		],
	},	
	{
		category: '生产',
		info:[
				{	user:'',
					pwd:'',
					gids: [],
				},
				{	user:'',
					pwd:'',
					gids: [],
				},
		],
	},
]
 * 其中：
 * 1、user与pwd只能为String类型
 * 2、gids不能为空，否则账号没有意义。
 * 3、gids中的object对象，必须包含gid和name，其中name代表当前子账号的0-2名玩家。
 * 4、name可以为空数组，因为可以不建立角色，光有子账号。而gid不可为空。
 */

const AccountInfos = [
	{
		category: '仓库',
		info: [
			{
				user: '',
				pwd: '',
				gids: [],
			},
			{
				user: '',
				pwd: '',
				gids: [],
			},
			{
				user: '',
				pwd: '',
				gids: [],
			},
		],
	},
	{
		category: '生产',
		info: [
			{
				user: '',
				pwd: '',
				gids: [],
			},
			{
				user: '',
				pwd: '',
				gids: [],
			},
		],
	},

];
module.exports = AccountInfos