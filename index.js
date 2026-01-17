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

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Usuario ya existe o datos inválidos' });
  }
});

app.listen(process.env.PORT || 3000);
