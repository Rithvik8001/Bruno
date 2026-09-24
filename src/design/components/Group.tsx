import { Children, createContext, use, type ReactNode } from "react";
import { View } from "react-native";

const GroupContext = createContext(false);

export function useInGroup(): boolean {
  return use(GroupContext);
}

export type GroupProps = {
  children: ReactNode;
};

export function Group({ children }: GroupProps) {
  const items = Children.toArray(children);

  return (
    <GroupContext value>
      <View>
        {items.map((item, index) => (
          <View key={index}>{item}</View>
        ))}
      </View>
    </GroupContext>
  );
}
