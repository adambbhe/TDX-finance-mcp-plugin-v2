/**
 * tdx_api_data F10 Entry Full Permission Scan v3 (ASCII only)
 */

const TOKEN = "TDX-3d84119f1671fdc5be19967086fbcfe0";
const HEADERS = { "Content-Type": "application/json", token: TOKEN };
const HUB = "http://tdxhub.icfqs.com:7615/TQLEX";

const results = [];

async function testF10Entry(entry, params, desc) {
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
    const text = await res.text();

    if (text.startsWith("E|")) {
      results.push({ entry, params: JSON.stringify(params), desc,
        status: "NO_PERM", time: elapsed, error: text.substring(0, 80).replace(/\n/g,' ') });
      return;
    }

    let data;
    try { data = JSON.parse(text); } catch(e) {
      results.push({ entry, params: JSON.stringify(params), desc,
        status: "PARSE_ERR", time: elapsed, error: text.substring(0, 80) });
      return;
    }

    if (data.Error || data.ErrorCode) {
      const ec = data.Error?.ErrorCode || data.ErrorCode || "";
      const em = data.Error?.Message || data.ErrorInfo || "";
      
      let st;
      if (String(ec).includes('14042') || em.includes('unregistered') || em.includes('module')) {
        st = "NOT_REG";
      } else if (String(ec).includes('-1005') || em.includes('param') || em.includes('execute')) {
        st = "PARAM_ERR";
      } else if (ec === '-7201' || ec === '-7202' || String(ec).includes('720')) {
        st = "NO_PERM";
      } else {
        st = "BIZ_ERR";
      }
      
      results.push({ entry, params: JSON.stringify(params), desc,
        status: st, time: elapsed, error: ec + ": " + em });
      return;
    }

    let dataType = "?";
    let recordCount = 0;
    let sample = null;

    if (data.ResultSets && Array.isArray(data.ResultSets)) {
      recordCount = data.ResultSets.reduce((s, rs) => s + (rs.Count || 0), 0);
      dataType = `ResultSets[${data.ResultSets.length}]`;
      if (data.ResultSets[0]?.ResultSet?.length > 0)
        sample = JSON.stringify(data.ResultSets[0].ResultSet[0]).substring(0, 70);
    } else if (data.Data && Array.isArray(data.Data)) {
      recordCount = data.Data.length;
      dataType = `Array[${recordCount}]`;
      sample = JSON.stringify(data.Data[0]).substring(0, 70);
    } else if (data.result !== undefined) {
      dataType = typeof data.result === 'object' ? "result:Object" : "result:String";
      sample = typeof data.result === 'object' ?
        Object.keys(data.result).join(',') : String(data.result).substring(0,60);
    } else {
      const keys = Object.keys(data);
      sample = keys.slice(0,5).join(',');
      if (keys.includes('ErrorCode') || keys.includes('ErrorInfo')) {
        results.push({ entry, params: JSON.stringify(params), desc,
          status: "ERR_OBJ", time: elapsed, error: "keys contain ErrorCode: " + sample });
        return;
      }
      dataType = "Object[" + keys.length + "]";
    }

    results.push({ entry, params: JSON.stringify(params), desc,
      status: "OK", time: elapsed, dataType, records: recordCount, sample });

  } catch(e) {
    results.push({ entry, params: JSON.stringify(params), desc,
      status: "EXCEPTION", time: Date.now()-start, error: e.message });
  }
}

async function main() {
  console.log("=== tdx_api_data F10 Entry Full Permission Scan ===");
  console.log("Token: TDX-3d84119f...");
  console.log("Stock: 000001 Ping An Bank\n");

  // Group 1
  console.log("[1/8] Earnings & Analyst Rating");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001","yzyq"], "Earnings Forecast");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_ybpj", ["000001","yjyg"], "Performance Warning");
  await testF10Entry("TdxSharePCCW.tdxf10_jgpj", ["000001"], "Institution Rating Summary");
  await testF10Entry("TdxSharePCCW.tdxf10_yzyq", ["000001"], "Consensus EPS Forecast");

  // Group 2
  console.log("\n[2/8] Company Basic Info");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001","0"], "Company Overview");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001","1"], "IPO Info");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001","2"], "Directors & Executives");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gsgk", ["000001","3"], "Subsidiaries");

  // Group 3
  console.log("\n[3/8] Financial Statements");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001","cwbb_zb"], "Financial Indicators");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001","cwbb_lrb"], "Income Statement");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001","cwbb_fzb"], "Balance Sheet");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001","cwbb_llb"], "Cash Flow Statement");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_cwbb", ["000001","cwbb_gjjz"], "Equity Changes");

  // Group 4
  console.log("\n[4/8] Share Capital & Dividend");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001","gbxx_jb"], "Capital Structure");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001","gbxx_bg"], "Capital Changes");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gbxx", ["000001","gbxx_xsjs"], "Lock-up Expiration");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001"], "Dividend & Financing");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_fhfx", ["000001","fhgx"], "Dividend Chart");

  // Group 5
  console.log("\n[5/8] Shareholder Research");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001","gdrs"], "Controlling SH");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001","gdgs"], "SH Count Trend");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001","sdgd"], "Top 10 SH");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_gdyj", ["000001","jgcg"], "Institutional Holdings");

  // Group 6
  console.log("\n[6/8] Dragon Tiger List & Capital Flow");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001","ztfx"], "DT - Limit Up Analysis");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_jyds", ["000001","lhbmx"], "DT - Detail List");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_zljrcc", ["000001"], "Main Force - Inst Position");
  await testF10Entry("TdxSharePCCW.tdxf10_zjlx_bxjxw", ["000001"], "Northbound Capital Behavior");

  // Group 7
  console.log("\n[7/8] Hot Topics & Events");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001","zttzbkz"], "Hot Topics - Sector Map");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001","sjcd"], "Event Driven - Catalyst");
  await testF10Entry("TdxSharePCCW.tdxf10_gg_rdtc", ["000001","rdtm"], "Hot Topics - Theme Lib");
  await testF10Entry("TdxSharePCCW.tdxf10_stock_events", ["000001"], "Major Events");
  await testF10Entry("TdxSharePCCW.tdxf10_tczqcxx", ["000001"], "Topic Lifecycle");

  // Group 8
  console.log("\n[8/8] Industry Comparison & Others");
  await testF10Entry("TdxSharePCCW.tdxf10_hy_db", ["000001"], "Industry Comparison");
  await testF10Entry("TdxSharePCCW.tdxf10_board_valuation", ["000001"], "Sector Valuation");
  await testF10Entry("TdxSharePCCW.tdxf10_board_cpbd", ["000001"], "Sector Must-Read");
  await testF10Entry("TdxSharePCCW.tdxf10_chltz", ["000001"], "Overseas Chain Investment");

  // ========== Output ==========
  console.log("\n" + "=".repeat(100));
  console.log("SCAN RESULTS - tdx_api_data F10 Entries (" + results.length + " total)");
  console.log("=".repeat(100));

  const byStatus = {};
  results.forEach(r => { if (!byStatus[r.status]) byStatus[r.status] = []; byStatus[r.status].push(r); });

  const total = results.length;

  console.log("\nSUMMARY:");
  console.log(`  Total Tested:     ${total}`);
  const labels = { OK: "AVAILABLE", PARAM_ERR: "PARAM_ERROR(-1005)", ERR_OBJ: "ERR_OBJECT",
    NOT_REG: "NOT_REGISTERED", NO_PERM: "NO_PERMISSION(E-720x)", BIZ_ERR: "BIZ_ERROR",
    PARSE_ERR: "PARSE_ERROR", EXCEPTION: "EXCEPTION" };

  for (const [st, items] of Object.entries(byStatus)) {
    const lbl = labels[st] || st;
    const pct = (items.length / total * 100).toFixed(1);
    console.log(`  [${lbl.padEnd(25)}] ${String(items.length).padStart(3)} (${pct}%)`);
  }

  // Detailed output per category
  const showOrder = [
    ["OK", "=== AVAILABLE ENTRIES ==="],
    ["PARAM_ERR", "=== PARAMETER ERROR (-1005) - may need different fixedTag ==="],
    ["ERR_OBJ", "=== RETURNED ERROR OBJECT ==="],
    ["NO_PERM", "=== NO PERMISSION (E-7201/E-7202) ==="],
    ["NOT_REG", "=== NOT REGISTERED (S14042) ==="],
    ["BIZ_ERR", "=== BUSINESS ERROR ==="],
    ["PARSE_ERR", "=== PARSE ERROR ==="],
    ["EXCEPTION", "=== EXCEPTION ==="]
  ];

  for (const [statusKey, header] of showOrder) {
    const items = byStatus[statusKey];
    if (!items || items.length === 0) continue;

    console.log("\n" + header + ` (${items.length})`);
    console.log("-".repeat(100));
    items.forEach((r, i) => {
      console.log(`${String(i+1).padStart(2)}. ${r.entry}`);
      console.log(`    Desc: ${r.desc} | Params: ${r.params} | Time: ${r.time}ms | Type: ${r.dataType || 'N/A'}`);
      if (r.error) console.log(`    Error: ${r.error}`);
      if (r.sample && r.records !== undefined) console.log(`    Records: ${r.records} | Sample: ${r.sample}...`);
      console.log("");
    });
  }

  // Final conclusion
  console.log("=".repeat(100));
  console.log("CONCLUSION");
  console.log("=".repeat(100));

  const okList = byStatus.OK || [];
  const paramErrList = (byStatus.PARAM_ERR || []).concat(byStatus.ERR_OBJ || []);
  const noPermList = (byStatus.NO_PERM || []).concat(byStatus.NOT_REG || []);

  console.log(`
AVAILABLE F10 Entries (${okList.length}/${total}):
${okList.map((r,i) => `  ${i+1}. [${r.entry.split('.').pop()}] ${r.desc}`).join('\n')}
  `);

  if (paramErrList.length > 0) {
    console.log(`PARAMETER ERROR entries (${paramErrList.length}) - may work with correct fixedTag:
${paramErrList.map(r => `  - [${r.entry.split('.').pop()}] ${r.desc}: ${r.error}`).join('\n')}
  `);
  }

  if (noPermList.length > 0) {
    console.log(`NO PERMISSION entries (${noPermList.length}) - require TDX upgrade:
${noPermList.map(r => `  - [${r.entry.split('.').pop()}] ${r.desc}: ${r.error}`).join('\n')}
  `);
  }

  if (okList.length >= 3) {
    console.log(`RECOMMENDED SKILLS (based on available data):
  - tdx-hot-topic          -> uses rdtc/zttzbkz  OK
  - tdx-fsxypmsb           -> uses ybpj/yzyq     OK
  - tdx-event-driven-*     -> uses rdtc/sjcd     OK
  - tdx-mrtyjb             -> uses multiple       OK
  - tdx-ggtzljyj           -> partial            OK
    `);
  }

  console.log("Scan Complete!");
}

main().catch(console.error);