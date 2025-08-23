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
	private selectedIndex: number = -1;

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
		// 默认选择 general note 模板
		this.selectedIndex = this.templates.findIndex(t => t.template.id === 'general-note');
		if (this.selectedIndex === -1 && this.templates.length > 0) {
			this.selectedIndex = 0; // 如果没找到 general note，选择第一个
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// 添加CSS类用于居中定位
		this.modalEl.addClass('template-select-modal');

		// 简洁的标题
		const titleContainer = contentEl.createDiv('title-container');
		const titleEl = titleContainer.createEl('h2', { 
			text: 'Select Template',
			cls: 'modal-title'
		});
		const keyboardHint = titleContainer.createEl('p', {
			cls: 'template-keyboard-hint',
			text: 'Use ↑↓ arrow keys to navigate, Enter to select, Esc to cancel'
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

	}

	private createOptimizedTemplateList(container: HTMLElement, templates: TemplateSelectOption[]) {
		const listContainer = container.createDiv('template-grid');

		templates.forEach((templateOption, index) => {
			const { template, confidence } = templateOption;
			const cardEl = listContainer.createDiv('template-card');
			
			// 添加data属性用于键盘导航
			cardEl.setAttribute('data-template-index', index.toString());
			
			// 添加选中状态样式
			if (index === this.selectedIndex) {
				cardEl.addClass('template-selected');
			}
			
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
			
			// 默认选中标识
			if (index === this.selectedIndex) {
				const selectedBadgeEl = cardEl.createEl('div', { 
					text: 'Selected',
					cls: 'selected-badge'
				});
			}

			// 点击选择
			cardEl.addEventListener('click', () => {
				this.selectTemplate(index);
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

	private selectTemplate(index: number) {
		this.selectedIndex = index;
		this.close();
		this.onSelect(this.templates[index].template);
	}

	private updateSelection(newIndex: number) {
		if (newIndex < 0 || newIndex >= this.templates.length) {
			return;
		}

		// 移除之前的选中状态
		const previousCard = this.containerEl.querySelector(`[data-template-index="${this.selectedIndex}"]`);
		if (previousCard) {
			previousCard.removeClass('template-selected');
			const selectedBadge = previousCard.querySelector('.selected-badge');
			if (selectedBadge) {
				selectedBadge.remove();
			}
		}

		// 设置新的选中状态
		this.selectedIndex = newIndex;
		const newCard = this.containerEl.querySelector(`[data-template-index="${newIndex}"]`);
		if (newCard) {
			newCard.addClass('template-selected');
			// 添加选中标识
			const selectedBadgeEl = newCard.createEl('div', { 
				text: 'Selected',
				cls: 'selected-badge'
			});
			
			// 滚动到可见区域
			newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}

	private addKeyboardNavigation(templates: TemplateSelectOption[]) {
		this.keyboardHandler = (e: KeyboardEvent) => {
			if (e.key === '1' && templates[0]) {
				this.selectTemplate(0);
			} else if (e.key === '2' && templates[1]) {
				this.selectTemplate(1);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				const newIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : templates.length - 1;
				this.updateSelection(newIndex);
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				const newIndex = this.selectedIndex < templates.length - 1 ? this.selectedIndex + 1 : 0;
				this.updateSelection(newIndex);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				// 回车键选择当前选中的模板
				if (this.selectedIndex >= 0 && this.selectedIndex < templates.length) {
					this.selectTemplate(this.selectedIndex);
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
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
	private keyboardHandler?: (e: KeyboardEvent) => void;
	private textareaEl?: HTMLTextAreaElement;

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
		
		// 添加CSS类用于居中定位
		this.modalEl.addClass('metadata-preview-modal');

		contentEl.createEl('h2', { text: 'Metadata Preview' });

		// 文件信息
		const infoEl = contentEl.createDiv('file-info');
		infoEl.createEl('p', { text: `File: ${this.fileName}` });
		infoEl.createEl('p', { text: `Template: ${this.template.name}` });

		// 元数据编辑区域
		const metadataHeader = contentEl.createDiv('metadata-header');
		metadataHeader.createEl('h3', { text: 'Generated Metadata:' });
		const keyboardHint = metadataHeader.createEl('p', {
			cls: 'keyboard-hint',
			text: 'Press Enter to insert, Esc to cancel, or Ctrl+Enter while editing'
		});
		
		this.textareaEl = contentEl.createEl('textarea', {
			cls: 'metadata-editor'
		});
		this.textareaEl.value = this.metadata;
		this.textareaEl.rows = 15;

		// 按钮区域
		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		// 左侧按钮组
		const leftGroup = buttonContainer.createDiv('button-group-left');
		if (this.onRegenerate) {
			new ButtonComponent(leftGroup)
				.setButtonText('🔄 Regenerate')
				.onClick(() => {
					this.close();
					this.onRegenerate?.();
				});
		}

		// 右侧按钮组
		const rightGroup = buttonContainer.createDiv('button-group-right');
		
		new ButtonComponent(rightGroup)
			.setButtonText('Cancel')
			.onClick(() => {
				this.close();
				this.onCancel?.();
			});

		new ButtonComponent(rightGroup)
			.setButtonText('✓ Insert Metadata')
			.setCta()
			.onClick(() => {
				const editedMetadata = this.textareaEl!.value;
				this.close();
				this.onConfirm(editedMetadata);
			});

		// 添加键盘事件处理
		this.addKeyboardNavigation();

	}


	private addKeyboardNavigation() {
		this.keyboardHandler = (e: KeyboardEvent) => {
			// 检查是否在textarea中编辑
			if (document.activeElement === this.textareaEl) {
				// 在textarea中，只处理Ctrl+Enter和Escape
				if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
					e.preventDefault();
					const editedMetadata = this.textareaEl!.value;
					this.close();
					this.onConfirm(editedMetadata);
				} else if (e.key === 'Escape') {
					e.preventDefault();
					this.close();
					this.onCancel?.();
				}
			} else {
				// 不在textarea中，处理全局快捷键
				if (e.key === 'Enter') {
					e.preventDefault();
					const editedMetadata = this.textareaEl!.value;
					this.close();
					this.onConfirm(editedMetadata);
				} else if (e.key === 'Escape') {
					e.preventDefault();
					this.close();
					this.onCancel?.();
				}
			}
		};

		document.addEventListener('keydown', this.keyboardHandler);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		
		// 清理键盘事件监听器
		if (this.keyboardHandler) {
			document.removeEventListener('keydown', this.keyboardHandler);
		}
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

	private addStyles() {
		// No styles to add here yet, as .modalEl.addClass is already in onOpen
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// 添加CSS类用于居中定位
		this.modalEl.addClass('template-edit-modal');

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

	private addStyles() {
		// No styles to add here yet, as .containerEl.addClass is already in createElements
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
			this.progressEl.setAttribute('style', `width: ${Math.min(100, Math.max(0, percentage))}%`);
		}
	}

	hide() {
		this.containerEl.remove();
	}

}