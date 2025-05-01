/**
 * Stores the most recently selected text from the browser.
 * This variable persists across the lifetime of the background script.
 * It serves as temporary storage to pass selected text to the popup when it opens.
 */
let latestSelectedText = "";

/**
 * Sets up a message listener for communication between content scripts, 
 * the popup, and other parts of the extension.
 * 
 * @param message Object containing data passed from the sender, with an 'action' property
 *                that determines how to process the message.
 * @param sender Information about the script context that sent the message.
 * @param sendResponse Callback function to respond to the message sender.
 * @returns {boolean} True if using sendResponse asynchronously, otherwise undefined.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  /**
   * Handles the "openPopup" action:
   * 1. Stores the selected text sent from a content script
   * 2. Programmatically opens the extension popup
   * 
   * This is typically triggered when a user selects text and activates the extension
   * (e.g., via context menu or keyboard shortcut).
   */
  if (message.action === "openPopup") {
    latestSelectedText = message.text;
    chrome.action.openPopup();
  }

  /**
   * Handles the "getSelectedText" action:
   * Returns the most recently stored text selection to the requesting script
   * 
   * This is typically called by the popup when it opens to retrieve the text
   * that was selected when the popup was triggered.
   */
  else if (message.action === "getSelectedText") {
    sendResponse({ text: latestSelectedText });
  }
});