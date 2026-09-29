import { Icon } from "@/components/icons/icon";
import { Avatar, avatarPixels } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { GroupArtTile, MomentTile } from "@/components/ui/icon-3d";
import { buddyShapes } from "@/lib/design-system/buddies";
import { groupArt, momentIcons } from "@/lib/design-system/icons3d";
import { DocSection, Eyebrow } from "../_components/doc";
import {
  buddyRules,
  buddySizes,
  buddySpecimens,
  buddyStack,
  flatIconSpecimens,
  groupArtCopy,
  groupArtSpecimens,
  iconTiersCopy,
  momentSpecimens,
} from "../_data";

function Intro({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="font-semibold">{title}</span>
      <span className="text-small text-text-2">{body}</span>
    </div>
  );
}

const artGrid = "m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-2 gap-y-4.5 p-0";

export function BuddiesSection() {
  return (
    <DocSection
      index={5}
      title="Buddies, groups & icons"
      description="Every person is a little character, not a pair of letters. Eight silhouettes, nine tints, one face."
      contentClassName="grid gap-9"
    >
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5 p-0">
        {buddySpecimens.map((b) => (
          <li key={b.shape} className="grid justify-items-center gap-2 rounded-tile bg-surface px-2 pt-4 pb-3">
            <Avatar name={b.name} tint={b.tint} buddy={b.shape} size="2xl" className="size-16" />
            <span className="grid justify-items-center">
              <span className="text-small font-semibold">{buddyShapes[b.shape].name}</span>
              <span className="text-caption font-normal text-muted">{buddyShapes[b.shape].trait}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
        <div>
          <Eyebrow>Sizes</Eyebrow>
          <div className="flex items-end gap-4">
            {buddySizes.map((size) => (
              <div key={size} className="grid justify-items-center gap-1.5">
                <Avatar name="Rithvik Kumar" tint="violet" buddy="miso" size={size} />
                <span className="text-caption font-normal text-muted">{avatarPixels[size]}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Eyebrow>
            Stack <span className="font-normal">· hover</span>
          </Eyebrow>
          <AvatarStack people={buddyStack} size="xl" />
        </div>
      </div>

      <div className="grid gap-3.5">
        <Intro {...groupArtCopy} />
        <ul className={artGrid}>
          {groupArtSpecimens.map(({ art, tint }) => (
            <li key={art} className="grid justify-items-center gap-2 text-center">
              <GroupArtTile name={groupArt[art]} art={art} tint={tint} size="lg" />
              <span className="text-caption font-normal text-text-2">{groupArt[art]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3.5">
        <Intro {...iconTiersCopy} />
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
          {flatIconSpecimens.map(({ icon, label }) => (
            <li key={icon} className="grid justify-items-center gap-2">
              <span className="grid size-11 place-items-center rounded-control bg-surface text-text">
                <Icon name={icon} size={22} />
              </span>
              <span className="text-caption font-normal text-text-2">{label}</span>
            </li>
          ))}
        </ul>
        <ul className={artGrid}>
          {momentSpecimens.map(({ icon, tint }) => (
            <li key={icon} className="grid justify-items-center gap-2 text-center">
              <MomentTile icon={icon} tint={tint} size="lg" />
              <span className="text-caption font-normal text-text-2">{momentIcons[icon]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-6 gap-y-5">
        {buddyRules.map((rule) => (
          <div key={rule.title} className="grid gap-1">
            <span className="text-small font-semibold">{rule.title}</span>
            <span className="text-small text-text-2">{rule.body}</span>
          </div>
        ))}
      </div>
    </DocSection>
  );
}
