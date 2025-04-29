document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) return;
  
    let button = document.getElementById("flashcard-btn");
  
    if (!button) {
      button = document.createElement("button");
      button.id = "flashcard-btn";
      button.textContent = "Add Flashcard";
      button.style.position = "fixed";
      button.style.bottom = "20px";
      button.style.right = "20px";
      button.style.zIndex = "10000";
      button.style.padding = "10px";
      button.style.backgroundColor = "blue";
      button.style.color = "white";
      document.body.appendChild(button);
  
      
      button.addEventListener("click", () => {
        
        chrome.runtime.sendMessage({ action: "openPopup", text: selectedText });
        button.remove();
      });
    }
  });
  