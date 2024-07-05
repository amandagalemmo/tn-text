import express from "express";
import {getMessages} from "../dbal/messages";

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const messages = getMessages();
  res.render(
    'index',
    {
      title: 'TNText',
      messages: messages
    }
  );
});

export default router;
