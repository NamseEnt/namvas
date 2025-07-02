import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  const twitterLoginMutation = useMutation({
    mutationFn: ({ code, codeVerifier }: { code: string; codeVerifier: string }) => 
      authApi.loginWithTwitter(code, codeVerifier),
    onSuccess: () => {
      sessionStorage.removeItem("twitter_code_verifier");
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get("state");
      if (state === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/studio", search: { artwork: undefined } });
      }
    },
    onError: (error) => {
      console.error("Twitter login failed:", error);
      navigate({ to: "/" });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (code: string) => authApi.loginWithGoogle(code),
    onSuccess: () => {
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get("state");
      if (state === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/studio", search: { artwork: undefined } });
      }
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

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");

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
    [] // Empty dependency array to run only once on mount
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
