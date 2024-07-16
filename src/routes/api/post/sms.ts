import express from "express";
import { insertMessage } from "../../../dbal/messages";

const router = express.Router();

/**
 * Receive messages from Twilio webhook
 */
router.post("/api/post/sms", async (req, res) => {
	const db = req.app.get("db");
	const {body} = req;

	if (body && body.From && body.Body) {
		await insertMessage(db, {sent_by: body.From, text: body.Body});
	} else {
		res.sendStatus(400);
		return;
	}

	res.sendStatus(200);
});

export default router;
