import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1a1b1e',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />
      <ChatInterface />
    </div>
  );
}

export default App;
