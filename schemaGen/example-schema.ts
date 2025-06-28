// Example TypeScript schema definition
import { 
  string, 
  number, 
  boolean, 
  stringArray, 
  numberArray,
  newDocument,
  addField,
  removeField,
  renameField,
  changeType
} from './src/typescript-api.js';

// Create User document
newDocument("User", {
  id: string,
  email: string,
});

// Add fields to User
addField("User", "name", string, "");
addField("User", "createdAt", number, "Date.now()");
addField("User", "isActive", boolean, true);

// Create Session document  
newDocument("Session", {
  id: string,
  userId: string,
  expiresAt: number,
});

// Evolve Session
addField("Session", "deviceInfo", string, "{}");
renameField("Session", "deviceInfo", "device");

// Add more fields to User
addField("User", "tags", stringArray, []);

// Remove and change types
removeField("User", "isActive");
changeType("User", "createdAt", string, "new Date(value).toISOString()");