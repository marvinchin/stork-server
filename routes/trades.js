import { Router } from 'express';
import { createTrade } from '../controllers/trade-controller';

const router = Router();

/*
  Creates a new trade between the lister and offerer.

  Authentication required.
*/
router.post('/create', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.' });
  }
  createTrade(req, res);
});

export default router;
