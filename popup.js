const pageJsonInput = document.getElementById('pageJson');
const outputJsonInput = document.getElementById('outputJson');
const statusElement = document.getElementById('status');
const readPageButton = document.getElementById('readPageButton');
const convertButton = document.getElementById('convertButton');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');

readPageButton.addEventListener('click', readPageJson);
convertButton.addEventListener('click', convertJson);
copyButton.addEventListener('click', copyResult);
downloadButton.addEventListener('click', downloadResult);

async function readPageJson() {
  setStatus('正在读取当前页面 JSON...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('没有可用的活动标签页。');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'SESSION_TO_JSON_READ_PAGE' });
    const text = response && typeof response.text === 'string' ? response.text : '';

    JSON.parse(text);
    pageJsonInput.value = formatJsonText(text);
    convertJson();
  } catch (error) {
    setError(`无法从此页面读取有效 JSON。${getErrorMessage(error)}`);
  }
}

function convertJson() {
  try {
    const source = parseJson(pageJsonInput.value, '页面 JSON');
    const result = SessionToJsonConverter.convertSessionJson(source);

    outputJsonInput.value = JSON.stringify(result.output, null, 2);
    setConversionStatus(result.warnings);
  } catch (error) {
    setError(getErrorMessage(error));
  }
}

async function copyResult() {
  try {
    requireOutput();
    await navigator.clipboard.writeText(outputJsonInput.value);
    setStatus('复制成功。');
  } catch (error) {
    setError(getErrorMessage(error));
  }
}

function downloadResult() {
  try {
    requireOutput();

    const source = parseJson(pageJsonInput.value, '页面 JSON');
    const blob = new Blob([outputJsonInput.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = buildDownloadFilename(source);
    link.click();
    URL.revokeObjectURL(url);
    setStatus('开始下载。');
  } catch (error) {
    setError(getErrorMessage(error));
  }
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('页面 JSON 不是有效的 JSON。');
  }
}

function formatJsonText(text) {
  return JSON.stringify(JSON.parse(text), null, 2);
}

function buildDownloadFilename(source) {
  const email = sanitizeFilenamePart(readPathOrDefault(source, 'user.email', 'unknown-email'));
  const plan = sanitizeFilenamePart(readPathOrDefault(source, 'account.planType', 'unknown-plan'));

  return `codex-${email}-${plan}.json`;
}

function readPathOrDefault(source, path, fallback) {
  const parts = path.split('.').filter(Boolean);
  let current = source;

  for (const part of parts) {
    if (!hasOwn(current, part)) {
      return fallback;
    }

    current = current[part];
  }

  return String(current);
}

function sanitizeFilenamePart(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, '-');
}

function hasOwn(value, key) {
  return value !== null && (typeof value === 'object' || typeof value === 'function') && Object.prototype.hasOwnProperty.call(value, key);
}

function requireOutput() {
  if (!outputJsonInput.value.trim()) {
    throw new Error('请先转换 JSON 再执行此操作。');
  }
}

function setConversionStatus(warnings) {
  if (!warnings.length) {
    setStatus('转换完成。');
    return;
  }

  setStatus(`转换完成，但有 ${warnings.length} 条警告：${warnings.join(', ')}`);
}

function setStatus(message) {
  statusElement.textContent = message;
  statusElement.classList.remove('error');
}

function setError(message) {
  statusElement.textContent = message;
  statusElement.classList.add('error');
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}
