let buttonJustClicked = false;

/**
 * Event listener for mouseup events across the document.
 * Creates a "Add Flashcard" button near selected text.
 * 
 * @param event The mouseup event object containing positional data.
 */
document.addEventListener("mouseup", (event) => {
  if (buttonJustClicked) {
    console.log("Button was just clicked, preventing recreation");
    buttonJustClicked = false;
    return;
  }

  // Short delay to ensure full text selection
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    console.log("Selected text:", selectedText);

    let button = document.getElementById("flashcard-btn");

    // Remove existing button if any
    if (button) {
      button.remove();
    }

    // Only create a button if text is selected
    if (selectedText) {
      console.log("Creating button for text:", selectedText);

      button = document.createElement("button");
      button.id = "flashcard-btn";
      button.textContent = "Add Flashcard";

      // Style the button
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

      // Position near cursor
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

      // Add click listener
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

/**
 * Global click event listener to remove the button when clicking elsewhere.
 */
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

/**
 * MouseDown event listener to remove the button when starting a new selection.
 */
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

/**
 * Listener for messages from background or popup scripts.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    latestSelectedText = message.text;
    chrome.action.openPopup();
  } else if (message.action === "getSelectedText") {
    sendResponse({ text: latestSelectedText });
  }
  return true;
});

/**
 * DOMContentLoaded event listener to initialize popup fields and form submission.
 */
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
