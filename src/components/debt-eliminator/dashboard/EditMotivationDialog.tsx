import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EditMotivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMotivation: string;
  currentImages: string[];
  onSave: (newMotivation: string, images: string[]) => void;
  isLoading: boolean;
}

const MOTIVATION_PROMPTS = [
  "Take a dream vacation without worrying about money",
  "Buy a home for my family",
  "Start my own business",
  "Retire early and live comfortably",
  "Send my kids to college debt-free",
  "Finally feel financially free and at peace",
];

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function EditMotivationDialog({
  open,
  onOpenChange,
  currentMotivation,
  currentImages,
  onSave,
  isLoading,
}: EditMotivationDialogProps) {
  const { user } = useAuth();
  const [motivation, setMotivation] = useState(currentMotivation);
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMotivation(currentMotivation);
      setImages(currentImages);
    }
  }, [open, currentMotivation, currentImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE || !file.type.startsWith("image/")) continue;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/motivation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error } = await supabase.storage
        .from("motivation-images")
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("motivation-images")
        .getPublicUrl(path);

      newUrls.push(publicUrl);
    }

    setImages((prev) => [...prev, ...newUrls].slice(0, MAX_IMAGES));
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (motivation.trim() || images.length > 0) {
      onSave(motivation.trim(), images);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Edit Your Motivation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivation">
              What's driving you? How will completing this plan help you and those closest to you?
            </Label>
            <Textarea
              id="motivation"
              placeholder="When I complete this, I will..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Image uploads */}
          <div className="space-y-2">
            <Label>Vision photos (up to {MAX_IMAGES})</Label>
            {images.length > 0 && (
              <div className="flex gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Motivation ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < MAX_IMAGES && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Add Photo"}
                </Button>
              </>
            )}
          </div>

          {/* Inspiration prompts */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Need inspiration?</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVATION_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setMotivation(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={(!motivation.trim() && images.length === 0) || isLoading || uploading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Motivation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
