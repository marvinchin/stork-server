import Trade from '../models/trade';
import { BookController } from './book-controller';
import { filterAsync, mapAsync } from '../helpers/async-helper';

export class TradeController {

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

  // Make sure the book is not his/hers.
  if (listingBookController.book.owner.username === req.session.auth.username) {
    return res.status(400).json({ success: false, error: 'You cannot trade with yourself.' });
  }

  

};
