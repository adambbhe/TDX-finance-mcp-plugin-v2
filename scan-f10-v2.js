/**
 * tdx_api_data 完整 F10 Entry 权限扫描 v2
 * 修复 Body 重复读取问题
 */

const TOKEN = "TDX-3d84119f1671fdc5be19967086fbcfe0";
const HEADERS = { "Content-Type": "application/json", token: TOKEN };
const HUB = "http://tdxhub.icfqs.com:7615/TQLEX";

const results = [];

async function testF10Entry(entry, params, desc = "") {
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
    const text = await res.text(); // 先读取为文本
    
    // 检查是否是 E| 格式的错误
    if (text.startsWith("E|")) {
      results.push({ entry, params: JSON.stringify(params), desc,
        status: "🔴 未注册/无权限", time: `${elapsed}ms`,
        error: text.substring(0, 80).replace(/\n/g, ' ') });
      return;
    }
    
    // 解析 JSON
    let data;
    try { data = JSON.parse(text); } catch(e) {
      results.push({ entry, params: JSON.stringify(params), desc,
        status: "⚠️ 非JSON响应", time: `${elapsed}ms`,
        error: text.substring(0, 80) });
      return;
    }
    
    // 检查 Error 字段
    if (data.Error || data.ErrorCode) {
      const errCode = data.Error?.ErrorCode || data.ErrorCode || "";
      const errMsg = data.Error?.Message || data.ErrorInfo || "";
      
      // 判断错误类型
      let status;
      if (String(errCode).includes('14042') || errMsg.includes('未注册') || errMsg.includes('模块不存在')) {
        status = "🔴 未注册";
      } else if (String(errCode).includes('-1005') || errMsg.includes('参数')) {
        status = "🟡 参数错误(-1005)";
      } else if (errCode === '-7201' || errCode === '-7202') {
        status = "🔴 无权限(E-" + errCode + ")";
      } else {
        status = "❌ 错误:" + String(errCode);
      }
      
      results.push({ entry, params: JSON.stringify(params), desc,
        status, time: `${elapsed}ms`, error: `${errCode}: ${errMsg}` });
      return;
    }
    
    // 成功：分析数据结构
    let dataType = "Unknown";
    let recordCount = 0;
    let sample = null;
    
    if (data.ResultSets && Array.isArray(data.ResultSets)) {
      recordCount = data.ResultSets.reduce((s, rs) => s + (rs.Count || 0), 0);
      dataType = `ResultSets[${data.ResultSets.length}]`;
      if (data.ResultSets[0]?.ResultSet?.length > 0) {
        sample = data.ResultSets[0].ResultSet[0];
      }
    } else if (data.Data && Array.isArray(data.Data)) {
      recordCount = data.Data.length;
      dataType = `Array[${recordCount}]`;
      sample = data.Data[0];
    } else if (data.result !== undefined) {
      dataType = typeof data.result === 'object' ? "result:Object" : "result:String";
      sample = typeof data.result === 'object' ? 
        Object.keys(data.result).join(',') : String(data.result).substring(0,60);
    } else {
      dataType = "Object";
      const keys = Object.keys(data);
      sample = keys.slice(0,5).join(',');
      // 如果包含 ErrorCode/ErrorInfo 说明实际是错误
      if (keys.includes('ErrorCode') || keys.includes('ErrorInfo')) {
        results.push({ entry, params: JSON.stringify(params), desc,
          status: "🟡 返回含错误码的对象", time: `${elapsed}ms`,
          error: `keys: ${sample}`, sample: null });
        return;
      }
    }
    
    results.push({
      entry, params: JSON.stringify(params), desc,
      status: "✅ 可用",
      time: `${elapsed}ms`, dataType, records: recordCount,
      sample: sample ? JSON.stringify(sample).substring(0, 80) : sample
    });

  } catch(e) {
    results.push({ entry, params: JSON.stringify(params), desc,
      status: "⚠️ 异常", time: `${Date.now()-start}ms`, error: e.message });
  }
}

async function main() {
  console.log("=== tdx_api_data F10 Entry Full Permission Scan ===");
  console.log("Token: TDX-3d84119f...");
  console.log("Stock: 000001 Ping An Bank\n");

  // ========== Group 1: Earnings & Rating ==========
  console.log("[1/8] Earnings & Analyst Rating");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001", "yzyq"], "Earnings Forecast");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001", "yjyg"], "Performance Warning");
  await testF10Entry("TdxSharePCCW.tdxf10_jgpj", ["000001"], "Institution Rating Summary");
  await testF10Entry("TdxSharePCCW.tdxf10_yzyq", ["000001"], "Consensus EPS Forecast");

  // ========== Group 2: Company Basic Info ==========
  console.log("\n[2/8] Company Basic Info");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "0"], "Company Overview");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "1"], "IPO Info");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "2"], "Directors & Executives");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001", "3"], "Subsidiaries");

  // ========== Group 3: Financial Statements ==========
  console.log("\n[3/8] Financial Statements");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_zb"], "Financial Indicators");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_lrb"], "Income Statement");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_fzb"], "Balance Sheet");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_llb"], "Cash Flow Statement");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001", "cwbb_gjjz"], "Equity Changes");

  // ========== Group 4: Share Capital & Dividend ==========
  console.log("\n[4/8] Share Capital & Dividend");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_jb"], "Capital Structure");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_bg"], "Capital Changes");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001", "gbxx_xsjs"], "Lock-up Expiration");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001"], "Dividend & Financing");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001", "fhgx"], "Dividend Chart");

  // ========== Group 5: Shareholder Research ==========
  console.log("\n[5/8] Shareholder Research");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "gdrs"], "Controlling Shareholder");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "gdgs"], "Shareholder Count");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "sdgd"], "Top 10 Shareholders");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001", "jgcg"], "Institutional Holdings");

  // ========== Group 6: Dragon Tiger List & Capital Flow ==========
  console.log("\n[6/8] Dragon Tiger List & Capital Flow");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001", "ztfx"], "Dragon Tiger - Limit Up Analysis");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001", "lhbmx"], "Dragon Tiger - Detail");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_zljrcc", ["000001"], "Main Force - Institution Position");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_bxjxw", ["000001"], "Northbound Capital Behavior");

  // ========== Group 7: Hot Topics & Events ==========
  console.log("\n[7/8] Hot Topics & Event Driven");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "zttzbkz"], "Hot Topics - Sector Map");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "sjcd"], "Event Driven - Catalyst");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001", "rdtm"], "Hot Topics - Theme Library");
  await testF10Entry("TdxSharePCCW.tdxf10_stock_events", ["000001"], "Major Events");
  await testF10Entry("TdxSharePCCW.tdxf10_tczqcxx", ["000001"], "Topic Lifecycle");

  // ========== Group 8: Industry & Others ==========
  console.log("\n[8/8] Industry Comparison & Others");
  await testF10Entry("TdxSharePCCW.tdxf10_hy_db", ["000001"], "Industry Comparison");
  await testF10Entry("TdxSharePCCW.tdxf10_board_valuation", ["000001"], "Sector Valuation");
  await testF10Entry("TdxSharePCCW.tdxf10_board_cpbd", ["000001"], "Sector Must-Read");
  await testF10Entry("TdxSharePCCW.tdxf10_chltz", ["000001"], "Overseas Chain Investment");

  // ========== Output Report ==========
  console.log("\n" + "=".repeat(95));
  console.log("tdx_api_data F10 Entry Complete Scan Results");
  console.log("=".repeat(95) + "\n");

  const groups = {};
  results.forEach(r => {
    if (!groups[r.status]) groups[r.status] = [];
    groups[r.status].push(r);
  });

  const total = results.length;

  console.log(`Summary:`);
  console.log(`  Total Tested: ${total} Entries`);
  for (const [status, items] of Object.entries(groups)) {
    console.log(`  ${status}: ${items.length} (${(items.length/total*100).toFixed(1)}%)`);
  }

  // Detailed list by category
  const order = ["✅ 可用", "🟡 参数错误(-1005)", "🟡 返回含错误码的对象", "🔴 无权限(E-", "🔴 未注册", "❌ 错误:", "⚠️ 非JSON响应", "⚠️ 异常"];

  for (const prefix of order) {
    const matching = results.filter(r => r.status.startsWith(prefix.split('(')[0].trim()));
    if (matching.length === 0) continue;
    
    console.log(`\n${"-".repeat(95)}`);
    console.log(`${prefix} (${matching.length})`);
    console.log("-".repeat(95));
    
    matching.forEach((r, i) => {
      console.log(`${i+1}. ${r.entry}`);
      console.log(`   Desc: ${r.desc} | Params: ${r.params} | Time: ${r.time} | Type: ${r.dataType || ''}`);
      if (r.error) console.log(`   Error: ${r.error}`);
      if (r.sample && r.records !== undefined) console.log(`   Records: ${r.records} | Sample: ${r.sample}...`);
      console.log("");
    });
  }

  // Final summary
  console.log("=".repeat(95));
  console.log("CONCLUSION & RECOMMENDATIONS");
  console.log("=".repeat(95));

  const ok = groups["✅ 可用"] || [];
  const paramErr = (groups["🟡 参数错误(-1005)] || []).concat(groups["🟡 返回含错误码的对象"] || []);
  const noPerm = (groups["🔴 无权限(E-"] || []).concat(groups["🔴 未注册"] || []);
  const otherErr = [];

  for (const [k,v] of Object.entries(groups)) {
    if (!["✅ 可用","🟡 参数错误(-1005)","🟡 返回含错误码的对象","🔴 无权限(E-","🔴 未注册"].includes(k)) {
      otherErr.push(...v);
    }
  }

  console.log(`
AVAILABLE (${ok.length}/${total}):
${ok.map((r,i) => `  ${i+1}. [${r.entry}] ${r.desc}`).join('\n')}

PARAMETER ERROR - may need different fixedTag (${paramErr.length}):
${paramErr.map(r => `  - [${r.entry}] ${r.desc} -> ${r.error}`).join('\n')}

NO PERMISSION / NOT REGISTERED (${noPerm.length}):
${noPerm.map(r => `  - [${r.entry}] ${r.desc} -> ${r.error}`).join('\n')}
  `);

  if (ok.length >= 3) {
    console.log(`
RECOMMENDED SKILLS TO USE (based on available F10 data):
  - tdx-hot-topic (Hot Topics Query) -- uses rdtc/zttzbkz OK
  - tdx-fsxypmsb (Reflexivity Analysis) -- uses ybpj/yzyq OK
  - tdx-event-driven-* (Event Analysis) -- uses rdtc/sjcd OK
  - tdx-mrtyjb (Daily Research Briefing) -- uses multiple OK
  - tdx-ggtzljyj (Stock Investment Logic) -- partial OK
    `);
  }

  if (noPerm.length > 0) {
    console.log(`
TO UNLOCK MORE DATA, contact TDX to enable:
  - Financial statements (tdxf10_gg_cwbb_*)
  - Detailed company info (tdxf10_gg_gsgk_*)
  - Shareholder details (tdxf10_gg_gdyj_*)
  - Dividend history (tdxf10_gg_fhfx_*)
  And ${noPerm.length} more modules
    `);
  }

  console.log("\nScan Complete!");
}

main().catch(console.error);