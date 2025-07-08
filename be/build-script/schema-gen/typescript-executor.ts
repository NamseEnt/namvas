import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { ParsedSchema, DocumentDefinition, MigrationStep } from './schema-types.js';
import { resetCommands, getCommands } from './typescript-api.js';

export async function executeTypeScriptSchema(filePath: string): Promise<ParsedSchema> {
  // Reset command collector
  resetCommands();

  try {
    // Import and execute the TypeScript schema file
    const fileUrl = pathToFileURL(filePath).href;
    await import(fileUrl);
    
    // Get collected commands
    const commands = getCommands();
    
    // Build schema evolution from commands
    const documents = new Map<string, DocumentDefinition>();
    const migrations: MigrationStep[] = [];

    for (const command of commands) {
      // Apply command to build current state
      applyCommand(command, documents);
      
      // Create migration step
      migrations.push({
        version: command.version,
        command,
        description: getCommandDescription(command)
      });
    }

    const currentVersion = commands.length > 0 ? Math.max(...commands.map(c => c.version)) : 0;

    return {
      documents,
      indexes: new Map(),
      ownerships: [],
      commands,
      currentVersion,
      migrations
    };

  } catch (error) {
    throw new Error(`Failed to execute TypeScript schema file: ${error instanceof Error ? error.message : error}`);
  }
}

function applyCommand(command: any, documents: Map<string, DocumentDefinition>) {
  switch (command.type) {
    case 'new_document':
      documents.set(command.documentName, {
        name: command.documentName,
        fields: [...command.fields],
        version: command.version
      });
      break;

    case 'add_field':
      const addDoc = documents.get(command.documentName);
      if (addDoc) {
        addDoc.fields.push({
          name: command.fieldName,
          type: command.fieldType,
          defaultValue: command.defaultValue
        });
      }
      break;

    case 'remove_field':
      const removeDoc = documents.get(command.documentName);
      if (removeDoc) {
        removeDoc.fields = removeDoc.fields.filter(f => f.name !== command.fieldName);
      }
      break;

    case 'rename_field':
      const renameDoc = documents.get(command.documentName);
      if (renameDoc) {
        const field = renameDoc.fields.find(f => f.name === command.oldFieldName);
        if (field) {
          field.name = command.newFieldName;
        }
      }
      break;

    case 'change_type':
      const changeDoc = documents.get(command.documentName);
      if (changeDoc) {
        const field = changeDoc.fields.find(f => f.name === command.fieldName);
        if (field) {
          field.type = command.newType;
        }
      }
      break;
  }
}

function getCommandDescription(command: any): string {
  switch (command.type) {
    case 'new_document':
      return `Created document ${command.documentName} with ${command.fields.length} fields`;
    case 'add_field':
      return `Added field ${command.fieldName} (${command.fieldType}) to ${command.documentName}`;
    case 'remove_field':
      return `Removed field ${command.fieldName} from ${command.documentName}`;
    case 'rename_field':
      return `Renamed field ${command.oldFieldName} to ${command.newFieldName} in ${command.documentName}`;
    case 'change_type':
      return `Changed type of ${command.fieldName} to ${command.newType} in ${command.documentName}`;
    default:
      return 'Unknown command';
  }
}