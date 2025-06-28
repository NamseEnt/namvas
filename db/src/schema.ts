// Database schema definition using TypeScript API
import { 
  string, 
  newDocument,
  addField
} from '../../schemaGen/src/typescript-api.js';

// Create session document
newDocument("session", {
  id: string,
  userId: string,
});

// Create account document
newDocument("account", {
  id: string,
  createdAt: string,
  updatedAt: string,
});

// Create identity document
newDocument("identity", {
  id: string,
  accountId: string,
  provider: string,
  providerId: string,
  createdAt: string,
  updatedAt: string,
});

// Add optional fields to identity
addField("identity", "email", string, "");
addField("identity", "name", string, "");
addField("identity", "profileImageUrl", string, "");