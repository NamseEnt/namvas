/**
 * LLRT-compatible LocalDBDocument implementation
 * Uses in-memory Map for simple key-value storage instead of SQLite
 */

import {
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";

interface TableData {
  [key: string]: any;
}

export class LocalDBDocumentLLRT {
  private readonly storage = new Map<string, Map<string, TableData>>();

  private getTable(tableName: string): Map<string, TableData> {
    if (!this.storage.has(tableName)) {
      this.storage.set(tableName, new Map());
    }
    return this.storage.get(tableName)!;
  }

  private makeKey(pk: string, sk: string = "_"): string {
    return `${pk}#${sk}`;
  }

  async get(args: GetCommandInput): Promise<{ Item: any }> {
    const table = this.getTable(args.TableName!);
    const pk = args.Key!["$p"];
    const sk = args.Key!["$s"] || "_";
    const key = this.makeKey(pk, sk);
    
    const item = table.get(key);
    
    if (!item) {
      return { Item: undefined };
    }

    return {
      Item: {
        $p: pk,
        $s: sk,
        ...item,
      },
    };
  }

  async put(args: PutCommandInput): Promise<void> {
    const table = this.getTable(args.TableName!);
    const item = args.Item!;
    const pk = item["$p"];
    const sk = item["$s"] || "_";
    const key = this.makeKey(pk, sk);

    // $p, $s를 제외한 나머지 데이터
    const { $p: _p, $s: _s, ...data } = item;
    
    table.set(key, data);
  }

  async send(command: any) {
    if (command instanceof GetCommand) {
      return this.get(command.input);
    }

    if (command instanceof PutCommand) {
      await this.put(command.input);
      return {};
    }

    throw new Error(`Not implemented: ${command.constructor.name}`);
  }

  async query(args: any): Promise<{ Items: any[] }> {
    const table = this.getTable(args.TableName);
    const pk = args.ExpressionAttributeValues[':pk'];
    
    const items: any[] = [];
    
    for (const [key, data] of table.entries()) {
      const [itemPk, itemSk] = key.split('#');
      if (itemPk === pk) {
        items.push({
          $p: itemPk,
          $s: itemSk,
          ...data,
        });
      }
    }

    return { Items: items };
  }

  // Helper method to clear all data (useful for testing)
  clear(): void {
    this.storage.clear();
  }

  // Helper method to get storage stats (useful for debugging)
  getStats(): { tables: number; totalItems: number } {
    let totalItems = 0;
    for (const table of this.storage.values()) {
      totalItems += table.size;
    }
    return {
      tables: this.storage.size,
      totalItems,
    };
  }
}