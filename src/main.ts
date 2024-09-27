#!/usr/bin/env node
import http from "http";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import { HttpError } from "http-errors";
import pgPromise from "pg-promise";
import { WebSocket, WebSocketServer } from "ws";
import {
  normalizePort,
  renderModTableBody,
  renderModTableRow
} from "./util/util";
import {
  fetchAllMessages,
  fetchAllApprovedMessages,
  insertMessage,
  updateMessageApproval,
  deleteMessage,
  MessageRows
} from "./dbal/messages";

const config = dotenv.config();
dotenvExpand.expand(config);

// Instantiate the app
const app = express();

// Middleware function that parses incoming requests with JSON payloads
app.use(express.json());
// Middleware function that parses incoming requests with urlencoded payloads
app.use(express.urlencoded({extended: false}));
// Middleware function that serves static files
app.use(express.static(path.join(__dirname, "../public")));

// Handle the views
app.set('views', path.join(__dirname, '../src/views'));
app.set('view engine', 'pug');

// Initialize state
type AppState = {
  messages: MessageRows;
  approvedMessages: MessageRows;
  displayQueue: MessageRows;
  toQueue: MessageRows;
};
const initAppState: AppState = {
  messages: {},
  approvedMessages: {},
  displayQueue: {},
  toQueue: {}
}
app.set('state', initAppState);

// Establish DB connection
const pgp = pgPromise();
if (!process.env.DATABASE_URL) {
  throw new Error("E_NO_DB_STRING");
}
const db = pgp(process.env.DATABASE_URL);

// Spin up the server
const server = http.createServer();
const port = normalizePort(process.env.PORT || "8080");

// Direct to express app for traditional HTTP requests
server.on("request", app);

// Create web socket server
// https://stackoverflow.com/questions/71246576/websocket-endpoints-and-express-router
const wss = new WebSocketServer({
  server,
  path: "/websocket"
});

wss.on("connection", (ws) => {
  app.set("ws", ws);
});

// Establish routes
app.get("/", async (req, res) => {
  const state = app.get('state') as AppState;

  if (!state.approvedMessages.length) {
    state.approvedMessages = await fetchAllApprovedMessages(db);
    app.set('state', state);
  }

  const messageTexts = Object.values(state.approvedMessages).map((messageRow) => {
    return messageRow.text;
  });

  res.render(
    'index',
    {
      title: 'TNText',
      messages: messageTexts,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  );
});

app.get("/moderate", async (req, res) => {
  const state = app.get('state') as AppState;

  if (!state.messages.length) {
    state.messages = await fetchAllMessages(db);
    app.set('state', state);
  }

  res.render(
    "moderate",
    {
      title: 'TNText - Mod Page',
      messages: Object.values(state.messages)
    }
  );
});

app.post("/api/post/sms", async (req, res) => {
  const {body} = req;
  const ws = app.get("ws") as WebSocket;
  const state = app.get('state') as AppState;

	if (body && body.From && body.Body) {
		await insertMessage(db, {sent_by: body.From, text: body.Body});
    state.messages = await fetchAllMessages(db);
    app.set('state', state);

    // Update the moderation page
    const tableBodyHtml = renderModTableBody(Object.values(state.messages));

    if (ws) {
      ws.send(tableBodyHtml);
    }
	} else {
		res.sendStatus(400);
		return;
	}
	res.sendStatus(200);
});

app.post("/api/post/approve", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const ws = app.get("ws") as WebSocket;
  const state = app.get('state') as AppState;

  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, true);

  if (messageRow) {
    state.messages[messageRow.id] = messageRow;
    state.approvedMessages[messageRow.id] = messageRow;
    app.set('state', state);

    const tableRowHtml = renderModTableRow(messageRow);
    ws.send(tableRowHtml);

    // @TODO handle approved messages
  }
});

app.post("/api/post/disapprove", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const ws = app.get("ws") as WebSocket;
  const state = app.get('state') as AppState;

  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, false);

  if (messageRow) {
    state.messages[messageRow.id] = messageRow;
    delete state.approvedMessages[messageRow.id.toString()];
    app.set('state', state);

    const tableRowHtml = renderModTableRow(messageRow);
    ws.send(tableRowHtml);

    // @TODO handle approved messages
  }
});

app.post("/api/post/delete", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const ws = app.get("ws") as WebSocket;
  const state = app.get('state') as AppState;
  const messageId = parseInt(req.query.id);
  await deleteMessage(db, messageId);
  delete state.messages[messageId.toString()];
  
  app.set('state', state);

  // Update the moderation page
  const tableBodyHtml = renderModTableBody(Object.values(state.messages));

  if (ws) {
    ws.send(tableBodyHtml);
  }
});

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: HttpError) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
export function onListening() {
  const addr = server.address();
	if (addr === null) {
		console.error("server address is null", addr);
		return;
	}
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  console.log('Listening on ' + bind);
}
