export type ApiRequest = {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  url?: string;
};
