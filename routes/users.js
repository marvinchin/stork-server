import { Router } from 'express';
import { UserController } from '../controllers/user-controller';

const router = Router();

/*
  Returns a JSON object containing username, email, books, gender and description.

  No checks for authentication.
*/
router.get('/:username', async (req, res, next) => {
  const user = new UserController({ username: req.params.username });

  let result = await user.getUserInfo();
  if (!result) {
    return res.status(404).json({ success: false, error: 'Unable to find user.' });
  }

  result.success = true;
  return res.status(200).json(result);
});

export default router;
