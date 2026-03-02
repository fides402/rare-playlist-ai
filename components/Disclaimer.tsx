export default function Disclaimer() {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-surface/80 backdrop-blur-lg border border-border rounded-lg p-3 text-xs text-text-muted text-center">
          <p>
            <strong>RarePlaylistAI</strong> is a music discovery app. All tracks are provided by the Hi-Fi streaming API.
            We do not host or download any audio files. Please support artists by streaming on their preferred platforms.
          </p>
        </div>
      </div>
    </div>
  )
}
