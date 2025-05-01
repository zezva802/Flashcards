/**
* Event listener that runs when the DOM is fully loaded.
* Initializes the popup form and sets up event handlers.
* This code runs in the popup.html context when the popup is opened.
*/
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Get reference to the front field input element.
   * This will be pre-populated with the selected text from the page.
   */
  const frontField = document.getElementById("front");
  
  /**
   * Request the selected text from the background script.
   * Sends a message to retrieve the text that was selected when the popup was triggered.
   * 
   * @param {Object} response - Contains the selected text from the background script.
   * @param {string} response.text - The text that was selected on the webpage.
   */
  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    /**
     * Populate the front field with the selected text if available.
     * This provides a seamless experience by automatically filling the form.
     */
    if (response && response.text) {
      frontField.value = response.text;
    }
  });
  
  /**
   * Set up the form submission handler for saving flashcards.
   * Processes form data and sends it to the backend server.
   * 
   * @param {Event} e - The form submission event.
   */
  document.getElementById("flashcard-form").addEventListener("submit", async (e) => {
    /**
     * Prevent default form submission behavior.
     * This stops the page from reloading and allows us to handle the submission via AJAX.
     */
    e.preventDefault();
    
    /**
     * Extract values from all form fields.
     * These will be used to create the flashcard in the database.
     */
    const front = document.getElementById("front").value;
    const back = document.getElementById("back").value;
    const hint = document.getElementById("hint").value;
    const tagsRaw = document.getElementById("tags")?.value;
    
    /**
     * Process the tags input from a comma-separated string to an array.
     * Each tag is trimmed to remove leading/trailing whitespace.
     * Returns undefined if no tags were provided.
     */
    const tags = tagsRaw ? tagsRaw.split(",").map(tag => tag.trim()) : undefined;
    
    /**
     * Send the flashcard data to the server API.
     * Uses async/await with try/catch for clean error handling.
     */
    try {
      /**
       * Make POST request to the flashcards API endpoint.
       * Sends all form data as a JSON object in the request body.
       */
      const response = await fetch("http://localhost:3001/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ front, back, hint, tags })
      });
      
      /**
       * Handle the server response.
       * Success: Show confirmation message and close the popup.
       * Failure: Display error message and log details to console.
       */
      if (response.ok) {
        alert("Flashcard saved!");
        window.close(); // Close the popup window
      } else {
        alert("Failed to save flashcard.");
        console.error(await response.text()); // Log server error details
      }
    } catch (error) {
      /**
       * Handle network or other errors that might occur during the fetch operation.
       * This typically happens if the server is down or unreachable.
       */
      console.error("Error:", error);
      alert("Error saving flashcard.");
    }
  });
 });