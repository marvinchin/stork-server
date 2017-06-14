const assertAdmin = async (req, res, next) => {
  if (!req.authenticated) return res.render('admin/login');

  // TODO: Fix this hardcoding of username.
  if (req.session.auth.username !== 'yj123') return res.status(403).render();

  return next();
};

export default assertAdmin;
