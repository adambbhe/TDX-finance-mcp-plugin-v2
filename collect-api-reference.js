/**
 * TDX MCP Plugin - Complete API Reference Data Collector
 * 获取9个工具的完整返回数据结构，用于生成Excel参考手册
 */

const TOKEN = "TDX-3d84119f1671fdc5be19967086fbcfe0";
const HEADERS = { "Content-Type": "application/json", token: TOKEN };

async function fetchJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  return await res.json();
}

function analyzeStructure(data, prefix = "", depth = 0) {
  if (depth > 5) return [{ path: prefix + "(max depth)", type: "...", example: "..." }];
  
  const results = [];
  
  if (data === null || data === undefined) {
    results.push({ path: prefix, type: "null", example: "null" });
  } else if (Array.isArray(data)) {
    if (data.length === 0) {
      results.push({ path: prefix, type: "Array[0]", example: "[]" });
    } else {
      const sample = data[0];
      results.push({ 
        path: prefix, 
        type: `Array[${data.length}]`, 
        example: `[${data.length} items]`,
        itemType: Array.isArray(sample) ? "Array" : typeof sample === 'object' ? "Object" : typeof sample
      });
      if (typeof sample === 'object' && sample !== null && depth < 4) {
        results.push(...analyzeStructure(sample, `${prefix}[0]`, depth + 1));
      }
    }
  } else if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (val === null || val === undefined) {
        results.push({ path, type: "null", example: "null" });
      } else if (Array.isArray(val)) {
        if (val.length === 0) {
          results.push({ path, type: "Array[0]", example: "[]" });
        } else {
          const sample = val[0];
          results.push({ 
            path, 
            type: `Array[${val.length}]`, 
            example: Array.isArray(sample) ? `[nested array, ${val.length} items]` : 
                   typeof sample === 'object' ? `[${val.length} objects]` : 
                   `[${val.length} ${typeof sample}s]`
          });
          if ((typeof sample === 'object' && sample !== null) && depth < 3 && val.length > 0) {
            results.push(...analyzeStructure(sample, `${path}[0]`, depth + 1));
          }
        }
      } else if (typeof val === 'object') {
        results.push({ path, type: "Object", example: `{...}` });
        if (depth < 3) {
          results.push(...analyzeStructure(val, path, depth + 1));
        }
      } else {
        const strVal = String(val);
        const example = strVal.length > 50 ? strVal.substring(0, 47) + "..." : strVal;
        results.push({ path, type: typeof val, example: example });
      }
    }
  } else {
    const strVal = String(data);
    results.push({ path: prefix, type: typeof data, example: strVal.length > 50 ? strVal.substring(0, 47) + "..." : strVal });
  }
  
  return results;
}

function formatFields(fields) {
  return fields.map(f => `${f.path} | ${f.type} | ${f.example}`).join("\n  ");
}

// Store all results
const apiReference = [];

async function collectTool1_Quotes() {
  console.log("[1/9] Collecting tdx_quotes - Real-time Quotes...");
  
  const url = "http://tdxhub.icfqs.com:7615/TQLEX?Entry=TdxShare.PBHQInfo";
  const body = {
    Head: { Target: "0", CharSet: "UTF8" },
    Code: "000001",
    Setcode: "0",
    HasHQInfo: "1",
    HasExtInfo: "0"
  };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_quotes",
    name: "Real-time Market Quotes",
    entry: "TdxShare.PBHQInfo",
    server: "TDX Hub",
    endpoint: "http://tdxhub.icfqs.com:7615/TQLEX",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? `${data.Error.ErrorCode}: ${data.Error.Message}` : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 3000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

async function collectTool2_Kline() {
  console.log("[2/9] Collecting tdx_kline - K-line Data...");
  
  const url = "http://tdxhub.icfqs.com:7615/TQLEX?Entry=TdxShare.PBFXT";
  const body = {
    Head: { Target: 0, CharSet: "UTF8" },
    Code: "000001",
    Setcode: 0,
    Period: 4,
    Startxh: 0,
    WantNum: 5,
    TQFlag: 11
  };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_kline",
    name: "K-line Historical Data",
    entry: "TdxShare.PBFXT",
    server: "TDX Hub",
    endpoint: "http://tdxhub.icfqs.com:7615/TQLEX",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? `${data.Error.ErrorCode}: ${data.Error.Message}` : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 3000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

async function collectTool3_Lookup() {
  console.log("[3/9] Collecting tdx_lookup_stock - RAG Entity Search...");
  
  const url = "https://ai.icfqs.com:8965/v1/rag-entity-retrieve";
  const body = { query: "平安银行", range: "AG" };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_lookup_stock",
    name: "Stock Code/Name RAG Search",
    entry: "rag-entity-retrieve",
    server: "AI RAG",
    endpoint: "https://ai.icfqs.com:8965/v1/rag-entity-retrieve",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? JSON.stringify(data.Error) : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 3000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

async function collectTool4_Screener() {
  console.log("[4/9] Collecting tdx_screener - Smart Stock Screening...");
  
  const url = "http://tdxhub.icfqs.com:7615/TQLEX?Entry=JNLPSE:wendaQuery";
  const body = [{
    message: "涨停",
    rang: "AG",
    pageNo: "1",
    pageSize: "5"
  }];
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_screener",
    name: "Natural Language Smart Screening",
    entry: "JNLPSE:wendaQuery",
    server: "TDX Hub",
    endpoint: "http://tdxhub.icfqs.com:7615/TQLEX",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? `${data.Error.ErrorCode}: ${data.Error.Message}` : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 3000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

async function collectTool5_Indicator() {
  console.log("[5/9] Collecting tdx_indicator_select - Financial Indicator Selection...");
  
  const url = "http://tdxhub.icfqs.com:7615/TQLEX?Entry=NLPSE:InfoSelectV2";
  const body = { message: "平安银行基本面指标", rang: "AG" };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_indicator_select",
    name: "Financial Indicator Query & Selection",
    entry: "NLPSE:InfoSelectV2",
    server: "TDX Hub",
    endpoint: "http://tdxhub.icfqs.com:7615/TQLEX",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? `${data.Error.ErrorCode}: ${data.Error.Message}` : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 3000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

async function collectTool6_News() {
  console.log("[6/9] Collecting wenda_news_query - News Search...");
  
  const url = "https://www.tdx.com.cn/wenda/api/tools/zx_query";
  const body = { query: "低空经济政策" };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "wenda_news_query",
    name: "Financial News / Flash News Search",
    entry: "zx_query",
    server: "Wenda Platform",
    endpoint: "https://www.tdx.com.cn/wenda/api/tools/zx_query",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? JSON.stringify(data.Error) : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 2000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}, size: ${JSON.stringify(data).length} bytes`);
}

async function collectTool7_Report() {
  console.log("[7/9] Collecting wenda_report_query - Research Report Search...");
  
  const url = "https://www.tdx.com.cn/wenda/api/tools/yb_query";
  const body = { query: "宁德时代" };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "wenda_report_query",
    name: "Broker Research Report Search",
    entry: "yb_query",
    server: "Wenda Platform",
    endpoint: "https://www.tdx.com.cn/wenda/api/tools/yb_query",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? JSON.stringify(data.Error) : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 2000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}, size: ${JSON.stringify(data).length} bytes`);
}

async function collectTool8_Notice() {
  console.log("[8/9] Collecting wenda_notice_query - Company Announcement Search...");
  
  const url = "https://www.tdx.com.cn/wenda/api/tools/gg_search";
  const body = { query: "分红" };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "wenda_notice_query",
    name: "Company Announcement / Report Search",
    entry: "gg_search",
    server: "Wenda Platform",
    endpoint: "https://www.tdx.com.cn/wenda/api/tools/gg_search",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? JSON.stringify(data.Error) : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 2000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}, size: ${JSON.stringify(data).length} bytes`);
}

async function collectTool9_F10() {
  console.log("[9/9] Collecting tdx_api_data - F10 Fundamental Data (ybpj)...");
  
  const url = "http://tdxhub.icfqs.com:7615/TQLEX?Entry=TdxSharePCCW.tdxf10_gg_ybpj";
  const body = { Params: ["000001", "yzyq"] };
  
  const data = await fetchJSON(url, body);
  const fields = analyzeStructure(data);
  
  apiReference.push({
    tool: "tdx_api_data",
    name: "Unified F10 API (Earnings Forecast Example)",
    entry: "TdxSharePCCW.tdxf10_gg_ybpj",
    server: "TDX Hub",
    endpoint: "http://tdxhub.icfqs.com:7615/TQLEX",
    method: "POST",
    requestFormat: JSON.stringify(body, null, 2),
    responseStatus: data.Error ? "ERROR" : "OK",
    error: data.Error ? `${data.Error.ErrorCode}: ${data.Error.Message}` : null,
    fields: formatFields(fields),
    rawData: JSON.stringify(data, null, 2).substring(0, 5000)
  });
  
  console.log(`  -> OK, fields: ${fields.length}`);
}

// Generate Excel-compatible CSV output
function generateCSV() {
  let csv = "";
  
  // Header
  csv += "Tool ID,Tool Name,Entry Name,Server,Endpoint URL,Method,Request Body Sample,Response Status,Error Info,Data Structure (Path | Type | Example),Raw Data Preview\n";
  
  // Data rows
  for (const item of apiReference) {
    // Escape CSV fields
    const escape = (s) => {
      if (!s) return '';
      const str = String(s).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };
    
    csv += [
      escape(item.tool),
      escape(item.name),
      escape(item.entry),
      escape(item.server),
      escape(item.endpoint),
      escape(item.method),
      escape(item.requestFormat?.replace(/\n/g, ' ').substring(0, 200)),
      escape(item.responseStatus),
      escape(item.error || ''),
      escape(item.fields?.replace(/\n/g, ' | ')?.substring(0, 500)),
      escape(item.rawData?.replace(/\n/g, ' ')?.substring(0, 500))
    ].join(',') + '\n';
  }
  
  return csv;
}

// Main
async function main() {
  console.log("================================================================");
  console.log(" TDX Finance MCP - Complete API Reference Data Collector");
  console.log(` Time: ${new Date().toLocaleString('zh-CN')}`);
  console.log("================================================================\n");

  try {
    await collectTool1_Quotes();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool2_Kline();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool3_Lookup();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool4_Screener();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool5_Indicator();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool6_News();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool7_Report();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool8_Notice();
    await new Promise(r => setTimeout(r, 300));
    
    await collectTool9_F10();
    
  } catch(e) {
    console.error("Collection error:", e.message);
  }

  // Output results
  console.log("\n================================================================");
  console.log(" COLLECTION COMPLETE - " + apiReference.length + " tools collected");
  console.log("================================================================\n");

  // Output as JSON for further processing
  const fs = await import('fs');
  const outputPath = './api-reference-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(apiReference, null, 2), 'utf-8');
  console.log(`Full data saved to: ${outputPath}`);

  // Output CSV for Excel
  const csv = generateCSV();
  const csvPath = './api-reference.csv';
  fs.writeFileSync(csvPath, csv, 'utf-8');
  console.log(`CSV saved to: ${csvPath} (open with Excel)`);

  // Print summary table
  console.log("\n┌────┬─────────────────┬──────────────────────────┬──────┬─────────┐");
  console.log("│ #  │ Tool            │ Entry                     │Server│ Status  │");
  console.log("├────┼─────────────────┼──────────────────────────┼──────┼─────────┤");
  
  for (let i = 0; i < apiReference.length; i++) {
    const item = apiReference[i];
    console.log(`│${String(i+1).padStart(3)}│ ${item.tool.padEnd(16)}│ ${(item.entry||'').padEnd(25)}│${item.server.padEnd(5)}│${(item.responseStatus||'?').padEnd(8)}│`);
  }
  
  console.log("└────┴─────────────────┴──────────────────────────┴──────┴─────────┘");
}

main().catch(console.error);