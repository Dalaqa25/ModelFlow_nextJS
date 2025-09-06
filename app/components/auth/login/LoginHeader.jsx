'use client';

export default function LoginHeader() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
        Welcome Back
      </div>
      <h2 className="text-4xl font-bold text-white mb-2">
        Sign in to your account
      </h2>
      <p className="text-gray-300">
        Access your AI model marketplace
      </p>
    </div>
  );
}