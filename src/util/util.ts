import pug from "pug";
import path from "path";
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

export function renderMessage(messageRow: MessageRow) {
  const templatePath = path.join(__dirname, "../../src/views/display-message.pug");
  const messageHtml = pug.renderFile(templatePath, {message: messageRow.text});
  return messageHtml;
}

export function renderModTableBody(messageRows: MessageRow[]) {
  let html = `<tbody id="mod-table-body">`;
  messageRows.forEach((messageRow) => {
    const templatePath = path.join(__dirname, "../../src/views/mod-table-row.pug");
    const rowHtml = pug.renderFile(templatePath, {message: messageRow});
    html += rowHtml;
  })
  html += "</tbody>";
  return html;
}

export function renderModTableRow(messageRow: MessageRow) {
  const templatePath = path.join(__dirname, "../../src/views/mod-table-row.pug");
  const rowHtml = pug.renderFile(templatePath, {message: messageRow});
  return rowHtml;
}
