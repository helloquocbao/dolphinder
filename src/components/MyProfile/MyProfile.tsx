"use client";
import { useEffect, useState, type FC } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";

import AddProjectForm from "../AddProjectForm/AddProjectForm";
import { ProjectList } from "../projectList/ProjectList";
import { PACKAGE_ID, REGISTRY_ID } from "@/lib/constant";

const MyProfileWrap: FC = () => (
  <GlobalSuiProvider>
    <MyProfile />
  </GlobalSuiProvider>
);

const MyProfile: FC = () => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setForm({ name: "", bio: "", avatar_url: "", banner_url: "" });
      } else {
        const obj = objects.data[0].data!;
        const f = obj.content.fields as any;
        setProfileId(obj.objectId);
        setForm({
          name: f.name,
          bio: f.bio,
          avatar_url: f.avatar_url,
          banner_url: f.banner_url,
        });
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  }

  // === Helper: convert file to base64 preview ===
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
      alert("⚠️ Vui lòng kết nối ví trước khi thực hiện.");
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
      const links = ["https://twitter.com/abc", "https://github.com/xyz"];

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

  // === UI ===
  if (!account)
    return (
      <div className="text-center text-red-500">
        ⚠️ Vui lòng kết nối ví để xem hoặc mint profile.
      </div>
    );

  return (
    <div className="mx-auto max-w-xl p-4">
      <h2 className="mb-2 text-xl font-bold">
        {profileId ? "🧑 Cập nhật hồ sơ của bạn" : "✨ Tạo hồ sơ mới"}
      </h2>

      <div className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Tên hiển thị</span>
          <input
            className="w-full rounded border p-2"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Giới thiệu</span>
          <textarea
            className="w-full rounded border p-2"
            rows={3}
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
          />
        </label>

        {/* Avatar preview */}
        <div className="flex flex-col gap-2">
          <span className="text-gray-700">Ảnh đại diện</span>
          {form.avatar_url && (
            <img
              src={form.avatar_url}
              alt="Avatar preview"
              className="h-24 w-24 rounded-full border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setAvatarFile(file);
                previewImage(file, "avatar_url");
              }
            }}
          />
        </div>

        {/* Banner preview */}
        <div className="flex flex-col gap-2">
          <span className="text-gray-700">Ảnh banner</span>
          {form.banner_url && (
            <img
              src={form.banner_url}
              alt="Banner preview"
              className="h-32 w-full rounded border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setBannerFile(file);
                previewImage(file, "banner_url");
              }
            }}
          />
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className={`w-full rounded px-4 py-2 text-white ${
            loading
              ? "cursor-not-allowed bg-gray-400"
              : profileId
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading
            ? "Đang xử lý..."
            : profileId
              ? "Cập nhật profile"
              : "Mint profile"}
        </button>
      </div>

      {profileId && (
        <>
          <AddProjectForm profileId={profileId} />
          <ProjectList profileId={profileId} />
        </>
      )}
    </div>
  );
};
export default MyProfileWrap;
