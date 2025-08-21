# Auto Meta - AI-Powered Metadata for Obsidian

[简体中文](README_cn.md)

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) ![GitHub version](https://img.shields.io/badge/version-1.0.0-blue.svg)

Supercharge your note organization with Auto Meta, an Obsidian plugin that leverages Large Language Models (LLMs) to automatically generate and manage metadata for your notes. Say goodbye to manual tagging and categorization.

## ✨ Features

- 🧠 **AI-Powered Metadata Generation** - Automatically generates relevant metadata like tags, categories, and summaries for your notes using powerful LLMs.
- 🤖 **Intelligent Tagging & Categorization** - Let AI analyze your content and suggest the most relevant tags and categories, ensuring consistent and meaningful organization.
- 📝 **Automatic Summaries** - Instantly generate concise summaries for your notes, perfect for quick reviews and referencing.
- ✨ **Custom Metadata Templates** - Define your own metadata structures and instruct the AI to populate them, giving you full control over your metadata.
- 🔄 **Automatic Timestamps** - Keeps track of your note's creation and last modification dates automatically.
- 🎯 **Batch Processing** - Update metadata for all your existing notes in one go.
- ⚙️ **Flexible Configuration** - Easily configure AI settings, and toggle features on or off through a user-friendly settings panel.

## 🚀 Installation

### Manual Installation
1. Download the latest version of the plugin files.
2. Place the files in the `{vault}/.obsidian/plugins/auto-meta/` folder.
3. Enable the plugin in Obsidian settings.

### Development Version Installation
1. Clone this repository to your plugins folder.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to build the plugin.
4. Enable the plugin in Obsidian.

## 🔧 Usage

### Automatic Features
- Configured metadata is automatically added when creating a new note.
- The modification time is automatically updated when a note is modified (if enabled).

### Manual Commands
- **Add metadata to current note** - Adds metadata to the current note.
- **Add metadata to all notes** - Batch adds metadata to all notes.

### Settings Options
- **Add creation date** - Whether to automatically add the creation time.
- **Add modification date** - Whether to automatically add and update the modification time.
- **Auto update metadata** - Whether to automatically update metadata on file modification.
- **Add default tags** - Whether to automatically add default tags.
- **Default tags** - List of default tags (comma-separated).
- **Date format** - Date format (currently uses ISO format).

## 📝 Metadata Format

The plugin adds YAML front matter to the top of the note:

```yaml
---
created: 2023-12-01 10:30:00
modified: 2023-12-01 15:45:00
tags:
  - tag1
  - tag2
---
```

## 💻 Development

### Development Environment Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Release
```bash
npm version patch
npm run build
```

## ❤️ Contributing

Issues and Pull Requests are welcome!

## 📜 License

MIT License
