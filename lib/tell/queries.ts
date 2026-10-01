import "server-only";
import { db } from "@/lib/db";
import { groupId as toGroupId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { parseTellAnswers, parseTellResult, type TellAnswers, type TellResult } from "./result";

export interface TellReview {
  readonly draftId: string;
  readonly groupId: GroupId;
  readonly text: string;
  readonly result: TellResult;
  readonly answers: TellAnswers;
}

export async function getTellReview(draftId: string, you: PersonId): Promise<TellReview | null> {
  const row = await db.tellDraft.findFirst({
    where: { id: draftId, personId: you, status: "SUCCEEDED" },
    select: { id: true, groupId: true, text: true, result: true, answers: true },
  });
  if (!row || row.text === null) return null;
  const result = parseTellResult(row.result);
  if (!result) return null;
  return { draftId: row.id, groupId: toGroupId(row.groupId), text: row.text, result, answers: parseTellAnswers(row.answers) };
}

export async function getTellText(draftId: string, you: PersonId): Promise<string | null> {
  const row = await db.tellDraft.findFirst({ where: { id: draftId, personId: you }, select: { text: true } });
  return row?.text ?? null;
}
