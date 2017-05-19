import { Router } from 'express';
import { createUser } from '../controllers/user-controller';

const router = Router();

router.post('/create', (req, res, next) => {
  createUser(req, res);
});

export default router;
