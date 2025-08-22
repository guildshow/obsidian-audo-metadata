import { AIApiConfig, MetadataGenerationRequest, MetadataGenerationResponse, AutoMetaError } from './types';

interface OpenAIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAIRequest {
	model: string;
	messages: OpenAIMessage[];
	temperature: number;
	max_tokens: number;
}

interface OpenAIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
	usage?: {
		total_tokens: number;
	};
}

export class AIService {
	private config: AIApiConfig;

	constructor(config: AIApiConfig) {
		this.config = config;
	}

	/**
	 * 更新AI配置
	 */
	updateConfig(config: AIApiConfig): void {
		this.config = config;
	}

	/**
	 * 生成元数据
	 */
	async generateMetadata(request: MetadataGenerationRequest): Promise<MetadataGenerationResponse> {
		const startTime = Date.now();

		try {
			// 验证API配置
			if (!this.config.apiKey) {
				throw new Error(AutoMetaError.API_KEY_MISSING);
			}

			// 构建AI请求消息
			const messages = this.buildMessages(request);
			
			// 发送API请求
			const response = await this.makeApiRequest(messages);
			
			// 解析响应
			const metadata = this.parseResponse(response);
			
			// 验证生成的元数据格式
			const validatedMetadata = this.validateAndFormatMetadata(metadata, request.template.yamlStructure);

			const processingTime = Date.now() - startTime;

			return {
				success: true,
				metadata: validatedMetadata,
				tokensUsed: response.usage?.total_tokens || 0,
				processingTime
			};

		} catch (error) {
			const processingTime = Date.now() - startTime;
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				processingTime
			};
		}
	}

	/**
	 * 测试API连接
	 */
	async testConnection(): Promise<{ success: boolean; error?: string }> {
		try {
			if (!this.config.apiKey) {
				throw new Error('API key not set');
			}

			const testMessages: OpenAIMessage[] = [
				{
					role: 'user',
					content: 'Please reply "Connection test successful"'
				}
			];

			const response = await this.makeApiRequest(testMessages, true);
			const content = response.choices[0]?.message?.content;

			if (content && content.includes('Connection test successful')) {
				return { success: true };
			} else {
				return { success: false, error: 'Response content abnormal' };
			}

		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * 构建AI请求消息
	 */
	private buildMessages(request: MetadataGenerationRequest): OpenAIMessage[] {
		const systemPrompt = this.buildSystemPrompt(request);
		const userPrompt = this.buildUserPrompt(request);

		return [
			{
				role: 'system',
				content: systemPrompt
			},
			{
				role: 'user',
				content: userPrompt
			}
		];
	}

	/**
	 * 构建系统提示词
	 */
	private buildSystemPrompt(request: MetadataGenerationRequest): string {
		const currentDate = new Date().toISOString().split('T')[0];
		const detectedLanguage = this.detectLanguage(request.documentContent);
		const languagePrompt = this.getLanguageSpecificPrompt(detectedLanguage);
		
		return `${languagePrompt.systemRole}

Requirements:
1. Strictly follow the provided YAML template structure
2. Ensure the generated content accurately reflects the document content
3. ${languagePrompt.languageInstruction}
4. Use date format: ${currentDate}
5. IMPORTANT: Title must use lowercase letters and connect multiple words with hyphens (-). For example: "machine-learning-guide", "project-management-notes"
6. IMPORTANT: All tags must be formatted for Obsidian compatibility - use lowercase letters and connect multiple words with hyphens (-). For example: "machine-learning", "project-management", "data-science"
7. Tags should be specific and useful, avoid being too broad
8. Only return YAML format metadata, do not include other content
9. Do not include YAML separators (---)

Template structure:
\`\`\`yaml
${request.template.yamlStructure}
\`\`\`

Specific requirements:
${request.template.aiPrompt}`;
	}

	private detectLanguage(content: string): string {
		const text = content.toLowerCase().replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0100-\u017f\u00c0-\u00ff]/g, '');
		const totalChars = text.length;

		const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
		const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
		const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
		const russianChars = (text.match(/[\u0400-\u04ff]/g) || []).length;

		if (chineseChars / totalChars > 0.1) return 'zh';
		if (japaneseChars / totalChars > 0.05) return 'ja';
		if (koreanChars / totalChars > 0.05) return 'ko';
		if (russianChars / totalChars > 0.1) return 'ru';

		const commonWords = {
			'en': ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'have', 'has'],
			'zh': ['的', '了', '和', '是', '在', '有', '不', '这', '我', '你', '他', '她'],
			'ja': ['です', 'である', 'として', 'について', 'から', 'まで', 'では', 'より'],
			'ko': ['이다', '있다', '없다', '하다', '되다', '같다', '많다', '좋다'],
			'fr': ['le', 'la', 'les', 'de', 'des', 'du', 'et', 'un', 'une', 'il', 'elle', 'être', 'avoir', 'que', 'pour', 'avec', 'sur', 'dans'],
			'de': ['der', 'die', 'das', 'und', 'in', 'den', 'von', 'zu', 'mit', 'sich', 'auf', 'ist', 'sind', 'war', 'waren', 'haben', 'hat'],
			'es': ['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'a', 'en', 'un', 'una', 'ser', 'estar', 'se', 'no', 'te', 'con', 'por'],
			'it': ['il', 'la', 'lo', 'gli', 'le', 'di', 'del', 'della', 'che', 'e', 'ed', 'un', 'una', 'per', 'non', 'in', 'si', 'con', 'essere', 'avere'],
			'ru': ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'как', 'что', 'это', 'вы']
		};

		let maxScore = 0;
		let detectedLang = 'en';

		for (const [lang, words] of Object.entries(commonWords)) {
			let score = 0;
			for (const word of words) {
				const regex = new RegExp(`\\b${word}\\b`, 'g');
				const matches = text.match(regex);
				if (matches) {
					score += matches.length;
				}
			}

			if (lang === 'en' && score > 0) {
				const englishPatterns = [
					/\bthe\s+\w+/g, /\band\s+\w+/g, /\bof\s+\w+/g, /\bin\s+\w+/g, /\bto\s+\w+/g
				];
				let patternScore = 0;
				for (const pattern of englishPatterns) {
					const matches = text.match(pattern);
					if (matches) {
						patternScore += matches.length;
					}
				}
				score += patternScore * 2;
			}

			if (score > maxScore) {
				maxScore = score;
				detectedLang = lang;
			}
		}

		if (maxScore < 3) {
			const frenchChars = (text.match(/[àâäçéèêëïîôöùûüÿ]/g) || []).length;
			const germanChars = (text.match(/[äöüß]/g) || []).length;
			const spanishChars = (text.match(/[ñáéíóúü]/g) || []).length;
			const italianChars = (text.match(/[àèéìíîòóù]/g) || []).length;
			const italianDoubleConsonants = (text.match(/[bcdfglmnpqrstvz]{2}/g) || []).length;

			if (frenchChars / totalChars > 0.05) return 'fr';
			if (germanChars / totalChars > 0.04) return 'de';
			if (spanishChars / totalChars > 0.04) return 'es';
			if ((italianChars / totalChars > 0.05) || (italianDoubleConsonants / totalChars > 0.02)) return 'it';
		}

		return detectedLang;
	}

	/**
	 * 获取特定语言的提示词
	 */
	private getLanguageSpecificPrompt(language: string): { systemRole: string; languageInstruction: string } {
		const prompts = {
			'zh': {
				systemRole: '你是一个专业的文档元数据生成助手。请根据用户提供的文档内容和模板要求，生成准确、有用的YAML格式元数据。',
				languageInstruction: '标题使用英文生成（小写字母，多个单词用连字符连接）。摘要和其他内容使用中文生成。标签优先使用中文，但专有名词（如技术术语、品牌名等）可保留英文。中文标签示例："机器学习"、"数据分析"、"项目管理"；英文专有名词示例："python"、"docker"、"api"'
			},
			'en': {
				systemRole: 'You are a professional document metadata generation assistant. Please generate accurate and useful YAML format metadata based on the document content and template requirements provided by the user.',
				languageInstruction: 'Generate titles, summaries, tags and other content in English. Tags must use lowercase letters with hyphens (-) connecting multiple words'
			},
			'ja': {
				systemRole: 'あなたは文書メタデータ生成の専門アシスタントです。ユーザーが提供する文書内容とテンプレート要件に基づいて、正確で有用なYAML形式のメタデータを生成してください。',
				languageInstruction: '日本語でタイトル、要約、タグなどのコンテンツを生成する。タグは小文字とハイフン(-)で複数の単語を接続する形式を使用してください'
			},
			'ko': {
				systemRole: '당신은 전문 문서 메타데이터 생성 도우미입니다. 사용자가 제공하는 문서 내용과 템플릿 요구사항을 바탕으로 정확하고 유용한 YAML 형식의 메타데이터를 생성해 주세요.',
				languageInstruction: '한국어로 제목, 요약, 태그 등의 콘텐츠 생성. 태그는 소문자와 하이픈(-)을 사용하여 여러 단어를 연결하는 형식을 사용하세요'
			},
			'fr': {
				systemRole: 'Vous êtes un assistant professionnel de génération de métadonnées de documents. Veuillez générer des métadonnées au format YAML précises et utiles basées sur le contenu du document et les exigences du modèle fournis par l\'utilisateur.',
				languageInstruction: 'Générer les titres, résumés, balises et autres contenus en français. Les balises doivent utiliser des lettres minuscules avec des traits d\'union (-) pour connecter plusieurs mots'
			},
			'de': {
				systemRole: 'Sie sind ein professioneller Assistent für die Generierung von Dokument-Metadaten. Bitte generieren Sie genaue und nützliche YAML-Format-Metadaten basierend auf dem Dokumentinhalt und den Template-Anforderungen, die der Benutzer bereitstellt.',
				languageInstruction: 'Titel, Zusammenfassungen, Tags und andere Inhalte auf Deutsch generieren. Tags müssen Kleinbuchstaben mit Bindestrichen (-) verwenden, um mehrere Wörter zu verbinden'
			},
			'es': {
				systemRole: 'Eres un asistente profesional de generación de metadatos de documentos. Por favor, genera metadatos en formato YAML precisos y útiles basados en el contenido del documento y los requisitos de plantilla proporcionados por el usuario.',
				languageInstruction: 'Generar títulos, resúmenes, etiquetas y otros contenidos en español. Las etiquetas deben usar letras minúsculas con guiones (-) para conectar múltiples palabras'
			},
			'it': {
				systemRole: 'Sei un assistente professionale per la generazione di metadati di documenti. Si prega di generare metadati in formato YAML accurati e utili basati sul contenuto del documento e sui requisiti del template forniti dall\'utente.',
				languageInstruction: 'Generare titoli, riassunti, tag e altri contenuti in italiano. I tag devono usare lettere minuscole con trattini (-) per collegare più parole'
			},
			'ru': {
				systemRole: 'Вы профессиональный помощник по генерации метаданных документов. Пожалуйста, создайте точные и полезные метаданные в формате YAML на основе содержания документа и требований шаблона, предоставленных пользователем.',
				languageInstruction: 'Генерировать заголовки, резюме, теги и другой контент на русском языке. Теги должны использовать строчные буквы с дефисами (-) для соединения нескольких слов'
			}
		};
		
		return prompts[language as keyof typeof prompts] || prompts['en'];
	}

	/**
	 * 构建用户提示词
	 */
	private buildUserPrompt(request: MetadataGenerationRequest): string {
		const detectedLanguage = this.detectLanguage(request.documentContent);
		const labels = this.getLanguageLabels(detectedLanguage);
		
		let prompt = `${labels.fileName}${request.fileName}\n\n${labels.documentContent}\n${request.documentContent}`;

		if (request.existingMetadata) {
			prompt += `\n\n${labels.existingMetadata}\n${request.existingMetadata}`;
			prompt += `\n\n${labels.updateInstruction}`;
		}

		return prompt;
	}

	/**
	 * 获取特定语言的标签
	 */
	private getLanguageLabels(language: string): { fileName: string; documentContent: string; existingMetadata: string; updateInstruction: string } {
		const labels = {
			'zh': {
				fileName: '文件名：',
				documentContent: '文档内容：',
				existingMetadata: '现有元数据：',
				updateInstruction: '请基于现有元数据进行更新和完善。'
			},
			'en': {
				fileName: 'File name: ',
				documentContent: 'Document content:',
				existingMetadata: 'Existing metadata:',
				updateInstruction: 'Please update and improve based on existing metadata.'
			},
			'ja': {
				fileName: 'ファイル名：',
				documentContent: 'ドキュメント内容：',
				existingMetadata: '既存のメタデータ：',
				updateInstruction: '既存のメタデータに基づいて更新・改善してください。'
			},
			'ko': {
				fileName: '파일명: ',
				documentContent: '문서 내용:',
				existingMetadata: '기존 메타데이터:',
				updateInstruction: '기존 메타데이터를 기반으로 업데이트하고 개선해주세요.'
			},
			'fr': {
				fileName: 'Nom du fichier : ',
				documentContent: 'Contenu du document :',
				existingMetadata: 'Métadonnées existantes :',
				updateInstruction: 'Veuillez mettre à jour et améliorer en vous basant sur les métadonnées existantes.'
			},
			'de': {
				fileName: 'Dateiname: ',
				documentContent: 'Dokumentinhalt:',
				existingMetadata: 'Vorhandene Metadaten:',
				updateInstruction: 'Bitte aktualisieren und verbessern Sie basierend auf den vorhandenen Metadaten.'
			},
			'es': {
				fileName: 'Nombre del archivo: ',
				documentContent: 'Contenido del documento:',
				existingMetadata: 'Metadatos existentes:',
				updateInstruction: 'Por favor, actualice y mejore basándose en los metadatos existentes.'
			},
			'it': {
				fileName: 'Nome del file: ',
				documentContent: 'Contenuto del documento:',
				existingMetadata: 'Metadati esistenti:',
				updateInstruction: 'Si prega di aggiornare e migliorare basandosi sui metadati esistenti.'
			},
			'ru': {
				fileName: 'Имя файла: ',
				documentContent: 'Содержимое документа:',
				existingMetadata: 'Существующие метаданные:',
				updateInstruction: 'Пожалуйста, обновите и улучшите на основе существующих метаданных.'
			}
		};
		
		return labels[language as keyof typeof labels] || labels['en'];
	}

	/**
	 * 发送API请求
	 */
	private async makeApiRequest(messages: OpenAIMessage[], isTest = false): Promise<OpenAIResponse> {
		const requestBody: OpenAIRequest = {
			model: this.config.model,
			messages,
			temperature: isTest ? 0 : this.config.temperature,
			max_tokens: isTest ? 50 : this.config.maxTokens
		};

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal
			});

			clearTimeout(timeout);

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(`API request failed (${response.status}): ${errorBody}`);
			}

			const data: OpenAIResponse = await response.json();
			
			if (!data.choices || data.choices.length === 0) {
				throw new Error('API response format error: missing choices field');
			}

			return data;

		} catch (error) {
			clearTimeout(timeout);
			
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new Error('API request timeout');
				}
				throw error;
			}
			
			throw new Error(AutoMetaError.API_REQUEST_FAILED);
		}
	}

	/**
	 * 解析API响应
	 */
	private parseResponse(response: OpenAIResponse): string {
		const content = response.choices[0]?.message?.content;
		
		if (!content) {
			throw new Error(AutoMetaError.INVALID_RESPONSE);
		}

		return content.trim();
	}

	/**
	 * 验证和格式化元数据
	 */
	private validateAndFormatMetadata(metadata: string, template: string): string {
		try {
			// 移除可能的代码块标记
			let cleanMetadata = metadata.replace(/^```yaml\n/, '').replace(/\n```$/, '');
			cleanMetadata = cleanMetadata.replace(/^```\n/, '').replace(/\n```$/, '');
			
			// 移除开头的 --- 标记（如果存在）
			cleanMetadata = cleanMetadata.replace(/^---\n/, '');
			
			// 基本格式验证
			const lines = cleanMetadata.split('\n');
			const validLines = lines.filter(line => line.trim());
			
			if (validLines.length === 0) {
				throw new Error('Generated metadata is empty');
			}

			// 替换日期占位符
			const currentDate = new Date().toISOString().split('T')[0];
			cleanMetadata = cleanMetadata.replace(/\{\{date\}\}/g, currentDate);

			// 格式化标签和标题以确保 Obsidian 兼容性
			cleanMetadata = this.formatTagsForObsidian(cleanMetadata);
			cleanMetadata = this.formatTitleForObsidian(cleanMetadata);

			return cleanMetadata;

		} catch (error) {
			throw new Error(`Metadata format validation failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private formatTagsForObsidian(metadata: string): string {
		return metadata
			.replace(/tags:\s*\[([\s\S]*?)\]/gm, (match, tagsContent) => {
				const formattedTagsContent = tagsContent.replace(/["']([^"'\n]*?)["']/g, (tagMatch: string, tagValue: string) => {
					const formattedTag = this.formatSingleTag(tagValue);
					return formattedTag ? `"${formattedTag}"` : tagMatch;
				});
				return `tags: [${formattedTagsContent}]`;
			})
			.replace(/tags:\s*\n(\s*-\s*[^\n]*\n?)*/gm, (match) => {
				return match.replace(/(\s*-\s*)["']([^"'\n]+?)["'](\n?)/g, (tagMatch, prefix, tagValue, suffix) => {
					const formattedTag = this.formatSingleTag(tagValue);
					return formattedTag ? `${prefix}"${formattedTag}"${suffix}` : tagMatch;
				});
			});
	}

	/**
	 * 格式化标题以确保 Obsidian 兼容性
	 */
	private formatTitleForObsidian(metadata: string): string {
		return metadata.replace(/^title:\s*["']([^"'\n]+)["']?$/gm, (match, titleValue) => {
			if (titleValue && titleValue.trim()) {
				const formattedTitle = this.formatSingleTag(titleValue);
				return `title: "${formattedTitle}"`;
			}
			return match;
		});
	}

	/**
	 * 格式化单个标签
	 */
	private formatSingleTag(tagValue: string): string {
		if (!tagValue || !tagValue.trim()) {
			return '';
		}
		
		let formattedTag = tagValue.trim();
		
		// 检查是否包含中文字符
		const hasChinese = /[\u4e00-\u9fff]/.test(formattedTag);
		
		if (hasChinese) {
			// 中文标签：不转换大小写，只处理空格和特殊字符
			formattedTag = formattedTag
				.replace(/[\s_]+/g, '')  // 移除空格和下划线
				.replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, '');  // 只保留字母数字和中日韩字符
		} else {
			// 英文标签：转换为小写并用连字符连接
			formattedTag = formattedTag.toLowerCase()
				.replace(/[\s_]+/g, '-')  // 将空格和下划线替换为连字符
				.replace(/[^\w\-]/g, '-')  // 其他字符替换为连字符
				.replace(/-+/g, '-')  // 将多个连续连字符替换为单个连字符
				.replace(/^-|-$/g, '');  // 移除开头和结尾的连字符
		}
		
		return formattedTag;
	}

	/**
	 * 获取支持的模型列表
	 */
	getSupportedModels(): Array<{ id: string; name: string; provider: string }> {
		return [
			{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
			{ id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', provider: 'OpenAI' },
			{ id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
			{ id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'OpenAI' },
			{ id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
			{ id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
			{ id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' }
		];
	}

	estimateTokens(text: string): number {
		const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
		const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(word => word.length > 0).length;
		return chineseChars * 2 + englishWords;
	}
}