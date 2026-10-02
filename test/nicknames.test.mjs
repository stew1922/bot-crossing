/**
 * Nicknames: a name the colony gives a bot, kept in data/colony.json and never written back to
 * the harness. The thread's own title stays underneath, so clearing a nickname restores it.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { applyNicknames, cleanNicknames, NICKNAME_MAX, setNickname } from '../src/game/nicknames.js'
import { mergeState } from '../src/game/merge-state.js'
import { withServer } from './support/with-server.mjs'

const thread = (id, title) => ({ id, title, lastActivityAt: 1 })

test('a nickname replaces the title and keeps the real one alongside', () => {
  const [t] = applyNicknames([thread('a', 'Research Analyst')], { a: 'Desk analyst' })
  assert.equal(t.title, 'Desk analyst')
  assert.equal(t.realTitle, 'Research Analyst')
})

test('a thread with no nickname is handed back untouched', () => {
  const original = thread('a', 'Etsy')
  const [t] = applyNicknames([original], { b: 'Other' })
  assert.equal(t, original)
})

test('applying twice is harmless, and clearing restores the real title from an already-named list', () => {
  const named = applyNicknames(applyNicknames([thread('a', 'Research Analyst')], { a: 'One' }), { a: 'Two' })
  assert.equal(named[0].title, 'Two')
  assert.equal(named[0].realTitle, 'Research Analyst')
  const [cleared] = applyNicknames(named, {})
  assert.equal(cleared.title, 'Research Analyst')
  assert.equal('realTitle' in cleared, false)
})

test('setting a nickname returns a new map and leaves the old one alone', () => {
  const before = { a: 'One' }
  const after = setNickname(before, 'b', '  Two  ')
  assert.deepEqual(after, { a: 'One', b: 'Two' })
  assert.deepEqual(before, { a: 'One' })
})

test('an empty nickname clears it, which brings the real title back', () => {
  assert.deepEqual(setNickname({ a: 'One', b: 'Two' }, 'a', '   '), { b: 'Two' })
})

test('a nickname is trimmed to a sensible length and loses control characters', () => {
  const long = setNickname({}, 'a', `x${'y'.repeat(200)}`)
  assert.equal(long.a.length, NICKNAME_MAX)
  assert.equal(setNickname({}, 'a', 'tab\there\nnewline').a, 'tab here newline')
})

test('cleanNicknames keeps only string → non-empty string pairs', () => {
  assert.deepEqual(cleanNicknames({ a: 'ok', b: '', c: 5, d: null, e: ['x'] }), { a: 'ok' })
  assert.deepEqual(cleanNicknames(null), {})
  assert.deepEqual(cleanNicknames(['a']), {})
})

test('nicknames from two tabs both survive a merge, and a cleared one stays cleared', () => {
  const merged = mergeState(
    { nicknames: { a: 'Old' } },
    { nicknames: { b: 'Mine' } },
    { nicknames: { a: 'Old', c: 'Theirs' } }
  )
  assert.deepEqual(merged.nicknames, { b: 'Mine', c: 'Theirs' })
})

test('the server keeps nicknames, cleaned, across a save and a read', async () => {
  await withServer(async ({ call, put }) => {
    const saved = await (await put({ nicknames: { 'claude-code:x': '  Etsy shop  ', bad: 7 } })).json()
    assert.deepEqual(saved.nicknames, { 'claude-code:x': 'Etsy shop' })
    const read = await (await call('/api/state')).json()
    assert.deepEqual(read.nicknames, { 'claude-code:x': 'Etsy shop' })
  })
})
