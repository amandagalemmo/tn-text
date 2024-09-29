#!/usr/bin/env node
import http from "http";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import favicon from "serve-favicon";
import { HttpError } from "http-errors";
import pgPromise from "pg-promise";
import { WebSocket, WebSocketServer } from "ws";
import {
  normalizePort,
  renderMessage,
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
// Middleware function that serves the favicon
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')))

// Handle the views
app.set('views', path.join(__dirname, '../src/views'));
app.set('view engine', 'pug');

// Initialize state
type AppState = {
  messages: MessageRows;
  approvedMessages: MessageRows;
  displayQueue: string[]; // message row ids
  toQueue: string[]; // message row ids
  lastDisplayedMessage: string;
};
const initAppState: AppState = {
  messages: {},
  approvedMessages: {},
  displayQueue: [],
  toQueue: [],
  lastDisplayedMessage: "",
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

const wsConnections = new Set<WebSocket>();
app.set("wsConnections", wsConnections);

wss.on("connection", (ws) => {
  // Ideally in the future can separate moderator view/index view websockets,
  // but for now simply send every event to every connection.
  // @TODO figure out where close event is sent and remove closed ws from set
  wsConnections.add(ws);
  app.set("wsConnections", wsConnections);
});

// Establish routes
app.get("/", async (req, res) => {
  const state = app.get('state') as AppState;

  if (!state.approvedMessages.length) {
    state.approvedMessages = await fetchAllApprovedMessages(db);
    // Originally was making a separate check and setting this, but if there are no 
    // approved messages should probably just make new displayQueue too.
    state.displayQueue = [...Object.keys(state.approvedMessages)];
    app.set('state', state);
  }

  let messageText = "";
  if (Object.keys(state.approvedMessages).includes(state.lastDisplayedMessage)) {
    messageText = state.approvedMessages[state.lastDisplayedMessage].text;
  } else {
    messageText = state.approvedMessages[state.displayQueue[0]].text;
    state.lastDisplayedMessage = state.displayQueue[0];
    app.set('state', state);
  }

  res.render(
    'index',
    {
      title: 'TNText',
      message: messageText,
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
  const wsConnections = app.get("wsConnections") as Set<WebSocket>;
  const state = app.get('state') as AppState;

	if (body && body.From && body.Body) {
		await insertMessage(db, {sent_by: body.From, text: body.Body}); // @TODO maybe return inserted row, averting read here?
    state.messages = await fetchAllMessages(db);
    app.set('state', state);

    // Update the moderation page
    const tableBodyHtml = renderModTableBody(Object.values(state.messages));

    if (wsConnections.size) {
      wsConnections.forEach((ws) => {
        ws.send(tableBodyHtml);
      });
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

  const wsConnections = app.get("wsConnections") as Set<WebSocket>;
  const state = app.get('state') as AppState;

  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, true);

  if (messageRow) {
    state.messages[messageRow.id] = messageRow;
    state.approvedMessages[messageRow.id] = messageRow;
    state.toQueue.push(messageRow.id.toString());
    app.set('state', state);

    const tableRowHtml = renderModTableRow(messageRow);
    if (wsConnections.size) {
      wsConnections.forEach((ws) => {
        ws.send(tableRowHtml);
      });
    }

    // @TODO handle approved messages
  }
});

app.post("/api/post/disapprove", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const wsConnections = app.get("wsConnections") as Set<WebSocket>;
  const state = app.get('state') as AppState;

  const messageId = parseInt(req.query.id);
  const messageRow = await updateMessageApproval(db, messageId, false);

  if (messageRow) {
    state.messages[messageRow.id] = messageRow;
    delete state.approvedMessages[messageRow.id.toString()];
    if (state.displayQueue.includes(messageRow.id.toString())) {
      state.displayQueue = state.displayQueue.filter((val) => {
        return val !== messageRow.id.toString();
      });
    }
    if (state.toQueue.includes(messageRow.id.toString())) {
      state.toQueue = state.toQueue.filter((val) => {
        return val !== messageRow.id.toString();
      });
    }
    app.set('state', state);

    const tableRowHtml = renderModTableRow(messageRow);
    if (wsConnections.size) {
      wsConnections.forEach((ws) => {
        ws.send(tableRowHtml);
      });
    }

    // @TODO handle approved messages
  }
});

/**
 * This endpoint deletes the message in question from the database.
 * This action can only be taken on not-approved messages,
 * so no need to clean up approved messages/display queue.
 */
app.post("/api/post/delete", async (req, res) => {
  if (!req.query.id || typeof req.query.id !== "string") {
    return;
  }

  const wsConnections = app.get("wsConnections") as Set<WebSocket>;
  const state = app.get('state') as AppState;
  const messageId = parseInt(req.query.id);
  await deleteMessage(db, messageId);
  delete state.messages[messageId.toString()];
  
  app.set('state', state);

  // Update the moderation page
  const tableBodyHtml = renderModTableBody(Object.values(state.messages));

  if (wsConnections.size) {
    wsConnections.forEach((ws) => {
      ws.send(tableBodyHtml);
    });
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
  displayLoop();
}

function displayLoop() {
  const state = app.get("state") as AppState;
  const wsConnections = app.get("wsConnections") as Set<WebSocket>;
  console.log(wsConnections.size);
  const {approvedMessages, displayQueue, toQueue, lastDisplayedMessage} = state;
  if (
    wsConnections.size &&
    Object.keys(approvedMessages).length &&
    displayQueue.length
  ) {
    let messageToDisplayId = "";
    const lastDisplayedMessageIndex = displayQueue.indexOf(lastDisplayedMessage);
    if (toQueue.length) {
      messageToDisplayId = toQueue[0];
      if (lastDisplayedMessageIndex === displayQueue.length - 1) {
        state.lastDisplayedMessage = toQueue[0];
        state.displayQueue.push(...toQueue);
        state.toQueue = [];
      } else {
        state.displayQueue.push(toQueue.shift()!); // should be safe since we check to make sure toQueue has elements above
      }
    } else {
      if (
        lastDisplayedMessageIndex === displayQueue.length - 1 ||
        lastDisplayedMessageIndex === -1
      ) {
        messageToDisplayId = displayQueue[0];
      } else {
        messageToDisplayId = displayQueue[lastDisplayedMessageIndex + 1];
      }
      state.lastDisplayedMessage = messageToDisplayId
    }
    app.set("state", state);

    const messageHtml = renderMessage(approvedMessages[messageToDisplayId]);
    wsConnections.forEach((ws) => {
      // Check to see which connections are closed and remove them from the list
      if (ws.readyState == ws.CLOSED) {
        wsConnections.delete(ws);
      } else {
        ws.send(messageHtml);
      }
    });
  }
  setTimeout(displayLoop, 10000);
}
