import { Children, createContext, use, type ReactNode } from "react";
import { View } from "react-native";

import { Hairline } from "../primitives/Hairline";

const GroupContext = createContext(false);

export function useInGroup(): boolean {
  return use(GroupContext);
}

export type GroupProps = {
  children: ReactNode;
  inset?: number;
};

export function Group({ children, inset = 0 }: GroupProps) {
  const items = Children.toArray(children);

  return (
    <GroupContext value>
      <View>
        {items.map((item, index) => (
          <View key={index}>
            {index === 0 ? null : <Hairline inset={inset} />}
            {item}
          </View>
        ))}
        <Hairline />
      </View>
    </GroupContext>
  );
}
