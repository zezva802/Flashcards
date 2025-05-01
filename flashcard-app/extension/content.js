/**
 * Flag to track whether the flashcard button was just clicked.
 * Used to prevent recreation of the button immediately after clicking it.
 */
let buttonJustClicked = false;

/**
 * Event listener for mouseup events across the document.
 * Creates a "Add Flashcard" button near selected text.
 * 
 * @param event The mouseup event object containing positional data.
 */
document.addEventListener("mouseup", (event) => {

  /**
   * Skip button creation if the button itself was just clicked.
   * This prevents the button from reappearing after clicking it.
   */
  if (buttonJustClicked) {
    console.log("Button was just clicked, preventing recreation");
    buttonJustClicked = false;
    return;
  }

  /**
   * Short delay to allow the selection to be fully established.
   * This ensures we capture the complete text selection.
   */
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    console.log("Selected text:", selectedText);
    
    // Find any existing button and remove it
    let button = document.getElementById("flashcard-btn");
    
    /**
     * Remove any existing flashcard button to prevent duplicates.
     */
    if (button) {
      button.remove();
    }
    
    /**
     * Only create a button if text is selected.
     * Creates and styles a button positioned near the mouse cursor.
     */
    if (selectedText) {
      console.log("Creating button for text:", selectedText);
      
      // Create the button element
      button = document.createElement("button");
      button.id = "flashcard-btn";
      button.textContent = "Add Flashcard";
      
      /**
       * Style the button to appear as a floating element.
       * Uses fixed positioning to ensure it stays visible regardless of scroll.
       * Maximum z-index ensures button appears above all other page elements.
       */
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
      
      /**
       * Position the button near where the mouse was released.
       * Gets the cursor's X and Y coordinates from the event.
       */
      const x = event.clientX;
      const y = event.clientY;
      
      /**
       * Position the button slightly below the cursor for better UX.
       * The +20px offset prevents the button from appearing directly under the cursor.
       */
      button.style.left = `${x}px`;
      button.style.top = `${y + 20}px`; 
      
      // Add the button to the document
      document.body.appendChild(button);
      console.log("Button created and positioned at", x, y);
      console.log("Button element:", button);
      
      /**
       * Log computed CSS properties to help debug visibility issues.
       * Useful for troubleshooting if the button doesn't appear correctly.
       */
      const computedStyle = window.getComputedStyle(button);
      console.log("Button visibility:", computedStyle.visibility);
      console.log("Button display:", computedStyle.display);
      console.log("Button z-index:", computedStyle.zIndex);
      
      /**
       * Set up the button's click handler to:
       * 1. Set the buttonJustClicked flag to prevent recreation
       * 2. Clear the text selection
       * 3. Send the selected text to the background script
       * 4. Remove the button from the DOM
       * 5. Stop event propagation to prevent document click handler from firing
       */
      button.addEventListener("click", (e) => {
        console.log("Button clicked");
        
        buttonJustClicked = true;
        
        // Clear the text selection
        window.getSelection().removeAllRanges();
        
        // Send message to background script to open popup with selected text
        chrome.runtime.sendMessage({ action: "openPopup", text: selectedText });
        button.remove();
        
        // Prevent the click event from bubbling up to the document
        e.stopPropagation();
      });
    }
  }, 100); // Small delay to ensure selection is complete
});

/**
 * Global click event listener to remove the button when clicking elsewhere.
 * Improves UX by removing the button when user clicks away.
 * 
 * @param event The click event object.
 */
document.addEventListener("click", (event) => {
  /**
   * Check if the click was outside the flashcard button.
   * Removes the button if it exists and user clicked elsewhere.
   */
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
 * Ensures the button is removed when user begins a new text selection.
 * 
 * @param event The mousedown event object.
 */
document.addEventListener("mousedown", (event) => {
  /**
   * Skip button removal if clicking on the button itself.
   * This prevents immediate button removal when trying to click it.
   */
  if (event.target.id === "flashcard-btn") {
    console.log("Clicked on the button, not removing");
    return;
  }
  
  // Remove button if it exists when starting new selection
  const button = document.getElementById("flashcard-btn");
  if (button) {
    console.log("Removing button due to new selection starting");
    button.remove();
  }
});

/**
 * Stores the most recently selected text from the browser.
 * This variable persists across the lifetime of the content script.
 */
let latestSelectedText = "";

/**
 * Sets up a message listener for communication between content scripts, 
 * the popup, and the background script.
 * 
 * @param message Object containing data passed from the sender with an 'action' property.
 * @param sender Information about the script context that sent the message.
 * @param sendResponse Callback function to respond to the message sender.
 * @returns {boolean} True to indicate asynchronous response through sendResponse.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    // Store selected text and open extension popup
    latestSelectedText = message.text;
    chrome.action.openPopup();
  } else if (message.action === "getSelectedText") {
    // Return the stored selected text to the requesting script
    sendResponse({ text: latestSelectedText });
  }
  return true; // Indicates asynchronous sendResponse usage
});

/**
 * DOMContentLoaded event listener to initialize the popup UI.
 * Runs when the popup HTML document has fully loaded.
 * Retrieves selected text and sets up form submission handler.
 */
document.addEventListener("DOMContentLoaded", () => {
  const frontField = document.getElementById("front");
  
  /**
   * Request the selected text from background script when popup opens.
   * Populates the front field of the flashcard with the selected text.
   */
  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    if (response && response.text) {
      frontField.value = response.text;
    }
  });
  
  /**
   * Setup form submission handler to save the flashcard.
   * Sends flashcard data to the server and handles the response.
   * 
   * @param e The submit event object.
   */
  document.getElementById("flashcard-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get values from form fields
    const front = document.getElementById("front").value;
    const back = document.getElementById("back").value;
    const hint = document.getElementById("hint").value;
    const tagsRaw = document.getElementById("tags")?.value;
    
    /**
     * Process tags input by splitting comma-separated string into array.
     * Trims whitespace from each tag for consistency.
     */
    const tags = tagsRaw ? tagsRaw.split(",").map(tag => tag.trim()) : undefined;
    
    /**
     * Send the flashcard data to the server API.
     * Uses fetch API to post the data as JSON.
     */
    try {
      const response = await fetch("http://localhost:3001/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ front, back, hint, tags })
      });
      
      /**
       * Handle server response:
       * - Success: Show confirmation and close popup
       * - Failure: Show error message and log details
       */
      if (response.ok) {
        alert("Flashcard saved!");
        window.close();
      } else {
        alert("Failed to save flashcard.");
        console.error(await response.text());
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Error:", error);
      alert("Error saving flashcard.");
    }
  });
});