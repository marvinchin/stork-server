import { UserController } from '../controllers/user-controller';

const authenticator = async (req, res, next) => {
  if (req.session.auth && req.session.auth.username) {
    const userController = new UserController({ username: req.session.auth.username });
    req.authenticated = await userController.validateAuthorizationToken(req.session.id);
  } else {
    req.authenticated = false;
  }
  next();
};

export default authenticator;
