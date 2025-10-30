"use client";
import { useEffect, useState, type FC } from "react";
import { getAllProfilesWithDetails } from "@/lib/getProfiles";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import { PACKAGE_ID } from "@/lib/constant";
import { BigPeekCarousel } from "../BigPeekCarousel/BigPeekCarousel";
import Silk from "../react-bits/Silk";

export const DeveloperBubbleWrap: FC = () => {
  return (
    <GlobalSuiProvider>
      <DeveloperBubble />
    </GlobalSuiProvider>
  );
};

export const DeveloperBubble: FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListProfiles();
  }, []);

  const getListProfiles = async () => {
    try {
      setLoading(true);
      const data = await getAllProfilesWithDetails(PACKAGE_ID);
      setProfiles(data);
    } catch (error) {
      console.error("❌ Load profiles error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="mt-10 text-center">Loading profiles...</div>;
  if (profiles.length === 0)
    return <div className="mt-10 text-center">No profiles found</div>;

  return (
    <>
      {/* 🌀 Background layer */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#4DA2FF"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* 💫 Foreground content */}
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="container w-full">
          <BigPeekCarousel profiles={profiles} />
        </div>
      </div>
    </>
  );
};
