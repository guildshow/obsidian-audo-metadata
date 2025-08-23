import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, ButtonComponent, DropdownComponent, TextComponent } from 'obsidian';
import { AutoMetaSettings } from './types';
import { DEFAULT_SETTINGS } from './defaults';
import { AIService } from './ai-service';
import { TemplateManager } from './template-manager';
import { MetadataGenerator } from './metadata-generator';
import { TemplateEditModal } from './ui-components';

export default class AutoMetaPlugin extends Plugin {
	settings: AutoMetaSettings;
	aiService: AIService;
	templateManager: TemplateManager;
	metadataGenerator: MetadataGenerator;

	async onload() {
		await this.loadSettings();

		// 初始化AI服务和管理器
		this.aiService = new AIService(this.settings.aiConfig);
		this.templateManager = new TemplateManager();
		this.templateManager.loadFromJson(this.settings.templates);
		this.metadataGenerator = new MetadataGenerator(this.app, this.aiService, this.templateManager);

		// AI生成元数据命令
		this.addCommand({
			id: 'ai-generate-metadata',
			name: 'Generate metadata with AI',
			callback: () => {
				this.metadataGenerator.generateForCurrentFile(true, this.settings.previewBeforeInsert);
			}
		});

		// 选择模板生成元数据命令
		this.addCommand({
			id: 'ai-select-template-generate',
			name: 'Select template and generate metadata',
			callback: () => {
				this.metadataGenerator.generateForCurrentFile(false, this.settings.previewBeforeInsert);
			}
		});


		// 添加设置选项卡
		this.addSettingTab(new AutoMetaSettingTab(this.app, this));
	}

	onunload() {
		console.log('AutoMeta plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		// 保存模板到设置中
		if (this.templateManager) {
			this.settings.templates = this.templateManager.getAllTemplates();
		}
		await this.saveData(this.settings);
		
		// 更新AI服务配置
		if (this.aiService) {
			this.aiService.updateConfig(this.settings.aiConfig);
		}
	}

}

class AutoMetaSettingTab extends PluginSettingTab {
	plugin: AutoMetaPlugin;

	constructor(app: App, plugin: AutoMetaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h1', {text: 'Auto Meta Settings'});

		// AI API 设置区域
		this.displayAPISettings(containerEl);
		
		// 模板管理区域
		this.displayTemplateSettings(containerEl);
		
		// 生成设置区域
		this.displayGenerationSettings(containerEl);
	}

	private displayAPISettings(containerEl: HTMLElement): void {
		containerEl.createEl('h2', {text: 'AI API Configuration'});

		// API Provider
		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Select your AI service provider')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI')
				.addOption('claude', 'Claude')
				.addOption('custom', 'Custom')
				.setValue(this.plugin.settings.aiConfig.provider)
				.onChange(async (value: 'openai' | 'claude' | 'custom') => {
					this.plugin.settings.aiConfig.provider = value;
					await this.plugin.saveSettings();
				}));

		// API Key
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Your AI service API key')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.aiConfig.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.aiConfig.apiKey = value;
					await this.plugin.saveSettings();
				}));

		// Base URL
		new Setting(containerEl)
			.setName('API Base URL')
			.setDesc('API endpoint URL')
			.addText(text => text
				.setPlaceholder('https://api.openai.com/v1')
				.setValue(this.plugin.settings.aiConfig.baseUrl)
				.onChange(async (value) => {
					this.plugin.settings.aiConfig.baseUrl = value;
					await this.plugin.saveSettings();
				}));

		// Model
		const modelSetting = new Setting(containerEl)
			.setName('AI Model')
			.setDesc('Select AI model to use for metadata generation');
		
		let customInput: TextComponent;
		
		// Add dropdown for models
		modelSetting.addDropdown(dropdown => {
			const models = this.plugin.aiService.getSupportedModels();
			dropdown.addOption('', 'Select model...');
			models.forEach(model => {
				dropdown.addOption(model.id, `${model.name} (${model.provider})`);
			});
			dropdown.addOption('custom', 'Custom Model');
			
			// Determine current selection
			const currentModel = this.plugin.settings.aiConfig.model;
			const isPresetModel = models.some(model => model.id === currentModel);
			dropdown.setValue(isPresetModel ? currentModel : (currentModel ? 'custom' : ''));
			
			return dropdown.onChange(async (value) => {
				if (value === 'custom') {
					// Show custom input and focus on it
					customInput.inputEl.classList.remove('custom-model-input');
					customInput.inputEl.focus();
				} else if (value) {
					// Hide custom input and set preset model
					customInput.inputEl.classList.add('custom-model-input');
					this.plugin.settings.aiConfig.model = value;
					await this.plugin.saveSettings();
				} else {
					// Show custom input if nothing selected
					customInput.inputEl.classList.remove('custom-model-input');
				}
			});
		});
		
		// Add text input for custom model (initially hidden if preset model is selected)
		modelSetting.addText(text => {
			customInput = text;
			const currentModel = this.plugin.settings.aiConfig.model;
			const models = this.plugin.aiService.getSupportedModels();
			const isPresetModel = models.some(model => model.id === currentModel);
			
			text.setPlaceholder('Enter custom model name (e.g., gpt-4-turbo, claude-3.5-sonnet)')
				.setValue(isPresetModel ? '' : currentModel);
				
			// Initially hide if preset model is selected
			if (isPresetModel) {
				text.inputEl.classList.add('custom-model-input');
			}
			
			return text.onChange(async (value) => {
				this.plugin.settings.aiConfig.model = value;
				await this.plugin.saveSettings();
			});
		});

		// Test Connection Button
		new Setting(containerEl)
			.setName('Test API Connection')
			.setDesc('Test if your API configuration is working')
			.addButton(button => button
				.setButtonText('Test Connection')
				.setCta()
				.onClick(async () => {
					button.setButtonText('Testing...');
					const result = await this.plugin.aiService.testConnection();
					if (result.success) {
						new Notice('API connection successful!');
						button.setButtonText('✓ Connected');
						setTimeout(() => button.setButtonText('Test Connection'), 2000);
					} else {
						new Notice(`Connection failed: ${result.error}`);
						button.setButtonText('✗ Failed');
						setTimeout(() => button.setButtonText('Test Connection'), 2000);
					}
				}));
	}

	private displayTemplateSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h2', {text: 'Template Management'});

		// Default Template
		new Setting(containerEl)
			.setName('Default Template')
			.setDesc('Template to use for auto-generation')
			.addDropdown(dropdown => {
				const templates = this.plugin.templateManager.getAllTemplates();
				templates.forEach(template => {
					dropdown.addOption(template.id, template.name);
				});
				return dropdown
					.setValue(this.plugin.settings.defaultTemplateId)
					.onChange(async (value) => {
						this.plugin.settings.defaultTemplateId = value;
						await this.plugin.saveSettings();
					});
			});

		// Template List
		const templatesContainer = containerEl.createDiv();
		this.displayTemplateList(templatesContainer);
	}

	private displayTemplateList(container: HTMLElement): void {
		container.empty();
		
		const templates = this.plugin.templateManager.getAllTemplates();
		
		templates.forEach(template => {
			const templateSetting = new Setting(container)
				.setName(template.name)
				.setDesc(`${template.description} ${template.isBuiltIn ? '(Built-in)' : '(Custom)'}`);

			if (!template.isBuiltIn) {
				templateSetting.addButton(button => button
					.setButtonText('Edit')
					.onClick(() => {
						const modal = new TemplateEditModal(
							this.app,
							this.plugin.templateManager,
							() => {
								this.displayTemplateList(container);
							},
							template
						);
						modal.open();
					}))
					.addButton(button => button
						.setButtonText('Delete')
						.setWarning()
						.onClick(() => {
							if (confirm(`Are you sure you want to delete template "${template.name}"?`)) {
								this.plugin.templateManager.deleteTemplate(template.id);
								this.plugin.saveSettings();
								this.displayTemplateList(container);
								new Notice(`Template "${template.name}" deleted`);
							}
						}));
			} else {
				templateSetting.addButton(button => button
					.setButtonText('Duplicate')
					.onClick(() => {
						const duplicated = this.plugin.templateManager.duplicateTemplate(template.id);
						if (duplicated) {
							this.plugin.saveSettings();
							this.displayTemplateList(container);
							new Notice(`Template duplicated as "${duplicated.name}"`);
						}
					}));
			}
		});

		// Add New Template Button
		new Setting(container)
			.setName('Create New Template')
			.addButton(button => button
				.setButtonText('+ New Template')
				.setCta()
				.onClick(() => {
					const modal = new TemplateEditModal(
						this.app,
						this.plugin.templateManager,
						() => {
							this.displayTemplateList(container);
							this.plugin.saveSettings();
						}
					);
					modal.open();
				}));
	}

	private displayGenerationSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h2', {text: 'Generation Settings'});

		new Setting(containerEl)
			.setName('Auto-select template')
			.setDesc('Automatically choose the best template based on content')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSelectTemplate)
				.onChange(async (value) => {
					this.plugin.settings.autoSelectTemplate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Preview before insert')
			.setDesc('Show preview dialog before inserting generated metadata')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.previewBeforeInsert)
				.onChange(async (value) => {
					this.plugin.settings.previewBeforeInsert = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Replace existing metadata')
			.setDesc('Replace existing metadata instead of merging')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.replaceExistingMetadata)
				.onChange(async (value) => {
					this.plugin.settings.replaceExistingMetadata = value;
					await this.plugin.saveSettings();
				}));
	}

}