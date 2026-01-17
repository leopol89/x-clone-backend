import express from 'express';
import cors from 'cors';
import { pool } from './db.js'; // Asegúrate que db.js exporta el pool correctamente

// Opcional: si vas a usar bcrypt para hashear passwords (recomendado)
// import bcrypt from 'bcrypt';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (_, res) => {
  res.send('API X Clone funcionando 🔥');
});

// Registro de usuario
app.post('/users', async (req, res) => {
  const { username, email, password_hash } = req.body;

  if (!username || !email || !password_hash) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    // Posible error: unique violation si username/email ya existe
    res.status(400).json({ error: 'Usuario ya existe o datos inválidos' });
  }
});

// Login de usuario
app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  if (!email || !password_hash) {
    return res.status(400).json({ error: 'Faltan email o contraseña' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];

    // Versión simple (texto plano) - ¡NO recomendado en producción!
    if (user.password_hash !== password_hash) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Si implementas bcrypt más adelante:
    // const match = await bcrypt.compare(password, user.password_hash);
    // if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear tweet
app.post('/tweets', async (req, res) => {
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ error: 'Faltan user_id o content' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING *`,
      [user_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al crear tweet:', error);
    res.status(500).json({ error: 'Error al crear tweet' });
  }
});

// Listar tweets (con username del autor)
app.get('/tweets', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.id, t.content, t.created_at, u.username 
      FROM tweets t 
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tweets:', error);
    res.status(500).json({ error: 'Error al obtener tweets' });
  }
});

// Dar like a un tweet
app.post('/likes', async (req, res) => {
  const { user_id, tweet_id } = req.body;

  if (!user_id || !tweet_id) {
    return res.status(400).json({ error: 'Faltan user_id o tweet_id' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO likes (user_id, tweet_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, tweet_id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(400).json({ error: 'Like ya existe o error' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
