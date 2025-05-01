// listens for mouseup events to detect text selection
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) return;

  // checks if the flashcard button already exists
  let button = document.getElementById("flashcard-btn");

  // if it doesn't exist, create and style the button
  if (!button) {
    button = document.createElement("button");
    button.id = "flashcard-btn";
    button.textContent = "add flashcard";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.zIndex = "10000";
    button.style.padding = "10px";
    button.style.backgroundColor = "blue";
    button.style.color = "white";
    document.body.appendChild(button);

    // when the button is clicked, send the selected text to the background script and remove the button
    button.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openPopup", text: selectedText });
      button.remove();
    });
  }
});
