let latestSelectedText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    latestSelectedText = message.text;
    chrome.action.openPopup();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    sendResponse({ text: latestSelectedText });
  }
});



