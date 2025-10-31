"use client";
import { useEffect, useState, type FC } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import Silk from "../react-bits/Silk";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import ProfileProjects from "./ProfileProjects";

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

  const [loading, setLoading] = useState(false);
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
    if (profileId) fetchProfileDetail(profileId);
  }, [profileId]);

  async function fetchProfileDetail(profileId: string) {
    try {
      setLoading(true);
      const result = await client.getObject({
        id: profileId,
        options: { showContent: true },
      });

      if (!result.data?.content) {
        console.warn("⚠️ Profile not found on-chain.");
        return;
      }

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
      });
    } catch (err) {
      console.error("❌ Failed to fetch profile detail:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Background animation */}
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#13244D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Banner */}
        <div className="relative">
          <img
            src={form.banner_url || "/images/placeholder/banner.png"}
            alt="banner"
            className="h-[18.75rem] w-full rounded-b-2xl object-cover shadow-md"
          />

          {/* Avatar */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 transform">
            <img
              src={form.avatar_url || "/images/placeholder/avatar.png"}
              alt="avatar"
              className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Info section */}
        <section className="pt-24 pb-16">
          <div className="container mx-auto max-w-4xl rounded-xl bg-white p-8 text-center shadow-lg">
            {loading ? (
              <p className="text-gray-500">Loading profile...</p>
            ) : (
              <>
                {/* Name */}
                <h1 className="text-3xl font-bold text-gray-900">
                  {form.name || "Unnamed User"}
                </h1>

                {/* Bio */}
                {form.bio && (
                  <p className="mt-3 text-gray-600 italic">{form.bio}</p>
                )}

                {/* Wallet */}
                <div className="mt-4 text-sm text-gray-500">
                  NFT ID: <span className="font-mono">{profileId}</span>
                </div>

                {/* Links */}
                <div className="mt-8 flex flex-col justify-center gap-6 text-gray-700 sm:flex-row">
                  {form.email && (
                    <a
                      href={`mailto:${form.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 hover:text-blue-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 12H8m0 0l8-8m-8 8l8 8"
                        />
                      </svg>
                      {form.email}
                    </a>
                  )}
                  {form.github && (
                    <a
                      href={
                        form.github.startsWith("http")
                          ? form.github
                          : `https://github.com/${form.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 hover:text-gray-800"
                    >
                      <i className="fab fa-github"></i>
                      GitHub
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
                      className="flex items-center justify-center gap-2 hover:text-indigo-500"
                    >
                      🌐 {form.yoursite}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
        <ProfileProjects profileId={profileId} />
      </div>
    </>
  );
};

export default ProfileInfoWrap;
