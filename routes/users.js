import { Router } from 'express';
import User from '../models/user';
import Book from '../models/book';

const router = Router();

/*
  Testing function that returns a JSON object
  containing username, email, and description.

  No checks for authentication yet.
*/
router.get('/:username', async (req, res, next) => {
  let user;
  try {
    user = await User.findOne({ username: req.params.username });
  } catch (err) {
    console.log('Error occurred while finding user: ');
    console.log(err);
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user == null) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // TODO: Ensure this works.
  let books;
  try {
    books = user.books.map(bookID => ({ title: bookID.title, author: bookID.author }));
  } catch (err) {
    console.log('Error occurred while mapping books: ');
    console.log(err);
    return res.status(404).json({ error: 'Error: Please try again' });
  }

  return res.status(200).json({
    username: user.username,
    email: user.email,
    gender: user.gender,
    books: await books,
  });
});

export default router;
