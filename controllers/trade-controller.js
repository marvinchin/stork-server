import Trade from '../models/trade';
import { BookController } from './book-controller';
import { UserController } from './user-controller';
import { filterAsync, mapAsync } from '../helpers/async-helper';

export class TradeController {
  // Population is done by the controller, no need to populate yourself beforehand.
  constructor(options) {
    if (options.trade) {
      this.trade = options.trade;
    }
  }

  async checkThatTradeExists() {
    try {
      this.trade = await this.trade;
    } catch (err) {
      console.log('Error occured while finding trade.');
      console.log(err);
      return false;
    }
    return this.trade != null;
  }

  async getTradeInfo() {
    if (!await this.checkThatTradeExists()) return null;

    await this.populateEverything();

    const toBeReturned = {
      id: this.trade.id,
      listUser: this.listUserObject || this.trade.listUser,
      offerUser: this.offerUserObject || this.trade.offerUser,
      listBook: this.listBookObject || this.trade.listBook,
      offerBooks: this.offerBooksObject || this.trade.offerBooks,
      description: this.trade.description,
      tradeStatus: this.trade.tradeStatus,
    };
    if (this.trade.selectedBook) {
      toBeReturned.selectedBook = this.selectedBookObject || this.trade.selectedBook;
    }
    return toBeReturned;
  }

  populateEverything() {
    return Promise.all([this.populateUsers(), this.populateBooks()]);
  }

  populateUsers() {
    const trade = this.trade;
    return new Promise((resolve, reject) => {
      if (trade.populated('listUser') !== undefined && trade.populated('offerUser') !== undefined) {
        return resolve();
      }
      const promises = [];
      if (trade.populated('listUser') === undefined) {
        const listUserController = new UserController({ username: trade.listUser });
        promises.push(new Promise(async (listUserResolve, listUserReject) => {
          this.listUserObject = await listUserController.getUserInfo();
          return listUserResolve();
        }));
      }
      if (trade.populated('offerUser') === undefined) {
        const offerUserController = new UserController({ username: trade.offerUser });
        promises.push(new Promise(async (offerUserResolve, offerUserReject) => {
          this.offerUserObject = await offerUserController.getUserInfo();
          return offerUserResolve();
        }));
      }
      return Promise.all(promises).then(res => resolve());
    });
  }

  populateBooks() {
    const trade = this.trade;
    // Note that it is not confirmed whether an array of objectIDs work normally with populated().
    return new Promise((resolve, reject) => {
      if (trade.populated('listBook') !== undefined && trade.populated('offerBooks') !== undefined
      && (trade.selectedBook == null || trade.populated('selectedBook') !== undefined)) {
        return resolve();
      }
      const promises = [];
      if (trade.populated('listBook') === undefined) {
        const listBookController = new BookController({ id: trade.listBook });
        promises.push(new Promise(async (listBookResolve, listBookReject) => {
          this.listBookObject = await listBookController.getBookInfo({ ownerUsername: true });
          return listBookResolve();
        }));
      }
      if (trade.populated('offerBooks') === undefined) {
        promises.push(new Promise(async (offerBookResolve, offerBookReject) => {
          this.offerBooksObject = await mapAsync(trade.offerBooks, (bookID, callback) => {
            const offerBookController = new BookController({ id: bookID });
            offerBookController.getBookInfo({ ownerUsername: true }).then((info) => {
              callback(null, info);
            });
          });
          return offerBookResolve();
        }));
      }
      if (trade.selectedBook != null && trade.populated('selectedBook') === undefined) {
        const selectedBookController = new BookController({ id: trade.selectedBook });
        promises.push(new Promise(async (selectedBookResolve, selectedBookReject) => {
          this.selectedBookObject =
            await selectedBookController.getBookInfo({ ownerUsername: true });
          return selectedBookResolve();
        }));
      }
      return Promise.all(promises).then(res => resolve());
    });
  }
}

/*
  @param {request} req - The request object that contains body and headers. Request must contain:
    1) Book - {objectID} (the book that the user wants to trade)
    2) Offer - Array{objectID} (books that the user wants to offer) (length > 0)
    3) Description - String (optional)
  @param {response} res - The response object used to send response codes and data to client.

  Creates a trade request for a book. Offer length must be >0, so all trades must be 1 for 1.

  @return {response} res - Sends response code 200 for success in creation of new book. Otherwise,
  sends 400 with a json body that specifies { error }.
*/
export const createTrade = async (req, res) => {
  if (!req.body) return res.status(400).json({ success: false, error: 'Use JSON!' });

  if (!req.body.book || !req.body.offer || req.body.offer.constructor !== Array ||
  req.body.offer.length < 1) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  // Check that the book listing exists.
  const listingBookController = new BookController({ id: req.body.book });
  const listingBookExists = await listingBookController.checkThatBookExists();
  if (!listingBookExists) {
    return res.status(400).json({ success: false, error: 'Listing book does not exist.' });
  }

  // Make sure the book does not belong to the user.
  if (listingBookController.book.owner.username === req.session.auth.username) {
    return res.status(400).json({ success: false, error: 'You cannot trade with yourself.' });
  }

  // Check that all the books exist and belong to the user.
  const filteredBooks = await filterAsync(req.body.offer, (bookID, callback) => {
    const bookController = new BookController({ id: bookID });
    bookController.checkThatBookExists()
    .then((bookExists) => {
      if (!bookExists) return callback(null, false);
      if (bookController.book.owner.username !== req.session.auth.username) {
        return callback(null, false);
      }
      return callback(null, true);
    })
    .catch((error) => {
      console.log('An error has occured while filtering books:');
      console.log(error);
      callback(null, false);
    });
  });

  if (filteredBooks.length !== req.body.offer.length) {
    return res.status(400).json({ success: false, error: 'Invalid offer.' });
  }

  // Passed all checks, so now create the trade.
  const trade = new Trade();
  trade.listUser = listingBookController.book.owner.username;
  trade.offerUser = req.session.auth.username;
  trade.listBook = req.body.book;
  trade.offerBooks = req.body.offer;
  trade.description = req.body.description || '';
  trade.tradeStatus = 'P';

  return trade.save(async (err, tradeObject) => {
    if (err) {
      console.log('An error occured while saving new trade:');
      console.log(err);
      return res.status(400).json({ success: false, error: 'Error saving trade.' });
    }
    res.status(200).json({ success: true });
  });
};
