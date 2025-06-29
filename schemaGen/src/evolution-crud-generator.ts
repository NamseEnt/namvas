import { SchemaEvolution, DocumentDefinition } from './evolution-types.js';

export function generateEvolutionCRUD(evolution: SchemaEvolution): string {
  let output = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocument.from(new DynamoDBClient());

`;

  // Generate type definitions first
  output += generateTypeDefinitions(evolution);
  output += '\n\n';

  // Generate ddb object with CRUD functions
  output += 'export const ddb = {\n';
  
  const functions: string[] = [];
  
  for (const [docName, docDef] of evolution.documents) {
    const typeName = capitalizeFirst(docName);
    const pkField = findPrimaryKeyField(docDef);

    if (!pkField) {
      console.warn(`No primary key found for document: ${docName}`);
      continue;
    }

    // Generate get function with migration
    functions.push(generateGetFunction(docName, typeName, pkField));

    // Generate put function
    functions.push(generatePutFunction(docName, typeName, evolution.currentVersion));

    // Generate delete function
    functions.push(generateDeleteFunction(docName, typeName, pkField));
  }
  
  output += functions.join(',\n\n');
  output += '\n};\n';

  return output;
}

function generateTypeDefinitions(evolution: SchemaEvolution): string {
  let output = `export type Docs = {
`;

  for (const [docName, docDef] of evolution.documents) {
    output += `  ${docName}: {
`;
    for (const field of docDef.fields) {
      const optional = field.defaultValue !== undefined ? '?' : '';
      output += `    ${field.name}${optional}: ${getTypeScriptType(field.type)};
`;
    }
    output += `  };
`;
  }

  output += `};`;
  return output;
}

function generateGetFunction(docName: string, typeName: string, pkField: any): string {
  return `  async get${typeName}({${pkField.name}}: {${pkField.name}: ${getTypeScriptType(pkField.type)}}): Promise<Docs['${docName}'] | undefined> {
    const result = await client.get({
      TableName: 'main',
      Key: {
        $p: \`${docName}/id=\${${pkField.name}}\`,
        $s: '_'
      }
    });
    
    if (!result.Item) {
      return undefined;
    }
    
    // Apply migrations if needed
    return migrate${typeName}(result.Item);
  }`;
}

function generatePutFunction(docName: string, typeName: string, currentVersion: number): string {
  return `  async put${typeName}(${docName}: Docs['${docName}']): Promise<void> {
    const item = {
      $p: \`${docName}/id=\${${docName}.id}\`,
      $s: '_',
      $v: ${currentVersion},
      ...${docName}
    };
    
    await client.put({
      TableName: 'main',
      Item: item
    });
  }`;
}

function generateDeleteFunction(docName: string, typeName: string, pkField: any): string {
  return `  async delete${typeName}({${pkField.name}}: {${pkField.name}: ${getTypeScriptType(pkField.type)}}): Promise<void> {
    await client.delete({
      TableName: 'main',
      Key: {
        $p: \`${docName}/id=\${${pkField.name}}\`,
        $s: '_'
      }
    });
  }`;
}

function findPrimaryKeyField(docDef: DocumentDefinition) {
  // Look for 'id' field first, then any field that might be a primary key
  return docDef.fields.find(f => f.name === 'id') || 
         docDef.fields.find(f => f.name.toLowerCase().includes('id')) ||
         docDef.fields[0]; // fallback to first field
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