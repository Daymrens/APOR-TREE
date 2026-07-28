"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [key, ...rest] = c.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function clearFamilyCookies() {
  const cookies = ["family-session", "family-member-id", "family-member-name", "family-member-branch"];
  cookies.forEach((name) => {
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    setName(getCookie("family-member-name"));
    setBranch(getCookie("family-member-branch"));
  }, []);

  const handleSignOut = () => {
    clearFamilyCookies();
    router.push("/gate");
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <BackButton />

      <div className="glass-card rounded-2xl p-8 mt-6 bg-white/50 backdrop-blur animate-fade-in">
        <h1 className="font-heading text-3xl text-balete mb-6">Settings</h1>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-hibiscus/20 to-hibiscus/5 flex items-center justify-center">
            <span className="font-heading text-lg text-hibiscus font-semibold">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
          <div>
            <p className="font-heading text-lg text-balete">Signed in as {name || "Unknown"}</p>
            {branch && (
              <p className="text-soft text-sm font-sans">{branch} branch</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 mb-6 bg-white/50 backdrop-blur">
          <p className="text-soft text-sm font-sans mb-1">Identity</p>
          <p className="font-sans text-balete font-medium">{name || "Not identified"}</p>
          <p className="text-soft text-xs font-sans mt-1">Branch: {branch || "Not specified"}</p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-heading font-semibold hover:bg-red-700 active:scale-[0.98] transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}