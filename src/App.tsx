import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { FormEvent } from "react";
import { GameProvider, useGame } from "./GameContext";
import GameBoard from "./GameBoard";
import { shellTranslations } from "./i18n";
import { Avatar, Icon } from "./Illustrations";
import { mascotImages } from "./mascots";
import type { AvatarConfig, CaseId, UnitId } from "./types";
import { caseLevels, caseNumber, getCase, getNextCase, getUnit, isCaseUnlocked, units } from "./gameLogic";
import { getLevel, getLevelProgress } from "./levels";
import UnitIntroduction from "./UnitIntroduction";
import { accessibleRoute, canAccessCase, firstUnitRoute, readRoute, routeHash } from "./navigation";
import type { AppRoute } from "./navigation";
import "./App.css";

function DetectiveForm({
  editing = false,
  onDone,
  onAvatarChange,
}: {
  editing?: boolean;
  onDone: () => void;
  onAvatarChange?: (avatar: AvatarConfig) => void;
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
        <Avatar {...avatar} animate />
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
                onChange={() => {
                  const nextAvatar = { ...avatar, animal };
                  setAvatar(nextAvatar);
                  onAvatarChange?.(nextAvatar);
                }}
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
      <button className="primary-button form-submit" type="submit">
        {editing ? t.saveProfile : player.name ? t.continueInvestigation : t.startInvestigation}
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
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar);
  return (
    <main className="start-layout">
      <section className="welcome-story">
        <span className="bureau-pill"><Icon name="search" size={15} />{t.bureau}</span>
        <h1>{t.heroLineOne}<br /><span>{t.heroLineTwo}</span></h1>
        <p className="welcome-description">{t.heroDescription}</p>
        <div className="welcome-mascot">
          <img
            key={`${selectedAvatar.animal}-${selectedAvatar.color}`}
            className="avatar-pop"
            src={mascotImages[selectedAvatar.animal]}
            alt={t.heroMascotAlt[selectedAvatar.animal]}
            width={1254}
            height={1254}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </section>
      <section className="onboarding-card"><DetectiveForm onDone={onStart} onAvatarChange={setSelectedAvatar} /></section>
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
        <span key={player.xp} className="points-total" aria-label={player.xp + " " + t.detectivePoints}><Icon name="star" size={15} />{player.xp} XP</span>
      </div>
      <LevelCard />
    </div>
  );
}

function LevelCard() {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const { current, next, xpIntoLevel, xpForLevel } = getLevelProgress(player.xp);
  const percent = next ? Math.round((xpIntoLevel / xpForLevel) * 100) : 100;
  return (
    <div className={"level-card level-" + current.level}>
      <span key={current.level} className="level-badge" aria-hidden="true">
        <small>{t.levelShort}</small>{current.level}
      </span>
      <div className="level-copy">
        <strong>
          <span className="sr-only">{t.level} {current.level}: </span>
          {current.title[player.language]}
        </strong>
        <div className="xp-bar" role="progressbar" aria-label={t.detectivePoints}
          aria-valuemin={0} aria-valuemax={next ? xpForLevel : 1} aria-valuenow={next ? xpIntoLevel : 1}
          aria-valuetext={next ? `${xpIntoLevel}/${xpForLevel} XP` : t.topRank}>
          <span style={{ width: percent + "%" }} />
        </div>
        <span className="xp-note">
          {next ? `${next.minXp - player.xp} ${t.xpToLevel} ${next.level}` : t.topRank}
        </span>
      </div>
    </div>
  );
}

function UnitPicker({ unitId, chooseUnit, reviewVideo }: {
  unitId: UnitId; chooseUnit: (id: UnitId) => void; reviewVideo: (id: UnitId) => void;
}) {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  return <nav className="unit-picker" aria-label={t.units}>
    {units.map((option) => <div key={option.id} className={"unit-option unit-" + option.id + (option.id === unitId ? " active" : "")}>
      <button className="unit-select" aria-pressed={option.id === unitId} onClick={() => chooseUnit(option.id)}>
        <span className="unit-number">{t.unit} {option.id}</span>
        <strong>{option.title[player.language]}</strong>
        <span className="unit-progress"><Icon name="check" size={13} />{option.cases.filter((id) => player.completedCases.includes(id)).length}/{option.cases.length}</span>
      </button>
      <span className="unit-video-state"><Icon name={player.unitVideos[option.id]?.completed ? "check" : "lock"} size={13} />
        {player.language === "en" ? (player.unitVideos[option.id]?.completed ? "Introduction complete" : "Watch to unlock") : (player.unitVideos[option.id]?.completed ? "Pengantar selesai" : "Tonton untuk membuka")}
      </span>
      <button className="unit-review" onClick={() => reviewVideo(option.id)} aria-label={`${player.language === "en" ? "Review Video" : "Tonton Lagi"}: ${t.unit} ${option.id}`}>
        <Icon name="youtube" size={16} />{player.language === "en" ? "Review Video" : "Tonton Lagi"}
      </button>
    </div>)}
  </nav>;
}

function Dashboard({ unitId, openCase, reviewVideo }: {
  unitId: UnitId; openCase: (id: CaseId) => void; reviewVideo: (id: UnitId) => void;
}) {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const unit = units.find((candidate) => candidate.id === unitId) ?? units[0];
  const next = getNextCase(player.completedCases, unit.id);
  const nextIndex = next ? unit.cases.indexOf(next.id) : -1;
  const upcoming = next ? unit.cases.slice(nextIndex + 1, nextIndex + 3).map(getCase) : [];
  const completedCases = unit.cases.filter((id) => player.completedCases.includes(id)).map(getCase);
  function caseCard(level: (typeof caseLevels)[number]) {
    const locked = !isCaseUnlocked(level.id, player.completedCases);
    return <button
      className={"case-file pastel-" + (level.id - 1) % 4 + (locked ? " locked" : " completed")}
      key={level.id} disabled={locked} onClick={() => openCase(level.id)}
      aria-label={t.case + " " + caseNumber(level.id) + ": " + level.title[player.language] + ". " + (locked ? t.locked : t.completed)}
    >
      <div className="file-top"><span className="file-number">{String(caseNumber(level.id)).padStart(2, "0")}</span><Icon name={locked ? "lock" : "check"} size={16} /></div>
      <div className="file-symbol" aria-hidden="true">{level.preview}</div>
      <h3>{level.title[player.language]}</h3>
      {locked && <span className="sr-only">{t.lockedAfter}</span>}
    </button>;
  }
  return (
    <section className="dashboard-board">
      <div className="unit-page-heading">
        <div><span className="eyebrow">{t.unit} {unit.id}</span><h2>{unit.title[player.language]}</h2></div>
        <button className="unit-review" onClick={() => reviewVideo(unit.id)}><Icon name="youtube" size={18} />{player.language === "en" ? "Review Video" : "Tonton Lagi"}</button>
      </div>
      <div className="dashboard-feature">
        <div className="feature-copy">
          <span className="eyebrow">{t.unit} {unit.id} · {next ? t.case + " " + String(caseNumber(next.id)).padStart(2, "0") : t.unitDone}</span>
          <h2>{next ? next.title[player.language] : t.allSolvedTitle}</h2>
          <button className="primary-button" onClick={() => openCase(next?.id ?? unit.cases[0])}>
            {next ? t.openCase : t.revisitCase}<Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="feature-art" aria-hidden="true">
          <span className="feature-symbol">{next?.preview ?? "★"}</span>
          <Avatar {...player.avatar} animate />
        </div>
      </div>
      {upcoming.length > 0 && <section className="upcoming-section" aria-labelledby="upcoming-heading">
        <div className="case-files-heading"><h2 id="upcoming-heading">{t.upNext}</h2></div>
        <p className="upcoming-note">{t.unlockMore}</p>
        <div className="case-file-grid upcoming-cases">{upcoming.map(caseCard)}</div>
      </section>}
      {completedCases.length > 0 && <details className="completed-casebook" open={!next}>
        <summary>{t.solvedCases}{" "}<span>{completedCases.length}</span></summary>
        <div className="case-file-grid">{completedCases.map(caseCard)}</div>
      </details>}
    </section>
  );
}

function MathIt() {
  const { player, isSignedIn, logOut, setLanguage, setSoundEnabled } = useGame();
  const t = shellTranslations[player.language];
  const [route, setRoute] = useState<AppRoute>(() => accessibleRoute(readRoute(window.location.hash, firstUnitRoute(player.completedCases).unitId), player));
  const visibleRoute = accessibleRoute(route, player);
  const unitId = visibleRoute.unitId;
  const selectedCase = visibleRoute.kind === "case" ? visibleRoute.caseId : null;
  const caseNavigation = useRef<HTMLElement>(null);
  const profileDialog = useRef<HTMLDialogElement>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const started = isSignedIn;
  useEffect(() => {
    const followLocation = () => setRoute(accessibleRoute(readRoute(window.location.hash, unitId), player));
    window.addEventListener("hashchange", followLocation);
    window.addEventListener("popstate", followLocation);
    return () => {
      window.removeEventListener("hashchange", followLocation);
      window.removeEventListener("popstate", followLocation);
    };
  }, [player, unitId]);
  useEffect(() => {
    window.history.replaceState(null, "", started ? routeHash(route) : "#/");
  }, [route, started]);
  function navigate(next: AppRoute) {
    const allowed = accessibleRoute(next, player);
    if (window.location.hash !== routeHash(allowed)) window.history.pushState(null, "", routeHash(allowed));
    setRoute(allowed);
  }
  const showUnit = (id: UnitId = unitId) => navigate({ kind: "unit", unitId: id });
  const reviewVideo = (id: UnitId) => navigate({ kind: "video", unitId: id });
  // index.html applies the saved theme before first paint; start from what it chose.
  const [theme, setTheme] = useState<"dark" | "light">(() => document.documentElement.dataset.theme === "light" ? "light" : "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#141b2e" : "#f7f2e7");
    try {
      localStorage.setItem("math-it-theme", theme);
    } catch {
      // The theme still switches for this visit when storage is unavailable.
    }
  }, [theme]);
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
  }, [route, selectedCase, started]);
  function openProfile() {
    if (!started) return;
    setProfileVersion((value) => value + 1);
    profileDialog.current?.showModal();
  }
  function handleLogOut() {
    profileDialog.current?.close();
    logOut();
    setRoute(firstUnitRoute(player.completedCases));
  }
  function openCase(id: CaseId) {
    navigate({ kind: "case", caseId: id, unitId: getUnit(id).id });
  }
  const unitCases = units.find((unit) => unit.id === unitId)?.cases ?? [];
  const unitNext = getNextCase(player.completedCases, unitId);
  // Show this unit's solved cases, the current one, and two locked previews.
  const navigationCases = unitNext ? unitCases.slice(0, unitCases.indexOf(unitNext.id) + 3) : unitCases;
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => showUnit()} aria-label={t.home}>
            <img className="brand-logo" src="/math-it-logo.png" alt="Math It — Detektif Matematika" width="1254" height="1254" />
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
            <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t.themeLight : t.themeDark} title={theme === "dark" ? t.themeLight : t.themeDark}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
            </button>
            <button className="profile-button" onClick={openProfile} disabled={!started} aria-label={started ? t.editProfile + ": " + player.name + ", " + t.level + " " + getLevel(player.xp).level : t.newDetective}>
              <span className="profile-avatar-wrap">
                <span className="profile-avatar"><Avatar {...player.avatar} /></span>
                {started && <span key={getLevel(player.xp).level} className="profile-level" aria-hidden="true">{getLevel(player.xp).level}</span>}
              </span>
              {started && <strong>{player.name}</strong>}
            </button>
            {started && (
              <button className="logout-button" onClick={handleLogOut} aria-label={t.logOut} title={t.logOut}>
                <Icon name="logout" size={20} /><span>{t.logOut}</span>
              </button>
            )}
          </div>
        </div>
      </header>
      {!started ? <StartScreen onStart={() => showUnit(firstUnitRoute(player.completedCases).unitId)} /> : (
        <main className="main-layout">
          <div className="page-heading">
            <div><h1>{t.hello} {player.name}<span className="hello-spark" aria-hidden="true">✦</span></h1><p>{selectedCase === null ? t.chooseCase : t.keepGoing}</p></div>
            <ProgressSummary />
          </div>
          {selectedCase === null && <UnitPicker unitId={unitId} chooseUnit={showUnit} reviewVideo={reviewVideo} />}
          {selectedCase !== null && (
            <nav className="case-navigation" ref={caseNavigation} aria-label={t.caseFiles}>
              <button className="overview-tab" onClick={() => showUnit()} aria-label={t.overview}><Icon name="home" size={19} /></button>
              <span className="navigation-unit">{t.unit} {unitId}</span>
              {navigationCases.map(getCase).map((level) => {
                const completed = player.completedCases.includes(level.id);
                const locked = !canAccessCase(level.id, player);
                return (
                  <button
                    key={level.id} className={(selectedCase === level.id ? "selected" : "") + (completed ? " completed" : "")}
                    disabled={locked} onClick={() => openCase(level.id)}
                    aria-label={t.unit + " " + unitId + ", " + t.case + " " + caseNumber(level.id) + ": " + level.title[player.language] + ". " + (locked ? t.locked : completed ? t.completed : t.ready)}
                    aria-current={selectedCase === level.id ? "step" : undefined}
                  >
                    <span>{caseNumber(level.id)}</span>
                    {completed && <Icon name="check" size={11} />}
                    {locked && <Icon name="lock" size={10} />}
                  </button>
                );
              })}
              <button className="case-review-video" onClick={() => reviewVideo(unitId)} aria-label={player.language === "en" ? "Review Video" : "Tonton Lagi"}><Icon name="youtube" size={18} /></button>
            </nav>
          )}
          {visibleRoute.kind === "video" ? <UnitIntroduction key={unitId} unitId={unitId} onStart={() => showUnit()} onBack={() => {
            if (player.unitVideos[unitId]?.completed) showUnit();
            else {
              document.querySelector(".unit-picker")?.scrollIntoView({ block: "start", behavior: "instant" });
              document.querySelector<HTMLButtonElement>(".unit-option.active .unit-select")?.focus({ preventScroll: true });
            }
          }} /> : selectedCase === null ? <Dashboard unitId={unitId} openCase={openCase} reviewVideo={reviewVideo} /> : (
            <GameBoard key={selectedCase} caseId={selectedCase} onNext={() => {
              const next = unitCases[unitCases.indexOf(selectedCase) + 1];
              if (next) openCase(next);
              else showUnit();
            }} />
          )}
        </main>
      )}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-main">
            <div className="footer-about">
              <button className="brand" onClick={() => showUnit()} aria-label={t.home}>
                <img className="brand-logo" src="/math-it-logo.png" alt="Math It — Detektif Matematika" width="1254" height="1254" />
              </button>
              <p>{t.footerTagline}</p>
            </div>
            <section className="footer-connect" aria-labelledby="footer-connect-title">
              <div className="footer-connect-heading"><h2 id="footer-connect-title">{t.stayConnected}</h2><span>{t.comingSoon}</span></div>
              {/* Wrap these icons in links when the official destinations are ready. */}
              <ul className="footer-socials">
                <li><span role="img" aria-label="Instagram" title="Instagram"><Icon name="instagram" size={24} /></span></li>
                <li><span role="img" aria-label="YouTube" title="YouTube"><Icon name="youtube" size={24} /></span></li>
                <li><span role="img" aria-label="Email" title="Email"><Icon name="email" size={24} /></span></li>
              </ul>
            </section>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Math It!</span>
            <span className="footer-calm"><Icon name="sun" size={16} />{t.noTimer}</span>
          </div>
        </div>
      </footer>
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
