import { SchemaEvolution, DocumentDefinition, IndexDefinition } from './evolution-types.js';

export function generateEvolutionCRUD(evolution: SchemaEvolution): string {
  let output = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type * as Schema from "../schema";
import { config } from "../config";
import { isLocalDev } from "../isLocalDev";

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
  }
  
  // Generate query functions for indexes
  for (const [indexName, indexDef] of evolution.indexes) {
    const ownerDoc = evolution.documents.get(indexDef.ownerDocument);
    const itemDoc = evolution.documents.get(indexDef.itemDocument);
    
    if (ownerDoc && itemDoc) {
      functions.push(generateQueryFunction(indexName, indexDef, ownerDoc, itemDoc));
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
    
    return result.Item as Schema.${docName};
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
    const item = {
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

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}