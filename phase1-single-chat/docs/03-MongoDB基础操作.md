# MongoDB 基础操作

**学习目标：**
- [x] 理解 MongoDB 的核心概念
- [x] 掌握基本的 CRUD 操作
- [x] 学会使用 Mongoose ODM
- [x] 理解数据模型设计

---

## 1. 什么是 MongoDB？

MongoDB 是一个基于文档的 NoSQL 数据库，数据以 JSON-like 的 BSON 格式存储。

### MongoDB vs 关系型数据库

| 关系型数据库 | MongoDB |
|------------|---------|
| 数据库 | 数据库 |
| 表（Table） | 集合（Collection） |
| 行（Row） | 文档（Document） |
| 列（Column） | 字段（Field） |
| 主键（Primary Key） | _id（自动创建） |
| 表连接（Join） | 嵌入文档或引用 |

### 文档示例

```javascript
// MongoDB 文档（类似 JSON）
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com",
  "tags": ["学生", "开发者"],
  "address": {
    "city": "北京",
    "zip": "100000"
  },
  "createdAt": ISODate("2024-01-15T08:30:00Z")
}
```

---

## 2. 安装和连接

### 安装 MongoDB

```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 连接数据库

```javascript
// 原生驱动
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

async function connect() {
  await client.connect();
  console.log('Connected to MongoDB');
  
  const db = client.db('myapp');  // 选择数据库
  return db;
}
```

---

## 3. Mongoose ODM

Mongoose 是 MongoDB 的对象模型工具，提供了结构化的方式来操作数据。

### 安装

```bash
npm install mongoose
```

### 连接数据库

```javascript
const mongoose = require('mongoose');

// 连接字符串
const MONGODB_URI = 'mongodb://localhost:27017/mini-wechat';

// 连接选项
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// 建立连接
mongoose.connect(MONGODB_URI, options)
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log('Mongoose 已连接');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose 已断开');
});
```

---

## 4. 定义 Schema 和 Model

### Schema（模式）

Schema 定义了文档的结构、默认值、验证器等。

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

// 定义用户 Schema
const userSchema = new Schema({
  // 基本字段
  username: {
    type: String,
    required: true,      // 必填
    unique: true,        // 唯一
    trim: true,          // 去除首尾空格
    minlength: 3,        // 最小长度
    maxlength: 20        // 最大长度
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,     // 转小写
    match: /^\S+@\S+\.\S+$/  // 正则验证
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false        // 默认查询不返回
  },
  
  age: {
    type: Number,
    min: 0,
    max: 150,
    default: 0           // 默认值
  },
  
  // 数组字段
  tags: [String],
  
  // 嵌套文档
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: 500
    },
    location: String
  },
  
  // 布尔字段
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 枚举字段
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  }
}, {
  // 选项
  timestamps: true  // 自动添加 createdAt 和 updatedAt
});
```

### 常用数据类型

```javascript
const exampleSchema = new Schema({
  // 字符串
  name: String,
  
  // 数字
  age: Number,
  score: mongoose.Decimal128,  // 高精度小数
  
  // 日期
  birthday: Date,
  
  // 布尔
  isActive: Boolean,
  
  // 数组
  tags: [String],
  scores: [Number],
  
  // 嵌套对象
  address: {
    city: String,
    street: String
  },
  
  // 混合类型（任意类型）
  metadata: Schema.Types.Mixed,
  
  // ObjectId（用于关联）
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'  // 关联到 User 模型
  },
  
  // Buffer（二进制数据）
  image: Buffer
});
```

### Model（模型）

Model 是 Schema 的编译版本，用于操作数据库。

```javascript
// 创建 Model
const User = mongoose.model('User', userSchema);

// model 名 'User' -> 集合名 'users'（自动复数化）
```

---

## 5. CRUD 操作

### Create（创建）

```javascript
// 方式1：创建实例后保存
const user = new User({
  username: 'zhangsan',
  email: 'zhangsan@example.com',
  password: 'hashed_password',
  age: 25
});

const savedUser = await user.save();
console.log('用户创建成功:', savedUser);

// 方式2：直接插入
const newUser = await User.create({
  username: 'lisi',
  email: 'lisi@example.com',
  password: 'hashed_password'
});

// 方式3：批量插入
const users = await User.insertMany([
  { username: 'user1', email: 'user1@example.com', password: 'pass1' },
  { username: 'user2', email: 'user2@example.com', password: 'pass2' }
]);
```

### Read（查询）

```javascript
// 查询所有
const allUsers = await User.find();

// 根据条件查询
const activeUsers = await User.find({ isActive: true });

// 查询单个（返回对象或 null）
const user = await User.findOne({ username: 'zhangsan' });

// 根据 ID 查询
const userById = await User.findById('507f1f77bcf86cd799439011');

// 条件查询
// AND 条件
const result = await User.find({
  isActive: true,
  age: { $gte: 18 }  // 大于等于 18
});

// OR 条件
const result = await User.find({
  $or: [
    { role: 'admin' },
    { age: { $gte: 18 } }
  ]
});

// 比较操作符
// $eq: 等于
// $ne: 不等于
// $gt: 大于
// $gte: 大于等于
// $lt: 小于
// $lte: 小于等于
// $in: 在数组中
// $nin: 不在数组中

// 查询年龄 18-30 的用户
const youngUsers = await User.find({
  age: { $gte: 18, $lte: 30 }
});

// 查询特定角色的用户
const admins = await User.find({
  role: { $in: ['admin', 'moderator'] }
});
```

### 查询选项

```javascript
// 选择字段（只返回 username 和 email）
const users = await User.find({}, 'username email');

// 排除字段（不返回 password）
const users = await User.find({}, '-password');

// 排序（1 升序，-1 降序）
const users = await User.find().sort({ createdAt: -1 });  // 最新创建在前

// 分页
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;

const users = await User.find()
  .skip(skip)
  .limit(limit);

// 链式调用
const users = await User.find({ isActive: true })
  .select('username email createdAt')
  .sort({ createdAt: -1 })
  .limit(20);
```

### Update（更新）

```javascript
// 更新单个（返回更新前的文档）
const user = await User.findOneAndUpdate(
  { username: 'zhangsan' },           // 查询条件
  { age: 26 },                         // 更新内容
  { new: true }                        // 返回更新后的文档
);

// 根据 ID 更新
const updated = await User.findByIdAndUpdate(
  userId,
  { $set: { email: 'newemail@example.com' } },
  { new: true }
);

// 更新多个
const result = await User.updateMany(
  { isActive: false },
  { $set: { lastLogin: new Date() } }
);
console.log('更新了', result.modifiedCount, '条记录');

// 原子操作符
// $set: 设置字段值
// $unset: 删除字段
// $inc: 增加数值
// $push: 向数组添加元素
// $pull: 从数组移除元素
// $addToSet: 向数组添加不重复元素

// 年龄加 1
await User.updateOne(
  { _id: userId },
  { $inc: { age: 1 } }
);

// 添加标签
await User.updateOne(
  { _id: userId },
  { $push: { tags: 'developer' } }
);

// 移除标签
await User.updateOne(
  { _id: userId },
  { $pull: { tags: 'student' } }
);
```

### Delete（删除）

```javascript
// 删除单个
await User.deleteOne({ username: 'zhangsan' });

// 根据 ID 删除
await User.findByIdAndDelete(userId);

// 删除多个
await User.deleteMany({ isActive: false });

// 软删除（推荐：标记删除而不是真正删除）
await User.updateOne(
  { _id: userId },
  { $set: { isDeleted: true, deletedAt: new Date() } }
);
```

---

## 6. 索引

索引可以提高查询性能。

```javascript
// 单字段索引
userSchema.index({ username: 1 });  // 1 升序，-1 降序

// 复合索引
userSchema.index({ username: 1, email: 1 });

// 唯一索引
userSchema.index({ email: 1 }, { unique: true });

// 文本索引（用于全文搜索）
userSchema.index({ bio: 'text' });

// 在 Schema 中定义
const userSchema = new Schema({
  username: { type: String, index: true },
  email: { type: String, unique: true },
  // ...
});
```

---

## 7. 学习总结

### 核心概念

| 概念 | 说明 |
|-----|------|
| 数据库 | 数据容器 |
| 集合 | 文档的集合（类似表）|
| 文档 | BSON 格式的数据记录（类似行）|
| Schema | 定义文档结构 |
| Model | 操作集合的接口 |

### 关键技能

1. **连接数据库** —— 使用 mongoose.connect()
2. **定义 Schema** —— 字段类型、验证、默认值
3. **创建 Model** —— mongoose.model()
4. **CRUD 操作** —— create/find/update/delete
5. **查询技巧** —— 条件、排序、分页、选择字段

### 下一步

学习 Redis 基础，用于缓存和在线状态管理。

---

**学习时间：** 2026-03-14  
**学习时长：** 3 小时  
**掌握程度：** ⭐⭐⭐⭐☆
