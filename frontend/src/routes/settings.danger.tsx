import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, Flame, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/danger")({
  component: DangerPage,
});

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  confirmWord,
  onConfirm,
  loading,
  danger,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  confirmWord: string;
  onConfirm: () => void;
  loading: boolean;
  danger?: boolean;
}) {
  const [typed, setTyped] = useState("");

  return (
    <Dialog open={open} onOpenChange={(v) => { setTyped(""); onOpenChange(v); }}>
      <DialogContent className="rounded-2xl border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>

        <div className="mt-4">
          <p className="text-xs mb-2 text-muted-foreground">
            Type <span className="font-mono font-bold text-foreground">{confirmWord}</span> to confirm
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmWord}
            className="w-full border rounded-xl p-3 bg-background text-sm"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setTyped(""); onOpenChange(false); }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={typed !== confirmWord || loading}
            onClick={onConfirm}
          >
            {loading ? "Processing…" : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DangerPage() {
  const navigate = useNavigate();
  const [deletingDream, setDeletingDream] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [openDeleteDream, setOpenDeleteDream] = useState(false);
  const [openDeleteAll, setOpenDeleteAll] = useState(false);
  const [openDeleteAccount, setOpenDeleteAccount] = useState(false);

  async function handleDeleteAllDreams() {
    setDeletingAll(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("dreams")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to delete dreams.");
    } else {
      toast.success("All dreams deleted 🌙");
      setOpenDeleteAll(false);
    }
    setDeletingAll(false);
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete profile data first
    await supabase.from("dreams").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Sign out
    await supabase.auth.signOut();
    toast.success("Account deleted. Goodbye, dreamer.");
    navigate({ to: "/" });
  }

  const dangerItems = [
    {
      icon: Flame,
      title: "Delete All Dreams",
      desc: "Permanently remove every dream you've ever posted. This cannot be undone.",
      label: "Delete All Dreams",
      color: "text-orange-400",
      border: "border-orange-500/20",
      onClick: () => setOpenDeleteAll(true),
    },
    {
      icon: Trash2,
      title: "Delete Account",
      desc: "Permanently delete your Velara account, profile, and all associated data.",
      label: "Delete My Account",
      color: "text-red-400",
      border: "border-red-500/30",
      onClick: () => setOpenDeleteAccount(true),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Trash2 className="h-6 w-6 text-red-400" />
        Danger Zone
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Permanent actions. These cannot be undone.
      </p>

      {/* Warning banner */}
      <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
        <Shield className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          All actions on this page are <strong className="text-foreground">permanent and irreversible</strong>. 
          We strongly recommend archiving your dreams before deleting them.
        </p>
      </div>

      <div className="space-y-4">
        {dangerItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`bg-card border ${item.border} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 grid place-items-center shrink-0">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Button
                onClick={item.onClick}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition shrink-0"
                variant="outline"
              >
                {item.label}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Delete All Dreams Dialog */}
      <ConfirmDialog
        open={openDeleteAll}
        onOpenChange={setOpenDeleteAll}
        title="Delete All Dreams"
        description="This will permanently delete every dream you've posted. Your profile and account will remain intact."
        confirmText="Delete All Dreams"
        confirmWord="DELETE ALL"
        onConfirm={handleDeleteAllDreams}
        loading={deletingAll}
        danger
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        open={openDeleteAccount}
        onOpenChange={setOpenDeleteAccount}
        title="Delete Account"
        description="Your account, profile, dreams, comments, and all data will be permanently removed. This cannot be recovered."
        confirmText="Delete My Account"
        confirmWord="DELETE ACCOUNT"
        onConfirm={handleDeleteAccount}
        loading={deletingAccount}
        danger
      />
    </div>
  );
}