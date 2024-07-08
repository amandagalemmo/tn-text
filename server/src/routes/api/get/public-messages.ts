import express from "express";
import { getHardcodedMessages } from "../../../dbal/messages";
const app = express();

/**
 * API to retrieve all approved messages
 */
app.get(
	"/api/get/public-messages",
	(req, res, next) => {
		// fetch object of messages
		const messages = getHardcodedMessages();
		// Serve it to the caller
		res.send(messages);
	}
);

export default app;