# Auto Meta - AI 驱动的 Obsidian 元数据插件

[English](README.md)

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) ![GitHub version](https://img.shields.io/badge/version-1.0.0-blue.svg)

使用 Auto Meta 彻底改变你的笔记组织方式！这款 Obsidian 插件利用大型语言模型（LLM）自动为你的笔记生成和管理元数据。告别手动标记和分类的繁琐工作。

## ✨ 功能特性

- 🧠 **AI 驱动的元数据生成** - 使用强大的大型语言模型（LLM）自动为您的笔记生成相关的元数据，如标签、分类和摘要。
- 🤖 **智能标签与分类** - 让 AI 分析您的内容并建议最相关的标签和分类，确保组织结构的一致性和意义性。
- 📝 **自动摘要** - 即时为您的笔记生成简洁的摘要，非常适合快速回顾和参考。
- ✨ **自定义元数据模板** - 定义您自己的元数据结构，并指示 AI 进行填充，让您完全控制您的元数据。
- 🔄 **自动时间戳** - 自动跟踪您笔记的创建和最后修改日期。
- 🎯 **批量处理** - 一次性为所有现有笔记更新元数据。
- ⚙️ **灵活配置** - 通过用户友好的设置面板轻松配置 AI 设置，并打开或关闭功能。

## 🚀 安装方法

### 手动安装
1. 下载最新版本的插件文件
2. 将文件放入 `{vault}/.obsidian/plugins/auto-meta/` 文件夹
3. 在 Obsidian 设置中启用插件

### 开发版本安装
1. 克隆此仓库到你的插件文件夹
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建插件
4. 在 Obsidian 中启用插件

## 🔧 使用方法

### 自动功能
- 创建新笔记时会自动添加配置的元数据
- 修改笔记时会自动更新修改时间（如果启用）

### 手动命令
- **Add metadata to current note** - 为当前笔记添加元数据
- **Add metadata to all notes** - 为所有笔记批量添加元数据

### 设置选项
- **Add creation date** - 是否自动添加创建时间
- **Add modification date** - 是否自动添加和更新修改时间
- **Auto update metadata** - 是否在文件修改时自动更新元数据
- **Add default tags** - 是否自动添加默认标签
- **Default tags** - 默认标签列表（逗号分隔）
- **Date format** - 日期格式（目前使用 ISO 格式）

## 📝 元数据格式

插件会在笔记顶部添加 YAML 前置元数据：

```yaml
---
created: 2023-12-01 10:30:00
modified: 2023-12-01 15:45:00
tags:
  - tag1
  - tag2
---
```

## 💻 开发

### 开发环境设置
```bash
npm install
npm run dev
```

### 构建
```bash
npm run build
```

### 发布
```bash
npm version patch
npm run build
```

## ❤️ 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License
