import { Pool } from 'pg';

// 使用用户提供的PostgreSQL连接字符串
const connectionString = 'postgresql://neondb_owner:npg_8cmW4aDCqtLi@ep-bold-flower-agmuls0b-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testNeonConnection() {
  try {
    console.log('开始测试Neon PostgreSQL连接...');
    console.log('连接字符串:', connectionString.replace(/:[^:]+@/, ':***@'));
    
    // 创建连接池
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL连接成功!');
    
    // 测试查询
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ 查询成功! 当前时间:', result.rows[0].current_time);
    
    // 创建用户表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    console.log('✅ 用户表创建/检查成功!');
    
    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
    console.log('✅ 索引创建/检查成功!');
    
    // 测试插入用户
    const testUsername = 'testuser';
    const testEmail = 'test@example.com';
    const testPasswordHash = '$2a$10$testpasswordhash';
    const now = Date.now();
    
    const insertResult = await client.query(
      'INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [testUsername, testEmail, testPasswordHash, now, now]
    );
    
    const userId = insertResult.rows[0].id;
    console.log(`✅ 用户插入成功! 用户ID: ${userId}`);
    
    // 测试查询用户
    const selectResult = await client.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );
    console.log('✅ 用户查询成功! 用户信息:', selectResult.rows[0]);
    
    // 删除测试用户
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('✅ 测试用户删除成功!');
    
    // 关闭连接
    client.release();
    await pool.end();
    console.log('✅ 连接已关闭!');
    
    console.log('\n🎉 所有测试通过! Neon PostgreSQL连接正常工作!');
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return false;
  }
}

// 运行测试
testNeonConnection();
