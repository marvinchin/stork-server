import { Router } from "express";
import {
  createMessage,
  getTradeMessages
} from "../controllers/message-controller";

const router = Router();

router.post("/create", (req, res, next) => {
  if (!req.authenticated) {
    return res
      .status(403)
      .json({ success: false, error: "Authentication required." });
  }
  return createMessage(req, res);
});

router.get("/getMessagesForTrade/:trade", (req, res, next) => {
  if (!req.authenticated) {
    return res
      .status(403)
      .json({ success: false, error: "Authentication required." });
  }
  return getTradeMessages(req, res);
});

export default router;
