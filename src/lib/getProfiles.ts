/**
 * 🎯 Lấy danh sách NFT Profiles - Đơn giản nhất
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { SuiEvent } from "@mysten/sui/client";
import { PACKAGE_ID } from "./constant";

type Network = "mainnet" | "testnet" | "devnet" | "localnet";

export interface Profile {
  profileId: string;
  owner: string;
  name: string;
  createdAt: number;
  projectCount?: number;
  certificateCount?: number;
}

/**
 * 📋 Lấy tất cả profiles đã mint
 */
export async function getAllProfiles(
  packageId: string,
  network: Network = "testnet"
): Promise<Profile[]> {
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const events = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::profiles::ProfileCreated`,
    },
    limit: 1000,
    order: "descending",
  });

  return events.data.map((event: SuiEvent) => {
    const data = event.parsedJson as any;

    return {
      profileId: data.profile_id,
      owner: data.owner,
      name: data.name,
      createdAt: parseInt(event.timestampMs || "0"),
    };
  });
}

/**
 * 👤 Lấy profile của một user
 */
export async function getMyProfile(
  packageId: string,
  myAddress: string,
  network: Network = "testnet"
): Promise<any> {
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const objects = await client.getOwnedObjects({
    owner: myAddress,
    filter: {
      StructType: `${packageId}::profiles::ProfileNFT`,
    },
    options: {
      showContent: true,
    },
  });

  if (objects.data.length === 0) return null;

  const obj = objects.data[0];
  if (obj.data?.content?.dataType === "moveObject") {
    const fields = obj.data.content.fields as any;
    return {
      id: fields.id,
      owner: fields.owner,
      name: fields.name,
      bio: fields.bio,
      avatar_url: fields.avatar_url,
      banner_url: fields.banner_url,
      social_links: fields.social_links,
      project_count: parseInt(fields.project_count || "0"),
      certificate_count: parseInt(fields.certificate_count || "0"),
      verified: fields.verified,
      created_at: parseInt(fields.created_at || "0"),
    };
  }

  return null;
}

/**
 * 🔹 Lấy danh sách tất cả profiles kèm chi tiết
 * @param packageId - ID của package chứa module profiles
 * @param network - Mạng (testnet, mainnet,...)
 * @param limit - Số lượng item cần lấy (nếu không truyền => lấy tất cả)
 */
export async function getAllProfilesWithDetails(
  packageId: string,
  limit?: number,
  network: Network = "testnet"
): Promise<Profile[]> {
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  // Bước 1: Lấy danh sách profiles từ events
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::profiles::ProfileCreated`,
    },
    limit: limit ?? 100,
    order: "descending",
  });

  // Bước 2: Query chi tiết từng profile
  const profilePromises = events.data.map(async (event: SuiEvent) => {
    const data = event.parsedJson as any;
    const profileId = data.profile_id;

    try {
      const details = await getProfileDetails(packageId, profileId, network);

      return {
        profileId,
        owner: details.owner,
        name: details.name,
        bio: details.bio,
        createdAt: parseInt(event.timestampMs || "0"),
        projectCount: parseInt(details?.project_count || "0"),
        certificateCount: parseInt(details?.certificate_count || "0"),
        avatarUrl: details?.avatar_url || "",
        bannerUrl: details?.banner_url || "",
      };
    } catch (error) {
      return {
        profileId,
        owner: data.owner,
        name: data.name,
        createdAt: parseInt(event.timestampMs || "0"),
        projectCount: 0,
        certificateCount: 0,
        avatarUrl: "",
        bannerUrl: "",
      };
    }
  });

  return Promise.all(profilePromises);
}

/**
 * �🔍 Lấy chi tiết một profile
 */
export async function getProfileDetails(
  packageId: string, // ✅ thêm lại packageId để đồng bộ call
  profileId: string,
  network: Network = "testnet"
): Promise<any> {
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const obj = await client.getObject({
    id: profileId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  if (obj.data?.content?.dataType === "moveObject") {
    const fields = obj.data.content.fields as any;
    return {
      id: fields.id,
      owner: fields.owner,
      name: fields.name,
      bio: fields.bio,
      avatar_url: fields.avatar_url,
      banner_url: fields.banner_url,
      social_links: fields.social_links,
      project_count: Number(fields.project_count) || 0,
      certificate_count: Number(fields.certificate_count) || 0,
      verified: fields.verified,
      created_at: Number(fields.created_at) || 0,
    };
  }

  return null;
}

export async function getProfileProjects(
  profileId: string,
  network: Network = "testnet"
) {
  try {
    const client = new SuiClient({ url: getFullnodeUrl(network) });
    // 1️⃣ Lấy danh sách dynamic fields trong object profile
    const fields = await client.getDynamicFields({ parentId: profileId });

    // 2️⃣ Lọc những field có prefix "projects" (tuỳ Move module)
    const projectFields = fields.data.filter(f =>
      f.name.type.includes("Project")
    );

    // 3️⃣ Lấy chi tiết từng project object
    const projects = await Promise.all(
      projectFields.map(async field => {
        const obj = await client.getDynamicFieldObject({
          parentId: profileId,
          name: field.name,
        });

        const fields = (obj.data?.content as any)?.fields;

        return {
          id: fields.id,
          name: fields?.value?.fields?.name,
          description: fields?.value?.fields?.description,
          link_demo: fields?.value?.fields?.link_demo,
          created_at: Number(fields?.value?.fields?.created_at) || 0,
          tags: fields?.value?.fields?.tags || [],
        };
      })
    );

    return projects;
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    return [];
  }
}

/**
 * 🎓 Lấy danh sách certificates của 1 profile NFT
 */
export async function getProfileCertificates(
  profileId: string,
  accountAdress: string,
  network: Network = "testnet"
) {
  const client = new SuiClient({ url: getFullnodeUrl(network) });
  try {
    const type = `${PACKAGE_ID}::profiles::CertificateNFT`;

    // Lấy tất cả certificate NFT mà user sở hữu
    const res = await client.getOwnedObjects({
      owner: accountAdress /* address của người dùng */,
      filter: { StructType: type },
      options: { showContent: true },
    });

    // Lọc theo certificate.profile_id == profileId
    const certs = res.data
      .map(obj => obj.data?.content?.fields)
      .filter(f => f?.profile_id === profileId)
      .map(f => ({
        title: f.title,
        issuer: f.issuer,
        issue_date: f.issue_date,
        certificate_url: f.certificate_url,
        description: f.description,
        credential_id: f.credential_id,
      }));

    return certs;
  } catch (e) {
    console.error("❌ getProfileCertificates error:", e);
    return [];
  }
}
