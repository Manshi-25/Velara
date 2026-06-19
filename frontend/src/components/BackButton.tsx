/*import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton({ label = "Back", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.history.back()}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 px-2 py-1 rounded-lg hover:bg-surface transition ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
*/

import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label?: string;
  className?: string;
  fallback?: string;
};

export function BackButton({
  label = "Back",
  className = "",
  fallback = "/",
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({
        to: fallback,
      });
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 px-2 py-1 rounded-lg hover:bg-surface transition ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}