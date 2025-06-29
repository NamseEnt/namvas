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
  addField,
  boolean,
  pk,
} from "../../schemaGen/src/typescript-api.js";

newDocument("session", {
  id: pk(string),
  userId: string,
});

newDocument("user", {
  id: pk(string),
  createdAt: string,
  tosAgreed: boolean,
});

newDocument("identity", {
  provider: pk(string),
  providerId: pk(string),
  userId: string,
});
