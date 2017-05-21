import User from '../models/user';
import { generateHash } from '../helpers/crypto';

/*
  @param {request} req - The request object that contains body and headers.
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
