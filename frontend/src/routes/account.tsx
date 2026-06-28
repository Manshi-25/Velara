
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Check, Upload, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { QrCode } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {MoreVertical,Trash2,Archive,Pin,Copy,Edit} from "lucide-react";
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { generateDreamImage } from "@/lib/randomDreamImage";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/account")({
  component: Profile
});

// ── All dream vibes (was only 5 in the old select dropdown) ─────────────────
const DREAM_VIBES = [
  { label: "Lucid Dreamer",   emoji: "🌀" },
  { label: "Night Wanderer",  emoji: "🌙" },
  { label: "Cosmic Explorer", emoji: "🚀" },
  { label: "Mystical Soul",   emoji: "✨" },
  { label: "Dream Collector", emoji: "📜" },
  { label: "Shadow Walker",   emoji: "🌑" },
  { label: "Star Whisperer",  emoji: "⭐" },
  { label: "Void Dreamer",    emoji: "🕳️" },
];

const AVATAR_GRADIENTS = [
  { name: "Ember",    class: "from-orange-500 to-red-600" },
  { name: "Violet",   class: "from-violet-500 to-purple-700" },
  { name: "Ocean",    class: "from-sky-400 to-blue-600" },
  { name: "Forest",   class: "from-emerald-400 to-green-600" },
  { name: "Rose",     class: "from-pink-400 to-rose-600" },
  { name: "Gold",     class: "from-amber-400 to-yellow-600" },
  { name: "Midnight", class: "from-slate-500 to-slate-800" },
  { name: "Aurora",   class: "from-teal-400 to-cyan-600" },
];

function Profile() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [dreamVibe, setDreamVibe] = useState("");
  // NEW: avatar state for edit dialog
  const [avatarGradient, setAvatarGradient] = useState("from-violet-500 to-purple-700");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab,setActiveTab]=useState("posts");
  const [posts,setPosts]=useState<any[]>([]);
  const [drafts,setDrafts]=useState<any[]>([]);
  
  const [showQR,setShowQR]= useState(false);
  const navigate = useNavigate();
  const profileLink = typeof window !== "undefined" && profile?.id
  ? `${window.location.origin}/profile/${profile.id}`
  : "";

  useEffect(() => {
    if (!profile) return;

    setBio(profile.bio || "");
    setUsername(profile.anonymous_name || "");
    setDreamVibe(profile.dream_vibe || "");
    // NEW: sync avatar fields
    setAvatarGradient(profile.avatar_gradient || "from-violet-500 to-purple-700");
    setAvatarUrl(profile.avatar_url || null);

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      /* POSTS */
      const { data: postsData } = await supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      /* DRAFTS */
      const { data: draftsData } = await supabase
        .from("drafts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts((postsData || []).sort((a, b) => Number(b.pinned || false) - Number(a.pinned || false)));
      setDrafts(draftsData || []);
    }

    loadData();
  }, [profile]);

  function canChangeUsername() {
    const lastChange = profile?.last_username_change
      ? new Date(profile.last_username_change)
      : null;

    if (!lastChange) {
      return true;
    }

    const now = new Date();
    const diff = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);

    if (diff > 30) {
      return true;
    }

    return (profile.username_changes || 0) < 2;
  }

  async function loadFollowers() {
    if (!profile?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("followers").select(`follower_id, follower:profiles!followers_follower_id_fkey( id, anonymous_name, dream_vibe, avatar_gradient, avatar_url )`).eq("following_id", profile.id);
    if (error) { console.log(error); return; }
    setFollowers(data || []);
    if (!user || !data) return;
    const followerIds = data.map((x) => x.follower.id);
    const { data: currentFollowing } = await supabase.from("followers").select("following_id").eq("follower_id", user.id).in("following_id", followerIds);
    const map: Record<string, boolean> = {};
    currentFollowing?.forEach((x) => { map[x.following_id] = true; });
    setFollowingMap(map);
  }

  async function loadFollowing() {
    if (!profile?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("followers").select(`following_id, following:profiles!followers_following_id_fkey( id, anonymous_name, dream_vibe, avatar_gradient, avatar_url )`).eq("follower_id", profile.id);
    if (error) { console.log(error); return; }
    setFollowing(data || []);
    if (!user || !data) return;
    const map: Record<string, boolean> = {};
    data.forEach((item) => { map[item.following.id] = true; });
    setFollowingMap(map);
  }

  async function toggleFollowUser(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isFollowing = followingMap[targetUserId];
    if (isFollowing) {
      const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      if (error) { toast.error("Failed"); return; }
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: false }));
      setFollowing((prev) => prev.filter((x) => x.following.id !== targetUserId));
      toast.success("Unfollowed");
    } else {
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: targetUserId });
      if (error) { toast.error("Failed"); return; }
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: true }));
      toast.success("Echoing 🌙");
    }
    await loadFollowers();
    await loadFollowing();
  }

  // NEW: avatar upload
  async function uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { toast.error("Failed to upload image"); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl, avatar_gradient: null }).eq("id", user.id);
      if (updateError) { toast.error("Failed to save avatar"); return; }
      setAvatarUrl(publicUrl);
      setAvatarGradient("");
      toast.success("Avatar uploaded ✨");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingImage(false);
    }
  }

  // NEW: avatar remove
  async function removeAvatar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) { toast.error("Failed to remove avatar"); return; }
    setAvatarUrl(null);
    toast.success("Avatar removed");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be less than 2 MB"); return; }
    uploadAvatar(file);
  }

  async function saveProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSaving(true);

      let updateData: any = {
        bio,
        dream_vibe: dreamVibe
      };

      // NEW: save gradient only when no image
      if (!avatarUrl) {
        updateData.avatar_gradient = avatarGradient;
      }

      if (username !== profile.anonymous_name && canChangeUsername()) {
        updateData.anonymous_name = username;
        updateData.username_changes = (profile.username_changes || 0) + 1;
        updateData.last_username_change = new Date();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        toast.error("Update failed");
        return;
      }

      toast.success("Profile updated ✨");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDream(id: string) {
    try {
      // delete from dreams table
      const { error } = await supabase
        .from("dreams")
        .delete()
        .eq("id", id);

      if (error) {
        console.log(error);
        toast.error("Failed deleting");
        return;
      }

      // decrease profile post count
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.rpc("refresh_post_count", {
          profile_id: user.id,
        });
      }

      // remove instantly from UI
      setPosts((prev) => prev.filter((x) => x.id !== id));

      toast.success("Dream deleted");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
  }

      async function deleteDraft(id: string) {
        const { error } = await supabase
          .from("drafts")
          .delete()
          .eq("id", id);

        if (error) {
          toast.error("Failed deleting");
          return;
        }

        setDrafts((prev) => prev.filter((x) => x.id !== id));
        toast.success("Draft deleted");
      }

      async function copyLink(id: string) {
        const url = `${window.location.origin}/dream/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }

      async function togglePin(dreamId: string, current: boolean) {
        if (!current) {
          const pinnedCount = posts.filter((p) => p.pinned).length;
          if (pinnedCount >= 3) {
            toast.error("You can only pin up to 3 dreams 📌");
            return;
          }
        }
        const { error } = await supabase.from("dreams").update({ pinned: !current }).eq("id", dreamId);
        if (error) {
          toast.error("Failed");
          return;
        }
        setPosts((prev) => prev.map((p) => p.id === dreamId ? { ...p, pinned: !current } : p).sort((a, b) => Number(b.pinned || false) - Number(a.pinned || false)));
        toast.success(current ? "Dream unpinned" : "Dream pinned 📌");
      }

      async function archiveDream(id: string) {
        const { error } = await supabase
          .from("dreams")
          .update({ archived: true })
          .eq("id", id);

        if (error) {
          toast.error("Archive failed");
          return;
        }

        setPosts((prev) => prev.filter((x) => x.id !== id));
        toast.success("Dream archived 🌙");
      }

      async function archiveDraft(id: string) {
        const { error } = await supabase
          .from("drafts")
          .update({ archived: true })
          .eq("id", id);

        if (error) {
          toast.error("Archive failed");
          return;
        }

        setDrafts((prev) => prev.filter((x) => x.id !== id));
        toast.success("Draft archived");
      }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[50vh]">
          Loading...
        </div>
      </AppLayout>
    );
  }

  const wordCount = bio.trim() ? bio.trim().split(/\s+/).length : 0;
  const initials = (username || profile.anonymous_name || "?")[0]?.toUpperCase();

  return (
    <AppLayout>
      <BackButton />

      <div className="bg-card border rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Avatar — now uses gradient or image from DB */}
          <UserAvatar profile={profile} size="xl" className="shadow-lg" />

          <div className="flex-1">
            <h2 className="font-display text-3xl">
              {profile.anonymous_name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {profile.bio || "No bio yet"}
            </p>
            <p className="text-xs mt-2 text-accent">
              🌙 {profile.dream_vibe || "Dream Wanderer"}
            </p>

            <div className="flex gap-5 mt-4 flex-wrap">
              <div>{posts.length} posts</div>
              <button onClick={() => { setOpenFollowers(true); loadFollowers(); }}>
                {profile.followers_count} Echoers
              </button>
              <button onClick={() => { setOpenFollowing(true); loadFollowing(); }}>
                {profile.following_count} Echoing
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => setOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <Button onClick={() => setShowQR(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            QR
          </Button>

          <Button onClick={()=>navigate({to:"/dashboard"})}>
            Dashboard
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-6 py-2 rounded-full transition border ${
            activeTab === "posts"
              ? "bg-primary text-white border-primary"
              : "bg-card border-border"
          }`}
        >
          Posts
        </button>

        <button
          onClick={() => setActiveTab("drafts")}
          className={`px-6 py-2 rounded-full transition border ${
            activeTab === "drafts"
              ? "bg-primary text-white border-primary"
              : "bg-card border-border"
          }`}
        >
          Drafts
        </button>
      </div>

      <div className="mt-8">
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === "posts"
            ? posts.map((post) => (
              
                <Link
                  key={post.id}
                  to="/dream/$id"
                  params={{ id: post.id }}
                  className="rounded-3xl overflow-hidden border bg-card relative"
                >
                  {post.pinned && (
                    <div className="absolute top-3 left-3 z-10 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                      <Pin className="w-3 h-3 fill-current"/>
                      Pinned
                    </div>
                  )}
                  <img
                    src={post.cover || generateDreamImage()}
                    className="w-full h-56 object-cover"
                  />

                  <div className="p-3">
                    <h2 className="font-bold">{post.title}</h2>
                    <p className="text-xs text-muted-foreground">👁 {post.views_count}</p>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) =>{e.preventDefault(); e.stopPropagation(); archiveDream(post.id)}}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive Dream
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e)=>{e.preventDefault(); e.stopPropagation(); togglePin(post.id, post.pinned)}}>
                          <Pin className="mr-2 h-4 w-4" />
                           {post.pinned ? "Unpin Dream" : "Pin Dream"}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => {e.preventDefault(); e.stopPropagation(); copyLink(post.id)}}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {e.preventDefault(); e.stopPropagation(); deleteDream(post.id)}}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Dream
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Link>
              ))
            : drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-3xl overflow-hidden border bg-card relative"
                >
                  <img
                    src={draft.cover}
                    className="w-full h-56 object-cover"
                  />

                  <div className="p-3">
                    <h2 className="font-bold">{draft.title}</h2>
                    <p className="text-xs text-muted-foreground">Draft 🌙</p>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({
                              to: "/post",
                              search: {
                                draftId: draft.id,
                              },
                            })
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Draft
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => archiveDraft(draft.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Move To Archive
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => deleteDraft(draft.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Draft
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* ── Edit Profile Dialog — now has avatar + all dream vibes ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border bg-card p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">

            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-full shrink-0 shadow-lg overflow-hidden ${
                  avatarUrl
                    ? "bg-cover bg-center"
                    : `bg-gradient-to-br ${avatarGradient || "from-violet-500 to-purple-700"}`
                } grid place-items-center text-white text-2xl font-bold`}
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
              >
                {!avatarUrl && initials}
              </div>
              <div>
                <p className="text-sm font-medium">{username || profile.anonymous_name}</p>
                <p className="text-xs text-muted-foreground">{dreamVibe || "Dream Wanderer"}</p>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="text-sm font-medium block mb-2">Avatar Image</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? "Uploading…" : "Upload Image"}
                </Button>
                {avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeAvatar}
                    className="gap-2 text-red-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" /> Remove Image
                  </Button>
                )}
                <span className="text-xs text-muted-foreground self-center ml-auto">
                  {avatarUrl ? "📷 Image Avatar" : "🎨 Gradient Avatar"}
                </span>
              </div>
            </div>

            {/* Gradient picker — only when no image */}
            {!avatarUrl && (
              <div>
                <label className="text-sm font-medium block mb-2">Avatar Gradient</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => setAvatarGradient(g.class)}
                      title={g.name}
                      className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${g.class} transition hover:scale-110 ${
                        avatarGradient === g.class
                          ? "ring-2 ring-white ring-offset-2 ring-offset-card"
                          : ""
                      }`}
                    >
                      {avatarGradient === g.class && (
                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="text-sm block mb-2">Username</label>
              <input
                value={username}
                disabled={!canChangeUsername()}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-xl p-3 bg-background"
              />
              <p className="text-xs mt-1 text-muted-foreground">
                {canChangeUsername()
                  ? "2 username changes allowed monthly"
                  : "Monthly username limit reached"}
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm block mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => {
                  const words = e.target.value.trim().split(/\s+/);
                  if (words.length <= 60) {
                    setBio(e.target.value);
                  }
                }}
                className="w-full min-h-[120px] border rounded-xl p-3 bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {wordCount}/60 words
              </p>
            </div>

            {/* Dream Vibe — all 8 as buttons instead of a select */}
            <div>
              <label className="text-sm font-medium block mb-2">Dream Vibe</label>
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

            <Button
              className="w-full gradient-violet"
              disabled={saving || uploadingImage}
              onClick={saveProfile}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="rounded-3xl bg-card border border-border/60 p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Your Dream QR 🌙
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCode
                value={profileLink}
                size={180}
              />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-lg">
                @{profile.anonymous_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Scan to visit profile
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(profileLink);
                toast.success("Profile link copied ✨");
              }}
            >
              Copy Profile Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openFollowers} onOpenChange={setOpenFollowers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Echoers ({followers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {followers.map((item: any) => (
              <div key={item.follower.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ to: "/profile/$id", params: { id: item.follower.id } })}>
                  <UserAvatar profile={item.follower} size="sm" />
                  <div>
                    <div>{item.follower.anonymous_name}</div>
                  </div>
                </div>
                {item.follower.id !== profile.id && (
                  <Button size="sm" variant={followingMap[item.follower.id] ? "secondary" : "default"} onClick={() => toggleFollowUser(item.follower.id)}>
                    {followingMap[item.follower.id] ? "Echoing" : "Echo"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openFollowing} onOpenChange={setOpenFollowing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Echoing ({following.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {following.map((item: any) => (
              <div key={item.following.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ to: "/profile/$id", params: { id: item.following.id } })}>
                  <UserAvatar profile={item.following} size="sm" />
                  <div>
                    <div className="font-medium">{item.following.anonymous_name}</div>
                  </div>
                </div>
                {item.following.id !== profile.id && (
                  <Button size="sm" variant={followingMap[item.following.id] ? "secondary" : "default"} onClick={() => toggleFollowUser(item.following.id)}>
                    {followingMap[item.following.id] ? "Echoing" : "Echo"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}