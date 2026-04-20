import { Router } from 'express';
import { mockCRMContactsStore, mockCRMActivitiesStore } from '../db';

const router = Router();

router.get('/contacts', (_req, res) => res.json(mockCRMContactsStore));
router.get('/activities', (_req, res) => res.json(mockCRMActivitiesStore));

export default router;
