import { ParsedSchema, DocumentDefinition, IndexDefinition, OwnershipRelation, FieldDefinition } from './schema-types.js';

function generateTransactionBuilderMethods(schema: ParsedSchema): string {
  const methods: string[] = [];
  
  // Generate create methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    
    // Check if this document has ownership relations
    const ownership = schema.ownerships.find(o => o.ownedDocument === docName);
    
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
  
  // Generate update methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const pkFields = findPrimaryKeyFields(docDef);
    
    if (pkFields.length === 0) continue;
    
    // Generate parameter for function-based updates
    let functionParams = '';
    let functionParamMappings = '';
    
    if (pkFields.length === 1) {
      const paramName = `${baseName}${capitalizeFirst(pkFields[0].name)}`;
      functionParams = `${paramName}?: ${getTypeScriptType(pkFields[0].type)}`;
      functionParamMappings = `        ${pkFields[0].name}: ${paramName}`;
    } else {
      // For composite keys, use individual parameters
      functionParams = pkFields.map(f => `${f.name}?: ${getTypeScriptType(f.type)}`).join(', ');
      functionParamMappings = pkFields.map(f => `        ${f.name}: ${f.name}`).join(',\n');
    }
    
    const functionCheck = pkFields.length === 1 
      ? `!${baseName}${capitalizeFirst(pkFields[0].name)}` 
      : pkFields.map(f => `!${f.name}`).join(' || ');
      
    const functionError = pkFields.length === 1
      ? `'${baseName}${capitalizeFirst(pkFields[0].name)} is required for function-based updates'`
      : `'${pkFields.map(f => f.name).join(' and ')} are required for function-based updates'`;
    
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
  
  // Generate delete methods
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const pkFields = findPrimaryKeyFields(docDef);
    
    if (pkFields.length === 0) continue;
    
    // Check if this document has indexes that need cleanup
    const relatedIndexes = Array.from(schema.indexes.values()).filter(idx => idx.itemDocument === docName);
    
    if (pkFields.length === 1) {
      const pkField = pkFields[0];
      if (relatedIndexes.length > 0) {
        // Need owner field for index cleanup
        const ownerField = findOwnerFieldFromSchema(docDef, schema.ownerships);
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
      const params = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
      const ops = pkFields.map(f => f.name).join(',\n      ');
      
      methods.push(`  delete${typeName}(${params}) {
    this.operations.push({ 
      _type: 'delete-${baseName}' as const, 
      ${ops}
    });
    return this;
  }`);
    }
  }
  
  return methods.join('\n  \n');
}

function findOwnerFieldFromSchema(docDef: DocumentDefinition, ownerships: OwnershipRelation[]): string | null {
  const ownership = ownerships.find(o => o.ownedDocument === docDef.name);
  return ownership ? ownership.ownerField : null;
}

export function generateSchemaCRUD(schema: ParsedSchema): string {
  let output = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type * as Schema from "../schema";
import { config } from "../config";
import { isLocalDev } from "../isLocalDev";

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
  endpoint: "http://localhost:4566",
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
  output += 'export const ddb = {\n';
  
  const functions: string[] = [];
  
  // Add the transaction write function first
  functions.push(generateTransactionWriteFunction(schema));
  
  // Add tx function that uses builder pattern
  functions.push(generateTxFunction());
  
  for (const [docName, docDef] of schema.documents) {
    const typeName = capitalizeFirst(docName);
    const pkFields = findPrimaryKeyFields(docDef);


    if (pkFields.length === 0) {
      console.warn(`No primary key found for document: ${docName}`);
      continue;
    }

    // Generate get function with migration
    functions.push(generateGetFunction(docName, typeName, pkFields));

    // Generate delete function
    functions.push(generateDeleteFunction(docName, typeName, pkFields, schema.indexes, schema));
    
    // Generate transaction item helper functions
    functions.push(generateTransactionHelperFunctions(docName, typeName, pkFields, schema.indexes, schema));
  }
  
  // Generate query functions for indexes
  for (const [indexName, indexDef] of schema.indexes) {
    const ownerDoc = schema.documents.get(indexDef.ownerDocument);
    const itemDoc = schema.documents.get(indexDef.itemDocument);
    
    if (ownerDoc && itemDoc) {
      functions.push(generateQueryFunction(indexName, indexDef, ownerDoc, itemDoc));
    }
  }
  
  // Generate transactional create functions for owned documents
  for (const ownership of schema.ownerships) {
    const ownerDoc = schema.documents.get(ownership.ownerDocument);
    const ownedDoc = schema.documents.get(ownership.ownedDocument);
    
    if (ownerDoc && ownedDoc) {
      functions.push(generateTransactionalCreateFunction(ownership, ownerDoc, ownedDoc));
      functions.push(generateTransactionalCreateHelperFunction(ownership, ownerDoc, ownedDoc));
    }
  }
  
  
  output += functions.join(',\n\n');
  output += '\n};\n';

  return output;
}


function generateGetFunction(docName: string, typeName: string, pkFields: any[]): string {
  const keyParams = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const keyObject = pkFields.map(f => f.name).join(', ');
  const keyString = pkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  
  return `  async get${typeName}({${keyObject}}: {${keyParams}}): Promise<Schema.${docName} | undefined> {
    const result = await client.get({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });
    
    if (!result.Item) {
      return undefined;
    }
    
    // Extract DynamoDB internal fields and return clean document with version
    const { $p, $s, ...cleanItem } = result.Item;
    return cleanItem as Schema.${docName};
  }`;
}


function generateDeleteFunction(docName: string, typeName: string, pkFields: any[], indexes: Map<string, IndexDefinition>, schema: ParsedSchema): string {
  const keyParams = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const keyObject = pkFields.map(f => f.name).join(', ');
  const keyString = pkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  
  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(idx => idx.itemDocument === docName);
  
  let deleteOperations = `    await client.delete({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });`;
  
  // Add index entry deletions for each related index
  if (relatedIndexes.length > 0) {
    const indexDeletes = relatedIndexes.map(index => {
      const ownership = schema.ownerships.find(o => o.ownedDocument === docName && o.ownerDocument === index.ownerDocument);
      const ownerField = ownership ? ownership.ownerField : findOwnerField(docName, index.ownerDocument);
      if (!ownerField) return '';
      
      return `
    
    // Delete index entry for ${index.name}
    // First get the item to find the owner field value
    const itemToDelete = await client.get({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });
    
    if (itemToDelete.Item) {
      await client.delete({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          $p: \`${index.ownerDocument}/id=\${itemToDelete.Item.${ownerField}}\`,
          $s: \`${docName}#\${${keyObject}}\`
        }
      });
    }`;
    }).filter(Boolean);
    
    if (indexDeletes.length > 0) {
      deleteOperations = `${indexDeletes.join('')}
    
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

function generateQueryFunction(indexName: string, indexDef: IndexDefinition, ownerDoc: DocumentDefinition, itemDoc: DocumentDefinition): string {
  // Generate function name from index name
  // e.g., "ArtworksOfUserIndex" -> "queryArtworksOfUser"
  const baseName = indexName.replace(/Index$/, '');
  const camelCaseName = 'query' + baseName.charAt(0).toUpperCase() + baseName.slice(1);
  
  // Find the primary key field(s) of the owner document
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);
  
  if (ownerPkFields.length === 0) {
    console.warn(`No primary key found for owner document: ${ownerDoc.name}`);
    return '';
  }

  // Create parameter list for owner's primary key
  const ownerKeyParams = ownerPkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const ownerKeyValues = ownerPkFields.map(f => f.name).join(', ');
  
  // Create the query key pattern
  const ownerKeyPattern = ownerPkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  
  // Extract the item document name without "Doc" suffix for the result type
  const itemTypeName = itemDoc.name.replace(/Doc$/, '');
  
  return `  async ${camelCaseName}({${ownerKeyValues}, nextToken}: {${ownerKeyParams}, nextToken?: string}): Promise<{items: Schema.${itemDoc.name}[], nextToken?: string}> {
    const result = await client.query({
      TableName: config.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: \`$p = :pk AND begins_with($s, :sk)\`,
      ExpressionAttributeValues: {
        ':pk': \`${ownerDoc.name}/${ownerKeyPattern}\`,
        ':sk': \`${itemDoc.name}#\`
      },
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    });
    
    const items = (result.Items || []).map(item => {
      const { $p, $s, ...rest } = item;
      return rest as Schema.${itemDoc.name};
    });
    
    const resultNextToken = result.LastEvaluatedKey ? 
      Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : 
      undefined;
    
    return {
      items,
      nextToken: resultNextToken
    };
  }`;
}


function generateTransactionalCreateFunction(ownership: OwnershipRelation, ownerDoc: DocumentDefinition, ownedDoc: DocumentDefinition): string {
  const ownedTypeName = capitalizeFirst(ownedDoc.name);
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);
  const ownedPkFields = findPrimaryKeyFields(ownedDoc);
  
  if (ownerPkFields.length === 0 || ownedPkFields.length === 0) {
    console.warn(`Cannot generate transactional create for ${ownedDoc.name}: missing primary keys`);
    return '';
  }

  // Generate owner parameter type
  const ownerKeyParams = ownerPkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const ownerKeyPattern = ownerPkFields.map(f => `${f.name}=\${owner.${f.name}}`).join('/');
  const ownedKeyPattern = ownedPkFields.map(f => `${f.name}=\${${ownedDoc.name}.${f.name}}`).join('/');
  
  // Create function name - use more descriptive naming
  const ownerBaseName = ownerDoc.name.replace(/Doc$/, '');
  const ownedBaseName = ownedDoc.name.replace(/Doc$/, '');
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
            $p: \`${ownedDoc.name}/${ownedKeyPattern.replace(ownedDoc.name, 'itemToCreate')}\`,
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
            $p: \`${ownerDoc.name}/${ownerKeyPattern}\`,
            $s: \`${ownedDoc.name}#\${itemToCreate.${ownedPkFields[0].name}}\`,
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

function generateTransactionHelperFunctions(docName: string, typeName: string, pkFields: any[], indexes: Map<string, IndexDefinition>, schema: ParsedSchema): string {
  const keyParams = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const keyObject = pkFields.map(f => f.name).join(', ');
  const keyString = pkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  const itemKeyString = pkFields.map(f => `${f.name}=\${${docName}.${f.name}}`).join('/');
  
  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(idx => idx.itemDocument === docName);
  
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
    const indexCreates = relatedIndexes.map(index => {
      const ownership = schema.ownerships.find(o => o.ownedDocument === docName && o.ownerDocument === index.ownerDocument);
      const ownerField = ownership ? ownership.ownerField : findOwnerField(docName, index.ownerDocument);
      if (!ownerField) return '';
      
      return `
    items.push({
      type: 'create',
      tableName: config.DYNAMODB_TABLE_NAME,
      item: {
        $p: \`${index.ownerDocument}/id=\${${docName}.${ownerField}}\`,
        $s: \`${docName}#\${${docName}.${pkFields[0].name}}\`,
        ...${docName}
      }
    });`;
    }).filter(Boolean);
    
    if (indexCreates.length > 0) {
      createItemsCode += indexCreates.join('');
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
    const indexDeletes = relatedIndexes.map(index => {
      const ownership = schema.ownerships.find(o => o.ownedDocument === docName && o.ownerDocument === index.ownerDocument);
      const ownerField = ownership ? ownership.ownerField : findOwnerField(docName, index.ownerDocument);
      if (!ownerField) return '';
      
      return `
    items.push({
      type: 'delete',
      tableName: config.DYNAMODB_TABLE_NAME,
      key: {
        $p: \`${index.ownerDocument}/id=\${existingItem.${ownerField}}\`,
        $s: \`${docName}#\${${keyObject}}\`
      }
    });`;
    }).filter(Boolean);
    
    if (indexDeletes.length > 0) {
      deleteItemsCode += indexDeletes.join('');
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

function generateTransactionalCreateHelperFunction(ownership: OwnershipRelation, ownerDoc: DocumentDefinition, ownedDoc: DocumentDefinition): string {
  const ownedTypeName = capitalizeFirst(ownedDoc.name);
  const ownerPkFields = findPrimaryKeyFields(ownerDoc);
  const ownedPkFields = findPrimaryKeyFields(ownedDoc);
  
  if (ownerPkFields.length === 0 || ownedPkFields.length === 0) {
    console.warn(`Cannot generate transactional create helper for ${ownedDoc.name}: missing primary keys`);
    return '';
  }

  // Generate owner parameter type
  const ownerKeyParams = ownerPkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const ownerKeyPattern = ownerPkFields.map(f => `${f.name}=\${owner.${f.name}}`).join('/');
  
  // Create function name
  const ownerBaseName = ownerDoc.name.replace(/Doc$/, '');
  const ownedBaseName = ownedDoc.name.replace(/Doc$/, '');
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
          Key: item.ConditionCheck.Key
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
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const pkFields = findPrimaryKeyFields(docDef);
    const ownership = schema.ownerships.find(o => o.ownedDocument === docName);
    
    if (pkFields.length === 0) continue;
    
    const keyPattern = pkFields.map(f => `${f.name}=\${${ownership ? baseName : 'op.data'}.${f.name}}`).join('/');
    
    if (ownership) {
      // Document with ownership relation
      const ownerField = ownership.ownerField;
      
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
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            // Index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${ownership.ownerDocument}/id=\${op.owner.id}\`,
                  $s: \`${docName}#\${${baseName}.${pkFields[0].name}}\`,
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
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            break;`);
    }
  }
  
  return cases.join('\n            \n');
}

function generateUpdateCases(schema: ParsedSchema): string {
  const cases: string[] = [];
  
  for (const [docName, docDef] of schema.documents) {
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const pkFields = findPrimaryKeyFields(docDef);
    const ownership = schema.ownerships.find(o => o.ownedDocument === docName);
    
    if (pkFields.length === 0) continue;
    
    const keyPattern = pkFields.map(f => `${f.name}=\${op.data.${f.name}}`).join('/');
    
    if (ownership) {
      // Document with ownership relation - need to update both main and index
      const ownerField = ownership.ownerField;
      
      cases.push(`          case 'update-${baseName}':
            const updated${capitalizeFirst(baseName)} = op.data;
            // Update main ${baseName} document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${docName}/${keyPattern.replace('op.data', `updated${capitalizeFirst(baseName)}`)}\`,
                  $s: '_',
                  ...updated${capitalizeFirst(baseName)}
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            // Update index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${ownership.ownerDocument}/id=\${updated${capitalizeFirst(baseName)}.${ownerField}}\`,
                  $s: \`${docName}#\${updated${capitalizeFirst(baseName)}.${pkFields[0].name}}\`,
                  ...updated${capitalizeFirst(baseName)}
                },
                ConditionExpression: 'attribute_exists($p)'
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
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;`);
    }
  }
  
  return cases.join('\n            \n');
}

function generateUpdateWithFunctionCases(schema: ParsedSchema): string {
  const cases: string[] = [];
  
  for (const [docName, docDef] of schema.documents) {
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const typeName = capitalizeFirst(docName);
    const pkFields = findPrimaryKeyFields(docDef);
    const ownership = schema.ownerships.find(o => o.ownedDocument === docName);
    
    if (pkFields.length === 0) continue;
    
    // Generate parameters for function call
    const getFuncParams = pkFields.length === 1 
      ? `{${pkFields[0].name}: op.${pkFields[0].name}}`
      : `{${pkFields.map(f => `${f.name}: op.${f.name}`).join(', ')}}`;
    
    const keyPattern = pkFields.map(f => `${f.name}=\${updated${capitalizeFirst(baseName)}FromFunction.${f.name}}`).join('/');
    
    if (ownership) {
      // Document with ownership relation
      const ownerField = ownership.ownerField;
      
      cases.push(`          case 'update-${baseName}-with-function':
            const current${capitalizeFirst(baseName)} = await this.get${typeName}(${getFuncParams});
            if (!current${capitalizeFirst(baseName)}) {
              throw new Error(\`${capitalizeFirst(baseName)} not found for function-based update: \${${pkFields.map(f => `op.${f.name}`).join(' + "/" + ')}}\`);
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
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': current${capitalizeFirst(baseName)}.$v }
              }
            });
            // Update index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`${ownership.ownerDocument}/id=\${updated${capitalizeFirst(baseName)}FromFunction.${ownerField}}\`,
                  $s: \`${docName}#\${updated${capitalizeFirst(baseName)}FromFunction.${pkFields[0].name}}\`,
                  ...updated${capitalizeFirst(baseName)}FromFunction,
                  $v: updated${capitalizeFirst(baseName)}FromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p)'
              }
            });
            break;`);
    } else {
      // Standalone document
      cases.push(`          case 'update-${baseName}-with-function':
            const current${capitalizeFirst(baseName)} = await this.get${typeName}(${getFuncParams});
            if (!current${capitalizeFirst(baseName)}) {
              throw new Error(\`${capitalizeFirst(baseName)} not found for function-based update: \${${pkFields.map(f => `op.${f.name}`).join(' + "/" + ')}}\`);
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
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': current${capitalizeFirst(baseName)}.$v }
              }
            });
            break;`);
    }
  }
  
  return cases.join('\n            \n');
}

function generateDeleteCases(schema: ParsedSchema): string {
  const cases: string[] = [];
  
  for (const [docName, docDef] of schema.documents) {
    const baseName = docName.replace(/Doc$/, '').toLowerCase();
    const pkFields = findPrimaryKeyFields(docDef);
    const ownership = schema.ownerships.find(o => o.ownedDocument === docName);
    
    if (pkFields.length === 0) continue;
    
    const keyPattern = pkFields.map(f => `${f.name}=\${op.${f.name}}`).join('/');
    
    if (ownership) {
      // Document with ownership relation
      const ownerField = ownership.ownerField;
      
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
                    $p: \`${ownership.ownerDocument}/id=\${op.${ownerField}}\`,
                    $s: \`${docName}#\${op.${pkFields[0].name}}\`
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
  
  return cases.join('\n            \n');
}

function getOwnerKeyString(schema: ParsedSchema, ownerDocName: string, ownerId: string): string {
  const ownerDoc = schema.documents.get(ownerDocName);
  if (!ownerDoc) return `id=${ownerId}`;
  
  const pkFields = findPrimaryKeyFields(ownerDoc);
  if (pkFields.length === 0) return `id=${ownerId}`;
  if (pkFields.length === 1) return `${pkFields[0].name}=${ownerId}`;
  
  // For composite keys, assume first field is the main identifier
  return `${pkFields[0].name}=${ownerId}`;
}

function findPrimaryKeyFields(docDef: DocumentDefinition): FieldDefinition[] {
  return docDef.fields.filter(f => f.isPrimaryKey);
}

function getTypeScriptType(fieldType: string): string {
  switch (fieldType) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'string[]': return 'string[]';
    case 'number[]': return 'number[]';
    case 'object': return 'object';
    default: return 'any';
  }
}

function findOwnerField(docName: string, ownerDocName: string): string | null {
  // Convert OwnerDoc to expected field patterns
  const ownerBaseName = ownerDocName.replace(/Doc$/, '');
  return ownerBaseName.toLowerCase() + 'Id';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}