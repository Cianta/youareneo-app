import { MediaStudio } from '@/components/media/MediaStudio';

export default function MediaPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-5 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Audio, Podcast & Video Production</p>
        <p className="text-sm text-anth-400">
          Generate AI voice-overs with ElevenLabs or OpenAI TTS. Create podcast scripts with Gemini. Process video via the Video Editor module.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MediaStudio />
      </div>
    </div>
  );
}
