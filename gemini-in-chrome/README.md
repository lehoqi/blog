# Gemini in Chrome - 一键启用工具

> 为非美区用户提供简单快捷的 Chrome Gemini 启用方案

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-blue.svg)](https://github.com/yourusername/gemini-in-chrome)

## ✨ 功能特点

- 🚀 **一键安装** - 一条命令自动完成所有配置
- 🌍 **跨平台支持** - 支持 macOS、Linux、Windows (Git Bash/WSL)
- 🔄 **自动备份** - 修改前自动备份原配置文件
- 🔒 **安全可靠** - 开源脚本，可一键还原修改
- 🎨 **精美界面** - Google Material Design 风格

## 📋 使用前准备

### 系统要求

- **macOS**: 终端应用 (Terminal)
- **Linux**: Bash 环境
- **Windows**: Git Bash 或 WSL

### 账号准备

1. **安装 Google Chrome**
   - 访问 [chrome.google.com](https://www.google.com/chrome/) 下载安装

2. **准备美区 Gmail 账号**
   - 在 Chrome 中登录美区 Gmail 账号（⚠️ 关键步骤）
   - Gemini 的地区检测依赖账号区域设置

## 🚀 快速开始

### 一键安装

复制以下命令到终端执行：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yourusername/gemini-in-chrome/main/install.sh)"
```

或访问在线工具页面：**[https://yourusername.github.io/gemini-in-chrome/](https://yourusername.github.io/gemini-in-chrome/)**

### 详细步骤

1. 确保 Chrome 已安装并至少运行过一次
2. 在 Chrome 中登录美区 Gmail 账号
3. 打开终端，粘贴并执行安装命令
4. 等待脚本完成（会自动备份、修改配置）
5. 完全关闭并重新打开 Chrome
6. 访问 [gemini.google.com](https://gemini.google.com/) 开始使用

## 🔧 脚本功能

### 自动化操作

脚本会自动完成以下操作：

- ✅ 检测操作系统和 Chrome 安装路径
- ✅ 备份原始 `Local State` 文件
- ✅ 修改 Chrome 配置：
  - `is_glic_eligible: false → true`
  - `variations_country: cn → us`
  - `variations_permanent_consistency_country: [..., "us"]`
- ✅ 验证 JSON 格式完整性
- ✅ 显示详细的修改结果

### 参数选项

```bash
# 显示帮助信息
bash install.sh --help

# 调试模式（显示详细日志）
bash install.sh --debug

# 还原到修改前的状态
bash install.sh --rollback
```

## 📁 Chrome 配置路径

脚本会自动查找以下路径：

- **macOS**: `~/Library/Application Support/Google/Chrome`
- **Linux**: `~/.config/google-chrome`
- **Windows**: `%LOCALAPPDATA%/Google/Chrome/User Data`

## 🛠️ 本地开发

### 运行网页

```bash
# 克隆仓库
git clone https://github.com/yourusername/gemini-in-chrome.git
cd gemini-in-chrome

# 使用任意 HTTP 服务器运行
python3 -m http.server 8000
# 或
npx serve
```

然后访问 `http://localhost:8000`

### 测试脚本

```bash
# 在本地测试脚本（不实际修改）
bash install.sh --debug

# 查看脚本会修改的内容
bash install.sh --help
```

## ❓ 常见问题

### 为什么要登录美区 Gmail？

Gemini 的地区检测依赖账号区域设置。仅仅修改 Chrome 配置是不够的，您还需要使用美区账号登录 Chrome。

### Chrome 更新后需要重新配置吗？

有可能。Chrome 更新可能会覆盖配置文件，如果发现 Gemini 不可用了，重新运行一次安装脚本即可。

### 如何还原修改？

```bash
bash install.sh --rollback
```

脚本会自动找到最新的备份文件并还原。

### 脚本执行失败怎么办？

1. 使用调试模式查看详细日志：
   ```bash
   bash install.sh --debug
   ```
2. 确保 Chrome 已至少运行过一次
3. 检查是否有足够的文件权限
4. 在 [GitHub Issues](https://github.com/yourusername/gemini-in-chrome/issues) 提问

### Windows 用户如何使用？

推荐使用以下方式之一：

1. **Git Bash**（推荐）
   - 安装 [Git for Windows](https://git-scm.com/download/win)
   - 打开 Git Bash 执行命令

2. **WSL** (Windows Subsystem for Linux)
   - 在 PowerShell 中运行 `wsl`
   - 然后执行安装命令

## ⚠️ 免责声明

- 本工具仅供学习研究使用
- 请遵守 Google 的服务条款
- 使用本工具产生的任何后果由用户自行承担
- 本项目与 Google Inc. 无任何关联

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 反馈

- [GitHub Issues](https://github.com/yourusername/gemini-in-chrome/issues)
- [项目讨论](https://github.com/yourusername/gemini-in-chrome/discussions)

## 🔗 相关链接

- [Google Gemini](https://gemini.google.com/)
- [Google Chrome](https://www.google.com/chrome/)
- [Chrome 官方帮助](https://support.google.com/chrome/)

---

Made with ❤️ by the community
