"use client";
import { useEffect, useState, type FC } from "react";
import { getAllProfilesWithDetails } from "@/lib/getProfiles";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import { PACKAGE_ID } from "@/lib/constant";
import { BigPeekCarousel } from "../BigPeekCarousel/BigPeekCarousel";
import Silk from "../react-bits/Silk";

export const DeveloperBubbleWrap: FC = () => (
  <GlobalSuiProvider>
    <DeveloperBubble />
  </GlobalSuiProvider>
);

export const DeveloperBubble: FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListProfiles();
  }, []);

  const getListProfiles = async () => {
    try {
      setLoading(true);
      const data = await getAllProfilesWithDetails(PACKAGE_ID, 15);
      setProfiles(data);
    } catch (error) {
      console.error("❌ Load profiles error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <>
        <div className="fixed inset-0 -z-10">
          <Silk
            speed={5}
            scale={1}
            color="#0a0f1c"
            noiseIntensity={1.2}
            rotation={0}
          />
        </div>
        <div className="mt-10 text-center text-white/70">
          Loading profiles...
        </div>
      </>
    );
  if (profiles.length === 0)
    return (
      <div className="relative flex min-h-screen flex-col items-center text-center text-white">
        <div className="fixed inset-0 -z-10">
          <Silk
            speed={5}
            scale={1}
            color="#0a0f1c"
            noiseIntensity={1.2}
            rotation={0}
          />
        </div>
        <div
          className="mt-24 mb-10 space-y-4 px-4"
          style={{
            animation: "fadeInUp 0.8s ease-out both",
          }}
        >
          <h1 className="bg-gradient-to-r from-blue-300 via-white to-blue-500 bg-clip-text text-4xl font-extrabold text-transparent md:text-6xl">
            Dolphinder Nation 🌍
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Discover, connect, and celebrate the builders of the Sui ecosystem.
          </p>
          <p className="text-sm text-white/50">
            The on-chain developer directory — powered by{" "}
            <span className="font-medium text-blue-300">Sui Move</span>.
          </p>

          {/* CTA */}
          <button
            onClick={() => (window.location.href = "/my-profile")}
            className="mt-4 rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-600"
          >
            🚀 Mint Your Developer Profile
          </button>
        </div>
      </div>
    );

  return (
    <>
      {/* 🌀 Background */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#13244D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* 🌟 Main Content */}
      <div className="relative flex min-h-screen flex-col items-center text-center text-white">
        {/* ✨ Hero Section */}
        <div
          className="mt-24 mb-10 space-y-4 px-4"
          style={{
            animation: "fadeInUp 0.8s ease-out both",
          }}
        >
          <h1 className="bg-gradient-to-r from-blue-300 via-white to-blue-500 bg-clip-text text-4xl font-extrabold text-transparent md:text-6xl">
            Dolphinder Nation 🌍
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Discover, connect, and celebrate the builders of the Sui ecosystem.
          </p>
          <p className="text-sm text-white/50">
            The on-chain developer directory — powered by{" "}
            <span className="font-medium text-blue-300">Sui Move</span>.
          </p>

          {/* CTA */}
          <button
            onClick={() => (window.location.href = "/my-profile")}
            className="mt-4 rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-600"
          >
            🚀 Mint Your Developer Profile
          </button>
        </div>

        {/* 💫 Carousel Section */}
        <div className="container w-full">
          <BigPeekCarousel profiles={profiles} />
        </div>

        {/* 👣 Footer CTA */}
        <div className="mt-12 mb-6 text-sm text-white/60">
          Built with 💙 by{" "}
          <span className="font-semibold text-blue-400">Dolphinder</span>
        </div>
      </div>

      {/* 🪄 Inline animation keyframes */}
      <style>
        {`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
};
