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

const MyProfileWrap = () => (
  <GlobalSuiProvider>
    <MyProfile />
  </GlobalSuiProvider>
);

const MyProfile = () => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

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

  const [projects, setProjects] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);

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
        getListProfiles(client, obj.objectId);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  }

  const getListProfiles = async (client: any, profileId: string) => {
    const listProject = await getProfileProjects(client, profileId);

    setProjects(listProject);
  };

  async function handleSubmit() {
    if (!account?.address) return alert("⚠️ Connect your wallet first");
    if (!form.name.trim()) return alert("⚠️ Please enter your name");

    try {
      setLoading(true);
      const tx = new Transaction();
      const links = [form.email, form.github, form.yoursite].filter(Boolean);
      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::update_profile`,
        arguments: [
          tx.object(profileId!),
          tx.pure.string(form.name),
          tx.pure.string(form.bio),
          tx.pure.string(form.avatar_url),
          tx.pure.string(form.banner_url),
          tx.pure.vector("string", links),
        ],
      });
      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({ digest: result.digest });
      alert("✅ Profile updated!");
      fetchProfile();
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
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
      <div className="relative h-[14rem] w-full overflow-hidden">
        <img
          src={form.banner_url}
          alt="banner"
          className="h-full w-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13244D]/95 via-[#13244D]/40 to-transparent" />
        <div className="absolute -bottom-16 left-1/2 z-20 -translate-x-1/2">
          <img
            src={form.avatar_url}
            alt="avatar"
            className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-[0_0_20px_rgba(77,162,255,0.5)] ring-4 ring-cyan-400/60"
          />
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
                projects.length ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {projects.map((proj: any, i: number) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-white/5 to-white/0 p-5 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-cyan-500/30"
                      >
                        {/* Background glow */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-blue-400/10 to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"></div>

                        {/* Header */}
                        <h4 className="relative z-10 mb-1 text-lg font-semibold text-cyan-300 group-hover:text-cyan-200">
                          {proj.name || "Untitled Project"}
                        </h4>

                        {/* Description */}
                        <p className="relative z-10 line-clamp-3 text-sm text-white/70">
                          {proj.description || "No description provided."}
                        </p>

                        {/* Footer */}
                        {proj.link_demo && (
                          <a
                            href={proj.link_demo}
                            target="_blank"
                            className="relative z-10 mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
                          >
                            🔗 <span>View Demo</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-white/60">
                    No projects found.
                  </p>
                )
              ) : certs.length ? (
                certs.map((cert: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <h4 className="font-semibold text-cyan-300">{cert.name}</h4>
                    <p className="text-sm text-white/70">
                      Issuer: {cert.issuer}
                    </p>
                    <p className="text-xs text-white/50">Date: {cert.date}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-white/60">
                  No certificates found.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MyProfileWrap;
