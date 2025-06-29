import { uuidv7 } from "llrt:uuid";

export const generateId = (): string => {
  return uuidv7();
};