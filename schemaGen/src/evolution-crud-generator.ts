import { SchemaEvolution, DocumentDefinition } from './evolution-types.js';

export function generateEvolutionCRUD(evolution: SchemaEvolution): string {
  let output = `import { dbClient } from './index.js';

`;

  // Generate type definitions first
  output += generateTypeDefinitions(evolution);
  output += '\n\n';

  // Generate CRUD functions for each document
  for (const [docName, docDef] of evolution.documents) {
    const typeName = capitalizeFirst(docName);
    const pkField = findPrimaryKeyField(docDef);

    if (!pkField) {
      console.warn(`No primary key found for document: ${docName}`);
      continue;
    }

    // Generate get function with migration
    output += generateGetFunction(docName, typeName, pkField);
    output += '\n\n';

    // Generate put function
    output += generatePutFunction(docName, typeName, evolution.currentVersion);
    output += '\n\n';
  }

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
  return `export async function get${typeName}({${pkField.name}}: {${pkField.name}: ${getTypeScriptType(pkField.type)}}): Promise<Docs['${docName}'] | null> {
  const result = await dbClient.get({
    TableName: 'main',
    Key: {
      $p: \`${docName}/id=\${${pkField.name}}\`,
      $s: '_'
    }
  });
  
  if (!result.Item) {
    return null;
  }
  
  // Apply migrations if needed
  return migrate${typeName}(result.Item);
}`;
}

function generatePutFunction(docName: string, typeName: string, currentVersion: number): string {
  return `export async function put${typeName}(${docName}: Docs['${docName}']): Promise<void> {
  const item = {
    $p: \`${docName}/id=\${${docName}.id}\`,
    $s: '_',
    $v: ${currentVersion},
    ...${docName}
  };
  
  await dbClient.put({
    TableName: 'main',
    Item: item
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