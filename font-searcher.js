#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 配置
const PORT = 3456;
const PUBLIC_URL = 'https://blog.luckly-mjw.cn/tool-show/iconfont-preview/index.html';
const FONT_EXTENSIONS = ['.ttf', '.woff', '.woff2', '.otf', '.eot'];

/**
 * 解析命令行参数
 * @returns {object} 解析后的参数对象
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    path: process.cwd(),
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-p' || arg === '--path') {
      // 获取 -p 后面的路径参数
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        options.path = path.resolve(args[i + 1]);
        i++; // 跳过下一个参数
      } else {
        console.error('错误: -p 参数需要指定一个路径');
        process.exit(1);
      }
    } else if (!arg.startsWith('-')) {
      // 兼容旧的位置参数方式（直接传路径）
      options.path = path.resolve(arg);
    } else {
      console.error(`错误: 未知参数 "${arg}"`);
      console.log('使用 -h 或 --help 查看帮助信息');
      process.exit(1);
    }
  }
  
  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
Iconfont Preview - 本地字体文件扫描服务

用法:
  node font-searcher.js [选项] [路径]

选项:
  -p, --path <路径>    指定要扫描的目录路径
  -h, --help           显示此帮助信息

示例:
  node font-searcher.js                      # 扫描当前目录
  node font-searcher.js ./fonts              # 扫描 ./fonts 目录（位置参数方式）
  node font-searcher.js -p ./fonts           # 扫描 ./fonts 目录
  node font-searcher.js -p "C:\\Users\\fonts" # 扫描指定的绝对路径

说明:
  启动后会自动扫描指定目录下的字体文件（.ttf, .woff, .woff2, .otf, .eot），
  并启动本地 HTTP 服务器提供 API 接口，同时自动打开浏览器预览页面。

API 接口:
  /api/fonts           获取字体文件列表
  /api/font?path=xxx   获取指定字体文件内容
  /api/health          健康检查

按 Ctrl+C 停止服务器。
`);
}

// 解析命令行参数
const options = parseArgs();

// 显示帮助信息
if (options.help) {
  showHelp();
  process.exit(0);
}

// 检查扫描路径是否存在
const scanPath = options.path;
if (!fs.existsSync(scanPath)) {
  console.error(`错误: 指定的路径不存在: ${scanPath}`);
  process.exit(1);
}

if (!fs.statSync(scanPath).isDirectory()) {
  console.error(`错误: 指定的路径不是一个目录: ${scanPath}`);
  process.exit(1);
}

/**
 * 深度遍历目录，查找字体文件
 * @param {string} dir - 要遍历的目录路径
 * @param {string[]} fontFiles - 已找到的字体文件列表
 * @returns {string[]} - 字体文件路径列表
 */
function findFontFiles(dir, fontFiles = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 跳过 node_modules 和 .git 等目录
          if (!['node_modules', '.git', '.svn', '.hg'].includes(file)) {
            findFontFiles(filePath, fontFiles);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (FONT_EXTENSIONS.includes(ext)) {
            fontFiles.push({
              name: file,
              path: filePath,
              relativePath: path.relative(scanPath, filePath),
              ext: ext,
              size: stat.size
            });
          }
        }
      } catch (err) {
        // 忽略无法访问的文件
        console.warn(`无法访问: ${filePath}`);
      }
    }
  } catch (err) {
    console.warn(`无法读取目录: ${dir}`);
  }
  
  return fontFiles;
}

/**
 * 设置 CORS 响应头
 * @param {http.ServerResponse} res 
 */
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 发送 JSON 响应
 * @param {http.ServerResponse} res 
 * @param {object} data 
 * @param {number} statusCode 
 */
function sendJSON(res, data, statusCode = 200) {
  setCORSHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/**
 * 发送文件响应
 * @param {http.ServerResponse} res 
 * @param {string} filePath 
 */
function sendFile(res, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.ttf': 'font/ttf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.otf': 'font/otf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileContent = fs.readFileSync(filePath);
    
    setCORSHeaders(res);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);
  } catch (err) {
    sendJSON(res, { error: '文件读取失败', message: err.message }, 500);
  }
}

/**
 * 获取本机 IP 地址
 * @returns {string}
 */
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

/**
 * 打开浏览器
 * @param {string} url 
 */
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (err) => {
    if (err) {
      console.log(`请手动打开浏览器访问: ${url}`);
    }
  });
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API 路由
  if (pathname === '/api/fonts') {
    // 获取字体文件列表
    console.log(`扫描目录: ${scanPath}`);
    const fontFiles = findFontFiles(scanPath);
    console.log(`找到 ${fontFiles.length} 个字体文件`);
    sendJSON(res, {
      success: true,
      scanPath: scanPath,
      count: fontFiles.length,
      fonts: fontFiles
    });
  } else if (pathname === '/api/font') {
    // 获取单个字体文件内容
    const fontPath = url.searchParams.get('path');
    
    if (!fontPath) {
      sendJSON(res, { error: '缺少 path 参数' }, 400);
      return;
    }
    
    // 安全检查：确保请求的文件在扫描目录内
    const absolutePath = path.isAbsolute(fontPath) ? fontPath : path.join(scanPath, fontPath);
    const normalizedPath = path.normalize(absolutePath);
    
    if (!normalizedPath.startsWith(path.normalize(scanPath))) {
      sendJSON(res, { error: '访问被拒绝' }, 403);
      return;
    }
    
    if (!fs.existsSync(normalizedPath)) {
      sendJSON(res, { error: '文件不存在' }, 404);
      return;
    }
    
    console.log(`提供字体文件: ${normalizedPath}`);
    sendFile(res, normalizedPath);
  } else if (pathname === '/api/health') {
    // 健康检查
    sendJSON(res, { status: 'ok', scanPath: scanPath });
  } else {
    sendJSON(res, { error: '未找到该接口' }, 404);
  }
});

// 启动服务器
server.listen(PORT, () => {
  const localIP = getLocalIP();
  const hostUrl = `http://${localIP}:${PORT}`;
  const previewUrl = `${PUBLIC_URL}?host=${encodeURIComponent(hostUrl)}`;
  
  console.log('');
  console.log('='.repeat(60));
  console.log('  Iconfont Preview 本地服务器已启动');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  扫描目录: ${scanPath}`);
  console.log(`  本地 API: ${hostUrl}`);
  console.log('');
  console.log('  API 接口:');
  console.log(`    - 获取字体列表: ${hostUrl}/api/fonts`);
  console.log(`    - 获取字体文件: ${hostUrl}/api/font?path=<相对路径>`);
  console.log(`    - 健康检查: ${hostUrl}/api/health`);
  console.log('');
  console.log('  预览页面:');
  console.log(`    ${previewUrl}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('  正在打开浏览器...');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('='.repeat(60));
  console.log('');
  
  // 自动打开浏览器
  openBrowser(previewUrl);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
