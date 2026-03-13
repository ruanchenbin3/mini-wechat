# WebSocket 基础学习

**学习目标：**
- [x] 理解 WebSocket 与 HTTP 的区别
- [x] 理解 WebSocket 握手过程
- [ ] 学会使用 Socket.io
- [ ] 实现基础的消息推送

---

## 1. 为什么需要 WebSocket？

### HTTP 的问题

HTTP 是**请求-响应**模式：
```
客户端：我要数据 → 服务端：给你数据
客户端：我要数据 → 服务端：给你数据
...
```

**问题：** 服务端不能主动推送数据给客户端。

### 传统解决方案

| 方案 | 原理 | 缺点 |
|-----|------|------|
| 轮询 | 客户端定时请求 | 浪费带宽，延迟高 |
| 长轮询 | 保持连接直到有数据 | 服务器压力大 |
| SSE | 服务端单向推送 | 不能双向通信 |

### WebSocket 的优势

WebSocket 是**全双工**通信：
```
建立连接后：
客户端 → 服务端：随时发送
服务端 → 客户端：随时发送
```

**特点：**
- 一次握手，长期连接
- 双向实时通信
- 数据帧轻量（比 HTTP 头小很多）

---

## 2. WebSocket 握手过程

### 2.1 HTTP Upgrade 请求

客户端发送 HTTP 请求，要求升级协议：

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket              // 要求升级
Connection: Upgrade             // 连接类型
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  // 随机密钥
Sec-WebSocket-Version: 13     // 协议版本
```

**关键头：**
- `Upgrade: websocket` —— 要升级到 WebSocket
- `Connection: Upgrade` —— 当前连接用于升级
- `Sec-WebSocket-Key` —— Base64 编码的随机 16 字节

### 2.2 服务端响应

服务端同意升级：

```http
HTTP/1.1 101 Switching Protocols  // 101 = 协议切换
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=  // 计算后的密钥
```

**`Sec-WebSocket-Accept` 计算：**
1. 拿到客户端的 `Sec-WebSocket-Key`
2. 拼接固定字符串：`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`
3. SHA-1 哈希
4. Base64 编码

**为什么这样设计？**
- 防止误连接（确认服务端支持 WebSocket）
- 防止缓存攻击（随机 Key）

### 2.3 握手成功后

连接从 HTTP 升级为 WebSocket：
- 使用 `ws://` 或 `wss://`（加密）
- 数据以**帧（Frame）**为单位传输
- 双方可以随时发送数据

---

## 3. WebSocket 数据帧

### 帧结构（简化版）

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

**关键字段：**
- `FIN` —— 是否为最后一帧
- `opcode` —— 帧类型（1=文本，2=二进制，8=关闭）
- `MASK` —— 是否掩码（客户端必须掩码，服务端不掩码）
- `Payload len` —— 数据长度
- `Masking-key` —— 掩码密钥（4字节）

### 为什么需要掩码？

**安全原因：** 防止缓存投毒攻击

客户端发送的数据必须掩码：
```
原始数据 XOR 掩码密钥 = 传输数据
```

服务端发送的数据不掩码（已经解密过了）。

---

## 4. Socket.io 是什么？

### 原生 WebSocket 的问题
n
1. **API 底层** —— 需要自己处理重连、心跳等
2. **兼容性问题** —— 旧浏览器不支持
3. **功能缺失** —— 没有房间、广播等高级功能

### Socket.io 的封装

Socket.io 在 WebSocket 之上封装了：
- **自动重连** —— 断线后自动尝试重连
- **心跳检测** —— 检测连接是否存活
- **降级策略** —— 不支持 WebSocket 时自动降级到长轮询
- **房间管理** —— 分组广播
- **命名空间** —— 多应用隔离

### Socket.io 架构

```
客户端                    服务端
   |                        |
   |--- 1. HTTP 请求 ------>|  // 先尝试 WebSocket
   |<-- 2. 同意升级 --------|
   |                        |
   |--- 3. WebSocket 连接 ->|  // 成功
   |<-- 4. 确认连接 --------|
   |                        |
   |=== 实时双向通信 =======|  // 开始通信
```

---

## 5. 代码实现：基础 WebSocket 服务器

### 5.1 安装依赖

```bash
npm install socket.io
```

### 5.2 服务端代码

```javascript
// server.js
const http = require('http');
const { Server } = require('socket.io');

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Server\n');
});

// 创建 Socket.io 实例
const io = new Server(server, {
  cors: {
    origin: "*",  // 允许所有来源（开发环境）
    methods: ["GET", "POST"]
  }
});

// 监听连接事件
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 监听消息事件
  socket.on('message', (data) => {
    console.log('收到消息:', data);
    
    // 广播给所有客户端（包括自己）
    io.emit('message', {
      id: socket.id,
      text: data,
      time: new Date().toISOString()
    });
  });
  
  // 监听断开事件
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

**关键代码解释：**

```javascript
// 创建 Socket.io 实例，绑定到 HTTP 服务器
const io = new Server(server, { ... });

// connection 事件：有新客户端连接
io.on('connection', (socket) => {
  // socket 对象代表当前连接
  // socket.id 是唯一的连接标识
  
  // 监听客户端发送的 'message' 事件
  socket.on('message', (data) => { ... });
  
  // 向所有客户端广播
  io.emit('message', data);
  
  // 向当前客户端发送
  socket.emit('message', data);
  
  // 向除自己外的所有客户端发送
  socket.broadcast.emit('message', data);
});
```

### 5.3 客户端代码

```html
<!-- client.html -->
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
</head>
<body>
  <h1>Mini WeChat - WebSocket 测试</h1>
  
  <div id="status">未连接</div>
  
  <input type="text" id="messageInput" placeholder="输入消息">
  <button onclick="sendMessage()">发送</button>
  
  <div id="messages"></div>
  
  <!-- 引入 Socket.io 客户端库 -->
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  
  <script>
    // 连接服务器
    const socket = io('http://localhost:3000');
    
    // 连接成功
    socket.on('connect', () => {
      document.getElementById('status').textContent = '已连接: ' + socket.id;
      console.log('连接成功:', socket.id);
    });
    
    // 收到消息
    socket.on('message', (data) => {
      console.log('收到消息:', data);
      const div = document.createElement('div');
      div.textContent = `[${data.time}] ${data.id}: ${data.text}`;
      document.getElementById('messages').appendChild(div);
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      document.getElementById('status').textContent = '已断开';
    });
    
    // 发送消息
    function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value;
      if (message) {
        socket.emit('message', message);
        input.value = '';
      }
    }
    
    // 回车发送
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
```

**关键代码解释：**

```javascript
// 连接服务器
const socket = io('http://localhost:3000');

// connect 事件：连接成功
socket.on('connect', () => { ... });

// 监听服务端发送的 'message' 事件
socket.on('message', (data) => { ... });

// 向服务端发送 'message' 事件
socket.emit('message', data);
```

### 5.4 运行测试

```bash
# 1. 启动服务端
node server.js

# 2. 打开客户端（用浏览器打开 client.html）
# 打开多个窗口测试多人聊天
```

---

## 6. 踩坑记录

### 问题 1：跨域错误

**现象：**
```
Access to XMLHttpRequest at 'http://localhost:3000/socket.io/...' 
from origin 'null' has been blocked by CORS policy
```

**原因：** 浏览器安全策略，不同源不能访问

**解决：**
```javascript
const io = new Server(server, {
  cors: {
    origin: "*",  // 开发环境允许所有
    methods: ["GET", "POST"]
  }
});
```

### 问题 2：客户端连接不上

**现象：** 客户端显示"未连接"

**排查步骤：**
1. 检查服务端是否启动
2. 检查端口是否正确
3. 检查防火墙
4. 浏览器控制台看网络请求

### 问题 3：消息重复

**现象：** 一条消息显示多次

**原因：** 可能重复绑定了事件监听器

**解决：** 确保 `socket.on()` 只绑定一次

---

## 7. 学习总结

### 学到了什么

1. **WebSocket 是全双工通信** —— 双方可以随时发送数据
2. **握手使用 HTTP Upgrade** —— 101 状态码表示协议切换
3. **Socket.io 封装了重连、心跳等机制** —— 生产环境推荐用
4. **事件驱动编程** —— `on` 监听，`emit` 发送

### 还有什么不懂

- [ ] WebSocket 帧的详细格式
- [ ] Socket.io 的 ACK 机制
- [ ] 如何扩展支持百万连接

### 下一步计划

1. 实现用户系统（注册/登录）
2. 将 WebSocket 与用户身份关联
3. 实现点对点消息（而不是广播）

---

## 参考资源

- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Socket.io 官方文档](https://socket.io/docs/)
- [MDN WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)

---

**学习时间：** 2026-03-14  
**学习时长：** 3 小时  
**掌握程度：** ⭐⭐⭐⭐☆
