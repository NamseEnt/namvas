import { SchemaEvolution, DocumentDefinition, IndexDefinition, OwnershipRelation } from './evolution-types.js';

export function generateEvolutionCRUD(evolution: SchemaEvolution): string {
  let output = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type * as Schema from "../schema";
import { config } from "../config";
import { isLocalDev } from "../isLocalDev";

// Transaction item types
export type DbTransactionItem = 
  | { type: 'put'; tableName: string; item: any }
  | { type: 'delete'; tableName: string; key: any }
  | { type: 'update'; tableName: string; key: any; updateExpression: string; expressionAttributeNames?: any; expressionAttributeValues?: any }
  | { type: 'conditionCheck'; tableName: string; key: any; conditionExpression: string; expressionAttributeNames?: any; expressionAttributeValues?: any };

// Transaction builder for fluent API
class TransactionBuilder {
  private operations: any[] = [];
  
  // Create operations (fail if exists)
  createUser(user: Omit<Schema.UserDoc, '$v'>) {
    this.operations.push({ 
      _type: 'create-user' as const, 
      data: { ...user, $v: 1 }
    });
    return this;
  }
  
  createArtwork(artwork: Omit<Schema.ArtworkDoc, '$v'>, forUser: {id: string}) {
    this.operations.push({ 
      _type: 'create-artwork' as const, 
      data: { ...artwork, $v: 1 }, 
      owner: forUser 
    });
    return this;
  }
  
  createSession(session: Omit<Schema.SessionDoc, '$v'>) {
    this.operations.push({ 
      _type: 'create-session' as const, 
      data: { ...session, $v: 1 }
    });
    return this;
  }
  
  createIdentity(identity: Omit<Schema.IdentityDoc, '$v'>) {
    this.operations.push({ 
      _type: 'create-identity' as const, 
      data: { ...identity, $v: 1 }
    });
    return this;
  }
  
  // Update operations (requires $v for optimistic locking)
  updateUser(userOrUpdater: Schema.UserDoc | ((user: Schema.UserDoc) => Schema.UserDoc), userId?: string) {
    if (typeof userOrUpdater === 'function') {
      // Function-based update: we need userId to fetch current document
      if (!userId) {
        throw new Error('userId is required for function-based updates');
      }
      this.operations.push({
        _type: 'update-user-with-function' as const,
        updater: userOrUpdater,
        userId: userId
      });
      return this;
    } else {
      // Direct object update
      this.operations.push({
        _type: 'update-user' as const,
        data: { ...userOrUpdater, $v: userOrUpdater.$v + 1 },
        expectedVersion: userOrUpdater.$v
      });
      return this;
    }
  }
  
  updateArtwork(artworkOrUpdater: Schema.ArtworkDoc | ((artwork: Schema.ArtworkDoc) => Schema.ArtworkDoc), artworkId?: string) {
    if (typeof artworkOrUpdater === 'function') {
      if (!artworkId) {
        throw new Error('artworkId is required for function-based updates');
      }
      this.operations.push({
        _type: 'update-artwork-with-function' as const,
        updater: artworkOrUpdater,
        artworkId: artworkId
      });
      return this;
    } else {
      this.operations.push({
        _type: 'update-artwork' as const,
        data: { ...artworkOrUpdater, $v: artworkOrUpdater.$v + 1 },
        expectedVersion: artworkOrUpdater.$v
      });
      return this;
    }
  }
  
  updateSession(sessionOrUpdater: Schema.SessionDoc | ((session: Schema.SessionDoc) => Schema.SessionDoc), sessionId?: string) {
    if (typeof sessionOrUpdater === 'function') {
      if (!sessionId) {
        throw new Error('sessionId is required for function-based updates');
      }
      this.operations.push({
        _type: 'update-session-with-function' as const,
        updater: sessionOrUpdater,
        sessionId: sessionId
      });
      return this;
    } else {
      this.operations.push({
        _type: 'update-session' as const,
        data: { ...sessionOrUpdater, $v: sessionOrUpdater.$v + 1 },
        expectedVersion: sessionOrUpdater.$v
      });
      return this;
    }
  }
  
  updateIdentity(identityOrUpdater: Schema.IdentityDoc | ((identity: Schema.IdentityDoc) => Schema.IdentityDoc), provider?: string, providerId?: string) {
    if (typeof identityOrUpdater === 'function') {
      if (!provider || !providerId) {
        throw new Error('provider and providerId are required for function-based updates');
      }
      this.operations.push({
        _type: 'update-identity-with-function' as const,
        updater: identityOrUpdater,
        provider: provider,
        providerId: providerId
      });
      return this;
    } else {
      this.operations.push({
        _type: 'update-identity' as const,
        data: { ...identityOrUpdater, $v: identityOrUpdater.$v + 1 },
        expectedVersion: identityOrUpdater.$v
      });
      return this;
    }
  }
  
  // Delete operations (no error if not exists)
  deleteUser(id: string) {
    this.operations.push({ 
      _type: 'delete-user' as const, 
      id 
    });
    return this;
  }
  
  deleteArtwork(id: string, userId?: string) {
    this.operations.push({ 
      _type: 'delete-artwork' as const, 
      id,
      userId 
    });
    return this;
  }
  
  deleteSession(id: string) {
    this.operations.push({ 
      _type: 'delete-session' as const, 
      id 
    });
    return this;
  }
  
  deleteIdentity(provider: string, providerId: string) {
    this.operations.push({ 
      _type: 'delete-identity' as const, 
      provider, 
      providerId 
    });
    return this;
  }
  
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
  functions.push(generateTransactionWriteFunction());
  
  // Add tx function that uses builder pattern
  functions.push(generateTxFunction());
  
  for (const [docName, docDef] of evolution.documents) {
    const typeName = capitalizeFirst(docName);
    const pkFields = findPrimaryKeyFields(docDef);


    if (pkFields.length === 0) {
      console.warn(`No primary key found for document: ${docName}`);
      continue;
    }

    // Generate get function with migration
    functions.push(generateGetFunction(docName, typeName, pkFields));

    // Generate put function
    functions.push(generatePutFunction(docName, typeName, pkFields, evolution.indexes));

    // Generate delete function
    functions.push(generateDeleteFunction(docName, typeName, pkFields, evolution.indexes));
    
    // Generate transaction item helper functions
    functions.push(generateTransactionHelperFunctions(docName, typeName, pkFields, evolution.indexes));
  }
  
  // Generate query functions for indexes
  for (const [indexName, indexDef] of evolution.indexes) {
    const ownerDoc = evolution.documents.get(indexDef.ownerDocument);
    const itemDoc = evolution.documents.get(indexDef.itemDocument);
    
    if (ownerDoc && itemDoc) {
      functions.push(generateQueryFunction(indexName, indexDef, ownerDoc, itemDoc));
    }
  }
  
  // Generate transactional create functions for owned documents
  for (const ownership of evolution.ownerships) {
    const ownerDoc = evolution.documents.get(ownership.ownerDocument);
    const ownedDoc = evolution.documents.get(ownership.ownedDocument);
    
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

function generatePutFunction(docName: string, typeName: string, pkFields: any[], indexes: Map<string, IndexDefinition>): string {
  const keyString = pkFields.map(f => `${f.name}=\${${docName}.${f.name}}`).join('/');
  
  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(idx => idx.itemDocument === docName);
  
  let putOperations = `    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: item
    });`;
  
  // Add deprecation warning if this document is part of ownership relations
  let deprecationWarning = '';
  if (relatedIndexes.length > 0) {
    const ownerDocs = relatedIndexes.map(idx => idx.ownerDocument.replace(/Doc$/, '')).join(', ');
    deprecationWarning = `    // WARNING: This document has ownership relations with ${ownerDocs}.
    // Consider using create${typeName}For${ownerDocs} for transactional creation instead.
    `;
  }
  
  // Add index entries for each related index
  if (relatedIndexes.length > 0) {
    const indexPuts = relatedIndexes.map(index => {
      // We need to find the field that references the owner document
      // For now, assume it's a field with the pattern "ownerId" or similar
      const ownerField = findOwnerField(docName, index.ownerDocument);
      if (!ownerField) return '';
      
      return `
    
    // Create index entry for ${index.name}
    const indexItem = {
      $p: \`${index.ownerDocument}/id=\${${docName}.${ownerField}}\`,
      $s: \`${docName}#\${${docName}.id}\`,
      ...${docName}
    };
    
    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: indexItem
    });`;
    }).filter(Boolean);
    
    if (indexPuts.length > 0) {
      putOperations = `    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: item
    });${indexPuts.join('')}`;
    }
  }
  
  return `  async put${typeName}(${docName}: Schema.${docName}): Promise<void> {
${deprecationWarning}    const item = {
      $p: \`${docName}/${keyString}\`,
      $s: '_',
      ...${docName}
    };
    
${putOperations}
  }`;
}

function generateDeleteFunction(docName: string, typeName: string, pkFields: any[], indexes: Map<string, IndexDefinition>): string {
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
      const ownerField = findOwnerField(docName, index.ownerDocument);
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

function findPrimaryKeyFields(docDef: DocumentDefinition) {
  // Find all fields marked as primary keys
  const pkFields = docDef.fields.filter(f => f.isPrimaryKey);
  
  if (pkFields.length === 0) {
    // Fallback to 'id' field if no primary keys are explicitly marked
    const idField = docDef.fields.find(f => f.name === 'id');
    if (idField) {
      return [idField];
    }
    // Last fallback to first field
    return docDef.fields.length > 0 ? [docDef.fields[0]] : [];
  }
  
  return pkFields;
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

function findOwnerField(itemDocName: string, ownerDocName: string): string | null {
  // Convert OwnerDoc to ownerId pattern
  const ownerBaseName = ownerDocName.replace(/Doc$/, '');
  const ownerFieldName = ownerBaseName.toLowerCase() + 'Id';
  
  // For now, we'll assume the field exists. In a more sophisticated system,
  // we could validate against the actual document fields
  return ownerFieldName;
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

function generateTransactionHelperFunctions(docName: string, typeName: string, pkFields: any[], indexes: Map<string, IndexDefinition>): string {
  const keyParams = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const keyObject = pkFields.map(f => f.name).join(', ');
  const keyString = pkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  const itemKeyString = pkFields.map(f => `${f.name}=\${${docName}.${f.name}}`).join('/');
  
  // Find indexes where this document is the item document
  const relatedIndexes = Array.from(indexes.values()).filter(idx => idx.itemDocument === docName);
  
  let createItemsCode = `    const items: DbTransactionItem[] = [
      {
        type: 'put',
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
      const ownerField = findOwnerField(docName, index.ownerDocument);
      if (!ownerField) return '';
      
      return `
    items.push({
      type: 'put',
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
      const ownerField = findOwnerField(docName, index.ownerDocument);
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
        type: 'put',
        tableName: config.DYNAMODB_TABLE_NAME,
        item: {
          $p: \`${ownedDoc.name}/id=\${itemToCreate.${ownedPkFields[0].name}}\`,
          $s: '_',
          ...itemToCreate
        }
      },
      // Create the index entry
      {
        type: 'put',
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

function generateTransactionWriteFunction(): string {
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
          case 'create-user':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`UserDoc/id=\${op.data.id}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            break;
            
          case 'create-artwork':
            const artwork = { ...op.data, userId: op.owner.id };
            // Main artwork document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`ArtworkDoc/id=\${artwork.id}\`,
                  $s: '_',
                  ...artwork
                },
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            // Index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`UserDoc/id=\${op.owner.id}\`,
                  $s: \`ArtworkDoc#\${artwork.id}\`,
                  ...artwork
                }
              }
            });
            break;
            
          case 'create-session':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`SessionDoc/id=\${op.data.id}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            break;
            
          case 'create-identity':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`IdentityDoc/provider=\${op.data.provider}/providerId=\${op.data.providerId}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_not_exists($p)'
              }
            });
            break;
            
          case 'update-user':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`UserDoc/id=\${op.data.id}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;
            
          case 'update-artwork':
            const updatedArtwork = op.data;
            // Update main artwork document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`ArtworkDoc/id=\${updatedArtwork.id}\`,
                  $s: '_',
                  ...updatedArtwork
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
                  $p: \`UserDoc/id=\${updatedArtwork.userId}\`,
                  $s: \`ArtworkDoc#\${updatedArtwork.id}\`,
                  ...updatedArtwork
                },
                ConditionExpression: 'attribute_exists($p)'
              }
            });
            break;
            
          case 'update-session':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`SessionDoc/id=\${op.data.id}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;
            
          case 'update-identity':
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`IdentityDoc/provider=\${op.data.provider}/providerId=\${op.data.providerId}\`,
                  $s: '_',
                  ...op.data
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': op.expectedVersion }
              }
            });
            break;
            
          case 'update-user-with-function':
            // Get current user, apply function, then update
            const currentUser = await this.getUserDoc({id: op.userId});
            if (!currentUser) {
              throw new Error(\`User not found for function-based update: \${op.userId}\`);
            }
            const updatedUserFromFunction = op.updater(currentUser);
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`UserDoc/id=\${updatedUserFromFunction.id}\`,
                  $s: '_',
                  ...updatedUserFromFunction,
                  $v: updatedUserFromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': currentUser.$v }
              }
            });
            break;
            
          case 'update-artwork-with-function':
            const currentArtwork = await this.getArtworkDoc({id: op.artworkId});
            if (!currentArtwork) {
              throw new Error(\`Artwork not found for function-based update: \${op.artworkId}\`);
            }
            const updatedArtworkFromFunction = op.updater(currentArtwork);
            // Update main artwork document
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`ArtworkDoc/id=\${updatedArtworkFromFunction.id}\`,
                  $s: '_',
                  ...updatedArtworkFromFunction,
                  $v: updatedArtworkFromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': currentArtwork.$v }
              }
            });
            // Update index entry
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`UserDoc/id=\${updatedArtworkFromFunction.userId}\`,
                  $s: \`ArtworkDoc#\${updatedArtworkFromFunction.id}\`,
                  ...updatedArtworkFromFunction,
                  $v: updatedArtworkFromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p)'
              }
            });
            break;
            
          case 'update-session-with-function':
            const currentSession = await this.getSessionDoc({id: op.sessionId});
            if (!currentSession) {
              throw new Error(\`Session not found for function-based update: \${op.sessionId}\`);
            }
            const updatedSessionFromFunction = op.updater(currentSession);
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`SessionDoc/id=\${updatedSessionFromFunction.id}\`,
                  $s: '_',
                  ...updatedSessionFromFunction,
                  $v: updatedSessionFromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': currentSession.$v }
              }
            });
            break;
            
          case 'update-identity-with-function':
            const currentIdentity = await this.getIdentityDoc({provider: op.provider, providerId: op.providerId});
            if (!currentIdentity) {
              throw new Error(\`Identity not found for function-based update: \${op.provider}/\${op.providerId}\`);
            }
            const updatedIdentityFromFunction = op.updater(currentIdentity);
            transactItems.push({
              Put: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Item: {
                  $p: \`IdentityDoc/provider=\${updatedIdentityFromFunction.provider}/providerId=\${updatedIdentityFromFunction.providerId}\`,
                  $s: '_',
                  ...updatedIdentityFromFunction,
                  $v: updatedIdentityFromFunction.$v + 1
                },
                ConditionExpression: 'attribute_exists($p) AND #v = :expectedVersion',
                ExpressionAttributeNames: { '#v': '$v' },
                ExpressionAttributeValues: { ':expectedVersion': currentIdentity.$v }
              }
            });
            break;
            
          case 'delete-user':
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`UserDoc/id=\${op.id}\`,
                  $s: '_'
                }
              }
            });
            break;
            
          case 'delete-artwork':
            // Delete main document (no error if not exists)
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`ArtworkDoc/id=\${op.id}\`,
                  $s: '_'
                }
              }
            });
            // Delete index entry if userId is provided
            if (op.userId) {
              transactItems.push({
                Delete: {
                  TableName: config.DYNAMODB_TABLE_NAME,
                  Key: {
                    $p: \`UserDoc/id=\${op.userId}\`,
                    $s: \`ArtworkDoc#\${op.id}\`
                  }
                }
              });
            }
            break;
            
          case 'delete-session':
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`SessionDoc/id=\${op.id}\`,
                  $s: '_'
                }
              }
            });
            break;
            
          case 'delete-identity':
            transactItems.push({
              Delete: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`IdentityDoc/provider=\${op.provider}/providerId=\${op.providerId}\`,
                  $s: '_'
                }
              }
            });
            break;
            
          case 'update-user-last-login':
            transactItems.push({
              Update: {
                TableName: config.DYNAMODB_TABLE_NAME,
                Key: {
                  $p: \`UserDoc/id=\${op.userId}\`,
                  $s: '_'
                },
                UpdateExpression: 'SET #lastLogin = :timestamp',
                ExpressionAttributeNames: { '#lastLogin': 'lastLogin' },
                ExpressionAttributeValues: { ':timestamp': op.timestamp }
              }
            });
            break;
            
          default:
            throw new Error(\`Unknown simple transaction type: \${op._type}\`);
        }
      } else if (op.type) {
        // Handle raw DbTransactionItem (backward compatibility)
        switch (op.type) {
          case 'put':
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
    
    if (transactItems.length > 0) {
      await client.transactWrite({
        TransactItems: transactItems
      });
    }
  }`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}