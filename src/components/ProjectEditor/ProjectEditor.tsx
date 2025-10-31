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
import Silk from "../react-bits/Silk";

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
  const [saving, setSaving] = useState(false);

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
      setSaving(true);

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::update_project`,
        arguments: [
          tx.object(profileId),
          tx.pure.u64(projectIndex),
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
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="animate-pulse text-center text-gray-400">
        Đang tải dữ liệu dự án...
      </div>
    );

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
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 text-white shadow-2xl backdrop-blur-md">
        <h2 className="mb-6 text-center text-2xl font-semibold text-cyan-300">
          ✏️ Edit Project
        </h2>

        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Tên dự án
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 transition outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Nhập tên dự án"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Mô tả</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 transition outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Mô tả ngắn gọn về dự án..."
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Link demo
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 transition outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              placeholder="https://your-demo-link.com"
              value={form.link_demo}
              onChange={e => setForm({ ...form, link_demo: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Tags (cách nhau bằng dấu phẩy)
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 transition outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Ví dụ: web3, sui, nft"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-cyan-500/90 to-blue-500/90 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "⏳ Đang cập nhật..." : "💾 Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectEditorWrap;
