import React from 'react';

import PracticeView from './components/PracticeView';

const App: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Flashcard Learner</h1>
      <PracticeView />
    </div>
  );
};

export default App;
