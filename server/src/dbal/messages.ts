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

export function getHardcodedMessages(): string[] {
	const messages = [
		"Hello world!",
		"What's updog?",
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vehicula purus sit amet nisi lacinia, nec pretium lectus facilisis. Suspendisse eu ultricies ipsum. Nam ac mi et eros vestibulum ultricies. Praesent suscipit ullamcorper eros eget dignissim. Sed in erat ultricies, pretium orci a, maximus magna. Mauris mollis bibendum purus, ac lacinia dolor dapibus vel. Morbi diam velit, tristique sed eleifend ac, vestibulum vel quam. Proin eleifend blandit ligula, eget tempor ligula sagittis ut."
	];
	return messages;
}
