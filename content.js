function readVisiblePageText() {
  return document.body ? document.body.innerText.trim() : '';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'SESSION_TO_JSON_READ_PAGE') {
    return false;
  }

  sendResponse({ text: readVisiblePageText() });
  return false;
});
