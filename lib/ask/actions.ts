"use server";

import { defineAction } from "@/lib/actions/action";
import { actionOk } from "@/lib/actions/errors";
import { getAskQuota } from "./quota";
import { askQuotaSchema } from "./schema";

export const askQuota = defineAction(askQuotaSchema, async ({ timeZone }, { person }) => actionOk(await getAskQuota(person.id, timeZone)));
