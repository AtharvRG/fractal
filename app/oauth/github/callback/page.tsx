"use client";
export default function GithubCallbackPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-tuna text-white font-sans">
      <div className="bg-[#2c2a3b] p-6 rounded-xl border border-white/10 shadow-xl w-[340px] text-center space-y-4">
        <h1 className="text-base font-semibold">GitHub OAuth Disabled</h1>
        <p className="text-xs text-white/60 leading-relaxed">
          The GitHub authentication flow is currently disabled while the feature is being worked on. You can close this page.
        </p>
      </div>
    </div>
  );
}
