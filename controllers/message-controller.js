import Message from "../models/message";
import { TradeController } from "./trade-controller";

function findMessageById(id) {
  return new Promise((resolve, reject) => {
    Message.findById(id, (err, message) => {
      if (err) reject(err);
      resolve(message);
    });
  });
}

function findMessagesByTrade(trade) {
  return new Promise((resolve, reject) => {
    Message.find({ trade }).exec((err, messages) => {
      if (err) reject(err);
      resolve(messages);
    });
  });
}

export async function createMessage(req, res) {
  const { body } = req;
  if (!body) {
    return res.status(400).json({ success: false, error: "Use JSON!" });
  }

  // Check that parameters are present
  const { content, trade } = body;
  if (!content || !trade) {
    return res
      .status(400)
      .json({ success: false, error: "Missing content or trade" });
  }

  // Check that the trade exists
  // TODO: Change this to non-class implementation
  const tradeController = new TradeController({ id: trade });
  const tradeExists = await tradeController.checkThatTradeExists();
  if (!tradeExists) {
    return res
      .status(400)
      .json({ success: false, error: "Trade does not exist" });
  }
  // Passed all checks, create the message
  const message = new Message();
  message.trade = trade;
  message.content = content;
  message.sender = req.session.auth.username;

  return message.save(async (err, messageObject) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, error: "Error saving message." });
    }
    return res.status(200).json({ success: true });
  });
}

export async function getTradeMessages(req, res) {
  console.log(req.params);
  const { params } = req;
  if (!params) {
    return res.status(400).json({ success: false, error: "Use JSON!" });
  }

  // Check that parameters are present
  const { trade } = params;
  if (!trade) {
    return res.status(400).json({ success: false, error: "Missing trade" });
  }

  let messages;
  try {
    messages = await findMessagesByTrade(trade);
  } catch (e) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to get messages for trade" });
  }
  return res.status(200).json({ success: true, messages });
}
