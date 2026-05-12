# SessionToJson - ChatGPT Session JSON 转换与 CPA 上传 Chrome 扩展

SessionToJson 是一个轻量级 Chrome Manifest V3 扩展，用于读取、获取和转换 ChatGPT Session JSON，并生成 CPA 可用的 JSON 格式。它支持一键获取 ChatGPT Session、读取当前页面 JSON、自动转换、复制、下载，以及上传到 CPA 管理。

## 关键词

ChatGPT Session JSON、ChatGPT accessToken、ChatGPT Plus 资格检测、SessionToJson、Chrome 扩展、Manifest V3、CPA JSON、auth-files 上传、JSON 转换工具、ChatGPT 账号信息转换、Add Phone、OAuth登录。

## 核心功能

- 无需OAuth登录，解决Add Phone难题。
- 一键获取 ChatGPT Session JSON。
- 自动检测 ChatGPT Plus 订阅资格。
- 读取或获取成功后自动转换为 CPA 可用 JSON。
- 支持复制转换结果。
- 支持下载转换后的 JSON 文件。
- 下载文件名格式为 `codex-<邮箱>-<订阅>.json`。
- 支持一键上传到 CPA。

## 适用场景

- 将 ChatGPT Session JSON 转换为 CPA 可用 auth JSON。
- 检测 free 账户是否具备 ChatGPT Plus 订阅资格。
- 将转换后的认证文件上传到本地或远端 CPA 管理服务。

## 安装使用

- TG 交流群：https://t.me/sessiontoproxy

1. 打开 Chrome 扩展程序页面：`chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目目录。
5. 点击浏览器工具栏中的 SessionToJson 扩展图标。

## 一键获取 ChatGPT Session

1. 确保当前 Chrome 浏览器已登录 ChatGPT。
2. 打开 SessionToJson 扩展弹窗。
3. 点击“一键获取 Session”。

## 读取页面 JSON

1. 打开一个正文内容为 JSON 的页面。
2. 点击扩展图标。
3. 点击“读取页面 JSON”。

## 上传到 CPA

1. 在“服务器地址”中填写服务地址，默认值为 `http://localhost:8317`。
2. 在“CPA 密码”中填写上登录CPA的密码。
3. 完成 JSON 转换后，点击“上传到CPA”。

## 本地校验

本项目不使用框架、包管理器或构建工具，可直接用 Node.js 运行测试和语法检查。

```powershell
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('manifest ok')"
node --check content.js
node --check popup.js
node --check converter.js
```

## 项目结构

```text
manifest.json        Chrome 扩展配置
content.js           读取页面正文文本
popup.html           扩展弹窗页面
popup.css            暗黑风格弹窗样式
popup.js             弹窗交互、Session 获取、Plus 资格检测、复制、下载和上传逻辑
converter.js         固定字段转换
icons/               扩展图标
```

## 常见问题

### 点击“一键获取 Session”失败怎么办？

请确认 Chrome 中已登录 ChatGPT，并且浏览器允许扩展访问 `https://chatgpt.com/*`。如果接口返回非 2xx 状态，状态栏会显示对应 HTTP 状态码。

### 为什么没有显示 ChatGPT Plus 资格提示？

Plus 资格检测只会在账号是 free 时进行。如果账号不是 free 计划，扩展只会完成 JSON 转换。

### 上传失败怎么办？

请确认部署CPA的服务器地址正确、CPA 密码正确。
