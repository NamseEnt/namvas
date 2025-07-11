### **관리자 페이지 제품 요구사항 정의서 (PRD)**

#### **1. 개요 (Overview)**

서비스의 운영 및 관리를 위한 관리자(Admin) 페이지의 요구사항을 정의합니다. 관리자 페이지는 주문 처리, 고객 지원, 사이트 운영 등 서비스의 모든 백오피스 업무를 수행하는 중앙 제어 시스템(Control Tower)입니다.

#### **2. 목표 (Goals)**

- **운영 효율성 극대화:** 주문 접수부터 생산, 배송까지의 과정을 최소한의 노력으로 정확하게 처리할 수 있도록 지원한다.
- **신속한 고객 대응:** 고객 문의 및 문제 발생 시, 관련 정보를 빠르게 찾아내어 효과적으로 대응할 수 있는 도구를 제공한다.
- **안정적인 서비스 관리:** 사이트의 주요 설정 및 공지사항을 관리자가 직접 유연하게 제어할 수 있도록 한다.

#### **3. 사용자 페르소나 (User Persona)**

- **역할:** 서비스 운영자 (1인 기업가, 사장님)
- **특징:** 제품 생산, 배송, CS, 마케팅 등 모든 업무를 담당한다. 기술 전문가는 아닐 수 있으므로, 직관적이고 사용하기 쉬운 인터페이스를 선호한다. 모바일 환경에서도 급한 업무를 처리할 수 있어야 한다.

#### **4. 전체 구조 (Overall Architecture)**

관리자 페이지는 보안을 위해 별도의 로그인 페이지를 가지며, 로그인 후 좌측 또는 상단에 다음과 같은 네비게이션 메뉴를 통해 전체 기능에 접근합니다.

- **대시보드 (Dashboard):** 로그인 후 첫 화면. 서비스 현황 요약.
- **주문 관리 (Order Management):** 핵심 운영 메뉴. 모든 주문의 처리 및 관리.
- **사용자 관리 (User Management):** 고객 정보 조회 및 CS 지원.
- **사이트 관리 (Site Management):** 서비스의 주요 정책 및 설정 변경.

---

#### **5. 기능 명세 및 단계별 로드맵 (Features & Phased Roadmap)**

각 메뉴별 상세 기능과 단계별 구현 계획은 다음과 같습니다.

##### **5.1. 대시보드 (Dashboard)**

서비스의 현황을 한눈에 파악하는 공간입니다.

| 기능                    | 상세 내용                                                                                                                 | 단계        |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------ | :---------- |
| **처리할 업무 목록**    | `결제완료` 상태의 신규 주문 건, `제작 보류` 상태의 확인 필요 주문 건 목록을 보여줌. 클릭 시 해당 주문 상세 페이지로 이동. | **Phase 1** |
| **핵심 지표(KPI) 요약** | 오늘/이번 주/이번 달의 주문 건수, 매출액, 신규 가입자 수 등 주요 지표를 숫자로 요약하여 보여줌.                           | Phase 2     |
| **매출 추이 그래프**    | 최근 7일 또는 30일간의 일별 매출 추이를 시각적인 그래프로 제공.                                                           | Phase 2     |

##### **5.2. 주문 관리 (Order Management)**

서비스 운영의 핵심이며, 가장 정교하게 만들어져야 합니다.

| 기능                       | 상세 내용                                                                                  | 단계        |
| :------------------------- | :----------------------------------------------------------------------------------------- | :---------- |
| **주문 목록 조회**         | 모든 주문을 최신순으로 정렬된 테이블 형태로 제공. (주문번호, 주문자, 주문일시, 금액, 상태) | **Phase 1** |
| **주문 검색**              | 주문번호, 주문자명 등으로 특정 주문을 검색.                                                | **Phase 1** |
| **상태별 필터링**          | `결제완료`, `제작중`, `배송중` 등 주문 상태별로 주문을 필터링하여 조회.                    | **Phase 1** |
| **주문 상세 정보 조회**    | 주문의 모든 상세 정보(작품, 옵션, 배송, 결제, 고객)를 확인.                                | **Phase 1** |
| **인쇄용 이미지 다운로드** | 300DPI 고해상도 인쇄용 이미지를 다운로드하는 버튼.                                         | **Phase 1** |
| **주문 상태 변경**         | 관리자가 직접 주문의 상태를 다음 단계로 변경. (예: `제작중` → `배송중`)                    | **Phase 1** |
| **운송장 번호 입력/수정**  | 배송 시작 후 운송장 번호를 입력하고 저장.                                                  | **Phase 1** |
| **내부 관리 메모**         | 고객과의 커뮤니케이션 등 해당 주문에 대한 특이사항을 기록.                                 | **Phase 1** |
| **기간별 검색/필터**       | 특정 날짜 범위를 지정하여 주문을 조회.                                                     | Phase 2     |
| **일괄 처리**              | 여러 주문을 선택하여 상태를 한 번에 변경하거나, 운송장 정보를 엑셀로 일괄 업로드.          | Phase 2     |

##### **5.3. 사용자 관리 (User Management)**

고객 관리를 위한 기능입니다.

| 기능                 | 상세 내용                                                                   | 단계        |
| :------------------- | :-------------------------------------------------------------------------- | :---------- |
| **사용자 목록 조회** | 가입한 사용자 목록을 테이블 형태로 제공. (이름, 이메일/SNS 계정, 가입일 등) | **Phase 1** |
| **사용자 검색**      | 이름, 이메일 등으로 특정 사용자를 검색.                                     | **Phase 1** |
| **사용자 상세 정보** | 사용자의 기본 정보 및 해당 사용자의 **전체 주문 내역**을 확인.              | **Phase 1** |
| **사용자 통계**      | 사용자별 총 주문 금액, 주문 횟수 등 분석 지표 제공.                         | Phase 2     |
| **계정 관리**        | 특정 사용자 계정을 비활성화하는 등의 관리 기능.                             | Phase 2     |

##### **5.4. 사이트 관리 (Site Management)**

서비스의 정책과 주요 설정을 제어합니다.

| 기능                    | 상세 내용                                                                       | 단계                     |
| :---------------------- | :------------------------------------------------------------------------------ | :----------------------- |
| **공지사항 관리**       | 사이트 상단에 노출되는 긴급/일반 공지사항을 등록하고 ON/OFF 할 수 있는 기능.    | **Phase 1**              |
| **가격 및 배송비 설정** | 상품 기본가, 옵션가, 기본 배송비를 관리자가 직접 수정할 수 있는 입력 필드 제공. | **Phase 1 (강력 추천)**¹ |
| **약관 관리**           | 이용약관, 개인정보처리방침 등 정책 관련 텍스트를 수정할 수 있는 에디터.         | Phase 2                  |

¹ _가격/배송비는 MVP 출시를 위해 개발자가 직접 코드를 수정하는 방식(하드코딩)도 가능하나, 운영 유연성을 위해 Phase 1에 포함하는 것을 강력히 추천합니다._

#### **6. 비기능 요구사항 (Non-Functional Requirements)**

- **보안 (Security):**
  - 관리자 페이지는 추측하기 어려운 별도의 URL 경로를 사용해야 합니다.
  - 관리자 계정은 일반 사용자 계정과 완전히 분리되어야 하며, 안전한 로그인 인증 방식을 사용해야 합니다.
- **사용성 (Usability):**
  - 모바일 브라우저에서도 주문 확인, 상태 변경 등 핵심 기능을 사용할 수 있도록 반응형 웹으로 구현되어야 합니다.
  - 직관적인 UI를 통해 별도의 교육 없이도 운영자가 쉽게 기능을 파악하고 사용할 수 있어야 합니다.
