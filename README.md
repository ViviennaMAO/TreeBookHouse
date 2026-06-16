# TreeBookHouse

互动书房集合 · Luffa SuperBox 小程序 · AppID `mpwrobabmms587ke`

## 这是什么

一个聚合 5 本互动金融书的"门厅小程序"。用户从 TreeBookHouse 选书,通过 BNB Chain USDT 解锁后跳转到对应的子小程序阅读。

| 书目 | AppID | 单本价 | 解锁方式 |
|---|---|---|---|
| 货币金融学 | `mpqj6lz8sg9ovagh` | 免费 | 直接打开 |
| 金融周期 | `mpkboyj2fc3l4u7q` | 9.9 USDT | 单本 / 套餐 |
| 大类资产研究 | `mp8l3nracsix91cs` | 9.9 USDT | 单本 / 套餐 |
| 波动率交易 | `mpaju0v8qb5z1h2m` | 9.9 USDT | 单本 / 套餐 |
| 期权入门学与练 | `mpvr44zosv8bkocl` | 9.9 USDT | 单本 / 套餐 |

**早鸟终身套餐 19.9 USDT** · 现在 4 本 + 未来全部新书,一次解锁终身可读 (vs 单本累加 39.6 USDT)。

## 仓库结构

外层仓库放文档,**所有小程序源码在 `mini-program/`** —— 这是你在 Luffa Cloud-Devtools 里要选中的文件夹:

```
TreeBookHouse/                       ← 仓库根 (放 README、未来加 docs/scripts)
├── README.md
└── mini-program/                    ← ★ Luffa IDE 选中这一层
    ├── project.config.json          # TCMPPappid = mpwrobabmms587ke
    ├── app.json                     # 4 pages + tabBar
    ├── app.js                       # onLaunch 加载 ownership + language
    ├── app.wxss                     # 全局极简白 + 衬线书脊视觉
    ├── sitemap.json
    ├── package.json                 # EVM SDK 依赖
    ├── pages/
    │   ├── index/                   # 书架首页 (Hero + 套餐 CTA + 书目列表)
    │   ├── detail/                  # 单本详情 (书脊封面 + 描述 + 解锁/阅读)
    │   ├── bundle/                  # 早鸟套餐购买页
    │   └── me/                      # 钱包 / 书目状态 / 订单 / 关于
    └── utils/
        ├── luffa.js                 # 原生桥 Promise 封装
        ├── books.js                 # 5 本书的元数据 + 书脊色
        ├── ownership.js             # 本地解锁状态 (wx.storage)
        ├── payment.js               # USDT (BEP20) transfer 编码 + 调用
        └── navigate.js              # 跨小程序跳转 + 分享
```

## 收款配置

```
链 :     BNB Chain (chain ID 56)
代币 :   USDT (BEP20)
合约 :   0x55d398326f99059fF775485246999027B3197955
收款 :   0xc05ffc6067198d9bbc30ecf91356ffc4e0e12a53
```

修改收款地址 → 编辑 `mini-program/utils/payment.js` 的 `RECEIVER` 常量,前端展示自动同步。

## 部署步骤

### 1. 安装 npm 依赖

```bash
cd mini-program
npm install
```

(必须在 `mini-program/` 里跑,不是仓库根。)

### 2. Luffa Cloud-Devtools 打开项目

- 打开 IDE → "创建项目" / "导入项目"
- **选择目录: `TreeBookHouse/mini-program`** (★ 不是仓库根)
- AppID 下拉里选 `mpwrobabmms587ke` (不要手动输入)
- IDE 顶部菜单 → **工具 → 构建 npm** → 生成 `mini-program/miniprogram_npm/` (含 `@luffalab/luffa-evm-sdk`)

### 3. 服务器域名白名单

Luffa Cloud 控制台 → **小程序设置 → 服务器域名 → request 合法域名** 添加:

```
https://bsc-dataseed.binance.org           # 默认 BSC RPC
https://rpc.ankr.com                       # 备用 RPC
```

(目前发送交易主要走 SuperBox 钱包桥,RPC 调用由 Luffa app 内部处理。预先加上以备未来扩展。)

### 4. 预览 / 上传 / 发布

- 在 IDE 里点 **预览** → 用真机扫码或模拟器测试
- 测试场景:
  1. 冷启动 → 进入书架 → 点击 "货币金融学" → 跳转子小程序
  2. 冷启动 → 点击套餐 CTA → 进入早鸟页 → 模拟支付 19.9 USDT
  3. 已解锁状态 → "我的" 显示订单 + 书目状态
- 测试通过后 → IDE 点 **上传** → 填版本号 + 改动说明
- Luffa Cloud 控制台 → **版本管理** → 提交审核 → 通过后点发布

### 5. 提交审核 checklist

- [ ] 隐私政策 URL 已上线,明确提到 **钱包地址 / 昵称 / 头像** 的读取
- [ ] 隐私政策中包含 **USDT 链上支付** 的资金流向说明
- [ ] 提供测试账号 + 测试钱包地址给审核员
- [ ] 5 个子小程序 AppID 都已在 Luffa Cloud 上线 (跨小程序跳转目标必须存在)

## 数据 / 验证策略 (MVP 说明)

当前实现是 **客户端本地存储 + 链上 hash 备份**:

- 用户支付成功后,把 `txHash + 钱包地址 + 时间` 写入 `wx.storage` 的 `tbh_ownership_v1`。
- 切换设备需要重新支付 (或同一钱包重新连接后,可考虑接入后端做链上回溯验证)。

**生产建议**: 加一个轻量后端服务做:
1. 校验 `txHash` 是否真的转账到了收款地址 + 金额匹配。
2. 把 `wallet address → owned books` 映射存到数据库。
3. 跨设备登录时,前端用 `signMessageV2` 签名作为身份证明,从后端拉取所有权状态。

后端目录尚未包含 —— 当作 v0.2 的事。

## 视觉系统

- 主色 `#0F1B3B` (深墨蓝)
- 留白 `#FFFFFF`
- 描边 `#F1F2F4`,辅文 `#6B7280`,极淡 `#9CA3AF`
- 衬线字体: Songti SC / Source Han Serif (标题与价格数字)
- 无衬线字体: PingFang SC (正文)
- 5 本书的书脊色:
  - 货币金融学 `#C9956A`
  - 金融周期 `#3A4B6F`
  - 大类资产研究 `#2D5A45`
  - 波动率交易 `#9F4B5B`
  - 期权入门学与练 `#A88333`

## 跨小程序跳转

通过 `mini-program/utils/navigate.js` 的 `openMiniProgram(appId)`,底层调用:

```js
luffa('navigateToMiniProgram', {
  url: `tcmppn3u4by5l18://?appId=${appId}&page=pages/index/index&query=`
})
```

如果跳转失败,请确认目标 AppID 已在 Luffa Cloud 上线。

## TODO (v0.2)

- [ ] 后端链上验证 + 跨设备所有权同步
- [ ] 书目封面图 (现用纯色书脊占位)
- [ ] 阅读进度从子小程序回传到 TreeBookHouse
- [ ] 多语言 (用 `luffa('language')` 切换 zh-Hans / en)
- [ ] 分享卡片图 (`shareBook` 当前 imageUrl 为空)
