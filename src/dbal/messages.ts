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

type MessageInsert = Pick<MessageRow, "text" | "sent_by">

export async function fetchAllMessages(
	db: pgPromise.IDatabase<{},pg.IClient>
) {
	const res: MessageRow[] = await db.any('SELECT * FROM messages ORDER BY created_at DESC');
	return res;
}

export async function fetchAllApprovedMessages(
	db: pgPromise.IDatabase<{}, pg.IClient>
) {
	const res: MessageRow[] = await db.any('SELECT * FROM messages WHERE approved');
	return res;
}

export async function insertMessage(
	db: pgPromise.IDatabase<{}, pg.IClient>,
	msgInsert: MessageInsert
) {
	await db.none(
		"INSERT INTO messages(text, sent_by) VALUES($1, $2)",
		[msgInsert.text, msgInsert.sent_by]
	);
}
