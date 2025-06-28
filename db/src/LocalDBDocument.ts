import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import Database from "bun:sqlite";

export class LocalDBDocument {
  private readonly db = new Database("db.sqlite");
  async get(args: GetCommandInput): Promise<{ Item: any }> {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS ${args.TableName} (
          pk TEXT NOT NULL,
          sk TEXT NOT NULL,
          data TEXT,
          PRIMARY KEY (pk, sk)
        )`
    );

    const pk = args.Key!["$p"];
    const sk = args.Key!["$s"] || "_";

    const row = this.db
      .query(`SELECT data FROM ${args.TableName} WHERE pk = ? AND sk = ?`)
      .get(pk, sk) as { data?: string } | undefined;

    if (!row) {
      return { Item: undefined };
    }

    const data = row.data ? JSON.parse(row.data) : {};
    return {
      Item: {
        $p: pk,
        $s: sk,
        ...data,
      },
    };
  }

  async put(args: PutCommandInput): Promise<void> {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS ${args.TableName} (
          pk TEXT NOT NULL,
          sk TEXT NOT NULL,
          data TEXT,
          PRIMARY KEY (pk, sk)
        )`
    );

    const item = args.Item!;
    const pk = item["$p"];
    const sk = item["$s"] || "_";

    // $p, $s를 제외한 나머지 데이터
    const { $p: _p, $s: _s, ...data } = item;

    this.db
      .query(
        `INSERT OR REPLACE INTO ${args.TableName} (pk, sk, data) VALUES (?, ?, ?)`
      )
      .run(pk, sk, JSON.stringify(data));
  }

  async send(command: any) {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS ${command.input.TableName} (
          pk TEXT NOT NULL,
          sk TEXT NOT NULL,
          data TEXT,
          PRIMARY KEY (pk, sk)
        )`
    );

    if (command instanceof GetCommand) {
      const pk = command.input.Key!["$p"];
      const sk = command.input.Key!["$s"] || "_";

      const row = this.db
        .query(
          `SELECT data FROM ${command.input.TableName} WHERE pk = ? AND sk = ?`
        )
        .get(pk, sk) as { data: string } | undefined;

      if (!row) {
        return { Item: undefined };
      }

      const data = row.data ? JSON.parse(row.data) : {};
      return {
        Item: {
          $p: pk,
          $s: sk,
          ...data,
        },
      };
    }

    if (command instanceof PutCommand) {
      const item = command.input.Item!;
      const pk = item["$p"];
      const sk = item["$s"] || "_";

      // $p, $s를 제외한 나머지 데이터
      const { $p: _p, $s: _s, ...data } = item;

      this.db
        .query(
          `INSERT OR REPLACE INTO ${command.input.TableName} (pk, sk, data) VALUES (?, ?, ?)`
        )
        .run(pk, sk, JSON.stringify(data));

      return {};
    }

    throw new Error(`Not implemented: ${command.constructor.name}`);
  }
}
