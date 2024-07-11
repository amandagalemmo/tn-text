import express from "express";
import {fetchAllMessages} from "../dbal/messages";

const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const db = req.app.get("db");
  const messageRows = await fetchAllMessages(db);
  console.log("messageRows", messageRows);
  res.render(
    'index',
    {
      title: 'TNText',
      messages: messageRows
    }
  );
});

export default router;
