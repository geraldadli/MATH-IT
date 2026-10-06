import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { FormEvent } from "react";
import { GameProvider, useGame } from "./GameContext";
import GameBoard from "./GameBoard";
import { shellTranslations } from "./i18n";
import { Avatar, BakeryScene, Icon } from "./Illustrations";
import type { AvatarConfig, CaseId } from "./types";
import { caseLevels, getNextCase, isCaseUnlocked } from "./gameLogic";
import "./App.css";

function DetectiveForm({
  editing = false,
  onDone,
}: {
  editing?: boolean;
  onDone: () => void;
}) {
  const { player, startGame, updateProfile } = useGame();
  const t = shellTranslations[player.language];
  const [name, setName] = useState(player.name);
  const [avatar, setAvatar] = useState<AvatarConfig>(player.avatar);
  const [error, setError] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    if (editing) updateProfile(name.trim(), avatar);
    else startGame(name.trim(), avatar);
    onDone();
  }
  return (
    <form className="detective-form" onSubmit={submit}>
      <div className="badge-preview">
        <span className="badge-spark one">✦</span>
        <Avatar {...avatar} />
        <span className="badge-spark two">✧</span>
      </div>
      <div className="form-title">

        <h2>{editing ? t.editProfile : t.makeItOfficial}</h2>

      </div>
      <label
        className="input-label"
        htmlFor={editing ? "edit-name" : "detective-name"}
      >
        {t.detectiveName}
      </label>
      <input
        id={editing ? "edit-name" : "detective-name"}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError(false);
        }}
        placeholder={t.namePlaceholder}
        required
        maxLength={24}
        autoComplete="nickname"
        aria-invalid={error}
        aria-describedby={error ? "name-error" : undefined}
      />
      {error && (
        <p className="form-error" id="name-error" role="alert">
          {t.nameRequired}
        </p>
      )}
      <fieldset className="avatar-field">
        <legend>{t.choosePartner}</legend>
        <div className="avatar-options">
          {(["fox", "cat", "bear"] as const).map((animal) => (
            <label
              className={`avatar-option ${avatar.animal === animal ? "chosen" : ""}`}
              key={animal}
            >
              <input
                type="radio"
                name="animal"
                value={animal}
                checked={avatar.animal === animal}
                onChange={() => setAvatar({ ...avatar, animal })}
              />
              <Avatar animal={animal} color={avatar.color} />
              <span>{t[animal]}</span>
              {avatar.animal === animal && (
                <span className="choice-check">
                  <Icon name="check" size={12} />
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="color-field">
        <legend>{t.partnerColor}</legend>
        <div className="color-options">
          {(["teal", "yellow", "coral"] as const).map((color) => (
            <label className={`color-option color-${color}`} key={color}>
              <input
                type="radio"
                name="color"
                value={color}
                checked={avatar.color === color}
                onChange={() => setAvatar({ ...avatar, color })}
              />
              <span className="sr-only">{t[color]}</span>
              {avatar.color === color && <Icon name="check" size={15} />}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="primary-button form-submit" type="submit">
        {editing ? t.saveProfile : t.startInvestigation}
        <Icon name="arrow" size={19} />
      </button>
      {!editing && (
        <p className="form-reassurance">
          <Icon name="shield" size={14} />
          {t.savedOnDevice}
        </p>
      )}
    </form>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  return (
    <main className="start-layout">
      <section className="welcome-story">
        <span className="bureau-pill"><Icon name="search" size={15} />{t.bureau}</span>
        <h1>{t.heroLineOne}<br /><span>{t.heroLineTwo}</span></h1>
        <p className="welcome-description">{t.heroDescription}</p>
        <div className="story-illustration"><BakeryScene language={player.language} /></div>
      </section>
      <section className="onboarding-card"><DetectiveForm onDone={onStart} /></section>
    </main>
  );
}

function ProgressSummary() {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const solved = player.completedCases.length;
  return (
    <div className="progress-summary">
      <div className="progress-ring" role="img" aria-label={solved + "/" + caseLevels.length + " " + t.casesSolved}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="ring-track" cx="50" cy="50" r="42" />
          <circle className="ring-fill" cx="50" cy="50" r="42" strokeDasharray="263.9" strokeDashoffset={263.9 * (1 - solved / caseLevels.length)} />
        </svg>
        <strong aria-hidden="true">{solved}<span>/{caseLevels.length}</span></strong>
      </div>
      <div className="progress-copy">
        <span>{t.casesSolved}</span>
        <span key={player.score} className="points-total" aria-label={player.score + " " + t.detectivePoints}><Icon name="star" size={15} />{player.score}</span>
      </div>
    </div>
  );
}

function Dashboard({ openCase }: { openCase: (id: CaseId) => void }) {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const next = getNextCase(player.completedCases);
  return (
    <section className="dashboard-board">
      <div className="dashboard-feature">
        <div className="feature-copy">
          <span className="eyebrow">{next ? t.case + " " + String(next.id).padStart(2, "0") : t.allSolved}</span>
          <h2>{next ? next.title[player.language] : t.allSolvedTitle}</h2>
          <button className="primary-button" onClick={() => openCase(next?.id ?? 1)}>
            {next ? t.openCase : t.revisitCase}<Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="feature-art" aria-hidden="true">
          <span className="feature-symbol">{next?.preview ?? "★"}</span>
          <Avatar {...player.avatar} />
        </div>
      </div>
      <div className="case-files-heading"><h2>{t.caseFiles}</h2><span>{caseLevels.length}</span></div>
      <div className="case-file-grid">
        {caseLevels.map((level) => {
          const locked = !isCaseUnlocked(level.id, player.completedCases);
          const completed = player.completedCases.includes(level.id);
          const state = locked ? t.locked : completed ? t.completed : t.ready;
          return (
            <button
              className={"case-file pastel-" + (level.id - 1) % 4 + (locked ? " locked" : completed ? " completed" : " ready")}
              key={level.id} disabled={locked} onClick={() => openCase(level.id)}
              aria-label={t.case + " " + level.id + ": " + level.title[player.language] + ". " + state}
            >
              <div className="file-top"><span className="file-number">{String(level.id).padStart(2, "0")}</span><Icon name={completed ? "check" : locked ? "lock" : "arrow"} size={16} /></div>
              <div className="file-symbol" aria-hidden="true">{level.preview}</div>
              <h3>{level.title[player.language]}</h3>
              {locked && <span className="sr-only">{t.lockedAfter}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MathIt() {
  const { player, setLanguage, setSoundEnabled } = useGame();
  const t = shellTranslations[player.language];
  const [selectedCase, setSelectedCase] = useState<CaseId | null>(null);
  const caseNavigation = useRef<HTMLElement>(null);
  const profileDialog = useRef<HTMLDialogElement>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const started = Boolean(player.name);
  useEffect(() => {
    const scroll = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.065,
      syncTouch: false,
      respectReducedMotion: true,
      allowNestedScroll: true,
      prevent: (node) => node.tagName === "DIALOG",
      virtualScroll: () => !document.querySelector(".is-dragging"),
    });
    // Stop coasting before a click, keyboard action, or drag can move its target.
    const settle = () => scroll.scrollTo(scroll.actualScroll, { immediate: true });
    window.addEventListener("pointerdown", settle, true);
    window.addEventListener("keydown", settle, true);
    window.scrollTo({ top: 0, behavior: "instant" });
    caseNavigation.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
    return () => {
      window.removeEventListener("pointerdown", settle, true);
      window.removeEventListener("keydown", settle, true);
      scroll.destroy();
    };
  }, [selectedCase]);
  function openProfile() {
    if (!started) return;
    setProfileVersion((value) => value + 1);
    profileDialog.current?.showModal();
  }
  function openCase(id: CaseId) {
    if (isCaseUnlocked(id, player.completedCases)) setSelectedCase(id);
  }
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => setSelectedCase(null)} aria-label={t.home}>
            <span className="brand-mark"><Icon name="search" size={26} /><span>✦</span></span>
            <span className="brand-title">Math<span> It!</span></span>
          </button>
          <div className="header-doodles" aria-hidden="true">
            <span>+</span><span>×</span><span>=</span><span>✦</span>
          </div>
          <div className="topbar-actions">
            <button className="sound-toggle" data-sound="custom" aria-label={player.soundEnabled ? t.soundOff : t.soundOn} title={player.soundEnabled ? t.soundOff : t.soundOn} aria-pressed={player.soundEnabled} onClick={() => setSoundEnabled(!player.soundEnabled)}>
              <Icon name={player.soundEnabled ? "sound" : "muted"} size={20} /><span>{t.sound}</span>
            </button>
            <div className="language-toggle" role="group" aria-label={t.language}>
              {(["id", "en"] as const).map((language) => (
                <button key={language} onClick={() => setLanguage(language)} aria-pressed={player.language === language} className={player.language === language ? "active" : ""}>{language.toUpperCase()}</button>
              ))}
            </div>
            <button className="profile-button" onClick={openProfile} disabled={!started} aria-label={started ? t.editProfile + ": " + player.name : t.newDetective}>
              <span className="profile-avatar"><Avatar {...player.avatar} /></span>
              {started && <strong>{player.name}</strong>}
            </button>
          </div>
        </div>
      </header>
      {!started ? <StartScreen onStart={() => setSelectedCase(null)} /> : (
        <main className="main-layout">
          <div className="page-heading">
            <div><h1>{t.hello} {player.name}<span className="hello-spark" aria-hidden="true">✦</span></h1><p>{selectedCase === null ? t.chooseCase : t.keepGoing}</p></div>
            <ProgressSummary />
          </div>
          {selectedCase !== null && (
            <nav className="case-navigation" ref={caseNavigation} aria-label={t.caseFiles}>
              <button className="overview-tab" onClick={() => setSelectedCase(null)} aria-label={t.overview}><Icon name="home" size={19} /></button>
              {caseLevels.map((level) => {
                const completed = player.completedCases.includes(level.id);
                const locked = !isCaseUnlocked(level.id, player.completedCases);
                return (
                  <button
                    key={level.id} className={(selectedCase === level.id ? "selected" : "") + (completed ? " completed" : "")}
                    disabled={locked} onClick={() => openCase(level.id)}
                    aria-label={t.case + " " + level.id + ": " + level.title[player.language] + ". " + (locked ? t.locked : completed ? t.completed : t.ready)}
                    aria-current={selectedCase === level.id ? "step" : undefined}
                  >
                    <span>{level.id}</span>
                    {completed && <Icon name="check" size={11} />}
                    {locked && <Icon name="lock" size={10} />}
                  </button>
                );
              })}
            </nav>
          )}
          {selectedCase === null ? <Dashboard openCase={openCase} /> : (
            <GameBoard key={selectedCase} caseId={selectedCase} onNext={() => {
              const next = caseLevels.find((level) => level.id === selectedCase + 1);
              if (next) openCase(next.id);
              else setSelectedCase(null);
            }} />
          )}
        </main>
      )}
      {selectedCase === null && <footer className="site-footer">
        <span><Icon name="sun" size={16} />{t.noTimer}</span>
      </footer>}
      <dialog className="profile-dialog" ref={profileDialog} aria-label={t.editProfile}>
        <button className="dialog-close" aria-label={t.close} onClick={() => profileDialog.current?.close()}><Icon name="close" /></button>
        <DetectiveForm key={profileVersion} editing onDone={() => profileDialog.current?.close()} />
      </dialog>
    </>
  );
}

export default function App() {
  return <GameProvider><MathIt /></GameProvider>;
}
