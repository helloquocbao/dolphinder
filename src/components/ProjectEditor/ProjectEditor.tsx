"use client";
import { useEffect, useState, type FC } from "react";
import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/lib/constant";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";

interface ProjectEditorWrapProps {
  projectId: string;
  profileId: string;
  projectIndex: number;
}

const ProjectEditorWrap: FC<ProjectEditorWrapProps> = ({
  projectId,
  profileId,
  projectIndex,
}) => (
  <GlobalSuiProvider>
    <ProjectEditor
      profileId={profileId}
      projectIndex={projectIndex}
      projectId={projectId}
    />
  </GlobalSuiProvider>
);

const ProjectEditor = ({
  projectId,
  profileId,
  projectIndex,
}: {
  projectId: string;
  profileId: string;
  projectIndex: number;
}) => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [form, setForm] = useState({
    name: "",
    description: "",
    link_demo: "",
    tags: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  /** 🧠 Load project bằng objectId */
  async function loadProject() {
    try {
      setLoading(true);

      const res = await client.getObject({
        id: projectId,
        options: { showContent: true },
      });

      const fields = res.data?.content?.fields?.value?.fields;
      if (fields) {
        setForm({
          name: fields.name || "",
          description: fields.description || "",
          link_demo: fields.link_demo || "",
          tags: Array.isArray(fields.tags) ? fields.tags.join(", ") : "",
        });
      } else {
        console.warn("⚠️ Không tìm thấy fields trong object:", res.data);
      }
    } catch (e) {
      console.error("❌ Load project error:", e);
    } finally {
      setLoading(false);
    }
  }

  /** 💾 Cập nhật project */
  async function handleUpdate() {
    if (!account?.address) {
      alert("⚠️ Vui lòng kết nối ví trước!");
      return;
    }

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::update_project`,
        arguments: [
          tx.object(profileId), // NFT Profile
          tx.pure.u64(projectIndex), // index (vẫn cần cho hàm Move)
          tx.pure.string(form.name),
          tx.pure.string(form.link_demo),
          tx.pure.string(form.description),
          tx.pure.vector(
            "string",
            form.tags
              .split(",")
              .map(t => t.trim())
              .filter(Boolean)
          ),
          tx.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });

      console.log("✅ Update tx:", result);
      alert("Cập nhật dự án thành công!");
    } catch (e: any) {
      console.error("❌ Update error:", e);
      alert("Lỗi cập nhật: " + e.message);
    }
  }

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded border p-2"
        placeholder="Tên dự án"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <textarea
        className="w-full rounded border p-2"
        placeholder="Mô tả"
        rows={3}
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="Link demo"
        value={form.link_demo}
        onChange={e => setForm({ ...form, link_demo: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="Tags, cách nhau bởi dấu phẩy"
        value={form.tags}
        onChange={e => setForm({ ...form, tags: e.target.value })}
      />
      <button
        onClick={handleUpdate}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        💾 Cập nhật dự án
      </button>
    </div>
  );
};

export default ProjectEditorWrap;
