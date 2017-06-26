import { Router } from 'express';
import { getRecentBooks } from '../controllers/book-controller';
import { createBook } from '../controllers/book-controller';

const router = Router();

/*
  Returns a JSON object containing the most recent n books.

  No authorization required.
*/
router.get('/list/:n', async (req, res, next) => {
  const n = parseInt(req.params.n, 10);
  if (!Number.isInteger(n)) {
    return res.status(400).json({ success: false, error: 'Provide an integer!' });
  }

  if (n < 1) return res.status(400).json({ success: false, error: 'n must be greater than 0.' });

  let books;
  try {
    books = await getRecentBooks(0, n - 1);
  } catch (err) {
    return res.status(400).json({ success: false, error: 'An error has occured.' });
  }
  return res.status(200).json({ success: true, books });
});


/*
  Creates a book under the user.

  Requires authentication.
*/
router.post('/create', (req, res, next) => {
  if (!req.authenticated) {
    return res.status(403).json({ success: false, error: 'Authentication required.' });
  }
  return createBook(req, res);
});

export default router;
