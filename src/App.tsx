import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { GameProvider, useGame } from "./GameContext";
import GameBoard from "./GameBoard";
import { shellTranslations, translations } from "./i18n";
import { Avatar, BakeryScene, Biscuit, Icon } from "./Illustrations";
import type { AvatarConfig } from "./types";
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
        <span className="eyebrow">{t.yourDetectiveCard}</span>
        <h2>{editing ? t.editProfile : t.makeItOfficial}</h2>
        <p>{t.cardDescription}</p>
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
        <span className="bureau-pill">
          <span />
          {t.bureau}
        </span>
        <h1>
          {t.heroLineOne}
          <br />
          <span>{t.heroLineTwo}</span>
          <svg viewBox="0 0 310 12" aria-hidden="true">
            <path d="M3 8 Q150 -2 305 6" />
          </svg>
        </h1>
        <p className="welcome-description">{t.heroDescription}</p>
        <div className="welcome-perks">
          <span>
            <Icon name="search" size={18} />
            {t.followClues}
          </span>
          <span>
            <Icon name="sparkle" size={18} />
            {t.findYourWay}
          </span>
          <span>
            <Icon name="sun" size={18} />
            {t.noRush}
          </span>
        </div>
        <div className="story-illustration">
          <div className="illustration-label">
            <span className="tiny-dot" />
            {t.firstMystery}
          </div>
          <BakeryScene language={player.language} />
          <span className="scene-caption">{t.bakeryCaption}</span>
          <div className="case-sticker">
            <Icon name="star" size={22} />
            <span>{t.youCanDoThis}</span>
          </div>
        </div>
        <div className="welcome-footnote">
          <span className="mini-icon">
            <Icon name="book" size={18} />
          </span>
          <p>
            <strong>{t.littleLessons}</strong>
            <br />
            {t.learningDescription}
          </p>
        </div>
      </section>
      <section className="onboarding-card">
        <span className="card-pin" />
        <DetectiveForm onDone={onStart} />
      </section>
    </main>
  );
}

function ProgressSidebar() {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const solved = player.completedCases.length;
  return (
    <aside className="progress-sidebar">
      <section className="progress-card">
        <div className="aside-title">
          <Icon name="book" size={17} />
          <h3>{t.yourCasebook}</h3>
        </div>
        <div className="progress-ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="ring-track" cx="50" cy="50" r="42" />
            <circle
              className="ring-fill"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray="263.9"
              strokeDashoffset={263.9 * (1 - solved / 2)}
            />
          </svg>
          <div>
            <strong>
              {solved}
              <span>/2</span>
            </strong>
            <span>{t.casesSolved}</span>
          </div>
        </div>
        <p className="progress-encouragement">
          {solved === 2
            ? t.allSolved
            : solved === 1
              ? t.oneMoreMystery
              : t.everyClueCounts}
        </p>
        <div className="points-row">
          <span>
            <Icon name="star" size={18} />
            {t.detectivePoints}
          </span>
          <strong>{player.score}</strong>
        </div>
      </section>
      <section className="detective-note">
        <span className="note-tape" />
        <div className="note-heading">
          <Avatar {...player.avatar} />
          <span>{t.aLittleReminder}</span>
        </div>
        <p>{t.reminder}</p>
        <span className="note-signature">
          — {t.teamLeksika}
          <span>♡</span>
        </span>
      </section>
      <section className="learning-card">
        <span className="eyebrow">{t.skillsInYourKit}</span>
        <div>
          <span className="skill-icon">
            <Icon name="book" size={18} />
          </span>
          <p>
            <strong>{t.equalSharing}</strong>
            <span>{t.oneClueAtATime}</span>
          </p>
        </div>
        <div>
          <span className="skill-icon yellow">
            <Icon name="sparkle" size={18} />
          </span>
          <p>
            <strong>{t.numberPatterns}</strong>
            <span>{t.connections}</span>
          </p>
        </div>
      </section>
    </aside>
  );
}

function Dashboard({ openCase }: { openCase: (id: 1 | 2) => void }) {
  const { player } = useGame();
  const t = shellTranslations[player.language];
  const next = player.completedCases.includes(1) ? 2 : 1;
  return (
    <section className="dashboard-board">
      <div className="dashboard-feature">
        <div className="feature-copy">
          <span className="eyebrow">{t.yourNextAdventure}</span>
          <h2>
            {player.completedCases.length === 2
              ? t.allSolvedTitle
              : next === 2
                ? t.case2Title
                : t.somethingDoesntAddUp}
          </h2>
          <p>
            {player.completedCases.length === 2
              ? t.allSolvedDetail
              : next === 2
                ? translations[player.language].board.mission2
                : t.adventureDetail}
          </p>
          <button className="primary-button" onClick={() => openCase(next)}>
            {player.completedCases.length === 2 ? t.revisitCase : t.openCase}
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <BakeryScene language={player.language} />
      </div>
      <div className="case-files-heading">
        <h3>{t.caseFiles}</h3>
        <span>{t.twoLittleMysteries}</span>
      </div>
      <div className="case-file-grid">
        {([1, 2] as const).map((id) => {
          const locked = id === 2 && !player.completedCases.includes(1);
          const completed = player.completedCases.includes(id);
          return (
            <button
              className={`case-file ${locked ? "locked" : ""}`}
              key={id}
              disabled={locked}
              onClick={() => openCase(id)}
            >
              <div className={`file-art file-art-${id}`}>
                {id === 1 ? (
                  <>
                    <Biscuit />
                    <Biscuit />
                    <Biscuit />
                  </>
                ) : (
                  <>
                    <span className="number-paper">3</span>
                    <span className="number-paper">12</span>
                    <span className="number-paper">4</span>
                  </>
                )}
                <span className="file-status">
                  {completed ? (
                    <Icon name="check" size={16} />
                  ) : locked ? (
                    <Icon name="lock" size={16} />
                  ) : (
                    <Icon name="arrow" size={16} />
                  )}
                </span>
              </div>
              <div className="file-copy">
                <span className="eyebrow">
                  {t.case} 0{id} · {id === 1 ? t.division : t.multiples}
                </span>
                <h3>{id === 1 ? t.case1Title : t.case2Title}</h3>
                <p>
                  {locked
                    ? t.unlockAfterFirst
                    : completed
                      ? t.solvedReplay
                      : t.readyForYou}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="dashboard-bottom">
        <Icon name="sun" size={18} />
        <span>{t.noTimer}</span>
        <span className="handwritten">{t.curiosityWelcome}</span>
      </div>
    </section>
  );
}

function MathIt() {
  const { player, setLanguage, setSoundEnabled } = useGame();
  const t = shellTranslations[player.language];
  const [selectedCase, setSelectedCase] = useState<1 | 2 | null>(null);
  const profileDialog = useRef<HTMLDialogElement>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const started = Boolean(player.name);
  function openProfile() {
    if (started) {
      setProfileVersion((value) => value + 1);
      profileDialog.current?.showModal();
    }
  }
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            onClick={() => setSelectedCase(null)}
            aria-label={t.home}
          >
            <span className="brand-mark">
              <Icon name="search" size={27} />
              <span>✦</span>
            </span>
            <span className="brand-title">
              Math<span> It!</span>
              <small>{t.slogan}</small>
            </span>
          </button>
          <div className="topbar-actions">
            <div
              className="language-toggle"
              role="group"
              aria-label={t.language}
            >
              {(["id", "en"] as const).map((language) => (
                <button
                  key={language}
                  onClick={() => setLanguage(language)}
                  aria-pressed={player.language === language}
                  className={player.language === language ? "active" : ""}
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="header-divider" />
            <button
              className="profile-button"
              onClick={openProfile}
              disabled={!started}
              aria-label={started ? t.editProfile : t.newDetective}
            >
              <span className="profile-avatar">
                <Avatar {...player.avatar} />
              </span>
              <span>
                <small>{t.detective}</small>
                <strong>{player.name || t.newDetective}</strong>
              </span>
              {started && <Icon name="chevron" size={17} />}
            </button>
          </div>
        </div>
      </header>
      {!started ? (
        <StartScreen onStart={() => setSelectedCase(null)} />
      ) : (
        <main className="main-layout">
          <div className="page-heading">
            <div>
              <div className="page-eyebrow">
                <span className="tiny-dot" />
                {t.bureau}
                <span>/</span>
                {t.caseBoard}
              </div>
              <h1>
                {t.hello} {player.name}
                <span className="hello-spark">✦</span>
              </h1>
              <p>{t.welcomeBack}</p>
            </div>
            <div className="little-motto">
              <Icon name="shield" size={27} />
              <span>
                {t.goodAtWondering}
                <strong>{t.alreadyADetective}</strong>
              </span>
            </div>
          </div>
          <nav className="case-navigation" aria-label={t.caseFiles}>
            <button
              className={
                selectedCase === null ? "selected overview-tab" : "overview-tab"
              }
              onClick={() => setSelectedCase(null)}
            >
              <Icon name="home" size={18} />
              {t.overview}
            </button>
            {([1, 2] as const).map((id) => (
              <button
                key={id}
                className={selectedCase === id ? "selected" : ""}
                disabled={id === 2 && !player.completedCases.includes(1)}
                onClick={() => setSelectedCase(id)}
              >
                <span className="tab-number">0{id}</span>
                <span>{id === 1 ? t.case1Title : t.case2Title}</span>
                {player.completedCases.includes(id) ? (
                  <Icon name="check" size={15} />
                ) : id === 2 && !player.completedCases.includes(1) ? (
                  <Icon name="lock" size={14} />
                ) : (
                  <span className="tab-ready">{t.ready}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="workspace-layout">
            <div className="workspace-main">
              {selectedCase === null ? (
                <Dashboard openCase={setSelectedCase} />
              ) : (
                <GameBoard
                  key={selectedCase}
                  caseId={selectedCase}
                  onNext={() => setSelectedCase(selectedCase === 1 ? 2 : null)}
                />
              )}
            </div>
            <ProgressSidebar />
          </div>
        </main>
      )}
      <footer className="site-footer">
        <span>
          <Icon name="leaf" size={15} />
          {t.footerNote}
        </span>
        <span className="footer-center">{t.madeForCuriousMinds}</span>
        <button
          className="sound-toggle"
          aria-pressed={player.soundEnabled}
          onClick={() => setSoundEnabled(!player.soundEnabled)}
        >
          <Icon name={player.soundEnabled ? "sound" : "muted"} size={17} />
          {player.soundEnabled ? t.soundOff : t.soundOn}
        </button>
      </footer>
      <dialog
        className="profile-dialog"
        ref={profileDialog}
        aria-label={t.editProfile}
      >
        <button
          className="dialog-close"
          aria-label={t.close}
          onClick={() => profileDialog.current?.close()}
        >
          <Icon name="close" />
        </button>
        <DetectiveForm
          key={profileVersion}
          editing
          onDone={() => profileDialog.current?.close()}
        />
      </dialog>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MathIt />
    </GameProvider>
  );
}
