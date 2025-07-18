import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string | undefined,
    error: search.error as string | undefined,
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { code, error } = Route.useSearch();
  const queryClient = useQueryClient();

  useEffect(
    function handleOAuthCallback() {
      async function processAuth() {
        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        const codeVerifier = sessionStorage.getItem("twitter_code_verifier");

        let response;
        if (codeVerifier) {
          response = await api.loginWithTwitter({
            authorizationCode: code,
            codeVerifier,
          });
          sessionStorage.removeItem("twitter_code_verifier");
        } else {
          response = await api.loginWithGoogle({ authorizationCode: code });
        }

        if (!response.ok) {
          throw new Error(response.reason);
        }

        console.log("response", response);

        queryClient.invalidateQueries({ queryKey: ["auth"] });
        console.log("invalidateQueries auth");

        return navigate({ to: "/", replace: true });
      }

      processAuth().catch((error) => {
        alert(`로그인에 실패했습니다.\n시스템 오류: ${error}`);
        navigate({ to: "/login", replace: true });
      });
    },
    [code, error, queryClient, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">로그인 처리 중...</h2>
        <p className="text-muted-foreground">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
