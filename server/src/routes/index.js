"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messages_1 = require("../dbal/messages");
var router = express_1.default.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
    const messages = (0, messages_1.getMessages)();
    res.render('index', {
        title: 'TNText',
        messages: messages
    });
});
module.exports = router;
