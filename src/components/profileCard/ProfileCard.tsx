"use client";

interface ProfileCardProps {
  profile: {
    profileId: string;
    owner: string;
    name: string;
    createdAt: number;
    projectCount?: number;
    certificateCount?: number;
  };
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="relative mx-auto flex w-[340px] flex-col items-center rounded-[16px] bg-white bg-clip-border p-3 shadow-xl">
      {/* 🖼 Banner */}
      <div className="relative flex h-28 w-full justify-center rounded-lg bg-cover">
        <img
          src="https://horizon-tailwind-react-git-tailwind-components-horizon-ui.vercel.app/static/media/banner.ef572d78f29b0fee0a09.png"
          alt="banner"
          className="absolute h-28 w-full rounded-lg object-cover"
        />
        <div className="absolute -bottom-10 flex h-[74px] w-[74px] items-center justify-center rounded-full border-[3px] border-white bg-pink-400">
          <img
            className="h-full w-full rounded-full object-cover"
            src="https://horizon-tailwind-react-git-tailwind-components-horizon-ui.vercel.app/static/media/avatar11.1060b63041fdffa5f8ef.png"
            alt="avatar"
          />
        </div>
      </div>

      {/* 👤 Info */}
      <div className="mt-14 flex flex-col items-center">
        <h4 className="text-lg font-semibold text-black">{profile.name}</h4>
        <p className="text-sm font-normal text-gray-600">
          {profile.owner.slice(0, 6)}...{profile.owner.slice(-4)}
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="mt-5 mb-2 flex gap-10">
        <div className="flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-black">
            {profile.projectCount || 0}
          </p>
          <p className="text-xs font-normal text-gray-600">Projects</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-black">
            {profile.certificateCount || 0}
          </p>
          <p className="text-xs font-normal text-gray-600">Certificates</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-xs font-normal text-gray-600">
            {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs font-normal text-gray-600">Joined</p>
        </div>
      </div>
    </div>
  );
}
