import { useState, type ReactNode } from 'react'
import { useGame } from './GameContext'
import { translations } from './i18n'
import { getDashboardCase } from './gameLogic'
import { dashboardRows, filterDimension, niceScale, reviewDashboard, type DashboardReview, type DashboardRow } from './dashboard'
import type { CaseId, DashboardSettings, DashboardSpec, DashboardTool, Language } from './types'
import { Icon, type IconName } from './Illustrations'
import { CaseBriefing, HintFooter, SolvedFeedback } from './CaseParts'
import { useCaseSolve } from './useCaseSolve'

function ToolControl({ tool, name, icon, label, help, options, value, reviewLabel, disabled, onChange }: {
  tool: DashboardTool; name: string; icon: IconName; label: string; help: string; options: { value: string; label: string }[];
  value: string; reviewLabel?: string; disabled: boolean; onChange: (value: string) => void;
}) {
  return <fieldset className={`dashboard-tool tool-${tool}${reviewLabel ? ' needs-review' : ''}`} disabled={disabled}>
    <legend><Icon name={icon} size={16} />{label}</legend>
    {reviewLabel && <span className="zone-review"><Icon name="search" size={14} />{reviewLabel}</span>}
    <p className="tool-help">{help}</p>
    <div className="tool-options">
      {options.map((option) => <label key={option.value} className={`tool-option${value === option.value ? ' chosen' : ''}`}>
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span>{option.label}</span>
      </label>)}
    </div>
  </fieldset>
}

function BarView({ spec, rows, answer, language, reviewLabel, disabled, onPick }: {
  spec: DashboardSpec; rows: DashboardRow[]; answer: string | null; language: Language;
  reviewLabel?: string; disabled: boolean; onPick: (key: string) => void;
}) {
  const scale = niceScale(Math.max(...rows.map((row) => row.value)))
  const ticks = Array.from({ length: scale.max / scale.step + 1 }, (_, index) => index * scale.step)
  const at = (value: number) => `${(value / scale.max) * 100}%`
  return <div className={`dashboard-chart${reviewLabel ? ' needs-review' : ''}`}>
    {reviewLabel && <span className="zone-review"><Icon name="search" size={14} />{reviewLabel}</span>}
    <span className="dashboard-axis">{spec.measure[language]}</span>
    <div className="dashboard-plot">
      {/* Values stay unlabelled on the bars: reading them from the scale is the skill. */}
      <div className="dashboard-scale" aria-hidden="true">
        {ticks.map((tick) => <span key={tick} style={{ left: at(tick) }}>{tick}</span>)}
      </div>
      <div className="dashboard-gridlines" aria-hidden="true">
        {ticks.map((tick) => <span key={tick} className={tick === 0 ? 'is-baseline' : ''} style={{ left: at(tick) }} />)}
      </div>
      <ul className="dashboard-bars">
        {rows.map((row) => <li key={row.key}>
          <button type="button" data-sound="custom" className={`dashboard-bar${answer === row.key ? ' is-chosen' : ''}`}
            aria-pressed={answer === row.key} disabled={disabled} onClick={() => onPick(row.key)}
            aria-label={`${row.label[language]}, ${row.value} ${spec.measure[language]}`}>
            <span className="bar-label">{answer === row.key && <Icon name="check" size={14} />}{row.label[language]}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: at(row.value) }} /></span>
          </button>
        </li>)}
      </ul>
    </div>
  </div>
}

function TableView({ spec, settings, rows, answer, language, reviewLabel, disabled, onPick }: {
  spec: DashboardSpec; settings: DashboardSettings; rows: DashboardRow[]; answer: string | null; language: Language;
  reviewLabel?: string; disabled: boolean; onPick: (key: string) => void;
}) {
  return <div className={`dashboard-table-wrap${reviewLabel ? ' needs-review' : ''}`}>
    {reviewLabel && <span className="zone-review"><Icon name="search" size={14} />{reviewLabel}</span>}
    <table className="dashboard-table">
      <caption className="sr-only">{spec.title[language]}</caption>
      <thead><tr><th scope="col">{spec.dimensions[settings.groupBy].label[language]}</th><th scope="col">{spec.measure[language]}</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.key} className={answer === row.key ? 'is-chosen' : ''}>
        <th scope="row"><button type="button" data-sound="custom" aria-pressed={answer === row.key} disabled={disabled} onClick={() => onPick(row.key)}>
          {answer === row.key && <Icon name="check" size={14} />}{row.label[language]}
        </button></th>
        <td>{row.value}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

export default function DashboardBoard({ caseId, onNext }: { caseId: CaseId; onNext: () => void }) {
  const { player, playSound } = useGame()
  const language = player.language
  const t = translations[language].board
  const spec = getDashboardCase(caseId).dashboard
  const [settings, setSettings] = useState<DashboardSettings>(spec.start)
  const [answer, setAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<DashboardReview | 'solved' | null>(null)
  const { earnedPoints, newLevel, solve } = useCaseSolve(caseId)
  const solved = feedback === 'solved'
  const review = feedback && feedback !== 'solved' ? feedback : null
  const rows = dashboardRows(spec, settings)
  const bars = spec.dimensions[settings.groupBy]
  const other = spec.dimensions[filterDimension(settings.groupBy)]
  const chosen = rows.find((row) => row.key === answer)
  const sortLabels = { none: t.sortNone, desc: t.sortDesc, asc: t.sortAsc }
  const toolNames: Record<DashboardTool, string> = { groupBy: t.toolGroupBy, filter: t.toolFilter, sort: t.toolSort, view: t.toolView }
  const filterLabel = settings.filter === 'all' ? t.filterAll
    : other.categories.find((category) => category.key === settings.filter)?.label[language] ?? t.filterAll
  // The chart is flagged only once every tool fits, so a wrong bar is never blamed on a tool.
  const chartReview = review && !review.tools.length && review.answer === 'wrong' ? t.lookAgain : undefined

  function change(next: Partial<DashboardSettings>) {
    const updated = { ...settings, ...next }
    // Bars that stand for something new need a fresh filter and a fresh answer.
    if (next.groupBy !== undefined && next.groupBy !== settings.groupBy) {
      updated.filter = 'all'
      setAnswer(null)
    }
    setSettings(updated)
    setFeedback(null)
  }

  function pick(key: string) {
    setAnswer(key)
    setFeedback(null)
    playSound('drop')
  }

  function reset() {
    setSettings(spec.start)
    setAnswer(null)
    setFeedback(null)
  }

  function check() {
    const result = reviewDashboard(spec, settings, answer)
    if (!result.tools.length && result.answer === 'right') {
      solve()
      setFeedback('solved')
    } else {
      setFeedback(result)
      playSound('click')
    }
  }

  const controls: Record<DashboardTool, () => ReactNode> = {
    groupBy: () => <ToolControl key="groupBy" tool="groupBy" name={`group-${caseId}`} icon="bars" label={t.toolGroupBy} help={t.toolGroupByHelp}
      options={spec.dimensions.map((dimension, index) => ({ value: String(index), label: dimension.label[language] }))}
      value={String(settings.groupBy)} disabled={solved} reviewLabel={review?.tools.includes('groupBy') ? t.lookAgain : undefined}
      onChange={(value) => change({ groupBy: value === '1' ? 1 : 0 })} />,
    filter: () => <ToolControl key="filter" tool="filter" name={`filter-${caseId}`} icon="filter" label={t.toolFilter} help={t.toolFilterHelp}
      options={[{ value: 'all', label: t.filterAll }, ...other.categories.map((category) => ({ value: category.key, label: category.label[language] }))]}
      value={settings.filter} disabled={solved} reviewLabel={review?.tools.includes('filter') ? t.lookAgain : undefined}
      onChange={(value) => change({ filter: value })} />,
    sort: () => <ToolControl key="sort" tool="sort" name={`sort-${caseId}`} icon="sort" label={t.toolSort} help={t.toolSortHelp}
      options={(['none', 'desc', 'asc'] as const).map((order) => ({ value: order, label: sortLabels[order] }))}
      value={settings.sort} disabled={solved} reviewLabel={review?.tools.includes('sort') ? t.lookAgain : undefined}
      onChange={(value) => change({ sort: value as DashboardSettings['sort'] })} />,
    view: () => <ToolControl key="view" tool="view" name={`view-${caseId}`} icon="table" label={t.toolView} help={t.toolViewHelp}
      options={[{ value: 'chart', label: t.viewChart }, { value: 'table', label: t.viewTable }]}
      value={settings.view} disabled={solved} onChange={(value) => change({ view: value === 'table' ? 'table' : 'chart' })} />,
  }

  return <article className={`game-board dashboard-board${solved ? ' is-solved' : ''}`}>
    <CaseBriefing caseId={caseId} />

    <div className="board-workspace">
      <div className="workspace-intro"><Icon name="hand" size={18} /><p>{t.dashboardHelp}</p></div>

      <div className="dashboard">
        <section className="dashboard-tools" aria-label={t.tools}>
          {spec.tools.map((tool) => controls[tool]())}
        </section>

        <section className="dashboard-panel" aria-labelledby={`dashboard-title-${caseId}`}>
          <div className="dashboard-head">
            <h3 id={`dashboard-title-${caseId}`}>{spec.title[language]}</h3>
            <p className="dashboard-showing" aria-live="polite">
              <span>{t.showing}:</span>
              <span className="showing-chip"><Icon name="bars" size={13} />{bars.label[language]}</span>
              <span className="showing-chip"><Icon name="filter" size={13} />{filterLabel}</span>
              {spec.tools.includes('sort') && <span className="showing-chip"><Icon name="sort" size={13} />{sortLabels[settings.sort]}</span>}
            </p>
          </div>
          {settings.view === 'table'
            ? <TableView spec={spec} settings={settings} rows={rows} answer={answer} language={language} reviewLabel={chartReview} disabled={solved} onPick={pick} />
            : <BarView spec={spec} rows={rows} answer={answer} language={language} reviewLabel={chartReview} disabled={solved} onPick={pick} />}
          <p className={`dashboard-answer${chosen ? ' has-answer' : ''}`} aria-live="polite">
            {chosen ? <><span>{t.yourAnswer}:</span> <strong>{chosen.label[language]}</strong></> : settings.view === 'table' ? t.chooseRow : t.chooseAnswer}
          </p>
        </section>
      </div>

      {feedback && <div className={`feedback-panel feedback-${solved ? 'solved' : 'retry'}`} role="status" aria-live="polite">
        {review ? <><Icon name="search" /><p>
          {review.tools.length > 0 && <span>{t.checkTools} {review.tools.map((tool) => toolNames[tool]).join(', ')}. </span>}
          {review.answer === 'missing' && <span>{settings.view === 'table' ? t.needRow : t.needAnswer}</span>}
          {!review.tools.length && review.answer === 'wrong' && t.toolsRight}
        </p></> : <SolvedFeedback caseId={caseId} earnedPoints={earnedPoints} newLevel={newLevel} onNext={onNext} />}
      </div>}

      <div className="board-toolbar"><div className="history-actions">
        <button className="subtle-button" onClick={reset}><Icon name="reset" size={18} />{solved ? t.playAgain : t.reset}</button>
      </div><button className="primary-button check-button" data-sound="custom" onClick={check} disabled={solved}><Icon name="check" size={18} />{t.checkEvidence}</button></div>
    </div>

    <HintFooter caseId={caseId} />
  </article>
}
