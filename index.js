import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.send('API X Clone funcionando 🔥');
});

app.listen(process.env.PORT || 3000);
