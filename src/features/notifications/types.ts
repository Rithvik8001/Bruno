export type PushPermissionStatus = "granted" | "denied" | "undetermined";

export type PushPermission = {
  status: PushPermissionStatus;
  canAskAgain: boolean;
};

const firstHour = 6;
const lastHour = 23;

function range(from: number, to: number): readonly number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export const sendHourOptions = range(firstHour, lastHour - 1);
export const secondHourOptions = range(firstHour + 1, lastHour);
