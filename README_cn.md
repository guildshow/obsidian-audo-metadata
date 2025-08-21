# Auto Meta - Obsidian Plugin

自动为你的 Obsidian 笔记管理元数据的插件。

## 功能特性

- 📅 **自动添加创建时间** - 新建笔记时自动添加创建时间戳
- 🔄 **自动更新修改时间** - 修改笔记时自动更新修改时间戳  
- 🏷️ **自动添加标签** - 为新笔记自动添加预设标签
- ⚙️ **灵活配置** - 通过设置面板自定义所有功能
- 🎯 **批量处理** - 支持为所有现有笔记批量添加元数据

## 安装方法

### 手动安装
1. 下载最新版本的插件文件
2. 将文件放入 `{vault}/.obsidian/plugins/auto-meta/` 文件夹
3. 在 Obsidian 设置中启用插件

### 开发版本安装
1. 克隆此仓库到你的插件文件夹
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建插件
4. 在 Obsidian 中启用插件

## 使用方法

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

## 元数据格式

插件会在笔记顶部添加 YAML 前置元数据：

\`\`\`yaml
---
created: 2023-12-01 10:30:00
modified: 2023-12-01 15:45:00
tags:
  - tag1
  - tag2
---
\`\`\`

## 开发

### 开发环境设置
\`\`\`bash
npm install
npm run dev
\`\`\`

### 构建
\`\`\`bash
npm run build
\`\`\`

### 发布
\`\`\`bash
npm version patch
npm run build
\`\`\`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License