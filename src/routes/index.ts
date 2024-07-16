import express from "express";
import {fetchAllMessages} from "../dbal/messages";

const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const db = req.app.get("db");
  const messageRows = await fetchAllMessages(db);

  res.render(
    'index',
    {
      title: 'TNText',
      messages: messageRows,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  );
});

export default router;
