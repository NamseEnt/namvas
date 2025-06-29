import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

export * as db from "./generated";

export const dbClient = DynamoDBDocument.from(new DynamoDBClient());
