import { SchemaDefinition, SchemaProperty } from './parser.js';

export function generateCRUDFunctions(schemas: SchemaDefinition[]): string {
  let output = `import { dbClient } from './index.js';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

`;

  for (const schema of schemas) {
    const typeName = capitalizeFirst(schema.name);
    const pkProperty = schema.properties.find(p => 
      p.comments?.some(c => c.includes('pk')) || p.name === 'id'
    );

    if (!pkProperty) {
      console.warn(`No primary key found for schema: ${schema.name}`);
      continue;
    }

    // Generate get function
    output += generateGetFunction(schema.name, typeName, pkProperty);
    output += '\n\n';

    // Generate put function  
    output += generatePutFunction(schema.name, typeName);
    output += '\n\n';

    // Generate delete function
    output += generateDeleteFunction(schema.name, typeName, pkProperty);
    output += '\n\n';

    // Generate list function
    output += generateListFunction(schema.name, typeName);
    output += '\n\n';
  }

  return output;
}

function generateGetFunction(schemaName: string, typeName: string, pkProperty: SchemaProperty): string {
  return `export async function get${typeName}({${pkProperty.name}}: {${pkProperty.name}: ${pkProperty.type}}) {
    const result = await dbClient.get({
        TableName: 'main',
        Key: {
            $p: \`${schemaName}/id=\${${pkProperty.name}}\`,
            $s: '_'
        }
    });
    
    return result.Item;
}`;
}

function generatePutFunction(schemaName: string, typeName: string): string {
  return `export async function put${typeName}(${schemaName}: Docs['${schemaName}']) {
    await dbClient.put({
        TableName: 'main',
        Item: {
            $p: \`${schemaName}/id=\${${schemaName}.id}\`,
            $s: '_',
            ...${schemaName}
        }
    });
}`;
}

function generateDeleteFunction(schemaName: string, typeName: string, pkProperty: SchemaProperty): string {
  return `export async function delete${typeName}({${pkProperty.name}}: {${pkProperty.name}: ${pkProperty.type}}) {
    // TODO: Implement delete${typeName}
    // Delete ${schemaName} from database where ${pkProperty.name} = ${pkProperty.name}
    throw new Error('Not implemented');
}`;
}

function generateListFunction(schemaName: string, typeName: string): string {
  return `export async function list${typeName}s(options?: {limit?: number; offset?: number}) {
    // TODO: Implement list${typeName}s
    // Query database for all ${schemaName} records with pagination
    throw new Error('Not implemented');
}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}