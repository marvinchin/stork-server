import { Router } from 'express';
import { createUser, loginUser } from '../controllers/user-controller';

const router = Router();

router.post('/create', (req, res, next) => {
  createUser(req, res);
});

router.post('/login', (req, res, next) => {
  loginUser(req, res);
});

/*
  Helps client check the status of authentication before performing
  authentication-required stuff.
*/
router.get('/status', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(200).json({ success: true, authenticated: false });
  }
  return res.status(200).json({ success: true, authenticated: true });
});

export default router;
