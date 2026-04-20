import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads';
import sessionsRouter from './routes/sessions';
import mockCrmRouter from './routes/mockCrm';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dialer-backend-dusky.vercel.app/',  
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
}));
app.use(express.json());

app.get('/', (_req, res) => res.json({ message: 'Multi-Line Dialer API' }));
app.use('/leads', leadsRouter);
app.use('/sessions', sessionsRouter);
app.use('/mock-crm', mockCrmRouter);

// Add environment variable for CRM integration
const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:8000';

// Future: webhook endpoint to update CRM call_status
app.post('/webhooks/crm-sync', async (req, res) => {
  // This would call CRM to update lead.call_status
  // Implementation depends on CRM webhook support
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dialer API on :${PORT}`));
