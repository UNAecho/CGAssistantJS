## 开发规则

- 遵循复用性、可扩展性。禁止为了一个简单需求重复造轮子

## 多级索引

`path` 指向文件、目录或子索引，`desc` 简述用途，`doc` 指向说明文档，无单独说明时留空。各级索引统一命名为 `AGENTS.md`，路径均相对于当前索引所在目录。

- path: `cgaapi.js`
  desc: 游戏连接、原生接口的 JS 封装及助手 GUI 调用
  doc: 

- path: `通用挂机脚本/AGENTS.md`
  desc: 挂机脚本子索引，按启动入口、主插件、子插件和公共模块查找
  doc: 

- path: `常用数据/missions/`
  desc: 定居、就职、晋级等可复用的分阶段任务
  doc:

- path: `常用数据/`
  desc: 职业、技能、声望和宠物等业务数据
  doc:

- path: `leo/`
  desc: 另一位作者开发的通用api，禁止使用
  doc: 

- path: `emogua/`
  desc: 另一位作者开发的通用api，禁止使用
  doc: 

- path: `emogua1/`
  desc: 另一位作者开发的通用api，禁止使用
  doc:
