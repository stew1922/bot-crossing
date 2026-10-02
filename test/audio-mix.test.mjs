/**
 * The bus levels the mixer applies, from settings alone. Pure, so it runs without Web Audio.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { busLevels, isAlert } from '../src/audio/mix.js'

const from = (values) => (key) => values[key]

test('each bus follows its own fader', () => {
  assert.deepEqual(busLevels(from({ ambienceVolume: 0.3, effectsVolume: 0.5, alertsVolume: 0.7 })), {
    ambience: 0.3,
    effects: 0.5,
    alerts: 0.7,
  })
})

test('alerts only silences ambience and effects but leaves the alert fader alone', () => {
  const levels = busLevels(from({ alertsOnly: true, ambienceVolume: 0.8, effectsVolume: 0.8, alertsVolume: 0.6 }))
  assert.deepEqual(levels, { ambience: 0, effects: 0, alerts: 0.6 })
})

test('missing or junk values fall back to defaults and are clamped', () => {
  assert.deepEqual(busLevels(from({})), { ambience: 0.8, effects: 0.8, alerts: 0.8 })
  assert.deepEqual(busLevels(from({ ambienceVolume: 'loud', effectsVolume: 4, alertsVolume: -1 })), {
    ambience: 0.8,
    effects: 1,
    alerts: 0,
  })
})

test('turning the effects fader down no longer takes the chime with it', () => {
  assert.equal(busLevels(from({ effectsVolume: 0 })).alerts, 0.8)
})

test('only the attention chime counts as an alert', () => {
  assert.equal(isAlert('chime-attention'), true)
  for (const name of ['work-hammer', 'select-1', 'drone-drop', 'surf']) assert.equal(isAlert(name), false)
})
