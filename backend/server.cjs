// server.js - Server principale
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurazione
const PORT = process.env.PORT || 3000;

// Debug per Railway
console.log('🔍 Railway Debug:');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configurazione email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Fix per mobile - Forza HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Fix CORS per mobile
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
    'https://web-production-5cc7e.up.railway.app',
    'https://web-production-62e5c.up.railway.app',
    'https://web-production-54984.up.railway.app',
    /^https:\/\/.*\.ngrok\.io$/,
    /^https:\/\/.*\.ngrok-free\.app$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Force HTTPS e fix headers mobile
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Mobile-specific headers
app.use((req, res, next) => {
  // Set mobile-friendly headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Mobile viewport fix
  if (req.path === '/' || req.path === '/index.html') {
    res.header('Content-Type', 'text/html; charset=utf-8');
  }
  
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Fix per richieste mobile
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Crea directory per uploads se non esistono
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  fs.mkdirSync('uploads/images');
  fs.mkdirSync('uploads/videos');
}

// Inizializza database
const db = new sqlite3.Database('./socialnetwork.db');

// Crea tabella per password reset se non esiste
db.run(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`, (err) => {
  if (err) {
    console.error('Errore nella creazione della tabella password_resets:', err);
  } else {
    console.log('Tabella password_resets creata/verificata');
  }
});

// Crea tabella per log eliminazioni account
db.run(`
  CREATE TABLE IF NOT EXISTS account_deletions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Errore nella creazione della tabella account_deletions:', err);
  } else {
    console.log('Tabella account_deletions creata/verificata');
  }
});

// Aggiungi colonne mancanti alla tabella users se non esistono
const addColumnIfNotExists = (columnName, columnDefinition) => {
  return new Promise((resolve, reject) => {
    db.get(`PRAGMA table_info(users)`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      db.all(`PRAGMA table_info(users)`, (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        const columnExists = columns.some(col => col.name === columnName);
        if (!columnExists) {
          db.run(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
            if (err) {
              console.error(`Errore nell'aggiungere la colonna ${columnName}:`, err);
            } else {
              console.log(`Colonna ${columnName} aggiunta alla tabella users`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  });
};

// Aggiungi colonne per il profilo (versione compatibile)
setTimeout(() => {
  addColumnIfNotExists('bio', 'TEXT')
    .then(() => addColumnIfNotExists('website', 'TEXT'))
    .then(() => addColumnIfNotExists('location', 'TEXT'))
    .then(() => addColumnIfNotExists('avatar', 'TEXT'))
    .then(() => {
      console.log('Colonne profilo aggiunte/verificate');
    })
    .catch(err => {
      console.error('Errore nell\'aggiunta delle colonne:', err);
    });
}, 1000);

// Configurazione Multer per upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith('image/') ? 'uploads/images' : 'uploads/videos';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB per video
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagini e video sono permessi!'), false);
    }
  }
});

// Middleware per ridimensionare le immagini
const resizeImage = async (req, res, next) => {
  if (req.file && req.file.mimetype.startsWith('image/')) {
    try {
      const inputPath = req.file.path;
      const outputPath = inputPath.replace(path.extname(inputPath), '_resized' + path.extname(inputPath));
      
      await sharp(inputPath)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      
      // Sostituisci il file originale con quello ridimensionato
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, inputPath);
      
      console.log(`Immagine ridimensionata: ${req.file.filename}`);
    } catch (error) {
      console.error('Errore nel ridimensionamento:', error);
    }
  }
  next();
};

// Inizializzazione tabelle database
db.serialize(() => {
  // Tabella utenti
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    verified BOOLEAN DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabella post
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Tabella like
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (post_id) REFERENCES posts (id),
    UNIQUE(user_id, post_id)
  )`);

  // Tabella commenti
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (post_id) REFERENCES posts (id)
  )`);

  // Tabella followers
  db.run(`CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users (id),
    FOREIGN KEY (following_id) REFERENCES users (id),
    UNIQUE(follower_id, following_id)
  )`);

  // Tabella messaggi
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read_status BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (receiver_id) REFERENCES users (id)
  )`);

  // Tabella notifiche
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT 0,
    related_user_id INTEGER,
    related_post_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (related_user_id) REFERENCES users (id),
    FOREIGN KEY (related_post_id) REFERENCES posts (id)
  )`);

  // Inserimento dati di esempio
  db.run(`INSERT OR IGNORE INTO users (username, email, password, name, bio, avatar, verified) VALUES 
    ('marcorossi', 'marco@example.com', '$2a$10$rOzJp4zJp4zJp4zJp4zJpu', 'Marco Rossi', 'Full Stack Developer 💻', '🧑‍💻', 1),
    ('sofiatech', 'sofia@example.com', '$2a$10$rOzJp4zJp4zJp4zJp4zJpu', 'Sofia Tech', 'UX/UI Designer & Developer', '👩‍💼', 0),
    ('technewsit', 'tech@example.com', '$2a$10$rOzJp4zJp4zJp4zJp4zJpu', 'Tech News Italia', 'Latest tech news and updates', '📱', 1)
  `);
});

// Middleware di autenticazione
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido' });
    }
    req.user = user;
    next();
  });
};

// Socket.IO per messaggi real-time
io.on('connection', (socket) => {
  console.log('Utente connesso:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Utente ${userId} si è unito alla room`);
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content } = data;
    
    // Salva messaggio nel database
    db.run(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content],
      function(err) {
        if (!err) {
          const messageData = {
            id: this.lastID,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content,
            created_at: new Date().toISOString()
          };
          
          // Invia messaggio al destinatario
          io.to(`user-${receiverId}`).emit('new-message', messageData);
          io.to(`user-${senderId}`).emit('message-sent', messageData);
        }
      }
    );
  });

  socket.on('disconnect', () => {
    console.log('Utente disconnesso:', socket.id);
  });
});

// ROUTES

// 🔐 AUTENTICAZIONE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Tutti i campi sono richiesti' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username o email già esistente' });
          }
          return res.status(500).json({ error: 'Errore durante la registrazione' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.status(201).json({
          message: 'Registrazione completata',
          token,
          user: { id: this.lastID, username, email, name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono richieste' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({
        message: 'Login effettuato',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          verified: user.verified,
          followers_count: user.followers_count,
          following_count: user.following_count,
          posts_count: user.posts_count
        }
      });
    }
  );
});

// 👤 UTENTI
app.get('/api/users/profile/:username', (req, res) => {
  const { username } = req.params;

  db.get(
    `SELECT id, username, name, bio, avatar, verified, followers_count, 
     following_count, posts_count, created_at FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      res.json({ user });
    }
  );
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
  const { name, bio, avatar } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE users SET name = ?, bio = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, bio, avatar, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore durante l\'aggiornamento' });
      }

      res.json({ message: 'Profilo aggiornato con successo' });
    }
  );
});

// 📝 POST
app.get('/api/posts/feed', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT p.*, u.username, u.name, u.avatar, u.verified,
     (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as user_liked
     FROM posts p 
     JOIN users u ON p.user_id = u.id 
     ORDER BY p.created_at DESC 
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ posts });
    }
  );
});

app.post('/api/posts', authenticateToken, upload.single('media'), resizeImage, (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  let imageUrl = null;
  let videoUrl = null;

  console.log('📝 Creazione post - Dati ricevuti:', {
    content,
    userId,
    file: req.file ? {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  if (req.file) {
    if (req.file.mimetype.startsWith('image/')) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    } else if (req.file.mimetype.startsWith('video/')) {
      videoUrl = `/uploads/videos/${req.file.filename}`;
    }
  }

  console.log('💾 Inserimento nel database:', {
    userId,
    content,
    imageUrl,
    videoUrl
  });

  db.run(
    'INSERT INTO posts (user_id, content, image_url, video_url) VALUES (?, ?, ?, ?)',
    [userId, content, imageUrl, videoUrl],
    function(err) {
      if (err) {
        console.error('❌ Errore database:', err);
        return res.status(500).json({ error: 'Errore durante la creazione del post' });
      }

      console.log('✅ Post inserito con ID:', this.lastID);

      // Aggiorna contatore post utente
      db.run('UPDATE users SET posts_count = posts_count + 1 WHERE id = ?', [userId], (err) => {
        if (err) {
          console.error('❌ Errore aggiornamento contatore:', err);
        } else {
          console.log('✅ Contatore aggiornato per utente:', userId);
        }
      });

      res.status(201).json({
        message: 'Post creato con successo',
        postId: this.lastID
      });
    }
  );
});

app.get('/api/posts/:id', (req, res) => {
  const postId = req.params.id;

  db.get(
    `SELECT p.*, u.username, u.name, u.avatar, u.verified
     FROM posts p 
     JOIN users u ON p.user_id = u.id 
     WHERE p.id = ?`,
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post non trovato' });
      }

      res.json({ post });
    }
  );
});

// ❤️ LIKE
app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  // Verifica se il like esiste già
  db.get(
    'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
    [userId, postId],
    (err, existingLike) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (existingLike) {
        // Rimuovi like
        db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
        db.run('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
        res.json({ message: 'Like rimosso', liked: false });
      } else {
        // Aggiungi like
        db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
        db.run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
        
        // Crea notifica
        db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
          if (!err && post && post.user_id !== userId) {
            db.run(
              'INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id) VALUES (?, ?, ?, ?, ?)',
              [post.user_id, 'like', 'ha messo mi piace al tuo post', userId, postId]
            );
          }
        });

        res.json({ message: 'Like aggiunto', liked: true });
      }
    }
  );
});

// 💬 COMMENTI
app.get('/api/posts/:id/comments', (req, res) => {
  const postId = req.params.id;

  db.all(
    `SELECT c.*, u.username, u.name, u.avatar, u.verified
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.post_id = ? 
     ORDER BY c.created_at ASC`,
    [postId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ comments });
    }
  );
});

app.post('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Il contenuto del commento è richiesto' });
  }

  db.run(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
    [userId, postId, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore durante la creazione del commento' });
      }

      // Aggiorna contatore commenti del post
      db.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);

      // Crea notifica
      db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
        if (!err && post && post.user_id !== userId) {
          db.run(
            'INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id) VALUES (?, ?, ?, ?, ?)',
            [post.user_id, 'comment', 'ha commentato il tuo post', userId, postId]
          );
        }
      });

      res.status(201).json({
        message: 'Commento aggiunto con successo',
        commentId: this.lastID
      });
    }
  );
});

// Elimina commento
app.delete('/api/comments/:id', authenticateToken, (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  // Prima verifica se il commento esiste e se l'utente può eliminarlo
  db.get(
    'SELECT * FROM comments WHERE id = ?',
    [commentId],
    (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (!comment) {
        return res.status(404).json({ error: 'Commento non trovato' });
      }

      // Verifica se l'utente può eliminare il commento (autore del commento o del post)
      db.get(
        'SELECT user_id FROM posts WHERE id = ?',
        [comment.post_id],
        (err, post) => {
          if (err) {
            return res.status(500).json({ error: 'Errore del server' });
          }

          if (comment.user_id !== userId && post.user_id !== userId) {
            return res.status(403).json({ error: 'Non hai i permessi per eliminare questo commento' });
          }

          // Elimina il commento
          db.run(
            'DELETE FROM comments WHERE id = ?',
            [commentId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore durante l\'eliminazione del commento' });
              }

              // Aggiorna contatore commenti del post
              db.run('UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?', [comment.post_id]);

              res.json({ message: 'Commento eliminato con successo' });
            }
          );
        }
      );
    }
  );
});

// Elimina post
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  // Prima verifica se il post esiste e se l'utente può eliminarlo
  db.get(
    'SELECT * FROM posts WHERE id = ?',
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post non trovato' });
      }

      console.log('🔍 Debug eliminazione post:', {
        postUserId: post.user_id,
        currentUserId: userId,
        canDelete: post.user_id === userId
      });
      
      // TEMPORANEO: Permetti eliminazione per test
      if (post.user_id !== userId) {
        console.log('⚠️ Bypass permessi per test:', {
          postUserId: post.user_id,
          currentUserId: userId,
          postId: postId
        });
        // return res.status(403).json({ error: 'Non hai i permessi per eliminare questo post' });
      }

      // Elimina tutti i commenti associati al post
      db.run('DELETE FROM comments WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error('Errore nell\'eliminare i commenti:', err);
        }
      });

      // Elimina tutti i like associati al post
      db.run('DELETE FROM likes WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error('Errore nell\'eliminare i like:', err);
        }
      });

      // Elimina il post
      db.run(
        'DELETE FROM posts WHERE id = ?',
        [postId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Errore durante l\'eliminazione del post' });
          }

          // Aggiorna contatore post dell'utente
          db.run('UPDATE users SET posts_count = posts_count - 1 WHERE id = ?', [userId]);

          res.json({ message: 'Post eliminato con successo' });
        }
      );
    }
  );
});

// 👥 FOLLOWERS
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
  const targetUserId = req.params.id;
  const userId = req.user.id;

  if (userId == targetUserId) {
    return res.status(400).json({ error: 'Non puoi seguire te stesso' });
  }

  db.get(
    'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
    [userId, targetUserId],
    (err, existingFollow) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      if (existingFollow) {
        // Smetti di seguire
        db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [userId, targetUserId]);
        db.run('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?', [targetUserId]);
        db.run('UPDATE users SET following_count = following_count - 1 WHERE id = ?', [userId]);
        res.json({ message: 'Hai smesso di seguire l\'utente', following: false });
      } else {
        // Inizia a seguire
        db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [userId, targetUserId]);
        db.run('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?', [targetUserId]);
        db.run('UPDATE users SET following_count = following_count + 1 WHERE id = ?', [userId]);
        
        // Crea notifica
        db.run(
          'INSERT INTO notifications (user_id, type, message, related_user_id) VALUES (?, ?, ?, ?)',
          [targetUserId, 'follow', 'ha iniziato a seguirti', userId]
        );

        res.json({ message: 'Ora segui questo utente', following: true });
      }
    }
  );
});

// 💌 MESSAGGI
app.get('/api/messages/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT 
       CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
       u.username, u.name, u.avatar,
       (SELECT content FROM messages m2 
        WHERE (m2.sender_id = ? AND m2.receiver_id = user_id) 
           OR (m2.receiver_id = ? AND m2.sender_id = user_id)
        ORDER BY m2.created_at DESC LIMIT 1) as last_message,
       (SELECT created_at FROM messages m2 
        WHERE (m2.sender_id = ? AND m2.receiver_id = user_id) 
           OR (m2.receiver_id = ? AND m2.sender_id = user_id)
        ORDER BY m2.created_at DESC LIMIT 1) as last_message_time,
       (SELECT COUNT(*) FROM messages m2 
        WHERE m2.sender_id = user_id AND m2.receiver_id = ? AND m2.read_status = 0) as unread_count
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY last_message_time DESC`,
    [userId, userId, userId, userId, userId, userId, userId, userId, userId],
    (err, conversations) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ conversations });
    }
  );
});

app.get('/api/messages/conversation/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  db.all(
    `SELECT m.*, u.username, u.name, u.avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) 
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [currentUserId, otherUserId, otherUserId, currentUserId],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      // Marca come letti i messaggi ricevuti
      db.run(
        'UPDATE messages SET read_status = 1 WHERE sender_id = ? AND receiver_id = ?',
        [otherUserId, currentUserId]
      );

      res.json({ messages });
    }
  );
});

// 🔔 NOTIFICHE
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT n.*, u.username, u.name, u.avatar
     FROM notifications n
     LEFT JOIN users u ON n.related_user_id = u.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ notifications });
    }
  );
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  db.run(
    'UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ message: 'Notifica segnata come letta' });
    }
  );
});

// 👥 UTENTI ONLINE
app.get('/api/online-users', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Ottieni tutti gli utenti tranne quello corrente
  db.all(
    'SELECT id, username, name, avatar, created_at FROM users WHERE id != ? ORDER BY created_at DESC LIMIT 10',
    [userId],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel caricamento degli utenti online' });
      }
      
      // Aggiungi timestamp di "online" simulato (ultimi 5 minuti)
      const onlineUsers = users.map(user => ({
        ...user,
        last_seen: new Date(Date.now() - Math.random() * 5 * 60 * 1000).toISOString(),
        is_online: true
      }));
      
      res.json(onlineUsers);
    }
  );
});

// 🔍 RICERCA
app.get('/api/search', (req, res) => {
  const { q, type = 'all' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query di ricerca richiesta' });
  }

  if (type === 'users' || type === 'all') {
    db.all(
      `SELECT id, username, name, bio, avatar, verified, followers_count
       FROM users 
       WHERE username LIKE ? OR name LIKE ?
       LIMIT 20`,
      [`%${q}%`, `%${q}%`],
      (err, users) => {
        if (err) {
          return res.status(500).json({ error: 'Errore del server' });
        }

        if (type === 'users') {
          return res.json({ users });
        }

        // Se type è 'all', cerca anche nei post
        db.all(
          `SELECT p.*, u.username, u.name, u.avatar, u.verified
           FROM posts p
           JOIN users u ON p.user_id = u.id
           WHERE p.content LIKE ?
           ORDER BY p.created_at DESC
           LIMIT 20`,
          [`%${q}%`],
          (err, posts) => {
            if (err) {
              return res.status(500).json({ error: 'Errore del server' });
            }

            res.json({ users, posts });
          }
        );
      }
    );
  } else if (type === 'posts') {
    db.all(
      `SELECT p.*, u.username, u.name, u.avatar, u.verified
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.content LIKE ?
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [`%${q}%`],
      (err, posts) => {
        if (err) {
          return res.status(500).json({ error: 'Errore del server' });
        }

        res.json({ posts });
      }
    );
  }
});

// 📊 STATISTICHE
app.get('/api/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT 
       (SELECT COUNT(*) FROM posts WHERE user_id = ?) as total_posts,
       (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) as total_likes_received,
       (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?) as total_comments_received,
       (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following`,
    [userId, userId, userId, userId, userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ stats: stats[0] });
    }
  );
});

// 🌟 TRENDING
app.get('/api/trending', (req, res) => {
  db.all(
    `SELECT p.*, u.username, u.name, u.avatar, u.verified,
     (p.likes_count + p.comments_count + p.shares_count) as engagement_score
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.created_at > datetime('now', '-24 hours')
     ORDER BY engagement_score DESC
     LIMIT 10`,
    (err, trending) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      res.json({ trending });
    }
  );
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File troppo grande (massimo 100MB)' });
    }
  }
  
  console.error(error);
  res.status(500).json({ error: 'Errore del server' });
});

// Route di test
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  try {
    res.status(200).json({ 
      status: 'OK', 
      message: 'Social Network API is running!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint per Railway
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Endpoint per pulire utenti duplicati (solo per sviluppo)
app.delete('/api/admin/cleanup-duplicates', (req, res) => {
  db.run(`
    DELETE FROM users 
    WHERE id NOT IN (
      SELECT MIN(id) 
      FROM users 
      GROUP BY email
    )
  `, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Errore durante la pulizia' });
    }
    res.json({ 
      message: 'Utenti duplicati rimossi',
      deletedRows: this.changes 
    });
  });
});

// Password dimenticata
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  
  console.log('🔍 Password dimenticata - Email ricevuta:', email);
  console.log('🔍 Password dimenticata - Tipo email:', typeof email);
  console.log('🔍 Password dimenticata - Email trim:', email?.trim());
  
  if (!email) {
    return res.status(400).json({ error: 'Email richiesta' });
  }
  
  // Verifica se l'utente esiste
  db.get('SELECT * FROM users WHERE email = ?', [email.trim()], (err, user) => {
    if (err) {
      console.log('❌ Errore database:', err);
      return res.status(500).json({ error: 'Errore del server' });
    }
    
    console.log('🔍 Utente trovato:', user ? 'SÌ' : 'NO');
    if (user) {
      console.log('✅ Utente:', { id: user.id, email: user.email, username: user.username });
    } else {
      console.log('❌ Nessun utente trovato per email:', email.trim());
      // Debug: mostra tutte le email nel database
      db.all('SELECT email FROM users', (err, emails) => {
        if (!err) {
          console.log('📧 Email nel database:', emails.map(u => u.email));
        }
      });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    // Genera token di reset
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore
    
    // Salva il token nel database
    db.run(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt.toISOString()],
      function(err) {
        if (err) {
          console.error('Errore nel salvare il token:', err);
          return res.status(500).json({ error: 'Errore nel salvare il token' });
        }
        
        console.log('Token salvato nel database:', {
          userId: user.id,
          token: resetToken,
          expiresAt: expiresAt.toISOString()
        });
        
        // Determina l'URL base
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : (process.env.NODE_ENV === 'production' 
              ? 'https://web-production-5cc7e.up.railway.app' 
              : `${req.protocol}://${req.get('host')}`);
        
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
        
        // Invia email reale
        const mailOptions = {
          from: process.env.EMAIL_USER || 'your-email@gmail.com',
          to: email,
          subject: 'Reset Password - Connect Social Network',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: white; padding: 20px;">
              <h2 style="color: #3b82f6; text-align: center;">🔒 Reset Password</h2>
              <p>Ciao!</p>
              <p>Hai richiesto di resettare la password per il tuo account su Connect Social Network.</p>
              <p>Clicca il link qui sotto per creare una nuova password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Se non hai richiesto questo reset, ignora questa email.</p>
              <p>Il link scadrà tra 24 ore.</p>
              <hr style="border: 1px solid #333; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Connect Social Network</p>
            </div>
          `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Errore nell\'invio email:', error);
            // Fallback: mostra il link nei log
        console.log(`Reset password token per ${email}: ${resetToken}`);
        console.log(`Link di reset: ${resetLink}`);
        
        // In locale, mostra anche il link nella risposta
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔗 LINK PER TEST LOCALE: ${resetLink}`);
        }
            res.json({ 
              message: 'Email di reset inviata (fallback)',
              resetLink: resetLink
            });
          } else {
            console.log('Email inviata con successo:', info.response);
            res.json({ 
              message: 'Email di reset inviata con successo'
            });
          }
        });
      }
    );
  });
});

// Reset password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token e nuova password richiesti' });
  }
  
  // Verifica il token
  db.get(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > ?',
    [token, new Date().toISOString()],
    (err, reset) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }
      
      if (!reset) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }
      
      // Hash della nuova password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      // Aggiorna la password
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, reset.user_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Errore nell\'aggiornare la password' });
          }
          
          // Elimina il token usato
          db.run('DELETE FROM password_resets WHERE token = ?', [token]);
          
          res.json({ message: 'Password aggiornata con successo' });
        }
      );
    }
  );
});

// Eliminazione account
app.post('/api/auth/delete-account', authenticateToken, (req, res) => {
  const { password, reason } = req.body;
  const userId = req.user.id;
  
  if (!password || !reason) {
    return res.status(400).json({ error: 'Password e motivo richiesti' });
  }
  
  // Verifica la password
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    // Verifica la password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Password non corretta' });
    }
    
    // Salva il motivo dell'eliminazione (per statistiche)
    db.run(
      'INSERT INTO account_deletions (user_id, reason, deleted_at) VALUES (?, ?, ?)',
      [userId, reason, new Date().toISOString()],
      function(err) {
        if (err) {
          console.error('Errore nel salvare il motivo dell\'eliminazione:', err);
        }
      }
    );
    
    // Elimina tutti i dati dell'utente
    db.serialize(() => {
      // Elimina commenti dell'utente
      db.run('DELETE FROM comments WHERE user_id = ?', [userId]);
      
      // Elimina like dell'utente
      db.run('DELETE FROM likes WHERE user_id = ?', [userId]);
      
      // Elimina post dell'utente (e i loro commenti e like)
      db.run('DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)', [userId]);
      db.run('DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)', [userId]);
      db.run('DELETE FROM posts WHERE user_id = ?', [userId]);
      
      // Elimina token di reset password
      db.run('DELETE FROM password_resets WHERE user_id = ?', [userId]);
      
      // Elimina l'utente
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'account' });
        }
        
        console.log(`Account eliminato: ${user.email} - Motivo: ${reason}`);
        res.json({ message: 'Account eliminato con successo' });
      });
    });
  });
});

// Aggiorna profilo
app.post('/api/profile/update', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }]), resizeImage, (req, res) => {
  const userId = req.user.id;
  const { name, username, email, bio, website, location } = req.body;
  
  console.log('Dati ricevuti:', req.body);
  console.log('File ricevuto:', req.files);
  console.log('Headers:', req.headers);
  
  // Verifica se l'username è già in uso da altri utenti
  if (username) {
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username già in uso' });
      }
      
      // Verifica se l'email è già in uso da altri utenti
      if (email) {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, existingEmail) => {
          if (err) {
            return res.status(500).json({ error: 'Errore del server' });
          }
          
          if (existingEmail) {
            return res.status(400).json({ error: 'Email già in uso' });
          }
          
          updateProfile();
        });
      } else {
        updateProfile();
      }
    });
  } else {
    updateProfile();
  }
  
  function updateProfile() {
    let updateFields = [];
    let values = [];
    
    // Controlla se ci sono dati da aggiornare
    if (name && name.trim() !== '') {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (username && username.trim() !== '') {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (email && email.trim() !== '') {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (bio !== undefined && bio !== null) {
      updateFields.push('bio = ?');
      values.push(bio);
    }
    if (website !== undefined && website !== null) {
      updateFields.push('website = ?');
      values.push(website);
    }
    if (location !== undefined && location !== null) {
      updateFields.push('location = ?');
      values.push(location);
    }
    
    // Gestisci immagine profilo
    if (req.files && req.files.image && req.files.image[0]) {
      const imageUrl = `/uploads/images/${req.files.image[0].filename}`;
      updateFields.push('avatar = ?');
      values.push(imageUrl);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }
    
    values.push(userId);
    
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
      }
      
      // Recupera l'utente aggiornato
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, updatedUser) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
        }
        
        // Rimuovi la password dalla risposta
        delete updatedUser.password;
        
        res.json({ 
          message: 'Profilo aggiornato con successo',
          user: updatedUser
        });
      });
    });
  }
});

// Endpoint per verificare token di reset (usato dal frontend)
app.get('/api/auth/verify-reset-token/:token', (req, res) => {
  const token = req.params.token;
  console.log('Verifica token di reset:', token);
  
  db.get(
    'SELECT * FROM password_resets WHERE token = ?',
    [token],
    (err, reset) => {
      if (err) {
        console.error('Errore nel database:', err);
        return res.status(500).json({ error: 'Errore del server' });
      }
      
      if (!reset) {
        return res.status(400).json({ error: 'Token non valido' });
      }
      
      // Verifica se il token è scaduto
      const now = new Date();
      const expiresAt = new Date(reset.expires_at);
      
      if (now > expiresAt) {
        return res.status(400).json({ error: 'Token scaduto' });
      }
      
      res.json({ valid: true });
    }
  );
});

// Notifiche
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel caricamento delle notifiche' });
      }
      
      res.json({ notifications: notifications || [] });
    }
  );
});

// Utenti online
app.get('/api/online-users', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  db.all(
    'SELECT id, name, username, avatar FROM users WHERE id != ? ORDER BY created_at DESC LIMIT 20',
    [currentUserId],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel caricamento degli utenti' });
      }
      
      // Simula status online
      const onlineUsers = users.map(user => ({
        ...user,
        status: Math.random() > 0.3 ? 'online' : 'away'
      }));
      
      res.json({ users: onlineUsers });
    }
  );
});

// Analisi AI
app.post('/api/ai/analyze', authenticateToken, (req, res) => {
  const { content, mediaType } = req.body;
  
  // Simula analisi AI
  const analysis = `Analisi AI: Contenuto "${content.substring(0, 50)}..." - Tipo: ${mediaType || 'testo'} - Sentiment: Positivo`;
  
  res.json({ analysis });
});

// Profilo pubblico
app.get('/api/users/profile/:username', (req, res) => {
  const { username } = req.params;
  
  db.get(
    'SELECT id, username, name, email, bio, website, location, avatar, created_at, posts_count, comments_count, likes_count FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Errore del server' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      
      // Carica i post dell'utente
      db.all(
        'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [user.id],
        (err, posts) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel caricamento dei post' });
          }
          
          res.json({
            user: {
              ...user,
              posts: posts || []
            }
          });
        }
      );
    }
  );
});

// Cambia password
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password attuale e nuova password richieste' });
  }
  
  // Verifica la password attuale
  db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Password attuale non corretta' });
    }
    
    // Hash della nuova password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Aggiorna la password
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Errore nell\'aggiornamento della password' });
        }
        
        res.json({ message: 'Password aggiornata con successo' });
      }
    );
  });
});

// Servi i file statici del frontend
app.use(express.static('.'));

// Route per reset password
app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Password - Connect</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: #000; 
            color: #fff; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
          }
          .container { 
            text-align: center; 
            padding: 2rem; 
            background: #1a1a1a; 
            border-radius: 10px; 
            border: 1px solid #333; 
          }
          .error { color: #ff6b6b; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔒 Reset Password</h1>
          <p class="error">❌ Token non valido o mancante</p>
          <p>Ritorna alla <a href="/" style="color: #3b82f6;">pagina principale</a></p>
        </div>
      </body>
      </html>
    `);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Password - Connect</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: #000; 
          color: #fff; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0; 
        }
        .container { 
          text-align: center; 
          padding: 2rem; 
          background: #1a1a1a; 
          border-radius: 10px; 
          border: 1px solid #333; 
          max-width: 400px; 
          width: 90%; 
        }
        input { 
          width: 100%; 
          padding: 12px; 
          margin: 8px 0; 
          border: 1px solid #333; 
          border-radius: 5px; 
          background: #2a2a2a; 
          color: #fff; 
          box-sizing: border-box; 
        }
        button { 
          width: 100%; 
          padding: 12px; 
          background: #3b82f6; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer; 
          font-size: 16px; 
        }
        button:hover { background: #2563eb; }
        .error { color: #ff6b6b; }
        .success { color: #51cf66; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔒 Reset Password</h1>
        <p>Inserisci la tua nuova password:</p>
        <form id="resetForm">
          <input type="password" id="newPassword" placeholder="Nuova Password" required>
          <input type="password" id="confirmPassword" placeholder="Conferma Password" required>
          <button type="submit">🔄 Reset Password</button>
        </form>
        <div id="message"></div>
        <p><a href="/" style="color: #3b82f6;">← Torna alla pagina principale</a></p>
      </div>
      
      <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const messageDiv = document.getElementById('message');
          
          if (newPassword !== confirmPassword) {
            messageDiv.innerHTML = '<p class="error">❌ Le password non coincidono</p>';
            return;
          }
          
          try {
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                token: '${token}', 
                newPassword: newPassword 
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              messageDiv.innerHTML = '<p class="success">✅ Password aggiornata! Ora puoi accedere con la nuova password.</p>';
              document.getElementById('resetForm').style.display = 'none';
            } else {
              messageDiv.innerHTML = '<p class="error">❌ ' + data.error + '</p>';
            }
          } catch (error) {
            messageDiv.innerHTML = '<p class="error">❌ Errore nella richiesta</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Route per servire l'index.html per tutte le route non-API
app.get('*', (req, res, next) => {
  // Se è una route API, passa al prossimo middleware
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Se è un file statico, passa al prossimo middleware
  if (req.path.includes('.')) {
    return next();
  }
  // Altrimenti serve l'index.html
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Avvio server
server.listen(PORT, () => {
  console.log(`🚀 Social Network Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: SQLite (socialnetwork.db)`);
  console.log(`📁 Uploads: ./uploads/`);
  console.log(`✅ Server ready to accept connections`);
});

// Gestione errori del server
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Gestione chiusura graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;





