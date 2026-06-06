import {getFromLocalStorage} from '@ui/utils/hooks/local-storage';

export type ConversationSoundName =
  | 'message'
  | 'newVisitor'
  | 'incomingChat'
  | 'queuedVisitor';

const audioCache: Record<string, HTMLAudioElement> = {};

let audioUnlockListenerAttached = false;
let audioUnlocked = false;

function attachAudioUnlockListener() {
  if (audioUnlockListenerAttached || typeof document === 'undefined') return;
  audioUnlockListenerAttached = true;

  const unlock = () => {
    audioUnlocked = true;
    // Prime cached audio elements so subsequent play() calls are allowed.
    Object.values(audioCache).forEach(audio => {
      try {
        const originalVolume = audio.volume;
        const originalMuted = audio.muted;
        audio.muted = true;
        audio.volume = 0;
        audio.currentTime = 0;
        void audio.play().finally(() => {
          audio.pause();
          audio.muted = originalMuted;
          audio.volume = originalVolume;
        });
      } catch {
        // ignore
      }
    });

    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };

  document.addEventListener('pointerdown', unlock, {once: true});
  document.addEventListener('keydown', unlock, {once: true});
}

export function playConversationSound(
  sound: ConversationSoundName,
  key: 'dashboard' | 'widget',
) {
  const soundsDisabled = getFromLocalStorage(
    `${key}-chatSoundsDisabled`,
    false,
  );
  if (soundsDisabled) return null;
  const snakeCase = sound.replace(/([A-Z])/g, '-$1').toLowerCase();
  const audio = audioCache[snakeCase] ?? new Audio(`/sounds/${snakeCase}.mp3`);
  audioCache[snakeCase] = audio;
  audio.currentTime = 0;
  audio.volume = 0.4;

  // Autoplay restrictions surface as a rejected promise (not a thrown error).
  // If blocked, attach a one-time user-interaction listener to unlock audio.
  void audio.play().catch(() => {
    if (!audioUnlocked) {
      attachAudioUnlockListener();
    }
    return null;
  });
}
