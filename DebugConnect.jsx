import React, { useState, useEffect, useRef } from 'react';

function DebugConnect() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  
  // Impostazioni profilo
  const [showProfile, setShowProfile] = useState(false);
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    location: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const profileImageRef = useRef(null);
  
  // Notifiche e utenti online
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  
  // Sistema recensioni
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: ''
  });
  
  // Stati per condivisione
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Stati per registrazione
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Stati per gestione utenti
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Carica utente dal localStorage
  useEffect(() => {
    console.log('🔍 DebugConnect: useEffect iniziale');
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    
    console.log('🔍 Utente salvato:', savedUser);
    console.log('🔍 Token salvato:', savedToken ? 'Presente' : 'Assente');
    
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
      console.log('🔍 Caricamento post...');
      setLoading(true);
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      console.log('🔍 Token per API:', token ? 'Presente' : 'Assente');
      
      const response = await fetch(`${apiBase}/api/posts/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta API:', response.status);
      
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

  // Carica commenti per un post
  const loadComments = async (postId) => {
    try {
      console.log('🔍 Caricamento commenti per post:', postId);
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta commenti:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: data.comments || []
        }));
        console.log('✅ Commenti caricati per post', postId, ':', data.comments?.length || 0);
      } else {
        console.error('❌ Errore nel caricamento dei commenti:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dei commenti:', error);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔍 Tentativo di login:', loginData.email);
    setLoading(true);
    
    try {
      const apiBase = 'http://localhost:3001';
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      console.log('🔍 Risposta login:', response.status);
      
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

  // Carica tutti gli utenti
  const loadAllUsers = async () => {
    try {
      console.log('🔍 Caricamento tutti gli utenti...');
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBase}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta utenti:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
        console.log('✅ Utenti caricati:', data.users?.length || 0);
      } else {
        console.error('❌ Errore nel caricamento degli utenti:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento degli utenti:', error);
    }
  };

  // Crea nuovo utente
  const handleCreateUser = async (e) => {
    e.preventDefault();
    console.log('🔍 Creazione nuovo utente:', newUserData.email);
    setLoading(true);
    
    try {
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUserData)
      });
      
      console.log('🔍 Risposta creazione utente:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Utente creato:', data.user.name);
        
        setNewUserData({
          name: '',
          username: '',
          email: '',
          password: '',
          role: 'user'
        });
        
        loadAllUsers(); // Ricarica la lista utenti
        alert('🎉 Utente creato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore nella creazione utente:', errorData);
        alert('Errore: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore nella creazione utente:', error);
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Elimina commento
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Sei sicuro di voler eliminare questo commento?')) return;
    
    try {
      console.log('🔍 Eliminando commento:', commentId);
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBase}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta eliminazione commento:', response.status);
      
      if (response.ok) {
        console.log('✅ Commento eliminato con successo');
        // Ricarica i commenti per questo post
        const postId = Object.keys(comments).find(id => 
          comments[id].some(comment => comment.id === commentId)
        );
        if (postId) {
          loadComments(postId);
        }
        alert('Commento eliminato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore nell\'eliminazione del commento:', errorData);
        alert('Errore: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione del commento:', error);
      alert('Errore: ' + error.message);
    }
  };

  // Registrazione
  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('🔍 Tentativo di registrazione:', registerData.email);
    setLoading(true);
    
    try {
      // Validazione
      if (!registerData.name || !registerData.username || !registerData.email || !registerData.password) {
        alert('❌ Compila tutti i campi obbligatori');
        setLoading(false);
        return;
      }
      
      if (registerData.password !== registerData.confirmPassword) {
        alert('❌ Le password non coincidono');
        setLoading(false);
        return;
      }
      
      if (registerData.password.length < 6) {
        alert('❌ La password deve essere di almeno 6 caratteri');
        setLoading(false);
        return;
      }
      
      const apiBase = 'http://localhost:3001';
      
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
      
      console.log('🔍 Risposta registrazione:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Registrazione riuscita:', data.user.name);
        
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLogin(false);
        loadPosts();
        alert('🎉 Benvenuto su Connect! La tua registrazione è stata completata con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore registrazione:', errorData);
        alert('Errore nella registrazione: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore registrazione:', error);
      alert('Errore nella registrazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Crea post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedFile) return;
    
    console.log('🔍 Creando post:', newPost, 'File:', selectedFile?.name);
    setLoading(true);
    
    try {
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      let response;
      
      if (selectedFile) {
        // Post con file
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
      
      console.log('🔍 Risposta creazione post:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Post creato:', data);
        setNewPost('');
        removeFile(); // Rimuovi il file selezionato
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

  // Like/Unlike post
  const handleLike = async (postId) => {
    try {
      console.log('🔍 Aggiungendo like al post:', postId);
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta like:', response.status);
      
      if (response.ok) {
        loadPosts(); // Ricarica i post per aggiornare il contatore
        console.log('✅ Like aggiunto con successo');
      } else {
        console.error('❌ Errore nel like:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel like:', error);
    }
  };

  // Gestione file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🔍 File selezionato:', file.name, file.type, file.size);
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

  // Gestione immagine profilo
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🔍 Immagine profilo selezionata:', file.name, file.type, file.size);
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Rimuovi immagine profilo
  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (profileImageRef.current) {
      profileImageRef.current.value = '';
    }
  };

  // Carica notifiche
  const loadNotifications = async () => {
    try {
      console.log('🔍 Caricamento notifiche...');
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta notifiche:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        console.log('✅ Notifiche caricate:', data.notifications?.length || 0);
      } else {
        console.error('❌ Errore nel caricamento delle notifiche:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento delle notifiche:', error);
    }
  };

  // Carica utenti online
  const loadOnlineUsers = async () => {
    try {
      console.log('🔍 Caricamento utenti online...');
      const apiBase = 'http://localhost:3001';
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/api/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta utenti online:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.users || []);
        console.log('✅ Utenti online caricati:', data.users?.length || 0);
      } else {
        console.error('❌ Errore nel caricamento degli utenti online:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento degli utenti online:', error);
    }
  };

  // Salva impostazioni profilo
  const handleSaveProfile = async () => {
    try {
      console.log('🔍 Salvando profilo:', profileSettings);
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      formData.append('name', profileSettings.name);
      formData.append('username', profileSettings.username);
      formData.append('email', profileSettings.email);
      formData.append('bio', profileSettings.bio);
      formData.append('website', profileSettings.website);
      formData.append('location', profileSettings.location);
      
      if (profileImage) {
        formData.append('image', profileImage);
      }
      
      const response = await fetch(`${apiBase}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('🔍 Risposta aggiornamento profilo:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profilo aggiornato:', data);
        
        // Aggiorna l'utente nel localStorage
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setShowProfile(false);
        alert('Profilo aggiornato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore aggiornamento profilo:', errorData);
        alert('Errore: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore aggiornamento profilo:', error);
      alert('Errore: ' + error.message);
    }
  };

  // Elimina post
  const handleDeletePost = async (postId) => {
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return;
    
    try {
      console.log('🔍 Eliminando post:', postId);
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBase}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Risposta eliminazione post:', response.status);
      
      if (response.ok) {
        console.log('✅ Post eliminato con successo');
        loadPosts(); // Ricarica i post
        alert('Post eliminato con successo!');
      } else {
        const errorData = await response.json();
        console.error('❌ Errore nell\'eliminazione del post:', errorData);
        alert('Errore: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione del post:', error);
      alert('Errore: ' + error.message);
    }
  };

  // Condividi post sui social
  const handleSharePost = async (post) => {
    // Su mobile, prova prima Web Share API
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        const shareData = {
          title: `Post di ${post.name} su Connect`,
          text: post.content || 'Guarda questo post su Connect!',
          url: window.location.origin
        };
        await navigator.share(shareData);
        console.log('✅ Condiviso con Web Share API');
        return;
      } catch (error) {
        console.log('⚠️ Web Share API annullato dall\'utente');
      }
    }
    
    // Su desktop o se Web Share API non funziona, apri modal
    setSelectedPost(post);
    setShowShareModal(true);
  };

  // Condividi su social specifici
  const shareToSocial = (platform, post) => {
    const shareUrl = window.location.origin;
    const shareText = encodeURIComponent(post.content || 'Guarda questo post su Connect!');
    const shareTitle = encodeURIComponent(`Post di ${post.name} su Connect`);
    
    let socialUrl = '';
    
    switch (platform) {
      case 'facebook':
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${shareText}`;
        break;
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        socialUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        socialUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
        break;
      case 'linkedin':
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram non supporta link diretti, copia negli appunti
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('✅ Link copiato! Incollalo nella tua storia Instagram!');
        return;
      case 'tiktok':
        // TikTok non supporta link diretti, copia negli appunti
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('✅ Link copiato! Incollalo nel tuo video TikTok!');
        return;
      default:
        return;
    }
    
    // Apri il social in una nuova finestra
    window.open(socialUrl, '_blank', 'width=600,height=400');
    console.log(`✅ Condiviso su ${platform}`);
  };

  // Aggiungi commento
  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    
    console.log('🔍 Aggiungendo commento:', newComment, 'al post:', postId);
    
    try {
      const apiBase = 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBase}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      console.log('🔍 Risposta aggiunta commento:', response.status);
      
      if (response.ok) {
        setNewComment('');
        loadPosts();
        loadComments(postId);
        console.log('✅ Commento aggiunto con successo');
        alert('Commento aggiunto!');
      } else {
        console.error('❌ Errore nell\'aggiunta del commento:', response.status);
        alert('Errore nell\'aggiunta del commento');
      }
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta del commento:', error);
      alert('Errore: ' + error.message);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // In locale, mostra il link direttamente per test
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
          alert(`✅ Token generato! In locale, controlla la console del server per il link di reset.`);
        } else {
          alert('✅ Email di reset inviata! Controlla la tua casella di posta.');
        }
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      } else {
        alert(`❌ Errore: ${data.error}`);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('❌ Errore nella richiesta di reset password');
    } finally {
      setLoading(false);
    }
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
              <h2 className="text-xl font-bold text-center mb-6">🔐 Accedi</h2>
              <input
                type="email"
                placeholder="📧 Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="🔒 Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-700"
              >
                {loading ? 'Caricamento...' : '🔐 Accedi'}
              </button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-yellow-400 hover:text-yellow-300 text-sm block w-full"
                >
                  🔒 Password dimenticata?
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Non hai un account? 🚀 Registrati
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-6">🚀 Registrati</h2>
              
              <input
                type="text"
                placeholder="👤 Nome Completo"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              
              <input
                type="text"
                placeholder="🏷️ Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              
              <input
                type="email"
                placeholder="📧 Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="🔒 Password (min. 6 caratteri)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="🔒 Conferma Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title={showConfirmPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              
              {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                <div className="text-red-400 text-sm text-center">
                  ⚠️ Le password non coincidono
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !registerData.name || !registerData.username || !registerData.email || !registerData.password || registerData.password !== registerData.confirmPassword}
                className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:bg-gray-700"
              >
                {loading ? 'Caricamento...' : '🚀 Crea Account'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Hai già un account? 🔐 Accedi
                </button>
              </div>
            </form>
          )}
          
          {/* Form Password Dimenticata */}
          {showForgotPassword && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold text-center mb-4 text-yellow-400">
                🔒 Password Dimenticata
              </h3>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  placeholder="📧 Inserisci la tua email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-yellow-500 text-black p-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors disabled:bg-gray-700"
                  >
                    {loading ? 'Invio...' : '📧 Invia Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                    }}
                    className="flex-1 bg-gray-600 text-white p-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                  >
                    ❌ Annulla
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>Credenziali di test:</p>
            <p>Email: test2@example.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    );
  }

  // Interfaccia principale
  return (
    <div className="min-h-screen bg-black text-white mobile-backend">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between mobile-backend">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-blue-400">Connect</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || 'User'} 
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : 'flex'}`}
                style={{ display: user.avatar ? 'none' : 'flex' }}
              >
                <span className="text-white font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className="text-sm">Ciao, {user.name}!</span>
            </div>
            
            {/* Notifiche */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm relative"
            >
              🔔 Notifiche {notifications.length > 0 && `(${notifications.length})`}
            </button>
            
            {/* Utenti online */}
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
              👥 Online {onlineUsers.length > 0 && `(${onlineUsers.length})`}
            </button>
            
            {/* Recensioni */}
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              ⭐ Recensioni
            </button>
            
            <button
              onClick={() => {
                setShowUserManagement(!showUserManagement);
                if (!showUserManagement) {
                  loadAllUsers();
                }
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
              👥 Utenti
            </button>
            
            <button
              onClick={() => {
                setProfileSettings({
                  name: user.name || '',
                  username: user.username || '',
                  email: user.email || '',
                  bio: user.bio || '',
                  website: user.website || '',
                  location: user.location || ''
                });
                setShowProfile(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              ⚙️ Profilo
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Pannelli laterali */}
      <div className="flex">
        {/* Pannello notifiche */}
        {showNotifications && (
          <div className="w-80 bg-gray-900 border-r border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🔔 Notifiche</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  Nessuna notifica
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-100">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString('it-IT')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Pannello utenti online */}
        {showOnlineUsers && (
          <div className="w-80 bg-gray-900 border-r border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">👥 Utenti Online</h3>
              <button
                onClick={() => setShowOnlineUsers(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  Nessun utente online
                </div>
              ) : (
                onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Pannello recensioni */}
        {showReviews && (
          <div className="w-80 bg-gray-900 border-r border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">⭐ Recensioni</h3>
              <button
                onClick={() => setShowReviews(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Form nuova recensione */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <h4 className="text-white font-bold mb-3">Scrivi una recensione</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Valutazione</label>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 stelle)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 stelle)</option>
                    <option value={3}>⭐⭐⭐ (3 stelle)</option>
                    <option value={2}>⭐⭐ (2 stelle)</option>
                    <option value={1}>⭐ (1 stella)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Titolo</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                    placeholder="Titolo della recensione"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Recensione</label>
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                    placeholder="Scrivi la tua recensione..."
                    rows="3"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                  />
                </div>
                
                <button
                  onClick={() => {
                    // Simula l'invio della recensione
                    const review = {
                      id: Date.now(),
                      user: user.name,
                      rating: newReview.rating,
                      title: newReview.title,
                      content: newReview.content,
                      created_at: new Date().toISOString()
                    };
                    setReviews([review, ...reviews]);
                    setNewReview({ rating: 5, title: '', content: '' });
                    alert('Recensione pubblicata!');
                  }}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
                >
                  📝 Pubblica Recensione
                </button>
              </div>
            </div>
            
            {/* Lista recensioni */}
            <div className="space-y-3">
              <h4 className="text-white font-bold">Recensioni recenti</h4>
              {reviews.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  Nessuna recensione ancora
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-white">{review.user}</div>
                      <div className="text-yellow-400">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">{review.title}</div>
                    <div className="text-sm text-gray-300">{review.content}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleString('it-IT')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
            
            {/* Upload file */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              >
                📎 Aggiungi foto/video
              </label>
              
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {fileType === 'image' ? '🖼️' : '🎥'} {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    ❌ Rimuovi
                  </button>
                </div>
              )}
              
              {filePreview && (
                <div className="mt-2">
                  {fileType === 'image' ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-w-xs max-h-48 rounded-lg"
                    />
                  ) : (
                    <video
                      src={filePreview}
                      controls
                      className="max-w-xs max-h-48 rounded-lg"
                    />
                  )}
                </div>
              )}
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
              <div key={post.id} className="bg-gray-900 p-4 rounded-lg mobile-post-container">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                      {post.avatar ? (
                        <img 
                          src={post.avatar} 
                          alt={post.name || 'User'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-blue-500 flex items-center justify-center ${post.avatar ? 'hidden' : 'flex'}`}
                        style={{ display: post.avatar ? 'none' : 'flex' }}
                      >
                        <span className="text-white font-bold">
                          {post.name ? post.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{post.name}</div>
                      <div className="text-sm text-gray-400">@{post.username}</div>
                    </div>
                  </div>
                  
                  {/* Pulsante elimina - sempre visibile */}
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                    title="Elimina post"
                  >
                    🗑️ Elimina
                  </button>
                </div>
                
                <div className="text-gray-100 mb-3">
                  {post.content}
                </div>
                
                {/* Media */}
                {post.image_url && (
                  <img 
                    src={`http://localhost:3001${post.image_url}`}
                    alt="Post image" 
                    className="max-w-full rounded-lg mb-3"
                  />
                )}
                {post.video_url && (
                  <video 
                    src={`http://localhost:3001${post.video_url}`}
                    controls 
                    className="max-w-full rounded-lg mb-3"
                  />
                )}
                
                {/* Azioni */}
                <div className="flex items-center space-x-4 mb-3 mobile-actions">
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
                      if (!showComments[post.id]) {
                        loadComments(post.id);
                      }
                    }}
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-500"
                  >
                    <span>💬</span>
                    <span>{post.comments_count}</span>
                  </button>
                  
                  <button
                    onClick={() => handleSharePost(post)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-green-500"
                    title="Condividi post"
                  >
                    <span>📤</span>
                    <span>Condividi</span>
                  </button>
                </div>
                
                {/* Commenti */}
                {showComments[post.id] && (
                  <div className="border-t border-gray-700 pt-3">
                    {/* Lista commenti esistenti */}
                    {comments[post.id] && comments[post.id].length > 0 && (
                      <div className="mb-3 space-y-2">
                        {comments[post.id].map((comment) => (
                          <div key={comment.id} className="bg-gray-800 p-2 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm">{comment.username}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleString('it-IT')}
                                </span>
                              </div>
                              
                              {/* Pulsante elimina commento (solo per i propri commenti) */}
                              {comment.user_id === user.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-500 hover:text-red-400 text-xs"
                                  title="Elimina commento"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                            <div className="text-sm text-gray-100">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Form nuovo commento */}
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
      
      {/* Modal Impostazioni Profilo */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Impostazioni Profilo</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Avatar */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : user.avatar ? (
                    <img
                      src={`http://localhost:3001${user.avatar}`}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                
                <input
                  ref={profileImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  id="profile-image-upload"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm"
                >
                  📷 Cambia Avatar
                </label>
                
                {profileImage && (
                  <button
                    onClick={removeProfileImage}
                    className="ml-2 text-red-500 hover:text-red-400 text-sm"
                  >
                    ❌ Rimuovi
                  </button>
                )}
              </div>
              
              {/* Informazioni personali */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="Il tuo nome"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileSettings.username}
                    onChange={(e) => setProfileSettings({...profileSettings, username: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="@username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white resize-none"
                    rows="3"
                    placeholder="Racconta qualcosa di te..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Sito Web
                  </label>
                  <input
                    type="url"
                    value={profileSettings.website}
                    onChange={(e) => setProfileSettings({...profileSettings, website: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Località
                  </label>
                  <input
                    type="text"
                    value={profileSettings.location}
                    onChange={(e) => setProfileSettings({...profileSettings, location: e.target.value})}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="Città, Paese"
                  />
                </div>
              </div>
              
              {/* Pulsanti */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  💾 Salva
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                >
                  ❌ Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Pannello gestione utenti */}
        {showUserManagement && (
          <div className="w-80 bg-gray-900 border-r border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">👥 Gestione Utenti</h3>
              <button
                onClick={() => setShowUserManagement(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Form creazione nuovo utente */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <h4 className="text-white font-bold mb-3">➕ Crea Nuovo Utente</h4>
              
              <form onSubmit={handleCreateUser} className="space-y-3">
                <input
                  type="text"
                  placeholder="👤 Nome Completo"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  required
                />
                
                <input
                  type="text"
                  placeholder="🏷️ Username"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  required
                />
                
                <input
                  type="email"
                  placeholder="📧 Email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  required
                />
                
                <input
                  type="password"
                  placeholder="🔒 Password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  required
                />
                
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                >
                  <option value="user">👤 Utente</option>
                  <option value="admin">👑 Admin</option>
                  <option value="moderator">🛡️ Moderatore</option>
                </select>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg font-bold hover:bg-purple-600 transition-colors disabled:bg-gray-600 text-sm"
                >
                  {loading ? 'Caricamento...' : '➕ Crea Utente'}
                </button>
              </form>
            </div>
            
            {/* Lista utenti */}
            <div className="space-y-2">
              <h4 className="text-white font-bold">👥 Lista Utenti</h4>
              {allUsers.length === 0 ? (
                <div className="text-gray-400 text-center py-4 text-sm">
                  Nessun utente trovato
                </div>
              ) : (
                allUsers.map((user) => (
                  <div key={user.id} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">{user.name}</div>
                        <div className="text-xs text-gray-400">@{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.role === 'admin' ? '👑' : user.role === 'moderator' ? '🛡️' : '👤'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal condivisione social */}
      {showShareModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">📤 Condividi Post</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-300 mb-2">
                <strong>{selectedPost.name}</strong> ha scritto:
              </div>
              <div className="text-gray-100">
                {selectedPost.content || 'Post con media'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareToSocial('facebook', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📘</span>
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => shareToSocial('twitter', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-blue-400 text-white py-3 px-4 rounded-lg hover:bg-blue-500 transition-colors"
              >
                <span>🐦</span>
                <span>Twitter</span>
              </button>
              
              <button
                onClick={() => shareToSocial('whatsapp', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => shareToSocial('telegram', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span>✈️</span>
                <span>Telegram</span>
              </button>
              
              <button
                onClick={() => shareToSocial('linkedin', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-blue-700 text-white py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span>💼</span>
                <span>LinkedIn</span>
              </button>
              
              <button
                onClick={() => shareToSocial('instagram', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <span>📷</span>
                <span>Instagram</span>
              </button>
              
              <button
                onClick={() => shareToSocial('tiktok', selectedPost)}
                className="flex items-center justify-center space-x-2 bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span>🎵</span>
                <span>TikTok</span>
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${selectedPost.content || 'Guarda questo post su Connect!'}\n\n${window.location.origin}`
                    );
                    alert('✅ Link copiato negli appunti!');
                    setShowShareModal(false);
                  } catch (error) {
                    alert('❌ Errore nella copia del link');
                  }
                }}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>📋</span>
                <span>Copia Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugConnect;
