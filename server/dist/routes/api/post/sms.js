"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messages_1 = require("../../../dbal/messages");
const router = express_1.default.Router();
/**
 * Receive messages from Twilio webhook
 */
router.post("/api/post/sms", async (req, res) => {
    const db = req.app.get("db");
    const { body } = req;
    if (!body || !body.from || !body.text) {
        res.send("E_BAD_PARAMS: Your message was not stored");
    }
    await (0, messages_1.insertMessage)(db, { sent_by: body.from, text: body.text });
    res.send(200);
});
exports.default = router;
