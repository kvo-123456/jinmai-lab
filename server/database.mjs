import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import Database from 'better-sqlite3'
import { MongoClient } from 'mongodb'
import { Pool } from 'pg'

// 加载环境变量
if (fs.existsSync('.env')) {
  dotenv.config()
}

// 数据库类型枚举
export const DB_TYPE = {
  SQLITE: 'sqlite',
  MONGODB: 'mongodb',
  POSTGRESQL: 'postgresql'
}

// 配置管理
const config = {
  // 数据库类型选择
  dbType: process.env.DB_TYPE || DB_TYPE.SQLITE,
  
  // SQLite 配置
  sqlite: {
    dataDir: process.env.DB_DATA_DIR || path.join(process.cwd(), 'data'),
    dbFile: process.env.DB_FILE || path.join(process.cwd(), 'data', 'app.db'),
    jsonFile: process.env.DB_JSON_FILE || path.join(process.cwd(), 'data', 'db.json'),
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '5000')
  },
  
  // MongoDB 配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jinmai_lab',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000')
    }
  },
  
  // PostgreSQL 配置
  postgresql: {
    connectionString: process.env.DATABASE_URL || 
                     process.env.NEON_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.NEON_POSTGRES_URL || 
                     process.env.NEON_DATABASE_URL_UNPOOLED ||
                     process.env.NEON_POSTGRES_URL_NON_POOLING,
    options: {
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '20'),
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '5000'),
      ssl: !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('127.0.0.1') ? {
        rejectUnauthorized: false
      } : false
    }
  }
}

// 数据库连接实例
let dbInstances = {
  sqlite: null,
  mongodb: null,
  postgresql: null
}

// 连接状态监控
let connectionStatus = {
  sqlite: { connected: false, lastConnected: null, error: null },
  mongodb: { connected: false, lastConnected: null, error: null },
  postgresql: { connected: false, lastConnected: null, error: null }
}

// 连接重试计数器
let retryCounts = {
  sqlite: 0,
  mongodb: 0,
  postgresql: 0
}

/**
 * 保证数据目录与数据库文件可用
 */
function ensureStorage() {
  const { dataDir } = config.sqlite
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  const { dbFile, jsonFile } = config.sqlite
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, '')
  }
  
  if (!fs.existsSync(jsonFile)) {
    const init = { favorites: [], video_tasks: {}, users: [] }
    fs.writeFileSync(jsonFile, JSON.stringify(init))
  }
}

/**
 * SQLite 连接初始化
 */
async function initSQLite() {
  try {
    ensureStorage()
    
    const { dbFile, timeout } = config.sqlite
    const db = new Database(dbFile, {
      timeout,
      verbose: null
    })
    
    // 创建表结构
    await createSQLiteTables(db)
    
    // 标记连接状态
    connectionStatus.sqlite = {
      connected: true,
      lastConnected: Date.now(),
      error: null
    }
    retryCounts.sqlite = 0
    
    console.log('SQLite连接成功')
    return db
  } catch (error) {
    connectionStatus.sqlite = {
      connected: false,
      lastConnected: null,
      error: error.message
    }
    retryCounts.sqlite++
    
    console.error('SQLite连接失败:', error.message)
    throw error
  }
}

/**
 * 创建SQLite表结构
 */
function createSQLiteTables(db) {
  try {
    // 创建用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        interests TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    
    // 添加age列（如果不存在）
    try {
      db.exec(`ALTER TABLE users ADD COLUMN age INTEGER`)
    } catch (e) {
      // 如果列已经存在，忽略错误
      if (!e.message.includes('duplicate column name')) {
        throw e
      }
    }
    
    // 添加tags列（如果不存在）
    try {
      db.exec(`ALTER TABLE users ADD COLUMN tags TEXT`)
    } catch (e) {
      // 如果列已经存在，忽略错误
      if (!e.message.includes('duplicate column name')) {
        throw e
      }
    }
    
    // 创建收藏表
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutorial_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `)
    
    // 添加user_id列（如果不存在）
    try {
      db.exec(`ALTER TABLE favorites ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`)
    } catch (e) {
      // 如果列已经存在，忽略错误
      if (!e.message.includes('duplicate column name')) {
        throw e
      }
    }
    
    // 添加唯一约束
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_tutorial ON favorites(user_id, tutorial_id)`)
    } catch (e) {
      // 如果约束已经存在，忽略错误
    }
    
    // 创建视频任务表
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_tasks (
        id TEXT PRIMARY KEY,
        status TEXT,
        model TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        payload_json TEXT
      );
    `)
    
    // 创建数据库迁移表
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `)
    
    // 创建索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);`)
    
    console.log('SQLite表和索引初始化成功')
  } catch (error) {
    console.error('创建SQLite表失败:', error.message)
    throw error
  }
}

/**
 * MongoDB 连接初始化
 */
async function initMongoDB() {
  try {
    const { uri, options } = config.mongodb
    const client = new MongoClient(uri, options)
    
    await client.connect()
    const db = client.db()
    
    // 验证连接
    await db.command({ ping: 1 })
    
    // 初始化集合和索引
    await initMongoDBCollections(db)
    
    // 标记连接状态
    connectionStatus.mongodb = {
      connected: true,
      lastConnected: Date.now(),
      error: null
    }
    retryCounts.mongodb = 0
    
    console.log('MongoDB连接成功')
    return { client, db }
  } catch (error) {
    connectionStatus.mongodb = {
      connected: false,
      lastConnected: null,
      error: error.message
    }
    retryCounts.mongodb++
    
    console.error('MongoDB连接失败:', error.message)
    throw error
  }
}

/**
 * 初始化MongoDB集合和索引
 */
async function initMongoDBCollections(db) {
  try {
    // 初始化users集合
    const usersCollection = db.collection('users')
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ username: 1 }, { unique: true })
    
    // 初始化favorites集合
    const favoritesCollection = db.collection('favorites')
    await favoritesCollection.createIndex({ user_id: 1 })
    await favoritesCollection.createIndex({ user_id: 1, tutorial_id: 1 }, { unique: true })
    
    // 初始化video_tasks集合
    const videoTasksCollection = db.collection('video_tasks')
    await videoTasksCollection.createIndex({ status: 1 })
    await videoTasksCollection.createIndex({ created_at: 1 })
    
    console.log('MongoDB集合和索引初始化成功')
  } catch (error) {
    console.error('初始化MongoDB集合和索引失败:', error.message)
    throw error
  }
}

/**
 * PostgreSQL 连接初始化
 */
async function initPostgreSQL() {
  try {
    const { connectionString, options } = config.postgresql
    
    if (!connectionString) {
      throw new Error('PostgreSQL连接字符串未配置')
    }
    
    const pool = new Pool({
      connectionString,
      ...options
    })
    
    // 验证连接
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    
    // 初始化表结构
    await createPostgreSQLTables(pool)
    
    // 标记连接状态
    connectionStatus.postgresql = {
      connected: true,
      lastConnected: Date.now(),
      error: null
    }
    retryCounts.postgresql = 0
    
    console.log('PostgreSQL连接成功')
    return pool
  } catch (error) {
    connectionStatus.postgresql = {
      connected: false,
      lastConnected: null,
      error: error.message
    }
    retryCounts.postgresql++
    
    console.error('PostgreSQL连接失败:', error.message)
    throw error
  }
}

/**
 * 创建PostgreSQL表结构
 */
async function createPostgreSQLTables(pool) {
  try {
    const client = await pool.connect()
    
    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        interests TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)
    
    // 创建收藏表
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tutorial_id INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE(user_id, tutorial_id)
      );
    `)
    
    // 创建视频任务表
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_tasks (
        id TEXT PRIMARY KEY,
        status TEXT,
        model TEXT,
        created_at BIGINT,
        updated_at BIGINT,
        payload_json TEXT
      );
    `)
    
    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at);')
    
    client.release()
    console.log('PostgreSQL表和索引初始化成功')
  } catch (error) {
    console.error('创建PostgreSQL表失败:', error.message)
    throw error
  }
}

/**
 * 获取数据库连接（带重试机制）
 */
async function getDBWithRetry(initFn, dbType, retries = 0) {
  try {
    return await initFn()
  } catch (error) {
    const maxRetries = config[dbType]?.maxRetries || 3
    const retryDelay = config[dbType]?.retryDelay || 1000
    
    if (retries < maxRetries) {
      console.warn(`${dbType}连接失败，${retries + 1}秒后重试...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return getDBWithRetry(initFn, dbType, retries + 1)
    }
    
    throw new Error(`${dbType}连接失败，已重试${maxRetries}次: ${error.message}`)
  }
}

/**
 * 获取当前配置的数据库实例
 */
export async function getDB() {
  const { dbType } = config
  
  switch (dbType) {
    case DB_TYPE.SQLITE:
      if (!dbInstances.sqlite || !connectionStatus.sqlite.connected) {
        dbInstances.sqlite = await getDBWithRetry(initSQLite, DB_TYPE.SQLITE)
      }
      return dbInstances.sqlite
      
    case DB_TYPE.MONGODB:
      if (!dbInstances.mongodb || !connectionStatus.mongodb.connected) {
        dbInstances.mongodb = await getDBWithRetry(initMongoDB, DB_TYPE.MONGODB)
      }
      return dbInstances.mongodb.db
      
    case DB_TYPE.POSTGRESQL:
      if (!dbInstances.postgresql || !connectionStatus.postgresql.connected) {
        dbInstances.postgresql = await getDBWithRetry(initPostgreSQL, DB_TYPE.POSTGRESQL)
      }
      return dbInstances.postgresql
      
    default:
      throw new Error(`不支持的数据库类型: ${dbType}`)
  }
}

/**
 * 获取数据库连接状态
 */
export function getDBStatus() {
  return {
    currentDbType: config.dbType,
    status: connectionStatus,
    retryCounts
  }
}

/**
 * 关闭所有数据库连接
 */
export async function closeDB() {
  try {
    // 关闭SQLite连接
    if (dbInstances.sqlite) {
      dbInstances.sqlite.close()
      dbInstances.sqlite = null
      connectionStatus.sqlite.connected = false
      console.log('SQLite连接已关闭')
    }
    
    // 关闭MongoDB连接
    if (dbInstances.mongodb?.client) {
      await dbInstances.mongodb.client.close()
      dbInstances.mongodb = null
      connectionStatus.mongodb.connected = false
      console.log('MongoDB连接已关闭')
    }
    
    // 关闭PostgreSQL连接
    if (dbInstances.postgresql) {
      await dbInstances.postgresql.end()
      dbInstances.postgresql = null
      connectionStatus.postgresql.connected = false
      console.log('PostgreSQL连接已关闭')
    }
    
    console.log('所有数据库连接已关闭')
  } catch (error) {
    console.error('关闭数据库连接失败:', error.message)
    throw error
  }
}

/**
 * 重新连接数据库
 */
export async function reconnectDB() {
  await closeDB()
  return getDB()
}

/**
 * 数据库操作封装 - 用户相关
 */
export const userDB = {
  /**
   * 创建用户
   */
  async createUser(userData) {
    const db = await getDB()
    const { username, email, password_hash, phone = null, avatar_url = null, interests = null, age = null, tags = null } = userData
    const now = Date.now()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        return db.prepare(`
          INSERT INTO users (username, email, password_hash, phone, avatar_url, interests, age, tags, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `).get(username, email, password_hash, phone, avatar_url, interests, age, tags, now, now)
        
      case DB_TYPE.MONGODB:
        const result = await db.collection('users').insertOne({
          username, email, password_hash, phone, avatar_url, interests, age, tags, created_at: now, updated_at: now
        })
        return { id: result.insertedId }
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query(`
          INSERT INTO users (username, email, password_hash, phone, avatar_url, interests, age, tags, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [username, email, password_hash, phone, avatar_url, interests, age, tags, now, now])
        return rows[0]
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
        
      case DB_TYPE.MONGODB:
        return db.collection('users').findOne({ email })
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
        return rows[0]
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 根据用户名查找用户
   */
  async findByUsername(username) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
        
      case DB_TYPE.MONGODB:
        return db.collection('users').findOne({ username })
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username])
        return rows[0]
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 根据ID查找用户
   */
  async findById(id) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
        
      case DB_TYPE.MONGODB:
        return db.collection('users').findOne({ _id: id })
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
        return rows[0]
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 获取所有用户
   */
  async getAllUsers() {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
        
      case DB_TYPE.MONGODB:
        return await db.collection('users').find({}).sort({ created_at: -1 }).toArray()
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM users ORDER BY created_at DESC')
        return rows
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  }
}

/**
 * 数据库操作封装 - 收藏相关
 */
export const favoriteDB = {
  /**
   * 获取用户收藏列表
   */
  async getUserFavorites(userId) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        const rows = db.prepare('SELECT tutorial_id FROM favorites WHERE user_id = ? ORDER BY tutorial_id ASC').all(userId)
        return rows.map(r => r.tutorial_id)
        
      case DB_TYPE.MONGODB:
        const favorites = await db.collection('favorites').find({ user_id: userId }).sort({ tutorial_id: 1 }).toArray()
        return favorites.map(f => f.tutorial_id)
        
      case DB_TYPE.POSTGRESQL:
        const { rows: pgRows } = await db.query(
          'SELECT tutorial_id FROM favorites WHERE user_id = $1 ORDER BY tutorial_id ASC',
          [userId]
        )
        return pgRows.map(r => r.tutorial_id)
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 切换收藏状态
   */
  async toggleFavorite(userId, tutorialId) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        // 检查是否已收藏
        const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND tutorial_id = ?').get(userId, tutorialId)
        if (existing) {
          db.prepare('DELETE FROM favorites WHERE user_id = ? AND tutorial_id = ?').run(userId, tutorialId)
        } else {
          db.prepare('INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES (?, ?, ?)').run(userId, tutorialId, Date.now())
        }
        return this.getUserFavorites(userId)
        
      case DB_TYPE.MONGODB:
        const result = await db.collection('favorites').findOneAndDelete({ user_id: userId, tutorial_id: tutorialId })
        if (!result.value) {
          await db.collection('favorites').insertOne({
            user_id: userId,
            tutorial_id: tutorialId,
            created_at: Date.now()
          })
        }
        return this.getUserFavorites(userId)
        
      case DB_TYPE.POSTGRESQL:
        // 检查是否已收藏
        const { rows: pgRows } = await db.query(
          'SELECT * FROM favorites WHERE user_id = $1 AND tutorial_id = $2',
          [userId, tutorialId]
        )
        
        if (pgRows.length > 0) {
          await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND tutorial_id = $2',
            [userId, tutorialId]
          )
        } else {
          await db.query(
            'INSERT INTO favorites (user_id, tutorial_id, created_at) VALUES ($1, $2, $3)',
            [userId, tutorialId, Date.now()]
          )
        }
        return this.getUserFavorites(userId)
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  }
}

/**
 * 数据库操作封装 - 视频任务相关
 */
export const videoTaskDB = {
  /**
   * 创建或更新视频任务
   */
  async upsertTask(taskData) {
    const db = await getDB()
    const { id, status, model, payload } = taskData
    const now = Date.now()
    const payloadJson = payload ? JSON.stringify(payload) : null
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        db.prepare(`
          INSERT INTO video_tasks (id, status, model, created_at, updated_at, payload_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            model = COALESCE(excluded.model, video_tasks.model),
            updated_at = excluded.updated_at,
            payload_json = COALESCE(excluded.payload_json, video_tasks.payload_json)
        `).run(id, status || null, model || null, now, now, payloadJson)
        return
        
      case DB_TYPE.MONGODB:
        await db.collection('video_tasks').updateOne(
          { id },
          {
            $set: {
              status,
              model,
              updated_at: now,
              payload
            },
            $setOnInsert: {
              created_at: now
            }
          },
          { upsert: true }
        )
        return
        
      case DB_TYPE.POSTGRESQL:
        await db.query(`
          INSERT INTO video_tasks (id, status, model, created_at, updated_at, payload_json)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            model = COALESCE(excluded.model, video_tasks.model),
            updated_at = excluded.updated_at,
            payload_json = COALESCE(excluded.payload_json, video_tasks.payload_json)
        `, [id, status || null, model || null, now, now, payloadJson])
        return
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  },
  
  /**
   * 获取视频任务详情
   */
  async getTask(id) {
    const db = await getDB()
    
    switch (config.dbType) {
      case DB_TYPE.SQLITE:
        const row = db.prepare('SELECT * FROM video_tasks WHERE id = ?').get(id)
        if (!row) return null
        
        let payload = null
        if (row.payload_json) {
          try {
            payload = JSON.parse(row.payload_json)
          } catch (e) {
            console.error(`解析任务 ${id} 的payload失败:`, e.message)
          }
        }
        
        return {
          id: row.id,
          status: row.status,
          model: row.model,
          created_at: row.created_at,
          updated_at: row.updated_at,
          payload
        }
        
      case DB_TYPE.MONGODB:
        const task = await db.collection('video_tasks').findOne({ id })
        return task
        
      case DB_TYPE.POSTGRESQL:
        const { rows } = await db.query('SELECT * FROM video_tasks WHERE id = $1', [id])
        if (rows.length === 0) return null
        
        const pgRow = rows[0]
        let pgPayload = null
        if (pgRow.payload_json) {
          try {
            pgPayload = JSON.parse(pgRow.payload_json)
          } catch (e) {
            console.error(`解析任务 ${id} 的payload失败:`, e.message)
          }
        }
        
        return {
          id: pgRow.id,
          status: pgRow.status,
          model: pgRow.model,
          created_at: pgRow.created_at,
          updated_at: pgRow.updated_at,
          payload: pgPayload
        }
        
      default:
        throw new Error(`不支持的数据库类型: ${config.dbType}`)
    }
  }
}

/**
 * 初始化默认数据库连接
 */
if (process.env.NODE_ENV !== 'test') {
  // 预连接数据库
  getDB().catch(error => {
    console.error('数据库预连接失败:', error.message)
  })
}
