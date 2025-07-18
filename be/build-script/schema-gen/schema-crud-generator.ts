import {
  ParsedSchema,
  DocumentDefinition,
  IndexDefinition,
  OwnershipRelation,
  FieldDefinition,
} from "./schema-types.js";

function generateTransactionBuilderMethods(schema: ParsedSchema): string {
  const methods: string[] = [];

  // Generate create methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");

    // Check if this is a List type
    if (docDef.isList) {
      // For List types, pk is fixed and sk is required
      const listItemName = baseName + "item";
      methods.push(`  create${typeName}(${listItemName}: Omit<Schema.${docName}, '$v'>) {
    this.operations.push({ 
      _type: 'create-${baseName.toLowerCase()}' as const, 
      data: { ...${listItemName}, $v: 1 }
    });
    return this;
  }`);
    } else {
      // Check if this document has ownership relations
      const ownership = schema.ownerships.find(
        (o) => o.ownedDocument === docName
      );

      if (ownership) {
        // For owned documents, need owner parameter
        methods.push(`  create${typeName}(${baseName}: Omit<Schema.${docName}, '$v'>, forUser: {id: string}) {
    this.operations.push({ 
      _type: 'create-${baseName}' as const, 
      data: { ...${baseName}, $v: 1 }, 
      owner: forUser 
    });
    return this;
  }`);
      } else {
        // For standalone documents
        methods.push(`  create${typeName}(${baseName}: Omit<Schema.${docName}, '$v'>) {
    this.operations.push({ 
      _type: 'create-${baseName}' as const, 
      data: { ...${baseName}, $v: 1 }
    });
    return this;
  }`);
      }
    }
  }

  // Generate update methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);

    if (pkFields.length === 0 && !docDef.isList) continue;

    if (docDef.isList) {
      // For List types, fixed pk + sk pattern
      if (skFields.length === 0) {
        throw new Error(`List type ${docName} must have a sort key field`);
      }

      const skField = skFields[0];
      const listItemName = baseName + "item";
      const paramName = `${listItemName}${capitalizeFirst(skField.name)}`;

      methods.push(`  update${typeName}(${listItemName}OrUpdater: Schema.${docName} | ((${listItemName}: Schema.${docName}) => Schema.${docName}), ${paramName}?: ${getTypeScriptType(skField.type)}) {
    if (typeof ${listItemName}OrUpdater === 'function') {
      if (!${paramName}) {
        throw new Error('${paramName} is required for function-based updates');
      }
      this.operations.push({
        _type: 'update-${baseName.toLowerCase()}-with-function' as const,
        updater: ${listItemName}OrUpdater,
        ${skField.name}: ${paramName}
      });
      return this;
    } else {
      this.operations.push({
        _type: 'update-${baseName.toLowerCase()}' as const,
        data: { ...${listItemName}OrUpdater, $v: ${listItemName}OrUpdater.$v + 1 },
        expectedVersion: ${listItemName}OrUpdater.$v
      });
      return this;
    }
  }`);
    } else {
      // Regular document update logic
      // Generate parameter for function-based updates
      let functionParams = "";
      let functionParamMappings = "";

      if (pkFields.length === 1) {
        const paramName = `${baseName}${capitalizeFirst(pkFields[0].name)}`;
        functionParams = `${paramName}?: ${getTypeScriptType(pkFields[0].type)}`;
        functionParamMappings = `        ${pkFields[0].name}: ${paramName}`;
      } else {
        // For composite keys, use individual parameters
        functionParams = pkFields
          .map((f) => `${f.name}?: ${getTypeScriptType(f.type)}`)
          .join(", ");
        functionParamMappings = pkFields
          .map((f) => `        ${f.name}: ${f.name}`)
          .join(",\n");
      }

      const functionCheck =
        pkFields.length === 1
          ? `!${baseName}${capitalizeFirst(pkFields[0].name)}`
          : pkFields.map((f) => `!${f.name}`).join(" || ");

      const functionError =
        pkFields.length === 1
          ? `'${baseName}${capitalizeFirst(pkFields[0].name)} is required for function-based updates'`
          : `'${pkFields.map((f) => f.name).join(" and ")} are required for function-based updates'`;

      methods.push(`  update${typeName}(${baseName}OrUpdater: Schema.${docName} | ((${baseName}: Schema.${docName}) => Schema.${docName}), ${functionParams}) {
    if (typeof ${baseName}OrUpdater === 'function') {
      if (${functionCheck}) {
        throw new Error(${functionError});
      }
      this.operations.push({
        _type: 'update-${baseName}-with-function' as const,
        updater: ${baseName}OrUpdater,
${functionParamMappings}
      });
      return this;
    } else {
      this.operations.push({
        _type: 'update-${baseName}' as const,
        data: { ...${baseName}OrUpdater, $v: ${baseName}OrUpdater.$v + 1 },
        expectedVersion: ${baseName}OrUpdater.$v
      });
      return this;
    }
  }`);
    }
  }

  // Generate delete methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);

    if (pkFields.length === 0 && !docDef.isList) continue;

    if (docDef.isList) {
      // For List types, delete by sort key
      if (skFields.length === 0) {
        throw new Error(`List type ${docName} must have a sort key field`);
      }

      const skField = skFields[0];
      methods.push(`  delete${typeName}(${skField.name}: ${getTypeScriptType(skField.type)}) {
    this.operations.push({ 
      _type: 'delete-${baseName.toLowerCase()}' as const, 
      ${skField.name}
    });
    return this;
  }`);
    } else {
      // Regular document delete logic
      // Check if this document has indexes that need cleanup
      const relatedIndexes = Array.from(schema.indexes.values()).filter(
        (idx) => idx.itemDocument === docName
      );

      if (pkFields.length === 1) {
        const pkField = pkFields[0];
        if (relatedIndexes.length > 0) {
          // Need owner field for index cleanup
          const ownerField = findOwnerFieldFromSchema(
            docDef,
            schema.ownerships
          );
          if (ownerField) {
            methods.push(`  delete${typeName}(${pkField.name}: ${getTypeScriptType(pkField.type)}, ${ownerField}?: string) {
    this.operations.push({ 
      _type: 'delete-${baseName}' as const, 
      ${pkField.name},
      ${ownerField}
    });
    return this;
  }`);
          } else {
            methods.push(`  delete${typeName}(${pkField.name}: ${getTypeScriptType(pkField.type)}) {
    this.operations.push({ 
      _type: 'delete-${baseName}' as const, 
      ${pkField.name}
    });
    return this;
  }`);
          }
        } else {
          methods.push(`  delete${typeName}(${pkField.name}: ${getTypeScriptType(pkField.type)}) {
    this.operations.push({ 
      _type: 'delete-${baseName}' as const, 
      ${pkField.name}
    });
    return this;
  }`);
        }
      } else {
        // Composite primary key
        const params = pkFields
          .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
          .join(", ");
        const ops = pkFields.map((f) => f.name).join(",\n      ");

        methods.push(`  delete${typeName}(${params}) {
    this.operations.push({ 
      _type: 'delete-${baseName}' as const, 
      ${ops}
    });
    return this;
  }`);
      }
    }
  }

  return methods.join("\n  \n");
}

function findOwnerFieldFromSchema(
  docDef: DocumentDefinition,
  ownerships: OwnershipRelation[]
): string | null {
  const ownership = ownerships.find((o) => o.ownedDocument === docDef.name);
  return ownership ? ownership.ownerField : null;
}

export function generateSchemaCRUD(schema: ParsedSchema): string {
  let output = `import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type * as Schema from "../schema";
import { config } from "../config";
import { isLocalDev } from "../isLocalDev";

// Pagination token encryption/decryption
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function encryptPaginationToken(lastEvaluatedKey: Record<string, any>): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash("sha256").update(config.PAGINATION_ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(lastEvaluatedKey), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return Buffer.concat([iv, Buffer.from(encrypted, "hex")]).toString("base64");
}

function decryptPaginationToken(token: string): Record<string, any> {
  const data = Buffer.from(token, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const encrypted = data.subarray(IV_LENGTH).toString("hex");
  
  const key = crypto.createHash("sha256").update(config.PAGINATION_ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return JSON.parse(decrypted);
}

// Transaction item types
export type DbTransactionItem = 
  | { type: 'create'; tableName: string; item: any }
  | { type: 'delete'; tableName: string; key: any }
  | { type: 'update'; tableName: string; key: any; updateExpression: string; expressionAttributeNames?: any; expressionAttributeValues?: any }
  | { type: 'conditionCheck'; tableName: string; key: any; conditionExpression: string; expressionAttributeNames?: any; expressionAttributeValues?: any };

// Transaction builder for fluent API
class TransactionBuilder {
  private operations: any[] = [];
  
${generateTransactionBuilderMethods(schema)}
  
  getOperations() {
    return this.operations;
  }
}

const clientConfig = isLocalDev() ? {
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  }
} : {
  region: process.env.AWS_REGION || "us-east-1"
};

const client = DynamoDBDocument.from(new DynamoDBClient(clientConfig));

`;

  // Generate ddb object with CRUD functions
  output += "export const ddb = {\n";

  const functions: string[] = [];

  // Add the transaction write function first
  functions.push(generateTransactionWriteFunction(schema));

  // Add tx function that uses builder pattern
  functions.push(generateTxFunction());

  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);

    if (docDef.isList) {
      // List type handling
      if (skFields.length === 0) {
        throw new Error(`List type ${docName} must have a sort key field`);
      }

      // Generate List-specific functions
      functions.push(generateListGetFunction(docName, typeName, skFields[0]));
      functions.push(
        generateListUpdateFunction(docName, typeName, skFields[0])
      );
      functions.push(
        generateListDeleteFunction(docName, typeName, skFields[0])
      );
      functions.push(generateListQueryFunction(docName, typeName));
      functions.push(
        generateListTransactionHelperFunctions(docName, typeName, skFields[0])
      );
    } else {
      // Regular document handling
      if (pkFields.length === 0) {
        throw new Error(`No primary key found for document: ${docName}`);
      }

      // Generate get function with migration
      functions.push(generateGetFunction(docName, typeName, pkFields));

      // Generate update function
      functions.push(
        generateUpdateFunction(
          docName,
          typeName,
          pkFields,
          schema.indexes,
          schema
        )
      );

      // Generate delete function
      functions.push(
        generateDeleteFunction(
          docName,
          typeName,
          pkFields,
          schema.indexes,
          schema
        )
      );

      // Generate transaction item helper functions
      functions.push(
        generateTransactionHelperFunctions(
          docName,
          typeName,
          pkFields,
          schema.indexes,
          schema
        )
      );
    }
  }

  // Generate query functions for indexes
  for (const [indexName, indexDef] of schema.indexes) {
    const ownerDoc = schema.documents.get(indexDef.ownerDocument);
    const itemDoc = schema.documents.get(indexDef.itemDocument);

    if (ownerDoc && itemDoc) {
      functions.push(
        generateQueryFunction(indexName, indexDef, ownerDoc, itemDoc)
      );
    }
  }

  // Generate transactional create functions for owned documents
  for (const ownership of schema.ownerships) {
    const ownerDoc = schema.documents.get(ownership.ownerDocument);
    const ownedDoc = schema.documents.get(ownership.ownedDocument);

    if (ownerDoc && ownedDoc) {
      functions.push(
        generateTransactionalCreateFunction(
          ownership,
          ownerDoc,
          ownedDoc,
          schema
        )
      );
      functions.push(
        generateTransactionalCreateHelperFunction(ownership, ownerDoc, ownedDoc)
      );
    }
  }

  output += functions.join(",\n\n");
  output += "\n};\n";

  return output;
}

function generateGetFunction(
  docName: string,
  typeName: string,
  pkFields: any[]
): string {
  const keyParams = pkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const keyObject = pkFields.map((f) => f.name).join(", ");
  const keyString = pkFields.map((f) => `${f.name}=\${${f.name}}`).join("/");

  return `  async get${typeName}({${keyObject}}: {${keyParams}}): Promise<Schema.${docName} | undefined> {
    const result = await client.get({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      },
      ConsistentRead: true
    });
    
    if (!result.Item) {
      return undefined;
    }
    
    // Extract DynamoDB internal fields and return clean document with version
    const { $p, $s, ...cleanItem } = result.Item;
    return cleanItem as Schema.${docName};
  }`;
}

function generateUpdateFunction(
  docName: string,
  typeName: string,
  pkFields: any[],
  indexes: Map<string, IndexDefinition>,
  schema: ParsedSchema
): string {
  const baseName = docName.replace(/Doc$/, "").toLowerCase();
  const keyString = pkFields
    .map((f) => `${f.name}=\${${baseName}.${f.name}}`)
    .join("/");

  // Check if this document has ownership relations and indexes that need updating
  const relatedIndexes = Array.from(indexes.values()).filter(
    (idx) => idx.itemDocument === docName
  );
  const ownership = schema.ownerships.find((o) => o.ownedDocument === docName);

  let updateOperations = `    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: {
        $p: \`${docName}/${keyString}\`,
        $s: '_',
        ...${baseName}
      },
      ConditionExpression: 'attribute_exists(#p) AND #v = :expectedVersion',
      ExpressionAttributeNames: { '#p': '$p', '#v': '$v' },
      ExpressionAttributeValues: { ':expectedVersion': ${baseName}.$v }
    });`;

  // Add index entry updates for documents with ownership
  if (relatedIndexes.length > 0 && ownership) {
    const ownerField = ownership.ownerField;
    const sortKeyTemplate = pkFields
      .map((f) => `${f.name}=\${${baseName}.${f.name}}`)
      .join("/");

    const indexUpdates = relatedIndexes
      .map((index) => {
        return `
    
    // Update index entry for ${index.name}
    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: {
        $p: \`${index.name}/id=\${${baseName}.${ownerField}}\`,
        $s: \`${sortKeyTemplate}\`,
        ...${baseName}
      },
      ConditionExpression: 'attribute_exists(#p)',
      ExpressionAttributeNames: { '#p': '$p' }
    });`;
      })
      .join("");

    updateOperations = `${updateOperations}${indexUpdates}`;
  }

  return `  async update${typeName}(${baseName}: Schema.${docName}): Promise<void> {
${updateOperations}
  }`;
}

function generateDeleteFunction(
  docName: string,
  typeName: string,
  pkFields: any[],
  indexes: Map<string, IndexDefinition>,
  schema: ParsedSchema
): string {
  const keyParams = pkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const keyObject = pkFields.map((f) => f.name).join(", ");
  const keyString = pkFields.map((f) => `${f.name}=\${${f.name}}`).join("/");

  // Create sort key template for index entries
  const sortKeyTemplate = pkFields
    .map((f) => `${f.name}=\${${f.name}}`)
    .join("/");

  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(
    (idx) => idx.itemDocument === docName
  );

  let deleteOperations = `    await client.delete({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });`;

  // Add index entry deletions for each related index
  if (relatedIndexes.length > 0) {
    const indexDeletes = relatedIndexes
      .map((index) => {
        const ownership = schema.ownerships.find(
          (o) =>
            o.ownedDocument === docName &&
            o.ownerDocument === index.ownerDocument
        );
        const ownerField = ownership
          ? ownership.ownerField
          : findOwnerField(docName, index.ownerDocument);
        if (!ownerField) return "";

        return `
    
    // Delete index entry for ${index.name}
    // First get the item to find the owner field value
    const itemToDelete = await client.get({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      },
      ConsistentRead: true
    });
    
    if (itemToDelete.Item) {
      await client.delete({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          $p: \`${index.name}/id=\${itemToDelete.Item.${ownerField}}\`,
          $s: \`${sortKeyTemplate}\`
        }
      });
    }`;
      })
      .filter(Boolean);

    if (indexDeletes.length > 0) {
      deleteOperations = `${indexDeletes.join("")}
    
    await client.delete({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });`;
    }
  }

  return `  async delete${typeName}({${keyObject}}: {${keyParams}}): Promise<void> {
${deleteOperations}
  }`;
}

function generateQueryFunction(
  indexName: string,
  indexDef: IndexDefinition,
  ownerDoc: DocumentDefinition,
  itemDoc: DocumentDefinition
): string {
  // Generate function name from index name
  // e.g., "ArtworksOfUserIndex" -> "queryArtworksOfUser"
  const baseName = indexName.replace(/Index$/, "");
  const camelCaseName =
    "query" + baseName.charAt(0).toUpperCase() + baseName.slice(1);

  // Find the primary key field(s) of the owner document
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);

  if (ownerPkFields.length === 0) {
    throw new Error(
      `No primary key found for owner document: ${ownerDoc.name}`
    );
  }

  // Create parameter list for owner's primary key
  const ownerKeyParams = ownerPkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const ownerKeyValues = ownerPkFields.map((f) => f.name).join(", ");

  // Create the query key pattern
  const ownerKeyPattern = ownerPkFields
    .map((f) => `${f.name}=\${${f.name}}`)
    .join("/");

  // Extract the item document name without "Doc" suffix for the result type
  const itemTypeName = itemDoc.name.replace(/Doc$/, "");

  return `  async ${camelCaseName}({${ownerKeyValues}, nextToken, limit}: {${ownerKeyParams}, nextToken?: string, limit: number}): Promise<{items: Schema.${itemDoc.name}[], nextToken?: string}> {
    const result = await client.query({
      TableName: config.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: \`#p = :pk\`,
      ExpressionAttributeNames: {
        '#p': '$p'
      },
      ExpressionAttributeValues: {
        ':pk': \`${indexName}/${ownerKeyPattern}\`
      },
      ExclusiveStartKey: nextToken ? decryptPaginationToken(nextToken) : undefined,
      Limit: limit,
      ConsistentRead: true
    });
    
    const items = (result.Items || []).map(item => {
      const { $p, $s, ...rest } = item;
      return rest as Schema.${itemDoc.name};
    });
    
    const resultNextToken = result.LastEvaluatedKey ? 
      encryptPaginationToken(result.LastEvaluatedKey) : 
      undefined;
    
    return {
      items,
      nextToken: resultNextToken
    };
  }`;
}

function generateTransactionalCreateFunction(
  ownership: OwnershipRelation,
  ownerDoc: DocumentDefinition,
  ownedDoc: DocumentDefinition,
  schema: ParsedSchema
): string {
  const ownedTypeName = capitalizeFirst(ownedDoc.name);
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);
  const ownedPkFields = findPrimaryKeyFields(ownedDoc);

  // Find the corresponding index
  const index = Array.from(schema.indexes.values()).find(
    (idx) =>
      idx.ownerDocument === ownerDoc.name && idx.itemDocument === ownedDoc.name
  );

  if (!index) {
    throw new Error(
      `Cannot find index for ${ownerDoc.name} -> ${ownedDoc.name}`
    );
  }

  if (ownerPkFields.length === 0 || ownedPkFields.length === 0) {
    throw new Error(
      `Cannot generate transactional create for ${ownedDoc.name}: missing primary keys`
    );
  }

  // Generate owner parameter type
  const ownerKeyParams = ownerPkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const ownerKeyPattern = ownerPkFields
    .map((f) => `${f.name}=\${owner.${f.name}}`)
    .join("/");
  const ownedKeyPattern = ownedPkFields
    .map((f) => `${f.name}=\${${ownedDoc.name}.${f.name}}`)
    .join("/");

  // Create function name - use more descriptive naming
  const ownerBaseName = ownerDoc.name.replace(/Doc$/, "");
  const ownedBaseName = ownedDoc.name.replace(/Doc$/, "");
  const functionName = `create${ownedBaseName}For${ownerBaseName}`;

  return `  async ${functionName}(${ownedDoc.name}: Schema.${ownedDoc.name}, owner: {${ownerKeyParams}}): Promise<void> {
    // Ensure the owner field is set correctly
    const itemToCreate = {
      ...${ownedDoc.name},
      ${ownership.ownerField}: owner.${ownerPkFields[0].name}
    };
    
    const transactItems = [
      // Create the main document
      {
        Put: {
          TableName: config.DYNAMODB_TABLE_NAME,
          Item: {
            $p: \`${ownedDoc.name}/${ownedKeyPattern.replace(ownedDoc.name, "itemToCreate")}\`,
            $s: '_',
            ...itemToCreate
          }
        }
      },
      // Create the index entry
      {
        Put: {
          TableName: config.DYNAMODB_TABLE_NAME,
          Item: {
            $p: \`${index.name}/${ownerKeyPattern}\`,
            $s: \`${ownedPkFields.map((f) => `${f.name}=\${itemToCreate.${f.name}}`).join("/")}\`,
            ...itemToCreate
          }
        }
      }
    ];
    
    await client.transactWrite({
      TransactItems: transactItems
    });
  }`;
}

function generateTransactionHelperFunctions(
  docName: string,
  typeName: string,
  pkFields: any[],
  indexes: Map<string, IndexDefinition>,
  schema: ParsedSchema
): string {
  const keyParams = pkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const keyObject = pkFields.map((f) => f.name).join(", ");
  const keyString = pkFields.map((f) => `${f.name}=\${${f.name}}`).join("/");
  const itemKeyString = pkFields
    .map((f) => `${f.name}=\${${docName}.${f.name}}`)
    .join("/");

  // Create sort key template for index entries
  const sortKeyTemplateForDelete = pkFields
    .map((f) => `${f.name}=\${existingItem.${f.name}}`)
    .join("/");
  const sortKeyTemplateForCreate = pkFields
    .map((f) => `${f.name}=\${${docName}.${f.name}}`)
    .join("/");

  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(
    (idx) => idx.itemDocument === docName
  );

  let createItemsCode = `    const items: DbTransactionItem[] = [
      {
        type: 'create',
        tableName: config.DYNAMODB_TABLE_NAME,
        item: {
          $p: \`${docName}/${itemKeyString}\`,
          $s: '_',
          ...${docName}
        }
      }
    ];`;

  // Add index entries for create function
  if (relatedIndexes.length > 0) {
    const indexCreates = relatedIndexes
      .map((index) => {
        const ownership = schema.ownerships.find(
          (o) =>
            o.ownedDocument === docName &&
            o.ownerDocument === index.ownerDocument
        );
        const ownerField = ownership
          ? ownership.ownerField
          : findOwnerField(docName, index.ownerDocument);
        if (!ownerField) return "";

        return `
    items.push({
      type: 'create',
      tableName: config.DYNAMODB_TABLE_NAME,
      item: {
        $p: \`${index.name}/id=\${${docName}.${ownerField}}\`,
        $s: \`${sortKeyTemplateForCreate}\`,
        ...${docName}
      }
    });`;
      })
      .filter(Boolean);

    if (indexCreates.length > 0) {
      createItemsCode += indexCreates.join("");
    }
  }

  let deleteItemsCode = `    const items: DbTransactionItem[] = [];
    
    // First get the item to get owner info for index cleanup
    const existingItem = await this.get${typeName}({${keyObject}});
    if (!existingItem) {
      return items; // Nothing to delete
    }
    
    items.push({
      type: 'delete',
      tableName: config.DYNAMODB_TABLE_NAME,
      key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });`;

  // Add index cleanup for delete function
  if (relatedIndexes.length > 0) {
    const indexDeletes = relatedIndexes
      .map((index) => {
        const ownership = schema.ownerships.find(
          (o) =>
            o.ownedDocument === docName &&
            o.ownerDocument === index.ownerDocument
        );
        const ownerField = ownership
          ? ownership.ownerField
          : findOwnerField(docName, index.ownerDocument);
        if (!ownerField) return "";

        return `
    items.push({
      type: 'delete',
      tableName: config.DYNAMODB_TABLE_NAME,
      key: {
        $p: \`${index.name}/id=\${existingItem.${ownerField}}\`,
        $s: \`${sortKeyTemplateForDelete}\`
      }
    });`;
      })
      .filter(Boolean);

    if (indexDeletes.length > 0) {
      deleteItemsCode += indexDeletes.join("");
    }
  }

  return `  // Transaction helper functions for ${typeName}
  create${typeName}Item(${docName}: Schema.${docName}): DbTransactionItem[] {
${createItemsCode}
    return items;
  },
  
  async delete${typeName}Items({${keyObject}}: {${keyParams}}): Promise<DbTransactionItem[]> {
${deleteItemsCode}
    return items;
  }`;
}

function generateTransactionalCreateHelperFunction(
  ownership: OwnershipRelation,
  ownerDoc: DocumentDefinition,
  ownedDoc: DocumentDefinition
): string {
  const ownedTypeName = capitalizeFirst(ownedDoc.name);
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);
  const ownedPkFields = findPrimaryKeyFields(ownedDoc);

  if (ownerPkFields.length === 0 || ownedPkFields.length === 0) {
    throw new Error(
      `Cannot generate transactional create helper for ${ownedDoc.name}: missing primary keys`
    );
  }

  // Generate owner parameter type
  const ownerKeyParams = ownerPkFields
    .map((f) => `${f.name}: ${getTypeScriptType(f.type)}`)
    .join(", ");
  const ownerKeyPattern = ownerPkFields
    .map((f) => `${f.name}=\${owner.${f.name}}`)
    .join("/");

  // Create function name
  const ownerBaseName = ownerDoc.name.replace(/Doc$/, "");
  const ownedBaseName = ownedDoc.name.replace(/Doc$/, "");
  const functionName = `create${ownedBaseName}For${ownerBaseName}Item`;

  return `  // Transaction helper for creating ${ownedBaseName} with ownership
  ${functionName}(${ownedDoc.name}: Schema.${ownedDoc.name}, owner: {${ownerKeyParams}}): DbTransactionItem[] {
    // Ensure the owner field is set correctly
    const itemToCreate = {
      ...${ownedDoc.name},
      ${ownership.ownerField}: owner.${ownerPkFields[0].name}
    };
    
    return [
      // Create the main document
      {
        type: 'create',
        tableName: config.DYNAMODB_TABLE_NAME,
        item: {
          $p: \`${ownedDoc.name}/id=\${itemToCreate.${ownedPkFields[0].name}}\`,
          $s: '_',
          ...itemToCreate
        }
      },
      // Create the index entry
      {
        type: 'create',
        tableName: config.DYNAMODB_TABLE_NAME,
        item: {
          $p: \`${ownerDoc.name}/${ownerKeyPattern}\`,
          $s: \`${ownedDoc.name}#\${itemToCreate.${ownedPkFields[0].name}}\`,
          ...itemToCreate
        }
      }
    ];
  }`;
}

function generateTxFunction(): string {
  return `  // New fluent transaction API
  async tx(builderFn: (tx: TransactionBuilder) => TransactionBuilder): Promise<void> {
    const builder = new TransactionBuilder();
    const finalBuilder = builderFn(builder);
    const operations = finalBuilder.getOperations();
    
    return this.write(...operations);
  }`;
}

function generateTransactionWriteFunction(schema: ParsedSchema): string {
  const createCases = generateCreateCases(schema);
  const updateCases = generateUpdateCases(schema);
  const updateWithFunctionCases = generateUpdateWithFunctionCases(schema);
  const deleteCases = generateDeleteCases(schema);

  return `  async write(...operations: any[]): Promise<void> {
    if (operations.length === 0) {
      return;
    }
    
    if (operations.length > 100) {
      throw new Error('DynamoDB transactions support maximum 100 items');
    }
    
    const transactItems: any[] = [];
    
    for (const op of operations) {
      if (op._type) {
        // Handle simple transaction helpers
        switch (op._type) {
${createCases}
${updateCases}
${updateWithFunctionCases}
${deleteCases}
          default:
            throw new Error(\`Unknown simple transaction type: \${op._type}\`);
        }
      } else if (op.type) {
        // Handle raw DbTransactionItem (backward compatibility)
        switch (op.type) {
          case 'create':
            transactItems.push({
              Put: {
                TableName: op.tableName,
                Item: op.item
              }
            });
            break;
          case 'delete':
            transactItems.push({
              Delete: {
                TableName: op.tableName,
                Key: op.key
              }
            });
            break;
          case 'update':
            transactItems.push({
              Update: {
                TableName: op.tableName,
                Key: op.key,
                UpdateExpression: op.updateExpression,
                ExpressionAttributeNames: op.expressionAttributeNames,
                ExpressionAttributeValues: op.expressionAttributeValues
              }
            });
            break;
          case 'conditionCheck':
            transactItems.push({
              ConditionCheck: {
                TableName: op.tableName,
                Key: op.key,
                ConditionExpression: op.conditionExpression,
                ExpressionAttributeNames: op.expressionAttributeNames,
                ExpressionAttributeValues: op.expressionAttributeValues
              }
            });
            break;
          default:
            throw new Error(\`Unknown transaction item type: \${op.type}\`);
        }
      } else {
        throw new Error('Invalid transaction operation - missing type or _type');
      }
    }
    
    if (transactItems.length === 0) {
      return;
    } else if (transactItems.length === 1) {
      // Execute single operation directly (TransactWriteItems requires minimum 2 items)
      const item = transactItems[0];
      if (item.Put) {
        await client.put({
          TableName: item.Put.TableName,
          Item: item.Put.Item,
          ConditionExpression: item.Put.ConditionExpression,
          ExpressionAttributeNames: item.Put.ExpressionAttributeNames,
          ExpressionAttributeValues: item.Put.ExpressionAttributeValues
        });
      } else if (item.Update) {
        await client.update({
          TableName: item.Update.TableName,
          Key: item.Update.Key,
          UpdateExpression: item.Update.UpdateExpression,
          ConditionExpression: item.Update.ConditionExpression,
          ExpressionAttributeNames: item.Update.ExpressionAttributeNames,
          ExpressionAttributeValues: item.Update.ExpressionAttributeValues
        });
      } else if (item.Delete) {
        await client.delete({
          TableName: item.Delete.TableName,
          Key: item.Delete.Key,
          ConditionExpression: item.Delete.ConditionExpression,
          ExpressionAttributeNames: item.Delete.ExpressionAttributeNames,
          ExpressionAttributeValues: item.Delete.ExpressionAttributeValues
        });
      } else if (item.ConditionCheck) {
        // ConditionCheck can only be used in transactions, so we can't execute it alone
        // Convert to a get operation to check if condition would pass
        await client.get({
          TableName: item.ConditionCheck.TableName,
          Key: item.ConditionCheck.Key,
          ConsistentRead: true
        });
      }
    } else {
      // Execute as transaction (2 or more items)
      await client.transactWrite({
        TransactItems: transactItems
      });
    }
  }`;
}

function generateCreateCases(schema: ParsedSchema): string {
  const cases: string[] = [];

  for (const [docName, docDef] of schema.documents) {
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);
    const ownership = schema.ownerships.find(
      (o) => o.ownedDocument === docName
    );

    if (docDef.isList) {
      // List type handling
      if (skFields.length === 0) continue;

      const skField = skFields[0];
      const listName = docName; // e.g., 'PaymentVerifingOrderList'

      cases.push(`          case 'create-${baseName.toLowerCase()}':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: '${listName}',
                  $s: \`${skField.name}=\${op.data.${skField.name}}\`,
                  ...op.data
                },
                ConditionExpression: 'attribute_not_exists(#p) AND attribute_not_exists(#s)',
                ExpressionAttributeNames: { '#p': '$p', '#s': '$s' }
              }
            });
            break;`);
    } else {
      // Regular document handling
      if (pkFields.length === 0) continue;

      const keyPattern = pkFields
        .map(
          (f) => `${f.name}=\${${ownership ? baseName : "op.data"}.${f.name}}`
        )
        .join("/");

      if (ownership) {
        // Document with ownership relation
        const ownerField = ownership.ownerField;

        // Find the index for this ownership relation
        const indexForOwnership = Array.from(schema.indexes.values()).find(
          (index) =>
            index.ownerDocument === ownership.ownerDocument &&
            index.itemDocument === ownership.ownedDocument
        );
        const indexName = indexForOwnership
          ? indexForOwnership.name
          : `${ownership.ownedDocument.replace("Doc", "")}sOf${ownership.ownerDocument.replace("Doc", "")}Index`;

        cases.push(`          case 'create-${baseName}':
            const ${baseName} = { ...op.data, ${ownerField}: op.owner.id };
            // Main ${baseName} document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern.replace(baseName, baseName)}\`,
                  $s: '_',
                  ...${baseName}
                },
                ConditionExpression: 'attribute_not_exists(#p)',
                ExpressionAttributeNames: { '#p': '$p' }
              }
            });
            // Index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${indexName}/id=\${op.owner.id}\`,
                  $s: \`${pkFields.map((f) => `${f.name}=\${${baseName}.${f.name}}`).join("/")}\`,
                  ...${baseName}
                }
              }
            });
            break;`);
      } else {
        // Standalone document
        cases.push(`          case 'create-${baseName}':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_not_exists(#p)',
                ExpressionAttributeNames: { '#p': '$p' }
              }
            });
            break;`);
      }
    }
  }

  return cases.join("\n            \n");
}

function generateUpdateCases(schema: ParsedSchema): string {
  const cases: string[] = [];

  for (const [docName, docDef] of schema.documents) {
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);
    const ownership = schema.ownerships.find(
      (o) => o.ownedDocument === docName
    );

    if (docDef.isList) {
      // List type handling
      if (skFields.length === 0) continue;

      const skField = skFields[0];
      const listName = docName; // e.g., 'PaymentVerifingOrderList'

      cases.push(`          case 'update-${baseName.toLowerCase()}':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: '${listName}',
                  $s: \`${skField.name}=\${op.data.${skField.name}}\`,
                  ...op.data
                },
                ConditionExpression: 'attribute_exists(#p) AND attribute_exists(#s) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#s': '$s', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;`);
    } else {
      // Regular document handling
      if (pkFields.length === 0) continue;

      const keyPattern = pkFields
        .map((f) => `${f.name}=\${op.data.${f.name}}`)
        .join("/");

      if (ownership) {
        // Document with ownership relation - need to update both main and index
        const ownerField = ownership.ownerField;

        // Find the index for this ownership relation
        const indexForOwnership = Array.from(schema.indexes.values()).find(
          (index) =>
            index.ownerDocument === ownership.ownerDocument &&
            index.itemDocument === ownership.ownedDocument
        );
        const indexName = indexForOwnership
          ? indexForOwnership.name
          : `${ownership.ownedDocument.replace("Doc", "")}sOf${ownership.ownerDocument.replace("Doc", "")}Index`;

        cases.push(`          case 'update-${baseName}':
            const updated${capitalizeFirst(baseName)} = op.data;
            // Update main ${baseName} document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern.replace("op.data", `updated${capitalizeFirst(baseName)}`)}\`,
                  $s: '_',
                  ...updated${capitalizeFirst(baseName)}
                },
                ConditionExpression: 'attribute_exists(#p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            // Update index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${indexName}/id=\${updated${capitalizeFirst(baseName)}.${ownerField}}\`,
                  $s: \`${pkFields.map((f) => `${f.name}=\${updated${capitalizeFirst(baseName)}.${f.name}}`).join("/")}\`,
                  ...updated${capitalizeFirst(baseName)}
                },
                ConditionExpression: 'attribute_exists(#p)',
                ExpressionAttributeNames: { '#p': '$p' }
              }
            });
            break;`);
      } else {
        // Standalone document
        cases.push(`          case 'update-${baseName}':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_exists(#p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;`);
      }
    }
  }

  return cases.join("\n            \n");
}

function generateUpdateWithFunctionCases(schema: ParsedSchema): string {
  const cases: string[] = [];

  for (const [docName, docDef] of schema.documents) {
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const typeName = capitalizeFirst(docName);
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);
    const ownership = schema.ownerships.find(
      (o) => o.ownedDocument === docName
    );

    if (docDef.isList) {
      // List type handling
      if (skFields.length === 0) continue;

      const skField = skFields[0];
      const listName = docName; // e.g., 'PaymentVerifingOrderList'
      const getFuncParams = `{${skField.name}: op.${skField.name}}`;

      const listItemName = baseName + "item";

      cases.push(`          case 'update-${baseName.toLowerCase()}-with-function':
            const current${capitalizeFirst(listItemName)} = await this.get${typeName}(${getFuncParams});
            if (!current${capitalizeFirst(listItemName)}) {
              throw new Error(\`${capitalizeFirst(listItemName)} not found for function-based update: \${op.${skField.name}}\`);
            }
            const updated${capitalizeFirst(listItemName)}FromFunction = op.updater(current${capitalizeFirst(listItemName)});
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: '${listName}',
                  $s: \`${skField.name}=\${updated${capitalizeFirst(listItemName)}FromFunction.${skField.name}}\`,
                  ...updated${capitalizeFirst(listItemName)}FromFunction,
                  $v: updated${capitalizeFirst(listItemName)}FromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists(#p) AND attribute_exists(#s) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#s': '$s', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': current${capitalizeFirst(listItemName)}.$v }
              }
            });
            break;`);
    } else {
      // Regular document handling
      if (pkFields.length === 0) continue;

      // Generate parameters for function call
      const getFuncParams =
        pkFields.length === 1
          ? `{${pkFields[0].name}: op.${pkFields[0].name}}`
          : `{${pkFields.map((f) => `${f.name}: op.${f.name}`).join(", ")}}`;

      const keyPattern = pkFields
        .map(
          (f) =>
            `${f.name}=\${updated${capitalizeFirst(baseName)}FromFunction.${f.name}}`
        )
        .join("/");

      if (ownership) {
        // Document with ownership relation
        const ownerField = ownership.ownerField;

        // Find the index for this ownership relation
        const indexForOwnership = Array.from(schema.indexes.values()).find(
          (index) =>
            index.ownerDocument === ownership.ownerDocument &&
            index.itemDocument === ownership.ownedDocument
        );
        const indexName = indexForOwnership
          ? indexForOwnership.name
          : `${ownership.ownedDocument.replace("Doc", "")}sOf${ownership.ownerDocument.replace("Doc", "")}Index`;

        cases.push(`          case 'update-${baseName}-with-function':
            const current${capitalizeFirst(baseName)} = await this.get${typeName}(${getFuncParams});
            if (!current${capitalizeFirst(baseName)}) {
              throw new Error(\`${capitalizeFirst(baseName)} not found for function-based update: \${${pkFields.map((f) => `op.${f.name}`).join(' + "/" + ')}}\`);
            }
            const updated${capitalizeFirst(baseName)}FromFunction = op.updater(current${capitalizeFirst(baseName)});
            // Update main ${baseName} document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_',
                  ...updated${capitalizeFirst(baseName)}FromFunction,
                  $v: updated${capitalizeFirst(baseName)}FromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists(#p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': current${capitalizeFirst(baseName)}.$v }
              }
            });
            // Update index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${indexName}/id=\${updated${capitalizeFirst(baseName)}FromFunction.${ownerField}}\`,
                  $s: \`${pkFields.map((f) => `${f.name}=\${updated${capitalizeFirst(baseName)}FromFunction.${f.name}}`).join("/")}\`,
                  ...updated${capitalizeFirst(baseName)}FromFunction,
                  $v: updated${capitalizeFirst(baseName)}FromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists(#p)',
                ExpressionAttributeNames: { '#p': '$p' }
              }
            });
            break;`);
      } else {
        // Standalone document
        cases.push(`          case 'update-${baseName}-with-function':
            const current${capitalizeFirst(baseName)} = await this.get${typeName}(${getFuncParams});
            if (!current${capitalizeFirst(baseName)}) {
              throw new Error(\`${capitalizeFirst(baseName)} not found for function-based update: \${${pkFields.map((f) => `op.${f.name}`).join(' + "/" + ')}}\`);
            }
            const updated${capitalizeFirst(baseName)}FromFunction = op.updater(current${capitalizeFirst(baseName)});
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_',
                  ...updated${capitalizeFirst(baseName)}FromFunction,
                  $v: updated${capitalizeFirst(baseName)}FromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists(#p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#p': '$p', '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': current${capitalizeFirst(baseName)}.$v }
              }
            });
            break;`);
      }
    }
  }

  return cases.join("\n            \n");
}

function generateDeleteCases(schema: ParsedSchema): string {
  const cases: string[] = [];

  for (const [docName, docDef] of schema.documents) {
    const baseName = docName
      .replace(/Doc$/, "")
      .toLowerCase()
      .replace(/list$/, "");
    const pkFields = findPrimaryKeyFields(docDef);
    const skFields = findSortKeyFields(docDef);
    const ownership = schema.ownerships.find(
      (o) => o.ownedDocument === docName
    );

    if (docDef.isList) {
      // List type handling
      if (skFields.length === 0) continue;

      const skField = skFields[0];
      const listName = docName; // e.g., 'PaymentVerifingOrderList'

      cases.push(`          case 'delete-${baseName.toLowerCase()}':
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: '${listName}',
                  $s: \`${skField.name}=\${op.${skField.name}}\`
                }
              }
            });
            break;`);
    } else {
      // Regular document handling
      if (pkFields.length === 0) continue;

      const keyPattern = pkFields
        .map((f) => `${f.name}=\${op.${f.name}}`)
        .join("/");

      if (ownership) {
        // Document with ownership relation
        const ownerField = ownership.ownerField;

        // Find the index for this ownership relation
        const indexForOwnership = Array.from(schema.indexes.values()).find(
          (index) =>
            index.ownerDocument === ownership.ownerDocument &&
            index.itemDocument === ownership.ownedDocument
        );
        const indexName = indexForOwnership
          ? indexForOwnership.name
          : `${ownership.ownedDocument.replace("Doc", "")}sOf${ownership.ownerDocument.replace("Doc", "")}Index`;

        cases.push(`          case 'delete-${baseName}':
            // Delete main document (no error if not exists)
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_'
                }
              }
            });
            // Delete index entry if ${ownerField} is provided
            if (op.${ownerField}) {
              transactItems.push({
                Delete: {
                  TableName: config.DYNAMODB_TABLE_NAME,
                  Key: {
                    $p: \`${indexName}/id=\${op.${ownerField}}\`,
                    $s: \`${pkFields.map((f) => `${f.name}=\${op.${f.name}}`).join("/")}\`
                  }
                }
              });
            }
            break;`);
      } else {
        // Standalone document
        cases.push(`          case 'delete-${baseName}':
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`${docName}/${keyPattern}\`,
                  $s: '_'
                }
              }
            });
            break;`);
      }
    }
  }

  return cases.join("\n            \n");
}

function getOwnerKeyString(
  schema: ParsedSchema,
  ownerDocName: string,
  ownerId: string
): string {
  const ownerDoc = schema.documents.get(ownerDocName);
  if (!ownerDoc) return `id=${ownerId}`;

  const pkFields = findPrimaryKeyFields(ownerDoc);
  if (pkFields.length === 0) return `id=${ownerId}`;
  if (pkFields.length === 1) return `${pkFields[0].name}=${ownerId}`;

  // For composite keys, assume first field is the main identifier
  return `${pkFields[0].name}=${ownerId}`;
}

function findPrimaryKeyFields(docDef: DocumentDefinition): FieldDefinition[] {
  return docDef.fields.filter((f) => f.isPrimaryKey);
}

function findSortKeyFields(docDef: DocumentDefinition): FieldDefinition[] {
  return docDef.fields.filter((f) => f.isSortKey);
}

function getTypeScriptType(fieldType: string): string {
  switch (fieldType) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "string[]":
      return "string[]";
    case "number[]":
      return "number[]";
    case "object":
      return "object";
    default:
      return "any";
  }
}

function findOwnerField(docName: string, ownerDocName: string): string | null {
  // Convert OwnerDoc to expected field patterns
  const ownerBaseName = ownerDocName.replace(/Doc$/, "");
  return ownerBaseName.toLowerCase() + "Id";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// List-specific function generators
function generateListGetFunction(
  docName: string,
  typeName: string,
  skField: FieldDefinition
): string {
  const listName = docName; // e.g., 'PaymentVerifingOrderList'
  const skParam = `${skField.name}: ${getTypeScriptType(skField.type)}`;

  return `  async get${typeName}({${skField.name}}: {${skParam}}): Promise<Schema.${docName} | undefined> {
    const result = await client.get({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: '${listName}',
        $s: \`${skField.name}=\${${skField.name}}\`
      },
      ConsistentRead: true
    });
    
    if (!result.Item) {
      return undefined;
    }
    
    // Extract DynamoDB internal fields and return clean document with version
    const { $p, $s, ...cleanItem } = result.Item;
    return cleanItem as Schema.${docName};
  }`;
}

function generateListUpdateFunction(
  docName: string,
  typeName: string,
  skField: FieldDefinition
): string {
  const listName = docName; // e.g., 'PaymentVerifingOrderList'
  const baseName = docName.replace(/List$/, "").toLowerCase();
  const listItemName = baseName + "item";

  return `  async update${typeName}(${listItemName}: Schema.${docName}): Promise<void> {
    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: {
        $p: '${listName}',
        $s: \`${skField.name}=\${${listItemName}.${skField.name}}\`,
        ...${listItemName}
      },
      ConditionExpression: 'attribute_exists(#p) AND attribute_exists(#s) AND #v = :expectedVersion',
      ExpressionAttributeNames: { '#p': '$p', '#s': '$s', '#v': '$v' },
      ExpressionAttributeValues: { ':expectedVersion': ${listItemName}.$v }
    });
  }`;
}

function generateListDeleteFunction(
  docName: string,
  typeName: string,
  skField: FieldDefinition
): string {
  const listName = docName; // e.g., 'PaymentVerifingOrderList'
  const skParam = `${skField.name}: ${getTypeScriptType(skField.type)}`;

  return `  async delete${typeName}({${skField.name}}: {${skParam}}): Promise<void> {
    await client.delete({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: '${listName}',
        $s: \`${skField.name}=\${${skField.name}}\`
      }
    });
  }`;
}

function generateListQueryFunction(docName: string, typeName: string): string {
  const listName = docName; // e.g., 'PaymentVerifingOrderList'
  const functionName = `query${typeName}`;

  return `  async ${functionName}({nextToken, limit}: {nextToken?: string, limit: number}): Promise<{items: Schema.${docName}[], nextToken?: string}> {
    const result = await client.query({
      TableName: config.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: \`#p = :pk\`,
      ExpressionAttributeNames: {
        '#p': '$p'
      },
      ExpressionAttributeValues: {
        ':pk': '${listName}'
      },
      ExclusiveStartKey: nextToken ? decryptPaginationToken(nextToken) : undefined,
      Limit: limit,
      ConsistentRead: true
    });
    
    const items = (result.Items || []).map(item => {
      const { $p, $s, ...rest } = item;
      return rest as Schema.${docName};
    });
    
    const resultNextToken = result.LastEvaluatedKey ? 
      encryptPaginationToken(result.LastEvaluatedKey) : 
      undefined;
    
    return {
      items,
      nextToken: resultNextToken
    };
  }`;
}

function generateListTransactionHelperFunctions(
  docName: string,
  typeName: string,
  skField: FieldDefinition
): string {
  const listName = docName; // e.g., 'PaymentVerifingOrderList'
  const baseName = docName.replace(/List$/, "").toLowerCase();
  const listItemName = baseName + "item";
  const itemKeyString = `${skField.name}=\${${listItemName}.${skField.name}}`;
  const skParam = `${skField.name}: ${getTypeScriptType(skField.type)}`;

  return `  // Transaction helper functions for ${typeName}
  create${typeName}Item(${listItemName}: Schema.${docName}): DbTransactionItem[] {
    const items: DbTransactionItem[] = [
      {
        type: 'create',
        tableName: config.DYNAMODB_TABLE_NAME,
        item: {
          $p: '${listName}',
          $s: \`${itemKeyString}\`,
          ...${listItemName}
        }
      }
    ];
    return items;
  },
  
  delete${typeName}Item({${skField.name}}: {${skParam}}): DbTransactionItem[] {
    const items: DbTransactionItem[] = [
      {
        type: 'delete',
        tableName: config.DYNAMODB_TABLE_NAME,
        key: {
          $p: '${listName}',
          $s: \`${skField.name}=\${${skField.name}}\`
        }
      }
    ];
    return items;
  }`;
}
