import { useCallback } from "react";
import { soundManager, type SoundType } from "@/shared/sound-manager";

export function useSound() {
  const play = useCallback((type: SoundType) => {
    soundManager.play(type);
  }, []);

  return { play };
}
