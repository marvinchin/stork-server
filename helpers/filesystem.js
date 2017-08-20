import fs from "fs";
import path from "path";

export const saveProfilePicture = (username, data) => {
  return new Promise((resolve, reject) => {
    // Strip the data prefix
    const strippedData = data.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFile(
      path.resolve(__dirname, `../public/profile-pictures/${username}.jpg`),
      strippedData,
      "base64",
      err => {
        if (err) {
          reject();
        }
        resolve();
      }
    );
  });
};
