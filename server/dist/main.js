#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onListening = onListening;
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const dotenv_expand_1 = __importDefault(require("dotenv-expand"));
const express_1 = __importDefault(require("express"));
const pg_promise_1 = __importDefault(require("pg-promise"));
// import logger from "morgan";
// import cookieParser from "cookie-parser";
const util_1 = require("./util/util");
// Routes
const index_1 = __importDefault(require("./routes/index"));
const sms_1 = __importDefault(require("./routes/api/post/sms"));
const config = dotenv_1.default.config();
dotenv_expand_1.default.expand(config);
// Instantiate the app
const app = (0, express_1.default)();
// Middleware function that parses incoming requests with JSON payloads
app.use(express_1.default.json());
// Middleware function that parses incoming requests with urlencoded payloads
app.use(express_1.default.urlencoded({ extended: false }));
// Middleware function that serves static files
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Handle the views
app.set('views', path_1.default.join(__dirname, '../src/views'));
app.set('view engine', 'pug'); // @TODO This should just be html eventually
// Establish DB connection
const pgp = (0, pg_promise_1.default)();
if (!process.env.DATABASE_URL) {
    throw new Error("E_NO_DB_STRING");
}
app.set("db", pgp(process.env.DATABASE_URL));
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
app.use("/", index_1.default);
app.post("/api/post/sms", sms_1.default);
// Spin up the server
const port = (0, util_1.normalizePort)(process.env.PORT || "8080");
app.set("port", port);
const server = http_1.default.createServer(app);
// Listen on the provided port, on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
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
function onListening() {
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
