import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

  const twitterLoginMutation = useMutation({
    mutationFn: ({
      code,
      codeVerifier,
    }: {
      code: string;
      codeVerifier: string;
    }) => api.loginWithTwitter({ authorizationCode: code, codeVerifier }),
    onSuccess: () => {
      sessionStorage.removeItem("twitter_code_verifier");
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Twitter login failed:", error);
      navigate({ to: "/" });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (code: string) =>
      api.loginWithGoogle({ authorizationCode: code }),
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Google login failed:", error);
      navigate({ to: "/" });
    },
  });

  useEffect(
    function handleOAuthCallback() {
      // Prevent multiple executions
      if (googleLoginMutation.isPending || twitterLoginMutation.isPending) {
        return;
      }

      // code와 error는 이미 Route.useSearch()에서 가져옴

      if (error) {
        console.error("OAuth error:", error);
        navigate({ to: "/" });
        return;
      }

      if (!code) {
        console.error("No authorization code received");
        navigate({ to: "/" });
        return;
      }

      // Check if this is a Twitter OAuth callback
      const codeVerifier = sessionStorage.getItem("twitter_code_verifier");
      if (codeVerifier) {
        twitterLoginMutation.mutate({ code, codeVerifier });
      } else {
        // Handle Google OAuth callback
        googleLoginMutation.mutate(code);
      }
    },
    [code, error, googleLoginMutation, navigate, twitterLoginMutation] // Dependencies
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
