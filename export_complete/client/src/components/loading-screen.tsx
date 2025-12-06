import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
          BookMyLook
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading your beauty experience...</p>
        </div>
      </div>
    </div>
  );
}

export function ConnectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">📱</div>
        <h1 className="text-2xl font-bold text-gray-800">
          Connection Problem
        </h1>
        <p className="text-gray-600">
          We're having trouble connecting to our servers. Please check your internet connection and try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
