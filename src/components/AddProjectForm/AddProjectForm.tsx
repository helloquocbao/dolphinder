"use client";
import React, { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/lib/constant";

const AddProjectForm = ({ profileId }: { profileId: string }) => {
  const [form, setForm] = useState({
    name: "",
    link_demo: "",
    description: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  const handleMint = async () => {
    if (!profileId) return alert("Không tìm thấy Profile ID");
    try {
      setLoading(true);
      const tx = new Transaction();
      const tagsArray = form.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::add_project`,
        arguments: [
          tx.object(profileId),
          tx.pure.string(form.name),
          tx.pure.string(form.link_demo),
          tx.pure.string(form.description),
          tx.pure.vector("string", tagsArray),
          tx.object("0x6"),
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
        gasBudget: 1000000000,
      });

      await client.waitForTransaction({
        digest: result.digest,
        options: { showEvents: true, showObjectChanges: true },
      });

      alert("✅ Đã thêm project thành công!");
      setForm({ name: "", link_demo: "", description: "", tags: "" });
    } catch (err: any) {
      console.error("Mint project error:", err);
      alert("❌ Thêm project thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-white/10 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">
        ➕ Thêm dự án mới
      </h3>
      <div className="space-y-2">
        <input
          className="w-full rounded border border-gray-500 bg-transparent p-2 text-sm text-white"
          placeholder="Tên dự án"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full rounded border border-gray-500 bg-transparent p-2 text-sm text-white"
          placeholder="Demo URL"
          value={form.link_demo}
          onChange={e => setForm({ ...form, link_demo: e.target.value })}
        />
        <textarea
          className="w-full rounded border border-gray-500 bg-transparent p-2 text-sm text-white"
          rows={3}
          placeholder="Mô tả"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="w-full rounded border border-gray-500 bg-transparent p-2 text-sm text-white"
          placeholder="Tags (ngăn cách bằng dấu phẩy)"
          value={form.tags}
          onChange={e => setForm({ ...form, tags: e.target.value })}
        />

        <button
          onClick={handleMint}
          disabled={loading}
          className={`mt-2 w-full rounded px-4 py-2 text-white ${
            loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "⏳ Đang mint..." : "Mint Project"}
        </button>
      </div>
    </div>
  );
};

export default AddProjectForm;
