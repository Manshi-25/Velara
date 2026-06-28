import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, Languages, Image as ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateDreamImage } from "@/lib/randomDreamImage";

import { updateUserStreak } from "@/lib/streak";
export const Route = createFileRoute("/post")({
  validateSearch:(search)=>({
  draftId:(search.draftId as string) || ""}),
  component:Post
  });

const moods = [
  { k: "scared", label: "Scared" },
  { k: "happy", label: "Happy" },
  { k: "confused", label: "Confused" },
  { k: "excited", label: "Excited" },
  { k: "sad", label: "Sad" },
  { k: "lucid", label: "Lucid" },
  { k: "anxious", label: "Anxious" }
];

const types = [
  "Recurring",
  "Lucid",
  "Nightmare",
  "Prophetic",
  "Flying",
  "People I know",
  "Being chased",
  "Magical",
  "Past memory",
  "Time loop"
];

function Post() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("scared");
  const [dreamTime, setDreamTime] = useState("Early morning");
  const [picked, setPicked] = useState<string[]>([]);
  const [image,setImage] = useState<File | null>(null);
  const [preview,setPreview]=useState("");
  const [imageUrl,setImageUrl] = useState("");
  //const [draftId,setDraftId]=useState("");
  const search = useSearch({from:"/post"});
  const draftId =search.draftId;

  function toggle(type: string) {
    setPicked((prev) =>
      prev.includes(type)
        ? prev.filter((x) => x !== type)
        : [...prev, type]
    );
  }

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) return;

      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setTitle(data.title || "");
      setBody(data.body || "");
      setMood(data.mood || "scared");
      setDreamTime(data.dream_time || "Early morning");
      setPicked(data.type || []);
      if (data.cover) {
        setPreview(data.cover);
        setImageUrl(data.cover);
      }
    }

    loadDraft();
  }, [draftId]);

    async function saveDraft() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Login required");
          return;
        }

        let uploadedImage = null;

        if (image) {
          uploadedImage = await uploadImage();
        }

        let error;

        if (draftId) {
          // UPDATE EXISTING DRAFT
          const response = await supabase
            .from("drafts")
            .update({
              title,
              body,
              mood,
              type: picked,
              dream_time: dreamTime,
              cover: uploadedImage && uploadedImage.trim() !== ""? uploadedImage: generateDreamImage(),
            })
            .eq("id", draftId);

          error = response.error;
        } else {
          // CREATE NEW DRAFT
          const response = await supabase
            .from("drafts")
            .insert({
              user_id: user.id,
              title,
              body,
              mood,
              type: picked,
              dream_time: dreamTime,
              cover: uploadedImage && uploadedImage.trim() !== ""? uploadedImage: generateDreamImage(),
            });

          error = response.error;
        }

        if (error) {
          console.log(error);
          toast.error("Failed saving draft");
          return;
        }

        toast.success("Draft saved 🌙");
        
        setTitle("");
        setBody("");
        setMood("scared");
        setPicked([]);
        setDreamTime("Early morning");
        setImage(null);
        setPreview("");
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    }

  async function uploadImage() {

    if(!image) return null;

    const fileName =
    `${Date.now()}-${image.name}`;

    const {error} =
    await supabase.storage
    .from("dream-images")
    .upload(
        fileName,
        image
    );

    if(error){

      console.log(error);

      toast.error(
      "Image upload failed"
      );

      return null;
    }

    const {data} =
    supabase.storage
    .from("dream-images")
    .getPublicUrl(
        fileName
    );

    return data.publicUrl;

    }

  async function postDream() {
    try {
      setLoading(true);

      if (!title) {
        toast.error("Enter dream title");
        return;
      }

      if (body.trim().length < 20) {
        toast.error("Dream should contain at least 20 characters");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Login required");
        return;
      }
      let uploadedImage = image? await uploadImage(): imageUrl;
      if (!uploadedImage || uploadedImage.trim() === "") {
        uploadedImage = generateDreamImage();
      }
      const { error } = await supabase
        .from("dreams")
        .insert({
          user_id: user.id,
          title,
          body,
          mood,
          type: picked.length > 0 ? picked.join(", ") : null,
          dream_time: dreamTime,
          cover: uploadedImage,
          likes_count: 0,
          comments_count: 0,
          saved_count: 0,
          views_count: 0,
        });
      
     

      await updateUserStreak(
        user.id
      );

      if (error) {
        console.log(error);
        //toast.error("Unable to post dream");
        console.error(error.message);

        return;
      }

      await supabase.rpc("refresh_post_count", {
        profile_id: user.id
      });

      if (draftId) {
        await supabase
          .from("drafts")
          .delete()
          .eq("id", draftId);
      }
      toast.success("Dream posted 🌙");
      navigate({ to: "/account" });
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout> 
      <BackButton className="mb-4" />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="font-display text-2xl sm:text-3xl">
            Post a dream
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Capture it before morning forgets
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-3xl p-6 lg:p-8">
          <div className="space-y-5">
            <div>
              <label className="text-xs uppercase">Dream title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The endless hallway..."
                className="mt-2 bg-background"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-xs uppercase">Describe your dream</label>
                <span className="text-xs">{body.length} chars</span>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe dream..."
                className="mt-2 min-h-[180px]"
              />

              {preview && (
                <div className="mt-5">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Dream Image (Optional)
                  </label>

                  <div className="relative mt-2 w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
                    <img
                      src={preview}
                      className="w-full h-[260px] sm:h-[320px] object-cover transition duration-500 hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setPreview("");
                      }}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/60"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files) {
                            const file = e.target.files[0];
                            setImage(file);
                            setPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/60"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Enhance AI
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/60"
                  >
                    <Languages className="h-4 w-4 mr-1" />
                    Translate
                  </Button>

                  <Button size="sm" className="ml-auto gradient-violet">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Generate Image
                  </Button>
                </div>

              </div>
            </div>

            <div>
              <label className="text-xs uppercase">How did you feel?</label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {moods.map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMood(m.k)}
                    className={`px-3 py-2 rounded-xl border ${
                      mood === m.k
                        ? "border-primary bg-primary/15"
                        : "border-border"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase">Dream Type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={`px-3 py-1 rounded-full border ${
                      picked.includes(t)
                        ? "bg-primary/20 border-primary"
                        : "border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase">Dream Time</label>
              <select
                value={dreamTime}
                onChange={(e) => setDreamTime(e.target.value)}
                className="w-full mt-2 h-12 rounded-xl bg-card border border-border/60 px-4 text-foreground outline-none focus:ring-2 focus:ring-primary transition cursor-pointer"
              >
                <option>Early morning</option>
                <option>Late night</option>
                <option>Midnight</option>
                <option>Afternoon nap</option>
              </select>
            </div>

            <div className="pt-4 border-t flex justify-between">
              <Button variant="outline" onClick={saveDraft}>
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>

              <Button
                disabled={loading}
                onClick={postDream}
                className="gradient-violet"
              >
                {loading ? "Posting..." : "Post Dream"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}