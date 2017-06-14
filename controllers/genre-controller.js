import Genre from '../models/genre';

export class GenreController {
  constructor(options) {
    if (options.title) {
      this.genre = GenreController.findGenreByTitle(options.title);
    }
  }

/*
  @return Promise{Genre} - A promise to return a Genre object.
*/
  static findGenreByTitle(title) {
    return new Promise((resolve, reject) => {
      Genre.findOne({ title }, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  /*
    @return {Boolean} - Whether or not the genre exists.
  */
  async checkThatGenreExists() {
    try {
      this.genre = await this.genre;
      return this.genre != null;
    } catch (err) {
      console.log('An error has occured while finding genre: ');
      console.log(err);
      return false;
    }
  }
}

/*
  @return Promise{Array<String>} - The promise to return an array of genre titles currently stored.
*/
export const getAllGenreTitles = () => {
  return new Promise((resolve, reject) => {
    Genre.find(null, (err, genres) => {
      if (err) reject(err);
      const genreList = genres.map(genre => genre.title);
      resolve(genreList);
    });
  });
};

/*
  @param {request} req - The request object that contains the genre parameter.
  @param {response} res - The response object used to send response codes and data to client.

  Used solely by admin router to create new genre.
*/
export const addGenre = async (req, res) => {
  const backURL = '/admin/genres/';

  if (!req.body.genre) {
    return res.redirect(backURL + '?message=Invalid parameters.');
  }

  const genreController = new GenreController({ title: req.body.genre.toString() });
  const genreAlreadyExists = await genreController.checkThatGenreExists();
  if (genreAlreadyExists) {
    return res.redirect(backURL + '?message=Genre already exists.');
  }

  const newGenre = new Genre();
  newGenre.title = req.body.genre.toString();
  return newGenre.save((err) => {
    if (err) return res.redirect(backURL + '?message=An error has occured.');
    return res.redirect(backURL + '?message=Success!');
  });
};
