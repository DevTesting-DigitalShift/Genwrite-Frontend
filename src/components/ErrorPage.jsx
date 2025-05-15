import React from "react";

const ErrorPage = () => {
  return (
    <main className="grid min-h-full place-items-center py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-2xl font-semibold text-red-500">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/dash"
            className="rounded-md bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Go back home
          </a>
          <a href="#" className="text-sm font-semibold text-gray-900">
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
