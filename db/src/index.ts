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
        pk TEXT NOT NULL,
        sk TEXT NOT NULL,
        data TEXT,
        PRIMARY KEY (pk, sk)
      )`
    );

    if (command instanceof GetItemCommand) {
      const pk = command.input.Key!["$p"]?.S;
      const sk = command.input.Key!["$s"]?.S || "_";
      
      const row = await db.get(
        `SELECT data FROM ${command.input.TableName} WHERE pk = ? AND sk = ?`,
        [pk, sk]
      );
      
      if (!row) {
        return { Item: null };
      }
      
      const data = row.data ? JSON.parse(row.data) : {};
      return { 
        Item: {
          $p: { S: pk },
          $s: { S: sk },
          ...data
        }
      };
    }

    if (command instanceof PutItemCommand) {
      const item = command.input.Item!;
      const pk = item["$p"]?.S;
      const sk = item["$s"]?.S || "_";
      
      // $p, $s를 제외한 나머지 데이터
      const { $p: _p, $s: _s, ...data } = item;
      
      await db.run(
        `INSERT OR REPLACE INTO ${command.input.TableName} (pk, sk, data) VALUES (?, ?, ?)`,
        [pk, sk, JSON.stringify(data)]
      );
      
      return {};
    }

    throw new Error(`Not implemented: ${command.constructor.name}`);
  }
}
