# SessionToJson

SessionToJson 是一个 Chrome Manifest V3 扩展，用于读取当前页面中的 JSON 文本，并转换为 CPA 可用的 JSON 格式。

## 功能

- 读取当前标签页正文中的 JSON。
- 读取成功后自动转换。
- 使用内置固定字段规则生成输出 JSON。
- 支持复制转换结果。
- 支持下载转换后的 JSON 文件。
- 下载文件名格式为 `codex-<user.email>-<account.planType>.json`。
- 使用暗黑风格弹窗界面和扩展图标。

## 安装使用

1. 打开 Chrome 的扩展程序页面：`chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目目录。
5. 打开一个正文内容为 JSON 的页面。
6. 点击扩展图标，选择“读取页面 JSON”。
7. 查看、复制或下载转换结果。

## 本地校验

本项目不使用框架、包管理器或构建工具，可直接用 Node.js 运行测试和语法检查。

```powershell
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('manifest ok')"
node --check content.js
node --check popup.js
node --check converter.js
node tests\converter.test.js
node tests\download-filename.test.js
node tests\converter-source.test.js
node tests\chinese-ui.test.js
node tests\auto-convert.test.js
node tests\manifest-icons.test.js
```

## 项目结构

```text
manifest.json        Chrome 扩展配置
content.js           读取页面正文文本
popup.html           扩展弹窗页面
popup.css            暗黑风格弹窗样式
popup.js             弹窗交互、复制和下载逻辑
converter.js         固定字段转换
icons/               扩展图标
```
