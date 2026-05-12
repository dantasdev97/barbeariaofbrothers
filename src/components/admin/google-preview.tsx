import { Globe } from "lucide-react";

export function GooglePreview({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[#dfe1e5] bg-white p-4 font-sans">
      <div className="mb-1 flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 shrink-0 text-[#4d5156]" />
        <span className="truncate text-xs text-[#4d5156]">{url}</span>
      </div>
      <p className="cursor-pointer text-base font-medium leading-snug text-[#1a0dab] line-clamp-1 hover:underline">
        {title || "Título da página"}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-[#4d5156] line-clamp-2">
        {description || "Descrição que aparece nos resultados de pesquisa do Google…"}
      </p>
    </div>
  );
}
