UPDATE "person" SET "onboardedAt" = now() WHERE "onboardedAt" IS NULL;
