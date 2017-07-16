import Trade from '../models/trade';
import { BookController } from './book-controller';
import { UserController } from './user-controller';
import { filterAsync, mapAsync } from '../helpers/async-helper';

export class TradeController {
  // Population is done by the controller, no need to populate yourself beforehand.
  constructor(options) {
    if (options.trade) {
      this.trade = options.trade;
    } else if (options.id) {
      this.trade = TradeController.findTradeByID(options.id);
    }
  }

  static findTradeByID(id) {
    return new Promise((resolve, reject) => {
      Trade.findById(id, (err, trade) => {
        if (err) return resolve(null);
        return resolve(trade);
      });
    });
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

  addSelectedBook(id) {
    return new Promise((resolve, reject) => {
      this.trade.update({ selectedBook: id, tradeStatus: 'A' }, (err, res) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  cancelTrade() {
    return new Promise((resolve, reject) => {
      this.trade.update({ tradeStatus: 'C' }, (err, res) => {
        if (err) return reject(err);
        return resolve(err);
      });
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

  @return {response} res - Sends response code 200 for success in creation of new trade. Otherwise,
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
    const tradeController = new TradeController({ trade: tradeObject });
    return res.status(200).json({ success: true, trade: await tradeController.getTradeInfo() });
  });
};

/*
  @param {request} req - The request object that contains body and headers. All necessary params
    have already been checked by updateTrade (status, trade).
  @param {response} res - The response object used to send response codes and data to client.

  Cancels the trade. Will work as long as the user is involved in the trade regardless of the
  current status of the trade.

  @return {response} res - Sends response code 200 for success in cancelling trade. Otherwise,
  sends 400 with a json body that specifies { error }.
*/
export const cancelTrade = async (req, res) => {
  const tradeController = new TradeController({ id: req.body.trade });
  
  // Check if the trade exists.
  if (!await tradeController.checkThatTradeExists()) {
    return res.status(400).json({ success: false, error: 'Unable to find trade.' });
  }

  // Check if the user is involved in the trade.
  if (tradeController.trade.listUser !== req.session.auth.username &&
      tradeController.trade.offerUser !== req.session.auth.username) {
    return res.status(400).json({ success: false, error: 'You are not involved in the trade.' });
  }

  // All checks passed. Time to cancel the trade.
  try {
    await tradeController.cancelTrade();
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Error cancelling trade.' });
  }
  return res.status(200).json({ success: true });
};

/*
  @param {Request} req - The request that will contain the neccesary parameters:
    1) status {String} - The next status to update the state to. (A)
    2) trade {ObjectID} - The object ID that refernces the trade in question.
    3) selection {ObjectID} - The object ID that contains the selected book.
  @param {response} res - The response object used to send response codes and data to client.
*/
const acceptTrade = async (req, res) => {
  // Status and trade have already been checked to exist by updateTrade. Just check if there's
  // selection.
  if (!req.body.selection || !(typeof req.body.selection === 'string' || req.body.selection instanceof String)) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  // Check that trade exists.
  const tradeController = new TradeController({ id: req.body.trade });
  if (!await tradeController.checkThatTradeExists()) {
    return res.status(400).json({ success: false, error: 'Trade does not exist.' });
  }

  // Check that the trade actually belongs to the user.
  if (tradeController.trade.listUser !== req.session.auth.username) {
    return res.status(400).json({ success: false, error: 'You do not own the book.' });
  }

  // Check that the trade status is 'P'.
  if (tradeController.trade.tradeStatus !== 'P') {
    return res.status(400).json({ success: false, error: 'The trade is not pending your selection.' });
  }

  // Check that the book is inside the array of offers.
  if (tradeController.trade.offerBooks.indexOf(req.body.selection) === -1) {
    return res.status(400).json({ success: false, error: 'The trade is not pending your selection.' });
  }

  // Checks done. Time to update database with new data.
  try {
    await tradeController.addSelectedBook(req.body.selection);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Error while updating trade.' });
  }
};

/*
  @param {Request} req - The request that will contain the neccesary parameters:
    1) status {String} - The next status to update the state to. Enum of [A, C, OC, LC, BC].
    2) trade {ObjectID} - The object ID that refernces the trade in question.
  @param {response} res - The response object used to send response codes and data to client.

  Serves as a router to route the various types of updates to more specialized handlers. Checks
  for the validity of the request will be handled by the respective handlers.

  @return {response} res - Sends response code 200 for success in creation of new book. Otherwise,
  sends 400 with a json body that specifies { error }.
*/
export const updateTrade = async (req, res) => {
  if (!req.body) return res.status(400).json({ success: false, error: 'Use JSON!' });

  // If no trade parameter or trade is not object ID string then straight away reject.
  if (!req.body.trade || !(typeof req.body.trade === 'string' || req.body.trade instanceof String)) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  // If no status parameter or status param is not a string then straight away reject.
  if (!req.body.status || !(typeof req.body.status === 'string' || req.body.status instanceof String)) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters.' });
  }

  // Check for 'accept' route.
  if (req.body.status === 'A') {
    return acceptTrade(req, res);
  }

  if (req.body.status === 'C') {
    return cancelTrade(req, res);
  }

  // At the end, if no routes to go, it means invalid status enum. Reject.
  return res.status(400).json({ success: false, error: 'Invalid status.' });
};

/*
  @param {Request} req - The request that will contain the neccesary parameters:
  @param {response} res - The response object used to send response codes and data to client.

  Returns the list of trades that the user is involved in. Authentication has already
  been checked by the router.
*/
export const getTradesInvolvingUser = (req, res) => {
  return Trade.find({}, async (err, trades) => {
    if (err) return res.status(400).json({ success: false, error: 'Error fetching trades.' });

    // "Involved in" is defined as being an offerer or a lister of a trade.
    const filteredTrades = await filterAsync(trades, (trade, callback) => {
      return callback(null, trade.listUser === req.session.auth.username || trade.offerUser === req.session.auth.username);
    });
    
    const mappedTrades = await mapAsync(filteredTrades, (trade, callback) => {
      const tradeController = new TradeController({ trade });
      return tradeController.getTradeInfo().then((info) => {
        return callback(null, info);
      });
    });

    return res.status(200).json({ success: true, trades: mappedTrades });
  });
};
