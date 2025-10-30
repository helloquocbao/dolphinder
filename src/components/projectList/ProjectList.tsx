"use client";
import { useEffect, useState } from "react";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";

interface ProjectItem {
  objectId: string;
  index: number;
  name: string;
  link_demo: string;
  description: string;
  tags: string[];
  created_at: number | null;
}

export const ProjectList = ({ profileId }: { profileId: string }) => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    loadProjects();
  }, [profileId]);

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await client.getDynamicFields({ parentId: profileId });

      const projectEntries = await Promise.all(
        res.data.map(async item => {
          const obj = await client.getObject({
            id: item.objectId,
            options: { showContent: true },
          });

          const object = obj.data?.content?.fields.value;
          console.log("❇️ Project object data:", object?.fields);
          return {
            objectId: item.objectId,
            index: obj.data?.content?.fields?.name?.fields?.index,
            name: object?.fields?.name,
            link_demo: object?.fields?.link_demo,
            description: object?.fields?.description,
            tags: (object?.fields?.tags || []).map((t: any) => t),
            created_at: object?.fields?.created_at ?? null,
          } as ProjectItem;
        })
      );
      console.log("❇️ Dynamic fields for projects:", projectEntries);
      setProjects(projectEntries);
    } catch (e) {
      console.error("❌ Load projects error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Đang tải danh sách dự án...</div>;
  if (projects.length === 0)
    return <div className="text-gray-400">Chưa có dự án nào.</div>;
  console.log("Projects to display:", projects);
  return (
    <div className="mt-4 grid grid-cols-1 gap-4">
      {projects.map((p, i) => (
        <div
          onClick={() =>
            (window.location.href = `/project/${p.objectId}?profileId=${profileId}&&index=${p.index}`)
          }
          key={i}
          className="rounded-lg border border-gray-300 bg-white/10 p-4 shadow"
        >
          <h3 className="text-lg font-semibold text-blue-300">
            {p.name || "(Không có tên)"}
          </h3>
          <p className="mt-1 text-sm text-gray-300">
            {p.description || "Không có mô tả"}
          </p>
          {p.link_demo && (
            <a
              href={p.link_demo}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-xs text-blue-400 underline"
            >
              🔗 {p.link_demo}
            </a>
          )}
          {p.tags?.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Tags: {p.tags.join(", ")}
            </div>
          )}
          {p.created_at && (
            <div className="mt-1 text-[11px] text-gray-500">
              ⏰ {new Date(Number(p.created_at)).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
