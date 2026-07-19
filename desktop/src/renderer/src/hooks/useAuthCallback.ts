import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { completeOAuthCallback } from "../lib/auth-callback";

/** Handle landed://auth/callback deep links after Google OAuth (app-wide). */
export function useAuthCallback() {
  const navigate = useNavigate();
  const handlingRef = useRef(false);

  const handleAuthCallback = useCallback(
    async (url: string) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      try {
        const result = await completeOAuthCallback(url);
        if (result.ok) {
          navigate(result.route, { replace: true });
          return;
        }
        navigate("/auth", {
          replace: true,
          state: { oauthError: result.error },
        });
      } finally {
        handlingRef.current = false;
      }
    },
    [navigate],
  );

  useEffect(() => {
    return window.landed?.onAuthCallback?.((url) => {
      void handleAuthCallback(url);
    });
  }, [handleAuthCallback]);
}
