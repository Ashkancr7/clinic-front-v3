import Image from "next/image";

export function LoadingLogo({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Image
        src="/image/superadmin.png"
        alt={label}
        width={80}
        height={80}
        className="animate-pulse opacity-70"
      />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}