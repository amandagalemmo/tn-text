"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messages_1 = require("../dbal/messages");
const router = express_1.default.Router();
/* GET home page. */
router.get('/', async function (req, res, next) {
    const db = req.app.get("db");
    const messageRows = await (0, messages_1.fetchAllMessages)(db);
    console.log("messageRows", messageRows);
    res.render('index', {
        title: 'TNText',
        messages: messageRows
    });
});
exports.default = router;
