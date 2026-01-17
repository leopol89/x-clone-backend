import express from 'express';
import cors from 'cors';
import { pool } from './db.js'; // Importa la conexión a Neon al inicio

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint principal
app.get('/', (_, res) => {
  res.send('API X Clone funcionando 🔥');
});

// Registro de usuario
app.post('/users', async (req, res) => {
  const { username, email, password_hash } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, password_hash]
    );
    import bcrypt from 'bcrypt'; // si quieres encriptar passwords, opcional ahora

// Login de usuario
app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];

    // Opcional: si usas bcrypt para hash real
    // const match = await bcrypt.compare(password_hash, user.password_hash);
    // if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Por ahora, hacemos simple: comparamos texto directo
    if (user.password_hash !== password_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Login exitoso
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
    

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});
    // Crear tweet
app.post('/tweets', async (req, res) => {
  const { user_id, content } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING *`,
      [user_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear tweet' });
  }
});

// Listar tweets
app.get('/tweets', async (_, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.content, t.created_at, u.username 
       FROM tweets t 
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tweets' });
  }
});

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Usuario ya existe o datos inválidos' });
  }
});

app.listen(process.env.PORT || 3000);


add tweets endpoints
