import { Router } from 'express';
import { TradeController, createTrade, getTradesInvolvingUser, updateTrade } from '../controllers/trade-controller';

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

router.post('/update', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.' });
  }
  return updateTrade(req, res);
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

router.get('/getByID/:id', async (req, res, next) => {
  const tradeController = new TradeController({ id: req.params.id });
  if (!await tradeController.checkThatTradeExists()) {
    return res.status(403).json({ success: false, error: 'Trade not found.'});
  }
  return res.status(200).json({ success: true, trade: await tradeController.getTradeInfo() });
});

export default router;
