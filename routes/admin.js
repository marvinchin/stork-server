import { Router } from 'express';
import { loginUser } from '../controllers/user-controller';
import { createBook } from '../controllers/book-controller';
import { getAllGenreTitles, addGenre } from '../controllers/genre-controller';

const router = Router();


router.get('/', (req, res, next) => res.render('admin/home'));
router.get('/tests', (req, res, next) => res.render('admin/tests'));
router.get('/tests/createBook', (req, res, next) => res.render('admin/createBook'));

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

export default router;
