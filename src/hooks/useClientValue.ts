import { useSyncExternalStore } from "react";

const neverChanges = () => () => {};

export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(neverChanges, read, () => serverValue);
}
