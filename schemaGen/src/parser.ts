import * as ts from 'typescript';

export interface SchemaProperty {
  name: string;
  type: string;
  isOptional: boolean;
  comments?: string[];
}

export interface SchemaDefinition {
  name: string;
  properties: SchemaProperty[];
}

export function parseDocsType(sourceCode: string): SchemaDefinition[] {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const schemas: SchemaDefinition[] = [];

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Docs') {
      if (ts.isTypeLiteralNode(node.type)) {
        for (const member of node.type.members) {
          if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
            const schemaName = member.name.text;
            const properties: SchemaProperty[] = [];

            if (member.type && ts.isTypeLiteralNode(member.type)) {
              for (const prop of member.type.members) {
                if (ts.isPropertySignature(prop) && prop.name && ts.isIdentifier(prop.name)) {
                  const propName = prop.name.text;
                  const propType = prop.type ? getTypeString(prop.type) : 'any';
                  const isOptional = !!prop.questionToken;
                  
                  // Extract comments
                  const comments = extractComments(prop, sourceFile);

                  properties.push({
                    name: propName,
                    type: propType,
                    isOptional,
                    comments
                  });
                }
              }
            }

            schemas.push({
              name: schemaName,
              properties
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return schemas;
}

function getTypeString(typeNode: ts.TypeNode): string {
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    default:
      return 'any';
  }
}

function extractComments(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  const comments: string[] = [];
  const fullText = sourceFile.getFullText();
  
  const ranges = ts.getLeadingCommentRanges(fullText, node.getFullStart());
  if (ranges) {
    for (const range of ranges) {
      const commentText = fullText.substring(range.pos, range.end);
      comments.push(commentText.replace(/^\/\/\/?\s*/, '').trim());
    }
  }
  
  return comments;
}