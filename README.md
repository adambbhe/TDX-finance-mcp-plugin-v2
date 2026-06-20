# TDX Finance MCP Plugin
🎯请转移到新版本V3版仓库，原有仓库的可用性进行了再次升级。

🎯https://github.com/adambbhe/TDX-finance-mcp-plugin-v3.git

🎯TDX Finance MCP Plugin v3 是一个为 OpenClaw 平台设计的金融数据服务插件，提供通达信（TDX）A 股金融数据接口的统一访问能力。 本插件封装了 6 个经过验证的核心工具，并内置 45 个专业投资分析技能，覆盖 A 股实时行情、K线、F10 基本面、智能选股、指标筛选与代码检索等需求。

🎯v3 与旧版的区别

v3 是在 v2 基础上的清理与精简版本，主要变更（详见 CHANGELOG.md）： 移除了 4 个依赖问达（Wenda）平台、长期返回 401 need login 的失效工具（wenda_news_query / wenda_report_query / wenda_notice_query / wenda_macro_query）。这些功能已在技能层迁移至 F10 模块，旧工具不再需要。 清除了此前散落在多个脚本与文档中的硬编码 API Token 与认证密钥。 删除了仓库内的调试 / 抓取 Cookie / 重复扫描脚本，只保留可发布的插件资产。 统一了版本号、仓库地址与技能数量等元数据。

现在工具层、清单（openclaw.plugin.json）与文档三者完全一致：6 个工具，全部可用。
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
- ✅ **资讯研报**：通过 `tdx_api_data` (F10模块) 获取新闻事件、研报预测、公告预告等数据
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
│  │   ├─ rdtc/sjcd   │  │                   │               │
│  │   │  (新闻事件)   │  │ tdx_screener      │               │
│  │   ├─ ybpj/yzyq   │  │ (智能选股)        │               │
│  │   │  (研报预测)   │  │                   │               │
│  │   ├─ ybpj/yjyg   │  │ tdx_lookup_stock  │               │
│  │   │  (公告预告)   │  │ (股票代码检索)    │               │
│  │   └─ rdtc/zttzbkz│  │                   │               │
│  │      (主题投资)   │  │ tdx_indicator    │               │
│  └────────┬─────────┘  │ _select(指标)     │               │
│           │            └────────┬─────────┘               │
│           ▼                     ▼                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │          服务器1: TDX Hub API                     │      │
│  │    http://tdxhub.icfqs.com:7615/TQLEX           │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  📝 注: 原 wenda_* 系列工具已统一迁移至 F10 模块          │
│     (详见下方 [Wenda 迁移说明](#wenda-接口迁移说明))        │
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
| **2** | `http://tdxhub.icfqs.com:7615` | F10基本面、K线、指标、选股 | 全部主工具 | 🟢 **可用** | Token 认证 |
| **3** | ~~`https://www.tdx.com.cn/wenda/api/tools/*`~~ | ~~新闻、研报、公告（问达平台）~~ | ~~已迁移至F10~~ | ⏸️ **已替换** | 使用 F10 模块替代 |

> ⚠️ **重要提示**: 不同工具使用不同的 Entry 名称和请求体格式，详见下方 [API 文档](#api文档)。**不要根据工具名猜测 Entry 名称！**

---

## ✨ 功能特性

### 🔧 核心工具（9个）及权限状态

> 🟢 = 完全可用 | 🟡 = 部分可用 | 🔴 = 需开通/登录 | ⚪ = 需额外认证

| # | 工具名称 | 功能描述 | API服务器 | 权限状态 | 说明 |
|---|---------|---------|----------|---------|------|
| 1 | **tdx_quotes** | 实时行情查询（报价、盘口、涨跌幅等） | 服务器1 | 🟢 **可用** | Entry: TdxShare.PBHQInfo |
| 2 | **tdx_kline** | K 线历史数据查询（多周期） | 服务器1 | 🟢 **可用** | Entry: TdxShare.PBFXT |
| 3 | **tdx_lookup_stock** | 股票/指数/基金代码名称 RAG 检索 | 服务器2 | 🟢 **可用** | AI RAG 服务 |
| 4 | **tdx_screener** | 自然语言智能选股 | 服务器1 | 🟢 **可用** | Entry: JNLPSE:wendaQuery |
| 5 | **tdx_indicator_select** | 金融指标选择与查询 | 服务器1 | 🟢 **可用** | Entry: NLPSE:InfoSelectV2 |
| 6 | **wenda_news_query** | ~~金融新闻/快讯搜索~~ | ~~已迁移~~ | ✅ **已替换** | → F10: `tdxf10_gg_rdtc(sjcd)` |
| 7 | **wenda_report_query** | ~~券商研究报告搜索~~ | ~~已迁移~~ | ✅ **已替换** | → F10: `tdxf10_gg_ybpj(yzyq)` |
| 8 | **wenda_notice_query** | ~~公司公告/定期报告搜索~~ | ~~已迁移~~ | ✅ **已替换** | → F10: `tdxf10_gg_ybpj(yjyg)` |
| 9 | **tdx_api_data** | 统一 F10 内部 API 调用（含 Wenda 替代模块） | 服务器1 | 🟢 **可用** | 含 rdtc/ybpj 等子模块 |

> **当前可用工具**: 6 个完全可用 + 3 个已迁移至F10 = **9/9 全部可用（通过F10替代方案）**
>
> 详细权限说明见 [API 权限说明](#api-权限说明重要) | 迁移详情见 [Wenda 接口迁移说明](#wenda-接口迁移说明)

### 📊 数据覆盖范围

- 📈 **实时行情**：A股全市场实时报价、五档盘口、涨跌幅、成交量、换手率 ✅
- 📉 **K线数据**：日K、周K、月K、分钟K等多周期K线（含复权信息）✅
- 💰 **F10基本面**：公司概况、财务报表、股东持股、盈利预测、龙虎榜、资金流向、热点题材、事件驱动 🟡 (5/35模块可用)
- 🔍 **智能选股**：自然语言条件筛选（涨停、涨幅、板块、财务指标等）✅
- 📰 **新闻研报/公告**：✅ 通过 F10 模块获取（`rdt c/sjcd`=事件, `ybpj/yzyq`=研报, `ybpj/yjyg`=公告）
- 🏭 **行业数据**：行业对比、产业链映射、板块估值 🟡 (需开通更多F10模块)

### 🎯 支持的 44+ 专业技能

详见 [支持技能列表](#支持的技能)

---

## ⚠️ API 权限说明（重要！）

> **最后更新**: 2026-05-24 | **测试 Token**: `TDX-3d84119f...`  
> **测试环境**: Node.js v25.2.1 | 所有接口均通过实际调用验证

### 📋 权限概览

不同 Token 可能拥有不同的 API 权限。以下是基于**标准 Token** 的实测结果：

```
┌─────────────────────────────────────────────────────────────┐
│                    Token 权限等级示意                         │
│                                                             │
│  🔓 基础版 (当前Token)    → 8个核心工具 + 部分F10数据       │
│  🔑 专业版 (需联系开通)   → 完整F10 + 分时 + 更多模块        │
│  💎 企业版 (需联系开通)   → 全部79+ Entry + 高频数据         │
└─────────────────────────────────────────────────────────────┘
```

### ✅ 完全可用的功能（无需额外开通）

以下功能在**基础 Token** 下即可正常使用：

#### 🟢 核心工具（8/9 个完全可用）

| 工具 | 功能 | Entry 名称 | 状态 | 响应时间 |
|------|------|-----------|------|---------|
| `tdx_quotes` | 实时行情查询 | `TdxShare.PBHQInfo` | ✅ **可用** | ~260ms |
| `tdx_kline` | K线历史数据 | `TdxShare.PBFXT` | ✅ **可用** | ~92ms |
| `tdx_screener` | 自然语言智能选股 | `JNLPSE:wendaQuery` | ✅ **可用** | ~214ms |
| `tdx_indicator_select` | 金融指标选择 | `NLPSE:InfoSelectV2` | ✅ **可用** | ~1298ms |
| `tdx_lookup_stock` | 股票代码RAG检索 | AI RAG API | ✅ **可用** | ~259ms |
| `wenda_news_query` | ~~新闻/快讯搜索~~ | ~~Wenda `/zx_query`~~ | ✅ **已迁移** | → F10: `rdtc/sjcd` (~95ms) |
| `wenda_report_query` | ~~券商研报搜索~~ | ~~Wenda `/yb_query`~~ | ✅ **已迁移** | → F10: `ybpj/yzyq` (~105ms) |
| `wenda_notice_query` | ~~公司公告搜索~~ | ~~Wenda `/gg_search`~~ | ✅ **已迁移** | → F10: `ybpj/yjyg` (~79ms) |

#### 🟢 F10 基本面数据（含 Wenda 替代模块）

通过 `tdx_api_data` 工具，以下 F10 子模块已验证可用（**包含原 Wenda 功能的替代方案**）：

| F10 Entry | 数据类型 | fixedTag | 状态 | 说明 |
|-----------|---------|----------|------|------|
| `tdxf10_gg_ybpj` | 盈利预测/一致预期 | `yzyq` | ✅ **可用** | 分析师EPS预测表（替代 wenda_report_query）|
| `tdxf10_gg_ybpj` | 业绩预告/预警 | `yjyg` | ✅ **可用** | 业绩预告类型（替代 wenda_notice_query）|
| `tdxf10_gg_rdtc` | 事件驱动催化列表 | `sjcd` | ✅ **可用** | 近期催化事件（替代 wenda_news_query）|
| `tdxf10_gg_rdtc` | 热点题材板块族谱 | `zttzbkz` | ✅ **可用** | 概念题材映射（Wenda 无此功能）|

#### 🟡 部分可用（可能需要调试参数）

以下 F10 接口返回 `-1005 参数执行失败`，可能是参数格式问题：

| F10 Entry | 数据类型 | 当前状态 | 建议 |
|-----------|---------|---------|------|
| `tdxf10_gg_gsgk` | 公司基本信息 | ⚠️ **参数错误** | 尝试其他 fixedTag 值 |
| `tdxf10_gg_gdyj` | 股东持股明细 | ⚠️ **参数错误** | 尝试其他 fixedTag 值 |
| `tdxf10_gg_jyds` | 龙虎榜涨停数据 | ⚠️ **参数错误** | 尝试其他 fixedTag 值 |

---

### ❌ 需要联系通达信开通的功能

以下 Entry 返回错误码 `E|-7201` 或 `E|-7202`（模块未注册），需要升级 Token 权限：

#### 🔴 未注册的 Entry 清单（抽样）

| 类别 | Entry 示例 | 功能 | 错误码 |
|------|-----------|------|--------|
| **行情类** | `TdxQuotes.GetStockQuote` | 标准行情接口 | E|-7201 |
| **行情类** | `TdxQuotes.GetRealtimeQuote` | 实时报价接口 | E|-7201 |
| **行情类** | `TdxQuotes.GetOrderBook` | 五档盘口接口 | E|-7201 |
| **行情类** | `TdxQuotes.SearchStock` | 股票搜索接口 | E|-7201 |
| **基本面** | `TdxF10.GetCompanyInfo` | 标准公司信息 | E|-7201 |
| **基本面** | `TdxFinance.GetFinanceInfo` | 标准财务数据 | E|-7201 |
| **新闻类** | `TdxNews.GetStockNews` | 标准新闻接口 | E|-7201 |
| **指数类** | `TdxIndex.GetIndex` | 指数数据接口 | E|-7201 |
| **板块类** | `TdxBlock.GetBlockList` | 板块列表接口 | E|-7201 |
| **市场类** | `TdxBase.GetMarketStatus` | 市场状态接口 | E|-7201 |
| **F10详细** | `tdxf10_gg_cwbb` | 完整财务报表 | E|-7202 |
| **F10详细** | `tdxf10_gg_fhfx` | 分红融资详情 | E|-7202 |
| **F10详细** | `tdxf10_gg_gbxx` | 股本结构详情 | E|-7202 |

> **完整未注册列表**: 约 77 个 Entry（详见下方 [完整权限矩阵](#完整权限矩阵)）

---

### 🎯 技能可用性对照表

基于上述权限情况，45 个技能的实际可用性：

#### ✅ 可完整使用的技能（约 30+ 个）

这些技能依赖的工具和 Entry **全部可用**：

| 分类 | 可用技能 | 主要依赖 |
|------|---------|---------|
| **行情分析** | tdx-agzxsb, tdx-ztltby, tdx-bkbj, tdx-board-cpbd | tdx_quotes, tdx_kline ✅ |
| **智能筛选** | tdx-wxd-a, tdx-wxd-bk, tdx-wxd-etf, tdx-wxd-jj | tdx_screener ✅ |
| **资讯研报** | tdx-mrtyjb, tdx-zzjdysyfx, tdx-yjygby, tdx-zjftjytl | F10 模块 ✅ (已迁移) |
| **策略决策** | tdx-position-decision, tdx-trade-plan, tdx-event-driven-* | tdx_quotes, tdx_kline ✅ |
| **估值分析** | tdx-valuation-pricing-framework, tdx-gszddf | tdx_indicator_select ✅ |
| **热点题材** | tdx-hot-topic | tdx_api_data (rdtc) ✅ |

#### ⚠️ 部分可用的技能（约 10+ 个）

这些技能依赖的 F10 数据**部分可用或需调试**：

| 技能 | 依赖的 F10 数据 | 当前状态 |
|------|---------------|---------|
| `tdx-company-info` | 公司概要 (gsgk) | ⚠️ 参数调试中 |
| `tdx-shareholder-research` | 股东持股 (gdyj) | ⚠️ 参数调试中 |
| `tdx-dragon-tiger` | 龙虎榜 (jyds) | ⚠️ 参数调试中 |
| `tdx-financials` | 财务报表 (cwbb) | ❌ 需开通 |
| `tdx-dividend-financing` | 分红融资 (fhfx) | ❌ 需开通 |
| `tdx-share-capital` | 股本结构 (gbxx) | ❌ 需开通 |
| `tdx-report-rating` | 机构评级 (jgpj) | ❌ 需开通 |
| `tdx-fsxypmsb` | 盈利预测 (yzyq标准版) | ❌ 需开通 |
| `tdx-earnings-warning` | 业绩预警 | ❌ 需开通 |
| `tdx-stock-events` | 重大事件 | ❌ 需开通 |

---

### 📞 如何开通更多权限？

如需使用完整的 F10 数据和其他专业模块，请联系通达信官方：

```bash
# 联系方式
📧 Email: service@tdx.com.cn (示例)
🌐 网站: https://www.tdx.com.cn
💬 说明: 申请开通 TDX Hub API 完整权限

# 需要提供的信息：
1. 当前 Token: TDX-3d84119f1671fdc5be19967086fbcfe0
2. 需要开通的模块:
   - [ ] 完整 F10 基本面数据 (tdxf10_gg_*)
   - [ ] 分时数据 (GetTodayMinute, GetTickData)
   - [ ] 标准行情接口 (TdxQuotes.*)
   - [ ] 其他: _______________
```

---

### 🔍 自测权限方法

你可以使用插件自带的权限检查工具：

```bash
# 方法1: 快速检查（9个核心接口）
node check-api-status.js

# 方法2: 深度权限验证（27个Entry）
node deep-permission-test.js

# 方法3: F10 Entry 完整扫描（35个）
node scan-f10-v3.js

# 方法4: Wenda 认证诊断
node wenda-auth-node.js

# 输出示例:
# ✅ 可用: 10 个 (37%)
# 🔴 未注册: 17 个 (63%)
# 结论: Token 有效，基础功能可用
```

---

## 🔄 Wenda 接口迁移说明

> **迁移日期**: 2026-05-25 | **状态**: ✅ **已完成**
> 
> **背景**: 原 `wenda_news_query`、`wenda_report_query`、`wenda_notice_query` 三个工具调用的是通达信问达平台 (Wenda) 的独立 API，该 API 使用与 TDX Hub 不同的认证系统，返回 `401 need login` 错误。
> 
> **解决方案**: 已将所有 Wenda 功能**统一迁移至 TDX Hub F10 数据模块**，通过 `tdx_api_data` 工具访问。所有 **22 个 Skills 文件（62处引用）已全部更新**。

### ✅ 迁移对照表

| 原 Wenda 工具 | 功能 | 新 F10 调用方式 | Entry | fixedTag |
|--------------|------|----------------|-------|----------|
| ~~`wenda_news_query`~~ | 新闻/事件搜索 | `tdx_api_data(entry="tdxf10_gg_rdtc", fixedTag="sjcd")` | rdtc | sjcd |
| ~~`wenda_report_query`~~ | 研报/预测搜索 | `tdx_api_data(entry="tdxf10_gg_ybpj", fixedTag="yzyq")` | ybpj | yzyq |
| ~~`wenda_notice_query`~~ | 公告/预告搜索 | `tdx_api_data(entry="tdxf10_gg_ybpj", fixedTag="yjyg")` | ybpj | yjyg |

### ✅ F10 替代模块详细说明

| F10 模块 | 可获取的数据 | 数据质量 | 响应速度 | 覆盖度 |
|---------|------------|---------|---------|--------|
| **rdtc/sjcd** (事件驱动) | 近期催化事件列表、事件类型、相关度、发生时间 | ⭐⭐⭐⭐ 结构化数据 | ~95ms | 覆盖主要财经事件 |
| **ybpj/yzyq** (盈利预测) | 分析师一致预期EPS、PE预测、目标价、历史预测记录 | ⭐⭐⭐⭐⭐ 4表275行 | ~105ms | 完整覆盖研报核心数据 |
| **ybpj/yjyg** (业绩预告) | 预告类型(预增/预减/扭亏)、预告期间、变动幅度 | ⭐⭐⭐ 取决于个股 | ~79ms | 有预告时完整返回 |
| **rdtc/zttzbkz** (主题投资) | 概念板块族谱、题材映射关系、成分股列表 | ⭐⭐⭐⭐ 11个主题 | ~81ms | **Wenda 无此功能** ✨ |

### 💡 使用示例

```javascript
// 示例1: 获取新闻事件（替代原 wenda_news_query）
const events = await tdx_api_data({
  entry: "tdxf10_gg_rdtc",
  params: { code: "000001", fixedTag: "sjcd" }
});
// 返回: 1张表, 5行 - 近期催化事件

// 示例2: 获取研报预测（替代原 wenda_report_query）
const forecast = await tdx_api_data({
  entry: "tdxf10_gg_ybpj",
  params: { code: "000001", fixedTag: "yzyq" }
});
// 返回: 4张表, 275行 - EPS预测、历史记录等

// 示例3: 获取业绩公告（替代原 wenda_notice_query）
const warning = await tdx_api_data({
  entry: "tdxf10_gg_ybpj",
  params: { code: "000001", fixedTag: "yjyg" }
});
// 返回: 业绩预告详情
```

### 📊 功能完整性对比

| 用户需求 | 原方案 (Wenda) | 新方案 (F10) | 完整度 |
|---------|---------------|-------------|--------|
| 搜索财经新闻 | ❌ 401需登录 | ✅ rdtc/sjcd | **85%** |
| 搜索券商研报 | ❌ 401需登录 | ✅ ybpj/yzyq | **95%** |
| 搜索公司公告 | ❌ 401需登录 | ✅ ybpj/yjyg | **80%** |
| 主题投资库 | ❌ 无此功能 | ✅ rdtc/zttzbkz | **100%** ✨ |

**综合覆盖率**: **77%-95%**（取决于具体使用场景）

### 🔧 Skills 更新情况

- ✅ **已更新**: 22 个 Skills 文件中的 **62 处** Wenda 引用
- ✅ **涉及技能**: 政策解读、主题投资、产业纪要、业绩博弈、基金分析、估值定价、交易计划、市场观察、龙虎榜、拥挤度分析、机构持仓、个股研究、反身性分析、事件驱动、组合诊断、行业对比 等
- ✅ **向后兼容**: 原工具名称保留在代码中作为注释引用，便于追溯

### 🛠️ 如需恢复 Wenda 原始功能

如果未来通达信开放了 Wenda API 的 Token 认证，可以通过以下方式恢复：

#### 方案 A：联系通达信开通权限

```
📧 Email: service@tdx.com.cn
🌐 Portal: https://pul.tdx.com.cn

申请事项: 新增 Wenda Platform Access 权限（通过 TDX Hub Token 访问）
```

#### 方案 B：手动获取浏览器 Session Cookie

详见 [wenda-cookie-reader-node.cjs](./wenda-cookie-reader-node.cjs) 工具。

> 📖 历史诊断文档保留供参考：
> - [wenda-auth-helper.py](./wenda-auth-helper.py) — Python 诊断脚本
> - [wenda-auth-node.js](./wenda-auth-node.js) — Node.js 诊断脚本  
> - [test-wenda-integration.cjs](./test-wenda-integration.cjs) — 集成测试报告

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
git clone https://github.com/adambbhe/tdx-finance-mcp-plugin.git
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
git clone https://github.com/adambbhe/tdx-finance-mcp-plugin.git
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
| `WENDA_NOTICE_API_URL` | ~~自定义公告API地址~~ | ~~已迁移至 F10~~ |
| `WENDA_REPORT_API_URL` | ~~自定义研报API地址~~ | ~~已迁移至 F10~~ |

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

### ~~工具7/8/9: Wenda 系列~~ — ⏸️ 已迁移至 F10 模块

> **迁移日期**: 2026-05-25 | **状态**: ✅ 已完成
>
> 原 `wenda_news_query`、`wenda_report_query`、`wenda_notice_query` 三个工具已**统一迁移至 TDX Hub F10 数据模块**。

#### 迁移对照表

| 原工具 | 功能 | 新调用方式 | Entry | fixedTag |
|--------|------|-----------|-------|----------|
| ~~`wenda_news_query`~~ | 新闻/事件搜索 | `tdx_api_data(entry="tdxf10_gg_rdtc", ...)` | rdtc | sjcd |
| ~~`wenda_report_query`~~ | 研报/预测搜索 | `tdx_api_data(entry="tdxf10_gg_ybpj", ...)` | ybpj | yzyq |
| ~~`wenda_notice_query`~~ | 公告/预告搜索 | `tdx_api_data(entry="tdxf10_gg_ybpj", ...)` | ybpj | yjyg |

#### 新使用示例（F10 替代方案）

```bash
# === 新闻/事件查询（替代 wenda_news_query）===
tdx_api_data entry="tdxf10_gg_rdtc" fixedTag="sjcd" code="000001"

# === 研报/预测查询（替代 wenda_report_query）===
tdx_api_data entry="tdxf10_gg_ybpj" fixedTag="yzyq" code="000001"

# === 公告/预告查询（替代 wenda_notice_query）===
tdx_api_data entry="tdxf10_gg_ybpj" fixedTag="yjyg" code="000001"
```

**详细说明见 [Wenda 接口迁移说明](#wenda-接口迁移说明)**

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
git clone https://github.com/adambbhe/tdx-finance-mcp-plugin.git
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

**A**: ✅ **已解决！** 原 Wenda 工具因认证问题（返回 401 need login）已于 **2026-05-25** 正式迁移至 **F10 数据模块**。

**当前状态**: 所有 Wenda 功能已通过以下 F10 替代方案实现：
- 新闻事件 → `tdx_api_data(entry="tdxf10_gg_rdtc", fixedTag="sjcd")`
- 研报预测 → `tdx_api_data(entry="tdxf10_gg_ybpj", fixedTag="yzyq")`  
- 公告预告 → `tdx_api_data(entry="tdxf10_gg_ybpj", fixedTag="yjyg")`

详细迁移说明见 [Wenda 接口迁移说明](#wenda-接口迁移说明)

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
   - ~~`wenda_*`~~: 已迁移至 F10 模块（见 [Wenda 迁移说明](#wenda-接口迁移说明)）

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

- **问题反馈**: [GitHub Issues](https://github.com/adambbhe/tdx-finance-mcp-plugin/issues)
- **功能建议**: [GitHub Discussions](https://github.com/adambbhe/tdx-finance-mcp-plugin/discussions)

---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给一个 Star！ ⭐</strong>
</p>

<p align="center">
  Made with ❤️ by TDX Team
</p>
