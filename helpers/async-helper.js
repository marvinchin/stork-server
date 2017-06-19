import filter from 'async/filter';
import map from 'async/map';

export const filterAsync = (arr, truthTest) =>
  new Promise((resolve, reject) => {
    filter(arr, truthTest, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });

export const mapAsync = (arr, transform) =>
  new Promise((resolve, reject) => {
    map(arr, transform, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
