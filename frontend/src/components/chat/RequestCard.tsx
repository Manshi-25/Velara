import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ChatRequest } from "@/types/chat";

interface RequestCardProps {
  request: ChatRequest;
  onAccept: (requestId: string) => Promise<unknown>;
  onReject: (requestId: string) => Promise<unknown>;
}

/**
 * A pending incoming chat request — shown in the "Requests" tab with
 * Accept / Reject actions. Optimistically hides itself the moment one
 * of the two buttons is pressed and resolves, with its own tiny local
 * "working" state so the buttons disable while the mutation runs.
 */
export function RequestCard({ request, onAccept, onReject }: RequestCardProps) {
  const [working, setWorking] = useState<"accept" | "reject" | null>(null);
  const sender = request.sender;

  if (!sender) return null;

  const handleAccept = async () => {
    setWorking("accept");
    try {
      await onAccept(request.id);
    } finally {
      setWorking(null);
    }
  };

  const handleReject = async () => {
    setWorking("reject");
    try {
      await onReject(request.id);
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card">
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={sender.avatar_url ?? undefined} alt={sender.anonymous_name} />
        <AvatarFallback className="gradient-violet text-primary-foreground font-display">
          {sender.anonymous_name?.[0]?.toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{sender.anonymous_name}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {request.firstMessage || "wants to start a conversation"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="icon"
          variant="outline"
          disabled={working !== null}
          onClick={handleReject}
          aria-label="Reject request"
          className="h-9 w-9 rounded-full border-nightmare/50 text-nightmare hover:bg-nightmare/10"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          disabled={working !== null}
          onClick={handleAccept}
          aria-label="Accept request"
          className="h-9 w-9 rounded-full gradient-violet text-primary-foreground border-0"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
