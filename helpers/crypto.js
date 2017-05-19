import bcrypt from 'bcrypt-nodejs';

export const generateHash = password => new Promise((resolve, reject) => {
  bcrypt.genSalt(8, (err, salt) => {
    if (err) {
      throw err;
    }
    bcrypt.hash(password, salt, null, (hashError, hash) => {
      if (hashError) {
        throw hashError;
      }
      resolve(hash);
    });
  });
});

