import React from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const ErrorBoundary = () => {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status || error.statusCode : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error?.message || "An unexpected error occurred.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-red-600 mb-2">Error {status}</h1>
      <p className="text-lg text-gray-700">{message}</p>
    </div>
  );
};

export default ErrorBoundary;
