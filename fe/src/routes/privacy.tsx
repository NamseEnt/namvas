import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

export default function PrivacyPage() {
  return <PrivacyContent />;
}

function PrivacyContent() {
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-slate max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              남바스(namvas) 개인정보처리방침
            </h1>
            
            <div className="mb-8 text-gray-700 leading-relaxed">
              <p>
                {`남세엔터테인먼트유한회사(이하 '회사')는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법률을 준수하고 있습니다. 회사는 본 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.`}
              </p>
              <p className="mt-4">
                본 방침은 2025년 1월 1일부터 시행됩니다.
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-gray-700 mb-4">
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <div className="space-y-3 text-gray-700">
                <div>
                  <strong>1. 홈페이지 회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 분쟁 조정을 위한 기록 보존 등
                </div>
                <div>
                  <strong>2. 주문 및 서비스 제공:</strong> 주문 상품의 제작, 배송, 요금 결제, 콘텐츠 제공 및 맞춤 서비스 제공
                </div>
                <div>
                  <strong>3. 고객 문의 및 고충 처리:</strong> 문의사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (처리하는 개인정보의 항목)</h2>
              <p className="text-gray-700 mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <div className="space-y-3 text-gray-700">
                <div>
                  <strong>1. 회원가입 시:</strong>
                  <div className="ml-4 mt-2">
                    - 소셜 로그인 제공자(OAuth Provider) 정보, 제공자로부터 부여된 이용자 식별 정보(Provider ID)
                  </div>
                </div>
                <div>
                  <strong>2. 주문 및 결제 시:</strong>
                  <div className="ml-4 mt-2 space-y-1">
                    <div>- 주문자 정보: 이름, 연락처</div>
                    <div>- 배송 정보: 수령인 이름, 연락처, 주소</div>
                  </div>
                </div>
                <div>
                  <strong>3.</strong> 서비스 이용 과정에서 IP 주소, 쿠키, 서비스 이용 기록, 기기정보 등이 자동으로 생성되어 수집될 수 있습니다.
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
              <div className="space-y-3 text-gray-700">
                <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
                <div className="ml-4 space-y-3">
                  <div>
                    <strong>1. 홈페이지 회원 정보:</strong> 회원 탈퇴 시까지. 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지 보유합니다.
                    <div className="ml-4 mt-2 space-y-1">
                      <div>- 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지</div>
                      <div>- 서비스 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지</div>
                    </div>
                  </div>
                  <div>
                    <strong>2. 전자상거래 관련 기록:</strong>
                    <div className="ml-4 mt-2 space-y-1">
                      <div>- 계약 또는 청약철회 등에 관한 기록: <strong>5년</strong> (전자상거래 등에서의 소비자보호에 관한 법률)</div>
                      <div>- 대금결제 및 재화 등의 공급에 관한 기록: <strong>5년</strong></div>
                      <div>- 소비자의 불만 또는 분쟁처리에 관한 기록: <strong>3년</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공에 관한 사항)</h2>
              <div className="space-y-3 text-gray-700">
                <p>① 회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
                <p>② 회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div><strong>제공받는 자:</strong> CJ대한통운, 우체국택배, 한진택배 등 당사와 계약된 상품 배송업체</div>
                    <div><strong>제공 목적:</strong> 상품 및 경품의 배송 업무</div>
                    <div><strong>제공하는 개인정보 항목:</strong> 수령인 이름, 주소, 연락처</div>
                    <div><strong>보유 및 이용 기간:</strong> 배송 완료 시 또는 관련 법령에 따른 보존 기한까지</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (개인정보 처리업무의 위탁에 관한 사항)</h2>
              <div className="space-y-3 text-gray-700">
                <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <div><strong>수탁업체:</strong> 네이버페이, 카카오페이 등 당사와 계약된 결제대행 서비스 제공업체</div>
                    <div><strong>위탁업무 내용:</strong> 신용카드, 간편결제 등을 통한 결제 처리</div>
                  </div>
                  <div>
                    <div><strong>수탁업체:</strong> Amazon Web Services, Inc.</div>
                    <div><strong>위탁업무 내용:</strong> namvas.com 웹사이트 및 시스템 운영, 데이터 보관</div>
                  </div>
                </div>
                <p>② 회사는 위탁계약 체결 시 위탁업무 수행목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
                <p>③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보처리방침을 통하여 공개하도록 하겠습니다.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (개인정보의 파기절차 및 파기방법)</h2>
              <div className="space-y-3 text-gray-700">
                <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
                <div className="ml-4 space-y-2">
                  <div><strong>1. 파기절차:</strong> 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</div>
                  <div><strong>2. 파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하고, 종이 문서는 분쇄기로 분쇄하거나 소각하여 파기합니다.</div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (정보주체와 법정대리인의 권리·의무 및 그 행사방법)</h2>
              <div className="space-y-3 text-gray-700">
                <p>① 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</p>
                <p>{`② 정보주체는 언제든지 '마이페이지'를 통해 자신의 주문 내역을 조회할 수 있으며, 개인정보의 정정·삭제·처리정지 등의 권리 행사는 서면, 전화, 전자우편 등을 통해 요청하실 수 있습니다.`}</p>
                <p>③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (개인정보 보호책임자에 관한 사항)</h2>
              <div className="space-y-3 text-gray-700">
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div><strong>개인정보 보호책임자</strong></div>
                    <div className="ml-4 space-y-1">
                      <div>성명: 남세현</div>
                      <div>직책: 대표</div>
                      <div>연락처: projectluda@gmail.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (개인정보의 안전성 확보조치에 관한 사항)</h2>
              <div className="space-y-3 text-gray-700">
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                <div className="ml-4 space-y-2">
                  <div><strong>1. 관리적 조치:</strong> 내부관리계획 수립·시행, 정기적 직원 교육 등</div>
                  <div><strong>2. 기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</div>
                </div>
              </div>
            </section>

            <section className="mb-8 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (개인정보처리방침의 변경)</h2>
              <p className="text-gray-700">
                본 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일전부터 홈페이지의 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}