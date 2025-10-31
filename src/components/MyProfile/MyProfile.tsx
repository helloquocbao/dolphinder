"use client";
import { useEffect, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import Silk from "../react-bits/Silk";
import { PACKAGE_ID, REGISTRY_ID } from "@/lib/constant";
import { getProfileProjects } from "@/lib/getProfiles";
import ProjectTab from "./ProjectTab";
import CertificateTab from "./CertificateTab";

const MyProfileWrap = () => (
  <GlobalSuiProvider>
    <MyProfile />
  </GlobalSuiProvider>
);

const MyProfile = () => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "certs">("projects");
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    email: "",
    github: "",
    yoursite: "",
  });

  useEffect(() => {
    if (account?.address) fetchProfile();
  }, [account]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const type = `${PACKAGE_ID}::profiles::ProfileNFT`;
      const objects = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: type },
        options: { showContent: true },
      });

      if (objects.data.length === 0) {
        setProfileId(null);
        setForm({
          name: "",
          bio: "",
          avatar_url: "",
          banner_url: "",
          email: "",
          github: "",
          yoursite: "",
        });
      } else {
        const obj = objects.data[0].data!;
        const f = obj.content.fields as any;

        setProfileId(obj.objectId);
        setForm({
          name: f.name,
          bio: f.bio,
          avatar_url: f.avatar_url,
          banner_url: f.banner_url,
          email: f.social_links?.[0] || "",
          github: f.social_links?.[1] || "",
          yoursite: f.social_links?.[2] || "",
        });
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  }

  // === Mint or update ===
  async function handleSubmit() {
    if (!account?.address) {
      alert("⚠️ Please connect your wallet before proceeding.");
      return;
    }

    if (!form.name.trim()) {
      alert("⚠️ Please enter your display name.");
      return;
    }

    const hasAnyLink = [form.email, form.github, form.yoursite].some(Boolean);
    if (!hasAnyLink) {
      alert("⚠️ Please enter at least one link (Email, GitHub, or Website).");
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = form.avatar_url;
      let bannerUrl = form.banner_url;

      // Nếu user chọn file mới → upload trước
      if (avatarFile) avatarUrl = await uploadToWalrus(avatarFile);
      if (bannerFile) bannerUrl = await uploadToWalrus(bannerFile);

      const tx = new Transaction();
      const links = [form?.email, form?.github, form?.yoursite].filter(Boolean);

      if (profileId) {
        // === Update profile ===
        tx.moveCall({
          target: `${PACKAGE_ID}::profiles::update_profile`,
          arguments: [
            tx.object(profileId),
            tx.pure.string(form.name),
            tx.pure.string(form.bio),
            tx.pure.string(avatarUrl),
            tx.pure.string(bannerUrl),
            tx.pure.vector("string", links),
          ],
        });
      } else {
        // === Mint new profile ===
        tx.moveCall({
          target: `${PACKAGE_ID}::profiles::mint_profile`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.string(form.name),
            tx.pure.string(form.bio),
            tx.pure.string(avatarUrl),
            tx.pure.string(bannerUrl),
            tx.pure.vector("string", links),
            tx.object("0x6"), // Clock
          ],
        });
      }

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true },
      });

      alert(profileId ? "✅ Cập nhật thành công!" : "✅ Mint thành công!");
      setAvatarFile(null);
      setBannerFile(null);
      fetchProfile();
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Lỗi: " + err.message);
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
    <>
      {/* 🌌 Background */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#13244D"
          noiseIntensity={1.3}
          rotation={0}
        />
      </div>

      {/* 🖼 Banner */}
      <div className="relative h-[16rem] w-full">
        <img
          src={form.banner_url}
          alt="banner"
          className="h-full w-full object-cover brightness-90"
        />
        <div className="font-display group hover:bg-accent absolute right-0 bottom-4 z-20 mr-1 flex items-center rounded-lg bg-[#e7e8ec] px-4 py-2 text-sm">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
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

        <div className="absolute inset-0 bg-gradient-to-t from-[#13244D]/95 via-[#13244D]/40 to-transparent" />
        <div className="absolute -bottom-16 left-1/2 z-20 -translate-x-1/2">
          <img
            src={form.avatar_url}
            alt="avatar"
            className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-[0_0_20px_rgba(77,162,255,0.5)] ring-4 ring-cyan-400/60"
          />
          <div className="group hover:bg-accent border-jacarta-100 absolute -right-3 -bottom-2 h-8 w-8 overflow-hidden rounded-full border bg-[#e7e8ec] text-center hover:border-transparent">
            <input
              type="file"
              accept="image/*"
              className="absolute top-0 left-0 w-full cursor-pointer opacity-0"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  previewImage(file, "avatar_url");
                }
              }}
            />
            <div className="flex h-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="fill-jacarta-400 group-hover:fill- h-4 w-4"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ Main layout */}
      <section className="mt-24 px-6 pb-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row">
          {/* 🧩 Left Form Info */}
          <div className="w-full rounded-2xl border border-white/10 bg-white/10 p-6 text-white backdrop-blur-xl md:w-2/5">
            <h2 className="mb-4 text-center text-2xl font-bold text-cyan-300">
              Edit Profile
            </h2>
            <label className="block text-sm font-semibold text-cyan-200">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
              placeholder="Your name"
            />

            <label className="mt-4 block text-sm font-semibold text-cyan-200">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-cyan-400 focus:outline-none"
              placeholder="Tell your story..."
            />

            <label className="mt-4 block text-sm font-semibold text-cyan-200">
              Links
            </label>
            <input
              type="text"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="mt-1 w-full rounded-t-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
            <input
              type="text"
              value={form.github}
              onChange={e => setForm({ ...form, github: e.target.value })}
              placeholder="@GitHub"
              className="mt-px w-full border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
            <input
              type="url"
              value={form.yoursite}
              onChange={e => setForm({ ...form, yoursite: e.target.value })}
              placeholder="yoursite.com"
              className="mt-px w-full rounded-b-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? "⏳ Saving..." : "💾 Save Info"}
            </button>
          </div>

          {/* 🧱 Right Tabs */}
          <div className="w-full rounded-2xl border border-white/10 bg-white/10 p-6 text-white backdrop-blur-xl md:w-3/5">
            {/* Tabs header */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-2 text-center font-semibold ${
                  activeTab === "projects"
                    ? "border-b-2 border-cyan-400 text-cyan-300"
                    : "text-white/70 hover:text-white"
                }`}
              >
                🧱 Projects
              </button>
              <button
                onClick={() => setActiveTab("certs")}
                className={`flex-1 py-2 text-center font-semibold ${
                  activeTab === "certs"
                    ? "border-b-2 border-cyan-400 text-cyan-300"
                    : "text-white/70 hover:text-white"
                }`}
              >
                🎓 Certificates
              </button>
            </div>

            {/* Tabs content */}
            <div className="mt-6 space-y-3">
              {activeTab === "projects" ? (
                <ProjectTab profileId={profileId} />
              ) : (
                <CertificateTab
                  profileId={profileId}
                  accountAdress={account?.address}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MyProfileWrap;
