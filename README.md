# TDX Finance MCP Plugin

<p align="center">
  <strong>通达信金融数据服务 MCP 插件</strong><br>
  <em>TDX (TongDaXin) Finance Data Service Model Context Protocol Plugin</em>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#架构总览">架构总览</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#api文档">API文档</a> •
  <a href="#故障排查">故障排查</a>
</p>

---

## 📖 简介

**TDX Finance MCP Plugin** 是一个为 OpenClaw 平台设计的专业金融数据服务插件，提供**通达信（TDX）金融数据接口**的统一访问能力。

本插件封装了 **9 个核心工具**，支持 **44+ 个专业投资分析技能**，覆盖 A 股市场行情、财务数据、龙虎榜、股东研究、行业产业链等全方位金融数据需求。

### 🎯 核心价值

- ✅ **统一数据接口**：通过 `tdx_api_data` 工具访问通达信 F10 基本面数据
- ✅ **实时行情**：通过 `tdx_quotes` / `tdx_kline` 获取 A 股实时报价与K线
- ✅ **智能选股**：通过 `tdx_screener` 进行自然语言条件选股
- ✅ **资讯研报**：通过 `wenda_*` 系列工具获取新闻、研报、公告
- ✅ **完整认证体系**：支持 Token 认证和环境变量配置
- ✅ **即插即用**：标准 MCP 插件格式，OpenClaw 原生支持
- ✅ **📚 内置 44 个专业投资技能**：无需单独安装，一键获得完整的 AI 金融分析能力

### 📦 一包包含：工具 + 技能

```
tdx-finance-mcp-plugin/
├── index.js                 ← 🔧 9 个数据工具（执行代码）
├── openclaw.plugin.json     ← 插件清单（工具 + 技能声明）
├── skills/                  ← 📚 44 个专业投资技能（提示词）
│   ├── tdx-company-info/    ← "查公司信息"技能
│   ├── tdx-dragon-tiger/    ← "龙虎榜分析"技能
│   ├── tdx-financials/      ← "财务分析"技能
│   ├── tdx-hot-topic/       ← "热点题材"技能
│   └── ... (共 45 个)
├── install.sh               ← Linux/Mac 安装脚本（自动安装工具+技能）
├── install.ps1              ← Windows 安装脚本（自动安装工具+技能）
└── README.md                ← 完整文档
```

> **无需单独安装 Skills！** 运行 `install.sh` 或 `install.ps1` 即可同时安装 9 个工具 + 44 个技能。

---

## 🏗️ 架构总览（重要！）

本插件的 **9 个工具分别调用 3 个不同的 API 服务器**。理解这一架构是正确使用和调试的关键。

```
┌─────────────────────────────────────────────────────────────┐
│                    TDX Finance MCP Plugin                  │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ tdx_api_data     │  │ tdx_quotes       │               │
│  │ (F10基本面数据)   │  │ (实时行情)        │               │
│  │ tdx_kline        │  │                   │               │
│  │ (K线历史)         │  │ tdx_screener      │               │
│  │                   │  │ (智能选股)        │               │
│  │ tdx_indicator    │  │                   │               │
│  │ _select(指标)     │  │ tdx_lookup_stock  │               │
│  └────────┬─────────┘  │ (股票代码检索)    │               │
│           │            └────────┬─────────┘               │
│           ▼                     ▼                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │          服务器1: TDX Hub API                     │      │
│  │    http://tdxhub.icfqs.com:7615/TQLEX           │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ wenda_news_query │  │ wenda_report_    │               │
│  │ (新闻资讯)       │  │ query(研报)       │               │
│  │                  │  │                  │               │
│  │ wenda_notice_    │  │ wenda_notice_    │               │
│  │ query(公告)      │  │ query(公告)       │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                          │
│           ▼                     ▼                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │          服务器3: TDX 问达(Wenda) API             │      │
│  │    https://www.tdx.com.cn/wenda/api/tools/       │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────┐                                     │
│  │ tdx_lookup_stock │                                    │
│  │ (RAG实体检索)    │                                    │
│  └────────┬─────────┘                                     │
│           ▼                                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │          服务器2: TDX AI RAG API                  │      │
│  │    https://ai.icfqs.com:8965/v1/                 │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 📡 三大 API 服务器速查表

| # | 服务器地址 | 用途 | 涉及工具 |
|---|-----------|------|---------|
| **1** | `http://tdxhub.icfqs.com:7615/TQLEX` | F10基本面、实时行情、K线、选股、指标 | `tdx_api_data`, `tdx_quotes`, `tdx_kline`, `tdx_screener`, `tdx_indicator_select` |
| **2** | `https://ai.icfqs.com:8965/v1/rag-entity-retrieve` | RAG 实体代码/名称检索 | `tdx_lookup_stock` |
| **3** | `https://www.tdx.com.cn/wenda/api/tools/*` | 新闻、研报、公告（问达平台） | `wenda_news_query`, `wenda_report_query`, `wenda_notice_query` |

> ⚠️ **重要提示**: 不同工具使用不同的 Entry 名称和请求体格式，详见下方 [API 文档](#api文档)。**不要根据工具名猜测 Entry 名称！**

---

## ✨ 功能特性

### 🔧 核心工具（9个）

| # | 工具名称 | 功能描述 | API服务器 | 分类 |
|---|---------|---------|----------|------|
| 1 | **tdx_api_data** | 统一 F10 内部 API 调用（18种参数模板） | 服务器1 | 核心引擎 |
| 2 | **tdx_quotes** | 实时行情查询（报价、盘口、涨跌幅等） | 服务器1 | 行情数据 |
| 3 | **tdx_kline** | K 线历史数据查询（多周期） | 服务器1 | 行情数据 |
| 4 | **tdx_lookup_stock** | 股票/指数/基金代码名称 RAG 检索 | 服务器2 | 工具类 |
| 5 | **tdx_screener** | 自然语言智能选股 | 服务器1 | 选股工具 |
| 6 | **tdx_indicator_select** | 金融指标选择与查询 | 服务器1 | 指标工具 |
| 7 | **wenda_news_query** | 金融新闻/快讯搜索 | 服务器3 | 新闻资讯 |
| 8 | **wenda_report_query** | 券商研究报告搜索 | 服务器3 | 研究报告 |
| 9 | **wenda_notice_query** | 公司公告/定期报告搜索 | 服务器3 | 公告信息 |

### 📊 数据覆盖范围

- 📈 **实时行情**：A股全市场实时报价、五档盘口、涨跌幅、成交量、换手率
- 📉 **K线数据**：日K、周K、月K、分钟K等多周期K线（含复权信息）
- 💰 **F10基本面**：公司概况、财务报表、股东持股、盈利预测、龙虎榜、资金流向、热点题材、事件驱动
- 🔍 **智能选股**：自然语言条件筛选（涨停、涨幅、板块、财务指标等）
- 📰 **新闻研报**：公司公告、财经新闻、券商研报、评级调整
- 🏭 **行业数据**：行业对比、产业链映射、板块估值

### 🎯 支持的 44+ 专业技能

详见 [支持技能列表](#支持的技能)

---

## 🚀 快速开始（工具 + 技能 一键安装）

### 前置要求

- **Node.js**: >= 22.16.0（内置 fetch，无需额外依赖）
- **OpenClaw**: 已安装并运行
- **TDX API Token**: 从通达信官方获取的数据服务授权令牌

### ⚡ 三步启动（自动安装工具 + 44个技能）

#### 1️⃣ 安装插件

```bash
# 方式A: 从 GitHub 克隆（推荐）
git clone https://github.com/your-username/tdx-finance-mcp-plugin.git
cd tdx-finance-mcp-plugin

# 方式B: 一键安装脚本（推荐！自动配置 Token + 安装 Skills）
# Linux/Mac:
chmod +x install.sh
./install.sh

# Windows:
.\install.ps1 -Token "你的TDX_API_TOKEN"

# 方式C: 从 npm 安装（如果已发布）
npm install @tdx/tdx-finance-mcp
```

#### 2️⃣ 配置 API Token

**如果使用了 install.sh / install.ps1，此步已自动完成！**

手动创建配置文件 `config.json`：

```json
{
  "plugins": {
    "tdx-finance-mcp": {
      "enabled": true,
      "config": {
        "tdxApiToken": "你的通达信API_TOKEN"
      }
    }
  }
}
```

或设置环境变量：

```bash
# Windows PowerShell
$env:TDX_API_KEY = "你的API_KEY"

# Linux/Mac
export TDX_API_KEY="你的API_KEY"
```

#### 3️⃣ 启动 OpenClaw

```bash
openclaw start
```

插件会自动加载 **9 个工具 + 44 个技能**：

```
tdx-finance-mcp: registering plugin...
tdx-finance-mcp: registered tool: tdx_api_data       ← 工具
tdx-finance-mcp: registered tool: tdx_quotes          ← 工具
...
tdx-finance-mcp: installed skill: tdx-company-info     ← 技能 ✅
tdx-finance-mcp: installed skill: tdx-dragon-tiger     ← 技能 ✅
... (共44个)
```

---

## 📦 安装指南

### 方法一：本地开发模式

```bash
git clone https://github.com/your-username/tdx-finance-mcp-plugin.git
cd tdx-finance-mcp-plugin
npm install

# Windows (管理员权限)
mklink /D "%APPDATA%\openclaw\extensions\tdx-finance-mcp" "%CD%"

# Linux/Mac
ln -s $(pwd) ~/.config/openclaw/extensions/tdx-finance-mcp
```

### 方法二：npm 全局安装

```bash
npm install -g @tdx/tdx-finance-mcp
# 在 OpenClaw 配置中启用并配置 token
```

### 方法三：Docker 部署

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
ENV TDX_API_KEY=your-token-here
CMD ["node", "index.js"]
```

---

## ⚙️ 配置说明

### 必填配置

#### `tdxApiToken`（必填）

通达信 API 授权令牌。联系通达信官方申请获取。

**配置示例**：

```json
{ "tdxApiToken": "TDX-xxxxxxxxxxxxxxxx" }
```

### 可选配置

#### `apiEndpoint`（可选）

仅对**服务器1**的工具生效（`tdx_api_data`, `tdx_quotes`, `tdx_kline`, `tdx_screener`, `tdx_indicator_select`）。

**默认值**: `http://tdxhub.icfqs.com:7615/TQLEX`

**优先级**：
1. 参数中指定的 `apiEndpoint`
2. 插件配置中的 `apiEndpoint`
3. 环境变量 `TDX_API_DATA_ENDPOINT`
4. 环境变量 `TDX_API_DATE_ENDPOINT`
5. 环境变量 `TDX_API_ENDPOINT`
6. 硬编码默认值

### 环境变量汇总

| 环境变量名 | 说明 | 影响范围 |
|-----------|------|---------|
| `TDX_API_KEY` | API Token（回退方案） | 全部工具 |
| `TDX_API_DATA_ENDPOINT` | 自定义服务器1端点 | 服务器1工具 |
| `WENDA_NOTICE_API_URL` | 自定义公告API地址 | wenda_notice_query |
| `WENDA_REPORT_API_URL` | 自定义研报API地址 | wenda_report_query |

### 完整配置示例

查看 [config.example.json](./config.example.json)

```json
{
  "plugins": {
    "tdx-finance-mcp": {
      "enabled": true,
      "config": {
        "tdxApiToken": "TDX-your-token-here",
        "apiEndpoint": "http://tdxhub.icfqs.com:7615/TQLEX"
      }
    }
  },
  "env": {
    "TDX_API_KEY": "fallback-token"
  }
}
```

---

## 📚 API 文档

> ⚠️ **每个工具的 Entry 名称、请求体格式和目标服务器都不同。以下信息均从源码 `index.js` 中提取验证，请勿自行猜测。**

---

### 工具1: `tdx_api_data` — F10 基本面数据统一接口

**服务器**: `http://tdxhub.icfqs.com:7615/TQLEX`  
**Entry 格式**: 动态，以 `TdxSharePCCW.` 或 `TdxShareCW.` 为前缀  
**请求体格式**: `{ Params: [...] }`

#### 常用 Entry 列表

| Entry 名称 | 数据类型 | fixedTag 示例 | 状态 |
|-----------|---------|---------------|------|
| `TdxSharePCCW.tdxf10_gg_ybpj` | 盈利预测 | `yzyq` | ✅ 可用 |
| `TdxSharePCCW.tdxf10_gg_rdtc` + `fixedTag=zttzbkz` | 热点题材板块族谱 | `zttzbkz` | ✅ 可用 |
| `TdxSharePCCW.tdxf10_gg_rdtc` + `fixedTag=sjcd` | 事件驱动催化 | `sjcd` | ✅ 可用 |
| `TdxSharePCCW.tdxf10_gg_gsgk` | 公司基本信息 | `0` | ⚠️ 需确认权限 |
| `TdxSharePCCW.tdxf10_gg_gdyj` | 股东持股 | `gdrs` | ⚠️ 需确认权限 |
| `TdxSharePCCW.tdxf10_gg_jyds` + `fixedTag=ztfx` | 龙虎榜涨停 | `ztfx` | ⚠️ 需确认权限 |
| `TdxSharePCCW.tdxf10_gg_cwbb` | 财务报表 | `cwbb_zb` | ⚠️ 需确认权限 |

#### 使用示例

```json
// 查询盈利预测
{ "entry": "TdxSharePCCW.tdxf10_gg_ybpj", "code": "000001", "fixedTag": "yzyq" }

// 查询热点题材
{ "entry": "TdxSharePCCW.tdxf10_gg_rdtc", "code": "000001", "fixedTag": "zttzbkz" }

// 查询事件驱动
{ "entry": "TdxSharePCCW.tdxf10_gg_rdtc", "code": "000001", "fixedTag": "sjcd" }
```

#### 参数模板（18种）

| 模式 | 参数结构 | 适用场景 |
|------|---------|---------|
| `raw` | 直接透传 params | 高级自定义 |
| `code-only` | `[code]` | 单股票查询 |
| `code-fixed-tag` | `[code, fixedTag]` | 股票+类型 |
| `fixed-tag-code` | `[fixedTag, code]` | 类型+股票 |
| `code-fixed-tag-extra` | `[code, fixedTag, extra]` | 股票+类型+额外参数 |
| `code-fixed-tag-date-three-extras` | `[code, fixedTag, date, e1, e2, e3]` | 带日期的多参数 |
| `code-date-range-page` | `[code, ft, begin, end, click, page, size]` | 日期范围分页 |
| ...（共18种，详见源码 index.js） | | |

---

### 工具2: `tdx_quotes` — 实时行情查询

**服务器**: `http://tdxhub.icfqs.com:7615/TQLEX`  
**Entry**: `TdxShare.PBHQInfo`  
**请求体格式**: 结构化对象（非 `{Params:[...]}`）

```javascript
{
  "Head": { "Target": "0", "CharSet": "UTF8" },
  "Code": "000001",
  "Setcode": "0",
  "HasHQInfo": "1",
  "HasExtInfo": "1",
  "BspNum": "5",
  "HasProInfo": "0",
  "HasCalcInfo": "0",
  "HasCwInfo": "0",
  "HasStatInfo": "0"
}
```

#### 参数说明

| 参数 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `Code` | ✅ | 股票代码，如 `000001`、`600519`、`399001` | - |
| `Setcode` | ✅ | 市场代码：`0`=深市，`1`=沪市，`2`=北交所 | - |
| `HasHQInfo` | 否 | 是否返回基础行情（现价/开/高/低/量/额） | `"1"` |
| `HasExtInfo` | 否 | 是否返回扩展信息（涨停/跌停/市值） | `"1"` |
| `BspNum` | 否 | 五档盘口数量 | `"5"` |
| `HasProInfo` | 否 | 是否返回专业信息 | `"0"` |
| `HasCalcInfo` | 否 | 是否返回计算指标（需同时开启HQ/Ext/Pro） | `"0"` |
| `HasCwInfo` | 否 | 是否返回财务信息 | `"0"` |
| `HasStatInfo` | 否 | 是否返回统计信息 | `"0"` |

#### 使用示例

```bash
# 平安银行基础行情
tdx_quotes code="000001" setcode="0"

# 贵州茅台含盘口和专业信息
tdx_quotes code="600519" setcode="1" bspNum="5" hasProInfo="1"

# 上证指数
tdx_quotes code="000001" setcode="0"
```

#### 返回数据结构

```json
{
  "BaseInfo": { "Name": "平安银行", "Code": "000001" },
  "HQInfo": {
    "HQDate": "20260515",
    "Now": 10.99,
    "Close": 11.05,
    "Open": 11.05,
    "MaxP": 11.11,
    "MinP": 10.96,
    "Volume": "974741",
    "HSL": 0.502,
    "Yield": 5.32
  },
  "ExtInfo": { "ZTPrice": 12.16, "DTPrice": 9.95 },
  "BspInfo": { /* 五档盘口数据 */ }
}
```

---

### 工具3: `tdx_kline` — K线历史数据

**服务器**: `http://tdxhub.icfqs.com:7615/TQLEX`  
**Entry**: `TdxShare.PBFXT`  
**请求体格式**: 结构化对象

```javascript
{
  "Head": { "Target": 0, "CharSet": "UTF8" },
  "Code": "000001",
  "Setcode": 0,
  "Period": 4,
  "Startxh": 0,
  "WantNum": 100,
  "TQFlag": 11,
  "MPData": 0,
  "HasAttachInfo": 1,
  "HasLtgb": 0,
  "ForRefresh": 0,
  "HasIpoPrice": 0
}
```

#### Period 参数对照表

| Period 值 | 含义 |
|----------|------|
| `0` | 5分钟 |
| `1` | 15分钟 |
| `2` | 30分钟 |
| `3` | 60分钟 |
| `4` | 日K |
| `5` | 周K |
| `6` | 月K |
| `7` | 季度K |
| `8` | 年K |
| `9` | 1分钟 |
| `10` | 多分钟 |
| `11` | 多日 |
| `12` | 多周 |
| `13` | 多月 |

#### 使用示例

```bash
# 日K线 最近30根
tdx_kline code="000001" setcode="0" period="4" wantNum="30"

# 60分钟K线 最近120根
tdx_kline code="000001" setcode="0" period="3" wantNum="120"

# 月K线
tdx_kline code="600519" setcode="1" period="6" wantNum="12"
```

---

### 工具4: `tdx_lookup_stock` — 股票代码/名称检索

**服务器**: `https://ai.icfqs.com:8965/v1/rag-entity-retrieve` （独立于主API！）  
**请求体格式**: `{ query, range }`

```javascript
{
  "query": "平安银行",
  "range": "AG"
}
```

#### range 可选值

| 值 | 含义 |
|----|------|
| `AG` | A股（默认） |
| `HK-GP` | 港股股票 |
| `HK-JJ` | 港基 |
| `JJ` | 基金 |
| `MG-GP` | 美股 |
| `ZS` | 指数 |
| `ZG-JJJL` | 基金经理 |
| `GG-GP` | 港股 |

#### 使用示例

```bash
# 通过名称查找
tdx_lookup_stock query="平安银行"

# 通过代码查找
tdx_lookup_stock query="000001"

# 查找港股
tdx_lookup_stock query="腾讯" range="HK-GP"

# 查找基金
tdx_lookup_stock query="易方达蓝筹" range="JJ"
```

#### 返回数据结构

```json
{
  "retrieved_entities": [
    {
      "entity_code": "000001",
      "entity_name": "平安银行",
      "entity_type": "stock",
      "entity_setcode": "0",
      "aliases": ["PAAB","pinganyinhang"]
    }
  ]
}
```

---

### 工具5: `tdx_screener` — 自然语言智能选股

**服务器**: `http://tdxhub.icfqs.com:7615/TQLEX`  
**Entry**: `JNLPSE:wendaQuery`  
**请求体格式**: 数组 `[{ message, rang, pageNo, pageSize }]`

```javascript
[{
  "message": "涨停",
  "rang": "AG",
  "pageNo": "1",
  "pageSize": "20"
}]
```

#### 使用示例

```bash
# 涨停股票筛选
tdx_screener message="涨停"

# 涨幅超过5%
tdx_screener message="涨幅超过5%"

# 组合条件
tdx_screener message="主板 小盘 低价 涨停"
```

---

### 工具6: `tdx_indicator_select` — 金融指标选择与查询

**服务器**: `http://tdxhub.icfqs.com:7615/TQLEX`  
**Entry**: `NLPSE:InfoSelectV2`  
**请求体格式**: `{ message, rang }`

```javascript
{
  "message": "平安银行基本面指标",
  "rang": "AG"
}
```

#### 使用示例

```bash
# 查询某只股票的指标
tdx_indicator_select message="000001 技术指标"

# 行业对比
tdx_indicator_select message="银行业估值对比"
```

---

### 工具7/8/9: Wenda 系列 — 新闻/研报/公告

这三个工具调用**同一套 Wenda（问达）API**，位于**服务器3**。

| 工具 | 默认API路径 | 用途 |
|------|------------|------|
| `wenda_news_query` | `/zx_query` | 新闻/快讯/主题资讯 |
| `wenda_report_query` | `/yb_query` | 券商研报/评级/目标价 |
| `wenda_notice_query` | `/gg_search` | 公告/临时公告/定期报告 |

**服务器**: `https://www.tdx.com.cn/wenda/api/tools/{path}`

#### 通用参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `query` | ❌ | 自然语言查询（推荐方式） |
| `name` | ❌ | 主体名称（结构化查询优先级高于 symbol） |
| `symbol` | ❌ | 证券代码/简称 |
| `bdate` | ❌ | 开始日期 YYYYMMDD |
| `edate` | ❌ | 结束日期 YYYYMMDD |
| `keywords` | ❌ | 关键词（逗号分隔） |
| `desc` | ❌ | 补充说明 |
| `raw` | ❌ | 原样透传给下游的 raw 参数 |

#### 使用示例

```bash
# === 新闻查询 ===

# 自然语言搜索
wenda_news_query query="低空经济政策最新消息"

# 按股票查新闻
wenda_news_query name="中芯国际" bdate="20260101" edate="20260517" keywords="扩产,先进制程"

# === 研报查询 ===

# 自然语言搜索
wenda_report_query query="比亚迪最新两周券商研报"

# 按股票查研报
wenda_report_query name="宁德时代" keywords="评级,目标价"

# === 公告查询 ===

# 自然语言搜索
wenda_notice_query query="分红实施公告"

# 结构化查询
wenda_notice_query name="贵州茅台" bdate="20260101" edate="20260517" keywords="分红,董事会"
```

---

## 🔐 认证机制

### HTTP Header 认证

所有请求统一在 Header 中携带 Token：

```
Headers:
  Content-Type: application/json
  token: {your_tdx_api_token}
```

Token 注入逻辑（优先级从高到低）：

```
1. 插件配置中的 tdxApiToken 字段（最高优先级）
2. 环境变量 TDX_API_KEY（回退方案）
```

### 认证模式

| 模式 | 说明 | 使用场景 |
|------|------|---------|
| `"tdx"` (默认) | 使用 `token` header 发送 | 标准使用场景 |
| `"none"` | 不附加认证头 | 测试/公开接口 |
| `"header"` | 自定义 headerName + value/env | 特殊认证需求 |

---

## 🛠️ 开发指南

### 项目结构

```
tdx-finance-mcp-plugin/
├── index.js                 # 插件主入口（核心实现，283KB）
├── package.json             # 包配置
├── openclaw.plugin.json     # OpenClaw 插件清单
├── README.md                # 使用文档（本文件）
├── LICENSE                  # MIT 许可证
├── config.example.json      # 配置示例
├── .gitignore              # Git 忽略规则
├── install.sh              # Linux/Mac 安装脚本
└── install.ps1             # Windows PowerShell 安装脚本
```

### 本地开发

```bash
git clone https://github.com/your-username/tdx-finance-mcp-plugin.git
cd tdx-finance-mcp-plugin
npm install
export TDX_API_KEY="your-test-token"
node -e "
const { register } = require('./index.js');
const ctx = { logger: console, tdxApiToken: process.env.TDX_API_KEY };
register({ registerTool: (t) => console.log('Tool:', t.name), logger: console });
"
```

---

## ❓ 故障排查 & 常见问题

### Q1: 如何获取 TDX API Token？

**A**: 联系通达信官方客服或销售团队，申请开通数据服务权限。Token 格式通常为 `TDX-xxxx...`（32位十六进制字符串）。

### Q2: 所有接口都返回 503 或 S14042 错误？

**A**: 这通常是以下原因之一：

1. **Token 权限不足**：不同 Token 可能对应不同模块的访问权限。请联系通达信确认你的 Token 是否包含全部所需权限。
2. **服务端维护**：部分模块可能临时不可用。建议等待后重试。
3. **网络问题**：确保能访问 `tdxhub.icfqs.com:7615` 和 `ai.icfqs.com:8965`。

**诊断命令**（Node.js 环境）：

```bash
node -e "
const t='YOUR_TOKEN';
const h={'Content-Type':'application/json','token':t};
const ep='http://tdxhub.icfqs.com:7615/TQLEX';
(async()=>{
  const r=await fetch(ep+'?Entry=TdxShare.PBHQInfo',{method:'POST',headers:h,body:JSON.stringify({Head:{Target:'0',CharSet:'UTF8'},Code:'000001',Setcode:'0'})});
  console.log('quotes:',r.status);
  const d=await r.json();
  console.log('data:',JSON.stringify(d).substring(0,200));
})()
"
```

### Q3: tdx_api_data 能用但 tdx_quotes/kline 返回错误？

**A**: 这是正常现象！不同工具使用**完全不同的 Entry 名称**：

- `tdx_api_data` → Entry 以 `TdxSharePCCW.` 开头（F10数据）
- `tdx_quotes` → Entry 是 `TdxShare.PBHQInfo`（行情数据）
- `tdx_kline` → Entry 是 `TdxShare.PBFXT`（K线数据）

**不要根据工具名猜测 Entry！** 务必参考本文档 [API 文档](#api文档) 中的实际定义。

### Q4: PowerShell 测试失败但 Node.js 成功？

**A**: 已知现象。PowerShell 的 `Invoke-RestMethod` 与 Node.js 的原生 `fetch` 在 HTTP 处理上存在差异（如 User-Agent、连接池、TLS 设置等）。建议：

- 生产环境运行在 **Node.js >= 22** 中（与 TdxClaw 相同运行时）
- 调试时使用 Node.js 的 `fetch` 而非 PowerShell 的 `Invoke-RestMethod`

### Q5: wenda 系列工具（新闻/研报/公告）不工作？

**A**: Wenda 工具调用的是**独立的第三方服务器** (`www.tdx.com.cn`)，不同于主 API (`tdxhub.icfqs.com`)。请检查：

1. 你的 Token 是否包含 Wenda/问达平台的访问权限
2.是否能直接访问 `https://www.tdx.com.cn`
3. 可通过环境变量自定义 URL：`WENDA_NEWS_API_URL`、`WENDA_REPORT_API_URL`、`WENDA_NOTICE_API_URL`

### Q6: 支持哪些数据频率？

| 数据类型 | 更新频率 | 延迟 |
|---------|---------|------|
| **实时行情** | 交易时间内实时推送 | ~100-500ms |
| **K线数据** | 收盘后更新 | 日K:收盘后; 分钟K: 逐分钟 |
| **F10基本面** | 季度/年度 | 财报发布后1-3天 |
| **龙虎榜** | 每日收盘后 | ~16:00-18:00 |
| **新闻资讯** | 实时推送 | ~5-30分钟 |
| **研报** | 不定期 | 发布后1-24小时 |
| **公告** | 实时/定时 | 临时公告即时; 定期按披露节奏 |

### Q7: 插件加载成功但工具调用超时？

**A**: 默认超时时间为 45 秒。检查项：

1. 网络连通性：`ping tdxhub.icfqs.com`
2. DNS 解析是否正常
3. 是否有防火墙/代理拦截出站 7615/8965 端口
4. 尝试设置自定义 `apiEndpoint` 使用备用节点

---

## ⚠️ 已知注意事项 (Gotchas)

> 以下是我们在开发过程中踩过的坑，希望帮你避免：

1. **Entry 名称 ≠ 工具名**：`tdx_quotes` 工具的实际 Entry 是 `TdxShare.PBHQInfo`，不是 `TdxQuotes.getSecurityQuotes`。永远从源码读取，不要猜测。

2. **三种不同的请求体格式**：
   - `tdx_api_data`: `{ Params: [...] }`
   - `tdx_quotes` / `tdx_kline`: `{ Head: {...}, Code, Setcode, ... }`
   - `tdx_screener`: `[{ message, rang, ... }]`
   - `wenda_*`: `{ query, name, bdate, ... }`

3. **三个不同的服务器**：不要假设所有请求都发往同一个地址。

4. **PowerShell ≠ Node.js fetch**：调试时建议使用 Node.js 环境，结果更可靠。

---

## 🎯 支持的技能

本插件内置 **45 个专业投资分析技能**，覆盖 A 股投资全场景。

> 📖 **完整技能清单、使用提示词和触发关键词**：详见 [SKILLS.md](./SKILLS.md)

### 🗂️ 技能分类速览

| 分类 | 数量 | 代表技能 |
|------|------|---------|
| 📈 行情与市场分析 | 8 | 市场主线识别、板块比较、北向资金行为 |
| 💰 财务与基本面 | 10 | 公司信息、财务报表、分红融资、业绩预警 |
| 🐉 龙虎榜与资金流 | 3 | 龙虎榜查询、席位风格、主力资金 |
| 📊 行业与产业链 | 5 | 产业链映射、机构持仓、出海链投资 |
| 🔬 研究报告与评级 | 5 | 投资逻辑研究、研报评级、每日简报 |
| 📝 公告与纪要 | 6 | 事件信息、业绩博弈、政策解读 |
| 🎯 策略与决策支持 | 7 | 持仓诊断、仓位决策、交易计划、估值框架 |
| 📢 智能问答 | 4 | 问小达选A股/板块/ETF/基金 |

### 💬 快速上手示例

```bash
# 在 OpenClaw 对话中直接使用自然语言：

"今天A股市场的交易主线是什么？"
→ 自动触发 tdx-agzxsb (市场主线识别)

"查一下000001平安银行的基本信息"
→ 自动触发 tdx-company-info (公司信息查询)

"帮我选出今天涨幅超过5%的小盘低价股"
→ 自动触发 tdx-wxd-a (智能选股)

"宁德时代最近的龙虎榜数据"
→ 自动触发 tdx-dragon-tiger (龙虎榜查询)
```

更多提示词示例请查看 [SKILLS.md → 使用提示词速查](./SKILLS.md#%E4%BD%BF%E7%94%A8%E6%8F%90%E7%A4%BA%E8%AF%8D%E9%80%9F%E6%9F%A5)

---

## 📄 许可证

本项目基于 **MIT License** 开源。

```
MIT License

Copyright (c) 2026 TDX Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 致谢

- **通达信（TDX）** - 提供专业的金融数据服务
- **OpenClaw 团队** - 提供优秀的 AI 助手平台
- **@sinclair/typebox** - JSON Schema 类型定义库

---

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-username/tdx-finance-mcp-plugin/issues)
- **功能建议**: [GitHub Discussions](https://github.com/your-username/tdx-finance-mcp-plugin/discussions)

---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给一个 Star！ ⭐</strong>
</p>

<p align="center">
  Made with ❤️ by TDX Team
</p>
