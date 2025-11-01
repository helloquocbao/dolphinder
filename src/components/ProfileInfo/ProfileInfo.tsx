"use client";

import { useEffect, useState, type FC } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import Silk from "../react-bits/Silk";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import ProfileProjects from "./ProfileProjects";
import { getProfileCertificates, getProfileMinter } from "@/lib/getProfiles";
import {
  ADMIN_ADDRESS,
  ADMIN_CAP,
  PACKAGE_ID,
  REGISTRY_ID,
  REGISTRY_VERIFY_ID,
} from "@/lib/constant";
import { Transaction } from "@mysten/sui/transactions";
interface ProjectEditorWrapProps {
  profileId: string;
}

const ProfileInfoWrap: FC<ProjectEditorWrapProps> = ({ profileId }) => (
  <GlobalSuiProvider>
    <ProfileInfo profileId={profileId} />
  </GlobalSuiProvider>
);

const ProfileInfo = ({ profileId }: { profileId: string }) => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    email: "",
    github: "",
    yoursite: "",
    projectCount: 0,
    certificateCount: 0,
    verified: false,
  });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [voterProfile, setVoterProfile] = useState<string>("");

  useEffect(() => {
    if (account?.address) {
      fetchProfile().then(setVoterProfile);
    }
  }, [account?.address]);
  useEffect(() => {
    if (profileId) {
      fetchProfileDetail(profileId);
      fetchCertificates(profileId);
    }
  }, [profileId]);

  async function isProfileVerified() {
    // 1️⃣ Lấy VerifyRegistry object từ chain
    const res = await client.getObject({
      id: REGISTRY_VERIFY_ID,
      options: { showContent: true },
    });

    // 2️⃣ Lấy trường verified_list
    const verifiedList =
      res.data?.content?.fields?.verified_list?.map(addr =>
        addr.toLowerCase()
      ) || [];
    console.log("✅ Verified list:", verifiedList);
    // 3️⃣ So sánh profile hiện tại
    return verifiedList.includes(profileId.toLowerCase());
  }
  useEffect(() => {
    if (profileId && REGISTRY_VERIFY_ID) {
      isProfileVerified().then(setIsVerified);
    }
  }, [profileId]);

  async function fetchProfileDetail(profileId: string) {
    try {
      setLoading(true);
      const result = await client.getObject({
        id: profileId,
        options: { showContent: true },
      });

      if (!result.data?.content)
        return console.warn("⚠️ Profile not found on-chain.");
      const fields = (result.data.content as any).fields;
      const links = fields.social_links || [];

      setForm({
        name: fields.name || "",
        bio: fields.bio || "",
        avatar_url: fields.avatar_url || "",
        banner_url: fields.banner_url || "",
        email: links[0] || "",
        github: links[1] || "",
        yoursite: links[2] || "",
        projectCount: parseInt(fields.project_count || "0"),
        certificateCount: parseInt(fields.certificate_count || "0"),
        verified: fields.verified || false,
      });
    } catch (err) {
      console.error("❌ Failed to fetch profile detail:", err);
    } finally {
      setLoading(false);
    }
  }

  // 🧾 Fetch certificate list
  async function fetchCertificates(profileId: string) {
    try {
      const accountAddress = await getProfileMinter(profileId);
      const list = await getProfileCertificates(profileId!, accountAddress!);
      setCertificates(list);
    } catch (err) {
      console.error("❌ Failed to fetch certificates:", err);
    }
  }

  const handleAdminVerify = async () => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::verify_profile_admin`,
        arguments: [
          tx.object(ADMIN_CAP), // quyền admin
          tx.object(REGISTRY_VERIFY_ID),
          tx.object(profileId), // address của NFT user
          tx.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true },
      });
      alert("✅ Profile verified by admin!");
    } catch (err) {
      console.error(err);
      alert("❌ Verify failed!");
    }
  };
  async function fetchProfile() {
    setLoading(true);
    try {
      const type = `${PACKAGE_ID}::profiles::ProfileNFT`;
      const objects = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: type },
        options: { showContent: true },
      });

      console.log(objects);

      if (objects.data.length !== 0) {
        const obj = objects.data[0].data!;
        const f = obj.content.fields as any;
        console.log("🗳 Voter Profile NFT:", obj);
        return obj.objectId;
      }
    } catch (e) {
      console.error("Error loading profile:", e);
      return null;
    }
  }

  const handleCommunityVote = async () => {
    try {
      console.log("🗳 Voter profile:", voterProfile);
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::profiles::vote_verify`,
        arguments: [
          tx.object(REGISTRY_VERIFY_ID),
          tx.object(profileId), // address NFT người được vote
          tx.object(voterProfile), // object NFT của voter
          tx.object("0x6"), // Clock
        ],
      });
      const result = await signAndExecute({
        transaction: tx,
        chain: "sui:testnet",
      });
      await client.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true },
      });
      alert("✅ Voted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Vote failed! " + err.message);
    }
  };

  return (
    <>
      {/* 🌌 Background */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#0a0f1c"
          noiseIntensity={1.2}
          rotation={0}
        />
      </div>

      <div className="min-h-screen text-white">
        {/* 🖼 Banner */}
        <div className="relative">
          <img
            src={form.banner_url || "/images/placeholder/banner.png"}
            alt="banner"
            className="h-[18.75rem] w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

          {/* Avatar */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 transform">
            <img
              src={form.avatar_url || "/images/placeholder/avatar.png"}
              alt="avatar"
              className="h-32 w-32 rounded-full border-[3px] border-cyan-400/70 bg-slate-900 object-cover shadow-lg"
            />
          </div>
        </div>

        {/* 👤 Profile Info */}
        <section className="pt-24 pb-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-10 text-center shadow-2xl backdrop-blur-md transition-all hover:from-white/15 hover:to-white/10">
            {loading ? (
              <p className="text-gray-400">Loading profile...</p>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-cyan-300">
                  {form.name || "Unnamed User"}
                </h1>
                {form.bio && (
                  <p className="mt-3 text-white/80 italic">{form.bio}</p>
                )}

                <div className="mt-4 text-sm text-gray-400">
                  NFT ID:{" "}
                  <span className="font-mono break-all text-gray-300">
                    {profileId}
                  </span>
                </div>

                {/* 🌐 Links */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80">
                  {form.email && (
                    <a
                      href={`mailto:${form.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 transition-colors hover:text-cyan-300"
                    >
                      ✉️ {form.email}
                    </a>
                  )}
                  {form.github && (
                    <a
                      href={`${form.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 transition-colors hover:text-cyan-300"
                    >
                      🐙 GitHub
                    </a>
                  )}
                  {form.yoursite && (
                    <a
                      href={
                        form.yoursite.startsWith("http")
                          ? form.yoursite
                          : `https://${form.yoursite}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 transition-colors hover:text-cyan-300"
                    >
                      🌐 {form.yoursite}
                    </a>
                  )}
                </div>

                {/* 📊 Stats */}
                <div className="mt-10 flex justify-center gap-16 text-center">
                  <div>
                    <p className="text-3xl font-bold text-cyan-300">
                      {form.projectCount}
                    </p>
                    <p className="text-sm text-gray-400">Total Projects</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-cyan-300">
                      {form.certificateCount}
                    </p>
                    <p className="text-sm text-gray-400">Certificates</p>
                  </div>
                  <div className="flex flex-col items-center">
                    {isVerified ? (
                      // ✅ Đã verified
                      <div className="rounded-full bg-green-900/40 px-3 py-1 text-sm font-semibold text-green-300 shadow">
                        ✅ Verified
                      </div>
                    ) : (
                      <>
                        {/* 🛡 Nếu là admin */}
                        {account?.address === ADMIN_ADDRESS ? (
                          <button
                            onClick={handleAdminVerify}
                            className="rounded-md bg-yellow-500/20 px-3 py-1 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/30"
                          >
                            🛡 Admin Verify
                          </button>
                        ) : !form.verified ? (
                          // 👥 Nếu là cộng đồng đã verified
                          <button
                            onClick={handleCommunityVote}
                            className="rounded-md bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
                          >
                            👥 Vote to Verify
                          </button>
                        ) : (
                          // ⚠️ Không đủ điều kiện
                          <p className="text-sm text-gray-500">Unverified</p>
                        )}
                      </>
                    )}
                    <p className="mt-1 text-sm text-gray-400">Status</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 💼 Projects */}
        <div className="mx-auto mt-10 max-w-5xl">
          <h2 className="mb-6 text-center text-2xl font-semibold text-cyan-300">
            Projects
          </h2>
          <ProfileProjects profileId={profileId} />
        </div>

        {/* 🎓 Certificates */}
        <div className="mx-auto mt-16 mb-20 max-w-5xl">
          <h2 className="mb-6 text-center text-2xl font-semibold text-cyan-300">
            Certificates
          </h2>
          {certificates.length === 0 ? (
            <p className="text-center text-gray-400">No certificates found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map(cert => {
                return (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 shadow-lg backdrop-blur-md transition-all hover:from-white/15 hover:to-white/10"
                  >
                    {/* 🖼 Thumbnail */}
                    <div className="relative -mx-5 -mt-5 mb-4 h-40 overflow-hidden rounded-t-xl">
                      <img
                        src={cert.certificate_url || "#"}
                        rel="noopener noreferrer"
                        className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600"
                        title="Open certificate"
                      />

                      {/* overlay nhẹ cho chữ dễ đọc nếu cần */}
                      <div className="pointer-events-none absolute inset-0 bg-black/10" />
                    </div>

                    {/* 📄 Nội dung */}
                    <h3 className="text-lg font-semibold text-cyan-200">
                      {cert.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-300">
                      {cert.description || "No description."}
                    </p>
                    <p className="mt-3 text-xs text-gray-500">
                      Issued: {cert.issue_date}
                    </p>

                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-sm text-cyan-300 transition-colors hover:text-cyan-200"
                      >
                        🔗 View Certificate
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileInfoWrap;
