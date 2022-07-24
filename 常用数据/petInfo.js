var cga = global.cga;
var configTable = global.configTable;

var commonPilot = (cb,path)=>{
  cga.walkList(
    path
    , cb);
}

const petInfoDict = {
	'水龙蜥': {
		id: '26f0f0c8-d8af-4348-a14c-1e4c04b0f0ad',
    realname: '水龙蜥',
    sealCardName: '封印卡（龙系）',
    sealCardLevel: 1,
		maxGrade : [36,38,34,11,6],
    cradle: {index : 15003, pos : [49, 8]},
    muster : {map : '维诺亚村' ,pos : [60, 47]},
    goToDestination: (cb) =>{
      var path = [
        [67, 46, '芙蕾雅'],
        [343, 497, '索奇亚海底洞窟 地下1楼'],
        [18, 34, 15003]
      ]
      commonPilot(cb,path)
    },
  },
    '风龙蜥': {
		id: '2adfbfe9-904a-4ae4-a034-5688e1467cce',
    realname: '风龙蜥',
    sealCardName: '封印卡（龙系）',
    sealCardLevel: 4,
		maxGrade : [35,35,31,10,9]
    },
}

var getPetCardInfo = (petName)=>{
  if (!petName){
    throw new Error('错误，请输入想查询的宠物图鉴名称')
  }
  var result = null
  var infos = cga.GetPicBooksInfo()
  if(infos){
    result = cga.GetPicBooksInfo().find(v=>v.name==petName);
  }else{
    throw new Error('cga.GetPicBooksInfo()异常，请检查')
  }
  return result;
}
module.exports.getPetInfoDict = petInfoDict
module.exports.getPetCardInfo = getPetCardInfo