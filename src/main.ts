#!/usr/bin/env node
import http from "http";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import { HttpError } from "http-errors";
import pgPromise from "pg-promise";
import { WebSocket, WebSocketServer } from "ws";
import {normalizePort, renderMessages, renderModTableBody, renderModTableRow} from "./util/util";
import { fetchAllMessages, fetchAllApprovedMessages, insertMessage, updateMessageApproval, deleteMessage } from "./dbal/messages";

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
app.set('view engine', 'pug'); // @TODO This should just be html eventually

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
  const messageRows = await fetchAllApprovedMessages(db);
  const messageTexts = messageRows.map((messageRow) => {
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
  const messageRows = await fetchAllMessages(db);

  res.render(
    "moderate",
    {
      title: 'TNText - Mod Page',
      messages: messageRows
    }
  );
});

app.post("/api/post/sms", async (req, res) => {
  const {body} = req;
  const ws = app.get("ws") as WebSocket;

	if (body && body.From && body.Body) {
		await insertMessage(db, {sent_by: body.From, text: body.Body});
    const messageRows = await fetchAllMessages(db);
    // Update the moderation page
    const tableBodyHtml = renderModTableBody(messageRows);

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
  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, true);

  if (messageRow) {
    const tableRowHtml = renderModTableRow(messageRow);
    ws.send(tableRowHtml);

    const approvedMessageRows = await fetchAllApprovedMessages(db);
    const approvedMessagesHtml = renderMessages(approvedMessageRows);
    ws.send(approvedMessagesHtml);
  }
});

app.post("/api/post/disapprove", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const ws = app.get("ws") as WebSocket;
  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, false);

  if (messageRow) {
    const tableRowHtml = renderModTableRow(messageRow);
    ws.send(tableRowHtml);

    const approvedMessageRows = await fetchAllApprovedMessages(db);
    const approvedMessagesHtml = renderMessages(approvedMessageRows);
    ws.send(approvedMessagesHtml);
  }
});

app.post("/api/post/delete", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const ws = app.get("ws") as WebSocket;
  const messageId = parseInt(req.query.id);
  await deleteMessage(db, messageId);
  const messageRows = await fetchAllMessages(db);

  // Update the moderation page
  const tableBodyHtml = renderModTableBody(messageRows);

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
