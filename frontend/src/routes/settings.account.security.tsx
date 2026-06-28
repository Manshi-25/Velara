

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Check, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/account/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentEmail(user.email || "");
      setUserId(user.id || "");
      
      // Check if there's a pending email change
      const { data: profile } = await supabase
        .from("profiles")
        .select("pending_email, email")
        .eq("id", user.id)
        .single();
      
      if (profile?.pending_email) {
        setPendingEmail(profile.pending_email);
        setEmailStatus("sent");
        toast.info(`Email change pending to ${profile.pending_email}. Please check your inbox.`);
      }
    }
  }

  async function updateEmail() {
    if (!newEmail) {
      toast.error("Enter a new email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (newEmail === currentEmail) {
      toast.error("New email is the same as current email.");
      return;
    }

    if (!userId) {
      toast.error("User not found. Please try logging out and back in.");
      return;
    }

    setSavingEmail(true);
    setEmailStatus("sending");

    try {
      // Step 1: Check if the email is already registered with another account
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", newEmail)
        .maybeSingle();

      if (existingUser && existingUser.id !== userId) {
        toast.error("This email is already registered with another account.");
        setEmailStatus("error");
        setSavingEmail(false);
        return;
      }

      // Step 2: First, update the email in the profiles table
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ 
          pending_email: newEmail,
          email_change_requested_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (profileUpdateError) {
        console.error("Failed to update profile:", profileUpdateError);
        toast.error("Failed to initiate email change. Please try again.");
        setEmailStatus("error");
        setSavingEmail(false);
        return;
      }

      // Step 3: Now update the email in auth
      // IMPORTANT: This sends the confirmation email ONLY to the new email address
      const { error: authError } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (authError) {
        console.error("Auth update error:", authError);
        
        // Rollback the profile update if auth fails
        await supabase
          .from("profiles")
          .update({ 
            pending_email: null,
            email_change_requested_at: null
          })
          .eq("id", userId);
        
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered with another account.");
        } else if (authError.message.includes("Email rate limit exceeded")) {
          toast.error("Please wait a few minutes before trying again.");
        } else {
          toast.error(authError.message || "Failed to send confirmation email.");
        }
        setEmailStatus("error");
        setSavingEmail(false);
        return;
      }

      setPendingEmail(newEmail);
      setEmailStatus("sent");
      
      toast.success(`📧 Confirmation email sent to ${newEmail}`);
      toast.info("Please check your inbox (and spam folder)");

    } catch (err) {
      console.error("Email update error:", err);
      toast.error("An error occurred. Please try again.");
      setEmailStatus("error");
    }

    setSavingEmail(false);
  }

  // Check if email was confirmed
  async function checkEmailConfirmation() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // If email in auth has changed to the pending email
    if (user.email && pendingEmail && user.email === pendingEmail) {
      // Update the profiles table with the new email
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          email: user.email,
          pending_email: null,
          email_change_requested_at: null
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to update profile email:", updateError);
        toast.error("Failed to update profile with new email");
        return;
      }

      setCurrentEmail(user.email);
      setPendingEmail(null);
      setNewEmail("");
      setEmailStatus("idle");
      
      toast.success("✅ Email updated successfully!");
      toast.info(`You can now log in with ${user.email} using your current password.`);
    } else {
      // Still waiting for confirmation
      toast.info("Email not confirmed yet. Please check your inbox and spam folder.");
    }
  }

  // Cancel pending email change
  async function cancelEmailChange() {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          pending_email: null,
          email_change_requested_at: null
        })
        .eq("id", userId);

      if (error) {
        toast.error("Failed to cancel email change");
        return;
      }

      setPendingEmail(null);
      setNewEmail("");
      setEmailStatus("idle");
      toast.success("Email change cancelled");
    } catch (err) {
      toast.error("Failed to cancel email change");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Shield className="h-6 w-6 text-emerald-400" />
        Security
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Keep your dream space secure.</p>

      <div className="space-y-4">
        {/* Email */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" /> Email Address
          </h3>
          
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-sm text-muted-foreground">
              Current: <span className="text-foreground font-medium">{currentEmail || "Not set"}</span>
            </p>
            {pendingEmail && emailStatus === "sent" && (
              <p className="text-sm text-amber-400 mt-1">
                ⏳ Pending: <span className="font-medium">{pendingEmail}</span> (awaiting confirmation)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (emailStatus === "sent") setEmailStatus("idle");
              }}
              placeholder="Enter new email address"
              className="w-full border rounded-xl p-3 bg-background text-sm"
              disabled={emailStatus === "sent"}
            />
            
            {emailStatus === "sending" && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sending confirmation email...</span>
              </div>
            )}

            {emailStatus === "sent" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Check className="h-4 w-4" />
                  <span>Confirmation email sent to <strong>{pendingEmail}</strong></span>
                </div>
                <div className="flex items-start gap-2 text-amber-400 text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Important:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your <strong>spam/junk</strong> folder</li>
                      <li>Click the confirmation link in the email</li>
                      <li>Your password remains the same</li>
                      <li>After confirming, you'll log in with the new email</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkEmailConfirmation}
                    className="gap-2"
                  >
                    <Check className="h-3 w-3" />
                    I've Confirmed ✓
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEmailChange}
                    className="gap-2 text-red-400 hover:text-red-500"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Cancel Change
                  </Button>
                </div>
              </div>
            )}

            {emailStatus === "error" && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Failed to send confirmation</p>
                  <p className="text-xs mt-1">Please try again or contact support if the issue persists.</p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Enter a new email address and we'll send a confirmation link.
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1"
              onClick={updateEmail}
              disabled={savingEmail || !newEmail || emailStatus === "sent" || newEmail === currentEmail || !userId}
            >
              {savingEmail ? "Sending…" : emailStatus === "sent" ? "Confirmation Sent ✓" : "Update Email"}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            After confirming your new email, you'll be able to log in with it using your current password.
            The change will be reflected across your entire account.
          </p>
        </div>
      </div>
    </div>
  );
}