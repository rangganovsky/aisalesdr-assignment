import { Router } from 'express';
import { leadsStore, crmActivitiesStore } from '../db';

const router = Router();

// GET /leads
router.get('/', (_req, res) => {
  res.json(leadsStore);
});

// GET /leads/:id/crm-activities
router.get('/:id/crm-activities', (req, res) => {
  const lead = leadsStore.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const activities = crmActivitiesStore.filter((a) => a.leadId === req.params.id);
  res.json(activities);
});

export default router;
