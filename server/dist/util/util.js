"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePort = normalizePort;
/**
 * Normalize a port into a number, string, or false.
 */
// @TODO this function is terrible and i hate it
function normalizePort(val) {
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
