import fs from 'fs';
import path from 'path';

export const saveProfilePicture = (username, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(__dirname, `../public/profile-pictures/${username}.jpg`), data, 'base64', (err) => {
      if (err) {
        reject();
      }
      resolve();
    });
  });
  
};

