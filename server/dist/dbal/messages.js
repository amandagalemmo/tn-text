"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllMessages = fetchAllMessages;
exports.insertMessage = insertMessage;
exports.getHardcodedMessages = getHardcodedMessages;
async function fetchAllMessages(db) {
    const res = await db.any('SELECT * FROM messages');
    return res;
}
async function insertMessage(db, msg) {
    await db.none("INSERT INTO messages(text, sent_by) VALUES(${text}, ${sent_by})", msg);
}
function getHardcodedMessages() {
    const messages = [
        "Hello world!",
        "What's updog?",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vehicula purus sit amet nisi lacinia, nec pretium lectus facilisis. Suspendisse eu ultricies ipsum. Nam ac mi et eros vestibulum ultricies. Praesent suscipit ullamcorper eros eget dignissim. Sed in erat ultricies, pretium orci a, maximus magna. Mauris mollis bibendum purus, ac lacinia dolor dapibus vel. Morbi diam velit, tristique sed eleifend ac, vestibulum vel quam. Proin eleifend blandit ligula, eget tempor ligula sagittis ut."
    ];
    return messages;
}
