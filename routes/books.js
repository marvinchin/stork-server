import { Router } from 'express';
import { getRecentBooks, createBook, BookController } from '../controllers/book-controller';


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

/*
  Gets the information about the book by ID.

  No authentication required.
*/
router.get('/getByID/:id', async (req, res, next) => {
  const bookController = new BookController({ id: req.params.id });

  if (!await bookController.checkThatBookExists()) {
    return res.status(400).json({ success: false, error: 'Book not found.' });
  }

  const bookInfo = await bookController.getBookInfo({ ownerUsername: true });

  return res.status(200).json({ success: true, book: bookInfo });
});

export default router;
