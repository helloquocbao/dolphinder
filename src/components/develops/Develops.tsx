"use client";
import { useEffect, useState, useRef, type FC } from "react";
import { getAllProfilesWithDetails } from "@/lib/getProfiles";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import { PACKAGE_ID } from "@/lib/constant";
import Silk from "../react-bits/Silk";

export const DevelopersWrap: FC = () => (
  <GlobalSuiProvider>
    <Developers />
  </GlobalSuiProvider>
);

export const Developers: FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getListProfiles();
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting) loadMore();
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [profiles]);

  const getListProfiles = async () => {
    try {
      setLoading(true);
      const data = await getAllProfilesWithDetails(PACKAGE_ID, 200);
      setProfiles(data || []);
    } catch (error) {
      console.error("❌ Load profiles error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (visibleCount < profiles.length) {
      setVisibleCount(prev => prev + 15);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white/70">
        Loading profiles...
      </div>
    );

  if (profiles.length === 0)
    return (
      <div className="flex h-screen items-center justify-center text-white/70">
        No profiles found
      </div>
    );

  return (
    <>
      {/* 🌌 Background */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#13244D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-10 text-center text-white">
        <h1 className="bg-gradient-to-r from-cyan-300 via-white to-indigo-400 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-md md:text-5xl">
          Dolphinder Nation 🌍
        </h1>
        <p className="mt-4 text-base text-blue-100/90">
          Explore all developers building on the Sui ecosystem.
        </p>
      </header>

      {/* 👥 Profiles */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profiles.slice(0, visibleCount).map(profile => (
            <div
              key={profile.profileId}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/15 to-white/5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:from-white/25 hover:to-white/10 hover:shadow-2xl"
            >
              {/* 🖼️ Banner */}
              <div className="relative h-28 w-full overflow-hidden rounded-t-2xl">
                {profile.bannerUrl ? (
                  <img
                    src={profile.bannerUrl}
                    alt={`${profile.name} banner`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 opacity-80" />
                )}
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* 🧑 Avatar */}
              <div className="relative -mt-10 flex justify-center">
                <img
                  src={profile.avatarUrl || "/placeholder-avatar.png"}
                  alt={profile.name}
                  className="h-20 w-20 rounded-full border-4 border-slate-900/60 object-cover ring-2 ring-cyan-400/70 transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* 📄 Info */}
              <div className="p-5 text-center">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300">
                  {profile.name || "Unnamed Developer"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">
                  {profile.bio || "No bio provided."}
                </p>

                <div className="mt-3 flex justify-center gap-4 text-xs text-cyan-200/90">
                  <span>🏗️ {profile.projectCount} projects</span>
                  <span>🎓 {profile.certificateCount} certs</span>
                </div>

                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() =>
                      (window.location.href = `/profile/${profile.profileId}`)
                    }
                    className="rounded-lg bg-gradient-to-r from-cyan-500/90 to-blue-500/90 px-5 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:from-cyan-400 hover:to-blue-500"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loader trigger */}
        <div ref={loaderRef} className="mt-10 flex justify-center">
          {visibleCount < profiles.length ? (
            <p className="animate-pulse text-sm text-cyan-200/70">
              Scroll to load more...
            </p>
          ) : (
            <p className="text-sm text-cyan-200/70">🎉 All profiles loaded!</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mb-10 text-center text-sm text-cyan-200/70">
        Built with 💙 by{" "}
        <span className="font-semibold text-cyan-400">Dolphinder</span>
      </footer>
    </>
  );
};
