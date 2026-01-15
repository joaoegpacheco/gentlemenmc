"use client";

// Force dynamic rendering to avoid build-time prerendering errors
export const dynamic = 'force-dynamic';

import React from "react";
import { OpenComandasPageContent } from "@/components/OpenComandasPageContent/page";

export default function Page() {
  return <OpenComandasPageContent />;
}
