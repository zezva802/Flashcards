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
  