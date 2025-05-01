Extension Specification

1. Overview
   The extension enables users to highlight text on any webpage and quickly create flashcards for study purposes. Once text is highlighted, users can open a popup where they can fill in the flashcard details, such as the front, back, hint, and tags.

2. Files and Their Functions
   The project consists of several key components, each serving a specific purpose:

background.js:

Listens for messages from the content script and popup.

Stores the latest selected text for use in the popup.

Manages communication between different parts of the extension.

content.js:

Listens for mouseup events on the webpage.

When text is highlighted, it creates a button at the bottom of the page ("Add Flashcard").

When the button is clicked, it sends a message to the background script to open the popup with the selected text.

manifest.json:

Configures the extension, specifying permissions, content scripts, background script, and other details.

Defines the action that opens the popup when the user clicks on the extension's icon.

popup.html:

Provides the UI for users to input the details of the flashcard (front, back, hint, tags).

Contains form elements such as textareas for the front and back of the card, a text input for the hint, and tags input.

popup.js:

Handles the logic when the popup is loaded and the form is submitted.

Sends the selected text from the webpage to the popup.

Submits the flashcard data to a backend API (e.g., using fetch to make a POST request to save the flashcard).

3. Features and Functionality
   Highlight and Create Flashcard:

When the user highlights text on a webpage, a "Add Flashcard" button appears at the bottom right of the page.

Clicking the button opens the popup, with the selected text pre-filled in the "Front" textarea.

Users can then complete the flashcard with a back, hint, and tags.

Popup Form:

The user sees a form with the following fields:

Front: The highlighted text (pre-filled).

Back: The answer or information related to the flashcard.

Hint: Optional field for providing a hint.

Tags: Optional comma-separated list of tags.

The user can submit the form to save the flashcard.

Backend Communication:

Upon form submission, the data is sent to a backend (e.g., http://localhost:3001/api/flashcards) using a POST request.

If the request is successful, the flashcard is saved, and the user is alerted with a success message.

If the request fails, an error message is shown.

4. Directory Structure
   extension/
   ├── background.js # Background script to manage communication
   ├── content.js # Content script to interact with the page and user
   ├── manifest.json # Manifest for configuring the extension
   ├── popup.html # Popup UI for creating flashcards
   └── popup.js # JavaScript for handling popup actions

5. Permissions and Setup
   The extension requires the following permissions:

storage: To store any local data if necessary.

scripting: To run scripts on the current page.

activeTab: To interact with the active tab.

<all_urls>: To enable the extension to run on all web pages.

6. Error Handling and Validation
   Backend errors: If there is a failure to communicate with the backend API, the user is alerted with an error message.

Input validation: The frontend validates that the "front" and "back" fields are filled out before submitting the form.

Network errors: If the network request fails (e.g., due to a server issue), the user is notified with an error message.

7. User Flow
   User highlights text on any webpage.

The "Add Flashcard" button appears in the bottom-right corner.

User clicks the button, which opens the popup with the selected text pre-filled in the "front" textarea.

User fills out the form (optional hint and tags).

User clicks "Save Flashcard".

The flashcard is saved via a POST request to the backend.
