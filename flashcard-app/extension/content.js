let buttonJustClicked = false;

document.addEventListener("mouseup", (event) => {

  if (buttonJustClicked) {
    console.log("Button was just clicked, preventing recreation");
    buttonJustClicked = false;
    return;
  }


  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    console.log("Selected text:", selectedText);
    
    let button = document.getElementById("flashcard-btn");
    

    if (button) {
      button.remove();
    }
    

    if (selectedText) {
      console.log("Creating button for text:", selectedText);
      
      button = document.createElement("button");
      button.id = "flashcard-btn";
      button.textContent = "Add Flashcard";
      button.style.position = "fixed"; 
      button.style.zIndex = "2147483647"; 
      button.style.padding = "8px 12px";
      button.style.backgroundColor = "#4285f4";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      button.style.cursor = "pointer";
      button.style.fontSize = "14px";
      button.style.fontWeight = "bold";
      

      const x = event.clientX;
      const y = event.clientY;
      

      button.style.left = `${x}px`;
      button.style.top = `${y + 20}px`; 
      
      document.body.appendChild(button);
      console.log("Button created and positioned at", x, y);
      console.log("Button element:", button);
      
  
      const computedStyle = window.getComputedStyle(button);
      console.log("Button visibility:", computedStyle.visibility);
      console.log("Button display:", computedStyle.display);
      console.log("Button z-index:", computedStyle.zIndex);
      
      button.addEventListener("click", (e) => {
        console.log("Button clicked");
        
        buttonJustClicked = true;
       
        window.getSelection().removeAllRanges();
        
        chrome.runtime.sendMessage({ action: "openPopup", text: selectedText });
        button.remove();
        
        
        e.stopPropagation();
      });
    }
  }, 100); 
});

document.addEventListener("click", (event) => {

  if (event.target.id !== "flashcard-btn") {
    console.log("Click elsewhere detected");
    const button = document.getElementById("flashcard-btn");
    if (button) {
      console.log("Removing button due to click elsewhere");
      button.remove();
    }
  }
});


document.addEventListener("mousedown", (event) => {

  if (event.target.id === "flashcard-btn") {
    console.log("Clicked on the button, not removing");
    return;
  }
  
  const button = document.getElementById("flashcard-btn");
  if (button) {
    console.log("Removing button due to new selection starting");
    button.remove();
  }
});


let latestSelectedText = "";


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    latestSelectedText = message.text;
    chrome.action.openPopup();
  } else if (message.action === "getSelectedText") {
    sendResponse({ text: latestSelectedText });
  }
  return true;
});


document.addEventListener("DOMContentLoaded", () => {
  const frontField = document.getElementById("front");
  
  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    if (response && response.text) {
      frontField.value = response.text;
    }
  });
  
  document.getElementById("flashcard-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const front = document.getElementById("front").value;
    const back = document.getElementById("back").value;
    const hint = document.getElementById("hint").value;
    const tagsRaw = document.getElementById("tags")?.value;
    const tags = tagsRaw ? tagsRaw.split(",").map(tag => tag.trim()) : undefined;
    
    try {
      const response = await fetch("http://localhost:3001/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ front, back, hint, tags })
      });
      
      if (response.ok) {
        alert("Flashcard saved!");
        window.close();
      } else {
        alert("Failed to save flashcard.");
        console.error(await response.text());
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving flashcard.");
    }
  });
});