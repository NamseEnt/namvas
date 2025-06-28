import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Environment detection and client setup
async function createDbClient() {
  if (process.env.LAMBDA) {
    // Lambda environment - use DynamoDB
    return DynamoDBDocument.from(new DynamoDBClient());
  }

  // Non-Lambda environment - try LocalDBDocument, fallback to LLRT version
  try {
    const { LocalDBDocument } = await import("./LocalDBDocument");
    return new LocalDBDocument();
  } catch (error) {
    console.warn("LocalDBDocument (SQLite) not available, using LLRT-compatible version");
    // LLRT environment - use in-memory implementation
    const { LocalDBDocumentLLRT } = await import("./LocalDBDocumentLLRT");
    return new LocalDBDocumentLLRT();
  }
}

// Create client instance
const _dbClient = await createDbClient();
export const dbClient = _dbClient;

// Fallback implementations for LLRT
async function putSessionStub(data: any) {
  return {};
}

async function putAccountStub(data: any) {
  return {};
}

async function putIdentityStub(data: any) {
  return {};
}

async function getSessionStub(args: any) {
  return undefined;
}

async function getAccountStub(args: any) {
  return undefined;
}

async function getIdentityStub(args: any) {
  return undefined;
}

// Export generated functions with error handling for LLRT
let generatedFunctions: any = null;
try {
  generatedFunctions = await import("./generated");
} catch (error) {
  console.warn("Generated functions not available, using stubs");
}

export const getSession = generatedFunctions?.getSession || getSessionStub;
export const putSession = generatedFunctions?.putSession || putSessionStub;
export const getAccount = generatedFunctions?.getAccount || getAccountStub;
export const putAccount = generatedFunctions?.putAccount || putAccountStub;
export const getIdentity = generatedFunctions?.getIdentity || getIdentityStub;
export const putIdentity = generatedFunctions?.putIdentity || putIdentityStub;
