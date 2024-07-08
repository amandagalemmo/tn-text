/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
const {PgLiteral} = require("node-pg-migrate");
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
	pgm.createTable("messages", {
		id: 'id', // Shorthand for incremental ID
		text: 'text',
		sent_by: 'text',
		approved: {
			type: 'boolean',
			notNull: false,
		},
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: new PgLiteral('current_timestamp'),
		},
		updated_at: {
			type: 'timestamp',
			notNull: true,
			default: new PgLiteral('current_timestamp'),
		}
	});
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable("messages");
};
