"use client";
import { useEffect, useState, type FC } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";

import Silk from "../react-bits/Silk";
import { PACKAGE_ID, REGISTRY_ID } from "@/lib/constant";

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

  // === Load profile when wallet changes ===
  useEffect(() => {
    if (account?.address) fetchMyProfile();
  }, [account]);
  async function fetchMyProfile() {
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
          email: f.links?.[0] || "",
          github: f.links?.[1] || "",
          yoursite: f.links?.[2] || "",
        });
      }
    } catch (e) {
      console.error("Error loading profile:", e);
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
      console.log("avatarFile", avatarFile);
      console.log("bannerFile", bannerFile);
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
      fetchMyProfile();
    } catch (err: any) {
      console.error("Error:", err);
      alert("❌ Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#13244D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="">
        {/* <!-- Banner --> */}
        <div className="relative">
          <img
            src={form.banner_url || "/images/placeholder/banner.png"}
            alt="banner"
            className="h-[18.75rem] w-full object-cover"
          />
          <div className="relative container -translate-y-4">
            <div className="font-display group hover:bg-accent absolute right-0 bottom-4 flex items-center rounded-lg bg-[#e7e8ec] px-4 py-2 text-sm">
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
          </div>
        </div>
        {/* <!-- end banner --> */}
        {/* <!-- Edit Profile --> */}
        <section className="dark:bg-jacarta-800 relative py-6">
          <div className="container">
            <div className="mx-auto max-w-[55.125rem] rounded-lg border-black bg-[#fcfdff] p-5 md:flex">
              {/* <!-- Avatar --> */}
              <div className="flex space-x-5 md:w-1/2 md:pl-8">
                <form className="shrink-0">
                  <figure className="relative inline-block">
                    <img
                      src={form.avatar_url || "/images/placeholder/avatar.png"}
                      alt="collection avatar"
                      className="flex h-36 w-36 items-center justify-center rounded-lg border-[5px] border-[#6b7280] object-cover text-[#131740]"
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
                  </figure>
                </form>
                <div className="mt-4">
                  <span className="font-display text-jacarta-700 mb-3 block text-sm">
                    Profile Image
                  </span>
                  <p className="dark:text-jacarta-300 text-sm leading-normal">
                    We recommend an image of at least 300x300. Gifs work too.
                    Max 5mb.
                  </p>
                </div>
              </div>
              {/* <!-- Form --> */}
              <div className="mb-12 md:w-1/2 md:pr-8">
                <div className="mb-6">
                  <label className="font-display text-jacarta-700 mb-1 block text-sm font-semibold text-[#131740]">
                    Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="profile-username"
                    className="dark:bg-jacarta-700 border-jacarta-100 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:placeholder:text-jacarta-300 w-full rounded-lg border border-[#e7e8ec] px-3 py-3 text-[#6b7280] hover:ring-2"
                    placeholder="Enter username"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="mb-6">
                  <label className="font-display text-jacarta-700 mb-1 block text-sm font-semibold text-[#131740]">
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    className="dark:bg-jacarta-700 border-jacarta-100 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:placeholder:text-jacarta-300 w-full rounded-lg border border-[#e7e8ec] px-3 py-3 text-[#6b7280] hover:ring-2"
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell the world your story!"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="font-display text-jacarta-700 mb-1 block text-sm font-semibold text-[#131740]">
                    Links<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="twitter"
                      className="fill-jacarta-300 dark:fill-jacarta-400 pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                    </svg>
                    <input
                      type="text"
                      id="profile-twitter"
                      className="dark:bg-jacarta-700 border-jacarta-100 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:placeholder:text-jacarta-300 w-full rounded-t-lg border border-[#e7e8ec] py-3 pl-10 text-[#6b7280] hover:ring-2 focus:ring-inset"
                      placeholder="email"
                      value={form.email}
                      onChange={e =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="instagram"
                      className="fill-jacarta-300 dark:fill-jacarta-400 pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                    </svg>
                    <input
                      type="text"
                      id="profile-instagram"
                      className="dark:bg-jacarta-700 border-jacarta-100 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:placeholder:text-jacarta-300 -mt-px w-full border border-[#e7e8ec] py-3 pl-10 text-[#6b7280] hover:ring-2 focus:ring-inset"
                      placeholder="@github"
                      value={form.github}
                      onChange={e =>
                        setForm({ ...form, github: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="fill-jacarta-300 dark:fill-jacarta-400 pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z" />
                    </svg>
                    <input
                      type="url"
                      id="profile-website"
                      className="dark:bg-jacarta-700 border-jacarta-100 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:placeholder:text-jacarta-300 -mt-px w-full rounded-b-lg border border-[#e7e8ec] py-3 pl-10 text-[#6b7280] hover:ring-2 focus:ring-inset"
                      placeholder="yoursitename.com"
                      value={form.yoursite}
                      onChange={e =>
                        setForm({ ...form, yoursite: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="font-display text-jacarta-700 mb-1 block text-sm">
                    Wallet Address
                  </label>
                  0x7a9fe22691c811ea339401bbb2leb
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-accent shadow-accent-volume hover:bg-accent-dark rounded-full bg-gray-200 px-8 py-3 text-center font-semibold text-black transition-all"
                >
                  {loading
                    ? "Đang xử lý..."
                    : profileId
                      ? "Cập nhật profile"
                      : "Mint profile"}
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* <!-- end edit profile --> */}
      </div>
    </>
  );
};

export default MyProfileWrap;
