import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

export function getDbClient(isProduction: boolean): DynamoDBClient {
  return isProduction ? new DynamoDBClient() : new LocalDbClient();
}

class LocalDbClient extends DynamoDBClient {
  private readonly db: Promise<Database>;
  constructor() {
    super();
    this.db = open({
      filename: "/tmp/db.sqlite",
      driver: sqlite3.Database,
    });
  }
  async send(command: any) {
    const db = await this.db;

    await db.exec(
      `CREATE TABLE IF NOT EXISTS ${command.input.TableName} (
        key TEXT PRIMARY KEY,
        value TEXT)`
    );

    if (command instanceof GetItemCommand) {
      const key = Object.entries(command.input.Key!)
        .map(([key, value]) => [key, value.S])
        .join("_");
      const item = await db.get(
        `SELECT value FROM ${command.input.TableName} WHERE key = ${key}`
      );
      return { Item: item ? JSON.parse(item.value) : null };
    }

    if (command instanceof PutItemCommand) {
      const key = Object.entries(command.input.Item!)
        .map(([key, value]) => [key, value.S])
        .join("_");
      const value = JSON.stringify(command.input.Item);
      await db.run(
        `INSERT INTO ${command.input.TableName} (key, value) VALUES (${key}, ${value})`
      );
    }

    throw new Error(`Not implemented: ${command.name}`);
  }
}
