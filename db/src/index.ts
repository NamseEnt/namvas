import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Only import LocalDBDocument in non-Lambda environments
let LocalDBDocument: any;
if (!process.env.LAMBDA) {
  try {
    ({ LocalDBDocument } = await import("./LocalDBDocument"));
  } catch (error) {
    console.warn("LocalDBDocument not available in this environment");
  }
}

export const dbClient = process.env.LAMBDA
  ? DynamoDBDocument.from(new DynamoDBClient())
  : new LocalDBDocument();

export * from "./generated";
