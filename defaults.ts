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
summary: ""`,
		aiPrompt: `Please generate appropriate metadata based on the document content. Requirements:
1. title: Generate a concise and clear title for the document. IMPORTANT: Use lowercase letters and hyphens (-) to connect multiple words (e.g., "machine-learning-guide", "project-management-notes")
2. date: Use current date ({{date}})
3. tags: Generate 3-5 relevant tags based on content. IMPORTANT: Tags must use lowercase letters and hyphens (-) to connect multiple words (e.g., "machine-learning", "project-management")
4. category: Assign a main category for the document
5. summary: Generate a summary within 50 words

Please ensure the generated content accurately reflects the document theme, and tags are specific and useful.`,
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
7. tags: Generate relevant tags. IMPORTANT: Tags must use lowercase letters and hyphens (-) to connect multiple words (e.g., "weekly-meeting", "project-planning")
8. agenda_items: Extract main agenda items
9. action_items: Extract action items and tasks
10. next_meeting: Extract next meeting arrangements (if available)

Focus on structured information and actionable items.`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'academic-paper',
		name: 'Academic Paper',
		description: 'Suitable for academic papers and research documents',
		yamlStructure: `title: ""
date: "{{date}}"
authors: []
journal: ""
year: ""
doi: ""
tags: []
category: "academic"
abstract: ""
keywords: []`,
		aiPrompt: `Please generate metadata for academic content. Requirements:
1. title: Generate academic-style title
2. date: Use current date ({{date}})
3. authors: Extract author names (if mentioned)
4. journal: Extract journal/conference name (if available)
5. year: Extract publication year (if available)
6. doi: Extract DOI (if available)
7. tags: Generate academic tags using lowercase and hyphens
8. category: Set to "academic"
9. abstract: Generate brief abstract/summary
10. keywords: Extract key research terms`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'book-review',
		name: 'Book Review',
		description: 'Suitable for book reviews and reading notes',
		yamlStructure: `title: ""
date: "{{date}}"
book_title: ""
author: ""
isbn: ""
publisher: ""
year: ""
rating: ""
tags: []
category: "book-review"
summary: ""
quotes: []`,
		aiPrompt: `Please generate metadata for book review content. Requirements:
1. title: Generate review title
2. date: Use current date ({{date}})
3. book_title: Extract book title
4. author: Extract book author
5. isbn: Extract ISBN (if available)
6. publisher: Extract publisher (if available)
7. year: Extract publication year (if available)
8. rating: Extract rating (if mentioned)
9. tags: Generate book-related tags
10. category: Set to "book-review"
11. summary: Generate brief summary
12. quotes: Extract notable quotes (if any)`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'project-doc',
		name: 'Project Documentation',
		description: 'Suitable for project documentation and specifications',
		yamlStructure: `title: ""
date: "{{date}}"
project: ""
version: ""
status: ""
tags: []
category: "project"
description: ""
requirements: []
deliverables: []`,
		aiPrompt: `Please generate metadata for project documentation. Requirements:
1. title: Generate project document title
2. date: Use current date ({{date}})
3. project: Extract project name
4. version: Extract version (if available)
5. status: Determine project status (draft, in-progress, completed)
6. tags: Generate project-related tags
7. category: Set to "project"
8. description: Generate brief description
9. requirements: Extract key requirements (if mentioned)
10. deliverables: Extract deliverables (if mentioned)`,
		isBuiltIn: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

export const DEFAULT_AI_CONFIG: AIApiConfig = {
	provider: 'openai',
	apiKey: '',
	baseUrl: 'https://api.openai.com/v1',
	model: 'gpt-3.5-turbo',
	temperature: 0.7,
	maxTokens: 1000,
	timeout: 30000
};

export const DEFAULT_SETTINGS: AutoMetaSettings = {
	aiConfig: DEFAULT_AI_CONFIG,
	templates: BUILT_IN_TEMPLATES,
	defaultTemplateId: 'general-note',
	autoSelectTemplate: true,
	previewBeforeInsert: true,
	replaceExistingMetadata: false
};