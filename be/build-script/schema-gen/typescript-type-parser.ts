import * as ts from 'typescript';
import { DocumentDefinition, FieldDefinition, FieldType, SchemaEvolution } from './evolution-types.js';
import { readFileSync } from 'fs';

export function parseTypeScriptSchema(filePath: string): SchemaEvolution {
  const sourceText = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const documents = new Map<string, DocumentDefinition>();
  const checker = ts.createProgram([filePath], {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    strict: true,
  }).getTypeChecker();

  // Find all exported type aliases
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node) && hasExportModifier(node)) {
      const typeName = node.name.text;
      const fields = parseTypeFields(node.type, sourceText);
      
      if (fields.length > 0) {
        documents.set(typeName, {
          name: typeName,
          fields,
          version: 1, // All documents start at version 1 in type-based system
        });
      }
    }
  });

  return {
    documents,
    commands: [], // No commands in type-based system
    currentVersion: 1, // Simple versioning for type-based system
    migrations: [], // No migrations yet in type-based system
  };
}

function hasExportModifier(node: ts.Node): boolean {
  return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function parseTypeFields(typeNode: ts.TypeNode, sourceText: string): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
        const fieldName = member.name.text;
        const fieldType = member.type ? parseFieldType(member.type, sourceText) : null;
        
        if (fieldType) {
          fields.push({
            name: fieldName,
            type: fieldType.type,
            isPrimaryKey: fieldType.isPrimaryKey,
          });
        }
      }
    });
  }

  return fields;
}

interface ParsedFieldType {
  type: FieldType;
  isPrimaryKey: boolean;
}

function parseFieldType(typeNode: ts.TypeNode, sourceText: string): ParsedFieldType | null {
  // Check if it's wrapped in Pk<T>
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;
    if (ts.isIdentifier(typeName) && typeName.text === 'Pk') {
      // This is a primary key
      if (typeNode.typeArguments && typeNode.typeArguments.length > 0) {
        const innerType = parseFieldType(typeNode.typeArguments[0], sourceText);
        if (innerType) {
          return { ...innerType, isPrimaryKey: true };
        }
      }
    }
  }

  // Parse the actual type
  const typeText = sourceText.substring(typeNode.pos, typeNode.end).trim();
  
  if (typeText === 'string') {
    return { type: 'string', isPrimaryKey: false };
  } else if (typeText === 'number') {
    return { type: 'number', isPrimaryKey: false };
  } else if (typeText === 'boolean') {
    return { type: 'boolean', isPrimaryKey: false };
  } else if (typeText === 'string[]') {
    return { type: 'string[]', isPrimaryKey: false };
  } else if (typeText === 'number[]') {
    return { type: 'number[]', isPrimaryKey: false };
  }
  
  // Default to object for complex types
  return { type: 'object', isPrimaryKey: false };
}