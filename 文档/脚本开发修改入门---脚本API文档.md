# 序言

CGAssistant的所有脚本使用javascript（ES6）编写，使用nodejs14作为运行环境。

如果你对javascript（下称：JS）和nodejs完全不了解，那么建议你从零开始学习：

[ES6](https://search.bilibili.com/all?keyword=ES6%E5%85%A5%E9%97%A8)

[javascript](https://search.bilibili.com/all?keyword=javascript)

[nodejs](https://search.bilibili.com/all?keyword=nodejs)

## 开发环境

建议使用[Visual Studio Code](https://code.visualstudio.com/)

## 脚本入口

js脚本入口一般是

```
var cga = require('./cgaapi')(function(){
  //这里作为真正的执行入口(1)
});
```

CGA启动脚本时，nodejs会跟游戏内建立的本地服务器（端口号可以从nodejs第[2]个参数或者环境变量CGA_GAME_PORT中获得）进行建立通信，通信建立成功才会进入回调入口(1)

进入回调(1)之后就可以开始真正调用cgaapi.js和node_cga.node中封装的所有功能了。

## 可用环境变量

`process.env.CGA_GAME_PORT` 游戏进程对外的API服务端口

`process.env.CGA_GUI_PORT` CGAssistant进程对外提供的API服务端口

`process.env.CGA_GUI_PID` CGAssistant进程的进程ID（PID）

`process.env.CGA_DIR_PATH` CGAssistant根目录的绝对路径

## 高级API

CGA的所有高级API都封装在\cgaapi.js中，开放给所有脚本进行调用。

高级API的功能介绍和用法参考cgaapi.js中的注释，这里不再详细介绍。

***

### Native API

Native API由node_cga.node导出

***

`Boolean cga.Connect(Integer port)`

同步阻塞地跟游戏建立通信连接。port是cga注入游戏的模块启动的本地服务的端口号。成功返回true，否则返回false。

***

`cga.AsyncConnect(Integer port, Function cb)`

异步地跟游戏建立通信连接，建立成功则调用`cb(null)`，失败则调用`cb(new Error('Unknown exception.'))`。port是cga注入游戏的模块启动的本地服务的端口号。

***

`Integer cga.IsInGame()`

返回是否进入游戏状态（指选完人物后登入游戏）。在游戏中返回1，否则返回0。如果与cga本地服务连接中断则抛出异常。

***

`Integer cga.GetWorldStatus()`

返回世界状态（切图时登入登出进入离开战斗均会发生改变，具体数值变化规律请自行摸索）。如果与cga本地服务连接中断则抛出异常。

***

`Integer cga.GetGameStatus()`

返回游戏状态（进入离开战斗会发生改变，具体数值变化规律请自行摸索）。如果与cga本地服务连接中断则抛出异常。

***

`Integer cga.GetBGMIndex()`

获取当前BGM（背景音乐）索引号，通常BOSS战的BGM为14。必须打开游戏音效（音量可以为0）才能获取到正确值否则永远为0。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetSysTime()`

获取游戏内部时间。如果与cga本地服务连接中断则抛出异常。

```
{
  years : Integer 年
  month : Integer 月
  days : Integer 日
  hours : Integer 小时，游戏中6点以后是早上，18点以后是晚上。
  mins : Integer 分钟
  secs : Integer 秒，游戏中1秒等于现实的6秒
  server_time : Integer 登入时服务器的unix时间戳
  local_time : Integer 登入时本机的unix时间戳
}
```

***

`object cga.GetPlayerInfo()`

获取玩家属性，返回object。如果与cga本地服务连接中断则抛出异常。

```
{
  hp : Integer 当前血量
  maxhp : Integer 最大血量
  mp : Integer 当前蓝量
  maxmp : Integer 最大蓝量
  xp : Integer 当前总经验值
  maxxp : Integer 升级所需总经验值
  level : Integer 级别
  health : Integer 健康度，0为绿色，100为红色
  souls : Integer 掉魂数，0~5
  gold : Integer 金币
  score: Integer 战绩
  skillslots: Integer 技能栏数量 10~15
  use_title: Integer 当前使用的特殊称号index，从titles[]里找对应称号的中文名
  unitid : Integer 单位ID
  petid : Integer 当前战斗的宠物ID，0~4或-1
  direction : Integer 面朝方向，0~7
  punchclock : Integer 卡时
  usingpunchclock : Boolean 是否已打卡
  petriding : Boolean 是否在骑宠
  name : String 玩家名称
  job : String 职业
  nick : String 玩家称号
  titles : Array(String) 称号（注意：该数组中某些索引处可能包含空字符串，表明该索引处的称号可能曾被删除！）
  persdesc : {
    sell_icon : 卖（图标id） Integer
    sell_string : 卖（文本） String
    buy_icon : 买（图标id） Integer
    buy_string : 买（文本） String
    want_icon : 想要（图标id） Integer
    want_string : 想要（文本） String
    desc_string : 个人简介 String
  }
  detail : {
    points_remain : 属性点：剩余点数
    points_endurance : 属性点：血
    points_strength : 属性点：攻
    points_defense : 属性点：防
    points_agility: 属性点：敏
    points_magical: 属性点：魔
    value_attack: 面板属性：攻击力
    value_defensive: 面板属性：防御力
    value_agility: 面板属性：敏捷
    value_spirit: 面板属性：精神
    value_recovery: 面板属性：恢复
    resist_poison: 面板抗性：抗毒
    resist_sleep: 面板抗性：抗睡
    resist_medusa: 面板抗性：抗石化
    resist_chaos: 面板抗性：抗混乱
    resist_forget: 面板抗性：抗遗忘
    fix_critical: 面板修正：必杀
    fix_strikeback: 面板修正：反击
    fix_accurancy: 面板修正：命中
    fix_dodge: 面板修正：闪避
    element_earth: 元素属性：地
    element_water: 元素属性：水
    element_fire: 元素属性：火
    element_wind: 元素属性：风
    manu_endurance : 生产系：耐力
    manu_skillful: 生产系：技巧
    manu_intelligence: 生产系：智力
    value_charisma : 魅力
  }
}
```

***

`Array(object) cga.GetTeamPlayerInfo()`

获取队友玩家信息，返回Array(object)。如果与cga本地服务连接中断则抛出异常。
```
{
  unit_id : Integer 队友的单位ID
  hp : Integer 队友的当前血量
  maxhp : Integer 队友的最大血量
  mp : Integer 队友的当前蓝量
  maxmp : Integer 队友的最大蓝量
  xpos : Integer 队友的当前X坐标
  ypos : Integer 队友的当前Y坐标
  name : String 队友的名称
}
```

***

`cga.SetPlayerFlagEnabled(Integer index, Boolean enable)`

开启关闭左上角面板的开关。如果与cga本地服务连接中断则抛出异常。

index可选项：

```
cga.ENABLE_FLAG_PK = 0 PK开关
cga.ENABLE_FLAG_TEAMCHAT = 1 队聊开关
cga.ENABLE_FLAG_JOINTEAM = 2 组队开关
cga.ENABLE_FLAG_CARD = 3 换片开关
cga.ENABLE_FLAG_TRADE = 4 交易开关
cga.ENABLE_FLAG_FAMILY = 5 家族开关
```

enable=true为开启，false为关闭

***

`cga.EnableFlags(Integer index, Boolean enable)`

效果同cga.SetPlayerFlagEnabled，区别在于cga.EnableFlags是直接发包修改开关状态而cga.SetPlayerFlagEnabled是模拟点击开关。如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.IsPlayerFlagEnabled(Integer index)`

获取左上角面板的开关状态，返回true为开启，false为关闭。如果与cga本地服务连接中断则抛出异常。

index可选项：

```
cga.ENABLE_FLAG_PK = 0 PK开关
cga.ENABLE_FLAG_TEAMCHAT = 1 队聊开关
cga.ENABLE_FLAG_JOINTEAM = 2 组队开关
cga.ENABLE_FLAG_CARD = 3 换片开关
cga.ENABLE_FLAG_TRADE = 4 交易开关
cga.ENABLE_FLAG_FAMILY = 5 家族开关

cga.ENABLE_FLAG_AVATAR_PUBLIC = 100 是否公开个人简介资料（使用该API修改并不会刷新界面，实际上是修改成功的）
cga.ENABLE_FLAG_BATTLE_POSITION = 101 人物战斗位置（前排后排）true为前排
```

***

`Boolean cga.IsSkillValid(Integer index)`

判断index号技能栏是否有有效技能，注意技能index不等同于技能在技能栏界面中的顺序，界面顺序是可以手动调整的，而技能index一旦学习就定死了不会改变。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetSkillInfo(Integer index)`

获取index号技能栏的技能。如果与cga本地服务连接中断则抛出异常。

```
{
  name : String 技能名
  lv : Integer 当前技能等级
  maxlv: Integer 最高技能等级
  xp : Integer 当前总技能经验
  maxxp : Integer 升级所需总技能经验
  skill_id : Integer 技能内部ID
  type : Integer 技能类型
  pos : Integer 技能面板顺序
  index : Integer 跟输入参数index一致
  slotsize : Integer 占用技能栏数量，生产系技能一般大于1
}
```

***

`Array(object) cga.GetSkillsInfo()`

获取所有技能，数组成员格式见cga.GetSkillInfo。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetSubSkillInfo(Integer index, Integer level)`

获取index号技能的某一级技能详细信息。如果与cga本地服务连接中断则抛出异常。

```
{
  name : String 技能名
  info : String 技能介绍
  level : Integer 和输入参数level一致
  cost : Integer 耗蓝（注意：这里无法正确获得制造类技能的耗蓝，制造类的具体耗蓝请参考cga.GetCraftInfo）
  flags : Integer 标记技能有哪些特性，具体作用自己摸索
  available : Boolean 当前是否可用
}
```

***

`Array(object) cga.GetSubSkillsInfo(Integer index)`

获取index号技能的1\~10级技能详细信息，数组成员格式见cga.GetSubSkillInfo。如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.IsItemValid(Integer index)`

判断index号物品栏是否有物品，index为0\~7代表身上装备，8\~39代表背包，100\~179代表银行（访问银行物品前必须先与银行柜员对话后才能获取到数据）。如果与cga本地服务连接中断则抛出异常。

//[0] = 帽子
//[1] = 衣服
//[2] = 右手武器
//[3] = 左手武器
//[4] = 鞋子
//[5] = 饰品 1
//[6] = 饰品 2
//[7] = 水晶

***

`object cga.GetItemInfo(Integer index)`

获取第index格物品的信息，index支持0\~39和100\~179，访问银行物品前必须先与银行柜员对话后才能获取到数据。如果与cga本地服务连接中断则抛出异常。

```
{
  name : 物品名
  attr : 物品名下面显示的物品属性
  info : 右键显示的物品介绍
  count : 堆叠数量
  itemid : 物品ID
  pos : 所在格子
  level : 物品等级
  type : 物品类型
  assessed : 是否已鉴定
}
```

***

`Array(object) cga.GetItemsInfo()`

获取身上和背包中的所有物品的信息，数组成员格式见cga.GetItemInfo。如果与cga本地服务连接中断则抛出异常。

***

`Array(object) cga.GetBankItemsInfo()`

获取银行中的所有物品的信息，数组成员格式见cga.GetItemInfo，必须先与银行柜员对话才能获取到数据。如果与cga本地服务连接中断则抛出异常。

***

`Integer cga.GetBankGold()`

获取银行中金钱数量，必须先与银行柜员对话才能获取到数据。如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.IsPetValid(Integer index)`

判断index号宠物栏是否有宠物，index有效值为0\~4（代表身上）或100\~104（代表银行中）。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetPetInfo(Integer index)`

获取宠物栏第index(0\~4)格或银行第index(100\~104)格宠物的信息。如果与cga本地服务连接中断则抛出异常。

```
{
  name : String 宠物名
  realname : String 宠物原始名称
  level : Integer 等级
  race : Integer 种族，0=人形系，1=龙系，2=不死系，3=飞行系，4=昆虫系，5=植物系，6=野兽系，7=特殊系，8=金属系，9=邪魔系
  loyality : Integer 忠诚度
  skillslots: Integer 技能栏数量
  health : Integer 健康度，0为绿色，100为红色
  hp : Integer 当前血量
  maxhp : Integer 最大血量
  mp : Integer 当前蓝量
  maxmp : Integer 最大蓝量
  xp : Integer 当前总经验值
  maxxp : Integer 升级所需总经验值
  flags : 作用暂时不明
  state : 状态，1为待命，2为战斗，3为休息，二进制位包含16为骑宠（2|16 = 18时代表战斗+骑宠，1|16 = 17时代表待命+骑宠，休息与骑宠冲突所以不存在3|16）
  battle_flags : 除骑宠外完全等同于state，也就是只有1为待命，2为战斗，3为休息三种状态
  index : 所在格子，等于输入参数index
  detail : 参考cga.GetPlayerInfo中的detail
}
```

***

`Array(object) cga.GetCardsInfo()`

获取名片中所有的好友信息，数组成员格式如下：

```
{
  name : String 好友名字
  title : String 称号
  level : Integer 等级
  avatar : Integer 头像
  server : Integer 所在线路，0为离线
  index : Integer 序号
}
```

如果与cga本地服务连接中断则抛出异常。

`Array(object) cga.GetPicBooksInfo()`

获取所有已解锁的图鉴信息，数组成员格式如下：

```
{
  name : String 图鉴上记录的魔物名
  can_catch: Integer 是否可捕获，0=不可捕捉，1=可以捕捉
  card_type : Integer 使用卡片需求，0=无，1=必须银卡，2=必须金卡
  race : Integer 种族
  index : Integer 序号
  image_id : Integer 图像id
  rate_endurance : Integer 体力（星级评级），0=半颗星，3=2颗星，5=3颗星，9=5颗星
  rate_strength : Integer 力量（星级评级）
  rate_defense : Integer 强度（星级评级）
  rate_agility : Integer 敏捷（星级评级）
  rate_magical : Integer 魔法（星级评级）
  element_earth : Integer 地属性
  element_water : Integer 水属性
  element_fire : Integer 火属性
  element_wind : Integer 风属性
  skill_slots : Integer 技能栏数量
}
```

如果与cga本地服务连接中断则抛出异常。


***

`Array(object) cga.GetPetsInfo()`

获取身上所有宠物的信息，数组成员格式见cga.GetPetInfo。如果与cga本地服务连接中断则抛出异常。

***

`Array(object) cga.GetBankPetsInfo()`

获取银行中所有宠物的信息，数组成员格式见cga.GetPetInfo，如返回结果中缺少某些条目说明该条目本来就不保存在银行的数据结构中。如果与cga本地服务连接中断则抛出异常。

必须先与银行柜员对话一次之后才能获取到数据。

***

`Boolean cga.IsPetSkillValid(Integer index, Integer skill_index)`

判断index(0\~4，100\~104)号宠物栏的宠物的第skill_index(0\~9)号技能是否存在。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetPetSkillInfo(Integer index, Integer skill_index)`

获取index(0\~4，100\~104)号宠物栏的宠物的第skill_index(0\~9)号技能。如果与cga本地服务连接中断则抛出异常。

```
{
  name : String 技能名
  info : String 技能说明
  cost : Integer 耗蓝
  flags : Integer 标记，表明技能有哪些特性，具体自己摸索
  index : Integer 所在技能格子，等于输入参数skill_index
}
```

***

`Array(object) cga.GetPetSkillsInfo(Integer index)`

获取index(0\~4，100\~104)号宠物栏的宠物的所有技能的信息，数组成员格式见cga.GetPetSkillsInfo。如果与cga本地服务连接中断则抛出异常。

***

`object cga.GetMapXY()`

获取当前所在XY坐标。如果与cga本地服务连接中断则抛出异常。

```
{
  x : Integer X坐标
  y : Integer Y坐标
}

```

***

`object cga.GetMapXYFloat()`

获取当前所在XY坐标（浮点格式），如果等于整数则表明完全静止于某一格上，否则处于走动过程中。如果与cga本地服务连接中断则抛出异常。

```
{
  x : Float(number) X坐标
  y : Float(number) Y坐标
}
```

***

`object cga.GetMapIndex()`

获取当前所在地图的索引号。如果与cga本地服务连接中断则抛出异常。

```
{
  index1 : Integer 地图大索引号，一般都是0
  index2 : Integer 几线
  index3 : Integer 地图索引号
}
```

***

`object cga.GetMoveSpeed()`

获取当前在X和Y方向上的移动速度。如果与cga本地服务连接中断则抛出异常。

```
{
  x : Float(number) X方向上的移动速度
  y : Float(number) Y方向上的移动速度
}
```

***

`String cga.GetMapName()`

获取当前地图名。如果与cga本地服务连接中断则抛出异常。

***

`Array(object) cga.GetMapUnits()`

获取当前地图中所有的可变单位（如NPC、其他玩家、宝箱、地上的物品等）。如果与cga本地服务连接中断则抛出异常。

```
{
  valid : Integer 该单位是否有效
  type : Integer 单位类型
  model_id : Integer 单位模型id（图像id）
  unit_id : Integer 单位在该地图上的运行时id
  xpos : Integer 单位所在X坐标
  ypos : Integer 单位所在Y坐标
  item_count : Integer 单位所处位置的物品堆叠数量
  injury : Integer 单位头上图标，受伤的拐杖图标为1，其他生产系图标为2，可以同时拥有多种图标，其他图标请自行测试
  icon : Integer 单位头上的生产系图标类型，9为制造、13为打针，其他类型请自行测试
  level : Integer 单位等级
  flags : Integer 单位标记，按位与或进行判断，flags & 256=玩家，flags & 1024=宝箱，flags & 4096=NPC，其他flags请自行摸索
  unit_name : String 单位名称
  nick_name : String 玩家昵称
  title_name : String 玩家称号
  item_name : String 物品名称
}
```

***

`object cga.GetMapCollisionTableRaw(Boolean load_all)`

获取当前地图中的原始格式地形碰撞数据，load_all为true时加载整张地图，否则只加载附近的51x51区域。如果与cga本地服务连接中断则抛出异常。

该数据未经过处理所以包含了一些图形信息比如黑龙沼泽上楼的楼梯为0x2EE2，下楼的楼梯为0x2EE0，而cga.GetMapCollisionTable获取到的纯碰撞数据则无法分辨上下楼楼梯，只能分辨地形是否有碰撞、是否有楼梯。

```
{
  x_bottom : Integer X起始坐标，load_all为true时为0
  y_bottom : Integer Y起始坐标，load_all为true时为0
  x_size : Integer X方向上的地图大小，load_all为true时为整张地图的大小
  y_size : Integer Y方向上的地图大小，load_all为true时为整张地图的大小
  cell : Array(Integer) 原始地形碰撞数据数组，大小为(x_size) x (y_size)
}
```

***

`object cga.GetMapCollisionTable(Boolean load_all)`

获取当前地图中的经游戏处理过的格式地形碰撞数据，load_all为true时加载整张地图，否则只加载附近的51x51区域。如果与cga本地服务连接中断则抛出异常。

cell中的某个格子为1代表该格子为无法通行，为0则是可通行。

```
{
  x_bottom : Integer X起始坐标，load_all为true时为0
  y_bottom : Integer Y起始坐标，load_all为true时为0
  x_size : Integer X方向上的地图大小，load_all为true时为整张地图的大小
  y_size : Integer Y方向上的地图大小，load_all为true时为整张地图的大小
  cell : Array(Integer) 地形碰撞数据数组，大小为(x_size) x (y_size)
}
```

***

`object cga.GetMapObjectTable(Boolean load_all)`

获取当前地图中的对象数据，load_all为true时加载整张地图，否则只加载附近的51x51区域。如果与cga本地服务连接中断则抛出异常。

cell中的某个格子的值需要0xFF后进行判断

(cell & 0xFF) == 3为传送石或楼梯，其他数值请自行摸索。

```
{
  x_bottom : Integer X起始坐标，load_all为true时为0
  y_bottom : Integer Y起始坐标，load_all为true时为0
  x_size : Integer X方向上的地图大小，load_all为true时为整张地图的大小
  y_size : Integer Y方向上的地图大小，load_all为true时为整张地图的大小
  cell : Array(Integer) 对象数组，大小为(x_size) x (y_size)
}
```

***

`object cga.GetMapTileTable(Boolean load_all)`

获取当前地图中的地形图像数据，load_all为true时加载整张地图，否则只加载附近的51x51区域。如果与cga本地服务连接中断则抛出异常。

```
{
  x_bottom : Integer X起始坐标，load_all为true时为0
  y_bottom : Integer Y起始坐标，load_all为true时为0
  x_size : Integer X方向上的地图大小，load_all为true时为整张地图的大小
  y_size : Integer Y方向上的地图大小，load_all为true时为整张地图的大小
  cell : Array(Integer) 地形图像数据数组，大小为(x_size) x (y_size)
}
```

***

`cga.RequestDownloadMap(Integer xbottom, Integer ybottom, Integer xsize, Integer ysize)`

请求下载当前地图的以(xbottom, ybottom)为起始点，大小(xsize, ysize)的矩形区域。

下载的区域大于51x51有被服务器拒绝的可能。

需要配合cga.AsyncWaitDownloadMap使用。

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitDownloadMap(Function cb, Integer timeout (default = 3000))`

异步等待下载地图，下载完一部分时会回调
```
cb(null, {
  index1 : Integer 地图大索引号
  index3 : Integer 地图索引号
  xbase : Integer 下载区域的X起始坐标
  ybase : Integer 下载区域的Y起始坐标
  xtop : Integer 下载区域的X最大坐标
  ytop : Integer 下载区域的Y最大坐标
})
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`cga.WalkTo(Integer x, Integer y)`

走到坐标x、y处（相当于鼠标左键点击(x、y)处，不会绕过障碍物）。如果与cga本地服务连接中断则抛出异常。

***

`cga.TurnTo(Integer x, Integer y)`

右键点击坐标x、y处（可以捡起物品、触发NPC对话、改变面向方向等）。如果与cga本地服务连接中断则抛出异常。

***

`cga.ForceMove(Integer dir, Boolean visible)`

强制往dir(0\~7依次代表正东、东南、正南、西南、正西、西北、正北、东北)方向移动1格，visible为0时只发送走路数据包不改变人物在画面中的位置，visible为1时会改变人物在画面中的位置。

***

`cga.ForceMoveTo(Integer x, Integer y, Boolean visible)`

效果同cga.ForceMove，只是朝向(x,y)的坐标的方向移动1格。

***

`Boolean cga.IsMapCellPassable(Integer x, Integer y)`

查询(x,y)处地形是否可通过，效率比cga.GetMapCollisionTable获取整个地形碰撞表更高，但是只能查询附近51x51格的数据。

***

`cga.AsyncWalkTo(Integer x, Integer y, String mapname or Integer mapindex or null, Integer desired_x or null, Integer desired_x or null, Function cb)`

异步走向(x,y)处

如果第三个参数为`String mapname`，则在地图切换为mapname后触发成功回调`cb(null)`

如果第三个参数为`Integer mapindex`，则在地图切换为index3=mapindex后触发成功回调`cb(null)`

注意：只有第三个参数为String 或Integer的情况下踩上传送门、楼梯时才会发生传送

如果第四、五个参数为`Integer desired_x, Integer desired_y`，则在同一张地图之间跃迁到(desired_x, desired_y)时就触发成功回调`cb(null)`

（如辛希亚探索指挥部的楼梯就是在同一张地图的几个坐标之间跃迁）

失败则回调

`cb(new Error('Unknown exception.'), Integer errorCode )`

errorCode 为内部错误原因

特别地，如果因为触发战斗打断了走路过程，则回调

`cb(new Error('Battle status.'), 2)`

如果因为在某个地方卡住30秒以上，则回调

`cb(new Error('Stucked for over 30s.'), 3)`

如果因为发生了地图切换，且切换的地图不符合第三个参数描述的地图名或地图索引号，则回调

`cb(new Error('Unexcepted map changed.'), 4)`

如果因为发生了坐标回滚（如吃了深蓝之后遇敌），则回调

`cb(new Error('Position are syncronized by server.'), 5)`

***

`cga.AsyncWaitMovement(object arg, Function cb)`

异步等待玩家到达指定地点，一般用于和NPC对话后等待被传送

```
arg = {
  map : (optional) Array() [String mapname1, Integer mapindex2, ...] 或 String mapname 或 Integer mapindex,
  x : (optional) Integer 目的地X坐标,
  y : (optional) Integer 目的地Y坐标,
  delay : Integer 至少延迟多久(毫秒)后才能回调cb（防止因为网络延迟导致没有立即被传送却触发了回调从而影响后续流程）,
  timeout : Integer 超时时间(毫秒)，超时后强制回调cb
}
```

失败则回调

`cb(new Error('Unknown exception.'), Integer errorCode )`

errorCode 为内部错误原因

特别地，如果因为触发战斗打断了等待过程，则回调

`cb(new Error('Battle status.'), 2)`

如果等待超过arg.timeout指定的时间还没有到达目的地，则回调

`cb(new Error('Async callback timeout.'), 3)`

如果因为发生了坐标回滚（如吃了深蓝之后遇敌），则回调

`cb(new Error('Position are syncronized by server.'), 5)`

举例：
```
cga.AsyncWaitMovement({
  map : ['艾尔莎岛'], delay : 1000, timeout : 5000
}, (err)=>{
  if(!err)
    console.log('到达艾尔莎岛!');
  else
    console.error(err);
});
```

在5秒内到达艾尔莎岛之后就会显示：到达艾尔莎岛!

否则就会打印错误原因

***

`cga.LogBack()`

登出回城

注意：连续多次调用可能导致人物卡在登入点并且无法跟任何NPC对话从而导致脚本卡住，解决方法是登出服务器后再进。

注意：切屏状态下调用无效，必须在完全进入战斗(worldstatus==10 && gamestatus==4)或完全离开战斗(worldstatus==10 && gamestatus==3)后才可调用。

如果与cga本地服务连接中断则抛出异常。

***

`cga.LogOut()`

登出服务器。如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.DropPet(Integer index)`

丢弃index号宠物栏的宠物，丢弃成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.ChangePetState(Integer index, Integer state)`

修改index号宠物栏的宠物的状态，修改成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

state=1为待命，2为战斗，3为休息，二进制位包含16为骑宠（2|16 = 18时代表战斗+骑宠，1|16 = 17时代表待命+骑宠，休息与骑宠冲突所以不存在3|16）

***

`cga.PlayGesture(Integer index)`

播放某个动作（表情），index允许的值是0\~17。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.DeleteCard(Integer index, Boolean packetonly (optional) )`

删除index位置的名片，index允许范围为0\~59，可以从`cga.GetCardsInfo()`获得名片信息对应的index。

packetonly默认为false。如果packetonly为true则只向服务器发送删除名片的请求而不更新UI。

如果与cga本地服务连接中断则抛出异常。

如果index位置不存在名片信息，则返回false，否则返回true。

***

`Boolean cga.SendMail(Integer index, String msg)`

给index位置的名片的好友发送邮件，index允许范围为0\~59。

可以从`cga.GetCardsInfo()`获得名片信息对应的index。

msg最大支持1023个字符

如果与cga本地服务连接中断则抛出异常。

如果index位置不存在名片信息，则返回false，否则返回true。

***

`Boolean cga.SendPetMail(Integer index, Integer petid, Integer itempos, String msg)`

给index位置的名片的好友发送宠物邮件，index允许范围为0\~59，使用petid位置的宠物，发送itempos(0\~19)位置的物品。

可以从`cga.GetCardsInfo()`获得名片信息对应的index。

msg最大支持599个字符

如果与cga本地服务连接中断则抛出异常。

如果index位置不存在名片信息，或不存在petid的宠物，或不存在itempos的物品，则返回false，否则返回true。

***

`Boolean cga.DropItem(Integer index)`

丢弃index号物品栏的物品，丢弃成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.UseItem(Integer index)`

使用index号物品栏的物品（相当于双击该物品），使用成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

只能使用0~39号物品，不能直接使用银行里的物品。

***

`Boolean cga.MoveItem(Integer srcindex, Integer dstindex, Integer count)`

将srcindex号(0\~39, 100\~179)物品栏的物品移动到dstindex(0\~39, 100\~179)号位置，转移数量count个(count=-1代表整一组物品全部转移)，转移成功返回true，否则返回false。如果与cga本地服务连接中断则抛出异常。

存取银行必须站在柜员面前并跟柜员对话一次。

***

`Boolean cga.MovePet(Integer srcindex, Integer dstindex)`

将srcindex号(0\~4, 100\~104)宠物栏的宠物移动到dstindex(0\~4, 100\~104)号位置，0\~4代表身上，100\~104代表银行。转移成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

存取银行必须站在柜员面前并跟柜员对话一次。

***

`Boolean cga.MoveGold(Integer gold, Integer opt)`

当opt为`cga.MOVE_GOLD_TOBANK = 1`时：将gold数量的金币存到银行

当opt为`cga.MOVE_GOLD_FROMBANK = 2`时：从银行取出gold数量的金币

当opt为`cga.MOVE_GOLD_DROP = 3`时：将gold数量的金币丢到地上

如果与cga本地服务连接中断则抛出异常。

存取银行必须站在柜员面前并跟柜员对话一次。

***

`cga.AsyncWaitPlayerMenu(Function cb, Integer timeout (default = 3000))`

异步等待弹出玩家选择对话框（使用物品、使用治疗技能、组队）
```
cb(null,
  Array({
    name : String 玩家名称
    color : Integer 颜色索引号
    index : Integer 玩家在对话框列表中的序号
  })
)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`cga.AsyncWaitUnitMenu(Function cb, Integer timeout (default = 3000))`

异步等待弹出玩家单位选择对话框（使用物品、使用治疗技能的第二个对话框，用于选择某个玩家身上的人或宠物）
```
cb(null,
  Array({
    name : String 单位名称
    level : Integer 等级
    health : Integer 健康度(0=绿色，100等于=红色)
    hp : Integer 当前血量
    maxhp : Integer 最大血量
    mp : Integer 当前蓝量
    maxmp : Integer 最大蓝量,
    color : Integer 颜色索引号
    index : Integer 玩家在对话框列表中的序号
  })
)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`Boolean cga.PlayerMenuSelect(Integer index, String menustring (optional) )`

选中玩家选择对话框（使用物品、使用治疗技能、组队）中的某一行玩家。

真正传递给服务器的是index，menustring只在客户端对话框中作显示用，如果交易时传递的menustring是空字符串那么你在交易对话框中看到的对方名称就是空字符串。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.UnitMenuSelect(Integer index)`

选中玩家单位选择对话框（使用物品、使用治疗技能的第二个对话框）中的某一行单位。

如果与cga本地服务连接中断则抛出异常。

***

`cga.UpgradePlayer(Integer attr)`

升级人物的属性点。

attr：体力=0，力量=1，防御=2，敏捷=3，魔法=4

如果与cga本地服务连接中断则抛出异常。

***

`cga.UpgradePet(Integer petid, Integer attr)`

升级petid(0~4)位置的宠物的属性点。

attr：体力=0，力量=1，防御=2，敏捷=3，魔法=4

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitNPCDialog(Function cb, Integer timeout (default = 3000))`

异步等待弹出NPC对话框

```
cb(null,
  {
    type : Integer 对话框类型
    options : Integer 对话框按钮可选项，按位参与与或计算，1=确定，2=取消，4=是，8=否，16=上一步，32=下一步，比如（4|8=12表示存在是和否两个按钮）
    dialog_id : Integer 对话框id
    npc_id : Integer NPC ID
    message : String 消息体
  }
)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`Boolean cga.ClickNPCDialog(Integer option, Integer index)`

进行NPC对话时按下某个按钮或选中某一列表。

对于按钮型对话框：option决定了按下的按钮

如果有取消按钮则option=-1代表取消

1=确定，2=取消，4=是，8=否，16=上一步，32=下一步

对于列表型对话框，index决定了选中的列表项

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.SellNPCStore(Array(object) items)`

向NPC出售物品，必须在向NPC出售的页面才有效。

如果不在出售页面，则返回失败，

如果背包中的物品不满足参数中填写的需求，则返回失败，

否则返回成功。

```
items=Array({
  itemid : Integer 出售的物品id
  itempos : Integer 出售的物品在背包中的位置(8\~39)
  count : Integer 出售的数量，如果出售一整组物品应该填写最大堆叠数量，比如出售整组鹿皮应该填写40
}, ...)
```

特别地，如果是坎村过海隧道的NPC提交材料的页面，则应当如下填写参数

```
cga.SellNPCStore(
[{
  itempos : 不论是矿还是黄月木，均填写1
  count : 需求的材料数量，一般是200，如果已经有其他人提交过小于200个材料，则只需要提交剩下的数量
}]
)
```

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.BuyNPCStore(Array(object) items)`

从NPC处购买物品，必须在NPC购买页面才有效。

```
items=Array({
  index : Integer 购买的物品所在的序号
  count : Integer 购买的数量，可以填写超过一整组
}, ...)
```

如果不在购买页面则返回失败，否则返回成功。

如果与cga本地服务连接中断则抛出异常。

***

`cga.SayWords(String words, Integer color, Integer range, Integer size)`

喊话。

words表示喊话内容，建议不要超过127个中文字符或255个英文字符，否则有可能被强制截断。

color表示喊话的颜色，有效值：0=白色#FFFFFF，1=青色#00FFFF，2=紫色#FF00FF，3=深蓝#0000FF，4和5=亮绿#00FF00，6=红色#FF0000，7=灰色#A0A0A4，8=淡蓝#A6CAF0，9=	深海洋绿#C0DCC0

range表示喊话范围，有效值：0=关，1\~5=1\~5格子，6=交易，7=全图

size表示字体大小，有效值：0=中，1=小，2=大

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitWorkingResult(Function cb, Integer timeout (default = 3000))`

异步等待制造、采集、鉴定、治疗（生产系技能）的结果

```
cb(null,
  {
    type : Integer 技能类型，1=制造，2=鉴定，3=治疗，4=采集
    success : Boolean 是否成功
    levelup : Boolean 是否升级
    xp : Integer 本次技能获得的技能经验
    endurance : Integer 本次技能获得的耐力
    skillful : Integer 本次技能获得的技巧
    intelligence : Integer 本次技能获得的智力

    特别地，如果type=4则有
      imgid : Integer 采集的物品的图像id
      count : Integer 采集的物品的数量（双百厨师可能一次制造出两份）
      itemname : String 采集的物品的名称

    特别地，如果type=3则有
      status : Integer 治疗后的状态

    特别地，如果type=1则有
      itemname : String 制造出的物品的名称

  }
)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`cga.SetImmediateDoneWork(Boolean enable)`

开启、关闭立即制造/鉴定。

进入服务器后第一次制造/鉴定必须以正常速度进行，否则会掉线。如果是第一次制造那么设置enable=true也会被强制等待正常的制造时间。

***

`Integer cga.GetImmediateDoneWorkState()`

获取立即制造/鉴定的状态，0=未开启，1=开启但还未进行第一次正常速度的制造/鉴定，2=高速制造鉴定已可用。

***

`Boolean cga.StartWork(Integer index, Integer sub_index)`

使用index号技能进行制造、治疗、鉴定、采集、骑宠。

index和技能在游戏中的技能面板中的顺序无关，只和cga.GetSkill(s)Info返回的数据中的index有关系

sub_index是制造技能的二级列表的序号，非制造技能请填写0。

***

`Boolean cga.CraftItem(Integer index, Integer sub_index, Integer sub_type, Array(Integer) material_items )`

制造index号技能中的sub_index号物品。material_items 是制造需要的原材料物品在背包中的位置数组。

***

`Boolean cga.AssessItem(Integer index, Integer itempos )`

鉴定物品。使用index号技能（该技能必须为鉴定）。itempos 是需要鉴定的物品在背包中的位置(8/~39)。

***

`object cga.GetCraftInfo(Integer index, Integer sub_index)`

获取index号制造技能的sub_index物品的制造信息。如果与cga本地服务连接中断则抛出异常。

```
{
  name : 物品名
  info : 物品介绍
  itemid : 物品ID
  level : 物品等级
  cost : 耗蓝
  id ：技能内部id
  index : 等同于sub_index
  available : 是否可以制造
  materials : Array(object) 原材料
  [ {
     name : String 原材料名称
     itemid : Integer 原材料物品id
     count : Integer 需要原材料数量
  }, ... ]
}
```

***

`object cga.GetCraftsInfo(Integer index)`

获取index号制造技能的所有物品的制造信息。如果与cga本地服务连接中断则抛出异常。

制造信息的格式参考`cga.GetCraftInfo`

***

`Integer cga.GetCraftStatus()`

获取当前制造状态。0=打开制造界面，1=制造中，2=制造完成，4=修理中或鉴定中。

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitChatMsg(Function cb, Integer timeout (default = 3000))`

异步等待聊天消息

```
cb(null,
  {
    unitid: Integer 发送者的单位id，-1为系统消息
    msg : String 消息体
    color : Integer 消息颜色
    size : Integer 消息文字大小
  }
)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`Boolean cga.DoRequest(Integer request)`

向面向玩家发起请求。

request有效值如下：
```
cga.REQUEST_TYPE_PK = 1; 发起PK
cga.REQUEST_TYPE_JOINTEAM = 3; 请求组队
cga.REQUEST_TYPE_EXCAHNGECARD = 4; 请求换片
cga.REQUEST_TYPE_TRADE = 5; 请求交易
cga.REQUEST_TYPE_KICKTEAM = 11; 踢出队伍
cga.REQUEST_TYPE_LEAVETEAM = 12; 离开队伍
cga.REQUEST_TYPE_TRADE_CONFIRM = 13; 确认交易
cga.REQUEST_TYPE_TRADE_REFUSE = 14; 拒绝交易
cga.REQUEST_TYPE_REBIRTH_ON = 16; 开启精灵变身（制造系带精变水晶）
cga.REQUEST_TYPE_REBIRTH_OFF = 17; 关闭精灵变身（制造系带精变水晶）
```

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.TradeAddStuffs(Array(object) items, Array(Integer) pets, Integer gold)`

交易时取出物品、宠物、金币。

items=Array({
  itemid : Integer 要交易的物品id
  itempos : Integer 要交易的物品在背包中的位置(8\~39)
  count : Integer 要交易的物品数量
}, ...)

pets=Array(Integer) 要交易的宠物在宠物栏中的位置0\~4

gold=要交易的金币

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitTradeStuffs(Function cb, Integer timeout (default = 3000))`

异步等待对方取出交易物品、宠物、金币

对方取出物品则回调：

```
cb(null, 1, 
  Array({
    name : 物品名
    attr : 物品属性
    count : 堆叠数量
    itemid : 物品ID
    pos : 所在格子
    level : 物品等级
    type : 物品类型
  }, ...)
)
```

对方取出宠物则回调：

```
cb(null, 2, 
  {
    index : Integer 宠物在交易列表中的索引号
    name : String 宠物名
    realname : String 宠物原始名称
    level : Integer 等级
    race : Integer 种族
    loyality : Integer 忠诚度
    maxhp : Integer 最大血量
    maxmp : Integer 最大蓝量
    skill_count : Integer 技能栏数量
    image_id : Integer 图像id
    detail : {
      points_remain : 属性点：剩余点数
      points_endurance : 属性点：血
      points_strength : 属性点：攻
      points_defense : 属性点：防
      points_agility: 属性点：敏
      points_magical: 属性点：魔
      value_attack: 面板属性：攻击力
      value_defensive: 面板属性：防御力
      value_agility: 面板属性：敏捷
      value_spirit: 面板属性：精神
      value_recovery: 面板属性：恢复
      resist_poison: 面板抗性：抗毒
      resist_sleep: 面板抗性：抗睡
      resist_medusa: 面板抗性：抗石化
      resist_chaos: 面板抗性：抗混乱
      resist_forget: 面板抗性：抗遗忘
      fix_critical: 面板修正：必杀
      fix_strikeback: 面板修正：反击
      fix_accurancy: 面板修正：命中
      fix_dodge: 面板修正：闪避
      element_earth: 元素属性：地
      element_water: 元素属性：水
      element_fire: 元素属性：火
      element_wind: 元素属性：风
    }
  }
)
```

和

```
cb(null, 3, 
  {
    index : Integer 宠物在交易列表中的索引号
    skills : Array(String) 宠物的技能列表
  }
)
```

对方取出金币则回调：

```
cb(null, 4, Integer gold 取出的金币数量)
```

该回调在对方取出物品的瞬间可能会触发多次，因此需要多次监听该消息直到交易成功。

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`cga.AsyncWaitTradeDialog(Function cb, Integer timeout (default = 3000))`

异步等待交易对话框弹出

交易对话框弹出时回调：

```
cb(null, String 交易对象的名称, Integer 交易对象的等级)
```

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`cga.AsyncWaitTradeState(Function cb, Integer timeout (default = 3000))`

异步等待交易状态改变

交易状态改变时回调：

```
cb(null, Integer state 状态)
```

state=0 取消交易

state=1 准备交易

state=2 确认交易

state=3 交易成功

失败则回调`cb(new Error('Unknown exception.'))`。

特别地，等待超时则回调`cb(new Error('Async callback timeout.'))`。

***

`Boolean cga.FixMapWarpStuck(Integer type)`

type=0时修复黑屏问题：如果遇敌时正好在切换地图则会导致游戏永久黑屏（其实是陷入永久的切图中间状态），此处调用cga.FixMapWarpStuck(0)即可强制解除黑屏状态。

type=1时强制切图：如果玩家站在了某个传送门/楼梯上方却因为某些原因（比如调用了cga.ForceMove）导致无法被传送，此时调用cga.FixMapWarpStuck(1)即可强制触发传送。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.IsUIDialogPresent(Integer dialog)`

检查某个对话框是否打开

目前只支持：

0=交易对话框

1=战斗时的技能列表对话框

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.ChangeNickName(String str)`

修改玩家称号，最大允许16字节的字符串输入。

修改成功返回true，长度超出允许范围则返回false。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.ChangeTitleName(Integer titleId)`

修改特殊称号，titleId为称号在称号列表中的id，如果要取消特殊称号则填写titleId=-1。

修改成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

***

`Boolean cga.ChangePetName(Integer petId, String name)`

修改petid(0~4)位置的宠物的名称。

修改成功返回true，否则返回false。

如果与cga本地服务连接中断则抛出异常。

***

`cga.ChangePersDesc(Object obj)`

修改个人简介，obj格式为：

```
{
    sell_icon : 卖（图标id） Integer
    sell_string : 卖（文本） String
    buy_icon : 买（图标id） Integer
    buy_string : 买（文本） String
    want_icon : 想要（图标id） Integer
    want_string : 想要（文本） String
    desc_string : 个人简介 String
}
```

不填写的项为保持原状。图标修改成功后可能不会立刻反应在界面上，但是别人看到的是修改后的，重新进入服务器即可刷新。

如果与cga本地服务连接中断则抛出异常。

***

`cga.AsyncWaitConnectionState(Function cb, Integer timeout (default = 3000))`

异步等待登录失败、登录成功或掉线

```
cb(null,
  {
    state: Integer 0=登录失败，1=登录成功到角色选择界面，2=登录到游戏中，10000=与服务器的联机被切断了
    msg : String 失败原因
  }
)
```

等待超时则回调`cb(new Error('Async callback timeout.'))`。