/**
 * Template Manager
 * Responsible for managing and processing various code generation templates
 */
import fs from 'fs/promises';
import path from 'path';

// 使用__dirname获取当前文件所在目录，然后定位到templates目录
// 编译后文件在 dist/templates/template-manager.js
// 需要定位到 src/templates (与dist同级的src目录下)
const CURRENT_DIR = __dirname;
// 从 dist/templates 回到项目根目录，再进入 src/templates
const PROJECT_ROOT = path.resolve(CURRENT_DIR, '..', '..');
const TEMPLATES_ROOT = path.join(PROJECT_ROOT, 'src', 'templates');

// 内置模板目录
const BUILT_IN_TEMPLATES_DIR = path.join(TEMPLATES_ROOT, 'built-in');
// 自定义模板目录
const CUSTOM_TEMPLATES_DIR = path.join(TEMPLATES_ROOT, 'custom');
// 模板配置文件
const BUILT_IN_TEMPLATES_CONFIG = path.join(BUILT_IN_TEMPLATES_DIR, 'templates.json');
const CUSTOM_TEMPLATES_CONFIG = path.join(CUSTOM_TEMPLATES_DIR, 'templates.json');

// Template type enum
export enum TemplateType {
  API_CLIENT = 'api-client',
  TYPESCRIPT_TYPES = 'typescript-types',
  CONFIG_FILE = 'config-file'
}

// Framework type enum
export enum FrameworkType {
  AXIOS = 'axios',
  FETCH = 'fetch',
  REACT_QUERY = 'react-query',
  SWR = 'swr',
  ANGULAR = 'angular',
  VUE = 'vue'
}

// Template interface
export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  framework?: FrameworkType;
  path?: string;
  content?: string;
  isBuiltIn?: boolean;
  description?: string;
}

// 模板配置接口
interface TemplatesConfig {
  templates: Array<Omit<Template, 'content'>>;
}

/**
 * 模板管理器选项
 */
interface TemplateManagerOptions {
  builtInTemplatesDir?: string;
  customTemplatesDir?: string;
}

/**
 * 模板管理器类
 */
export class TemplateManager {
  private builtInTemplates: Template[] = [];
  private customTemplates: Template[] = [];
  private initialized: boolean = false;
  
  /**
   * 构造函数
   */
  constructor(options: TemplateManagerOptions = {}) {
    // 暂时不使用options中的路径，使用常量定义的路径
  }
  
  /**
   * 初始化模板管理器
   * 加载内置模板和自定义模板
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // 确保目录存在
      await this.ensureDirectoriesExist();
      
      // 加载内置模板
      await this.loadBuiltInTemplates();
      
      // 加载自定义模板
      await this.loadCustomTemplates();
      
      this.initialized = true;
      console.error(`🎯 模板管理器初始化完成, 内置模板: ${this.builtInTemplates.length}, 自定义模板: ${this.customTemplates.length}`);
    } catch (error) {
      console.error('模板管理器初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 确保必要的目录存在
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      // 确保自定义模板目录存在
      await fs.mkdir(CUSTOM_TEMPLATES_DIR, { recursive: true });
      
      // 如果自定义模板配置文件不存在，创建一个空的配置文件
      try {
        await fs.access(CUSTOM_TEMPLATES_CONFIG);
      } catch (error) {
        await fs.writeFile(CUSTOM_TEMPLATES_CONFIG, JSON.stringify({ templates: [] }, null, 2));
      }
    } catch (error) {
      console.error('确保目录存在失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载内置模板
   */
  private async loadBuiltInTemplates(): Promise<void> {
    try {
      // 读取内置模板配置
      const configContent = await fs.readFile(BUILT_IN_TEMPLATES_CONFIG, 'utf-8');
      const config: TemplatesConfig = JSON.parse(configContent);
      
      // 为每个模板加载内容
      for (const template of config.templates) {
        const templatePath = path.join(BUILT_IN_TEMPLATES_DIR, template.path!);
        const content = await fs.readFile(templatePath, 'utf-8');
        
        this.builtInTemplates.push({
          ...template,
          content,
          isBuiltIn: true
        });
      }
    } catch (error) {
      console.error('加载内置模板失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载自定义模板
   */
  private async loadCustomTemplates(): Promise<void> {
    try {
      // 读取自定义模板配置
      const configContent = await fs.readFile(CUSTOM_TEMPLATES_CONFIG, 'utf-8');
      const config: TemplatesConfig = JSON.parse(configContent);
      
      // 为每个模板加载内容
      for (const template of config.templates) {
        const templatePath = path.join(CUSTOM_TEMPLATES_DIR, template.path!);
        try {
          const content = await fs.readFile(templatePath, 'utf-8');
          
          this.customTemplates.push({
            ...template,
            content,
            isBuiltIn: false
          });
        } catch (error) {
          console.warn(`无法加载自定义模板 ${template.id}:`, error);
          // 跳过无法加载的模板
          continue;
        }
      }
    } catch (error) {
      console.error('加载自定义模板失败:', error);
      // 如果是文件不存在的错误，则创建一个空的配置文件
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(CUSTOM_TEMPLATES_CONFIG, JSON.stringify({ templates: [] }, null, 2));
      } else {
        throw error;
      }
    }
  }
  
  /**
   * 获取所有模板
   */
  getAllTemplates(): Template[] {
    return [...this.builtInTemplates, ...this.customTemplates];
  }
  
  /**
   * 根据类型获取模板
   */
  getTemplatesByType(type: TemplateType): Template[] {
    return this.getAllTemplates().filter(template => template.type === type);
  }
  
  /**
   * 根据ID获取模板
   */
  getTemplate(id: string): Template | undefined {
    return this.getAllTemplates().find(template => template.id === id);
  }
  
  /**
   * 根据类型和框架获取模板
   */
  getTemplateByTypeAndFramework(type: TemplateType, framework?: FrameworkType): Template | undefined {
    return this.getAllTemplates().find(template => 
      template.type === type && 
      (framework ? template.framework === framework : true)
    );
  }
  
  /**
   * 保存自定义模板
   */
  async saveCustomTemplate(template: Template): Promise<Template> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // 检查是否是内置模板
      const existingTemplate = this.getTemplate(template.id);
      if (existingTemplate?.isBuiltIn) {
        throw new Error(`Cannot override built-in template: ${template.id}`);
      }
      
      // 生成保存路径
      let relativePath: string;
      if (template.type === TemplateType.API_CLIENT) {
        relativePath = `api-client/${template.id}.tpl`;
      } else if (template.type === TemplateType.TYPESCRIPT_TYPES) {
        relativePath = `typescript-types/${template.id}.tpl`;
      } else if (template.type === TemplateType.CONFIG_FILE) {
        relativePath = `config/${template.id}.tpl`;
      } else {
        relativePath = `${template.id}.tpl`;
      }
      
      // 确保子目录存在
      const dirPath = path.join(CUSTOM_TEMPLATES_DIR, path.dirname(relativePath));
      await fs.mkdir(dirPath, { recursive: true });
      
      // 保存模板内容
      const templatePath = path.join(CUSTOM_TEMPLATES_DIR, relativePath);
      await fs.writeFile(templatePath, template.content || '');
      
      // 更新模板配置
      const newTemplate: Template = {
        id: template.id,
        name: template.name,
        type: template.type,
        framework: template.framework,
        path: relativePath,
        description: template.description,
        isBuiltIn: false
      };
      
      // 更新内存中的自定义模板
      const existingIndex = this.customTemplates.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        // 更新现有模板
        this.customTemplates[existingIndex] = {
          ...newTemplate,
          content: template.content
        };
      } else {
        // 添加新模板
        this.customTemplates.push({
          ...newTemplate,
          content: template.content
        });
      }
      
      // 更新配置文件
      await this.updateCustomTemplatesConfig();
      
      return {
        ...newTemplate,
        content: template.content
      };
    } catch (error) {
      console.error('保存自定义模板失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除自定义模板
   */
  async deleteCustomTemplate(id: string): Promise<boolean> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // 获取模板
      const template = this.getTemplate(id);
      
      // 检查是否是内置模板或不存在
      if (!template) {
        return false;
      }
      
      if (template.isBuiltIn) {
        throw new Error(`Cannot delete built-in template: ${id}`);
      }
      
      // 删除模板文件
      const templatePath = path.join(CUSTOM_TEMPLATES_DIR, template.path!);
      await fs.unlink(templatePath);
      
      // 从内存中移除
      this.customTemplates = this.customTemplates.filter(t => t.id !== id);
      
      // 更新配置文件
      await this.updateCustomTemplatesConfig();
      
      return true;
    } catch (error) {
      console.error('删除自定义模板失败:', error);
      return false;
    }
  }
  
  /**
   * 更新自定义模板配置文件
   */
  private async updateCustomTemplatesConfig(): Promise<void> {
    try {
      // 准备配置数据
      const configData: TemplatesConfig = {
        templates: this.customTemplates.map(({ content, ...rest }) => rest)
      };
      
      // 写入配置文件
      await fs.writeFile(
        CUSTOM_TEMPLATES_CONFIG,
        JSON.stringify(configData, null, 2)
      );
    } catch (error) {
      console.error('更新自定义模板配置失败:', error);
      throw error;
    }
  }
} 