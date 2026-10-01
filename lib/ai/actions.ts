"use server";

import { defineAction } from "@/lib/actions/action";
import { actionOk } from "@/lib/actions/errors";
import { getAllowance } from "./allowance";
import { allowanceSchema } from "./schema";

export const aiAllowance = defineAction(allowanceSchema, async ({ timeZone }, { person }) => actionOk(await getAllowance(person.id, timeZone)));
