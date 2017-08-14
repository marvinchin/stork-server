import Message from "../models/message";
import { TradeController } from "./trade-controller";

function findMessagesByTrade(trade) {
  return new Promise((resolve, reject) => {
    // We want the messages to be sorted in order of time created
    Message.find({ trade }).sort({ _id: 1 }).exec((err, messages) => {
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
  const tradeInfo = await tradeController.getTradeInfo();
  if (!tradeInfo) {
    return res
      .status(400)
      .json({ success: false, error: "Trade does not exist" });
  }
  // Check that the sender is either the list or offer user
  const sender = req.session.auth.username;
  if (
    sender !== tradeInfo.listUser.username &&
    sender !== tradeInfo.offerUser.username
  ) {
    return res.status(400).json({
      success: false,
      error: "User is not a participant in this trade"
    });
  }

  // Passed all checks, create the message
  const message = new Message();
  message.trade = trade;
  message.content = content;
  message.sender = sender;

  return message.save(async (err, messageObject) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, error: "Error saving message." });
    }
    return res.status(200).json({ success: true, message });
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
