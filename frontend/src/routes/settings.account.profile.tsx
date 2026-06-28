
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Pencil, Check, Upload, X, Image } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/account/profile")({
  component: AccountProfilePage,
});

const DREAM_VIBES = [
  { label: "Lucid Dreamer", emoji: "🌀" },
  { label: "Night Wanderer", emoji: "🌙" },
  { label: "Cosmic Explorer", emoji: "🚀" },
  { label: "Mystical Soul", emoji: "✨" },
  { label: "Dream Collector", emoji: "📜" },
  { label: "Shadow Walker", emoji: "🌑" },
  { label: "Star Whisperer", emoji: "⭐" },
  { label: "Void Dreamer", emoji: "🕳️" },
];

const AVATAR_GRADIENTS = [
  // Primary Brand Colors - Warm Ember/Amber
  { name: "Ember Glow", class: "from-amber-400 to-orange-600" },
  { name: "Sunset",     class: "from-orange-400 to-rose-600" },
  { name: "Warm Ember", class: "from-amber-500 to-red-600" },
  
  
  // Complementary Warm Colors
  { name: "Rose Gold",  class: "from-rose-400 to-amber-500" },
  { name: "Copper",     class: "from-orange-500 to-amber-700" },
  
  // Cooler Accents (for variety)
  { name: "Midnight",   class: "from-slate-600 to-slate-900" },
  { name: "Violet Haze",class: "from-violet-500 to-purple-700" },
  
  { name: "Forest",     class: "from-emerald-400 to-teal-700" },
];
function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [bio, setBio] = useState("");
  const [dreamVibe, setDreamVibe] = useState("");
  const [avatarGradient, setAvatarGradient] = useState("from-orange-500 to-red-600");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [usernameChanges, setUsernameChanges] = useState(0);
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("anonymous_name, bio, dream_vibe, avatar_gradient, avatar_url, username_changes, last_username_change")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.anonymous_name || "");
      setOriginalUsername(data.anonymous_name || "");
      setBio(data.bio || "");
      setDreamVibe(data.dream_vibe || "");
      setAvatarGradient(data.avatar_gradient || "from-orange-500 to-red-600");
      setAvatarUrl(data.avatar_url || null);
      setUsernameChanges(data.username_changes || 0);
      setLastUsernameChange(data.last_username_change ? new Date(data.last_username_change) : null);
    }
    setLoading(false);
  }

  function canChangeUsername() {
    if (!lastUsernameChange) return true;
    const daysSince = (Date.now() - lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30 || usernameChanges < 2;
  }

  const wordCount = bio.trim() ? bio.trim().split(/\s+/).length : 0;
  const initials = (username || "?")[0]?.toUpperCase() || "?";

  async function uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploadingImage(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        setUploadingImage(false);
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Failed to save avatar');
        setUploadingImage(false);
        return;
      }

      setAvatarUrl(publicUrl);
      // Clear gradient when using image
      setAvatarGradient('');
      toast.success('Avatar uploaded ✨');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload avatar');
    }

    setUploadingImage(false);
  }

  async function removeAvatar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Remove avatar URL from profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to remove avatar');
        return;
      }

      setAvatarUrl(null);
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove avatar');
    }
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    const updateData: {
      bio?: string;
      dream_vibe?: string;
      avatar_gradient?: string;
      anonymous_name?: string;
      username_changes?: number;
      last_username_change?: string;
    } = {
      bio,
      dream_vibe: dreamVibe,
    };

    // Only update gradient if not using an image
    if (!avatarUrl) {
      updateData.avatar_gradient = avatarGradient;
    }

    if (username !== originalUsername && canChangeUsername()) {
      updateData.anonymous_name = username;
      updateData.username_changes = usernameChanges + 1;
      updateData.last_username_change = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);

    if (error) {
      toast.error("Failed to save.");
    } else {
      toast.success("Profile updated ✨");
      setOriginalUsername(username);
    }
    setSaving(false);
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      uploadAvatar(file);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <BackButton className="mb-4" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <User className="h-6 w-6 text-amber-400" />
        Profile & Identity
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Shape how the dream world sees you.</p>

      <div className="space-y-4">
        {/* Avatar Preview + Upload + Gradient Picker */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Avatar
          </h3>
          
          {/* Avatar Preview */}
          <div className="flex items-center gap-5 mb-5">
            <div
              className={`h-20 w-20 rounded-full ${
                avatarUrl 
                  ? 'bg-cover bg-center' 
                  : `bg-gradient-to-br ${avatarGradient || 'from-violet-500 to-purple-700'}`
              } grid place-items-center text-white text-3xl font-bold shadow-lg shrink-0 overflow-hidden`}
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
            >
              {!avatarUrl && (initials)}
            </div>
            <div>
              <p className="text-sm font-medium">{username || "Your Name"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{dreamVibe || "Dream Wanderer"}</p>
            </div>
          </div>

          {/* Avatar Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </Button>

            {/* Remove Avatar Button */}
            {avatarUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                className="gap-2 text-red-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
                Remove Image
              </Button>
            )}

            {/* Show current mode */}
            <span className="text-xs text-muted-foreground ml-auto self-center">
              {avatarUrl ? '📷 Image Avatar' : '🎨 Gradient Avatar'}
            </span>
          </div>

          {/* Gradient Picker - Only show when no image is uploaded */}
          {!avatarUrl && (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Or choose a gradient avatar (uploading an image will replace this)
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVATAR_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setAvatarGradient(g.class)}
                    title={g.name}
                    className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${g.class} transition hover:scale-110 ${
                      avatarGradient === g.class ? "ring-2 ring-white ring-offset-2 ring-offset-card" : ""
                    }`}
                  >
                    {avatarGradient === g.class && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {avatarUrl && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 To use a gradient, click "Remove Image" above
            </p>
          )}
        </div>

        {/* Username */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-accent" /> Dream Name
          </h3>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!canChangeUsername()}
            className="w-full border rounded-xl p-3 bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Your dream name…"
          />
          <p className="text-xs mt-2 text-muted-foreground">
            {canChangeUsername()
              ? `${2 - (usernameChanges % 2)} name change${2 - (usernameChanges % 2) !== 1 ? "s" : ""} remaining this month`
              : "Monthly limit reached. Try again after 30 days."}
          </p>
        </div>

        {/* Bio */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Bio</h3>
          <textarea
            value={bio}
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/);
              if (words.length <= 60 || e.target.value.length < bio.length) {
                setBio(e.target.value);
              }
            }}
            className="w-full min-h-[100px] border rounded-xl p-3 bg-background text-sm resize-none"
            placeholder="A few words about your dream world…"
          />
          <p className="text-xs text-muted-foreground mt-1">{wordCount}/60 words</p>
        </div>

        {/* Dream Vibe */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Dream Vibe
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DREAM_VIBES.map((v) => (
              <button
                key={v.label}
                onClick={() => setDreamVibe(v.label)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition ${
                  dreamVibe === v.label
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 hover:bg-background/40 text-muted-foreground"
                }`}
              >
                <span>{v.emoji}</span>
                <span>{v.label}</span>
                {dreamVibe === v.label && <Check className="h-3 w-3 ml-auto text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full h-12 text-base" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}