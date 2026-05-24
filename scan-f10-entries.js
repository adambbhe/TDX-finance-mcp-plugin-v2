/**
 * TDX Finance MCP Plugin - tdx_api_data 完整权限扫描
 * 测试所有 F10 系列 Entry 的实际可用性
 */

const TOKEN = "TDX-3d84119f1671fdc5be19967086fbcfe0";
const HEADERS = { "Content-Type": "application/json", token: TOKEN };
const HUB = "http://tdxhub.icfqs.com:7615/TQLEX";

const results = [];
let successCount = 0;
let failCount = 0;
let errorCount = 0;

async function testF10Entry(entry, params, description = "") {
  const start = Date.now();
  try {
    const url = `${HUB}?Entry=${entry}`;
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ Params: params }),
      signal: AbortSignal.timeout(8000)
    });
    
    const elapsed = Date.now() - start;
    let data;
    
    try {
      data = await res.json();
    } catch (parseErr) {
      // 可能返回非 JSON 格式
      const text = await res.text();
      
      // 检查是否是 E|-7201/7202 格式的错误
      if (text.startsWith("E|")) {
        results.push({
          entry,
          params: JSON.stringify(params),
          desc: description,
          status: "🔴 未注册",
          time: `${elapsed}ms`,
          error: text.substring(0, 50),
          raw: text.substring(0, 100)
        });
        failCount++;
        return;
      }
      
      results.push({
        entry,
        params: JSON.stringify(params),
        desc: description,
        status: "⚠️ 解析错误",
        time: `${elapsed}ms`,
        error: `非JSON响应: ${text.substring(0, 60)}`
      });
      errorCount++;
      return;
    }
    
    // 检查错误
    if (data.Error) {
      const errCode = data.Error.ErrorCode || "";
      const errMsg = data.Error.Message || "";
      const isNotRegistered = String(errCode).includes('14042') || 
                               String(errCode).includes('-1005') ||
                               errMsg.includes('模块') ||
                               errMsg.includes('未注册');
      
      if (isNotRegistered) {
        results.push({
          entry,
          params: JSON.stringify(params),
          desc: description,
          status: errCode === -1005 ? "🟡 参数错误" : "🔴 未注册/无权限",
          time: `${elapsed}ms`,
          error: `${errCode}: ${errMsg}`
        });
        if (errCode === -1005) errorCount++; else failCount++;
      } else {
        results.push({
          entry,
          params: JSON.stringify(params),
          desc: description,
          status: "❌ 业务错误",
          time: `${elapsed}ms`,
          error: `${errCode}: ${errMsg}`
        });
        errorCount++;
      }
      return;
    }
    
    // 成功：检查数据内容
    let dataType = "Unknown";
    let recordCount = 0;
    let sample = null;
    
    if (data.ResultSets && Array.isArray(data.ResultSets)) {
      recordCount = data.ResultSets.reduce((sum, rs) => sum + (rs.Count || 0), 0);
      dataType = `ResultSets[${data.ResultSets.length}]`;
      if (data.ResultSets[0] && data.ResultSets[0].ResultSet) {
        sample = data.ResultSets[0].ResultSet[0];
      }
    } else if (data.Data && Array.isArray(data.Data)) {
      recordCount = data.Data.length;
      dataType = `Array[${recordCount}]`;
      sample = data.Data[0];
    } else if (data.result) {
      dataType = "result Object";
      sample = typeof data.result === 'object' ? 
        Object.keys(data.result).join(',') : 
        String(data.result).substring(0, 80);
    } else {
      dataType = "Object";
      sample = Object.keys(data).join(',');
    }
    
    const status = recordCount > 0 || (dataType !== "Unknown") ? "✅ 可用" : "⚠️ 空数据";
    
    results.push({
      entry,
      params: JSON.stringify(params),
      desc: description,
      status,
      time: `${elapsed}ms`,
      dataType,
      records: recordCount,
      sample: sample ? JSON.stringify(sample).substring(0, 80) : null
    });
    
    if (status === "✅ 可用") successCount++;
    else errorCount++;
    
  } catch(e) {
    results.push({
      entry,
      params: JSON.stringify(params),
      desc: description,
      status: "⚠️ 异常",
      time: `${Date.now()-start}ms`,
      error: e.message
    });
    errorCount++;
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║   tdx_api_data F10 Entry 完整权限扫描                              ║");
  console.log("║   Token: TDX-3d84119f...                                          ║");
  console.log("║   测试股票: 000001 平安银行                                          ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  console.log("🔍 正在扫描所有 F10 Entry...\n");

  // ========== 第一组：盈利预测与评级 ==========
  console.log("─── [1/8] 盈利预测与分析师评级 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001", "yzyq"], "盈利预测(一致预期)");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001", "yjyg"], "业绩预告");
  await testF10Entry("TdxSharePCCW.tdxf10_jgpj", ["000001"], "机构评级汇总");
  await testF10Entry("TdxSharePCCW.tdxf10_yzyq", ["000001"], "一致预期EPS");

  // ========== 第二组：公司基本信息 ==========
  console.log("\n─── [2/8] 公司基本信息 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "0"], "公司概要");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "1"], "发行上市");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "2"], "董监高");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "3"], "参控股公司");

  // ========== 第三组：财务数据 ==========
  console.log("\n─── [3/8] 财务报表数据 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_zb"], "财务指标(主要)");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_lrb"], "利润表");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_fzb"], "资产负债表");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_llb"], "现金流量表");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_gjjz"], "股东权益变动");

  // ========== 第四组：股本与分红 ==========
  console.log("\n─── [4/8] 股本结构与分红 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_jb"], "股本结构");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_bg"], "股本变动");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_xsjs"], "限售解禁");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001"], "分红融资");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001", "fhgx"], "分红线图");

  // ========== 第五组：股东研究 ==========
  console.log("\n─── [5/8] 股东与持股 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "gdrs"], "控股股东");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "gdgs"], "股东人数");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "sdgd"], "十大股东");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "jgcg"], "机构持股");

  // ========== 第六组：市场行为（龙虎榜/资金） ==========
  console.log("\n─── [6/8] 龙虎榜与资金流向 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001", "ztfx"], "龙虎榜-涨停分析");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001", "lhbmx"], "龙虎榜-明细");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_zljrcc", ["000001"], "主力资金-机构持仓");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_bxjxw", ["000001"], "北向资金行为");

  // ========== 第七组：热点题材与事件 ==========
  console.log("\n─── [7/8] 热点题材与事件驱动 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "zttzbkz"], "热点题材-板块族谱");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "sjcd"], "事件驱动-催化");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "rdtm"], "热点题材-主题库");
  await testF10Entry("TdxSharePCCW.tdxf10_stock_events", ["000001"], "重大事件");
  await testF10Entry("TdxSharePCCW.tdxf10_tczqcxx", ["000001"], "题材生命周期");

  // ========== 第八组：行业对比与其他 ==========
  console.log("\n─── [8/8] 行业对比与其他 ───");
  
  await testF10Entry("TdxSharePCCW.tdxf10_hy_db", ["000001"], "行业对比");
  await testF10Entry("TdxSharePCCW.tdxf10_board_valuation", ["000001"], "板块估值");
  await testF10Entry("TdxSharePCCW.tdxf10_board_cpbd", ["000001"], "板块操盘必读");
  await testF10Entry("TdxSharePCCW.tdxf10_chltz", ["000001"], "出海链投资");

  // ========== 输出报告 ==========
  console.log("\n" + "═".repeat(90));
  console.log("📊 tdx_api_data F10 Entry 完整扫描结果");
  console.log("═".repeat(90) + "\n");

  // 按状态分组
  const available = results.filter(r => r.status === "✅ 可用");
  const paramError = results.filter(r => r.status === "🟡 参数错误");
  const notRegistered = results.filter(r => r.status === "🔴 未注册/无权限");
  const otherErrors = results.filter(r => !["✅ 可用", "🟡 参数错误", "🔴 未注册/无权限"].includes(r.status));

  console.log(`📈 统计总览:`);
  console.log(`   总计测试: ${results.length} 个 Entry`);
  console.log(`   ✅ 可用: ${available.length} 个 (${(available.length/results.length*100).toFixed(1)}%)`);
  console.log(`   🟡 参数错误: ${paramError.length} 个 (${(paramError.length/results.length*100).toFixed(1)}%)`);
  console.log(`   🔴 未注册: ${notRegistered.length} 个 (${(notRegistered.length/results.length*100).toFixed(1)}%)`);
  console.log(`   ❌ 其他错误: ${otherErrors.length} 个\n`);

  // 详细列表
  if (available.length > 0) {
    console.log("═".repeat(90));
    console.log("✅ 可用的 Entry (" + available.length + "个)");
    console.log("═".repeat(90));
    available.forEach((r, i) => {
      console.log(`${i+1}. ${r.entry.padEnd(50)} ${r.time.padEnd(10)} ${r.dataType || ''}`);
      console.log(`   📄 描述: ${r.desc}`);
      console.log(`   📄 参数: ${r.params}`);
      if (r.sample) console.log(`   💾 数据: ${r.sample}...`);
      console.log("");
    });
  }

  if (paramError.length > 0) {
    console.log("═".repeat(90));
    console.log("🟡 参数错误的 Entry (" + paramError.length + "个) — 可能需要调整 fixedTag");
    console.log("═".repeat(90));
    paramError.forEach((r, i) => {
      console.log(`${i+1}. ${r.entry.padEnd(50)} ${r.time.padEnd(10)} ${r.error || ''}`);
      console.log(`   📄 描述: ${r.desc}`);
      console.log(`   📄 参数: ${r.params}`);
      console.log("");
    });
  }

  if (notRegistered.length > 0) {
    console.log("═".repeat(90));
    console.log("🔴 未注册/无权限的 Entry (" + notRegistered.length + "个)");
    console.log("═".repeat(90));
    notRegistered.forEach((r, i) => {
      console.log(`${i+1}. ${r.entry.padEnd(50)} ${r.time.padEnd(10)} ${r.error || ''}`);
      console.log(`   📄 描述: ${r.desc}`);
      console.log(`   📄 参数: ${r.params}`);
      console.log("");
    });
  }

  if (otherErrors.length > 0) {
    console.log("═".repeat(90));
    console.log("❌ 其他错误的 Entry (" + otherErrors.length + "个)");
    console.log("═".repeat(90));
    otherErrors.forEach((r, i) => {
      console.log(`${i+1}. ${r.entry.padEnd(50)} ${r.time.padEnd(10)} ${r.error || ''}`);
      console.log(`   📄 描述: ${r.desc}`);
      console.log("");
    });
  }

  // 汇总建议
  console.log("═".repeat(90));
  console.log("💡 总结与建议:");
  console.log("═".repeat(90));

  if (available.length >= 3) {
    console.log(`
  ✅ 当前 Token 至少支持以下 F10 数据模块:
     1. 盈利预测 (tdxf10_gg_ybpj) — 分析师一致预期
     2. 热点题材 (tdxf10_gg_rdtc) — 概念板块映射
     3. 事件驱动 (tdxf10_gg_rdtc-sjcd) — 催化事件列表
     ${available.length > 3 ? `及 ${available.length - 3} 个其他模块` : ''}
    `);

    console.log(`
  🎯 推荐优先使用的技能:
     - tdx-hot-topic (热点题材查询) ✅
     - tdx-fsxypmsb (反身性与泡沫识别) ✅
     - tdx-event-driven-* (事件驱动分析) ✅
     - tdx-mrtyjb (每日投研简报) ✅
    `);
  }

  if (notRegistered.length > 0) {
    console.log(`
  ⚠️ 如需使用完整的 F10 基本面数据，请联系通达信开通以下模块:
     - 财务报表 (tdxf10_gg_cwbb_*)
     - 公司详细信息 (tdxf10_gg_gsgk_*)
     - 股东持股 (tdxf10_gg_gdyj_*)
     - 分红融资 (tdxf10_gg_fhfx_*)
     等 ${notRegistered.length} 个未注册模块
    `);
  }

  if (paramError.length > 0) {
    console.log(`
  🔧 以下 Entry 返回参数错误 (-1005)，可能需要:
     1. 尝试不同的 fixedTag 值
     2. 检查参数格式是否正确
     3. 或联系通达信确认正确的调用方式
     
     涉及的 Entry:
     ${paramError.map(p => `- ${p.entry} (${p.desc})`).join('\n     ')}
    `);
  }

  console.log("\n✅ 扫描完成！");
}

main().catch(console.error);