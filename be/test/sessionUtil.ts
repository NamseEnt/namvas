import { ddb } from "../src/__generated/db";

export const setLoggedIn = (
  userId: string = "user-123",
  sessionId: string = "session-123"
) => {
  ddb.getSessionDoc = () =>
    Promise.resolve({
      id: sessionId,
      userId: userId,
      $v: 1,
    });
};

export const setLoggedOut = () => {
  ddb.getSessionDoc = () => Promise.resolve(undefined);
};
