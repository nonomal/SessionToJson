const pageJsonInput = document.getElementById('pageJson');
const outputJsonInput = document.getElementById('outputJson');
const serverUrlInput = document.getElementById('serverUrl');
const cpaPasswordInput = document.getElementById('cpaPassword');
const toggleCpaPasswordButton = document.getElementById('toggleCpaPasswordButton');
const statusElement = document.getElementById('status');
const fetchChatGptSessionButton = document.getElementById('fetchChatGptSessionButton');
const readPageButton = document.getElementById('readPageButton');
const convertButton = document.getElementById('convertButton');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');
const uploadButton = document.getElementById('uploadButton');
const DEFAULT_SERVER_BASE_URL = 'http://localhost:8317';
const SERVER_BASE_URL_STORAGE_KEY = 'serverBaseUrl';
const CPA_PASSWORD_STORAGE_KEY = 'cpaPassword';
const UPLOAD_PATH = '/v0/management/auth-files';
const CHATGPT_SESSION_URL = 'https://chatgpt.com/api/auth/session';
const CHATGPT_PLUS_ELIGIBILITY_URL = 'https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27?timezone_offset_min=-480';
const CHATGPT_PLUS_PLAN_ID = 'chatgptplusplan';

fetchChatGptSessionButton.addEventListener('click', fetchChatGptSessionJson);
readPageButton.addEventListener('click', readPageJson);
convertButton.addEventListener('click', convertJson);
copyButton.addEventListener('click', copyResult);
downloadButton.addEventListener('click', downloadResult);
uploadButton.addEventListener('click', uploadResult);
toggleCpaPasswordButton.addEventListener('click', toggleCpaPasswordVisibility);
serverUrlInput.addEventListener('change', saveServerBaseUrl);
serverUrlInput.addEventListener('blur', saveServerBaseUrl);
cpaPasswordInput.addEventListener('change', saveCpaPassword);
cpaPasswordInput.addEventListener('blur', saveCpaPassword);
initializeServerBaseUrl();
initializeCpaPassword();

async function fetchChatGptSessionJson() {
  setStatus('正在获取 ChatGPT Session...');

  try {
    const response = await fetch(CHATGPT_SESSION_URL, { credentials: 'include' });

    if (!response.ok) {
      throw new Error(`获取 ChatGPT Session 失败：HTTP ${response.status}`);
    }

    const session = await response.json();
    pageJsonInput.value = JSON.stringify(session, null, 2);
    convertJson();
    await checkChatGptPlusEligibility(session.accessToken);
  } catch (error) {
    setError(getErrorMessage(error));
  }
}

async function checkChatGptPlusEligibility(accessToken) {
  if (!accessToken) {
    throw new Error('获取 ChatGPT Session 失败：缺少 accessToken');
  }

  const response = await fetch(CHATGPT_PLUS_ELIGIBILITY_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`检查 ChatGPT Plus 资格失败：HTTP ${response.status}`);
  }

  const result = await response.json();
  setChatGptPlusEligibilityStatus(hasChatGptPlusEligibility(result));
}

function hasChatGptPlusEligibility(result) {
  const offers = result && result.accounts && result.accounts.default && result.accounts.default.eligible_offers && Array.isArray(result.accounts.default.eligible_offers.offers)
    ? result.accounts.default.eligible_offers.offers
    : [];
  const plusOffer = offers.find((offer) => offer && offer.id === CHATGPT_PLUS_PLAN_ID);

  return Boolean(plusOffer && plusOffer.epl_enabled);
}

function setChatGptPlusEligibilityStatus(hasEligibility) {
  const message = hasEligibility ? '此账户有 ChatGPT Plus 订阅资格。' : '此账户暂无 ChatGPT Plus 订阅资格。';

  setStatus(`${statusElement.textContent}${message}`);
}

async function readPageJson() {
  setStatus('正在读取当前页面 JSON...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('没有可用的活动标签页。');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'SESSION_TO_JSON_READ_PAGE' });
    const text = response && typeof response.text === 'string' ? response.text : '';
    const source = JSON.parse(text);

    pageJsonInput.value = JSON.stringify(source, null, 2);
    convertJson();

    if (source.accessToken) {
      await checkChatGptPlusEligibility(source.accessToken);
    }
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

async function uploadResult() {
  try {
    requireOutput();

    const source = parseJson(pageJsonInput.value, '页面 JSON');
    const password = getCpaPassword(cpaPasswordInput.value);
    const file = new File([outputJsonInput.value], buildDownloadFilename(source), { type: 'application/json' });
    const formData = new FormData();

    formData.append('file', file);

    const response = await fetch(buildUploadUrl(serverUrlInput.value), {
      method: 'POST',
      headers: { Authorization: `Bearer ${password}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`上传失败：HTTP ${response.status}`);
    }

    setStatus('上传成功。');
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

function getServerBaseUrl(value) {
  const trimmed = String(value || '').trim();
  return trimmed || DEFAULT_SERVER_BASE_URL;
}

function getCpaPassword(value) {
  const password = String(value || '').trim();

  if (!password) {
    throw new Error('请填写 CPA 密码。');
  }

  return password;
}

function buildUploadUrl(value) {
  const baseUrl = getServerBaseUrl(value);
  let parsed;

  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new Error('服务器地址不是有效的 URL。');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('服务器地址不是有效的 URL。');
  }

  return `${baseUrl.replace(/\/+$/, '')}${UPLOAD_PATH}`;
}

function initializeServerBaseUrl() {
  const storage = getStorageLocal();

  if (!storage) {
    serverUrlInput.value = DEFAULT_SERVER_BASE_URL;
    return;
  }

  storage.get(SERVER_BASE_URL_STORAGE_KEY).then((result) => {
    serverUrlInput.value = getServerBaseUrl(result[SERVER_BASE_URL_STORAGE_KEY]);
  }).catch(() => {
    serverUrlInput.value = DEFAULT_SERVER_BASE_URL;
  });
}

function saveServerBaseUrl() {
  const value = getServerBaseUrl(serverUrlInput.value);
  serverUrlInput.value = value;

  const storage = getStorageLocal();

  if (storage) {
    storage.set({ [SERVER_BASE_URL_STORAGE_KEY]: value });
  }
}

function initializeCpaPassword() {
  const storage = getStorageLocal();

  if (!storage) {
    cpaPasswordInput.value = '';
    return;
  }

  storage.get(CPA_PASSWORD_STORAGE_KEY).then((result) => {
    cpaPasswordInput.value = String(result[CPA_PASSWORD_STORAGE_KEY] || '');
  }).catch(() => {
    cpaPasswordInput.value = '';
  });
}

function saveCpaPassword() {
  const value = String(cpaPasswordInput.value || '').trim();
  cpaPasswordInput.value = value;

  const storage = getStorageLocal();

  if (storage) {
    storage.set({ [CPA_PASSWORD_STORAGE_KEY]: value });
  }
}

function toggleCpaPasswordVisibility() {
  const shouldShow = cpaPasswordInput.type === 'password';

  cpaPasswordInput.type = shouldShow ? 'text' : 'password';
  toggleCpaPasswordButton.textContent = shouldShow ? '🙈' : '👁';
  toggleCpaPasswordButton.setAttribute('aria-label', shouldShow ? '隐藏 CPA 密码' : '显示 CPA 密码');
}

function getStorageLocal() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
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
