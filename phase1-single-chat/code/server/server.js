// server.js
// WebSocket 基础服务器 - 学习用

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

// 存储连接的用户（简化版，实际用 Redis）
const connectedUsers = new Map();

// 监听连接事件
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 保存用户连接
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectTime: new Date()
  });
  
  // 广播用户加入
  socket.broadcast.emit('user-joined', {
    id: socket.id,
    message: '新用户加入',
    totalUsers: connectedUsers.size
  });
  
  // 监听消息事件
  socket.on('message', (data) => {
    console.log('收到消息:', socket.id, data);
    
    // 广播给所有客户端（包括自己）
    io.emit('message', {
      senderId: socket.id,
      text: data,
      time: new Date().toISOString()
    });
  });
  
  // 监听断开事件
  socket.on('disconnect', (reason) => {
    console.log('用户断开:', socket.id, '原因:', reason);
    
    // 移除用户
    connectedUsers.delete(socket.id);
    
    // 广播用户离开
    socket.broadcast.emit('user-left', {
      id: socket.id,
      message: '用户离开',
      totalUsers: connectedUsers.size
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket 服务器运行在 http://localhost:${PORT}`);
  console.log('📚 学习文档: phase1-single-chat/docs/10-WebSocket基础.md');
});
