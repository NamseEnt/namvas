// Database schema definition using TypeScript API
// 
// 주의사항:
// - 새로운 document 생성시 모든 필드를 newDocument에서 한번에 정의할 것
// - addField는 기존 document에 필드를 추가할 때만 사용 (스키마 진화/마이그레이션)
// - 새 entity 만들 때 addField 사용하지 말고 newDocument에 모든 필드 포함
// - nested object는 JSON string이 아니라 object type으로 정의할 것
//
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

// Create order document
newDocument("order", {
  id: string,
  orderNumber: string,
  userId: string,
  orderDate: string,
  finalAmount: string,
  status: string,
  quantity: string,
  hasPlasticStand: string,
  artworkDefinition: string,
  textureUrl: string,
  printImageUrl: string,
  thumbnailUrl: string,
  trackingNumber: string,
  adminMemo: string,
  deliveryMemo: string,
  recipient: string,
  createdAt: string,
  updatedAt: string,
});