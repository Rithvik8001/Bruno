-- AlterTable
ALTER TABLE "group" ADD COLUMN     "art" TEXT;

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "buddy" TEXT;

ALTER TABLE "person" ADD CONSTRAINT "person_tint_check" CHECK ("tint" IN ('violet', 'blue', 'orange', 'red', 'green', 'pink', 'amber', 'cyan', 'indigo'));
ALTER TABLE "person" ADD CONSTRAINT "person_buddy_check" CHECK ("buddy" IS NULL OR "buddy" IN ('mochi', 'miso', 'bun', 'bolt', 'bruin', 'sprout', 'swoop', 'pom'));
ALTER TABLE "group" ADD CONSTRAINT "group_tint_check" CHECK ("tint" IN ('violet', 'blue', 'orange', 'red', 'green', 'pink', 'amber', 'cyan', 'indigo'));
ALTER TABLE "group" ADD CONSTRAINT "group_art_check" CHECK ("art" IS NULL OR "art" IN ('luggage', 'plane', 'beach', 'tent', 'house', 'cart', 'soccer', 'pizza', 'sushi', 'cocktail', 'cheers', 'party', 'cake', 'gift', 'popcorn', 'coffee', 'basketball', 'gaming', 'car', 'mountain', 'xmas', 'dog', 'grad', 'ticket', 'music', 'bike', 'burger', 'beer', 'ring', 'palm'));
