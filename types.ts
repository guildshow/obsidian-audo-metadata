// 元数据模板接口
export interface MetadataTemplate {
	id: string;
	name: string;
	description: string;
	yamlStructure: string; // YAML 模板结构
	aiPrompt: string; // AI 生成提示词
	isBuiltIn: boolean; // 是否为内置模板
	createdAt: Date;
	updatedAt: Date;
}

// AI API 配置接口
export interface AIApiConfig {
	provider: 'openai' | 'claude' | 'custom';
	apiKey: string;
	baseUrl: string;
	model: string;
	temperature: number;
	maxTokens: number;
	timeout: number;
}

// 插件设置接口
export interface AutoMetaSettings {
	// AI API 设置
	aiConfig: AIApiConfig;
	
	// 模板设置
	templates: MetadataTemplate[];
	defaultTemplateId: string;
	
	// 生成设置
	autoSelectTemplate: boolean; // 是否自动选择合适的模板
	previewBeforeInsert: boolean; // 插入前预览
	replaceExistingMetadata: boolean; // 是否替换现有元数据
}

// AI 生成请求接口
export interface MetadataGenerationRequest {
	documentContent: string;
	fileName: string;
	template: MetadataTemplate;
	existingMetadata?: string;
}

// AI 生成响应接口
export interface MetadataGenerationResponse {
	success: boolean;
	metadata?: string;
	error?: string;
	tokensUsed?: number;
	processingTime?: number;
}

// 模板选择选项
export interface TemplateSelectOption {
	template: MetadataTemplate;
	confidence?: number; // 自动匹配置信度
	reason?: string; // 推荐理由
}


// 使用统计接口
export interface UsageStats {
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	totalTokensUsed: number;
	averageProcessingTime: number;
	lastResetDate: Date;
	lastUsed: Date;
}

// 错误类型枚举
export enum AutoMetaError {
	API_KEY_MISSING = 'API_KEY_MISSING',
	API_REQUEST_FAILED = 'API_REQUEST_FAILED',
	INVALID_RESPONSE = 'INVALID_RESPONSE',
	TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
	DOCUMENT_EMPTY = 'DOCUMENT_EMPTY',
	PARSING_ERROR = 'PARSING_ERROR'
}