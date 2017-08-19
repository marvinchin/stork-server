import { Router } from 'express';
import { UserController, editUserProfile } from '../controllers/user-controller';

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

  return res.status(200).json({ success: true, user: result });
});

/*
  The endpoint to edit the user's profile information.

  Authentication needed.
*/
router.post('/edit', async (req, res, next) => {
  if (!req.authenticated) {
    return res.status(200).json({ success: false, error: 'Authentication required.' });
  }

  return editUserProfile(req, res);
});

export default router;
