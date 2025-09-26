import React, { useState, useEffect, useRef } from 'react';

function SimpleConnect() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [isRegister, setIsRegister] = useState(false);
  
  // Nuove funzionalità
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const fileInputRef = useRef(null);

  // Carica utente dal localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      loadPosts();
      loadNotifications();
      loadOnlineUsers();
    } else {
      setShowLogin(true);
    }
  }, []);

  // Carica post
  const loadPosts = async () => {
    try {
      setLoading(true);
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carica notifiche
  const loadNotifications = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle notifiche:', error);
    }
  };

  // Carica utenti online
  const loadOnlineUsers = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.users || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento degli utenti online:', error);
    }
  };

  // Gestione file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileType(file.type.startsWith('image/') ? 'image' : 'video');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Rimuovi file selezionato
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Like/Unlike post
  const handleLike = async (postId) => {
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error('Errore nel like:', error);
    }
  };

  // Aggiungi commento
  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (response.ok) {
        setNewComment('');
        loadPosts();
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del commento:', error);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLogin(false);
        loadPosts();
        loadNotifications();
        loadOnlineUsers();
        alert('Login effettuato con successo!');
      } else {
        alert('Credenziali non valide');
      }
    } catch (error) {
      alert('Errore nel login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Registrazione
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      alert('Le password non coincidono');
      return;
    }
    
    setLoading(true);
    
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        })
      });
      
      if (response.ok) {
        alert('Registrazione completata! Ora puoi fare login.');
        setIsRegister(false);
        setRegisterData({ name: '', username: '', email: '', password: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        alert('Errore: ' + (error.error || 'Registrazione fallita'));
      }
    } catch (error) {
      alert('Errore nella registrazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Crea post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedFile) return;
    
    setLoading(true);
    
    try {
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://web-production-54984.up.railway.app';
      
      const token = localStorage.getItem('auth_token');
      
      let response;
      if (selectedFile) {
        // Post con media
        const formData = new FormData();
        formData.append('content', newPost);
        formData.append('media', selectedFile);
        
        response = await fetch(`${apiBase}/api/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Post solo testo
        response = await fetch(`${apiBase}/api/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: newPost })
        });
      }
      
      if (response.ok) {
        setNewPost('');
        removeFile();
        loadPosts();
        alert('Post pubblicato con successo!');
      } else {
        alert('Errore nella pubblicazione del post');
      }
    } catch (error) {
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
            <p className="text-gray-400 mt-2">Il tuo social network</p>
          </div>

          {!isRegister ? (
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
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="w-full text-blue-400 hover:text-blue-300"
              >
                Non hai un account? Registrati
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-6">Registrati</h2>
              <input
                type="text"
                placeholder="Nome completo"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Conferma Password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:bg-gray-700"
              >
                {loading ? 'Caricamento...' : 'Registrati'}
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="w-full text-blue-400 hover:text-blue-300"
              >
                Hai già un account? Accedi
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Interfaccia principale
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-blue-400">Connect</h1>
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

      {/* Layout principale */}
      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar sinistra - Notifiche */}
        <div className="w-80 p-4 border-r border-gray-800">
          <h3 className="text-lg font-bold mb-4 text-blue-400">🔔 Notifiche</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-gray-400 text-sm">Nessuna notifica</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'like' ? 'bg-red-500' :
                      notification.type === 'comment' ? 'bg-blue-500' :
                      notification.type === 'follow' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="text-sm text-gray-300">{notification.message}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString('it-IT')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="flex-1 p-4">
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
              
              {/* Preview file selezionato */}
              {filePreview && (
                <div className="relative">
                  {fileType === 'image' ? (
                    <img src={filePreview} alt="Preview" className="max-w-full max-h-64 rounded-lg object-cover" />
                  ) : (
                    <video src={filePreview} controls className="max-w-full max-h-64 rounded-lg" />
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {/* Pulsanti per file */}
              <div className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  📷 Foto/Video
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={(!newPost.trim() && !selectedFile) || loading}
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
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
                  </div>
                  
                  <div className="text-gray-100 mb-3">
                    {post.content}
                  </div>
                  
                  {/* Media */}
                  {post.image_url && (
                    <img 
                      src={`${window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://web-production-54984.up.railway.app'}${post.image_url}`}
                      alt="Post image" 
                      className="max-w-full rounded-lg mb-3"
                    />
                  )}
                  {post.video_url && (
                    <video 
                      src={`${window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://web-production-54984.up.railway.app'}${post.video_url}`}
                      controls 
                      className="max-w-full rounded-lg mb-3"
                    />
                  )}
                  
                  {/* Azioni */}
                  <div className="flex items-center space-x-4 mb-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 ${
                        post.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <span>{post.user_liked ? '❤️' : '🤍'}</span>
                      <span>{post.likes_count}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowComments(prev => ({
                          ...prev,
                          [post.id]: !prev[post.id]
                        }));
                      }}
                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-500"
                    >
                      <span>💬</span>
                      <span>{post.comments_count}</span>
                    </button>
                    
                    <button className="flex items-center space-x-1 text-gray-400 hover:text-green-500">
                      <span>📤</span>
                      <span>{post.shares_count}</span>
                    </button>
                  </div>
                  
                  {/* Commenti */}
                  {showComments[post.id] && (
                    <div className="border-t border-gray-700 pt-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Scrivi un commento..."
                          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Invia
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400">
                    {new Date(post.created_at).toLocaleString('it-IT')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Sidebar destra - Utenti online */}
        <div className="w-80 p-4 border-l border-gray-800">
          <h3 className="text-lg font-bold mb-4 text-green-400">👥 Online</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <div className="text-gray-400 text-sm">Nessun utente online</div>
            ) : (
              onlineUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      onlineUser.status === 'online' ? 'bg-green-500' :
                      onlineUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="text-sm text-gray-300">{onlineUser.name}</div>
                    <div className="text-xs text-gray-500">@{onlineUser.username}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleConnect;