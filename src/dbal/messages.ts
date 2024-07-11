import pgPromise from "pg-promise";
import pg from "pg-promise/typescript/pg-subset";

type Message = {
	id: number;
	text: string;
	sent_by: string;
	approved: boolean | null;
	created_at: Date;
	updated_at: Date;
};

type MessageInsert = Pick<Message, "text" | "sent_by">

export async function fetchAllMessages(
	db: pgPromise.IDatabase<{},pg.IClient>
) {
	const res: Message[] = await db.any('SELECT * FROM messages');
	return res;
}

export async function insertMessage(
	db: pgPromise.IDatabase<{}, pg.IClient>,
	msg: MessageInsert
) {
	await db.none(
		"INSERT INTO messages(text, sent_by) VALUES(${text}, ${sent_by})",
		msg
	);
}
