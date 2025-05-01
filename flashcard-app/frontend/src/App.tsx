import React from "react";
import "./App.css";

import PracticeView from "./components/PracticeView";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1 className="app-header">Flashcard Learner</h1>
      <PracticeView />
    </div>
  );
};

export default App;
