import express from "express";
import { insertMessage } from "../../../dbal/messages";

const router = express.Router();

/**
 * Receive messages from Twilio webhook
 */
router.post("/api/post/sms", async (req, res) => {
	const db = req.app.get("db");
	const {body} = req;

	console.log(req.body);

	if (!body || !body.from || !body.text) {
		res.send("E_BAD_PARAMS: Your message was not stored");
	}

	await insertMessage(db, {sent_by: body.from, text: body.text});

	res.send(200);
});

export default router;
