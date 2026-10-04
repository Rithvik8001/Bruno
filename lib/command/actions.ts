"use server";

import { z } from "zod";
import { defineAction } from "@/lib/actions/action";
import { actionOk } from "@/lib/actions/errors";
import { getCommandIndex, type CommandIndex } from "./queries";

export const commandIndex = defineAction(z.object({}), async (_input, { person }) =>
  actionOk<CommandIndex>(await getCommandIndex(person.id)),
);
