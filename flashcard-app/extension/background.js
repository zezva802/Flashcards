// stores the latest selected text from the content script
let latestSelectedText = "";

// handles messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // when the content script sends selected text and requests to open the popup
  if (message.action === "openPopup") {
    latestSelectedText = message.text;
    chrome.action.openPopup();
  }

  // when the popup asks for the previously selected text
  else if (message.action === "getSelectedText") {
    sendResponse({ text: latestSelectedText });
  }
});
