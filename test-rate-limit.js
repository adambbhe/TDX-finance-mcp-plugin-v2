/**
 * TDX API - Rate Limit, Auth Expiry & Concurrency Test
 * 检查: Token过期、并发限制、调用频率限制
 */

const TOKEN = "TDX-3d84119f1671fdc5be19967086fbcfe0";
const HEADERS = { "Content-Type": "application/json", token: TOKEN };
const HUB = "http://tdxhub.icfqs.com:7615/TQLEX";

// Simple request helper
async function apiCall(entry, body, label = "") {
  const start = Date.now();
  try {
    const res = await fetch(`${HUB}?Entry=${entry}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    
    let data;
    try { data = JSON.parse(text); } catch { return { status: res.status, elapsed, raw: text.substring(0, 100), error: "parse_fail" }; }
    
    if (data.Error) {
      return { status: res.status, elapsed, error: `${data.Error.ErrorCode || ''}: ${data.Error.Message || ''}`, isAuthErr: String(data.Error.ErrorCode).includes('auth') || String(data.Error.ErrorCode).includes('token') || String(data.Error.ErrorCode).includes('expire') };
    }
    
    // Check for rate limit indicators
    const jsonStr = text.toLowerCase();
    const isRateLimited = jsonStr.includes('rate') || jsonStr.includes('limit') || jsonStr.includes('too many') || 
                          jsonStr.includes('frequency') || jsonStr.includes('throttl') ||
                          res.status === 429 || res.status === 503;
    
    return { status: res.status, elapsed, dataSize: text.length, hasData: true, isRateLimited };
  } catch(e) {
    return { status: 0, elapsed: Date.now()-start, error: e.message, isConnError: true };
  }
}

// Test 1: Auth validity over time
async function testAuthValidity() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 1: Token Authentication Validity (5 sequential calls)");
  console.log("=".repeat(80));
  
  const results = [];
  for (let i = 1; i <= 5; i++) {
    const r = await apiCall("TdxShare.PBHQInfo", {
      Head: { Target: "0", CharSet: "UTF8" },
      Code: "000001", Setcode: "0", HasHQInfo: "1"
    }, `Call #${i}`);
    results.push(r);
    console.log(`  Call #${i}: HTTP ${r.status} | ${r.elapsed}ms | ${r.error || (r.hasData ? 'OK (' + r.dataSize + ' bytes)' : 'N/A')} ${r.isRateLimited ? '[RATE LIMITED]' : ''}`);
    
    if (i < 5) {
      // Small delay between calls
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  const authErrors = results.filter(r => r.isAuthErr);
  if (authErrors.length > 0) {
    console.log("\n  >> WARNING: Authentication errors detected!");
    authErrors.forEach(r => console.log(`     ${r.error}`));
  } else {
    console.log("\n  >> OK: No authentication errors in 5 sequential calls");
  }
  
  return results;
}

// Test 2: Concurrency test
async function testConcurrency(maxConcurrent = 10) {
  console.log("\n" + "=".repeat(80));
  console.log(`TEST 2: Concurrency Limit Test (${maxConcurrent} simultaneous requests)`);
  console.log("=".repeat(80));
  
  const startTime = Date.now();
  
  // Fire all requests at once
  const promises = Array.from({ length: maxConcurrent }, (_, i) =>
    apiCall("TdxShare.PBFXT", {
      Head: { Target: 0, CharSet: "UTF8" },
      Code: "000001", Setcode: 0, Period: 4, WantNum: 3
    }, `Conc#${i+1}`)
  );
  
  const results = await Promise.allSettled(promises);
  const totalTime = Date.now() - startTime;
  
  let success = 0, fail = 0, rateLimited = 0, connError = 0;
  
  results.forEach((r, i) => {
    const val = r.status === 'fulfilled' ? r.value : { error: r.reason?.message, elapsed: 0, isConnError: true };
    
    if (val.isConnError) { connError++; console.log(`  [${i+1}] CONN_ERROR: ${val.error}`); }
    else if (val.isRateLimited) { rateLimited++; console.log(`  [${i+1}] RATE_LIMITED: HTTP ${val.status} | ${val.elapsed}ms`); }
    else if (val.error && !val.hasData) { fail++; console.log(`  [${i+1}] ERROR: ${val.error}`); }
    else { success++; console.log(`  [${i+1}] OK: HTTP ${val.status} | ${val.elapsed}ms | ${val.dataSize} bytes`); }
  });
  
  console.log(`\n  Results in ${totalTime}ms:`);
  console.log(`    Success:      ${success}/${maxConcurrent}`);
  console.log(`    Failed:       ${fail}/${maxConcurrent}`);
  console.log(`    Rate Limited: ${rateLimited}/${maxConcurrent}`);
  console.log(`    Conn Error:   ${connError}/${maxConcurrent}`);
  console.log(`    Avg per req:  ${(totalTime/maxConcurrent).toFixed(0)}ms`);
  
  if (rateLimited > 0 || fail > maxConcurrent * 0.3) {
    console.log("\n  >> LIKELY: Has concurrency or rate limit (~" + success + " max concurrent)");
  } else {
    console.log("\n  >> OK: Handles " + maxConcurrent + " concurrent requests fine");
  }
  
  return { success, fail, rateLimited, connError, totalTime };
}

// Test 3: Rapid fire / frequency test
async function testRapidFire(count = 20, intervalMs = 100) {
  console.log("\n" + "=".repeat(80));
  console.log(`TEST 3: Rate Limit / Frequency Test (${count} calls, ${intervalMs}ms interval)`);
  console.log("=".repeat(80));
  console.log(`  Pattern: Call -> wait ${intervalMs}ms -> Call -> ... (${count} times)\n`);
  
  const results = [];
  const errors = [];
  let prevElapsed = 0;
  
  for (let i = 1; i <= count; i++) {
    const r = await apiCall("TdxShare.PBHQInfo", {
      Head: { Target: "0", CharSet: "UTF8" },
      Code: "000001", Setcode: "0", HasHQInfo: "1"
    }, `RF#${i}`);
    
    results.push(r);
    
    const marker = r.error ? 'ERR' : (r.isRateLimited ? 'RL' : 'OK');
    const delta = i > 1 ? r.elapsed - prevElapsed : 0;
    
    console.log(`  [#${String(i).padStart(2)}] ${marker.padEnd(4)} ${String(r.elapsed).padStart(5)}ms | delta:${String(delta > 0 ? '+' + delta : delta).padStart(6)}ms | ${r.error || (r.hasData ? r.dataSize + 'b' : '-')}`);
    
    if (r.error && !r.isAuthErr) errors.push({ call: i, error: r.error, elapsed: r.elapsed });
    if (r.isAuthErr) errors.push({ call: i, error: "[AUTH] " + r.error, elapsed: r.elapsed });
    
    prevElapsed = r.elapsed;
    
    if (i < count) await new Promise(r => setTimeout(r, intervalMs));
  }
  
  const okCount = results.filter(r => !r.error && r.hasData).length;
  const errCount = errors.length;
  
  console.log(`\n  Summary: ${okCount}/${count} OK, ${errCount} errors`);
  
  if (errCount > 0) {
    console.log("\n  Errors detected:");
    errors.forEach(e => console.log(`    Call #${e.call}: ${e.error} (${e.elapsed}ms)`));
    
    // Analyze pattern
    if (errors.every(e => e.call > 5)) {
      console.log("\n  >> PATTERN: Errors appear after ~5 rapid calls -> likely rate limited after N calls/second");
    } else if (errors.some(e => e.error.includes('429') || e.error.includes('503'))) {
      console.log("\n  >> PATTERN: HTTP 429/503 responses -> explicit rate limiting");
    } else if (errors.some(e => e.error.includes('-7201') || e.error.includes('-7202'))) {
      console.log("\n  >> PATTERN: E-720x errors -> permission/module errors (not rate limit)");
    }
  } else {
    console.log("\n  >> OK: No rate limiting detected at ~" + (1000/intervalMs).toFixed(0) + " calls/sec");
  }
  
  // Response time analysis
  const times = results.filter(r => !r.isConnError).map(r => r.elapsed);
  if (times.length > 0) {
    const avg = times.reduce((a,b) => a+b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    console.log(`\n  Response Time Stats:`);
    console.log(`    Avg: ${avg.toFixed(0)}ms | Min: ${min}ms | Max: ${max}ms`);
    if (max > avg * 3) {
      console.log("    >> WARNING: Max response time is 3x+ average -> possible throttling on some requests");
    }
  }
  
  return { okCount, errCount, errors };
}

// Test 4: Different server endpoints
async function testServerEndpoints() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 4: All Server Endpoints Status");
  console.log("=".repeat(80));

  const tests = [
    { name: "TDX Hub (quotes)", url: `${HUB}?Entry=TdxShare.PBHQInfo`, body: { Head:{Target:"0",CharSet:"UTF8"},Code:"000001",Setcode:"0",HasHQInfo:"1" } },
    { name: "TDX Hub (kline)", url: `${HUB}?Entry=TdxShare.PBFXT`, body: { Head:{Target:0,CharSet:"UTF8"},Code:"000001",Setcode:0,Period:4,WantNum:3 } },
    { name: "TDX Hub (ybpj)", url: `${HUB}?Entry=TdxSharePCCW.tdxf10_gg_ybpj`, body: { Params:["000001","yzyq"] } },
    { name: "AI RAG", url: "https://ai.icfqs.com:8965/v1/rag-entity-retrieve", body: { query: "平安银行", range: "AG" } },
    { name: "Wenda News", url: "https://www.tdx.com.cn/wenda/api/tools/zx_query", body: { query: "低空经济" } },
    { name: "Wenda Report", url: "https://www.tdx.com.cn/wenda/api/tools/yb_query", body: { query: "宁德时代" } },
    { name: "Wenda Notice", url: "https://www.tdx.com.cn/wenda/api/tools/gg_search", body: { query: "分红" } },
  ];

  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await fetch(t.url, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify(t.body),
        signal: AbortSignal.timeout(8000)
      });
      const elapsed = Date.now() - start;
      const text = await res.text();
      
      let statusIcon = "?";
      let detail = "";
      
      if (text.startsWith("E|")) {
        statusIcon = "BLOCK";
        detail = text.substring(0, 60);
      } else {
        try {
          const d = JSON.parse(text);
          if (d.Error) {
            statusIcon = d.Error.ErrorCode === '-7202' ? "NO_PERM" : "ERR";
            detail = d.Error.ErrorCode + ": " + (d.Error.Message||"").substring(0,40);
          } else {
            statusIcon = "OK";
            detail = text.length + " bytes";
          }
        } catch {
          statusIcon = "OK";
          detail = text.length + " bytes (raw)";
        }
      }
      
      console.log(`  [${statusIcon.padEnd(7)}] ${t.name.padEnd(20)} ${String(elapsed).padStart(5)}ms | HTTP ${res.status} | ${detail}`);
    } catch(e) {
      console.log(`  [FAIL    ] ${t.name.padEnd(20)} ${String(Date.now()-start).padStart(5)}ms | ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
}

// Test 5: Invalid/expired token simulation
async function testInvalidToken() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 5: Invalid Token Response Format (for reference)");
  console.log("=".repeat(80));
  
  const badTokens = [
    { token: "", label: "Empty Token" },
    { token: "INVALID-TOKEN-TEST", label: "Invalid Format" },
    { token: "TDX-00000000000000000000000000000", label: "Valid Format Wrong Key" },
  ];
  
  for (const bt of badTokens) {
    const headers = { ...HEADERS, token: bt.token };
    const start = Date.now();
    try {
      const res = await fetch(`${HUB}?Entry=TdxShare.PBHQInfo`, {
        method: "POST", headers,
        body: JSON.stringify({ Head:{Target:"0",CharSet:"UTF8"},Code:"000001",Setcode:"0",HasHQInfo:"1" }),
        signal: AbortSignal.timeout(5000)
      });
      const elapsed = Date.now() - start;
      const text = await res.text();
      console.log(`  [${bt.label}] HTTP ${res.status} | ${elapsed}ms | ${text.substring(0, 100)}`);
    } catch(e) {
      console.log(`  [${bt.label}] ERROR: ${e.message}`);
    }
  }
  
  // Also test without token header at all
  console.log("\n  [No Token Header]");
  const start = Date.now();
  try {
    const res = await fetch(`${HUB}?Entry=TdxShare.PBHQInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Head:{Target:"0",CharSet:"UTF8"},Code:"000001",Setcode:"0",HasHQInfo:"1" }),
      signal: AbortSignal.timeout(5000)
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    console.log(`    HTTP ${res.status} | ${elapsed}ms | ${text.substring(0, 100)}`);
  } catch(e) {
    console.log(`    ERROR: ${e.message}`);
  }
}

// Main
async function main() {
  console.log("===========================================================================");
  console.log("  TDX API - Rate Limit & Authentication Comprehensive Test");
  console.log(`  Time: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`  Token: ${TOKEN.substring(0, 15)}...`);
  console.log("===========================================================================");

  await testServerEndpoints();     // Baseline: all servers working?
  await testAuthValidity();        // Does token expire between calls?
  await testConcurrency(10);       // How many concurrent requests?
  await testRapidFire(15, 200);    // Rapid sequential calls
  await testInvalidToken();         // What do invalid tokens look like?

  console.log("\n" + "=".repeat(80));
  console.log("ALL TESTS COMPLETE");
  console.log("=".repeat(80));
  
  console.log(`
SUMMARY OF FINDINGS:
====================

Check the output above for:
  1. AUTH: Any "AUTH" errors indicate token expiry issues
  2. CONCURRENT: If some of 10 parallel requests fail -> concurrency limit exists
  3. FREQUENCY: If rapid-fire test shows errors after N calls -> rate limit exists
  4. SERVERS: If any endpoint returns consistently different from others -> per-server limits

RECOMMENDED PRODUCTION SETTINGS based on findings:
  - Max concurrent: <determine from test 2>
  - Min interval: <determine from test 3>
  - Token refresh: <determine from test 1>
  `);
}

main().catch(console.error);