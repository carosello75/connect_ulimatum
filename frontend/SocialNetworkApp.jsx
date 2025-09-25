import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Heart, MessageCircle, Share, Send, Settings, Search, Bell, Mail, Home, User, Plus, X, Image, Video, Smile, MoreHorizontal, Bookmark, Repeat2, TrendingUp, Users, Hash } from 'lucide-react';
import { api } from './api.js';

// Componenti rimossi per semplificare

const SocialNetworkApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newPost, setNewPost] = useState('');
  const textareaRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  // Funzione stabile per gestire il cambio del valore
  const handleNewPostChange = useCallback((e) => {
    setNewPost(e.target.value);
  }, []);
  
  // Funzione per gestire il caricamento di media
  const handleMediaUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Funzione per rimuovere media selezionato
  const removeMedia = useCallback(() => {
    setSelectedMedia(null);
    setMediaPreview(null);
  }, []);
  
  // Funzione per condividere un post
  const handleShare = useCallback(async (postId) => {
    if (!currentUser) return alert('Effettua il login');
    
    try {
      // Per ora implementiamo una condivisione semplice
      if (navigator.share) {
        await navigator.share({
          title: 'Post condiviso',
          text: 'Guarda questo post interessante!',
          url: window.location.href
        });
      } else {
        // Fallback: copia il link negli appunti
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiato negli appunti!');
      }
    } catch (e) {
      console.error('Errore nella condivisione:', e);
      alert('Errore nella condivisione');
    }
  }, [currentUser]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'like', user: 'Anna Bianchi', content: 'ha messo like al tuo post', time: '5m', read: false },
    { id: 2, type: 'comment', user: 'Luca Verdi', content: 'ha commentato il tuo post', time: '1h', read: false },
    { id: 3, type: 'follow', user: 'Sofia Tech', content: 'ha iniziato a seguirti', time: '3h', read: true }
  ]);
  const [messages, setMessages] = useState([
    { id: 1, user: { name: 'Marco Rossi', avatar: '🧑‍💻' }, lastMessage: 'Ciao! Come va il progetto?', time: '2m', unread: 2 },
    { id: 2, user: { name: 'Anna Bianchi', avatar: '👩‍🎨' }, lastMessage: 'Perfetto, grazie mille!', time: '1h', unread: 0 },
    { id: 3, user: { name: 'Sofia Tech', avatar: '👩‍💼' }, lastMessage: 'Vediamoci domani per il meeting', time: '3h', unread: 1 }
  ]);

  const [currentUser, setCurrentUser] = useState(null);
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', name: '', email: '', password: '' });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const [showComments, setShowComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');

  const handleLike = useCallback(async (postId) => {
    try {
      await api.like(postId);
      setPosts(prev => prev.map(p => p.id === Number(postId) ? { ...p, user_liked: p.user_liked ? 0 : 1, likes_count: (p.likes_count || 0) + (p.user_liked ? -1 : 1) } : p));
    } catch (e) {
      console.error(e);
      alert('Errore nel mettere like');
    }
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!currentUser) {
      console.log('Nessun utente autenticato');
      return alert('Effettua il login');
    }
    
    // Usiamo il valore corrente di newPost senza dipendenza
    const postContent = newPost.trim();
    if (!postContent && !selectedMedia) {
      console.log('Post vuoto');
      return;
    }
    
    console.log('Creando post:', postContent);
    console.log('Utente corrente:', currentUser);
    
    try {
      let result;
      if (selectedMedia) {
        // Creiamo un FormData per inviare il file
        const formData = new FormData();
        formData.append('content', postContent);
        formData.append('media', selectedMedia);
        
        // Usiamo fetch direttamente per inviare il file
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3001/api/posts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento del post con media');
        }
        
        result = await response.json();
      } else {
        result = await api.addPost(postContent);
      }
      
      console.log('Post creato con successo:', result);
      setNewPost('');
      setSelectedMedia(null);
      setMediaPreview(null);
      
      // Refresh feed after posting
      console.log('Caricando feed aggiornato...');
      const data = await api.feed(1, 10);
      console.log('Feed caricato:', data);
      
      const normalized = (data.posts || []).map(p => ({
        id: p.id,
        user: { name: p.name, username: `@${p.username}`, avatar: p.avatar || '👤', verified: !!p.verified },
        content: p.content,
        image: p.image_url || null,
        created_at: p.created_at,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        shares_count: p.shares_count,
        user_liked: p.user_liked,
        comments_list: [],
      }));
      setPosts(normalized);
      console.log('Feed aggiornato con successo');
    } catch (e) {
      console.error('Errore nella creazione del post:', e);
      alert(`Errore nella creazione del post: ${e.message}`);
    }
  }, [currentUser, selectedMedia]);

  const handleComment = useCallback(async (postId) => {
    if (!currentUser) return alert('Effettua il login');
    if (newComment.trim()) {
      try {
        await api.addComment(postId, newComment);
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const newCommentObj = {
              id: Date.now(),
              user: currentUser.name,
              content: newComment,
              likes: 0
            };
            return {
              ...post,
              comments_count: (post.comments_count || 0) + 1,
              comments_list: [...(post.comments_list || []), newCommentObj]
            };
          }
          return post;
        }));
        setNewComment('');
      } catch (e) {
        console.error(e);
        alert('Errore nel commentare');
      }
    }
  }, [currentUser, newComment]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        const data = await api.feed(1, 10);
        const normalized = (data.posts || []).map(p => ({
          id: p.id,
          user: { name: p.name, username: `@${p.username}`, avatar: p.avatar || '👤', verified: !!p.verified },
          content: p.content,
          image: p.image_url || null,
          created_at: p.created_at,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          shares_count: p.shares_count,
          user_liked: p.user_liked,
          comments_list: [],
        }));
        setPosts(normalized);
      } catch (e) {
        setError(e.message || 'Errore nel caricare il feed');
      } finally {
        setLoading(false);
      }
    }
    const token = localStorage.getItem('auth_token');
    if (token) loadFeed();
  }, []); // Rimuoviamo currentUser dalla dipendenza per evitare loop infiniti

  async function handleLogin(e) {
    e.preventDefault();
    console.log('Tentativo di login con:', auth.email);
    try {
      const res = await api.login(auth.email, auth.password);
      console.log('Login riuscito:', res);
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setError('');
      console.log('Utente impostato:', res.user);
    } catch (e) {
      console.error('Errore login:', e);
      setError(e.message || 'Login fallito');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const { username, name, email, password } = registerData;
    if (!username.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError('Compila tutti i campi');
      return;
    }
    console.log('Tentativo di registrazione con:', { username, name, email });
    try {
      const res = await api.register(username.trim(), email.trim(), password, name.trim());
      console.log('Registrazione riuscita:', res);
      // auto-login con i dati restituiti
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setError('');
      setAuthMode('login');
      console.log('Utente registrato e impostato:', res.user);
    } catch (e) {
      console.error('Errore registrazione:', e);
      if (e.message && e.message.includes('già esistente')) {
        setError('Username o email già in uso. Prova con credenziali diverse.');
      } else {
        setError(e.message || 'Registrazione fallita');
      }
    }
  }

  function handleLogout() {
    console.log('Logout in corso...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    setPosts([]);
    setError('');
    console.log('Logout completato');
  }

  const Sidebar = () => (
    <div className="w-64 bg-black/80 backdrop-blur border-r border-gray-800 p-4 fixed h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">SocialX</h1>
      </div>
      
      <nav className="space-y-2">
        {[
          { icon: Home, label: 'Home', view: 'home' },
          { icon: Search, label: 'Esplora', view: 'explore' },
          { icon: Bell, label: 'Notifiche', view: 'notifications', badge: notifications.filter(n => !n.read).length },
          { icon: Mail, label: 'Messaggi', view: 'messages', badge: messages.reduce((sum, m) => sum + m.unread, 0) },
          { icon: Bookmark, label: 'Segnalibri', view: 'bookmarks' },
          { icon: User, label: 'Profilo', view: 'profile' },
          { icon: Settings, label: 'Impostazioni', view: 'settings' }
        ].map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`flex items-center w-full p-3 rounded-full transition-colors duration-150 relative ${
              currentView === item.view 
                ? 'bg-blue-600 text-white' 
                : 'text-white hover:bg-gray-900/70'
            }`}
          >
            <item.icon className="w-6 h-6 mr-3" />
            <span className="text-lg">{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <button 
        onClick={() => setCurrentView('compose')}
        className="w-full bg-blue-500 text-white rounded-full py-3 mt-6 font-bold hover:bg-blue-600 transition-colors"
      >
        Post
      </button>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <div className="flex items-center p-3 hover:bg-gray-900 rounded-full cursor-pointer">
          <span className="text-2xl mr-3">{currentUser?.avatar || '👤'}</span>
          <div>
            <div className="text-white font-bold">{currentUser ? currentUser.name : 'Ospite'}</div>
            <div className="text-gray-500 text-sm">{currentUser ? `@${String(currentUser.username || '').replace('@','')}` : ''}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {!currentUser ? (
            <></>
          ) : (
            <button onClick={handleLogout} className="border border-gray-600 text-white px-4 py-1 rounded-full text-sm hover:bg-gray-800">Logout</button>
          )}
        </div>
      </div>
    </div>
  );

  const PostComponent = useCallback(({ post }) => (
    <div className="border-b border-gray-800 p-4 hover:bg-gray-900/60 transition-colors">
      <div className="flex space-x-3">
        <span className="text-2xl">{post.user.avatar}</span>
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="text-white font-bold">{post.user.name}</span>
            {post.user.verified && <span className="text-blue-500">✓</span>}
            <span className="text-gray-500">@{post.user.username.replace('@', '')}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{post.timestamp}</span>
          </div>
          
          <div className="mt-2 text-white whitespace-pre-wrap">
            {post.content}
          </div>
          
          {post.image && (
            <div className="mt-3 rounded-2xl overflow-hidden">
              <img src={post.image} alt="Post image" className="w-full h-64 object-cover" />
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3 max-w-md">
            <button 
              onClick={() => setShowComments(showComments === post.id ? null : post.id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-900 group-hover:bg-opacity-20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span>{post.comments}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-900 group-hover:bg-opacity-20">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span>{post.shares}</span>
            </button>
            
            <button 
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 transition-colors group ${
                post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-900 group-hover:bg-opacity-20">
                <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
              </div>
              <span>{post.likes}</span>
            </button>
            
            <button 
              onClick={() => handleShare(post.id)}
              className="text-gray-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-900 group-hover:bg-opacity-20">
                <Share className="w-5 h-5" />
              </div>
            </button>
          </div>
          
          {showComments === post.id && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <div className="space-y-3">
                {post.comments_list.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <span className="text-blue-500 font-semibold">{comment.user}</span>
                      <p className="text-gray-300">{comment.content}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <button className="text-gray-500 hover:text-red-500 text-sm flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {comment.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-4">
                <span className="text-2xl">{currentUser.avatar}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Aggiungi un commento..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                    className="w-full bg-transparent text-white text-lg placeholder-gray-500 border-none outline-none"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!newComment.trim()}
                    className="bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-1 rounded-full text-sm font-bold mt-2 hover:bg-blue-600 transition-colors"
                  >
                    Commenta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ), [handleLike, showComments, setShowComments, newComment, setNewComment, handleComment, currentUser]);

  const HomeView = () => (
    <div>
      {/* Input del post direttamente qui */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex space-x-4">
          <span className="text-2xl">{currentUser?.avatar || '👤'}</span>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Cosa sta succedendo?"
              value={newPost}
              onChange={handleNewPostChange}
              className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none border-none outline-none min-h-[120px]"
              rows="3"
            />
            {/* Preview del media selezionato */}
            {mediaPreview && (
              <div className="mt-4 relative">
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="max-w-full max-h-64 rounded-lg object-cover"
                />
                <button 
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-4">
                <label className="text-blue-500 hover:bg-blue-900 hover:bg-opacity-20 p-2 rounded-full cursor-pointer">
                  <Image className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
                <label className="text-blue-500 hover:bg-blue-900 hover:bg-opacity-20 p-2 rounded-full cursor-pointer">
                  <Video className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
                <button className="text-blue-500 hover:bg-blue-900 hover:bg-opacity-20 p-2 rounded-full">
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.trim() && !selectedMedia}
                className="bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600 transition-colors"
              >
                Posta
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feed dei post */}
      {loading ? (
        <div className="p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-1/3 bg-gray-800 rounded"></div>
              <div className="mt-3 h-3 w-2/3 bg-gray-900 rounded"></div>
              <div className="mt-2 h-3 w-5/6 bg-gray-900 rounded"></div>
              <div className="mt-2 h-3 w-1/2 bg-gray-900 rounded"></div>
              <div className="mt-4 h-px bg-gray-800"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-red-400">{error}</div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostComponent key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );

  const NotificationsView = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-4">Notifiche</h2>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className={`p-4 rounded-lg ${notification.read ? 'bg-gray-900' : 'bg-blue-900 bg-opacity-20'}`}>
            <div className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-600' : 'bg-blue-500'}`}></div>
              <div>
                <p className="text-white">
                  <span className="font-bold">{notification.user}</span> {notification.content}
                </p>
                <p className="text-gray-500 text-sm mt-1">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MessagesView = () => (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Messaggi</h2>
        </div>
        <div className="space-y-1">
          {messages.map((message) => (
            <button
              key={message.id}
              onClick={() => setSelectedChat(message)}
              className={`w-full p-4 text-left hover:bg-gray-900 transition-colors ${
                selectedChat?.id === message.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{message.user.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold truncate">{message.user.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 text-sm">{message.time}</span>
                      {message.unread > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {message.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{message.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1">
        {selectedChat ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedChat.user.avatar}</span>
                <div>
                  <p className="text-white font-bold">{selectedChat.user.name}</p>
                  <p className="text-gray-500 text-sm">Online</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-md max-w-xs">
                  Ciao! Come va il progetto?
                </div>
              </div>
              <div className="flex">
                <div className="bg-gray-800 text-white p-3 rounded-2xl rounded-bl-md max-w-xs">
                  Tutto bene! Sto finendo gli ultimi dettagli
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-800">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Scrivi un messaggio..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 outline-none"
                />
                <button className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Seleziona una chat</h3>
              <p className="text-gray-500">Scegli una conversazione per iniziare a chattare</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ProfileView = () => (
    <div>
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="absolute bottom-0 left-4 transform translate-y-1/2">
          <span className="text-8xl bg-black rounded-full p-2">{currentUser.avatar}</span>
        </div>
      </div>
      
      <div className="pt-16 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
            <p className="text-gray-500">@{currentUser.username.replace('@', '')}</p>
          </div>
          <button className="border border-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800">
            Modifica profilo
          </button>
        </div>
        
        <p className="text-white mt-4">{currentUser.bio}</p>
        
        <div className="flex space-x-6 mt-4">
          <span className="text-gray-500">
            <span className="text-white font-bold">{currentUser.following}</span> Following
          </span>
          <span className="text-gray-500">
            <span className="text-white font-bold">{currentUser.followers}</span> Followers
          </span>
        </div>
      </div>
      
      <div className="border-b border-gray-800 mt-6">
        <div className="flex">
          <button className="flex-1 py-4 text-center text-white font-bold border-b-2 border-blue-500">
            Post
          </button>
          <button className="flex-1 py-4 text-center text-gray-500 hover:text-white">
            Media
          </button>
          <button className="flex-1 py-4 text-center text-gray-500 hover:text-white">
            Like
          </button>
        </div>
      </div>
      
      <div>
        {posts.filter(post => post.user.username === currentUser.username).map((post) => (
          <PostComponent key={post.id} post={post} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white flex">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="border-r border-gray-800 min-h-screen max-w-2xl">
          <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-gray-800 p-4">
            <h1 className="text-xl font-bold text-white">
              {currentView === 'home' && 'Home'}
              {currentView === 'notifications' && 'Notifiche'}
              {currentView === 'messages' && 'Messaggi'}
              {currentView === 'profile' && 'Profilo'}
            </h1>
          </div>
          
          {!currentUser && (
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-4 mb-3">
                <button onClick={()=>{setAuthMode('login'); setError('');}} className={`px-3 py-1 rounded-full text-sm font-semibold ${authMode==='login' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-300'}`}>Login</button>
                <button onClick={()=>{setAuthMode('register'); setError('');}} className={`px-3 py-1 rounded-full text-sm font-semibold ${authMode==='register' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-300'}`}>Registrati</button>
              </div>
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="text-white font-bold text-lg">Accedi</div>
                  <input value={auth.email} onChange={(e)=>setAuth(a=>({...a, email:e.target.value}))} placeholder="Email" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <input type="password" value={auth.password} onChange={(e)=>setAuth(a=>({...a, password:e.target.value}))} placeholder="Password" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded font-bold">Login</button>
                  {error && <div className="text-red-400 text-sm">{error}</div>}
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="text-white font-bold text-lg">Crea account</div>
                  <input value={registerData.username} onChange={(e)=>setRegisterData(d=>({...d, username:e.target.value}))} placeholder="Username" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <input value={registerData.name} onChange={(e)=>setRegisterData(d=>({...d, name:e.target.value}))} placeholder="Nome" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <input value={registerData.email} onChange={(e)=>setRegisterData(d=>({...d, email:e.target.value}))} placeholder="Email" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <input type="password" value={registerData.password} onChange={(e)=>setRegisterData(d=>({...d, password:e.target.value}))} placeholder="Password" className="w-full bg-gray-900 text-white rounded px-3 py-2 outline-none" />
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded font-bold">Registrati</button>
                  {error && <div className="text-red-400 text-sm">{error}</div>}
                </form>
              )}
            </div>
          )}

          <div className="min-h-screen">
            {currentView === 'home' && <HomeView />}
            {currentView === 'notifications' && <NotificationsView />}
            {currentView === 'messages' && <MessagesView />}
            {currentView === 'profile' && <ProfileView />}
          </div>
        </div>
      </div>
      
      <div className="w-80 p-4 space-y-6">
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-xl font-bold text-white mb-4">Cosa sta succedendo</h2>
          <div className="space-y-3">
            <div className="cursor-pointer hover:bg-gray-800 p-2 rounded">
              <p className="text-gray-400 text-sm">Tendenza in Italia</p>
              <p className="text-white font-bold">#ReactJS</p>
              <p className="text-gray-400 text-sm">125K Post</p>
            </div>
            <div className="cursor-pointer hover:bg-gray-800 p-2 rounded">
              <p className="text-gray-400 text-sm">Tendenza in Tecnologia</p>
              <p className="text-white font-bold">#WebDevelopment</p>
              <p className="text-gray-400 text-sm">89K Post</p>
            </div>
            <div className="cursor-pointer hover:bg-gray-800 p-2 rounded">
              <p className="text-gray-400 text-sm">Tendenza</p>
              <p className="text-white font-bold">#JavaScript</p>
              <p className="text-gray-400 text-sm">67K Post</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-xl font-bold text-white mb-4">Chi seguire</h2>
          <div className="space-y-3">
            {['👨‍🏫 Prof. Coding', '🎯 Design Pro', '⚡ Speed Dev'].map((name, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{name.split(' ')[0]}</span>
                  <div>
                    <p className="text-white font-bold">{name.substring(2)}</p>
                    <p className="text-gray-500 text-sm">@{name.substring(2).toLowerCase().replace(' ', '')}</p>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm hover:bg-gray-200">
                  Segui
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworkApp;


