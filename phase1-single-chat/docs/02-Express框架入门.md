# Express 框架入门

**学习目标：**
- [x] 理解 Express 的核心概念
- [x] 掌握路由和中间件
- [x] 学会处理请求和响应
- [x] 理解错误处理机制

---

## 1. 什么是 Express？

Express 是 Node.js 最流行的 Web 框架，提供了简洁的 API 来构建 Web 服务器。

### 原生 http vs Express

```javascript
// 原生 http（繁琐）
const http = require('http');

http.createServer((req, res) => {
  if (req.url === '/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
  } else if (req.url === '/users' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201);
      res.end(JSON.stringify(user));
    });
  }
  // ... 更多路由
}).listen(3000);
```

```javascript
// Express（简洁）
const express = require('express');
const app = express();

app.use(express.json());

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  const user = req.body;
  res.status(201).json(user);
});

app.listen(3000);
```

---

## 2. 基础使用

### 安装

```bash
npm install express
```

### Hello World

```javascript
// app.js
const express = require('express');

// 创建应用实例
const app = express();

// 定义路由
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

### 运行

```bash
node app.js
```

---

## 3. 路由（Routing）

路由定义了应用的端点（URI）以及如何响应客户端请求。

### 基本路由

```javascript
// GET 请求
app.get('/users', (req, res) => {
  res.send('获取用户列表');
});

// POST 请求
app.post('/users', (req, res) => {
  res.send('创建用户');
});

// PUT 请求
app.put('/users/:id', (req, res) => {
  res.send(`更新用户 ${req.params.id}`);
});

// DELETE 请求
app.delete('/users/:id', (req, res) => {
  res.send(`删除用户 ${req.params.id}`);
});
```

### 路由参数

```javascript
// 定义参数 :id
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`用户ID: ${userId}`);
});

// 多个参数
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.send(`用户 ${userId} 的文章 ${postId}`);
});

// 可选参数
app.get('/users/:id?', (req, res) => {
  if (req.params.id) {
    res.send(`用户 ${req.params.id}`);
  } else {
    res.send('所有用户');
  }
});
```

### 查询参数

```javascript
// GET /search?keyword=express&page=2
app.get('/search', (req, res) => {
  const { keyword, page = 1 } = req.query;
  // keyword = 'express'
  // page = '2'（字符串，需要转换）
  res.json({ keyword, page: parseInt(page) });
});
```

### 路由模块化

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// /users
router.get('/', (req, res) => {
  res.json({ users: [] });
});

// /users/:id
router.get('/:id', (req, res) => {
  res.json({ id: req.params.id });
});

module.exports = router;
```

```javascript
// app.js
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();

// 使用路由模块
app.use('/users', userRoutes);
// 现在访问 /users 和 /users/:id

app.listen(3000);
```

---

## 4. 中间件（Middleware）

中间件是 Express 的核心概念，它是一个函数，可以访问请求对象、响应对象和 next 函数。

### 中间件的作用

```javascript
// 中间件函数签名
function middleware(req, res, next) {
  // req: 请求对象
  // res: 响应对象
  // next: 调用下一个中间件
  
  // 做一些处理...
  
  next();  // 继续下一个中间件
}
```

### 应用级中间件

```javascript
const express = require('express');
const app = express();

// 1. 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 2. 解析 JSON 请求体
app.use(express.json());

// 3. 解析 URL 编码表单
app.use(express.urlencoded({ extended: true }));

// 4. 静态文件服务
app.use(express.static('public'));

// 路由
app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(3000);
```

### 路由级中间件

```javascript
const express = require('express');
const router = express.Router();

// 特定路由的中间件
router.use((req, res, next) => {
  console.log('用户路由中间件');
  next();
});

// 特定请求的中间件
router.get('/',
  (req, res, next) => {
    console.log('第一个中间件');
    next();
  },
  (req, res, next) => {
    console.log('第二个中间件');
    next();
  },
  (req, res) => {
    res.send('完成');
  }
);

module.exports = router;
```

### 常用内置中间件

```javascript
const express = require('express');
const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码表单
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
// 访问 http://localhost:3000/images/logo.png
// 对应 public/images/logo.png
app.use(express.static('public'));

// 虚拟路径前缀
// 访问 http://localhost:3000/static/images/logo.png
app.use('/static', express.static('public'));
```

### 第三方中间件

```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// CORS 跨域
app.use(cors());

// HTTP 请求日志
app.use(morgan('dev'));

// 安全头
app.use(helmet());

// ...
```

---

## 5. 请求和响应

### 请求对象（req）

```javascript
app.get('/example', (req, res) => {
  // URL 参数 /example/:id
  console.log(req.params);
  
  // 查询参数 ?name=value
  console.log(req.query);
  
  // 请求头
  console.log(req.headers);
  console.log(req.get('Content-Type'));
  
  // 请求体（需要中间件解析）
  console.log(req.body);
  
  // 请求路径
  console.log(req.path);      // /example
  console.log(req.url);       // /example?name=value
  console.log(req.method);    // GET
  
  // IP 地址
  console.log(req.ip);
  
  // Cookie（需要 cookie-parser 中间件）
  console.log(req.cookies);
});
```

### 响应对象（res）

```javascript
app.get('/response', (req, res) => {
  // 发送字符串
  res.send('Hello');
  
  // 发送 JSON
  res.json({ message: 'Hello' });
  
  // 发送状态码
  res.status(404).send('Not Found');
  res.status(201).json({ created: true });
  
  // 重定向
  res.redirect('/new-path');
  res.redirect(301, '/permanent');
  
  // 设置响应头
  res.set('Content-Type', 'text/plain');
  res.set({
    'X-Custom-Header': 'value',
    'X-Another': 'value2'
  });
  
  // 发送文件
  res.sendFile('/path/to/file.pdf');
  
  // 渲染模板
  res.render('index', { title: 'Home' });
  
  // 结束响应
  res.end();
});
```

---

## 6. 错误处理

### 同步错误

```javascript
app.get('/error', (req, res) => {
  throw new Error('出错了！');  // Express 会捕获并传给错误处理中间件
});
```

### 异步错误

```javascript
// 方式1：next(err)
app.get('/async-error', (req, res, next) => {
  fs.readFile('file.txt', (err, data) => {
    if (err) {
      next(err);  // 传给错误处理中间件
      return;
    }
    res.send(data);
  });
});

// 方式2：async/await + try/catch
app.get('/async-await', async (req, res, next) => {
  try {
    const data = await fs.promises.readFile('file.txt');
    res.send(data);
  } catch (err) {
    next(err);
  }
});
```

### 错误处理中间件

```javascript
// 必须放在所有路由之后
// 签名必须有 4 个参数
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      // 生产环境不要暴露堆栈
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

---

## 7. 项目结构最佳实践

```
project/
├── app.js              # 应用入口
├── server.js           # 服务器启动
├── config/             # 配置文件
│   └── database.js
├── routes/             # 路由
│   ├── index.js
│   ├── users.js
│   └── posts.js
├── controllers/        # 控制器（业务逻辑）
│   ├── userController.js
│   └── postController.js
├── models/             # 数据模型
│   ├── User.js
│   └── Post.js
├── middleware/         # 自定义中间件
│   ├── auth.js
│   └── errorHandler.js
├── utils/              # 工具函数
│   └── helpers.js
└── package.json
```

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 错误处理
app.use(errorHandler);

module.exports = app;
```

```javascript
// server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

---

## 8. 学习总结

### 核心概念

| 概念 | 说明 |
|-----|------|
| 路由 | 定义 URI 和请求处理函数的映射 |
| 中间件 | 处理请求/响应的函数，可链式调用 |
| 请求对象 | 包含请求的所有信息 |
| 响应对象 | 用于发送响应给客户端 |
| 错误处理 | 集中处理应用中的错误 |

### 关键技能

1. **定义路由** —— GET/POST/PUT/DELETE
2. **使用中间件** —— 解析 JSON、静态文件、日志等
3. **处理请求** —— 获取参数、查询字符串、请求体
4. **发送响应** —— JSON、状态码、重定向等
5. **错误处理** —— 同步/异步错误，错误处理中间件

### 下一步

学习 MongoDB 数据库操作，实现数据的持久化存储。

---

**学习时间：** 2026-03-14  
**学习时长：** 2.5 小时  
**掌握程度：** ⭐⭐⭐⭐☆
