import { Router } from 'express';
import { createUser, loginUser } from '../controllers/user-controller';

const router = Router();

router.post('/create', (req, res, next) => {
  createUser(req, res);
});

router.post('/login', (req, res, next) => {
  loginUser(req, res);
});

export default router;
