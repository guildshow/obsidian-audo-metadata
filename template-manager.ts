import { MetadataTemplate, TemplateSelectOption } from './types';
import { BUILT_IN_TEMPLATES } from './defaults';

export class TemplateManager {
	private templates: Map<string, MetadataTemplate> = new Map();

	constructor() {
		this.initializeBuiltInTemplates();
	}

	/**
	 * 初始化内置模板
	 */
	private initializeBuiltInTemplates(): void {
		BUILT_IN_TEMPLATES.forEach(template => {
			this.templates.set(template.id, template);
		});
	}

	getAllTemplates(): MetadataTemplate[] {
		return Array.from(this.templates.values());
	}

	getCustomTemplates(): MetadataTemplate[] {
		return Array.from(this.templates.values()).filter(t => !t.isBuiltIn);
	}

	getBuiltInTemplates(): MetadataTemplate[] {
		return Array.from(this.templates.values()).filter(t => t.isBuiltIn);
	}

	/**
	 * 根据ID获取模板
	 */
	getTemplate(id: string): MetadataTemplate | undefined {
		return this.templates.get(id);
	}

	/**
	 * 添加新模板
	 */
	addTemplate(template: Omit<MetadataTemplate, 'id' | 'createdAt' | 'updatedAt'>): MetadataTemplate {
		const newTemplate: MetadataTemplate = {
			...template,
			id: this.generateTemplateId(),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.templates.set(newTemplate.id, newTemplate);
		return newTemplate;
	}

	/**
	 * 更新模板
	 */
	updateTemplate(id: string, updates: Partial<Omit<MetadataTemplate, 'id' | 'isBuiltIn' | 'createdAt'>>): boolean {
		const template = this.templates.get(id);
		if (!template || template.isBuiltIn) {
			return false; // 不允许更新内置模板
		}

		const updatedTemplate: MetadataTemplate = {
			...template,
			...updates,
			updatedAt: new Date()
		};

		this.templates.set(id, updatedTemplate);
		return true;
	}

	/**
	 * 删除模板
	 */
	deleteTemplate(id: string): boolean {
		const template = this.templates.get(id);
		if (!template || template.isBuiltIn) {
			return false; // 不允许删除内置模板
		}

		return this.templates.delete(id);
	}

	/**
	 * 复制模板（用于基于现有模板创建新模板）
	 */
	duplicateTemplate(id: string, name?: string): MetadataTemplate | null {
		const originalTemplate = this.templates.get(id);
		if (!originalTemplate) {
			return null;
		}

		const duplicatedTemplate = this.addTemplate({
			name: name || `${originalTemplate.name} (Copy)`,
			description: originalTemplate.description,
			yamlStructure: originalTemplate.yamlStructure,
			aiPrompt: originalTemplate.aiPrompt,
			isBuiltIn: false
		});

		return duplicatedTemplate;
	}

	/**
	 * 智能推荐模板
	 * 根据文档内容分析推荐合适的模板
	 */
	suggestTemplates(documentContent: string, fileName?: string): TemplateSelectOption[] {
		const suggestions: TemplateSelectOption[] = [];
		const content = documentContent.toLowerCase();
		const filename = fileName?.toLowerCase() || '';

		// 基于关键词的简单匹配逻辑
		const templates = this.getAllTemplates();
		
		for (const template of templates) {
			let confidence = 0;
			let reason = '';

			switch (template.id) {
				case 'academic-paper':
					if (this.containsAcademicKeywords(content) || filename.includes('paper')) {
						confidence = 0.8;
						reason = 'Detected academic keywords or filename contains "paper"';
					}
					break;

				case 'meeting-notes':
					if (this.containsMeetingKeywords(content) || filename.includes('meeting')) {
						confidence = 0.9;
						reason = 'Detected meeting-related content';
					}
					break;

				case 'book-review':
					if (this.containsBookKeywords(content) || filename.includes('book')) {
						confidence = 0.85;
						reason = 'Detected book-related content';
					}
					break;

				case 'project-doc':
					if (this.containsProjectKeywords(content) || filename.includes('project')) {
						confidence = 0.75;
						reason = 'Detected project-related content';
					}
					break;

				case 'general-note':
					confidence = 0.3; // General template always has basic match score
					reason = 'General template, suitable for all types of notes';
					break;
			}

			if (confidence > 0.2) {
				suggestions.push({
					template,
					confidence,
					reason
				});
			}
		}

		// 按匹配度排序
		return suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
	}

	/**
	 * 验证模板格式
	 */
	validateTemplate(template: Partial<MetadataTemplate>): string[] {
		const errors: string[] = [];

		if (!template.name?.trim()) {
			errors.push('Template name cannot be empty');
		}

		if (!template.yamlStructure?.trim()) {
			errors.push('YAML structure cannot be empty');
		}

		if (!template.aiPrompt?.trim()) {
			errors.push('AI prompt cannot be empty');
		}

		// 简单的YAML格式验证
		if (template.yamlStructure) {
			try {
				// 这里可以添加更严格的YAML验证
				const lines = template.yamlStructure.split('\n');
				for (const line of lines) {
					if (line.trim() && !line.includes(':') && !line.startsWith(' ') && !line.startsWith('-')) {
						errors.push('YAML format may be incorrect, please check format');
						break;
					}
				}
			} catch (e) {
				errors.push('YAML format validation failed');
			}
		}

		return errors;
	}

	loadFromJson(templatesData: MetadataTemplate[]): void {
		const builtInTemplates = this.getBuiltInTemplates();
		this.templates.clear();
		
		builtInTemplates.forEach(template => {
			this.templates.set(template.id, template);
		});

		templatesData.forEach(template => {
			if (!template.isBuiltIn) {
				this.templates.set(template.id, template);
			}
		});
	}

	exportToJson(): MetadataTemplate[] {
		return this.getAllTemplates();
	}

	/**
	 * 生成唯一模板ID
	 */
	private generateTemplateId(): string {
		return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private containsAcademicKeywords(content: string): boolean {
		const keywords = ['abstract', '摘要', 'introduction', '引言', 'methodology', '方法', 'results', '结果', 'conclusion', '结论', 'references', '参考文献', 'doi', 'arxiv', 'journal', 'conference', '论文', '研究'];
		return keywords.some(keyword => content.includes(keyword));
	}

	private containsMeetingKeywords(content: string): boolean {
		const keywords = ['meeting', '会议', 'agenda', '议程', 'attendees', '参与者', 'minutes', '会议纪要', 'action items', '行动项', 'discussion', '讨论', 'decision', '决定', 'next steps', '下一步', '参会人员'];
		return keywords.some(keyword => content.includes(keyword));
	}

	private containsBookKeywords(content: string): boolean {
		const keywords = ['chapter', '章节', 'author', '作者', 'book', '书籍', 'reading', '阅读', 'summary', '总结', 'notes', '笔记', 'quote', '引用', 'review', '评论', 'isbn', 'publisher', '出版社'];
		return keywords.some(keyword => content.includes(keyword));
	}

	private containsProjectKeywords(content: string): boolean {
		const keywords = ['project', '项目', 'requirements', '需求', 'timeline', '时间线', 'deliverable', '交付物', 'milestone', '里程碑', 'specification', '规范', 'architecture', '架构', 'implementation', '实现', 'version', '版本'];
		return keywords.some(keyword => content.includes(keyword));
	}
}