import pgPromise from "pg-promise";
import pg from "pg-promise/typescript/pg-subset";

export type MessageRow = {
	id: number;
	text: string;
	sent_by: string;
	approved: boolean | null;
	created_at: Date;
	updated_at: Date;
};

export type MessageRows = {
	[id: string]: MessageRow
};

type pgDb = pgPromise.IDatabase<{}, pg.IClient>;
type MessageInsert = Pick<MessageRow, "text" | "sent_by">;

export async function fetchAllMessages(
	db: pgDb
): Promise<MessageRows> {
	const res: MessageRow[] = await db.any('SELECT * FROM messages ORDER BY created_at DESC');
	let messageRows: MessageRows = {};
	res.forEach((row) => {
		messageRows[row.id] = row;
	});
	return messageRows;
}

export async function fetchAllApprovedMessages(
	db: pgDb
): Promise<MessageRows> {
	const res: MessageRow[] = await db.any('SELECT * FROM messages WHERE approved');
	let messageRows: MessageRows = {};
	res.forEach((row) => {
		messageRows[row.id] = row;
	});
	return messageRows;
}

export async function insertMessage(
	db: pgDb,
	msgInsert: MessageInsert
) {
	await db.none(
		"INSERT INTO messages(text, sent_by) VALUES($1, $2)",
		[msgInsert.text, msgInsert.sent_by]
	);
}

export async function updateMessageApproval(
	db: pgDb,
	messageId: number,
	approved: boolean
): Promise<MessageRow | void> {
	try {
		const res: MessageRow[] = await db.any(
			"UPDATE messages SET approved = $1, updated_at = now() WHERE id = '$2' RETURNING *",
			[approved, messageId]
		);
		return res[0];
	} catch (err) {
		console.log(err);
	}
}

export async function deleteMessage(
	db: pgDb,
	messageId: number
) {
	await db.none("DELETE FROM messages WHERE id = '$1'", [messageId]);
}
