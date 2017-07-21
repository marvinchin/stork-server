import { Router } from 'express';

import { UserController, createUser, loginUser, logoutUser } from '../controllers/user-controller';

const router = Router();

router.post('/create', (req, res, next) => {
  createUser(req, res);
});

router.post('/login', (req, res, next) => {
  loginUser(req, res);
});


router.post('/logout', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(200).json({ success: false, error: 'You are not authenticated.' });
  }
  logoutUser(req, res);
});

/*
  Helps client check the status of authentication before performing
  authentication-required stuff.
*/
router.get('/status', async (req, res, next) => {
  if (!req.authenticated) {
    return res.status(200).json({ success: true, authenticated: false });
  }

  const user = new UserController({ username: req.session.auth.username });

  const result = await user.getUserInfo();
  if (!result) {
    return res.status(404).json({ success: true, authenticated: false });
  }

  return res.status(200).json({ success: true, authenticated: true, user: result });
});

export default router;
