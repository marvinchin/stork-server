import { Router } from 'express';
import { createTrade, getTradesInvolvingUser } from '../controllers/trade-controller';

const router = Router();

/*
  Creates a new trade between the lister and offerer.

  Authentication required.
*/
router.post('/create', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.' });
  }
  return createTrade(req, res);
});

/* 
   Returns a list of trades that the user is involved in.

   Authentication required.
*/
router.get('/list' , (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.'});
  }
  return getTradesInvolvingUser(req, res);
});

export default router;
