# 纸艺螃蟹角色设定 v1.1

状态：**用户已确认collage画风及v1.1角色造型。** 男主橘色、女主金色配粉色蝴蝶结、路人暖灰色，以及当前简单可拆卸万圣节配饰，作为后续镜头统一基准。所有镜头通过character.js绘制；用户后续提出修改时再更新该模块。分镜已按用户填写确认更新为v2，关键帧草图已绘制，等待草图确认；MV整片制作尚未启动，连续动作效果仍需预览验证。

## 角色

采用用户指定的Claude／Clawd小螃蟹形象作为造型参考，保留宽方形身体、简洁黑眼睛和四只短脚，转译为带纸纹、白边和投影的剪纸纸偶。属于本项目绘制的改编造型，不宣称是官方角色设定。

参考外观：[Claude Code署名的Clawd贴纸展示](https://www.stickermule.com/claudecode/item/19156132)。未下载或使用该页面图片作为制作素材，实际角色均由 `character.js` 绘制。

| 类型 | 身体与身份特征 | 简单万圣节点缀 |
| --- | --- | --- |
| male 男主 | 陶土橘色，四短脚、黑眼睛 | 小南瓜徽章 |
| female 女主 | 柔和金色，粉色蝴蝶结 | 可拆卸的迷你巫帽，蝴蝶结始终保留 |
| extra 路人 | 暖灰色，同一基础轮廓 | 小幽灵徽章 |

`halloween:false`关闭节日配饰。配饰不遮挡眼睛和嘴，避免大面积黑色或过多装饰。

## 已实现的表情

| 参数 | 含义 | 歌词或使用依据 |
| --- | --- | --- |
| neutral | 平静 | 三视图及日常基础状态 |
| happy | 开心 | 用户指定；回忆／想象等可选场景 |
| shy | 害羞 | 用户指定；眼神或靠近时的可选反应 |
| sad | 难过 | 孤单、错过、结尾无法相见 |
| hopeful | 期待 | 反复盼望再会面 |
| worried | 焦急 | 时间差、赶路、寻找及处处受阻 |
| regretful | 懊悔 | 第38–39行的悔意与自责 |
| surprised | 惊讶 | 偶然看见／第35行花火意象的可选反应，并非歌词明确描述的固定表情 |

期待、焦急与懊悔是本次对照script.txt补充的重点。惊讶作为备用，不要求每个镜头使用。角色文字依据以script.txt为准。

## 已实现的动作

| 参数 | 动作 | 依据与范围 |
| --- | --- | --- |
| idle | 站立、呼吸、眨眼 | 基础状态 |
| walk | 走 | 用户要求；巡逻、城市移动 |
| jump | 跳 | 用户要求；有蓄力、腾空、落地，不拉伸纸片 |
| hug | 拥抱 | 用户要求；通过hugSide指向同伴，不能擅自据此写成复合结局 |
| hold | 手持道具 | 用户要求；信封、南瓜小篮或花 |
| search | 寻找、抬钳张望 | 第5–6行巡逻及第23–24行城市寻人 |
| wait | 等候、收钳守候 | 第32行等候及第40行盼望 |
| lookback | 回望、转移目光 | 擦肩、眼波、错过意象；具体身体朝向由facing配合 |
| hurry | 赶路 | 第17–20行地铁／电梯的时间差 |
| post | 伸钳递信 | 第2行寄信；邮筒和投递槽属于场景，不画进角色模块 |
| reach | 伸钳挽留 | 对末段悔意的可选肢体表达，不当作歌词已明说的事件 |

看展可复用站立／寻找并调整目光；乘地铁和电梯的车厢、轿厢及位移由场景绘制；擦肩由两角色路径配合；探戈、花火属于尚未设计的镜头内容，不虚构成已经完成的动作或特效。

## 统一接口

浏览器加载：

```html
<script src="character.js"></script>
```

```js
const options = {
  id: 'lead-male',       // 不同实例用稳定id；影响纸纹与定格抖动
  variant: 'male',       // male | female | extra
  x: 960, y: 850,        // 地面锚点，跳跃时仍是地面位置
  size: 250,            // 100个局部单位对应size个像素；帽子可超出名义身高
  facing: 'front',      // front | left | right | back
  expression: 'hopeful',
  action: 'hold',
  t: 2.3,               // 绝对秒数，按10次/秒量化
  u: 0.3,               // 动作进度；走/赶路为周期相位，跳为0–1完整动作
  halloween: true,
  hold: {type: 'letter', hand: 'left'}
};
const result = Character.draw(ctx, options);
const leftHand = Character.handAt(options, 'left');
```

- `draw`与`handAt`共用姿态函数，返回的手部位置包含朝向、统一缩放、跳跃、动作和纸偶抖动。
- 所有肢体、角色面部、万圣节配饰在同一模块维护。后续镜头不得复制角色几何代码。
- 四方向包含原生侧面和背面；侧面单独安排面部，不把正面脸横向压扁。左侧使用镜像。
- `hugSide:'left'|'right'`可令双钳朝向同伴。拥抱仍需在镜头中安排两个实例的位置、遮挡和动作阶段。
- `hold`支持`letter`、`pumpkin`、`flower`；`post`默认右钳持信。道具先画，抓握的钳子后画，避免视觉脱手。
- 可提供`hold.draw(ctx, anchor)`自定义道具。回调坐标原点就是钳端；绘制被裁切到局部安全矩形，禁止在回调中改变外部画布或绕过裁切。
- 道具随同一手部坐标移动；持物时手部会下移至面部安全区。不要用外部独立DOM或视频层叠加道具。
- `paperJitter:false`可关闭纸偶整体最多±1.6像素的定格微抖，便于三视图和QA。纸张纹理种子固定，不随时间闪烁。

## 文件与复现

- `character-sheet.png`：3200×2400，三类角色三视图、基础表情和四项基础动作。
- `character-lyric-sheet.png`：3200×2160，歌词补充表情和六项补充动作。
- 两张图直接调用同一个character.js，不含另画的角色示意图。
- `character-sheet.html`、`character-lyric-sheet.html`：设定图排版入口。
- `render_character_sheet.py`：使用本机Chrome导出。

```powershell
.\.conda\mv\python.exe render_character_sheet.py
.\.conda\mv\python.exe render_character_sheet.py --page character-lyric-sheet --height 2160
```

## 验证与限制

接口核对覆盖3类角色×4朝向×11动作×3进度×2持物钳，共792组：draw返回的手部坐标与handAt一致、重复输入返回相同姿态信息、道具包围框不与面部包围框相交。使用轻量模拟Canvas检查接口，证据保存在 `.cache/character-qa.json`。

两张最终设定图另行经实际浏览器渲染并打开检查。以上不代表全部动作已经通过连续动画观感验收；用户确认造型后，动作时长、同伴接触、转身和镜头适配仍需用预览验证。
