# Backend Development TODO

## 주문 관리 API

### 1. 주문 생성 API
- [ ] `createOrder` API 구현
  - 요청: 아트워크 정의 (JSON), 텍스처 S3 URL, 주문 정보 (수량, 옵션, 배송지)
  - 응답: 주문 ID, 주문번호, 총 결제 금액
  - 주문번호 생성 로직 (ORDER-XXXXXXXX 형식)
  - 가격 계산 로직 (기본가 10,000원 + 플라스틱받침대 250원 + 배송비 3,000원)
  - 아트워크 정의는 주문 생성 시점에 DB에 저장 (별도 업로드 없음)

### 2. 주문 목록 조회 API
- [ ] `getOrders` API 구현
  - 사용자별 주문 내역 조회
  - 주문 상태별 필터링 지원
  - 썸네일 URL 생성/관리 (S3에서 텍스처 이미지 축소)

### 3. 주문 취소 API
- [ ] `cancelOrder` API 구현
  - 결제완료 상태 주문만 취소 가능
  - 환불 처리 로직 연동

### 4. 주문 상태 업데이트 API
- [ ] `updateOrderStatus` API 구현 (관리자용 - 별도)
  - 관리자용 주문 상태 변경
  - 상태: payment_completed → in_production → shipping → delivered

## 파일 관리 API

### 5. 텍스처 업로드 URL 생성 API
- [ ] `getTextureUploadUrl` API 구현
  - S3 presigned URL 생성
  - 파일명과 contentType 받아서 업로드 URL과 최종 파일 URL 반환
  - 지원 파일 타입: image/png, image/jpeg
  - 파일 크기 제한 설정 (예: 10MB)

## 인증 관리

### 7. Twitter 로그인 구현
- [ ] `loginWithTwitter` API 구현 (이미 apiSpec에 정의됨)
  - PKCE 기반 OAuth 2.0 인증
  - authorizationCode + codeVerifier 처리

### 8. 로그아웃 API
- [ ] `logout` API 구현
  - 세션 무효화
  - 토큰 삭제

### 9. 이용약관 동의 API
- [ ] `agreeTos` API 구현
  - 사용자 이용약관 동의 상태 업데이트

## 결제 시스템

### 10. 네이버페이 연동
- [ ] 네이버페이 결제 API 연동
  - 결제 요청 처리
  - 결제 완료 콜백 처리
  - 결제 실패/취소 처리

### 11. 환불 처리
- [ ] 주문 취소 시 자동 환불 처리
  - 네이버페이 환불 API 연동

## 데이터베이스 스키마

### 12. 주문 테이블 설계
- [ ] Orders 테이블 생성
  - id, userId, orderNumber, artworkData, textureUrl, quantity, hasPlasticStand
  - recipientInfo (JSON), deliveryMemo, status, totalAmount, createdAt, updatedAt

### 13. 사용자 테이블 확장
- [ ] Users 테이블에 tosAgreed 필드 추가

### 14. 파일 관리 테이블
- [ ] Files 테이블 생성 (아트워크/텍스처 파일 메타데이터)

## 관리자 기능

### 15. 주문 관리 대시보드 API
- [ ] 관리자용 주문 목록 조회
- [ ] 주문 상태 일괄 업데이트
- [ ] 주문 통계 API

## 알림 시스템

### 16. 주문 상태 변경 알림
- [ ] 이메일/SMS 알림 시스템
- [ ] 주문 상태별 자동 알림 발송

## 배포 및 인프라

### 17. 파일 스토리지 설정
- [ ] AWS S3 연동 (텍스처 이미지 저장)
- [ ] CDN 설정

### 18. 환경변수 설정
- [ ] 네이버페이 API 키
- [ ] Twitter OAuth 설정
- [ ] 파일 업로드 경로 설정

## API 스펙 업데이트

### 19. shared/apiSpec.ts 확장
- [ ] 위 모든 API 정의를 apiSpec.ts에 추가
- [ ] 타입 안전성 보장