# Node.js 基础回顾

**学习目标：**
- [x] 理解 Node.js 的核心特性
- [x] 掌握 CommonJS 模块系统
- [x] 理解事件驱动和非阻塞 I/O
- [x] 掌握常用的核心模块

---

## 1. Node.js 是什么？

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境。

### 核心特性

| 特性 | 说明 |
|-----|------|
| **单线程** | 一个进程只有一个主线程执行 JavaScript |
| **事件驱动** | 通过事件循环处理异步操作 |
| **非阻塞 I/O** | I/O 操作不会阻塞主线程 |
| **跨平台** | 支持 Windows、macOS、Linux |

### 为什么适合即时通讯？

即时通讯需要处理大量并发连接，Node.js 的事件驱动模型非常适合：

```
传统多线程模型：
- 每个连接一个线程
- 线程切换开销大
- 内存占用高
- 适合 CPU 密集型任务

Node.js 单线程模型：
- 一个线程处理所有连接
- 事件循环调度异步任务
- 内存占用低
- 适合 I/O 密集型任务（如网络通信）
```

---

## 2. CommonJS 模块系统

Node.js 使用 CommonJS 规范组织代码。

### 导出模块

```javascript
// math.js
// 方式1：导出单个值
module.exports = function add(a, b) {
  return a + b;
};

// 方式2：导出对象
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b
};

// 方式3：分别导出
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;
```

### 导入模块

```javascript
// 方式1：导入整个模块
const math = require('./math.js');
console.log(math.add(1, 2));  // 3

// 方式2：解构导入
const { add, subtract } = require('./math.js');
console.log(add(1, 2));  // 3

// 方式3：导入内置模块
const http = require('http');
const fs = require('fs');
const path = require('path');

// 方式4：导入 npm 包
const express = require('express');
const socketio = require('socket.io');
```

### 模块加载规则

```javascript
// 1. 内置模块优先
const http = require('http');  // 加载内置 http 模块

// 2. 相对路径
const utils = require('./utils');      // 加载当前目录的 utils.js
const config = require('../config');   // 加载上级目录的 config.js

// 3. 绝对路径
const absolute = require('/home/user/module');

// 4. 目录（加载目录下的 index.js）
const models = require('./models');  // 加载 ./models/index.js

// 5. node_modules（npm 包）
const lodash = require('lodash');  // 加载 node_modules/lodash
```

---

## 3. 事件驱动和非阻塞 I/O

### 事件循环（Event Loop）

Node.js 的核心机制，负责调度异步任务：

```javascript
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('2. 定时器回调');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise 回调');
});

console.log('4. 同步代码结束');

// 输出顺序：
// 1. 同步代码开始
// 4. 同步代码结束
// 3. Promise 回调
// 2. 定时器回调
```

**执行顺序：**
1. 同步代码（主线程直接执行）
2. Promise/microtask（当前事件循环末尾）
3. setTimeout/macrotask（下一个事件循环）

### 非阻塞 I/O 示例

```javascript
const fs = require('fs');

// 阻塞式（同步）
console.log('开始读取文件');
const data = fs.readFileSync('file.txt', 'utf8');  // 阻塞等待
console.log('文件内容:', data);
console.log('继续执行');

// 非阻塞式（异步）
console.log('开始读取文件');
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取失败:', err);
    return;
  }
  console.log('文件内容:', data);
});
console.log('继续执行（不等待文件读取）');

// 输出顺序：
// 开始读取文件
// 继续执行（不等待文件读取）
// 文件内容: xxx
```

### Promise 和 async/await

```javascript
const fs = require('fs').promises;

// Promise 方式
function readFilePromise() {
  return fs.readFile('file.txt', 'utf8')
    .then(data => {
      console.log('文件内容:', data);
      return data;
    })
    .catch(err => {
      console.error('读取失败:', err);
      throw err;
    });
}

// async/await 方式（推荐）
async function readFileAsync() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log('文件内容:', data);
    return data;
  } catch (err) {
    console.error('读取失败:', err);
    throw err;
  }
}

// 使用
readFileAsync().then(data => {
  console.log('读取完成');
});
```

---

## 4. 核心模块

### http - 创建 Web 服务器

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // req: 请求对象
  // res: 响应对象
  
  console.log('收到请求:', req.url, req.method);
  
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
  // 发送响应
  res.end('Hello, Node.js!\n');
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### fs - 文件系统操作

```javascript
const fs = require('fs');
const fsPromises = require('fs').promises;

// 同步读写（阻塞）
const data = fs.readFileSync('file.txt', 'utf8');
fs.writeFileSync('output.txt', 'Hello');

// 异步回调
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 异步 Promise（推荐）
async function fileOperations() {
  // 读取
  const data = await fsPromises.readFile('file.txt', 'utf8');
  
  // 写入
  await fsPromises.writeFile('output.txt', 'Hello');
  
  // 追加
  await fsPromises.appendFile('log.txt', 'New line\n');
  
  // 检查文件是否存在
  const exists = await fsPromises.access('file.txt')
    .then(() => true)
    .catch(() => false);
  
  // 创建目录
  await fsPromises.mkdir('new-folder', { recursive: true });
  
  // 读取目录
  const files = await fsPromises.readdir('./');
  console.log('文件列表:', files);
}
```

### path - 路径处理

```javascript
const path = require('path');

// 拼接路径（自动处理不同系统的分隔符）
const fullPath = path.join(__dirname, 'folder', 'file.txt');
// Linux/macOS: /project/folder/file.txt
// Windows: C:\project\folder\file.txt

// 解析路径
const parsed = path.parse('/home/user/file.txt');
console.log(parsed);
// {
//   root: '/',
//   dir: '/home/user',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }

// 获取文件名
console.log(path.basename('/home/user/file.txt'));  // file.txt
console.log(path.extname('/home/user/file.txt'));   // .txt
console.log(path.dirname('/home/user/file.txt'));   // /home/user

// __dirname 和 __filename
console.log(__dirname);   // 当前文件所在目录
console.log(__filename);  // 当前文件的完整路径
```

### process - 进程信息

```javascript
// 环境变量
console.log(process.env.NODE_ENV);  // development/production

// 命令行参数
console.log(process.argv);
// node script.js arg1 arg2
// ['node', '/path/to/script.js', 'arg1', 'arg2']

// 退出进程
process.exit(0);  // 0 表示成功，非 0 表示错误

// 监听信号
process.on('SIGINT', () => {
  console.log('收到中断信号，优雅退出...');
  process.exit(0);
});
```

---

## 5. npm 包管理

### package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "项目描述",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### 常用命令

```bash
# 初始化项目
npm init -y

# 安装依赖
npm install express
npm install express --save-dev  # 开发依赖
npm install -g nodemon          # 全局安装

# 安装所有依赖（根据 package.json）
npm install

# 运行脚本
npm start
npm run dev
npm test

# 更新依赖
npm update

# 卸载依赖
npm uninstall express
```

---

## 6. 学习总结

### 核心概念

| 概念 | 说明 |
|-----|------|
| 单线程 | 一个进程只有一个主线程 |
| 事件循环 | 调度异步任务的机制 |
| 非阻塞 I/O | I/O 操作不阻塞主线程 |
| 回调函数 | 异步操作完成后的处理函数 |
| Promise | 更优雅的异步处理方式 |
| async/await | Promise 的语法糖，更易读 |

### 关键技能

1. **模块化开发** —— 使用 `require` 和 `module.exports`
2. **异步编程** —— 掌握回调、Promise、async/await
3. **核心模块** —— http、fs、path 的常用 API
4. **npm 使用** —— 安装、管理依赖

### 下一步

进入 Express 框架学习，用更优雅的方式构建 Web 服务器。

---

**学习时间：** 2026-03-14  
**学习时长：** 2 小时  
**掌握程度：** ⭐⭐⭐⭐☆
