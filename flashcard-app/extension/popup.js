// waits for the DOM content to be fully loaded before executing
document.addEventListener("DOMContentLoaded", () => {
  const frontField = document.getElementById("front");

  // sends a message to get the selected text from the background script
  chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
    if (response && response.text) {
      // fills the front field with the selected text if available
      frontField.value = response.text;
    }
  });

  // listens for the form submission to save the flashcard
  document.getElementById("flashcard-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // collects form data to create the flashcard
    const front = document.getElementById("front").value;
    const back = document.getElementById("back").value;
    const hint = document.getElementById("hint").value;
    const tagsRaw = document.getElementById("tags")?.value;
    const tags = tagsRaw ? tagsRaw.split(",").map(tag => tag.trim()) : undefined;

    try {
      // sends a POST request to save the flashcard
      const response = await fetch("http://localhost:3001/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ front, back, hint, tags })
      });

      if (response.ok) {
        // alerts and closes the popup if the flashcard is saved successfully
        alert("Flashcard saved!");
        window.close();
      } else {
        // alerts failure if the request was unsuccessful
        alert("Failed to save flashcard.");
        console.error(await response.text());
      }
    } catch (error) {
      // handles any errors during the fetch request
      console.error("Error:", error);
      alert("Error saving flashcard.");
    }
  });
});
