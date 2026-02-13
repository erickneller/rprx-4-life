import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageLightboxProps {
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({ src, open, onOpenChange }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-2 bg-background/95 backdrop-blur">
        <img
          src={src}
          alt="Motivation"
          className="w-full h-auto max-h-[80vh] object-contain rounded-md"
        />
      </DialogContent>
    </Dialog>
  );
}
