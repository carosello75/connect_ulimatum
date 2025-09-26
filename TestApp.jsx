import React, { useState, useEffect } from 'react';

function TestApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula caricamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-bold text-blue-400">Connect</h1>
          <p className="text-gray-400 mt-2">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-400 mb-4">Connect</h1>
          <p className="text-gray-400">Test App funziona!</p>
        </div>
      </div>
    </div>
  );
}

export default TestApp;
