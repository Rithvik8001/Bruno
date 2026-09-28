import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AmountChip, StatusChip, Tag } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { groupArtFor } from "@/lib/design-system/icons3d";
import { IconButton } from "@/components/ui/icon-button";
import { List, ListRow } from "@/components/ui/list-row";
import { Select } from "@/components/ui/select";
import { ListRowSkeleton } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import {
  ClaimReceiptDemo,
  CommandMenuDemo,
  LoadingButtonDemo,
  MoneyInputDemo,
  SegmentedDemo,
  SheetDemo,
  StepperDemo,
  TabsDemo,
  ToastDemo,
} from "../_components/demos";
import { Demo, DemoGrid, DocSection } from "../_components/doc";
import { balances, crowd, groups, rowStatuses } from "../_data";

const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));

export function ComponentsSection() {
  return (
    <DocSection
      index={6}
      title="Components"
      description="Live where it matters. Surfaces are flat grey or white; hairlines separate rows; shadow only on things that float."
      contentClassName="grid gap-11"
    >
      <Demo
        title="Status chip and tag"
        description="Icon + label on a tint. 32px in rows, 28px inline. Bill states map to fixed hues so the same word always looks the same. Group tags use the group's hue, with its 3D art in place of the dot."
      >
        <div className="flex flex-wrap items-center gap-2">
          {rowStatuses.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {groups.map((g) => (
            <Tag key={g.id} tint={g.tint} art={groupArtFor(g.name)}>
              {g.name}
            </Tag>
          ))}
          <Tag tint="neutral">Neutral</Tag>
        </div>
      </Demo>

      <Demo
        title="Button"
        description="Primary is brand; secondary is surface grey; tertiary is text. Sizes 32 / 40 / 48. Press scales to 0.98. Loading keeps width. Focus: 2px brand ring, 2px offset."
      >
        <div className="flex flex-wrap items-center gap-3">
          <LoadingButtonDemo />
          <Button variant="secondary">Remind Sam</Button>
          <Button variant="tertiary" className="px-3">
            Not now
          </Button>
          <Button variant="danger">Delete bill</Button>
          <Button size="sm" variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </Demo>

      <DemoGrid>
        <Demo
          title="Icon button"
          description="40px, 20px glyph. Hover fills grey; a tinted variant marks the one primary action in a header."
        >
          <div className="flex gap-2">
            <IconButton icon="plus" label="Add" variant="tinted" />
            <IconButton icon="chevron-left" label="Back" />
            <IconButton icon="search" label="Search" />
            <IconButton icon="more" label="More" />
          </div>
        </Demo>
        <Demo
          title="Input"
          description="Grey surface, no border at rest. Focus: white with brand ring. Error and success below the field in tint colour."
        >
          <div className="grid gap-3.5">
            <TextField label="Email" type="email" placeholder="you@example.com" />
            <TextField
              label="Email"
              defaultValue="sam@"
              readOnly
              feedback={{ tone: "error", message: "That doesn’t look like an email" }}
            />
            <TextField
              label="Invite link"
              defaultValue="bruno.app/j/lisbon"
              readOnly
              feedback={{ tone: "success", message: "Copied" }}
            />
          </div>
        </Demo>
      </DemoGrid>

      <DemoGrid>
        <Demo
          title="Money input"
          description="Digits format as cents while typing. 44px, weight 600, currency in muted grey outside the caret run."
        >
          <MoneyInputDemo />
        </Demo>
        <div className="grid gap-6">
          <Demo title="Segmented control" description="Grey track, white floating thumb. 2–4 options. Arrow keys move the selection.">
            <SegmentedDemo />
          </Demo>
          <Demo title="Select">
            <Select label="Group" options={groupOptions} defaultValue="lisbon" />
          </Demo>
        </div>
      </DemoGrid>

      <DemoGrid>
        <Demo title="Checkbox" description="22px, radius 7. Checked fills brand. Whole row is the target.">
          <div className="grid gap-0.5">
            <Checkbox defaultChecked>Include tip in the split</Checkbox>
            <Checkbox disabled>Round to nearest dollar</Checkbox>
          </div>
        </Demo>
        <Demo
          title="Avatar and stack"
          description="A buddy on the person's tint. 24 / 32 / 40. Stacks overlap by a third with a canvas ring."
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Avatar name="Sam" tint="pink" size="sm" />
              <Avatar name="Priya Raman" tint="blue" size="md" />
              <Avatar name="Ana Lima" tint="amber" size="xl" />
            </div>
            <AvatarStack people={crowd} max={3} />
          </div>
        </Demo>
      </DemoGrid>

      <Demo
        title="List row"
        description="Avatar, name, one caption, tinted figure chip on the right. 64px, hairline between rows, hover fills grey with 10px radius."
      >
        <List>
          {balances.map((b) => (
            <ListRow
              key={b.id}
              href="#components"
              leading={<Avatar name={b.name} tint={b.tint} size="xl" />}
              title={b.name}
              caption={b.caption}
              trailing={<AmountChip amount={b.amount} />}
            />
          ))}
        </List>
      </Demo>

      <Demo
        title="Receipt line item and balance summary"
        description="The one card with a perforated edge. Tap a line to claim it: instant press, the checkmark fills brand, your share rolls. Space toggles a focused line."
      >
        <ClaimReceiptDemo />
      </Demo>

      <DemoGrid>
        <Demo title="Split stepper" description="“How many ways.” Arrow keys step; Home/End jump to 1 and 12.">
          <StepperDemo />
        </Demo>
        <Demo
          title="Tabs"
          description="Pill tabs on a grey track for top-level; underline tabs inside content. Arrow keys move; Enter selects."
        >
          <TabsDemo />
        </Demo>
      </DemoGrid>

      <DemoGrid>
        <Demo
          title="Toast"
          description="Floating white, tinted icon, one line, optional undo. Bottom-centre, 4s, Esc dismisses. Never stacks."
        >
          <ToastDemo />
        </Demo>
        <Demo
          title="Sheet / dialog"
          description="Bottom sheet on mobile, centred from 640px. White, 20px radius, shadow. Title, one paragraph, one primary, one text dismiss. Focus trapped; Esc closes."
        >
          <SheetDemo />
        </Demo>
      </DemoGrid>

      <DemoGrid>
        <Demo title="Empty state" description="A 3D moment on a tint, one sentence, one action. Centred in the space the content will take.">
          <EmptyState
            icon={{ moment: "receipt" }}
            message="Nothing owed, nothing owing. Enjoy it."
            action={
              <Button variant="elevated" size="md" className="text-small">
                Add a bill
              </Button>
            }
          />
        </Demo>
        <Demo title="Skeleton" description="Same heights and columns as the list row so nothing jumps. Pulses opacity.">
          <div className="grid">
            <ListRowSkeleton titleWidth="45%" captionWidth="30%" />
            <ListRowSkeleton titleWidth="60%" captionWidth="25%" />
            <ListRowSkeleton titleWidth="40%" captionWidth="35%" />
          </div>
        </Demo>
      </DemoGrid>

      <Demo
        title="Command menu"
        description="⌘K on desktop. Grouped rows with tinted icons, selected row in grey. ↑↓ move, Enter runs, Esc closes. Max 6 rows visible."
      >
        <CommandMenuDemo />
      </Demo>
    </DocSection>
  );
}
