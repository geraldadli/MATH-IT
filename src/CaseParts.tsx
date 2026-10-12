import { useRef, useState, type CSSProperties } from 'react'
import { useGame } from './GameContext'
import { translations } from './i18n'
import { caseLevels, caseNumber, getCase, getUnit } from './gameLogic'
import type { CaseId } from './types'
import { Icon } from './Illustrations'
import type { DetectiveLevel } from './levels'

// Pieces every case shares, whether it is played with clues or with a dashboard.

export function CaseBriefing({ caseId }: { caseId: CaseId }) {
  const { player } = useGame()
  const language = player.language
  const t = translations[language].board
  const level = getCase(caseId)
  return <header className="case-briefing">
    <div className="case-eyebrow"><span className="case-number">{t.unit} {getUnit(caseId).id} · {t.case} {String(caseNumber(caseId)).padStart(2, '0')}</span>{level.skill[language]}</div>
    <h2>{level.title[language]}</h2>
    <p className="mission-copy">{level.mission[language]}</p>
  </header>
}

export function SolvedFeedback({ caseId, earnedPoints, newLevel, onNext }: {
  caseId: CaseId; earnedPoints: boolean; newLevel: DetectiveLevel | null; onNext: () => void;
}) {
  const { player } = useGame()
  const language = player.language
  const t = translations[language].board
  const unit = getUnit(caseId)
  const lastInUnit = unit.cases[unit.cases.length - 1] === caseId
  return <>
    <div className="success-reward">
      <div className="celebration-burst" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--i': index } as CSSProperties} />)}</div>
      <span className="reward-badge" aria-label={earnedPoints ? t.solvedDetail : undefined}>
        <Icon name="star" size={22} />{earnedPoints && <strong aria-hidden="true">+100</strong>}
      </span>
      {earnedPoints && <span className="points-float" aria-hidden="true">+100 XP</span>}
    </div>
    <div className="success-copy"><strong>{t.solved}</strong>
      {newLevel && <span className="level-up" key={newLevel.level}>
        <span className="level-up-badge" aria-hidden="true">{newLevel.level}</span>
        <span><strong>{t.levelUp}</strong> {t.newRank}: {newLevel.title[language]}<span className="sr-only"> ({t.level} {newLevel.level})</span></span>
      </span>}
      <p>{!earnedPoints ? t.solvedAgain : !lastInUnit ? t.nextUnlocked
        : caseLevels.every(({ id }) => player.completedCases.includes(id)) ? t.casebookComplete : t.unitComplete}</p></div>
    <button className="text-button" onClick={onNext}>{lastInUnit ? t.allSolved : t.nextCase} <span aria-hidden="true">→</span></button>
  </>
}

export function HintFooter({ caseId }: { caseId: CaseId }) {
  const { player, playSound } = useGame()
  const language = player.language
  const t = translations[language].board
  const { hints } = getCase(caseId)
  const [hintStep, setHintStep] = useState(0)
  const hint = useRef<HTMLDialogElement>(null)
  return <>
    <footer className="board-footer"><button className="hint-button" data-sound="custom" onClick={() => { setHintStep(0); hint.current?.showModal(); playSound('hint') }}><Icon name="help" size={18} />{t.needHint}</button><span className="calm-indicator"><Icon name="sun" size={18} />{t.noTimer}</span></footer>

    <dialog ref={hint} className="hint-dialog" aria-labelledby="hint-heading">
      <button className="dialog-close" aria-label={t.closeDialog} onClick={() => hint.current?.close()}><Icon name="close" /></button>
      <h2 id="hint-heading">{t.hintTitle}</h2>
      <div className="hint-prompt" aria-live="polite" aria-atomic="true">
        <span className="hint-progress">{t.needHint} {hintStep + 1} / {hints.length}</span>
        <p>{hints[hintStep].text[language]}</p>
        <div className="hint-equation">{hints[hintStep].visual}</div>
      </div>
      <div className="hint-navigation">
        <button className="subtle-button" disabled={hintStep === 0} onClick={() => setHintStep(hintStep - 1)}>{t.previousHint}</button>
        <button className="subtle-button" disabled={hintStep === hints.length - 1} onClick={() => setHintStep(hintStep + 1)}>{t.nextHint}<Icon name="arrow" size={16} /></button>
      </div>
      <button className="primary-button" onClick={() => hint.current?.close()}>{t.closeHint}</button>
    </dialog>
  </>
}
