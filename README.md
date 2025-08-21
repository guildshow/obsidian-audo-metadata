# Auto Meta - Obsidian Plugin

A plugin to automatically manage metadata for your Obsidian notes.

## Features

- 📅 **Auto-add creation time** - Automatically adds a creation timestamp when a new note is created.
- 🔄 **Auto-update modification time** - Automatically updates the modification timestamp when a note is modified.
- 🏷️ **Auto-add tags** - Automatically adds preset tags to new notes.
- ⚙️ **Flexible configuration** - Customize all features through the settings panel.
- 🎯 **Batch processing** - Supports batch adding metadata to all existing notes.

## Installation

### Manual Installation
1. Download the latest version of the plugin files.
2. Place the files in the `{vault}/.obsidian/plugins/auto-meta/` folder.
3. Enable the plugin in Obsidian settings.

### Development Version Installation
1. Clone this repository to your plugins folder.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to build the plugin.
4. Enable the plugin in Obsidian.

## Usage

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

## Metadata Format

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

## Development

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

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License
