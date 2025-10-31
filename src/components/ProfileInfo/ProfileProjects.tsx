"use client";
import { useEffect, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/lib/constant";

interface ProfileProjectsProps {
  profileId: string;
}

interface ProjectItem {
  id: string;
  name: string;
  link_demo: string;
  description: string;
  tags: string[];
  created_at: number;
}

const ProfileProjects = ({ profileId }: ProfileProjectsProps) => {
  const client = useSuiClient();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profileId) fetchProjects(profileId);
  }, [profileId]);

  async function fetchProjects(profileId: string) {
    try {
      setLoading(true);

      // 🧱 Lấy tất cả dynamic fields của ProfileNFT
      const fields = await client.getDynamicFields({ parentId: profileId });

      // 🔍 Lọc các dynamic field thuộc kiểu `ProjectKey`
      const projectKeys = fields.data.filter(f =>
        f.name?.type?.includes(`${PACKAGE_ID}::profiles::ProjectKey`)
      );

      // ⚙️ Lấy dữ liệu của từng project từ dynamic field
      const projectDetails = await Promise.all(
        projectKeys.map(async key => {
          try {
            const projectObj = await client.getDynamicFieldObject({
              parentId: profileId,
              name: key.name,
            });

            const data = (projectObj.data?.content as any)?.fields.value;

            return {
              id: projectObj?.data?.objectId,
              name: data?.fields.name,
              link_demo: data?.fields.link_demo,
              description: data?.fields.description,
              tags: data?.fields.tags,
              created_at: parseInt(data?.fields.created_at),
            };
          } catch (err) {
            console.warn("⚠️ Failed to load project:", err);
            return null;
          }
        })
      );

      setProjects(projectDetails.filter(Boolean) as ProjectItem[]);
    } catch (err) {
      console.error("❌ Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-16 mb-20 max-w-6xl text-white">
      <h2 className="mb-8 text-center text-2xl font-semibold text-cyan-300">
        🧩 Projects by This Profile
      </h2>

      {loading ? (
        <p className="text-center text-gray-400 italic">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-center text-gray-400 italic">
          No projects found for this profile.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <div
              key={p.id}
              className="group relative rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:from-white/15 hover:to-white/10 hover:shadow-2xl"
            >
              {/* Header */}
              <div className="mb-3">
                <h3 className="truncate text-lg font-semibold text-cyan-200 group-hover:text-cyan-300">
                  {p.name || "Untitled Project"}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/80">
                  {p.description || "No description available."}
                </p>
              </div>

              {/* Footer info */}
              <div className="mt-4 flex flex-col gap-2 text-sm text-gray-400">
                <span>🕒 {new Date(p.created_at).toLocaleString()}</span>
                {p.link_demo && (
                  <a
                    href={p.link_demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-fit text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    🔗 Visit Demo →
                  </a>
                )}
              </div>

              {/* Tags */}
              {p.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfileProjects;
