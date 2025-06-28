import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LocalDBDocument } from "./LocalDBDocument";

export const dbClient = process.env.LAMBDA
  ? DynamoDBDocument.from(new DynamoDBClient())
  : new LocalDBDocument();
export * from "./generated";
