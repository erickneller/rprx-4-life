export function VideoEmbed({ url }: { url: string }) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const loom = url.match(/loom\.com\/share\/([\w-]+)/);
  const descript = url.match(/share\.descript\.com\/(?:view|embed)\/([a-zA-Z0-9]+)/);
  let embed: string | null = null;
  if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
  else if (vimeo) embed = `https://player.vimeo.com/video/${vimeo[1]}`;
  else if (loom) embed = `https://www.loom.com/embed/${loom[1]}`;
  else if (descript) embed = `https://share.descript.com/embed/${descript[1]}`;

  if (embed) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={embed}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <video src={url} controls playsInline className="w-full aspect-video rounded-lg bg-black" />;
}

export default VideoEmbed;
