// Types for schema evolution system

export type FieldType = 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'object';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  defaultValue?: string;
}

export interface DocumentDefinition {
  name: string;
  fields: FieldDefinition[];
  version: number; // Version when this document was created
}

// Schema evolution commands
export type SchemaCommand = 
  | NewDocumentCommand
  | AddFieldCommand
  | RemoveFieldCommand
  | RenameFieldCommand
  | ChangeTypeCommand;

export interface NewDocumentCommand {
  type: 'new_document';
  documentName: string;
  fields: FieldDefinition[];
  version: number;
}

export interface AddFieldCommand {
  type: 'add_field';
  documentName: string;
  fieldName: string;
  fieldType: FieldType;
  defaultValue: string;
  version: number;
}

export interface RemoveFieldCommand {
  type: 'remove_field';
  documentName: string;
  fieldName: string;
  version: number;
}

export interface RenameFieldCommand {
  type: 'rename_field';
  documentName: string;
  oldFieldName: string;
  newFieldName: string;
  version: number;
}

export interface ChangeTypeCommand {
  type: 'change_type';
  documentName: string;
  fieldName: string;
  newType: FieldType;
  migrationFunction: string;
  version: number;
}

// Migration information
export interface MigrationStep {
  version: number;
  command: SchemaCommand;
  description: string;
}

export interface SchemaEvolution {
  documents: Map<string, DocumentDefinition>;
  commands: SchemaCommand[];
  currentVersion: number;
  migrations: MigrationStep[];
}

// Final schema state for code generation
export interface FinalSchema {
  documents: DocumentDefinition[];
  currentVersion: number;
  migrations: MigrationStep[];
}