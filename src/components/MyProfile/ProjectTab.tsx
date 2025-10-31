"use client";
import { useEffect, useState } from "react";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/lib/constant";
import { getProfileProjects } from "@/lib/getProfiles";

export default function ProjectTab({
  profileId,
}: {
  profileId: string | null;
}) {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", desc: "", link: "", tags: "" });

  // 🧭 Load Project List
  useEffect(() => {
    if (profileId) fetchProjects();
  }, [profileId]);

  async function fetchProjects() {
    const list = await getProfileProjects(profileId!);
    console.log(list);
    setProjects(list || []);
  }

  // 🚀 Mint New Project
  async function mintProject() {
    if (!profileId) return alert("⚠️ Please mint your profile first!");
    if (!form.name.trim()) return alert("⚠️ Enter project name!");
    const tagsArray = form.tags
      ? form.tags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean)
      : [];
    try {
      setLoading(true);
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::add_project`,
        arguments: [
          tx.object(profileId),
          tx.pure.string(form.name),
          tx.pure.string(form.desc),
          tx.pure.string(form.link || ""),
          tx.pure.vector("string", tagsArray),
          tx.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({ digest: result.digest });

      alert("✅ Project minted successfully!");
      setForm({ name: "", desc: "", link: "" });
      fetchProjects();
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ✨ Mint Form */}
      <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-md">
        <h4 className="mb-3 text-lg font-semibold text-cyan-300">
          ➕ Mint New Project
        </h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Project name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <textarea
            placeholder="Description"
            value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="url"
            placeholder="Demo link (optional)"
            value={form.link}
            onChange={e => setForm({ ...form, link: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="tags"
            placeholder="Tags (separate with commas, e.g. web3, NFT, DeFi)"
            value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={mintProject}
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 disabled:opacity-50"
          >
            {loading ? "⏳ Minting..." : "🚀 Mint Project"}
          </button>
        </div>
      </div>

      {/* 📋 Project List */}
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.length ? (
          projects.map((proj, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-white/5 to-white/0 p-5 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-cyan-500/30"
            >
              <h4 className="text-lg font-semibold text-cyan-300 group-hover:text-cyan-200">
                {proj.name || "Untitled Project"}
              </h4>
              <p className="mt-1 text-sm text-white/70">
                {proj.description || "No description provided."}
              </p>
              {proj.link_demo && (
                <a
                  onClick={() =>
                    (window.location.href = `/project/${proj.id?.id}?index=${proj.projectIndex}&profileId=${profileId}`)
                  }
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
                >
                  🔗 View Edit
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-white/60">No projects found.</p>
        )}
      </div>
    </div>
  );
}
