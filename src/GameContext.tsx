import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isCaseUnlocked, normaliseCompletedCases } from "./gameLogic";
import type { AvatarConfig, CaseId, Language, UserState } from "./types";
import { useAudio } from "./useAudio";
import type { Sound } from "./audio";

const STORAGE_KEY = "math-it-player";
const defaultPlayer: UserState = {
  name: "",
  avatar: { animal: "fox", color: "teal" },
  language: "en",
  completedCases: [],
  score: 0,
  soundEnabled: true,
};

function validAvatar(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const avatar = value as Partial<AvatarConfig>;
  return (
    ["fox", "cat", "bear"].includes(avatar.animal ?? "") &&
    ["teal", "yellow", "coral"].includes(avatar.color ?? "")
  );
}

function readPlayer(): UserState {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (!saved || typeof saved !== "object") return defaultPlayer;
    const data = saved as Partial<UserState>;
    const completedCases = normaliseCompletedCases(data.completedCases);
    return {
      name: typeof data.name === "string" ? data.name.trim().slice(0, 24) : "",
      avatar: validAvatar(data.avatar) ? data.avatar : defaultPlayer.avatar,
      language: data.language === "id" ? "id" : "en",
      completedCases,
      score: completedCases.length * 100,
      soundEnabled: typeof data.soundEnabled === "boolean"
        ? data.soundEnabled
        : defaultPlayer.soundEnabled,
    };
  } catch {
    return defaultPlayer;
  }
}

interface GameContextValue {
  player: UserState;
  setLanguage: (language: Language) => void;
  startGame: (name: string, avatar: AvatarConfig) => void;
  updateProfile: (name: string, avatar: AvatarConfig) => void;
  completeCase: (caseId: CaseId) => void;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (sound: Sound) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<UserState>(readPlayer);
  const playSound = useAudio(player.soundEnabled);

  useEffect(() => {
    document.documentElement.lang = player.language;
  }, [player.language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      // Private browsing or a full device must not interrupt the investigation.
    }
  }, [player]);

  function updateProfile(name: string, avatar: AvatarConfig) {
    const cleanName = name.trim().slice(0, 24);
    if (!cleanName || !validAvatar(avatar)) return;
    setPlayer((current) => ({ ...current, name: cleanName, avatar }));
  }

  function completeCase(caseId: CaseId) {
    setPlayer((current) => {
      if (
        !isCaseUnlocked(caseId, current.completedCases) ||
        current.completedCases.includes(caseId)
      )
        return current;
      const completedCases = [...current.completedCases, caseId];
      return { ...current, completedCases, score: completedCases.length * 100 };
    });
  }

  return (
    <GameContext.Provider
      value={{
        player,
        setLanguage: (language) =>
          setPlayer((current) => ({ ...current, language })),
        startGame: updateProfile,
        updateProfile,
        completeCase,
        playSound,
        setSoundEnabled: (soundEnabled) =>
          setPlayer((current) => ({ ...current, soundEnabled })),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// The provider and its hook share the same tiny context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used inside GameProvider");
  return context;
}
