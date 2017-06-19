import Book from '../models/book';
import { UserController } from './user-controller';
import { GenreController } from './genre-controller';
import { filterAsync, mapAsync } from '../helpers/async-helper';


export class BookController {

}

/*
  @param {request} req - The request object that contains body and headers. Request must contain:
    1) Title
    2) Author
    3) Genre (An array of strings)
    4) Additional description (optional)
  @param {response} res - The response object used to send response codes and data to client.

  User is already checked for authentication prior to the calling of this function.
  Checks to make sure header is 'content-type':'application/json'.
  Then ensures that the required fields are valid. Note that the date listed parameter is
  generated by the server based on the time of request received.
  After that create new book and save in database under the user. The user is obtained from the
  authenticated session parameter.

  @return {response} res - Sends response code 200 for success in creation of new book. Otherwise,
  sends 400 with a json body that specifies { error }.
*/
export const createBook = async (req, res) => {
  if (!req.body) return res.status(400).json({ success: false, error: 'Use JSON!' });

  if (!req.body.title || !req.body.author || !req.body.genre ||
  req.body.genre.constructor !== Array || req.body.genre.length < 1) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  req.checkBody('title', 'Title cannot be blank.').notEmpty();
  req.checkBody('author', 'Author cannot be blank.').notEmpty();

  const validationResult = await req.getValidationResult();
  if (!validationResult.isEmpty()) {
    return res.status(400).json({ success: false, error: validationResult.array()[0].msg });
  }

  // Check that genres are valid.
  const filteredGenres = await filterAsync(req.body.genre, (title, callback) => {
    const genreController = new GenreController({ title });
    genreController.checkThatGenreExists().then(genreExists => callback(null, genreExists));
  });

  if (filteredGenres.length !== req.body.genre.length) {
    return res.status(400).json({ success: false, error: 'Invalid genres.' });
  }

  // Now create a mapped version of the array of genres containing the object ID.
  const mappedGenres = await mapAsync(req.body.genre, (title, callback) => {
    const genreController = new GenreController({ title });
    genreController.checkThatGenreExists().then(() => callback(null, genreController.genre.id));
  });

  const callingUser = new UserController({ username: req.session.auth.username });
  const userExists = await callingUser.checkThatUserExists();
  if (!userExists) return res.status(400).json({ success: false, error: 'User doesnt exist.' });

  const newBook = new Book();
  newBook.title = req.body.title;
  newBook.author = req.body.author;
  newBook.dateListed = new Date();
  newBook.owner = callingUser.user.id;
  newBook.genre = mappedGenres;
  newBook.additionalDescription = req.body.additionalDescription || '';
  return newBook.save(async (err, book) => {
    if (err) return res.status(400).json({ success: false, error: 'Error saving book.' });
    try {
      await callingUser.addBook(book.id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.log('An error has occured while adding book to user: ');
      console.log(err);
      return res.status(400).json({ success: false, error: 'Error saving book.' });
    }
  });
};
