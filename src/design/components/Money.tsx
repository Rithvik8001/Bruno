import { AnimatedMoney, type MoneySize } from "./AnimatedMoney";

export type { MoneySize };

export type MoneyProps = {
  amount: string;
  caption?: string;
  size?: MoneySize;
  animated?: boolean;
};

export function Money(props: MoneyProps) {
  return <AnimatedMoney {...props} />;
}
