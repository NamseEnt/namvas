export function isLocalDev(): boolean {
  return process.env.LOCAL_DEV === "1";
}
