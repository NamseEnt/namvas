# Claude 개발 가이드라인

## TypeScript 규칙
- **any 타입 절대 금지**: 명확한 인터페이스/타입 정의 필수
- **as const 금지**: 배열은 명시적 타입 선언 (`const items: ItemType[] = []`)
- **유니온 타입 선호**: `{ success: true; data: T } | { success: false; error: string }`
- **인라인 객체**: 생성 후 바로 함수 전달하는 객체는 변수 선언 없이 인라인 작성

## 에러 처리
- **INTERNAL_ERROR try-catch 금지**: 시스템 에러는 람다 런타임이 처리
- **에러 구분**: 시스템 에러는 throw, 비즈니스 로직 결과만 false/reason 반환
- **명시적 reason**: NOT_LOGGED_IN, INVALID_INPUT, NOT_FOUND, PERMISSION_DENIED, ALREADY_EXISTS

## API 패턴
```typescript
export const functionName: Api["functionName"] = async (
  { param1, param2 }, req // req 안 쓸 경우 생략 가능
) => {
  // 구현
};
```

## 필수 확인
1. **작업 전**: 기존 코드 패턴, 스타일, import 방식 확인
2. **DB 스키마 수정**: 반드시 사용자 승인 후 진행, `npm run schema-gen` 실행
3. **DB 제약**: 필요한 쿼리/필드 없으면 즉시 작업 중단하고 사용자에게 알림

## 작업 완료 필수 실행
1. `npx tsc --noEmit` (타입 체크)
2. `npm run test` (테스트, bun 금지)

모든 명령어 성공 시에만 작업 완료 인정.
