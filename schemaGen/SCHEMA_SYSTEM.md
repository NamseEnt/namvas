# Schema Evolution System

## Overview

This TypeScript-based schema system allows you to define and evolve database schemas through code. Each function call represents a change to the schema, enabling automatic versioning and migration support.

## TypeScript API

### Type Constants

First, import the type constants and schema functions:

```typescript
import { 
  string, 
  number, 
  boolean, 
  stringArray, 
  numberArray,
  object,
  newDocument,
  addField,
  removeField,
  renameField,
  changeType
} from './src/typescript-api.js';
```

### 1. Creating a New Document

```typescript
newDocument("DocumentName", {
  fieldName: type,
  ...
});
```

Example:
```typescript
newDocument("Session", {
  id: string,
  email: string,
});
```

### 2. Adding Fields

```typescript
addField("DocumentName", "fieldName", type, defaultValue);
```

Example:
```typescript
addField("Session", "username", string, "");
addField("Session", "loginCount", number, 0);
addField("Session", "isActive", boolean, true);
```

### 3. Removing Fields

```typescript
removeField("DocumentName", "fieldName");
```

Example:
```typescript
removeField("Session", "isActive");
```

### 4. Renaming Fields

```typescript
renameField("DocumentName", "oldFieldName", "newFieldName");
```

Example:
```typescript
renameField("Session", "username", "userName");
```

### 5. Changing Field Types

```typescript
changeType("DocumentName", "fieldName", newType, "migrationFunction");
```

Example:
```typescript
changeType("Session", "loginCount", string, "String(value)");
```

## Supported Types

- `string` - String values
- `number` - Numeric values (integers and floats)
- `boolean` - True/false values
- `stringArray` - Array of strings
- `numberArray` - Array of numbers
- `object` - Generic object (requires custom migration logic)

## Versioning System

Every document stored in the database includes a `$v` field that tracks the schema version. When retrieving documents:

1. If `$v` matches the current schema version, the document is returned as-is
2. If `$v` is older, migrations are applied sequentially to bring it up to date
3. The migrated document is optionally saved back with the new version

## Migration Process

Migrations are automatically generated based on the schema commands:

- `add_field`: Uses the specified default value
- `remove_field`: Simply removes the field
- `rename_field`: Copies value from old field to new field
- `change_type`: Uses the provided migration function

## Generated Code Structure

The system generates:

1. **Type definitions** - Current schema types
2. **CRUD functions** - get, put, delete, list operations with automatic migration
3. **Migration functions** - Functions to migrate between each version
4. **Version history** - Metadata about each schema version

## Usage Example

Schema file (`schema.ts`):
```typescript
import { 
  string, 
  number, 
  boolean, 
  stringArray,
  newDocument,
  addField,
  renameField
} from './src/typescript-api.js';

newDocument("User", {
  id: string,
  email: string,
});

addField("User", "name", string, "");
addField("User", "createdAt", number, "Date.now()");
addField("User", "tags", stringArray, []);

newDocument("Session", {
  id: string,
  userId: string,
  expiresAt: number,
});

addField("Session", "deviceInfo", string, "{}");
renameField("Session", "deviceInfo", "device");
```

Generated TypeScript:
```typescript
// Current schema (version 5)
export type Docs = {
  User: {
    id: string;
    email: string;
    name: string;
    createdAt: number;
    tags: string[];
  };
  Session: {
    id: string;
    userId: string;
    expiresAt: number;
    device: string;
  };
}

// CRUD functions with automatic migration
export async function getUser({id}: {id: string}): Promise<Docs['User'] | null> {
  const result = await dbClient.get({
    TableName: 'main',
    Key: { $p: `User/id=${id}`, $s: '_' }
  });
  
  if (!result.Item) return null;
  
  // Apply migrations if needed
  return migrateUser(result.Item);
}

// Migration function
function migrateUser(doc: any): Docs['User'] {
  let version = doc.$v || 1;
  
  // Version 2: Added name field
  if (version < 2) {
    doc.name = "";
    version = 2;
  }
  
  // Version 3: Added createdAt field
  if (version < 3) {
    doc.createdAt = Date.now();
    version = 3;
  }
  
  // Version 4: Added tags field
  if (version < 4) {
    doc.tags = [];
    version = 4;
  }
  
  doc.$v = 4;
  return doc;
}
```

## Command Line Usage

```bash
# Generate TypeScript code from schema file
bun run schema schema.ts generated.ts

# Or using the shorter alias
bun run gen schema.ts generated.ts
```

## Benefits

1. **Safe schema evolution** - Never lose data due to schema changes
2. **Automatic migrations** - No manual migration code needed
3. **Version tracking** - Know exactly what version each document is
4. **Type safety** - Full TypeScript support for current schema
5. **Incremental changes** - Easy to understand and review schema changes