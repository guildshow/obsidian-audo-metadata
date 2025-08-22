import { App, TFile, MarkdownView, Notice } from 'obsidian';
import { MetadataTemplate, MetadataGenerationRequest, MetadataGenerationResponse, UsageStats } from './types';
import { AIService } from './ai-service';
import { TemplateManager } from './template-manager';
import { TemplateSelectModal, MetadataPreviewModal } from './ui-components';

export class MetadataGenerator {
	private app: App;
	private aiService: AIService;
	private templateManager: TemplateManager;
	private usageStats: UsageStats;

	constructor(app: App, aiService: AIService, templateManager: TemplateManager) {
		this.app = app;
		this.aiService = aiService;
		this.templateManager = templateManager;
		this.usageStats = {
			totalRequests: 0,
			successfulRequests: 0,
			failedRequests: 0,
			totalTokensUsed: 0,
			averageProcessingTime: 0,
			lastResetDate: new Date(),
			lastUsed: new Date()
		};
	}

	async generateForCurrentFile(autoSelectTemplate: boolean = true, previewBeforeInsert: boolean = true): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.file) {
			new Notice('Please open a Markdown file first');
			return;
		}

		await this.generateForFile(activeView.file, autoSelectTemplate, previewBeforeInsert);
	}

	async generateForFile(file: TFile, autoSelectTemplate: boolean = true, previewBeforeInsert: boolean = true): Promise<void> {
		try {
			// 读取文件内容
			const content = await this.app.vault.read(file);
			const documentContent = this.extractDocumentContent(content);

			if (!documentContent.trim()) {
				new Notice('Document content is empty, cannot generate metadata');
				return;
			}

			// 选择模板
			if (autoSelectTemplate) {
				const suggestions = this.templateManager.suggestTemplates(documentContent, file.name);
				if (suggestions.length === 0) {
					new Notice('No suitable template found');
					return;
				}

				const bestTemplate = suggestions[0].template;
				await this.generateWithTemplate(file, bestTemplate, documentContent, previewBeforeInsert);
			} else {
				// 显示模板选择界面
				this.showTemplateSelection(file, documentContent, previewBeforeInsert);
			}

		} catch (error) {
			new Notice(`Failed to generate metadata: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async generateWithTemplate(
		file: TFile, 
		template: MetadataTemplate, 
		documentContent: string, 
		previewBeforeInsert: boolean = true
	): Promise<void> {
		const startTime = Date.now();
		const loadingNotice = new Notice('Generating metadata...', 0);

		try {

			// 获取现有元数据（如果有的话）
			const existingMetadata = await this.extractExistingMetadata(file);

			// 准备AI请求
			const request: MetadataGenerationRequest = {
				documentContent,
				fileName: file.name,
				template,
				existingMetadata
			};

			// 调用AI生成元数据
			const response = await this.aiService.generateMetadata(request);

			loadingNotice.hide();

			if (!response.success || !response.metadata) {
				throw new Error(response.error || 'Generation failed');
			}

			// 更新使用统计
			this.updateUsageStats(response, Date.now() - startTime);

			// 预览或直接插入
			if (previewBeforeInsert) {
				this.showMetadataPreview(file, response.metadata, template);
			} else {
				await this.insertMetadata(file, response.metadata);
				new Notice('Metadata generated and inserted');
			}

		} catch (error) {
			loadingNotice.hide();
			this.usageStats.failedRequests++;
			throw error;
		}
	}

	private showTemplateSelection(file: TFile, documentContent: string, previewBeforeInsert: boolean): void {
		const suggestions = this.templateManager.suggestTemplates(documentContent, file.name);
		const allTemplates = this.templateManager.getAllTemplates().map(template => ({
			template,
			confidence: suggestions.find(s => s.template.id === template.id)?.confidence || 0.1,
			reason: suggestions.find(s => s.template.id === template.id)?.reason
		}));

		const modal = new TemplateSelectModal(
			this.app,
			allTemplates,
			(selectedTemplate) => {
				this.generateWithTemplate(file, selectedTemplate, documentContent, previewBeforeInsert);
			}
		);

		modal.open();
	}

	private showMetadataPreview(file: TFile, metadata: string, template: MetadataTemplate): void {
		const modal = new MetadataPreviewModal(
			this.app,
			metadata,
			file.name,
			template,
			async (finalMetadata) => {
				await this.insertMetadata(file, finalMetadata);
				new Notice('Metadata inserted');
			},
			undefined, // onCancel
			() => {
				// 重新生成
				this.generateForFile(file, false, true);
			}
		);

		modal.open();
	}

	async insertMetadata(file: TFile, metadata: string, replaceExisting: boolean = false): Promise<void> {
		const content = await this.app.vault.read(file);
		let newContent: string;

		if (content.startsWith('---')) {
			// 已有元数据的处理
			const endIndex = content.indexOf('---', 3);
			if (endIndex !== -1) {
				if (replaceExisting) {
					// 替换现有元数据
					newContent = `---\n${metadata}\n---\n${content.substring(endIndex + 4)}`;
				} else {
					// 合并元数据
					const existingMetadata = content.substring(4, endIndex);
					const mergedMetadata = this.mergeMetadata(existingMetadata, metadata);
					newContent = `---\n${mergedMetadata}\n---\n${content.substring(endIndex + 4)}`;
				}
			} else {
				// 格式异常，直接添加新元数据
				newContent = `---\n${metadata}\n---\n\n${content}`;
			}
		} else {
			// 没有现有元数据，直接添加
			newContent = `---\n${metadata}\n---\n\n${content}`;
		}

		await this.app.vault.modify(file, newContent);
	}

	private mergeMetadata(existing: string, newMetadata: string): string {
		const existingLines = existing.split('\n').filter(line => line.trim());
		const newLines = newMetadata.split('\n').filter(line => line.trim());

		// 简单的合并策略：新数据覆盖现有数据，保留未重复的字段
		const result: string[] = [];
		const processedKeys = new Set<string>();

		// 处理新元数据
		for (const newLine of newLines) {
			const colonIndex = newLine.indexOf(':');
			if (colonIndex > 0) {
				const key = newLine.substring(0, colonIndex).trim();
				processedKeys.add(key);
			}
			result.push(newLine);
		}

		// 添加未被覆盖的现有元数据
		for (const existingLine of existingLines) {
			const colonIndex = existingLine.indexOf(':');
			if (colonIndex > 0) {
				const key = existingLine.substring(0, colonIndex).trim();
				if (!processedKeys.has(key)) {
					result.push(existingLine);
				}
			} else {
				// 处理数组元素等非键值对行
				result.push(existingLine);
			}
		}

		return result.join('\n');
	}

	private extractDocumentContent(content: string): string {
		if (content.startsWith('---')) {
			const endIndex = content.indexOf('---', 3);
			if (endIndex !== -1) {
				return content.substring(endIndex + 4).trim();
			}
		}
		return content.trim();
	}

	private async extractExistingMetadata(file: TFile): Promise<string | undefined> {
		const content = await this.app.vault.read(file);
		
		if (content.startsWith('---')) {
			const endIndex = content.indexOf('---', 3);
			if (endIndex !== -1) {
				return content.substring(4, endIndex).trim();
			}
		}
		
		return undefined;
	}

	async batchGenerate(
		files: TFile[], 
		templateId: string, 
		options: {
			replaceExisting?: boolean;
			maxConcurrent?: number;
			onProgress?: (current: number, total: number, fileName: string) => void;
		} = {}
	): Promise<{ success: number; failed: number; errors: string[] }> {
		const template = this.templateManager.getTemplate(templateId);
		if (!template) {
			throw new Error('Template does not exist');
		}

		const { maxConcurrent = 3, onProgress, replaceExisting = false } = options;
		const results = { success: 0, failed: 0, errors: [] as string[] };

		// 分批处理
		for (let i = 0; i < files.length; i += maxConcurrent) {
			const batch = files.slice(i, i + maxConcurrent);
			
			const batchPromises = batch.map(async (file) => {
				try {
					onProgress?.(i + batch.indexOf(file), files.length, file.name);
					
					const content = await this.app.vault.read(file);
					const documentContent = this.extractDocumentContent(content);
					
					if (!documentContent.trim()) {
						throw new Error('Document content is empty');
					}

					const request: MetadataGenerationRequest = {
						documentContent,
						fileName: file.name,
						template
					};

					const response = await this.aiService.generateMetadata(request);
					
					if (!response.success || !response.metadata) {
						throw new Error(response.error || 'Generation failed');
					}

					await this.insertMetadata(file, response.metadata, replaceExisting);
					this.updateUsageStats(response, response.processingTime || 0);
					
					results.success++;
					
				} catch (error) {
					results.failed++;
					results.errors.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
				}
			});

			await Promise.all(batchPromises);
		}

		return results;
	}

	private updateUsageStats(response: MetadataGenerationResponse, processingTime: number): void {
		this.usageStats.totalRequests++;
		
		if (response.success) {
			this.usageStats.successfulRequests++;
		} else {
			this.usageStats.failedRequests++;
		}
		
		if (response.tokensUsed) {
			this.usageStats.totalTokensUsed += response.tokensUsed;
		}
		
		// 更新平均处理时间
		this.usageStats.averageProcessingTime = 
			(this.usageStats.averageProcessingTime * (this.usageStats.totalRequests - 1) + processingTime) / 
			this.usageStats.totalRequests;
			
		this.usageStats.lastUsed = new Date();
	}

	getUsageStats(): UsageStats {
		return { ...this.usageStats };
	}

	resetUsageStats(): void {
		this.usageStats = {
			totalRequests: 0,
			successfulRequests: 0,
			failedRequests: 0,
			totalTokensUsed: 0,
			averageProcessingTime: 0,
			lastResetDate: new Date(),
			lastUsed: new Date()
		};
	}

	estimateCost(content: string): { tokens: number; estimatedCost: number } {
		const tokens = this.aiService.estimateTokens(content);
		const estimatedCost = (tokens / 1000) * 0.002;
		return { tokens, estimatedCost };
	}
}