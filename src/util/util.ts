import { MessageRow } from "../dbal/messages";

/**
 * Normalize a port into a number, string, or false.
 */
// @TODO this function is terrible and i hate it
export function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Given a list of messages from the database, compile them into html.
 */
export function renderMessages(messageRows: MessageRow[]) {
  let html = `<div class="messages-container" id="messages">`;
  for (let i = 0; i < messageRows.length; i++) {
    const messageRow = messageRows[i];
    html += `<div class="message"><p>Someone said: ${messageRow.text}</p></div>`;
  }
  html += "</div>";
  return html;
}
