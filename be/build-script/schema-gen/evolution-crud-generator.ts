import { SchemaEvolution, DocumentDefinition } from './evolution-types.js';

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
    functions.push(generatePutFunction(docName, typeName, pkFields));

    // Generate delete function
    functions.push(generateDeleteFunction(docName, typeName, pkFields));
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

function generatePutFunction(docName: string, typeName: string, pkFields: any[]): string {
  const keyString = pkFields.map(f => `${f.name}=\${${docName}.${f.name}}`).join('/');
  
  return `  async put${typeName}(${docName}: Schema.${docName}): Promise<void> {
    const item = {
      $p: \`${docName}/${keyString}\`,
      $s: '_',
      ...${docName}
    };
    
    await client.put({
      TableName: config.DYNAMODB_TABLE_NAME,
      Item: item
    });
  }`;
}

function generateDeleteFunction(docName: string, typeName: string, pkFields: any[]): string {
  const keyParams = pkFields.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(', ');
  const keyObject = pkFields.map(f => f.name).join(', ');
  const keyString = pkFields.map(f => `${f.name}=\${${f.name}}`).join('/');
  
  return `  async delete${typeName}({${keyObject}}: {${keyParams}}): Promise<void> {
    await client.delete({
      TableName: config.DYNAMODB_TABLE_NAME,
      Key: {
        $p: \`${docName}/${keyString}\`,
        $s: '_'
      }
    });
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

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}