import { z } from "zod";
import { FEED_FILTERS } from "./types";

export const feedFilterSchema = z.enum(FEED_FILTERS);

export const loadFeedSchema = z.object({
  filter: feedFilterSchema,
  cursor: z.object({ at: z.iso.datetime(), id: z.string().min(1) }),
});

export const emptySchema = z.object({});

export type LoadFeedInput = z.infer<typeof loadFeedSchema>;
