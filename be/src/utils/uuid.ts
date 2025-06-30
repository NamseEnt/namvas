import { v7 } from "llrt:uuid";

export const generateId = (): string => {
  return v7();
};
