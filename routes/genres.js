import { Router } from 'express';
import { getAllGenreTitles } from '../controllers/genre-controller';

const router = Router();

/*
  Lists all of the genres available to be used.

  No checks for authentication.
*/
router.get('/list', async (req, res, next) => {
  let genreTitles;
  try {
    genreTitles = await getAllGenreTitles();
    res.status(200).json({ success: true, genres: genreTitles });
  } catch (err) {
    console.log('Error has occured while fetching genres: ');
    console.log(err);
    res.status(400).json({ success: false });
  }
});

export default router;
