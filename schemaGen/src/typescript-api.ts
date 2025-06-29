// TypeScript API for schema definition

import { SchemaCommand, FieldType } from './evolution-types.js';

// Type constants
export const string = Symbol('string');
export const number = Symbol('number'); 
export const boolean = Symbol('boolean');
export const stringArray = Symbol('string[]');
export const numberArray = Symbol('number[]');
export const object = Symbol('object');

// Primary key wrapper - create unique symbols
const pkSymbols = new Map<string, TypeSymbol>();
const pkMap = new Map<TypeSymbol, TypeSymbol>();

export function pk(type: TypeSymbol): TypeSymbol {
  // Create a unique symbol for this pk(type) combination
  const typeDescription = type.description || type.toString();
  const pkSymbolKey = `pk_${typeDescription}_${Math.random()}`;
  const pkSymbol = Symbol(pkSymbolKey);
  
  pkSymbols.set(pkSymbolKey, type);
  pkMap.set(pkSymbol, type);
  
  return pkSymbol;
}

// Type mapping
type TypeSymbol = typeof string | typeof number | typeof boolean | typeof stringArray | typeof numberArray | typeof object;

const typeSymbolToString = new Map<TypeSymbol, FieldType>([
  [string, 'string'],
  [number, 'number'],
  [boolean, 'boolean'],
  [stringArray, 'string[]'],
  [numberArray, 'number[]'],
  [object, 'object']
]);

// Command collector
let commands: SchemaCommand[] = [];
let currentVersion = 0;

export function resetCommands() {
  commands = [];
  currentVersion = 0;
}

export function getCommands(): SchemaCommand[] {
  return [...commands];
}

// Helper function to convert symbol to field type
function symbolToFieldType(symbol: TypeSymbol): FieldType {
  // Check if it's a primary key wrapper
  const originalType = pkMap.get(symbol) || symbol;
  const fieldType = typeSymbolToString.get(originalType as TypeSymbol);
  if (!fieldType) {
    throw new Error(`Unknown type symbol: ${symbol.toString()}`);
  }
  return fieldType;
}

// Schema definition functions
export function newDocument(name: string, fields: Record<string, TypeSymbol>) {
  const fieldDefinitions = Object.entries(fields).map(([fieldName, typeSymbol]) => ({
    name: fieldName,
    type: symbolToFieldType(typeSymbol),
    isPrimaryKey: pkMap.has(typeSymbol)
  }));

  const command: SchemaCommand = {
    type: 'new_document',
    documentName: name,
    fields: fieldDefinitions,
    version: ++currentVersion
  };

  commands.push(command);
}

export function addField(documentName: string, fieldName: string, fieldType: TypeSymbol, defaultValue: any) {
  const command: SchemaCommand = {
    type: 'add_field',
    documentName,
    fieldName,
    fieldType: symbolToFieldType(fieldType),
    defaultValue: JSON.stringify(defaultValue).replace(/"/g, ''),
    version: ++currentVersion
  };

  commands.push(command);
}

export function removeField(documentName: string, fieldName: string) {
  const command: SchemaCommand = {
    type: 'remove_field',
    documentName,
    fieldName,
    version: ++currentVersion
  };

  commands.push(command);
}

export function renameField(documentName: string, oldFieldName: string, newFieldName: string) {
  const command: SchemaCommand = {
    type: 'rename_field',
    documentName,
    oldFieldName,
    newFieldName,
    version: ++currentVersion
  };

  commands.push(command);
}

export function changeType(documentName: string, fieldName: string, newType: TypeSymbol, migrationFunction: string) {
  const command: SchemaCommand = {
    type: 'change_type',
    documentName,
    fieldName,
    newType: symbolToFieldType(newType),
    migrationFunction,
    version: ++currentVersion
  };

  commands.push(command);
}