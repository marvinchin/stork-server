/*
  This middleware is designed to catch all traffic directed to /admin 
  and makes sure that only those authorized can have access to the admin panel.

  It assumes that the authenticator middleware has already checked for authentication,
  so make sure this is only used AFTER authenticator.js
*/
const assertAdmin = async (req, res, next) => {
  if (!req.authenticated) return res.render('admin/login');

  // TODO: Fix this hardcoding of username.
  if (req.session.auth.username !== 'yj123' &&
     req.session.auth.username !== 'yj234') return res.status(403).render();

  return next();
};

export default assertAdmin;
