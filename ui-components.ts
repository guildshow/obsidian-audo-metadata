import { App, Modal, Setting, TextComponent, ButtonComponent, DropdownComponent, Notice, ToggleComponent } from 'obsidian';
import { MetadataTemplate, TemplateSelectOption } from './types';
import { TemplateManager } from './template-manager';

/**
 * 模板选择模态对话框
 */
export class TemplateSelectModal extends Modal {
	private templates: TemplateSelectOption[];
	private onSelect: (template: MetadataTemplate) => void;
	private onCancel?: () => void;
	private keyboardHandler?: (e: KeyboardEvent) => void;

	constructor(
		app: App, 
		templates: TemplateSelectOption[], 
		onSelect: (template: MetadataTemplate) => void,
		onCancel?: () => void
	) {
		super(app);
		this.templates = templates;
		this.onSelect = onSelect;
		this.onCancel = onCancel;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 简洁的标题
		const titleEl = contentEl.createEl('h2', { 
			text: 'Select Template',
			cls: 'modal-title'
		});

		if (this.templates.length === 0) {
			contentEl.createEl('p', { 
				text: 'No templates available',
				cls: 'no-templates-message'
			});
			return;
		}

		// 创建优化的模板列表
		this.createOptimizedTemplateList(contentEl, this.templates);

		// 底部按钮
		const buttonContainer = contentEl.createDiv('modal-actions');
		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.setClass('cancel-button')
			.onClick(() => {
				this.close();
				this.onCancel?.();
			});

		// 添加样式
		this.addStyles();
	}

	private createOptimizedTemplateList(container: HTMLElement, templates: TemplateSelectOption[]) {
		const listContainer = container.createDiv('template-grid');

		templates.forEach((templateOption, index) => {
			const { template, confidence } = templateOption;
			const cardEl = listContainer.createDiv('template-card');
			
			// 模板图标和名称
			const headerEl = cardEl.createDiv('template-header');
			const iconEl = headerEl.createEl('div', { cls: 'template-icon' });
			iconEl.textContent = this.getTemplateIcon(template.id);
			
			const nameEl = headerEl.createEl('h3', { 
				text: template.name,
				cls: 'template-name'
			});

			// 模板描述
			cardEl.createEl('p', { 
				text: template.description,
				cls: 'template-desc'
			});

			// 推荐标识
			if (confidence && confidence > 0.7) {
				const badgeEl = cardEl.createEl('div', { 
					text: 'Recommended',
					cls: 'recommended-badge'
				});
			}

			// 点击选择
			cardEl.addEventListener('click', () => {
				this.close();
				this.onSelect(template);
			});

			// 键盘快捷键提示
			if (index < 2) {
				const shortcutEl = cardEl.createEl('div', {
					text: `${index + 1}`,
					cls: 'shortcut-number'
				});
			}
		});

		// 添加键盘事件监听
		this.addKeyboardNavigation(templates);
	}

	private getTemplateIcon(templateId: string): string {
		const iconMap: Record<string, string> = {
			'general-note': '📝',
			'meeting-notes': '🏢',
			'academic-paper': '🎓',
			'book-review': '📚',
			'project-doc': '🔧'
		};
		return iconMap[templateId] || '📄';
	}

	private addKeyboardNavigation(templates: TemplateSelectOption[]) {
		this.keyboardHandler = (e: KeyboardEvent) => {
			if (e.key === '1' && templates[0]) {
				this.close();
				this.onSelect(templates[0].template);
			} else if (e.key === '2' && templates[1]) {
				this.close();
				this.onSelect(templates[1].template);
			} else if (e.key === 'Escape') {
				this.close();
				this.onCancel?.();
			}
		};

		document.addEventListener('keydown', this.keyboardHandler);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		if (this.keyboardHandler) {
			document.removeEventListener('keydown', this.keyboardHandler);
		}
	}

	private createTemplateList(container: HTMLElement, templates: TemplateSelectOption[], showConfidence: boolean) {
		const listContainer = container.createDiv('template-list');

		templates.forEach(templateOption => {
			const { template, confidence, reason } = templateOption;
			const itemEl = listContainer.createDiv('template-item');
			
			// 模板标题
			const titleEl = itemEl.createEl('h4', { text: template.name });
			if (showConfidence && confidence && confidence > 0.7) {
				titleEl.addClass('recommended-template');
			}

			// 模板描述
			itemEl.createEl('p', { 
				text: template.description,
				cls: 'template-description'
			});

			// 推荐理由和置信度
			if (showConfidence && (confidence || reason)) {
				const metaEl = itemEl.createDiv('template-meta');
				if (reason) {
					metaEl.createEl('span', { 
						text: `Reason: ${reason}`,
						cls: 'template-reason'
					});
				}
				if (confidence) {
					metaEl.createEl('span', { 
						text: `Match: ${Math.round(confidence * 100)}%`,
						cls: 'template-confidence'
					});
				}
			}

			// 选择按钮
			const selectButton = new ButtonComponent(itemEl)
				.setButtonText('Select Template')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSelect(template);
				});

			itemEl.appendChild(selectButton.buttonEl);
		});
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.modal-title {
				text-align: center;
				margin-bottom: 24px;
				color: var(--text-normal);
				font-weight: 600;
				font-size: 1.25em;
			}
			
			.no-templates-message {
				text-align: center;
				color: var(--text-muted);
				padding: 40px 20px;
				font-size: 0.9em;
			}
			
			.template-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
				gap: 16px;
				margin: 16px 0 24px 0;
			}
			
			.template-card {
				position: relative;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 12px;
				padding: 20px;
				cursor: pointer;
				transition: all 0.2s ease;
				overflow: hidden;
			}
			
			.template-card:hover {
				background: var(--background-secondary-alt);
				border-color: var(--text-accent);
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
			}
			
			.template-header {
				display: flex;
				align-items: center;
				margin-bottom: 12px;
			}
			
			.template-icon {
				font-size: 1.5em;
				margin-right: 12px;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--background-primary);
				border-radius: 8px;
			}
			
			.template-name {
				font-size: 1.1em;
				font-weight: 600;
				color: var(--text-normal);
				margin: 0;
			}
			
			.template-desc {
				color: var(--text-muted);
				font-size: 0.9em;
				line-height: 1.4;
				margin: 0;
			}
			
			.recommended-badge {
				position: absolute;
				top: 12px;
				right: 12px;
				background: var(--text-accent);
				color: white;
				font-size: 0.75em;
				font-weight: 600;
				padding: 4px 8px;
				border-radius: 12px;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
			
			.shortcut-number {
				position: absolute;
				bottom: 12px;
				right: 12px;
				width: 24px;
				height: 24px;
				background: var(--background-modifier-border);
				color: var(--text-muted);
				font-size: 0.8em;
				font-weight: 600;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
			}
			
			.template-card:hover .shortcut-number {
				background: var(--text-accent);
				color: white;
			}
			
			.modal-actions {
				display: flex;
				justify-content: center;
				padding-top: 20px;
				border-top: 1px solid var(--background-modifier-border);
			}
			
			.cancel-button {
				min-width: 80px;
			}
			
			/* 保持原有样式用于向后兼容 */
			.template-list {
				max-height: 400px;
				overflow-y: auto;
				margin: 10px 0;
			}
			
			.template-item {
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				padding: 12px;
				margin-bottom: 10px;
				background: var(--background-secondary);
			}
			
			.template-item:hover {
				background: var(--background-secondary-alt);
			}
			
			.recommended-template {
				color: var(--text-accent) !important;
			}
			
			.template-description {
				color: var(--text-muted);
				margin: 5px 0;
				font-size: 0.9em;
			}
			
			.template-meta {
				display: flex;
				gap: 15px;
				margin: 8px 0;
				font-size: 0.8em;
			}
			
			.template-reason {
				color: var(--text-muted);
			}
			
			.template-confidence {
				color: var(--text-accent);
				font-weight: 500;
			}
			
			.modal-button-container {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 20px;
			}
		`;
		document.head.appendChild(style);
	}
}

/**
 * 元数据预览模态对话框
 */
export class MetadataPreviewModal extends Modal {
	private metadata: string;
	private fileName: string;
	private template: MetadataTemplate;
	private onConfirm: (metadata: string) => void;
	private onCancel?: () => void;
	private onRegenerate?: () => void;

	constructor(
		app: App,
		metadata: string,
		fileName: string,
		template: MetadataTemplate,
		onConfirm: (metadata: string) => void,
		onCancel?: () => void,
		onRegenerate?: () => void
	) {
		super(app);
		this.metadata = metadata;
		this.fileName = fileName;
		this.template = template;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
		this.onRegenerate = onRegenerate;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Metadata Preview' });

		// 文件信息
		const infoEl = contentEl.createDiv('file-info');
		infoEl.createEl('p', { text: `File: ${this.fileName}` });
		infoEl.createEl('p', { text: `Template: ${this.template.name}` });

		// 元数据编辑区域
		contentEl.createEl('h3', { text: 'Generated Metadata:' });
		
		const textareaEl = contentEl.createEl('textarea', {
			cls: 'metadata-editor'
		});
		textareaEl.value = this.metadata;
		textareaEl.rows = 15;
		textareaEl.style.width = '100%';
		textareaEl.style.fontFamily = 'monospace';

		// 按钮区域
		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		if (this.onRegenerate) {
			new ButtonComponent(buttonContainer)
				.setButtonText('Regenerate')
				.onClick(() => {
					this.close();
					this.onRegenerate?.();
				});
		}

		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => {
				this.close();
				this.onCancel?.();
			});

		new ButtonComponent(buttonContainer)
			.setButtonText('Insert Metadata')
			.setCta()
			.onClick(() => {
				const editedMetadata = textareaEl.value;
				this.close();
				this.onConfirm(editedMetadata);
			});

		// 添加样式
		this.addStyles();
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.file-info {
				background: var(--background-secondary);
				padding: 10px;
				border-radius: 6px;
				margin-bottom: 15px;
			}
			
			.file-info p {
				margin: 5px 0;
				color: var(--text-muted);
			}
			
			.metadata-editor {
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				padding: 10px;
				color: var(--text-normal);
				resize: vertical;
			}
			
			.modal-button-container {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 20px;
			}
		`;
		document.head.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * 模板编辑模态对话框
 */
export class TemplateEditModal extends Modal {
	private template?: MetadataTemplate;
	private templateManager: TemplateManager;
	private onSave: (template: MetadataTemplate) => void;
	private isEditing: boolean;

	constructor(
		app: App,
		templateManager: TemplateManager,
		onSave: (template: MetadataTemplate) => void,
		template?: MetadataTemplate
	) {
		super(app);
		this.template = template;
		this.templateManager = templateManager;
		this.onSave = onSave;
		this.isEditing = !!template;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.isEditing ? 'Edit Template' : 'Create New Template' });

		let nameInput: TextComponent;
		let descInput: TextComponent;
		let yamlInput: HTMLTextAreaElement;
		let promptInput: HTMLTextAreaElement;

		// 模板名称
		new Setting(contentEl)
			.setName('Template Name')
			.setDesc('Give the template a concise and clear name')
			.addText(text => {
				nameInput = text;
				text.setPlaceholder('e.g.: Academic Paper')
					.setValue(this.template?.name || '');
			});

		// 模板描述
		new Setting(contentEl)
			.setName('Template Description')
			.setDesc('Describe the purpose and applicable scenarios of this template')
			.addText(text => {
				descInput = text;
				text.setPlaceholder('e.g.: Suitable for academic papers and research documents')
					.setValue(this.template?.description || '');
			});

		// YAML结构
		contentEl.createEl('h3', { text: 'YAML Structure' });
		contentEl.createEl('p', { 
			text: 'Define the YAML structure for metadata, use {{date}} as date placeholder',
			cls: 'setting-item-description'
		});
		
		yamlInput = contentEl.createEl('textarea', {
			cls: 'template-yaml-input'
		});
		yamlInput.placeholder = `title: ""
date: "{{date}}"
tags: []
category: ""`;
		yamlInput.value = this.template?.yamlStructure || '';
		yamlInput.rows = 8;

		// AI提示词
		contentEl.createEl('h3', { text: 'AI Prompt' });
		contentEl.createEl('p', { 
			text: 'Tell AI how to generate corresponding metadata based on document content',
			cls: 'setting-item-description'
		});

		promptInput = contentEl.createEl('textarea', {
			cls: 'template-prompt-input'
		});
		promptInput.placeholder = 'Please generate appropriate metadata based on document content...';
		promptInput.value = this.template?.aiPrompt || '';
		promptInput.rows = 6;

		// 按钮区域
		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => this.close());

		new ButtonComponent(buttonContainer)
			.setButtonText(this.isEditing ? 'Save Changes' : 'Create Template')
			.setCta()
			.onClick(() => {
				this.saveTemplate(
					nameInput.getValue(),
					descInput.getValue(),
					yamlInput.value,
					promptInput.value
				);
			});

		this.addStyles();
	}

	private saveTemplate(name: string, description: string, yamlStructure: string, aiPrompt: string) {
		// 验证输入
		const errors = this.templateManager.validateTemplate({
			name,
			description,
			yamlStructure,
			aiPrompt
		});

		if (errors.length > 0) {
			new Notice(`Save failed: ${errors[0]}`);
			return;
		}

		try {
			let savedTemplate: MetadataTemplate;

			if (this.isEditing && this.template) {
				// 更新现有模板
				const success = this.templateManager.updateTemplate(this.template.id, {
					name,
					description,
					yamlStructure,
					aiPrompt
				});

				if (!success) {
					new Notice('Template update failed');
					return;
				}

				savedTemplate = this.templateManager.getTemplate(this.template.id)!;
			} else {
				// 创建新模板
				savedTemplate = this.templateManager.addTemplate({
					name,
					description,
					yamlStructure,
					aiPrompt,
					isBuiltIn: false
				});
			}

			this.close();
			this.onSave(savedTemplate);
			new Notice(`Template "${name}" ${this.isEditing ? 'updated' : 'created'} successfully`);

		} catch (error) {
			new Notice(`Operation failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.template-yaml-input,
			.template-prompt-input {
				width: 100%;
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				padding: 10px;
				color: var(--text-normal);
				font-family: monospace;
				resize: vertical;
				margin-bottom: 15px;
			}
			
			.modal-button-container {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 20px;
			}
		`;
		document.head.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * 进度指示器组件
 */
export class ProgressIndicator {
	private containerEl: HTMLElement;
	private progressEl: HTMLElement;
	private textEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.createElements();
	}

	private createElements() {
		this.containerEl.empty();
		this.containerEl.addClass('progress-container');

		this.textEl = this.containerEl.createEl('div', {
			cls: 'progress-text',
			text: 'Generating metadata...'
		});

		this.progressEl = this.containerEl.createEl('div', {
			cls: 'progress-bar'
		});

		this.addStyles();
	}

	updateProgress(text: string, percentage?: number) {
		this.textEl.textContent = text;
		
		if (percentage !== undefined) {
			this.progressEl.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
		}
	}

	hide() {
		this.containerEl.remove();
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.progress-container {
				padding: 20px;
				text-align: center;
			}
			
			.progress-text {
				margin-bottom: 10px;
				color: var(--text-muted);
			}
			
			.progress-bar {
				height: 4px;
				background: var(--text-accent);
				border-radius: 2px;
				transition: width 0.3s ease;
				width: 0%;
			}
		`;
		document.head.appendChild(style);
	}
}