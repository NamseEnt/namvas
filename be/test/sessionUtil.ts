import { ddb } from "../src/__generated/db";

export const setLoggedIn = (
  userId: string = "user-123",
  sessionId: string = "session-123"
) => {
  ddb.getSession = () =>
    Promise.resolve({
      id: sessionId,
      userId: userId,
    });
};

export const setLoggedOut = () => {
  ddb.getSession = () => Promise.resolve(undefined);
};
