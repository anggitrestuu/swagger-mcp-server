/**
 * Swagger MCP 工具服务器
 * 这个文件是专门为MCP工具设计的入口点，简化了配置，直接注册所有工具。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// HTTP 协议尚未合并到正式仓库，暂时不使用
// import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import { SwaggerParserTool } from './tools/swagger-parser-tool';
import { OptimizedSwaggerParserTool } from './tools/optimized-swagger-parser-tool';
import { TypeScriptTypesGeneratorTool } from './tools/typescript-types-generator-tool';
import { ApiClientGeneratorTool } from './tools/api-client-generator-tool';
import { FileWriterTool } from './tools/file-writer-tool';

/**
 * 创建并启动MCP工具服务器
 */
export async function startMcpToolsServer(options: {
  name?: string;
  version?: string;
  transportType?: 'stdio'; // 移除 http 选项
  // port?: number; // 不需要端口
} = {}): Promise<void> {
  try {
    // 默认配置
    const name = options.name || 'Swagger MCP Tools';
    const version = options.version || '1.0.0';
    const transportType = options.transportType || 'stdio';
    
    console.error(`启动 ${name} v${version} 使用 ${transportType} 传输...`);
    
    // 创建服务器
    const server = new McpServer({
      name,
      version: version as `${number}.${number}.${number}`,
    });
    
    // 注册所有工具
    registerAllTools(server);
    
    // 设置传输层 - 只使用 stdio
    const transport = new StdioServerTransport();
    server.connect(transport);
    console.error(`🚀 MCP工具服务器已启动，使用stdio传输`);
    
    /* 暂时不支持 HTTP
    if (transportType === 'stdio') {
      const transport = new StdioServerTransport();
      server.connect(transport);
      console.error(`🚀 MCP工具服务器已启动，使用stdio传输`);
    } else if (transportType === 'http') {
      const transport = new HttpServerTransport({
        port,
        endpoint: '/mcp',
      });
      server.connect(transport);
      console.error(`🚀 MCP工具服务器已启动，使用HTTP传输，端口: ${port}`);
    }
    */
  } catch (error) {
    console.error('启动MCP工具服务器失败:', error);
    throw error;
  }
}

/**
 * 注册所有工具
 */
function registerAllTools(server: McpServer): void {
  const tools = [
    new SwaggerParserTool(),
    new OptimizedSwaggerParserTool(),
    new TypeScriptTypesGeneratorTool(),
    new ApiClientGeneratorTool(),
    new FileWriterTool(),
  ];
  
  for (const tool of tools) {
    tool.register(server);
    console.error(`✅ 已注册工具: ${tool.name}`);
  }
  
  console.error(`共注册了 ${tools.length} 个工具`);
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  // 获取命令行参数 - 忽略HTTP相关参数
  // const args = process.argv.slice(2);
  // const transportType = args[0] === 'http' ? 'http' : 'stdio';
  // const port = args[1] ? parseInt(args[1], 10) : 3000;
  
  startMcpToolsServer({
    // transportType: transportType as 'stdio' | 'http',
    // port
  }).catch(error => {
    console.error('启动失败:', error);
    process.exit(1);
  });
}

export { registerAllTools };