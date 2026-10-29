import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { normaliseCompletedCases } from "./gameLogic";
import { xpForCases } from "./levels";
import type { AvatarConfig, CaseId, Language, UnitId, UnitVideoProgress, UserState } from "./types";
import { useAudio } from "./useAudio";
import type { Sound } from "./audio";
import { canAccessCase } from "./navigation";
import { mergeUnitVideos, mergeVideoProgress, normaliseUnitVideos, unitVideos } from "./videoProgress";

const STORAGE_KEY = "math-it-player";
const defaultPlayer: UserState = {
  name: "",
  avatar: { animal: "fox", color: "teal" },
  language: "en",
  completedCases: [],
  xp: 0,
  soundEnabled: true,
  unitVideos: {},
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
      xp: xpForCases(completedCases.length),
      soundEnabled: typeof data.soundEnabled === "boolean"
        ? data.soundEnabled
        : defaultPlayer.soundEnabled,
      unitVideos: normaliseUnitVideos(data.unitVideos),
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
  saveVideoProgress: (unitId: UnitId, progress: UnitVideoProgress) => void;
  setVideoActive: (active: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, renderPlayer] = useState<UserState>(readPlayer);
  const currentPlayer = useRef(player);
  const [videoActive, setVideoActive] = useState(false);
  const playSound = useAudio(player.soundEnabled && !videoActive);

  // Persist at the same moment as the update, including pagehide/unmount saves.
  // Relying only on a later React effect can lose the last position on refresh.
  const setPlayer = useCallback((update: (current: UserState) => UserState) => {
    // Another open tab may have earned progress since this tab last rendered.
    const stored = readPlayer();
    const completedCases = normaliseCompletedCases([...currentPlayer.current.completedCases, ...stored.completedCases]);
    const next = update({ ...currentPlayer.current, completedCases, xp: xpForCases(completedCases.length),
      unitVideos: mergeUnitVideos(currentPlayer.current.unitVideos, stored.unitVideos) });
    if (next === currentPlayer.current) return;
    currentPlayer.current = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Play still works without storage. */ }
    renderPlayer(next);
  }, []);

  const saveVideoProgress = useCallback((unitId: UnitId, progress: UnitVideoProgress) => {
    setPlayer((current) => ({ ...current, unitVideos: {
      ...current.unitVideos,
      [unitId]: mergeVideoProgress(current.unitVideos[unitId], progress, unitVideos[unitId].duration),
    } }));
  }, [setPlayer]);

  useEffect(() => {
    document.documentElement.lang = player.language;
  }, [player.language]);

  function updateProfile(name: string, avatar: AvatarConfig) {
    const cleanName = name.trim().slice(0, 24);
    if (!cleanName || !validAvatar(avatar)) return;
    setPlayer((current) => ({ ...current, name: cleanName, avatar }));
  }

  function completeCase(caseId: CaseId) {
    setPlayer((current) => {
      if (
        !canAccessCase(caseId, current) ||
        current.completedCases.includes(caseId)
      )
        return current;
      const completedCases = [...current.completedCases, caseId];
      return { ...current, completedCases, xp: xpForCases(completedCases.length) };
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
        saveVideoProgress,
        setVideoActive,
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
