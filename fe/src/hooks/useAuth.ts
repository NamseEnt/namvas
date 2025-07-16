import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { api } from "@/lib/api";

// PKCE helper functions for Twitter OAuth
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  const array = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["auth"],
    queryFn: api.getMe,
    retry: false,
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  const devLoginMutation = useMutation({
    mutationFn: api.loginDev,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      console.error("Dev login failed:", error);
    },
  });

  // Google 로그인 초기화
  const initiateGoogleLogin = useCallback(() => {
    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    googleAuthUrl.searchParams.set(
      "client_id",
      import.meta.env.VITE_GOOGLE_CLIENT_ID
    );
    googleAuthUrl.searchParams.set(
      "redirect_uri",
      import.meta.env.VITE_GOOGLE_REDIRECT_URI
    );
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", "google_login");

    // Redirect to Google OAuth
    window.location.href = googleAuthUrl.toString();
  }, []);

  // X(Twitter) 로그인 초기화
  const initiateXLogin = useCallback(async () => {
    // Generate code verifier and challenge for PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier in sessionStorage for later use
    sessionStorage.setItem("twitter_code_verifier", codeVerifier);

    // Create Twitter OAuth URL
    const twitterAuthUrl = new URL("https://twitter.com/i/oauth2/authorize");
    twitterAuthUrl.searchParams.set("response_type", "code");
    twitterAuthUrl.searchParams.set(
      "client_id",
      import.meta.env.VITE_TWITTER_CLIENT_ID
    );
    twitterAuthUrl.searchParams.set(
      "redirect_uri",
      import.meta.env.VITE_TWITTER_REDIRECT_URI
    );
    twitterAuthUrl.searchParams.set("scope", "tweet.read users.read");
    twitterAuthUrl.searchParams.set("state", "state");
    twitterAuthUrl.searchParams.set("code_challenge", codeChallenge);
    twitterAuthUrl.searchParams.set("code_challenge_method", "S256");

    // Redirect to Twitter OAuth
    window.location.href = twitterAuthUrl.toString();
  }, []);

  return {
    // 사용자 정보
    data: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,

    // 로그아웃
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,

    // 소셜 로그인
    loginWithGoogle: initiateGoogleLogin,
    loginWithX: initiateXLogin,

    // 개발 로그인
    loginDev: devLoginMutation.mutate,
    isDevLogging: devLoginMutation.isPending,
    devLoginError: devLoginMutation.error,

    // 유틸리티
    isAuthenticated: !!userQuery.data,
    refetchUser: userQuery.refetch,
  };
}
