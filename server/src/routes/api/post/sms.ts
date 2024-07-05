import express from "express";
import {twiml} from "twilio";
const {MessagingResponse} = twiml;

const app = express();

/**
 * Receive messages from Twilio webhook
 */
app.post("/sms", (req, res) => {
	console.log(req);
	const reply = new MessagingResponse();
	reply.message("Thanks for saying hi!");
	res.type("text/xml").send(twiml.toString());
});

export default app;