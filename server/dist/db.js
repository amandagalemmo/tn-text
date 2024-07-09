"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_promise_1 = __importDefault(require("pg-promise"));
// A db instance
class Database {
    db;
    constructor(connectionString) {
        if (!connectionString) {
            throw new Error("E_NO_DB_CONNECTION");
        }
        const pgp = (0, pg_promise_1.default)();
        this.db = pgp(connectionString);
    }
}
exports.default = Database;
