export type ApiSpec = {
  getMe: {
    req: {};
    res:
      | {
          ok: true;
          tosAgreed: boolean;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  loginWithGoogle: {
    req: {
      authorizationCode: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "INVALID_CODE" | "GOOGLE_API_ERROR";
        };
  };
};
