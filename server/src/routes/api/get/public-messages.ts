import express from "express";
import { getMessages } from "../../../dbal/messages";
const app = express();

/**
 * API to retrieve all approved messages
 */
app.get(
	"/api/get/public-messages",
	(req, res, next) => {
		// fetch object of messages
		const messages = getMessages();
		// Serve it to the caller
		res.send(messages);
	}
);

export default app;