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

		// 添加样式
		this.addStyles();
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

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			/* 主容器样式 */
			.modal-container {
				max-width: 600px;
				margin: 0 auto;
			}
			
			.title-container {
				text-align: center;
				margin-bottom: 32px;
				padding-bottom: 20px;
				border-bottom: 1px solid var(--background-modifier-border-focus);
			}
			
			.modal-title {
				margin-bottom: 12px;
				color: var(--text-normal);
				font-weight: 700;
				font-size: 1.4em;
				letter-spacing: -0.02em;
			}
			
			.template-keyboard-hint {
				font-size: 0.85em;
				color: var(--text-muted);
				margin: 0;
				opacity: 0.8;
				font-weight: 400;
			}
			
			.no-templates-message {
				text-align: center;
				color: var(--text-muted);
				padding: 60px 20px;
				font-size: 1em;
				opacity: 0.7;
			}
			
			/* 模板网格布局 */
			.template-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: 20px;
				margin: 20px 0 32px 0;
				padding: 0 8px;
			}
			
			/* 模板卡片设计 */
			.template-card {
				position: relative;
				background: var(--background-primary);
				border: 2px solid var(--background-modifier-border);
				border-radius: 16px;
				padding: 24px;
				cursor: pointer;
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				overflow: hidden;
				backdrop-filter: blur(10px);
			}
			
			.template-card::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 4px;
				background: linear-gradient(90deg, var(--text-accent), var(--text-accent-hover));
				opacity: 0;
				transition: opacity 0.3s ease;
			}
			
			.template-card:hover {
				background: var(--background-secondary);
				border-color: var(--text-accent);
				transform: translateY(-4px);
				box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
			}
			
			.template-card:hover::before {
				opacity: 1;
			}
			
			/* 模板头部 */
			.template-header {
				display: flex;
				align-items: center;
				margin-bottom: 16px;
			}
			
			.template-icon {
				font-size: 1.8em;
				margin-right: 16px;
				width: 48px;
				height: 48px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--background-secondary);
				border-radius: 12px;
				border: 1px solid var(--background-modifier-border);
			}
			
			.template-name {
				font-size: 1.2em;
				font-weight: 600;
				color: var(--text-normal);
				margin: 0;
				letter-spacing: -0.01em;
			}
			
			.template-desc {
				color: var(--text-muted);
				font-size: 0.9em;
				line-height: 1.5;
				margin: 0;
				opacity: 0.9;
			}
			
			/* 徽章样式 */
			.recommended-badge {
				position: absolute;
				top: 16px;
				right: 16px;
				background: linear-gradient(135deg, var(--text-accent), var(--text-accent-hover));
				color: white;
				font-size: 0.7em;
				font-weight: 700;
				padding: 6px 10px;
				border-radius: 20px;
				text-transform: uppercase;
				letter-spacing: 0.8px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			}
			
			.selected-badge {
				position: absolute;
				top: 16px;
				left: 16px;
				background: linear-gradient(135deg, #10b981, #059669);
				color: white;
				font-size: 0.7em;
				font-weight: 700;
				padding: 6px 10px;
				border-radius: 20px;
				text-transform: uppercase;
				letter-spacing: 0.8px;
				box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
				animation: slideIn 0.3s ease-out;
			}
			
			@keyframes slideIn {
				from {
					opacity: 0;
					transform: translateX(-10px);
				}
				to {
					opacity: 1;
					transform: translateX(0);
				}
			}
			
			.shortcut-number {
				position: absolute;
				bottom: 16px;
				right: 16px;
				width: 28px;
				height: 28px;
				background: var(--background-modifier-border);
				color: var(--text-muted);
				font-size: 0.8em;
				font-weight: 600;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				transition: all 0.2s ease;
			}
			
			.template-card:hover .shortcut-number {
				background: var(--text-accent);
				color: white;
				transform: scale(1.1);
			}
			
			/* 选中状态 */
			.template-selected {
				border-color: var(--text-accent) !important;
				background: var(--background-secondary) !important;
				box-shadow: 0 0 0 3px rgba(var(--text-accent-rgb), 0.2) !important;
				transform: translateY(-4px) !important;
			}
			
			.template-selected::before {
				opacity: 1 !important;
			}
			
			.template-selected .template-icon {
				background: var(--text-accent);
				color: white;
				border-color: var(--text-accent);
			}
			
			/* 底部操作区 */
			.modal-actions {
				display: flex;
				justify-content: center;
				padding-top: 24px;
				margin-top: 24px;
				border-top: 1px solid var(--background-modifier-border-focus);
			}
			
			.cancel-button {
				min-width: 100px;
				padding: 10px 20px;
				border-radius: 8px;
				font-weight: 500;
				transition: all 0.2s ease;
			}
			
			.cancel-button:hover {
				transform: translateY(-1px);
			}
			
			/* 响应式设计 */
			@media (max-width: 768px) {
				.template-grid {
					grid-template-columns: 1fr;
					gap: 16px;
					padding: 0 4px;
				}
				
				.template-card {
					padding: 20px;
				}
				
				.modal-title {
					font-size: 1.25em;
				}
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
		this.textareaEl.style.width = '100%';
		this.textareaEl.style.fontFamily = 'monospace';

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

		// 添加样式
		this.addStyles();
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			/* 元数据预览主容器 */
			.metadata-preview-container {
				max-width: 700px;
				margin: 0 auto;
				padding: 8px;
			}
			
			/* 标题区域 */
			.metadata-preview-title {
				text-align: center;
				margin-bottom: 32px;
				padding-bottom: 20px;
				border-bottom: 2px solid var(--background-modifier-border-focus);
			}
			
			.metadata-preview-title h2 {
				margin: 0 0 12px 0;
				color: var(--text-normal);
				font-weight: 700;
				font-size: 1.5em;
				letter-spacing: -0.02em;
			}
			
			/* 文件信息卡片 */
			.file-info {
				background: linear-gradient(135deg, var(--background-secondary), var(--background-secondary-alt));
				border: 1px solid var(--background-modifier-border);
				border-radius: 12px;
				padding: 20px;
				margin-bottom: 24px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
			
			.file-info p {
				margin: 8px 0;
				color: var(--text-muted);
				font-size: 0.9em;
				display: flex;
				align-items: center;
			}
			
			.file-info p:first-child {
				margin-top: 0;
			}
			
			.file-info p:last-child {
				margin-bottom: 0;
			}
			
			.file-info p::before {
				content: '•';
				color: var(--text-accent);
				margin-right: 12px;
				font-weight: bold;
			}
			
			/* 元数据编辑区域 */
			.metadata-header {
				display: flex;
				flex-direction: column;
				gap: 12px;
				margin-bottom: 16px;
			}
			
			.metadata-header h3 {
				margin: 0;
				color: var(--text-normal);
				font-weight: 600;
				font-size: 1.1em;
				display: flex;
				align-items: center;
			}
			
			.metadata-header h3::before {
				content: '📝';
				margin-right: 8px;
			}
			
			.keyboard-hint {
				font-size: 0.85em;
				color: var(--text-muted);
				margin: 0;
				padding: 12px 16px;
				background: var(--background-secondary);
				border-radius: 8px;
				border-left: 4px solid var(--text-accent);
				opacity: 0.9;
			}
			
			/* 编辑器样式 */
			.metadata-editor {
				background: var(--background-primary);
				border: 2px solid var(--background-modifier-border);
				border-radius: 12px;
				padding: 20px;
				color: var(--text-normal);
				font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
				font-size: 0.9em;
				line-height: 1.6;
				resize: vertical;
				min-height: 300px;
				transition: all 0.3s ease;
				box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
			}
			
			.metadata-editor:focus {
				outline: none;
				border-color: var(--text-accent);
				box-shadow: 0 0 0 3px rgba(var(--text-accent-rgb), 0.1);
				background: var(--background-primary);
			}
			
			.metadata-editor::placeholder {
				color: var(--text-muted);
				opacity: 0.6;
			}
			
			/* 按钮容器 */
			.modal-button-container {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 12px;
				margin-top: 32px;
				padding-top: 24px;
				border-top: 1px solid var(--background-modifier-border-focus);
			}
			
			.button-group-left {
				display: flex;
				gap: 8px;
			}
			
			.button-group-right {
				display: flex;
				gap: 8px;
			}
			
			/* 重新设计按钮样式 */
			.modal-button-container button {
				padding: 12px 24px;
				border-radius: 8px;
				font-weight: 500;
				font-size: 0.9em;
				transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
				border: none;
				cursor: pointer;
				position: relative;
				overflow: hidden;
			}
			
			.modal-button-container button::before {
				content: '';
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
				transition: left 0.5s;
			}
			
			.modal-button-container button:hover::before {
				left: 100%;
			}
			
			.modal-button-container button:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			}
			
			/* 主要操作按钮 */
			.modal-button-container .mod-cta {
				background: linear-gradient(135deg, var(--text-accent), var(--text-accent-hover));
				color: white;
				font-weight: 600;
				min-width: 140px;
			}
			
			.modal-button-container .mod-cta:hover {
				background: linear-gradient(135deg, var(--text-accent-hover), var(--text-accent));
			}
			
			/* 次要按钮 */
			.modal-button-container button:not(.mod-cta) {
				background: var(--background-secondary);
				color: var(--text-normal);
				border: 1px solid var(--background-modifier-border);
			}
			
			.modal-button-container button:not(.mod-cta):hover {
				background: var(--background-secondary-alt);
				border-color: var(--text-accent);
			}
			
			/* 响应式设计 */
			@media (max-width: 768px) {
				.metadata-preview-container {
					padding: 4px;
				}
				
				.file-info {
					padding: 16px;
				}
				
				.metadata-editor {
					padding: 16px;
					min-height: 250px;
				}
				
				.modal-button-container {
					flex-direction: column;
					gap: 16px;
				}
				
				.button-group-left,
				.button-group-right {
					width: 100%;
					justify-content: center;
				}
				
				.modal-button-container button {
					min-width: 120px;
					padding: 14px 20px;
				}
				
				.metadata-header {
					gap: 8px;
				}
				
				.keyboard-hint {
					padding: 10px 12px;
					font-size: 0.8em;
				}
			}
			
			/* 暗色主题优化 */
			.theme-dark .metadata-editor {
				background: var(--background-primary-alt);
				border-color: var(--background-modifier-border-hover);
			}
			
			.theme-dark .file-info {
				background: linear-gradient(135deg, var(--background-primary-alt), var(--background-secondary));
			}
			
			/* 加载动画 */
			@keyframes fadeInUp {
				from {
					opacity: 0;
					transform: translateY(20px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
			
			.metadata-preview-container > * {
				animation: fadeInUp 0.3s ease-out;
			}
		`;
		document.head.appendChild(style);
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