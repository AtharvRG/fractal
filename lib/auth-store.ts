import { create } from 'zustand';
import { persistGithubTokenEncrypted, restoreGithubTokenDecrypted } from './secure-session';

interface AuthState {
  githubToken: string | null;
  setGithubToken: (t: string | null) => void;
  isAuthenticating: boolean;
  setIsAuthenticating: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Kick off async restore (non-blocking)
  if (typeof window !== 'undefined') {
    restoreGithubTokenDecrypted().then(tok => { if (tok) set({ githubToken: tok }); });
  }
  return {
    githubToken: null,
    setGithubToken: (t) => { set({ githubToken: t }); if (t && typeof window !== 'undefined') persistGithubTokenEncrypted(t); },
    isAuthenticating: false,
    setIsAuthenticating: (v) => set({ isAuthenticating: v }),
  };
});
