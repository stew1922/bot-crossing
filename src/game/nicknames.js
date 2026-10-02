/**
 * Nicknames: what you call a bot, as opposed to what its harness titled the thread.
 *
 * Kept in the colony file as `{ threadId: name }` and laid over the scan on the way in, so every
 * place that shows a title — the card, the list, the toasts — shows the nickname without knowing
 * it exists. The harness's own title rides along as `realTitle`, and clearing a nickname brings
 * it straight back. Nothing here is ever written to the harness.
 *
 * Pure and shared: the page uses it to apply and edit, the server to clean what it is sent.
 */

export const NICKNAME_MAX = 60

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]+/g

/** A display-safe name: control characters become spaces, runs of space collapse, capped. */
function cleanName(value) {
  if (typeof value !== 'string') return ''
  return value.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, NICKNAME_MAX).trim()
}

/** Only `string id → non-empty string` survives; anything else from disk or the wire is dropped. */
export function cleanNicknames(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [id, value] of Object.entries(raw)) {
    const name = cleanName(value)
    if (id && name) out[id] = name
  }
  return out
}

/** A new map with `id` renamed — or un-renamed, when the name comes out empty. */
export function setNickname(nicknames, id, value) {
  const { [id]: _previous, ...rest } = cleanNicknames(nicknames)
  const name = cleanName(value)
  return name ? { ...rest, [id]: name } : rest
}

/**
 * Threads with nicknames laid over their titles.
 *
 * Safe to run on a list it has already been run on — the page re-applies its cached threads after
 * a local change — so the real title is always read from `realTitle` when there is one, and a
 * thread whose nickname was cleared gets its real title back. Threads never nicknamed are
 * returned as they were.
 */
export function applyNicknames(threads, nicknames) {
  const names = nicknames || {}
  return threads.map((t) => {
    const name = names[t.id]
    if (name) return { ...t, title: name, realTitle: t.realTitle ?? t.title }
    if (t.realTitle === undefined) return t
    const { realTitle, ...rest } = t
    return { ...rest, title: realTitle }
  })
}
