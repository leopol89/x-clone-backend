import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   ENDPOINT DE PRUEBA
========================= */
app.get('/', (_, res) => {
  res.send('API X Clone funcionando 🔥');
});

/* =========================
   USUARIOS
========================= */

// Registro
app.post('/users', async (req, res) => {
  const { username, email, password_hash } = req.body;

  if (!username || !email || !password_hash) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'Usuario ya existe' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash
       FROM users WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (rows[0].password_hash !== password_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({
      id: rows[0].id,
      username: rows[0].username,
      email: rows[0].email
    });
  } catch (e) {
    res.status(500).json({ error: 'Error en login' });
  }
});

/* =========================
   TWEETS
========================= */

// Crear tweet
app.post('/tweets', async (req, res) => {
  const { user_id, content } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO tweets (user_id, content)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear tweet' });
  }
});

app.post('/comments', async (req, res) => {
  const { tweet_id, user_id, content } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO comments (tweet_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tweet_id, user_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al comentar' });
  }
});

app.get('/comments/:tweet_id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.content, c.created_at, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.tweet_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.tweet_id]);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Listar tweets (timeline)
app.get('/tweets', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.id, t.content, t.created_at, u.username
      FROM tweets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener tweets' });
  }
});

/* =========================
   LIKES
========================= */

// Dar like
app.post('/likes', async (req, res) => {
  const { user_id, tweet_id } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO likes (user_id, tweet_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, tweet_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'Like ya existe' });
  }
});

// Contar likes
app.get('/likes/:tweet_id', async (req, res) => {
  const { tweet_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM likes WHERE tweet_id = $1`,
      [tweet_id]
    );
    res.json({ likes: Number(rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: 'Error al contar likes' });
  }
});

/* =========================
   FOLLOWERS
========================= */

// Seguir usuario
app.post('/followers', async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO followers (follower_id, following_id)
       VALUES ($1, $2)
       RETURNING *`,
      [follower_id, following_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'Ya sigues a este usuario' });
  }
});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
