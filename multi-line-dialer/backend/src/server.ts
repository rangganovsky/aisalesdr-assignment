import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads';
import sessionsRouter from './routes/sessions';
import mockCrmRouter from './routes/mockCrm';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
}));
app.use(express.json());

app.get('/', (_req, res) => res.json({ message: 'Multi-Line Dialer API' }));
app.use('/leads', leadsRouter);
app.use('/sessions', sessionsRouter);
app.use('/mock-crm', mockCrmRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dialer API on :${PORT}`));
