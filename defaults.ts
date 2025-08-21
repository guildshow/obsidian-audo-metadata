import { MetadataTemplate, AutoMetaSettings, AIApiConfig } from './types';

// Built-in template definitions
export const BUILT_IN_TEMPLATES: MetadataTemplate[] = [
	{
		id: 'general-note',
		name: 'General Note',
		description: 'Suitable for daily notes, idea recording, etc.',
		yamlStructure: `title: ""
date: "{{date}}"
tags: []
category: ""
summary: ""
keywords: []`,
		aiPrompt: `Please generate appropriate metadata based on the document content. Requirements:
1. title: Generate a concise and clear title for the document
2. date: Use current date ({{date}})
3. tags: Generate 3-5 relevant tags based on content
4. category: Assign a main category for the document
5. summary: Generate a summary within 50 words
6. keywords: Extract 3-5 keywords

Please ensure the generated content accurately reflects the document theme, and tags and keywords are specific and useful.`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'meeting-notes',
		name: 'Meeting Notes',
		description: 'Suitable for meeting records, discussion minutes',
		yamlStructure: `title: ""
date: "{{date}}"
meeting_type: ""
participants: []
duration: ""
location: ""
tags: []
agenda_items: []
action_items: []
next_meeting: ""`,
		aiPrompt: `Please generate metadata based on meeting content. Requirements:
1. title: Generate meeting title
2. date: Use current date ({{date}})
3. meeting_type: Identify meeting type (e.g. weekly meeting, project meeting, decision meeting, etc.)
4. participants: Extract attendees (if mentioned)
5. duration: Estimate meeting duration (if information available)
6. location: Extract meeting location (if available)
7. tags: Generate relevant tags
8. agenda_items: Extract main agenda items
9. action_items: Extract action items and tasks
10. next_meeting: Extract next meeting arrangements (if available)

Focus on structured information and actionable items.`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

// Default AI API configuration
export const DEFAULT_AI_CONFIG: AIApiConfig = {
	provider: 'openai',
	apiKey: '',
	baseUrl: 'https://api.openai.com/v1',
	model: 'gpt-3.5-turbo',
	temperature: 0.7,
	maxTokens: 1000,
	timeout: 30000
};

// Default plugin settings
export const DEFAULT_SETTINGS: AutoMetaSettings = {
	aiConfig: DEFAULT_AI_CONFIG,
	templates: BUILT_IN_TEMPLATES,
	defaultTemplateId: 'general-note',
	autoSelectTemplate: true,
	previewBeforeInsert: true,
	replaceExistingMetadata: false
};