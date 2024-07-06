#!/usr/bin/env node
import http from "http";
import path from "path";
import express from "express";
import { HttpError } from "http-errors";
// import logger from "morgan";
// import cookieParser from "cookie-parser";
import {normalizePort} from "./util/util";

import indexRouter from "./routes/index";

// Instantiate the app
const app = express();
// Middleware function that parses incoming requests with JSON payloads
app.use(express.json());
// Middleware function that parses incoming requests with urlencoded payloads
app.use(express.urlencoded({extended: false}));
// Middleware function that serves static files
app.use(express.static(path.join(__dirname, "public")));

// Handle the views
app.set('views', path.join(__dirname, '../src/views'));
app.set('view engine', 'pug'); // @TODO This should just be html eventually

// @TODO: Do I need these?
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

// Establish routes
app.use("/", indexRouter);

// Spin up the server
const port = normalizePort(process.env.PORT || "8080");
app.set("port", port);
const server = http.createServer(app);

// Listen on the provided port, on all network interfaces
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
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
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
