import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { createBook } from '../controllers/book-controller';

const router = Router();

/*
  Returns a JSON object containing username, email, books, gender and description.

  No checks for authentication.
*/
router.get('/:username', async (req, res, next) => {
  const user = new UserController({ username: req.params.username });

  const result = await user.getUserInfo();
  if (!result) {
    return res.status(404).json({ success: false, error: 'Unable to find user.' });
  }

  result.success = true;
  return res.status(200).json(result);
});

/*
  Creates a book under the user. 

  Requires authentication.
*/
router.post('/createBook', async (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.' });
  }
  return createBook(req, res);
});

export default router;
