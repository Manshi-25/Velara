import { Link } from "@tanstack/react-router";
import { MessageCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatRelationship } from "@/hooks/useChatRelationship";
import { cn } from "@/lib/utils";

interface ChatActionButtonProps {
  /** The OTHER user's id — never render this for your own profile/post. */
  userId: string;
  className?: string;
  variant?: "default" | "outline";
}

/**
 * The 3-state Chat / Requested / Message button — used on both profile
 * pages and post detail pages so the logic only lives in one place.
 *
 *   - "Chat"      -> no relationship yet -> links to /chat/new/$userId
 *   - "Requested" -> I already sent a pending request -> disabled, just
 *                    a status indicator (can't double-send)
 *   - "Message"   -> request accepted -> links straight to the thread
 *
 * If they sent ME a pending request instead (pending_incoming), we
 * point at the Requests tab so I can respond there rather than
 * duplicating accept/reject UI here.
 */
export function ChatActionButton({ userId, className, variant = "outline" }: ChatActionButtonProps) {
  const { relationship, isLoading } = useChatRelationship(userId);

  const baseClasses = cn(
    "rounded-full text-xs sm:text-sm shrink-0 font-medium transition",
    variant === "outline" && "border-border/60",
    className
  );

  if (isLoading) {
    return (
      <Button variant={variant} disabled className={baseClasses}>
        <MessageCircle className="h-4 w-4 mr-2" /> ...
      </Button>
    );
  }

  if (relationship.status === "accepted") {
    return (
      <Button asChild variant={variant} className={baseClasses}>
        <Link to="/chat/$conversationId" params={{ conversationId: relationship.conversationId }}>
          <MessageSquare className="h-4 w-4 mr-2" /> Message
        </Link>
      </Button>
    );
  }

  if (relationship.status === "pending_outgoing") {
    return (
      <Button variant={variant} disabled className={baseClasses}>
        <Clock className="h-4 w-4 mr-2" /> Requested
      </Button>
    );
  }

  if (relationship.status === "pending_incoming") {
    return (
      <Button asChild variant={variant} className={baseClasses}>
        <Link to="/chat" search={{ tab: "requests" }}>
          <MessageCircle className="h-4 w-4 mr-2" /> Respond to request
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className={baseClasses}>
      <Link to="/chat/new/$userId" params={{ userId }}>
        <MessageCircle className="h-4 w-4 mr-2" /> Chat
      </Link>
    </Button>
  );
}
