# Redis 基础操作

**学习目标：**
- [x] 理解 Redis 的核心特性
- [x] 掌握常用数据类型和操作
- [x] 学会在 Node.js 中使用 Redis
- [x] 理解 Redis 在即时通讯中的应用场景

---

## 1. 什么是 Redis？

Redis（Remote Dictionary Server）是一个开源的**内存数据结构存储**，可用作数据库、缓存和消息代理。

### 核心特性

| 特性 | 说明 |
|-----|------|
| **内存存储** | 数据存在内存中，读写极快（10万+ QPS）|
| **持久化** | 支持 RDB 快照和 AOF 日志 |
| **数据结构丰富** | 字符串、哈希、列表、集合、有序集合等 |
| **单线程** | 原子操作，无并发问题 |
| **发布订阅** | 支持消息发布/订阅模式 |

### 为什么即时通讯需要 Redis？

```
场景1：在线状态
- MongoDB：每次查询都要读磁盘，慢
- Redis：内存读取，毫秒级响应

场景2：消息队列
- 需要按顺序处理消息
- Redis 列表天然支持队列

场景3：热点数据缓存
- 用户信息、房间信息
- 减少数据库压力
```

---

## 2. 安装和连接

### 安装 Redis

```bash
# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### 命令行客户端

```bash
# 连接 Redis
redis-cli

# 测试连接
127.0.0.1:6379> ping
PONG

# 退出
127.0.0.1:6379> exit
```

### Node.js 连接

```bash
npm install redis
```

```javascript
const redis = require('redis');

// 创建客户端
const client = redis.createClient({
  url: 'redis://localhost:6379'
});

// 连接事件
client.on('connect', () => {
  console.log('Redis 连接成功');
});

client.on('error', (err) => {
  console.error('Redis 错误:', err);
});

// 连接
await client.connect();

// 基本操作
await client.set('key', 'value');
const value = await client.get('key');
console.log(value);  // 'value'

// 关闭连接
await client.quit();
```

---

## 3. 数据类型和操作

### String（字符串）

最基础的数据类型，可以存储字符串、数字、二进制数据。

```javascript
// 设置值
await client.set('username', 'zhangsan');

// 设置值（带过期时间，单位秒）
await client.set('token', 'abc123', { EX: 3600 });  // 1小时后过期

// 获取值
const username = await client.get('username');

// 删除键
await client.del('username');

// 检查是否存在
const exists = await client.exists('username');  // 1 或 0

// 设置过期时间
await client.expire('key', 60);  // 60秒后过期

// 查看剩余时间
const ttl = await client.ttl('key');  // -1: 永不过期, -2: 不存在

// 数字操作
await client.set('counter', '0');
await client.incr('counter');       // 1
await client.incrBy('counter', 5);  // 6
await client.decr('counter');       // 5
await client.decrBy('counter', 2);  // 3
```

### Hash（哈希）

存储字段和值的映射，适合存储对象。

```javascript
// 设置字段
await client.hSet('user:1001', 'username', 'zhangsan');
await client.hSet('user:1001', 'email', 'zhangsan@example.com');
await client.hSet('user:1001', 'age', '25');

// 批量设置
await client.hSet('user:1002', {
  username: 'lisi',
  email: 'lisi@example.com',
  age: '30'
});

// 获取单个字段
const username = await client.hGet('user:1001', 'username');

// 获取所有字段
const user = await client.hGetAll('user:1001');
// { username: 'zhangsan', email: 'zhangsan@example.com', age: '25' }

// 获取所有字段名
const fields = await client.hKeys('user:1001');

// 获取所有值
const values = await client.hVals('user:1001');

// 删除字段
await client.hDel('user:1001', 'age');

// 检查字段是否存在
const hasEmail = await client.hExists('user:1001', 'email');  // true/false
```

### List（列表）

双向链表，支持从两端插入/弹出，适合实现队列。

```javascript
// 从左侧插入（头部）
await client.lPush('messages', 'message1');
await client.lPush('messages', 'message2');  // ['message2', 'message1']

// 从右侧插入（尾部）
await client.rPush('messages', 'message3');  // ['message2', 'message1', 'message3']

// 从左侧弹出（头部）
const msg = await client.lPop('messages');  // 'message2'

// 从右侧弹出（尾部）
const msg = await client.rPop('messages');  // 'message3'

// 获取列表长度
const length = await client.lLen('messages');

// 获取范围（0 到 -1 表示全部）
const messages = await client.lRange('messages', 0, -1);

// 获取指定索引
const msg = await client.lIndex('messages', 0);

// 修剪列表（只保留前 N 个）
await client.lTrim('messages', 0, 99);  // 只保留前 100 条

// 阻塞弹出（没有元素时等待）
const msg = await client.blPop('messages', 5);  // 等待最多 5 秒
```

### Set（集合）

无序不重复集合，适合存储唯一值。

```javascript
// 添加元素
await client.sAdd('online-users', 'user1');
await client.sAdd('online-users', ['user2', 'user3']);

// 获取所有元素
const users = await client.sMembers('online-users');

// 检查元素是否存在
const isOnline = await client.sIsMember('online-users', 'user1');  // true/false

// 获取集合大小
const count = await client.sCard('online-users');

// 移除元素
await client.sRem('online-users', 'user1');

// 随机获取元素
const randomUser = await client.sRandMember('online-users');

// 随机移除并返回元素
const removed = await client.sPop('online-users');

// 集合运算
await client.sAdd('group1', ['a', 'b', 'c']);
await client.sAdd('group2', ['b', 'c', 'd']);

// 交集
const intersection = await client.sInter(['group1', 'group2']);  // ['b', 'c']

// 并集
const union = await client.sUnion(['group1', 'group2']);  // ['a', 'b', 'c', 'd']

// 差集
const diff = await client.sDiff(['group1', 'group2']);  // ['a']
```

### Sorted Set（有序集合）

每个元素关联一个分数，按分数排序，适合排行榜等场景。

```javascript
// 添加元素（带分数）
await client.zAdd('leaderboard', [
  { score: 100, value: 'player1' },
  { score: 85, value: 'player2' },
  { score: 120, value: 'player3' }
]);

// 获取排名（从高到低）
const top3 = await client.zRevRange('leaderboard', 0, 2);
// ['player3', 'player1', 'player2']

// 获取带分数的排名
const top3WithScores = await client.zRevRangeWithScores('leaderboard', 0, 2);
// [{ value: 'player3', score: 120 }, ...]

// 获取元素的排名
const rank = await client.zRevRank('leaderboard', 'player1');  // 1（从0开始）

// 获取元素的分数
const score = await client.zScore('leaderboard', 'player1');  // 100

// 增加分数
await client.zIncrBy('leaderboard', 10, 'player1');  // player1 分数变为 110

// 获取集合大小
const count = await client.zCard('leaderboard');

// 获取分数范围内的元素
const players = await client.zRangeByScore('leaderboard', 80, 100);

// 移除元素
await client.zRem('leaderboard', 'player1');
```

---

## 4. Redis 在即时通讯中的应用

### 场景1：用户在线状态

```javascript
// 用户上线
async function userOnline(userId, socketId) {
  // 使用 Hash 存储用户和 socket 的映射
  await client.hSet('user-sockets', userId, socketId);
  
  // 使用 Set 存储在线用户列表
  await client.sAdd('online-users', userId);
  
  // 设置过期时间（防止异常断线）
  await client.expire(`user-socket:${userId}`, 300);  // 5分钟
}

// 用户离线
async function userOffline(userId) {
  await client.hDel('user-sockets', userId);
  await client.sRem('online-users', userId);
}

// 检查用户是否在线
async function isUserOnline(userId) {
  return await client.sIsMember('online-users', userId);
}

// 获取在线用户数量
async function getOnlineCount() {
  return await client.sCard('online-users');
}

// 获取所有在线用户
async function getOnlineUsers() {
  return await client.sMembers('online-users');
}
```

### 场景2：消息队列（离线消息）

```javascript
// 用户离线时，消息存入队列
async function storeOfflineMessage(userId, message) {
  const key = `offline-messages:${userId}`;
  
  // 使用 List，从右侧插入
  await client.rPush(key, JSON.stringify({
    ...message,
    timestamp: Date.now()
  }));
  
  // 限制队列长度（最多保存 100 条）
  await client.lTrim(key, -100, -1);
  
  // 设置过期时间（7天）
  await client.expire(key, 7 * 24 * 3600);
}

// 用户上线时，获取离线消息
async function getOfflineMessages(userId) {
  const key = `offline-messages:${userId}`;
  
  // 获取所有消息
  const messages = await client.lRange(key, 0, -1);
  
  // 解析 JSON
  const parsed = messages.map(msg => JSON.parse(msg));
  
  // 删除已读取的消息
  await client.del(key);
  
  return parsed;
}
```

### 场景3：最近联系人

```javascript
// 更新最近联系人（使用 Sorted Set，时间作为分数）
async function updateRecentContacts(userId, contactId) {
  const key = `recent-contacts:${userId}`;
  const now = Date.now();
  
  // 添加/更新联系人，分数为时间戳
  await client.zAdd(key, { score: now, value: contactId });
  
  // 只保留最近 50 个联系人
  await client.zRemRangeByRank(key, 0, -51);
}

// 获取最近联系人
async function getRecentContacts(userId) {
  const key = `recent-contacts:${userId}`;
  
  // 按时间倒序获取
  return await client.zRevRange(key, 0, 49);
}
```

### 场景4：限流（防止刷消息）

```javascript
// 滑动窗口限流
async function checkRateLimit(userId, action, maxCount, windowSeconds) {
  const key = `rate-limit:${action}:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  
  // 移除窗口外的记录
  await client.zRemRangeByScore(key, 0, windowStart);
  
  // 获取当前窗口内的请求数
  const currentCount = await client.zCard(key);
  
  if (currentCount >= maxCount) {
    return false;  // 超过限制
  }
  
  // 记录本次请求
  await client.zAdd(key, { score: now, value: now.toString() });
  await client.expire(key, windowSeconds);
  
  return true;  // 允许请求
}

// 使用：每分钟最多发送 10 条消息
const allowed = await checkRateLimit('user123', 'send-message', 10, 60);
if (!allowed) {
  return { error: '发送过于频繁，请稍后再试' };
}
```

---

## 5. 封装 Redis 工具类

```javascript
// utils/redis.js
const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      console.error('Redis 错误:', err);
    });

    await this.client.connect();
    console.log('Redis 连接成功');
  }

  // 在线状态管理
  async setUserOnline(userId, socketId) {
    await this.client.hSet('user-sockets', userId, socketId);
    await this.client.sAdd('online-users', userId);
  }

  async setUserOffline(userId) {
    await this.client.hDel('user-sockets', userId);
    await this.client.sRem('online-users', userId);
  }

  async isUserOnline(userId) {
    return await this.client.sIsMember('online-users', userId);
  }

  async getOnlineUsers() {
    return await this.client.sMembers('online-users');
  }

  async getOnlineCount() {
    return await this.client.sCard('online-users');
  }

  // 离线消息
  async addOfflineMessage(userId, message) {
    const key = `offline-messages:${userId}`;
    await this.client.rPush(key, JSON.stringify(message));
    await this.client.lTrim(key, -100, -1);  // 保留最近 100 条
    await this.client.expire(key, 7 * 24 * 3600);  // 7天过期
  }

  async getOfflineMessages(userId) {
    const key = `offline-messages:${userId}`;
    const messages = await this.client.lRange(key, 0, -1);
    await this.client.del(key);
    return messages.map(msg => JSON.parse(msg));
  }

  // 通用方法
  async get(key) {
    return await this.client.get(key);
  }

  async set(key, value, expireSeconds) {
    if (expireSeconds) {
      await this.client.set(key, value, { EX: expireSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key) {
    await this.client.del(key);
  }

  async quit() {
    await this.client.quit();
  }
}

// 导出单例
module.exports = new RedisClient();
```

---

## 6. 学习总结

### 核心概念

| 数据类型 | 适用场景 |
|---------|---------|
| String | 简单键值、计数器、缓存 |
| Hash | 存储对象（用户信息等）|
| List | 队列、最新消息 |
| Set | 去重集合（在线用户）|
| Sorted Set | 排行榜、时间排序 |

### 关键技能

1. **连接 Redis** —— 使用 redis 客户端
2. **五种数据类型** —— String/Hash/List/Set/Sorted Set
3. **过期时间** —— EXPIRE/TTL
4. **即时通讯应用** —— 在线状态、离线消息、限流

### 下一步

结合 Express 和 MongoDB，开始实现用户注册功能。

---

**学习时间：** 2026-03-14  
**学习时长：** 2.5 小时  
**掌握程度：** ⭐⭐⭐⭐☆
