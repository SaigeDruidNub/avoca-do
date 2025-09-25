"use client";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
// import { useSession } from "next-auth/react";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

export default function Login() {
  // const { status } = useSession();
  // const router = useRouter();

  /*useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard"); // or /dashboard
  }, [status, router]);*/

  // optionally show a tiny loading state to prevent flicker
  //if (status === "authenticated") return null;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-secondary-dark font-sans">
      <div className="bg-primary-dark rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2 text-secondary">
          Login to Avoca-do
        </h1>
        <p className="text-center text-secondary-dark/80 mb-4">
          Sign in to connect with people who share your interests.
        </p>
        <button
          className="flex items-center gap-3 px-6 py-3 rounded-full bg-accent text-white font-semibold text-lg shadow hover:bg-secondary-dark transition-colors"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          <FaGoogle size={24} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
