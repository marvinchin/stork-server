import { Router } from 'express';
import { loginUser } from '../controllers/user-controller';
import { createBook, BookController } from '../controllers/book-controller';
import { getAllGenreTitles, addGenre } from '../controllers/genre-controller';
import { createTrade } from '../controllers/trade-controller';
import Book from '../models/book';
import { mapAsync, filterAsync } from '../helpers/async-helper';

const router = Router();


router.get('/', (req, res, next) => res.render('admin/home'));
router.get('/tests', (req, res, next) => res.render('admin/tests'));
router.get('/tests/createBook', (req, res, next) => res.render('admin/createBook'));
router.get('/tests/createTrade', (req, res, next) => {
  // Holds all books and owned books.
  const bookObjectPromise = new Promise((resolve, reject) => {
    Book.find({}, async (err, books) => {
      if (err) return reject(err);
      const mappedBooks = await mapAsync(books, (book, callback) => {
        // Using ID to force owner to be populated. Yes it's dirty.
        const bookController = new BookController({ id: book.id });
        return bookController.checkThatBookExists().then((bookExists) => {
          if (!bookExists) return reject('book does not exist');
          return callback(null, {
            username: bookController.book.owner.username,
            id: book.id,
            title: book.title,
          });
        });
      });
      const filteredBooks = await filterAsync(mappedBooks, (book, callback) => {
        callback(null, book.username === req.session.auth.username);
      });
      return resolve({ all: mappedBooks, owned: filteredBooks });
    });
  });
  bookObjectPromise.then(bookObject =>
    res.render('admin/createTrade', { all: bookObject.all, owned: bookObject.owned }))
  .catch(err => {
    console.log(err);
    return res.status(500).render();
  });
});

router.get('/genres', async (req, res, next) => {
  let genreTitles;
  try {
    genreTitles = await getAllGenreTitles();
    res.render('admin/genreEdit', { genres: genreTitles, message: req.query.message });
  } catch (err) {
    console.log('Error has occured while fetching genres: ');
    console.log(err);
    res.status(500).render();
  }
});

router.post('/login', (req, res, next) => {
  req.body.expiry = 3600;
  loginUser(req, res);
});

router.post('/addGenre', (req, res, next) => {
  addGenre(req, res);
});

router.post('/tests/createBook', (req, res, next) => {
  createBook(req, res);
});

router.post('/tests/createTrade', (req, res, next) => {
  createTrade(req, res);
});

export default router;
