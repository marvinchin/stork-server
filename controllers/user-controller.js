import User from '../models/user';
import Book from '../models/book';
import { generateHash, compareHash } from '../helpers/crypto';

export class UserController {
  constructor(options) {
    if (options.username) {
      // This one is a promise.
      this.user = UserController.findUserByUsername(options.username);
    }
  }

  async checkThatUserExists() {
    try {
      this.user = await this.user;
    } catch (err) {
      console.log('Error occured while finding user.');
      console.log(err);
      return false;
    }
    return this.user != null;
  }

  /*
    Called by user router's GET request.

    @return {Object} obj - Either null for failed query, or a JSON object
    containing information about the user.
  */
  async getUserInfo() {
    if (!await this.checkThatUserExists()) return null;

    return {
      username: this.user.username,
      email: this.user.email,
      gender: this.user.gender,
      description: this.user.description,
      profilePicture: `/profile-pictures/${this.user.profilePicture ? this.user.username : '_default'}.jpg`,
      books: this.user.books.map(book => ({ title: book.title, author: book.author })),
    };
  }

  static findUserByUsername(username) {
    return new Promise((resolve, reject) => {
      User.findOne({ username }).populate('books').exec((err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });
  }

  /*
    @param {String} password - The password whose hash will be computed for the comparison.
    @return {Boolean} - Whether the password hashes match.

    Used primarily by the loginUser function, it does not await the completion of the finding
    of user by ID because that has already been done in the calling function prior to calling
    this method.
  */
  async hashesMatch(password) {
    let matchResult = false;
    try {
      matchResult = await compareHash(password, this.user.hashedPassword);
    } catch (err) {
      console.log('An error has occured while comparing hashes:');
      console.log(err);
    }
    return matchResult;
  }

  /*
    @param {String/Integer} expirySeconds - The amount of time this token is effective for.
    @param {String} sessionID - The sessionID that will be saved as the token.

    Used primarily by the loginUser function to add a new token to the user. It first removes
    expired and conflicting tokens, then adds a new one with the corresponding expiry date and
    saves it into the database.
  */
  addAuthorizationToken(expirySeconds, sessionID) {
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + parseInt(expirySeconds, 10));

    const validTokens = this.user.authorizedTokens.filter(token =>
      token.expiry.value > Date.now() && token.id !== sessionID);
    validTokens.push({ id: sessionID, expiry: expiryDate });

    this.user.update({ authorizedTokens: validTokens }, (err, res) => {
      if (err) console.log(err);
    });
  }
}

/*
  @param {request} req - The request object that contains body and headers. Request must contain:
    1) Username
    2) Email
    3) Gender
    4) Password
    5) Description
  @param {response} res - The response object used to send response codes and data to client.

  Checks to make sure header is 'content-type':'application/json'.
  Then ensures that the required fields are valid before checking database for conflicting
  username/email.
  After that create new user and save in database. The user is NOT logged from this action.

  @return {response} res - Sends response code 200 for success in creation of new user. Otherwise,
  sends 400 with a json body that specifies { error }.
*/
export const createUser = async (req, res) => {
  // Check that there is a body
  if (!req.body) {
    return res.status(400).json({ success: false, error: 'Use JSON!' });
  }

  // Check that the parameters are correct
  req.checkBody('email', 'Invalid email address.').isEmail();
  req.checkBody('email', 'Email must be lowercase.').isLowercase();
  req.checkBody('username', 'Username must be alphanumeric.').isAlphanumeric();
  req.checkBody('username', 'Username must be between 4 and 20 characters long').len(4, 20);
  req.checkBody('username', 'Username must be lowercase.').isLowercase();
  req.checkBody('password', 'Password cannot contain spaces.').noSpaces();
  req.checkBody('password', 'Password must be between 6 and 24 characters long.').len(6, 20);
  req.checkBody('gender', 'Invalid gender.').validGender();
  req.checkBody('description', 'Description must not contain more than 100 characters.').len(0, 100);
  req.checkBody('email', 'Email cannot be blank.').notEmpty();

  const result = await req.getValidationResult();

  if (!result.isEmpty()) {
    return res.status(400).json({ success: false, error: result.array()[0].msg });
  }

  const conflictingUser = await User.findOne({
    $or: [{ email: req.body.email }, { username: req.body.username }],
  });

  if (conflictingUser !== null) {
    if (conflictingUser.email === req.body.email) {
      return res.status(400).json({ success: false, error: 'Email already taken.' });
    } else if (conflictingUser.username === req.body.username) {
      return res.status(400).json({ success: false, error: 'Username already taken.' });
    }
  }

  let hashedPassword;
  try {
    hashedPassword = generateHash(req.body.password);
  } catch (err) {
    console.log('An error has occured when generating hash for password: ');
    console.log(err);
    return res.status(400).json({ success: false, error: 'Error: Please try again.' });
  }

  const newUser = new User();
  newUser.username = req.body.username;
  newUser.gender = req.body.gender;
  newUser.email = req.body.email;
  newUser.description = req.body.description;
  newUser.authorizedTokens = [];
  newUser.books = [];
  newUser.hashedPassword = await hashedPassword;

  return newUser.save((err) => {
    if (err) {
      console.log('An error has occured when saving new user: ');
      console.log(err);
      return res.status(400).json({ success: false, error: 'Error: Please try again.' });
    }
    return res.status(200).json({ success: true });
  });
};

/*
  @param {request} req - The request object that contains body and headers. Request must contain:
    1) Username
    2) Password
    3) Expiry (The amount of seconds before the login token becomes expired).
  @param {response} res - The response object used to send response codes and data to client.

  Checks to make sure header is 'content-type':'application/json'.
  Checks that username and password field exist before finding database for the user.
  Then compares password hashes and sets the authentication token if correct.

  At present, authentication token uses sessionID.
*/
export const loginUser = async (req, res) => {
  if (!req.body) return res.status(400).json({ success: false, error: 'Use JSON!' });

  if (!req.body.username || !req.body.password ||
    !Number.isInteger(req.body.expiry) || !req.body.expiry > 0) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  const matchingUserController = new UserController({ username: req.body.username });

  // Makes sure the user search is complete.
  const userExists = await matchingUserController.checkThatUserExists();
  if (!userExists) return res.status(400).json({ success: false, error: 'Invalid credentials.' });

  const hashesMatch = await matchingUserController.hashesMatch(req.body.password);
  if (!hashesMatch) return res.status(400).json({ success: false, error: 'Invalid credentials.' });

  matchingUserController.addAuthorizationToken(req.body.expiry, req.session.id);

  // Auth stores only the username for easy searching. Authentication is done through sessionID.
  req.session.auth = { username: req.body.username };

  return res.status(200).json({ success: true, user: await matchingUserController.getUserInfo() });
};
