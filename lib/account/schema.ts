import { z } from "zod";
import { accountMessages } from "./messages";
import { matchesConfirm } from "./rules";

const CONFIRM_MAX = 32;

export const deleteAccountSchema = z.object({
  confirm: z.string().max(CONFIRM_MAX).refine(matchesConfirm, accountMessages.confirm),
});
