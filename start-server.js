#!/usr/bin/env node

/**
 * Swagger MCP 服务器启动脚本
 */
const path = require('path');
const fs = require('fs');

// 使用__dirname获取脚本所在目录，而非process.cwd()
// 这样无论从哪里调用，都能正确定位配置文件
const defaultConfigPath = path.join(__dirname, 'swagger-mcp-config.json');
if (!fs.existsSync(defaultConfigPath)) {
  // 创建默认配置
  const defaultConfig = {
    name: "Swagger MCP Server",
    version: "1.0.0",
    transport: "stdio"
  };
  
  fs.writeFileSync(
    defaultConfigPath, 
    JSON.stringify(defaultConfig, null, 2), 
    'utf8'
  );
  
  console.error(`📝 已创建默认配置文件: ${defaultConfigPath}`);
}

// 启动服务器
try {
  const configPath = process.argv[2] || defaultConfigPath;
  console.error(`🚀 正在启动Swagger MCP服务器，使用配置文件: ${configPath}`);
  
  // 导入并启动主函数
  require('./dist/index.js').main(configPath);
} catch (error) {
  console.error('❌ 启动失败:', error);
  process.exit(1);
} 