import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chip, Tag } from "@/components/ui/chip";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getBillDetail } from "@/lib/bills/queries";
import { formatMoney } from "@/lib/currency";
import { longDay } from "@/lib/dates";
import type { PersonId } from "@/lib/domain/ids";
import { BackLink } from "@/components/patterns/back-link";
import { billDetailCopy, personStatusTint } from "./_data";
import { BillActions } from "./_components/bill-actions";
import { BillActivity } from "./_components/bill-activity";
import { BillReceipt } from "./_components/bill-receipt";
import { PersonShareList, type PersonShareItem } from "./_components/person-share-list";
import { basisCaption, explainShare, nameOf, payerWord, personStatusLabel, shareSummary, statusChip } from "./_lib/view";

export const metadata: Metadata = { title: billDetailCopy.metaTitle };

export default async function BillPage({ params }: PageProps<"/bills/[slug]">) {
  const { slug } = await params;
  const { person } = await requireAppContext(routes.bill(slug));
  const detail = await getBillDetail(slug, person.id);
  if (!detail) notFound();

  const you = person.id;
  const now = new Date();
  const copy = billDetailCopy;
  const payer = payerWord(detail, you);
  const chip = statusChip(detail, you);
  const names = new Map<PersonId, string>(detail.people.map((row) => [row.person.id, nameOf(row.person, you)]));
  const splitStep = detail.method === "ITEMS" ? "claim" : "split";

  const items: PersonShareItem[] = detail.people.map((row) => {
    const name = nameOf(row.person, you);
    return {
      id: row.person.id,
      name,
      displayName: row.person.displayName,
      tint: row.person.tint,
      buddy: row.person.buddy,
      caption: basisCaption(row.basis),
      total: row.share ? formatMoney(row.share.total, detail.currency) : null,
      status: { label: personStatusLabel(row, payer), tint: personStatusTint[row.status] },
      expandLabel: copy.people.expand(name),
      lines: explainShare(row, detail, you, names),
    };
  });

  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <BackLink href={routes.group(detail.group.id)} label={detail.group.name} />
        <BillActions
          billId={detail.id}
          title={detail.title}
          shareText={shareSummary(detail, you, detail.currency)}
          editHref={detail.canEdit ? routes.editBill(detail.slug) : null}
          splitHref={detail.canEdit ? routes.editBill(detail.slug, splitStep) : null}
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <h1 className="m-0 text-heading">{detail.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-small text-text-2">
            <Tag tint={detail.group.tint} art={detail.group.art ?? undefined}>
              {detail.group.name}
            </Tag>
            <span>{copy.meta(longDay(detail.occurredAt, now), payer)}</span>
          </div>
        </div>
        <Chip tint={chip.tint} dot>
          {chip.label}
        </Chip>
      </div>

      <PersonShareList title={copy.people.title} items={items} />
      <BillReceipt detail={detail} you={you} />
      <BillActivity rows={detail.activity} you={you} now={now} />
    </div>
  );
}
