import Image from "next/image";

export function PageLoading() {
  return (
    <div className="flex min-h-[72vh] flex-col items-center justify-center gap-7">
      {/* Logo */}
      <div
        className="relative h-[80px] w-[80px]"
        style={{ animation: "logo-breathe 1.6s ease-in-out infinite" }}
      >
        <Image
          src="/logo.png"
          alt="Barbearia of Brothers"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Sweep bar */}
      <div className="relative h-[2px] w-28 overflow-hidden rounded-full bg-border">
        <span
          className="absolute inset-y-0 w-1/2 rounded-full bg-brand"
          style={{ animation: "loading-sweep 0.9s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
