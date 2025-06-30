declare module "llrt:uuid" {
  type UUID = `${string}-${string}-${string}-${string}-${string}`;
  
  /**
   * Generates a random RFC 4122 version 7 UUID.
   * Version 7 UUIDs are time-ordered and contain a Unix timestamp.
   */
  export function v7(): UUID;
}