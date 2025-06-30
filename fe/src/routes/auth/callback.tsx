import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(
    function handleOAuthCallback() {
      const handleTwitterCallback = async (code: string, codeVerifier: string) => {
        try {
          const response = await fetch("/api/loginWithTwitter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              authorizationCode: code,
              codeVerifier: codeVerifier,
            }),
          });

          const result = await response.json();

          if (result.ok) {
            // Clear the code verifier
            sessionStorage.removeItem("twitter_code_verifier");
            // Navigate to studio
            navigate({ to: "/studio" });
          } else {
            console.error("Twitter login failed:", result.reason);
            navigate({ to: "/" });
          }
        } catch (error) {
          console.error("Twitter login error:", error);
          navigate({ to: "/" });
        }
      };

      const handleGoogleCallback = async (code: string) => {
        try {
          const response = await fetch("/api/loginWithGoogle", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              authorizationCode: code,
            }),
          });

          const result = await response.json();

          if (result.ok) {
            navigate({ to: "/studio" });
          } else {
            console.error("Google login failed:", result.reason);
            navigate({ to: "/" });
          }
        } catch (error) {
          console.error("Google login error:", error);
          navigate({ to: "/" });
        }
      };

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
        handleTwitterCallback(code, codeVerifier);
      } else {
        // Handle Google OAuth callback
        handleGoogleCallback(code);
      }
    },
    [navigate]
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
