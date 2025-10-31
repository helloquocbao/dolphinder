"use client";
import { useEffect, useState } from "react";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/lib/constant";
import { getProfileCertificates } from "@/lib/getProfiles";

export default function CertificateTab({
  profileId,
  accountAdress,
}: {
  profileId: string | null;
  accountAdress: string | null;
}) {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [certs, setCerts] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    issuer: "",
    date: "",
    banner_url: "",
    description: "",
    credential_id: "",
  });

  // 🧭 Load Certificate List
  useEffect(() => {
    if (profileId) fetchCerts();
  }, [profileId]);

  async function fetchCerts() {
    const list = await getProfileCertificates(profileId!, accountAdress!);

    setCerts(list || []);
  }

  // 🏅 Mint Certificate
  async function mintCert() {
    if (!profileId) return alert("⚠️ Please mint your profile first!");
    if (!form.name.trim()) return alert("⚠️ Enter certificate name!");

    try {
      let bannerUrl = form.banner_url;
      if (bannerFile) bannerUrl = await uploadToWalrus(bannerFile);
      setLoading(true);
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::mint_certificate`,
        arguments: [
          tx.object(profileId),
          tx.pure.string(form.name),
          tx.pure.string(form.issuer || ""),
          tx.pure.string(form.date || ""),
          tx.pure.string(bannerUrl),
          tx.pure.string(form.description),
          tx.pure.string(form.credential_id),
          tx.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({ digest: result.digest });

      alert("✅ Certificate minted successfully!");
      setForm({
        name: "",
        issuer: "",
        date: "",
        banner_url: "",
        description: "",
        credential_id: "",
      });
      fetchCerts();
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function previewImage(file: File, field: "avatar_url" | "banner_url") {
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  // === Upload file to Walrus and return aggregator URL ===
  async function uploadToWalrus(file: File) {
    const imageBlob = new Blob([await file.arrayBuffer()], {
      type: file.type,
    });

    const res = await fetch(
      "https://publisher.walrus-testnet.walrus.space/v1/blobs",
      { method: "PUT", body: imageBlob }
    );
    if (!res.ok) throw new Error("Upload thất bại lên Walrus Publisher");

    const json = await res.json();
    const blobId = json?.newlyCreated?.blobObject?.blobId;
    if (!blobId) throw new Error("Không tìm thấy blobId trong phản hồi");

    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;
  }

  return (
    <div className="space-y-6">
      {/* ✨ Mint Form */}
      <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-5 backdrop-blur-md">
        <h4 className="mb-3 text-lg font-semibold text-cyan-300">
          ➕ Mint New Certificate
        </h4>
        <div className="space-y-3">
          <img
            src={form.banner_url}
            alt="banner"
            className="h-[18rem] w-full object-fill brightness-90"
          />
          <div className="font-display group hover:bg-accent flex items-center rounded-lg bg-[#e7e8ec] py-2 text-sm">
            <input
              type="file"
              accept="image/*"
              className="inset-0 cursor-pointer opacity-0"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setBannerFile(file);
                  previewImage(file, "banner_url");
                }
              }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="fill-jacarta-400 group-hover:fill- mr-1 h-4 w-4"
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z"></path>
            </svg>
            <span className="mt-0.5 block text-black">Edit cover photo</span>
          </div>

          <input
            type="text"
            placeholder="Certificate name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Issuer"
            value={form.issuer}
            onChange={e => setForm({ ...form, issuer: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Credential ID"
            value={form.credential_id}
            onChange={e => setForm({ ...form, credential_id: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
          />
          <textarea
            placeholder="Certificate description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={mintCert}
            disabled={loading || !profileId}
            className={`w-full rounded-full px-5 py-2 font-semibold text-white shadow-md transition-all ${
              !profileId
                ? "cursor-not-allowed bg-gray-500/60 opacity-70"
                : loading
                  ? "bg-gradient-to-r from-cyan-400 to-blue-400 opacity-80"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105"
            }`}
          >
            {!profileId
              ? "🔒 Mint Profile to Unlock Certificates"
              : loading
                ? "⏳ Minting..."
                : "🏅 Mint Certificate"}
          </button>
        </div>
      </div>

      {/* 📋 Certificate List */}
      <div className="grid gap-6 sm:grid-cols-2">
        {certs.length ? (
          certs.map((cert, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(0,255,255,0.25)]"
            >
              {/* Ảnh banner certificate */}
              <div className="h-40 w-full overflow-hidden">
                <img
                  src={cert.certificate_url}
                  alt={cert.title || "certificate"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Nội dung */}
              <div className="space-y-2 p-4">
                <h4 className="text-lg font-bold text-cyan-300 group-hover:text-cyan-200">
                  {cert.title}
                </h4>
                <p className="line-clamp-2 text-sm text-white/70">
                  {cert.description || "No description provided."}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                  <span>🏢 {cert.issuer || "Unknown issuer"}</span>
                  <span>📅 {cert.issue_date || "N/A"}</span>
                </div>

                {cert.credential_id && (
                  <p className="mt-2 text-[0.7rem] text-cyan-400/70">
                    Credential ID: {cert.credential_id}
                  </p>
                )}

                {cert.certificate_url && (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-center text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-cyan-500/30"
                  >
                    🔗 View Certificate
                  </a>
                )}
              </div>

              {/* Glow hiệu ứng viền */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-400/10 via-blue-400/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-center text-white/60">
            No certificates found.
          </p>
        )}
      </div>
    </div>
  );
}
