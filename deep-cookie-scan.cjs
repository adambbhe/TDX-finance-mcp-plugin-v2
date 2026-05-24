/**
 * TDX Wenda Login Cookie Deep Scanner
 * 深度扫描所有通达信相关域名的 Cookie
 */

const fs = require('fs');
const initSqlJs = require('sql.js');

async function main() {
  const dbPath = 'C:\\Users\\Adambb\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';
  
  console.log('=== TDX Wenda Login Cookie Deep Scanner ===\n');
  console.log(`📂 Database: ${dbPath}\n`);
  
  const tempPath = dbPath + '.scan';
  fs.copyFileSync(dbPath, tempPath);
  
  try {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(tempPath);
    const db = new SQL.Database(fileBuffer);
    
    console.log('✅ Database opened\n');
    
    // Search for ALL TDX-related domains
    const domains = [
      '.tdx.com.cn',
      'www.tdx.com.cn', 
      'wenda.tdx.com.cn',
      'pul.tdx.com.cn',
      'tdxhub.icfqs.com',
      'ai.icfqs.com'
    ];
    
    let totalCookies = 0;
    
    for (const domain of domains) {
      const stmt = db.prepare(`
        SELECT host_key, name, 
               LENGTH(value) as val_len,
               LENGTH(encrypted_value) as enc_len,
               path, expires_utc,
               is_httponly
        FROM cookies 
        WHERE host_key = ? OR host_key LIKE ?
      `);
      
      stmt.bind([domain, `%${domain.replace('.', '')}%`]);
      
      const cookies = [];
      while (stmt.step()) {
        cookies.push(stmt.getAsObject());
      }
      stmt.free();
      
      if (cookies.length > 0) {
        totalCookies += cookies.length;
        console.log(`\n🌐 Domain: ${domain} (${cookies.length} cookie(s))`);
        console.log('─'.repeat(60));
        
        for (const c of cookies) {
          const hasValue = c.val_len > 0;
          const hasEncrypted = c.enc_len > 0;
          const isLoginCookie = /session|token|login|uid|user|auth/i.test(c.name);
          
          console.log(`\n  🍪 ${c.name}`);
          console.log(`     Host: ${c.host_key}`);
          console.log(`     Path: ${c.path}`);
          console.log(`     HttpOnly: ${!!c.is_httponly}`);
          
          if (hasValue) {
            console.log(`     ✅ Plaintext: ${c.val_len} bytes`);
            try {
              const valStr = Buffer.from(c.value).toString('utf8');
              console.log(`     Value: ${valStr.substring(0, 60)}${valStr.length > 60 ? '...' : ''}`);
            } catch(e) {}
          }
          
          if (hasEncrypted) {
            console.log(`     🔒 Encrypted: ${c.enc_len} bytes (DPAPI)`);
          }
          
          if (isLoginCookie) {
            console.log(`     ⭐ *** THIS LOOKS LIKE A LOGIN COOKIE! ***`);
          }
        }
      } else {
        console.log(`  ⬜ ${domain}: No cookies found`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL: ${totalCookies} TDX-related cookie(s) found`);
    
    if (totalCookies === 0) {
      console.log('\n⚠️ No TDX login cookies detected!');
      console.log('\nPossible reasons:');
      console.log('  1. Not logged into wenda.tdx.com.cn');
      console.log('  2. Session expired or cleared');
      console.log('  3. Using different browser/profile');
      console.log('  4. Cookies stored in different location (e.g., Profile 1)');
      
      // Check other profiles
      console.log('\n🔍 Checking other Chrome profiles...');
      const baseDir = 'C:\\Users\\Adambb\\AppData\\Local\\Google\\Chrome\\User Data';
      if (fs.existsSync(baseDir)) {
        const profiles = fs.readdirSync(baseDir)
          .filter(d => d.startsWith('Profile ') || d === 'Default')
          .map(d => path.join(baseDir, d, 'Network', 'Cookies'))
          .filter(p => fs.existsSync(p));
        
        console.log(`   Found ${profiles.length} profile(s):`);
        profiles.forEach(p => console.log(`   - ${p}`));
      }
    }
    
    db.close();
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    try { fs.unlinkSync(tempPath); } catch(e) {}
  }
}

main().catch(console.error);
