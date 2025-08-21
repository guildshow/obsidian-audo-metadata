# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run dev` - Start development build with watch mode using esbuild
- `npm run build` - Production build with TypeScript type checking and esbuild bundling
- `npm version patch` - Bump version and update manifest.json and versions.json files

### Installation and Setup
- `npm install` - Install development dependencies
- Plugin files must be placed in `{vault}/.obsidian/plugins/auto-meta/` folder
- Enable plugin in Obsidian settings after installation

## Architecture Overview

This is an **Obsidian plugin** for automatically generating and managing metadata for notes using AI. The codebase is written in TypeScript and follows a modular architecture.

### Core Components

1. **Main Plugin (`main.ts`)**: Entry point with older simpler metadata functionality
2. **Advanced Architecture**: New AI-powered system with these key modules:
   - `MetadataGenerator` - Orchestrates metadata generation workflow
   - `AIService` - Handles API communication with OpenAI/Claude
   - `TemplateManager` - Manages built-in and custom metadata templates
   - UI components for template selection, metadata preview, and template editing

### Key Architecture Patterns

- **Modular Design**: Each core functionality is separated into distinct classes
- **Template System**: Uses YAML structure definitions with AI prompts for flexible metadata generation
- **AI Integration**: Supports multiple AI providers (OpenAI, Claude) with configurable models and parameters
- **Batch Processing**: Supports concurrent metadata generation for multiple files
- **Preview System**: Users can review and edit generated metadata before insertion

### File Structure Insights

- **Two Implementation Approaches**: The codebase shows an evolution from simple metadata addition (`main.ts`) to a sophisticated AI-powered system (`metadata-generator.ts`, `ai-service.ts`, etc.)
- **Built-in Templates**: Five predefined templates for different use cases (general notes, academic papers, meeting notes, book reviews, project docs)
- **Type Safety**: Comprehensive TypeScript interfaces in `types.ts` defining all data structures
- **UI Components**: Modal-based interface for template selection, metadata preview, and template editing

### Build System

- **esbuild**: Fast bundling with watch mode for development
- **TypeScript**: Strict type checking with ES6 target
- **Version Management**: Automated version bumping script that updates both `manifest.json` and `versions.json`

### Plugin Integration

- Integrates with Obsidian's plugin API (`obsidian` package)
- Supports Obsidian's settings system with custom settings tab
- Uses Obsidian's file system API for reading/writing note metadata
- Implements Obsidian's command system for user actions

The codebase demonstrates a well-structured plugin that has evolved from basic functionality to a sophisticated AI-powered metadata management system while maintaining backward compatibility.