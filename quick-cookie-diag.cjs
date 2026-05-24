/**
 * Quick TDX Cookie Diagnostic
 * 直接读取 .tdx.com.cn 域名下的所有 Cookie 详细信息
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function main() {
  const dbPath = 'C:\\Users\\Adambb\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';
  
  console.log('=== TDX Cookie Quick Diagnostic ===\n');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ DB not found: ${dbPath}`);
    return;
  }
  
  // Copy DB to avoid lock issues
  const tempPath = dbPath + '.diag';
  fs.copyFileSync(dbPath, tempPath);
  
  try {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(tempPath);
    const db = new SQL.Database(fileBuffer);
    
    console.log('✅ Database opened successfully\n');
    
    // First, show table schema
    console.log('📋 Cookies table schema:');
    const schemaStmt = db.prepare(`PRAGMA table_info(cookies)`);
    while (schemaStmt.step()) {
      const col = schemaStmt.getAsObject();
      console.log(`   - ${col.name} (${col.type})`);
    }
    schemaStmt.free();
    console.log('');
    
    // Query ALL cookies from .tdx.com.cn domain
    console.log('🔍 Searching for .tdx.com.cn cookies...');
    const stmt = db.prepare(`
      SELECT * FROM cookies WHERE host_key = '.tdx.com.cn'
    `);
    
    let count = 0;
    while (stmt.step()) {
      count++;
      const row = stmt.getAsObject();
      
      console.log(`\n🍪 Cookie #${count}:`);
      console.log(`   host_key: ${row.host_key}`);
      console.log(`   name: ${row.name}`);
      console.log(`   path: ${row.path}`);
      console.log(`   value length: ${row.value ? row.value.length : 0} bytes`);
      console.log(`   encrypted_value length: ${row.encrypted_value ? row.encrypted_value.length : 0} bytes`);
      console.log(`   expires_utc: ${row.expires_utc}`);
      console.log(`   is_secure: ${row.is_secure}`);
      console.log(`   is_httponly: ${row.is_httponly}`);
      
      // Show value preview if exists
      if (row.value && row.value.length > 0) {
        const valStr = Buffer.from(row.value).toString('utf8');
        console.log(`   value (preview): ${valStr.substring(0, 50)}...`);
      }
      
      // Show encrypted value info
      if (row.encrypted_value && row.encrypted_value.length > 0) {
        console.log(`   🔒 This cookie is DPAPI-encrypted`);
        console.log(`   Encrypted data (hex): ${Buffer.from(encrypted_value).toString('hex').substring(0, 50)}...`);
      }
    }
    stmt.free();
    
    if (count === 0) {
      console.log('\n⚠️ No cookies found for .tdx.com.cn');
      console.log('\nTrying broader search...');
      
      const broadStmt = db.prepare(`
        SELECT host_key, name, COUNT(*) as cnt 
        FROM cookies 
        WHERE host_key LIKE '%tdx%'
        GROUP BY host_key, name
      `);
      
      while (broadStmt.step()) {
        const row = broadStmt.getAsObject();
        console.log(`   Found: ${row.host_key} / ${row.name} (${row.cnt})`);
      }
      broadStmt.free();
    } else {
      console.log(`\n✅ Total found: ${count} cookie(s)`);
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
