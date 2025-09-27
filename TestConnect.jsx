import React, { useState, useEffect } from 'react';

function TestConnect() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Carica utente dal localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      loadPosts();
    } else {
      setShowLogin(true);
    }
  }, []);

  // Carica post
  const loadPosts = async () => {
    try {
      setLoading(true);
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        console.log('✅ Post caricati:', data.posts?.length || 0);
      } else {
        console.error('❌ Errore nel caricamento dei post:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dei post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiBase = 'http://localhost:3001';
      
      console.log('🔐 Tentativo di login:', loginData.email);
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login riuscito:', data.user.name);
        
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLogin(false);
        loadPosts();
        alert('Login effettuato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore login:', errorData);
        alert('Credenziali non valide: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore login:', error);
      alert('Errore nel login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Crea post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    setLoading(true);
    
    try {
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      console.log('📝 Creando post:', newPost);
      
      const response = await fetch(`${apiBase}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPost })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Post creato:', data);
        setNewPost('');
        loadPosts();
        alert('Post pubblicato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore post:', errorData);
        alert('Errore: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore post:', error);
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setPosts([]);
    setShowLogin(true);
  };

  // Se non c'è utente, mostra login
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <h1 className="text-3xl font-bold text-blue-400">Connect</h1>
            <p className="text-gray-400 mt-2">Test Version</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-6">Accedi</h2>
            <input
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-700"
            >
              {loading ? 'Caricamento...' : 'Accedi'}
            </button>
          </form>
          
        </div>
      </div>
    );
  }

  // Interfaccia principale
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-blue-400">Connect - Test</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Ciao, {user.name}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Contenuto principale */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Form per nuovo post */}
        <div className="bg-gray-900 p-4 rounded-lg mb-6">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Cosa stai pensando?"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newPost.trim() || loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-700"
              >
                {loading ? 'Pubblicando...' : 'Pubblica'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista dei post */}
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Caricamento post...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Nessun post ancora. Sii il primo a pubblicare!</div>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {post.name ? post.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold">{post.name}</div>
                    <div className="text-sm text-gray-400">@{post.username}</div>
                  </div>
                </div>
                <div className="text-gray-100 mb-3">
                  {post.content}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(post.created_at).toLocaleString('it-IT')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TestConnect;
