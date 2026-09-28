import { homeCopy } from "../_data";

const FRIDAY = 5;

export function greetingFor(date: Date, firstName: string): string {
  const hour = date.getHours();
  const { greetings } = homeCopy;
  const word =
    hour >= 23 || hour < 5
      ? greetings.late
      : hour < 12
        ? greetings.morning
        : date.getDay() === FRIDAY && hour >= 17
          ? greetings.friday
          : hour < 18
            ? greetings.afternoon
            : greetings.evening;
  return `${word}, ${firstName}`;
}
