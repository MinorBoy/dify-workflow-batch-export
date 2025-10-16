# Dify 工作流批量导出工具

这是一个用于在 Dify 控制台中批量导出工作流的工具，可以将所有工作流导出为 YAML 格式并打包成 ZIP 文件，方便备份或迁移。

## 特性

- 🔒 **完全本地运行**：无需上传任何数据到外部服务器，无隐私风险
- 🚀 **自动化操作**：一键批量导出所有 Dify 工作流
- 📦 **两种导出模式**：
  - ZIP 压缩包格式：将所有 YAML 文件打包成一个 ZIP 文件
  - 单文件格式：分别下载每个工作流的 YAML 文件
- 🌐 **智能 API 检测**：自动检测 Dify 控制台的 API 地址
- 📅 **动态文件命名**：自动添加导出日期到文件名中

## 使用方法

### 方法一：ZIP 压缩包格式下载

将以下代码复制并在浏览器控制台中运行：

```javascript
fetch('https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/export.js')
  .then(res => res.text())
  .then(script => eval(script));
```

或者直接复制源码：
https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/export.js

### 方法二：DSL 单文件形式下载

将以下代码复制并在浏览器控制台中运行：

```javascript
fetch('https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/nozipexport.js')
  .then(res => res.text())
  .then(script => eval(script));
```

或者直接复制源码：
https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/nozipexport.js

## 使用步骤

1. 登录到 Dify 控制台
2. 打开浏览器开发者工具（通常按 F12）
3. 切换到 Console（控制台）标签
4. 将上述任一代码粘贴到控制台中并按回车执行
5. 等待脚本执行完成，文件将自动下载

![使用示例](https://github.com/user-attachments/assets/b4e7b6d4-fa37-4c37-9907-febce199d5e9)

## 安全提醒

- 运行代码前请检查源代码，确保安全性
- 请使用可信的 ZIP 源
- 脚本只在本地浏览器中运行，不会上传任何数据

## 文件说明

- `export.js`：ZIP 打包导出脚本
- `nozipexport.js`：单文件分别导出脚本