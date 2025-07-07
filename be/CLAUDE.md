# Claude Development Guidelines

이 프로젝트에서 Claude가 코드 작업을 할 때 따라야 할 가이드라인입니다.

## TypeScript 코딩 규칙

### any 타입 금지
절대로 `any` 타입을 사용하지 마세요. 타입 안전성을 해치는 주요 원인입니다.

**잘못된 예:**
```typescript
const data: any = someFunction();
function processData(input: any): any {
  return input;
}
```

**올바른 예:**
```typescript
interface DataType {
  id: string;
  value: number;
}
const data: DataType = someFunction();
function processData(input: DataType): DataType {
  return input;
}
```

### as const 사용 금지
`as const`를 사용하지 마세요. 대신 적절한 타입 정의를 사용하세요.

**잘못된 예:**
```typescript
const rows = [];
rows.push({
  type: "artwork" as const,
  data: value
});
```

**올바른 예:**
```typescript
type RowType = {
  type: "artwork" | "plasticStand";
  data: string;
};
const rows: RowType[] = [];
rows.push({
  type: "artwork",
  data: value
});
```

### 배열 타입 명시
배열에 push할 때 타입 에러가 발생하면 `as const`를 사용하지 말고, 배열 자체에 명확한 타입을 정의하세요.

**잘못된 예:**
```typescript
const items = [];
items.push({ type: "test" as const });
```

**올바른 예:**
```typescript
type ItemType = {
  type: "test" | "other";
};
const items: ItemType[] = [];
items.push({ type: "test" });
```

### 함수 반환 타입
함수의 반환 타입은 가능한 한 명확한 유니온 타입으로 정의해야 합니다.

**잘못된 예:**
```typescript
async function example(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  // 구현
}
```

**올바른 예:**
```typescript
async function example(): Promise<
  | { success: true; data: string }
  | { success: false; error: string }
> {
  // 구현
}
```

이렇게 하면 타입 가드를 통해 더 안전한 코드를 작성할 수 있습니다.

### 객체 생성 및 함수 호출 패턴

객체를 생성한 후 바로 함수에 전달하는 경우, 별도 변수 선언 없이 인라인으로 작성해야 합니다.

**잘못된 예:**
```typescript
const newOrder = {
  $v: 1,
  id: orderId,
  userId: session.userId,
  status: "payment_pending" as const,
  // ...
};

await ddb.putOrderDoc(newOrder);
```

**올바른 예:**
```typescript
await ddb.putOrderDoc({
  $v: 1,
  id: orderId,
  userId: session.userId,
  status: "payment_pending" as const,
  // ...
});
```

이는 우리 팀의 코딩 문화이므로 반드시 지켜야 합니다.

## 에러 처리 규칙

### INTERNAL_ERROR 처리 금지
API 함수에서 `INTERNAL_ERROR`를 reason으로 반환하기 위한 try-catch를 사용하지 마세요. 내부 서버 오류는 람다 런타임이 자동으로 처리합니다.

**잘못된 예:**
```typescript
export const someApi = async (params, req) => {
  try {
    // API 로직
    await ddb.putSomeDoc(data);
    return { ok: true };
  } catch (error) {
    console.error("Error:", error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
};
```

**올바른 예:**
```typescript
export const someApi = async (params, req) => {
  // 세션 검증
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  // 입력 검증
  if (!params.requiredField) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  // API 로직 (에러 발생 시 람다 런타임이 처리)
  await ddb.putSomeDoc(data);
  return { ok: true };
};
```

### 명시적 에러 reason 사용
각 API에서 발생할 수 있는 구체적인 에러 상황에 대해서는 명확한 reason을 정의하고 사용하세요:
- `NOT_LOGGED_IN`: 세션이 없는 경우
- `INVALID_INPUT`: 입력값이 잘못된 경우  
- `NOT_FOUND`: 리소스를 찾을 수 없는 경우
- `PERMISSION_DENIED`: 권한이 없는 경우
- `ALREADY_EXISTS`: 이미 존재하는 경우

## 필수 실행 명령어

모든 코드 작업 완료 후 반드시 다음 명령어들을 순서대로 실행해야 합니다:

1. **TypeScript 컴파일 체크**: `npx tsc --noEmit`
2. **테스트 실행**: `npm run test` (LLRT 환경 필요 - `bun test` 사용 금지)

이 명령어들이 모두 성공해야만 작업이 완료된 것으로 간주합니다.

## 코드 작업 전 필수 확인사항

작업을 시작하기 전에 반드시 기존 코드가 어떻게 작성되어 있는지 확인해야 합니다:

1. **비슷한 기능의 기존 코드 확인**: 같은 기능이나 패턴을 가진 다른 파일들을 먼저 읽어보세요
2. **기존 코드 스타일 파악**: 함수명, 변수명, 파일 구조 등의 컨벤션을 확인하세요
3. **의존성 및 import 패턴 확인**: 다른 파일들이 어떤 라이브러리를 사용하고 어떻게 import하는지 확인하세요

## API 개발 패턴

### 함수 시그니처 패턴

모든 API 함수는 다음 패턴을 따라야 합니다:

```typescript
export const functionName = async (
  { param1, param2 }: ApiSpec["functionName"]["req"],
  req: ApiRequest
): Promise<ApiSpec["functionName"]["res"]> => {
  // 구현
};
```

## 스키마 수정 규칙

**데이터베이스 스키마(schema.ts)를 수정하기 전에 반드시 사용자에게 승인을 받아야 합니다.**

1. **스키마 수정 전 필수 절차:**
   - 수정 이유와 목적을 명확히 설명
   - 영향을 받을 기존 코드와 API 파악
   - 수정 계획을 구체적으로 제시
   - 사용자 승인 후에만 수정 진행

2. **스키마 수정이 필요한 경우:**
   - 새로운 Document 타입 추가/제거
   - 기존 Document 필드 변경
   - Index 구조 변경
   - Ownership 관계 변경

3. **스키마 수정 후 필수 작업:**
   - 스키마 변경 후 반드시 `npm run schema-gen` 실행
   - 최신 db.ts 파일 생성 확인
   - 작업 시작 전에도 schema-gen을 실행하여 최신 상태 확인

## 중요 규칙

1. **절대 빌드나 테스트가 실패한 상태로 작업을 완료하지 마세요.**
