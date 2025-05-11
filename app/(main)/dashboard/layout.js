"use client";

import { useState, useEffect } from "react";
import DashboardPage from "./page";
import { BarLoader } from "react-spinners";
import { Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Layout() {
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to check if loading takes too long
    const timer = setTimeout(() => {
      if (loading) {
        setError("Dashboard is taking longer than expected to load. Try refreshing the page.");
      }
    }, 5000);

    // Clean up timeout
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          {t('dashboard.title')}
        </h1>
      </div>
      {error && (
        <div className="p-4 my-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      )}
      <Suspense
        fallback={
          <div>
            <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
            <p className="text-center mt-2 text-gray-500">Loading dashboard data...</p>
          </div>
        }
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
}
