"use client";

import { Suspense } from "react";
import RegisterContent from "./RegisterContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
