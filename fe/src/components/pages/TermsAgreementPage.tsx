import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";

export function TermsAgreementPage() {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });
  const navigate = useNavigate();

  const updateAgreement = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAgree = () => {
    if (agreements.terms && agreements.privacy) {
      navigate({ to: "/" });
    }
  };

  const isAllAgreed = agreements.terms && agreements.privacy;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            NAMVAS 시작 전, 약관에 동의해주세요.
          </h1>
        </div>

        <div className="space-y-4">
          <TermsCheckbox
            label="(필수) 서비스 이용 약관에 동의합니다."
            detailText="자세히 보기"
            checked={agreements.terms}
            onChange={() => updateAgreement("terms")}
            linkTo="/terms"
          />
          <TermsCheckbox
            label="(필수) 개인정보처리방침에 동의합니다."
            detailText="자세히 보기"
            checked={agreements.privacy}
            onChange={() => updateAgreement("privacy")}
            linkTo="/privacy"
          />
        </div>

        <div className="pt-4">
          <AgreeButton onClick={handleAgree} disabled={!isAllAgreed} />
        </div>
      </div>
    </div>
  );
}

function TermsCheckbox({
  label,
  detailText,
  checked,
  onChange,
  linkTo,
}: {
  label: string;
  detailText: string;
  checked: boolean;
  onChange: () => void;
  linkTo: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <div className="flex-1">
        <label className="text-sm text-gray-900">{label}</label>
        <Link 
          to={linkTo}
          target="_blank"
          className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {detailText}
        </Link>
      </div>
    </div>
  );
}

function AgreeButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      동의하고 시작하기
    </button>
  );
}