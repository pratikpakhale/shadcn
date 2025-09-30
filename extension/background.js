chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IFRAME_URL_CHANGED') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'IFRAME_URL_UPDATE',
          url: message.url,
          title: message.title
        }).catch(() => {
          });
      });
    });
  }
  
  sendResponse({ success: true });
  return true;
});