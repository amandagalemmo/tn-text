"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messages_1 = require("../../../dbal/messages");
const app = (0, express_1.default)();
/**
 * API to retrieve all approved messages
 */
app.get("/api/get/public-messages", (req, res, next) => {
    // fetch object of messages
    const messages = (0, messages_1.getMessages)();
    // Serve it to the caller
    res.send(messages);
});
exports.default = app;
