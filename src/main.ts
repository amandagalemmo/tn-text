#!/usr/bin/env node
import http from "http";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import { HttpError } from "http-errors";
import pgPromise from "pg-promise";
import { WebSocket, WebSocketServer } from "ws";
import {normalizePort, renderMessages} from "./util/util";
import { fetchAllMessages, insertMessage } from "./dbal/messages";

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
  server
});

wss.on("connection", (ws) => {
  app.set("ws", ws);
});

// Establish routes
app.get("/", async (req, res) => {
  const messageRows = await fetchAllMessages(db);

  res.render(
    'index',
    {
      title: 'TNText',
      messages: messageRows,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  );
});

app.post("/api/post/sms", async (req, res) => {
  const {body} = req;
  const ws = app.get("ws") as WebSocket;

	if (body && body.From && body.Body) {
		await insertMessage(db, {sent_by: body.From, text: body.Body});
    const messageRows = await fetchAllMessages(db);
    const messageHtml = renderMessages(messageRows);
    ws.send(messageHtml);
	} else {
		res.sendStatus(400);
		return;
	}
	res.sendStatus(200);
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

// @TODO: Do I need these?
// import logger from "morgan";
// import cookieParser from "cookie-parser";
// app.use(cookieParser());
// app.use(logger('dev'));


// @TODO: Set up error handling. Here's some sample code:
// // Catch 404 and forward to error handler
// app.use((req, res, next) => {
//   next(createError(404));
// });

// // Error handler
// // @TODO handle types
// app.use((err, req, res, next) => {
//   // Set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // Render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });
