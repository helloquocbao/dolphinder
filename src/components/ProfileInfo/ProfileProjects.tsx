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
    <section className="mt-12 text-left">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
        🧩 Projects by This Profile
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 italic">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          No projects found for this profile.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {projects.map(p => (
            <div
              key={p.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-4">
                <h3 className="truncate font-semibold text-gray-800">
                  {p.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {p.description}
                </p>
                <div className="mt-3 text-sm text-gray-500">
                  <span className="block">
                    🕒 {new Date(p.created_at).toLocaleString()}
                  </span>
                  {p.link_demo && (
                    <a
                      href={p.link_demo}
                      target="_blank"
                      className="text-indigo-600 hover:underline"
                    >
                      🔗 Demo
                    </a>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.tags?.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfileProjects;
