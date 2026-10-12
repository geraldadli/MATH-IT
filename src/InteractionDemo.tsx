import { useEffect, useRef, useState } from 'react'
import { Icon } from './Illustrations'
import { translations } from './i18n'
import type { Language } from './types'

const SEEN_KEY = 'math-it-interaction-demo-seen'

export default function InteractionDemo({ autoShow, language }: { autoShow: boolean; language: Language }) {
  const t = translations[language].board
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [mode, setMode] = useState<'drag' | 'tap'>('drag')
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    if (!autoShow) return
    try {
      if (localStorage.getItem(SEEN_KEY) === 'true') return
    } catch { /* The demo still works when storage is unavailable. */ }
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [autoShow])

  function close() {
    try { localStorage.setItem(SEEN_KEY, 'true') } catch { /* Keep play available. */ }
    trigger.current?.focus({ preventScroll: true })
  }

  return <>
    <button ref={trigger} className="demo-trigger" onClick={() => { setReplay((value) => value + 1); dialog.current?.showModal() }}>
      <Icon name="help" size={17} />{t.howToMove}
    </button>
    <dialog ref={dialog} className="interaction-demo" aria-labelledby="demo-title" onClose={close}>
      <button className="dialog-close" aria-label={t.closeDemo} onClick={() => dialog.current?.close()}><Icon name="close" /></button>
      <h2 id="demo-title">{t.howToMove}</h2>
      <div className="demo-options" role="group" aria-label={t.chooseMove}>
        {(['drag', 'tap'] as const).map((option) => <button key={option} aria-pressed={mode === option} onClick={() => { setMode(option); setReplay((value) => value + 1) }}>{option === 'drag' ? t.demoDrag : t.demoTap}</button>)}
      </div>
      <p id="demo-description" aria-live="polite">{mode === 'drag' ? t.demoDragHelp : t.demoTapHelp}</p>
      {/* The tray, arrow, group, and tap rings follow the theme; the clue and pointer keep their own colours. */}
      <svg key={`${mode}-${replay}`} className={`demo-stage demo-${mode}`} viewBox="0 0 300 132" role="img" aria-labelledby="demo-description">
        <rect x="12" y="22" width="88" height="88" rx="17" style={{ fill: 'var(--c-f3f5fc)', stroke: 'var(--c-c7d4e9)' }} strokeDasharray="5 4" />
        <path d="M121 66h53m-8-7 8 7-8 7" fill="none" style={{ stroke: 'var(--c-8caad0)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect className="demo-destination" x="200" y="22" width="88" height="88" rx="17" style={{ fill: 'var(--mint)', stroke: 'var(--c-a9cbbb)' }} strokeWidth="2" />
        <g className="demo-clue">
          <rect x="32" y="42" width="48" height="48" rx="12" fill="#f7dfaa" stroke="#b49962" strokeWidth="2" />
          <path d="m56 52 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#fff8e8" stroke="#b49962" strokeLinejoin="round" />
        </g>
        <circle className="demo-tap-first" cx="56" cy="66" r="30" fill="none" style={{ stroke: 'var(--blue)' }} strokeWidth="3" />
        <circle className="demo-tap-second" cx="244" cy="66" r="30" fill="none" style={{ stroke: 'var(--blue)' }} strokeWidth="3" />
        <g className="demo-pointer"><path d="m66 78 0 20 5-5 5 9 4-2-5-9 8 0Z" fill="#8eafd7" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></g>
      </svg>
      <div className="demo-labels" aria-hidden="true"><span>{t.clue}</span><span>{t.demoGroup}</span></div>
      <div className="demo-actions">
        <button className="subtle-button" onClick={() => setReplay((value) => value + 1)}><Icon name="reset" size={17} />{t.watchAgain}</button>
        <button className="primary-button" onClick={() => dialog.current?.close()}>{t.closeHint}<Icon name="arrow" size={17} /></button>
      </div>
    </dialog>
  </>
}
