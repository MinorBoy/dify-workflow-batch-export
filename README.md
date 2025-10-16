## 脚本用来在dify工作流界面，批量请求dify工作流导出，并打包成一个压缩包格式，后续使用解压zip文件，并导入dify工作流即可。

### 完全在本地运行，无隐私风险，运行代码前请进行检查，并使用可信ZIP源。

# 如何使用
## 以 zip压缩包格式 下载
* 直接在浏览器控制台运行
```
fetch('https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/export.js')
  .then(res => res.text())
  .then(script => eval(script));
```

* 或者复制源码

https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/export.js


* 直接粘贴在控制台运行
<img width="2838" height="1546" alt="image" src="https://github.com/user-attachments/assets/b4e7b6d4-fa37-4c37-9907-febce199d5e9" />

## 以 DSL单文件形式 下载
* 直接在浏览器控制台运行
```
fetch('https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/nozipexport.js')
  .then(res => res.text())
  .then(script => eval(script));
```

* 或者复制源码

https://raw.githubusercontent.com/MinorBoy/dify-workflow-batch-export/refs/heads/main/nozipexport.js

