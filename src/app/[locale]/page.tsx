import React from "react";
import { LoginForm } from "@/components/LoginForm/page";
import { LoginBackground } from "@/components/LoginBackground/page";

export default function Home() {
  return (
    <div className="login-page-shell flex min-h-[calc(100vh-7rem)] w-full items-center justify-center">
      <LoginBackground />
      <LoginForm />
    </div>
  );
}
