import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'x_clone_secret_key';

/* =========================
   MIDDLEWARE AUTH
========================= */
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
};

/* =========================
   TEST
========================= */
app.get('/', (_, res) => {
  res.send('API X Clone funcionando 🔥');
});

/* =========================
   USERS
========================= */
app.post('/users', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, username, email`,
      [username, email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'Usuario ya existe' });
  }
});

/* =========================
   LOGIN (JWT)
========================= */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

/* =========================
   TWEETS
========================= */
app.post('/tweets', auth, async (req, res) => {
  const { content } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO tweets (user_id, content)
     VALUES ($1,$2)
     RETURNING *`,
    [req.user.id, content]
  );
  res.status(201).json(rows[0]);
});

app.get('/tweets', async (_, res) => {
  const { rows } = await pool.query(`
    SELECT t.id, t.content, t.created_at, u.username,
      (SELECT COUNT(*) FROM likes l WHERE l.tweet_id = t.id) AS likes
    FROM tweets t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `);
  res.json(rows);
});

/* =========================
   LIKES
========================= */
app.post('/likes', auth, async (req, res) => {
  const { tweet_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO likes (user_id, tweet_id)
       VALUES ($1,$2)`,
      [req.user.id, tweet_id]
    );
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Like ya existe' });
  }
});

/* =========================
   COMMENTS
========================= */
app.post('/comments', auth, async (req, res) => {
  const { tweet_id, content } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO comments (tweet_id, user_id, content)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [tweet_id, req.user.id, content]
  );
  res.status(201).json(rows[0]);
});

app.get('/comments/:tweet_id', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.id, c.content, c.created_at, u.username
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.tweet_id = $1
    ORDER BY c.created_at ASC
  `, [req.params.tweet_id]);

  res.json(rows);
});

/* =========================
   FOLLOWERS
========================= */
app.post('/follow', auth, async (req, res) => {
  const { user_to_follow } = req.body;

  try {
    await pool.query(
      `INSERT INTO followers (follower_id, following_id)
       VALUES ($1,$2)`,
      [req.user.id, user_to_follow]
    );
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Ya sigues a este usuario' });
  }
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor X Clone activo 🚀');
});
