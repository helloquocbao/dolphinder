"use client";
import { useEffect, useState, type FC } from "react";
import ProfileCard from "../profileCard/ProfileCard";
import { getAllProfilesWithDetails } from "@/lib/getProfiles";
import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import { PACKAGE_ID } from "@/lib/constant";

export const DeveloperBubbleWrap: FC = () => {
  return (
    <GlobalSuiProvider>
      <DeveloperBubble />
    </GlobalSuiProvider>
  );
};

export const DeveloperBubble: FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListProfiles();
  }, []);

  const getListProfiles = async () => {
    try {
      setLoading(true);
      const data = await getAllProfilesWithDetails(PACKAGE_ID);

      setProfiles(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading profiles...</div>;
  }

  if (profiles.length === 0) {
    return <div>No profiles found</div>;
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {profiles.map(profile => (
        <div className="col-span-12 lg:col-span-3" key={profile.profileId}>
          <ProfileCard
            profile={{
              projectCount: profile.projectCount,
              certificateCount: profile.certificateCount,
              profileId: profile.profileId,
              owner: profile.owner,
              name: profile.name,
              createdAt: profile.createdAt,
            }}
          />
        </div>
      ))}
    </div>
  );
};
