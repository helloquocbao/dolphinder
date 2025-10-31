"use client";
import { useEffect, useState, useRef } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import Silk from "../react-bits/Silk";
import { PACKAGE_ID } from "@/lib/constant";

interface ProjectWithProfile {
  id: string;
  name: string;
  description: string;
  link_demo: string;
  tags: string[];
  created_at: number;
  profileId: string;
  profileName: string;
  profileAvatar: string;
  profileOwner: string;
}

export const ListProjectWrap = () => (
  <GlobalSuiProvider>
    <ListProject />
  </GlobalSuiProvider>
);

export const ListProject = () => {
  const client = useSuiClient();
  const [projects, setProjects] = useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAllProjects();
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
  }, [projects]);

  const loadMore = () => {
    if (visibleCount < projects.length) setVisibleCount(prev => prev + 15);
  };

  async function fetchAllProjects() {
    try {
      setLoading(true);

      const allProjects: ProjectWithProfile[] = [];

      // 1️⃣ Lấy tất cả ProfileCreated events để biết danh sách profile
      const eventType = `${PACKAGE_ID}::profiles::ProfileCreated`;
      const eventRes = await client.queryEvents({
        query: { MoveEventType: eventType },
        limit: 1000,
        order: "descending",
      });

      const profileList = eventRes.data.map((e: any) => ({
        profileId: e.parsedJson.profile_id,
        owner: e.parsedJson.owner,
        name: e.parsedJson.name,
      }));

      // 2️⃣ Lấy dynamic field (ProjectKey) từ từng profile → danh sách project
      for (const profile of profileList) {
        try {
          const dynamicFields = await client.getDynamicFields({
            parentId: profile.profileId,
          });

          const projectKeys = dynamicFields.data.filter(f =>
            f.name?.type?.includes(`${PACKAGE_ID}::profiles::ProjectKey`)
          );

          // 3️⃣ Lấy chi tiết từng project (và gắn thông tin profile)
          for (const key of projectKeys) {
            const projectObj = await client.getDynamicFieldObject({
              parentId: profile.profileId,
              name: key.name,
            });

            const data = (projectObj.data?.content as any)?.fields?.value
              ?.fields;
            if (!data) continue;

            // 🔹 Lấy thông tin chi tiết của profile NFT từ on-chain
            const profileObj = await client.getObject({
              id: profile.profileId,
              options: { showContent: true },
            });

            const f = profileObj.data?.content?.fields;

            allProjects.push({
              id: projectObj.data?.objectId,
              name: data.name,
              description: data.description,
              link_demo: data.link_demo,
              tags: Array.isArray(data.tags)
                ? data.tags.map((t: string) => t.trim())
                : [],
              created_at: parseInt(data.created_at),
              profileId: profile.profileId,
              profileName: f?.name || profile.name,
              profileAvatar: f?.avatar_url || "",
              profileOwner: f?.owner || profile.owner,
            });
          }
        } catch (err) {
          console.warn("⚠️ Load projects from profile failed:", profile.name);
        }
      }

      setProjects(allProjects);
    } catch (err) {
      console.error("❌ Fetch all projects failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // 🧭 UI render
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white/70">
        Loading projects...
      </div>
    );

  if (projects.length === 0)
    return (
      <div className="flex h-screen items-center justify-center text-white/70">
        No projects found
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
          🧩 Dolphinder Projects
        </h1>
        <p className="mt-4 text-base text-blue-100/90">
          Explore all on-chain developer projects minted via ProfileNFT.
        </p>
      </header>

      {/* 🧱 Project list */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.slice(0, visibleCount).map(proj => (
            <div
              key={proj.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/15 to-white/5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:from-white/25 hover:to-white/10 hover:shadow-2xl"
            >
              {/* 🔹 Project header */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-cyan-300 group-hover:text-cyan-200">
                  {proj.name || "Untitled Project"}
                </h3>
                <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm text-white/80">
                  {proj.description || "No description provided."}
                </p>
                {proj.link_demo && (
                  <a
                    href={proj.link_demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200"
                  >
                    🔗 Visit Demo →
                  </a>
                )}
                {proj.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proj.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 👤 Owner info */}
              <div className="border-t border-white/10 bg-white/5 p-4 text-center">
                <div className="flex flex-col items-center">
                  <img
                    src={proj.profileAvatar || "/placeholder-avatar.png"}
                    alt={proj.profileName}
                    className="h-12 w-12 rounded-full border-2 border-cyan-400/70 object-cover"
                  />
                  <p
                    onClick={() =>
                      (window.location.href = `/profile/${proj.profileId}`)
                    }
                    className="mt-2 cursor-pointer text-sm font-semibold text-white hover:text-cyan-200 hover:underline"
                  >
                    {proj.profileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {proj.profileOwner.slice(0, 6)}...
                    {proj.profileOwner.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loader trigger */}
        <div ref={loaderRef} className="mt-10 flex justify-center">
          {visibleCount < projects.length ? (
            <p className="animate-pulse text-sm text-cyan-200/70">
              Scroll to load more...
            </p>
          ) : (
            <p className="text-sm text-cyan-200/70">🎉 All projects loaded!</p>
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
