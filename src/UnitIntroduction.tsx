import { useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import { Icon } from "./Illustrations";
import { getUnit, units } from "./gameLogic";
import type { UnitId, UnitVideoProgress } from "./types";
import {
  createViewingSession, formatVideoTime, nextUnwatchedPosition,
  recordViewingSample, resetViewingAnchor, unitVideos, watchedSeconds,
} from "./videoProgress";
import "./UnitIntroduction.css";

const copy = {
  en: {
    unit: "UNIT", introduction: "Your unit introduction", review: "Review Video",
    welcome: "Ready, detective?", message: "Watch this introduction to get ready for this unit.",
    reviewMessage: "Watch again whenever you like. Your unit stays unlocked.",
    duration: "Video duration", player: "Introduction video for", back: "Back to units",
    start: "Start Unit", complete: "Introduction complete!", unlocked: "Your unit is ready. Let’s investigate!",
    watched: "watched", progress: "Introduction viewing progress", loading: "Getting your video ready…",
    waiting: "Just a moment — your video is loading…", error: "We couldn’t play your video.",
    errorHelp: "Check your connection, then try again. Your saved progress is safe.", retry: "Try again",
    help: "You can pause, go back, and keep watching later. We’ll save your place.",
    finish: "Watch every part to unlock Start Unit. Jumping ahead won’t skip a part.",
    missing: "A few parts still need watching. Let’s go back to the first one.",
    return: "Watch the next unwatched part", noSupport: "Your browser cannot play this video. Please try an up-to-date browser.",
    resume: "Continuing from your saved place.",
  },
  id: {
    unit: "UNIT", introduction: "Video pengantar unitmu", review: "Tonton Ulang Video",
    welcome: "Siap, Detektif?", message: "Tonton pengantar ini untuk bersiap memulai unit.",
    reviewMessage: "Tonton lagi kapan saja. Unitmu tetap terbuka.",
    duration: "Durasi video", player: "Video pengantar untuk", back: "Kembali ke unit",
    start: "Mulai Unit", complete: "Pengantar selesai!", unlocked: "Unitmu siap. Ayo selidiki!",
    watched: "ditonton", progress: "Kemajuan menonton pengantar", loading: "Menyiapkan videomu…",
    waiting: "Sebentar ya — videomu sedang dimuat…", error: "Videomu belum bisa diputar.",
    errorHelp: "Periksa koneksimu, lalu coba lagi. Kemajuanmu tetap tersimpan.", retry: "Coba lagi",
    help: "Kamu boleh jeda, mundur, dan lanjut nanti. Tempat terakhirmu akan disimpan.",
    finish: "Tonton semua bagian untuk membuka Mulai Unit. Melompat maju tidak melewati bagian yang belum ditonton.",
    missing: "Ada bagian yang belum ditonton. Ayo kembali ke bagian pertama yang terlewat.",
    return: "Tonton bagian yang belum selesai", noSupport: "Browsermu belum bisa memutar video ini. Coba browser versi terbaru.",
    resume: "Melanjutkan dari tempat terakhirmu.",
  },
};

export default function UnitIntroduction({ unitId, onStart, onBack }: {
  unitId: UnitId; onStart: () => void; onBack: () => void;
}) {
  const { player, saveVideoProgress, setVideoActive } = useGame();
  const t = copy[player.language];
  const unit = units.find((candidate) => candidate.id === unitId) ?? getUnit(1);
  const video = unitVideos[unitId];
  const [session] = useState(() => createViewingSession(
    player.unitVideos[unitId] ?? { position: 0, ranges: [], completed: false }, video.duration,
  ));
  const [progress, setProgress] = useState<UnitVideoProgress>(() => session.progress);
  const [status, setStatus] = useState<"loading" | "ready" | "waiting" | "error">("loading");
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const restored = useRef(false);
  const lastSave = useRef(0);
  const [resuming] = useState(() => !session.progress.completed && session.progress.position > 1);
  const seconds = watchedSeconds(progress);
  const percent = progress.completed ? 100 : Math.min(99, Math.floor(seconds / video.duration * 100));

  function sample(forceSave = false, rate?: number) {
    const element = videoRef.current;
    if (!element || !restored.current) return;
    const now = performance.now();
    const next = recordViewingSample(session, {
      position: element.currentTime, now,
      playing: !element.paused && !element.ended && element.readyState >= 2 && !document.hidden,
      seeking: element.seeking, rate: rate ?? element.playbackRate,
    });
    setProgress({ ...next, ranges: [...next.ranges] });
    if (forceSave || now - lastSave.current >= 1000 || next.completed !== progress.completed) {
      lastSave.current = now;
      saveVideoProgress(unitId, next);
    }
  }

  useEffect(() => {
    const element = videoRef.current;
    setVideoActive(true);
    const flush = () => {
      if (!element || !restored.current) return;
      const next = recordViewingSample(session, {
        position: element.currentTime, now: performance.now(),
        playing: !element.paused && !element.ended && element.readyState >= 2 && !document.hidden,
        seeking: element.seeking, rate: element.playbackRate,
      });
      saveVideoProgress(unitId, next);
    };
    const visibility = () => {
      flush();
      resetViewingAnchor(session);
      if (document.hidden) element?.pause();
    };
    // Native timeupdate can be sparse on mobile. This samples playback, never advances it.
    const interval = window.setInterval(() => {
      if (!element || !restored.current || element.paused) return;
      const next = recordViewingSample(session, {
        position: element.currentTime, now: performance.now(),
        playing: element.readyState >= 2 && !document.hidden,
        seeking: element.seeking, rate: element.playbackRate,
      });
      setProgress({ ...next, ranges: [...next.ranges] });
      if (performance.now() - lastSave.current >= 1000) {
        lastSave.current = performance.now();
        saveVideoProgress(unitId, next);
      }
    }, 500);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      flush();
      resetViewingAnchor(session);
      window.clearInterval(interval);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", visibility);
      setVideoActive(false);
    };
  }, [unitId, session, saveVideoProgress, setVideoActive]);

  function restorePosition() {
    const element = videoRef.current;
    if (!element || restored.current) return;
    restored.current = true;
    const saved = session.progress.position;
    // A finished review begins at the beginning, with its completion untouched.
    element.currentTime = session.progress.completed && saved >= video.duration - 1 ? 0 : saved;
    resetViewingAnchor(session);
    setStatus("ready");
  }

  function retry() {
    sample(true);
    resetViewingAnchor(session);
    restored.current = false;
    setStatus("loading");
    setEnded(false);
    videoRef.current?.load();
  }

  function watchMissing() {
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = nextUnwatchedPosition(session.progress, video.duration);
    resetViewingAnchor(session);
    setEnded(false);
    void element.play().catch(() => { /* Native controls remain available if playback needs another tap. */ });
    element.focus();
  }

  return (
    <section className={"unit-introduction unit-" + unitId} aria-labelledby="unit-intro-title">
      <button className="video-back" type="button" onClick={() => { sample(true); onBack(); }}>
        <span aria-hidden="true">←</span>{t.back}
      </button>
      <div className="unit-intro-heading">
        <div>
          <span className="eyebrow">{t.unit} {unitId} · {progress.completed ? t.review : t.introduction}</span>
          <h2 id="unit-intro-title">{unit.title[player.language]}</h2>
          <p className="video-welcome">{progress.completed ? t.reviewMessage : t.welcome}</p>
          {!progress.completed && <p className="video-message">{t.message}</p>}
        </div>
        <span className="video-duration"><Icon name="youtube" size={19} />{t.duration}<strong>{formatVideoTime(video.duration)}</strong></span>
      </div>
      <div className="unit-video-frame">
        <video
          ref={videoRef} controls playsInline preload="metadata" poster={video.poster}
          aria-label={`${t.player} ${t.unit} ${unitId}: ${unit.title[player.language]}`}
          aria-describedby="unit-video-help" tabIndex={0}
          onLoadedMetadata={restorePosition}
          onCanPlay={() => setStatus("ready")}
          onLoadStart={() => setStatus("loading")}
          onWaiting={() => { sample(true); resetViewingAnchor(session); setStatus("waiting"); }}
          onPlaying={() => { setStatus("ready"); setEnded(false); sample(); }}
          onPlay={() => { setEnded(false); sample(); }}
          onTimeUpdate={() => sample()}
          onPause={() => sample(true)}
          onRateChange={() => { sample(true, session.anchor?.rate); resetViewingAnchor(session); sample(); }}
          onSeeking={() => { resetViewingAnchor(session); setEnded(false); }}
          onSeeked={() => { resetViewingAnchor(session); sample(true); }}
          onEnded={() => { sample(true); setEnded(true); }}
          onError={() => { sample(true); resetViewingAnchor(session); setStatus("error"); }}
        >
          <source src={video.src} type="video/mp4" />
          {video.captions?.map((track) => <track key={track.src} kind="captions" src={track.src} label={track.label} srcLang={track.language} />)}
          {t.noSupport}
        </video>
        {status === "error" && <div className="video-error" role="alert">
          <Icon name="help" size={28} /><strong>{t.error}</strong><p>{t.errorHelp}</p>
          <button className="primary-button" type="button" onClick={retry}><Icon name="reset" size={17} />{t.retry}</button>
        </div>}
      </div>
      <div className="video-loading-message" role="status" aria-live="polite">
        {status === "loading" ? t.loading : status === "waiting" ? t.waiting : resuming && percent < 100 ? t.resume : ""}
      </div>
      <div className={"video-progress-panel" + (progress.completed ? " video-is-complete" : "")}>
        <div className="video-progress-copy">
          <span className="video-status-icon"><Icon name={progress.completed ? "check" : "book"} size={22} /></span>
          <div>
            <strong>{progress.completed ? t.complete : `${percent}% ${t.watched}`}</strong>
            <p>{progress.completed ? t.unlocked : t.finish}</p>
          </div>
        </div>
        <div className="video-watch-bar" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${percent}%` }} />
        </div>
        {ended && !progress.completed && <div className="video-missing" role="status">
          <p>{t.missing}</p><button className="video-secondary-button" type="button" onClick={watchMissing}><Icon name="undo" size={16} />{t.return}</button>
        </div>}
      </div>
      <span className="sr-only" role="status">{progress.completed ? t.complete : ""}</span>
      <div className="video-actions">
        <p id="unit-video-help"><Icon name="shield" size={18} />{t.help}</p>
        <button className="primary-button video-start" type="button" disabled={!progress.completed}
          onClick={() => { sample(true); if (session.progress.completed) onStart(); }}>
          <Icon name={progress.completed ? "arrow" : "lock"} size={19} />{t.start}
        </button>
      </div>
    </section>
  );
}
