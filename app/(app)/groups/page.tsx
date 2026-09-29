import type { Metadata } from "next";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { listGroupsFor } from "@/lib/groups/queries";
import { groupsCopy } from "./_data";
import { GroupCard } from "./_components/group-card";
import { GroupsView } from "./_components/groups-view";

export const metadata: Metadata = { title: groupsCopy.metaTitle };

export default async function GroupsPage() {
  const { person } = await requireAppContext(routes.groups);
  const groups = await listGroupsFor(person.id);

  return (
    <GroupsView hasGroups={groups.length > 0}>
      <Stagger as="ul" className="m-0 grid list-none gap-2.5 p-0">
        {groups.map((group) => (
          <StaggerItem as="li" key={group.id}>
            <GroupCard group={group} />
          </StaggerItem>
        ))}
      </Stagger>
    </GroupsView>
  );
}
