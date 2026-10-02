/**
 * How loud each bus should be, decided from settings alone.
 *
 * Three buses feed the master: ambience (beds and the world's own calls), effects (work you can
 * hear, drones, the bots' chatter) and alerts. Alerts is its own bus because it is the one sound
 * that carries information — a bot is waiting on you — so it must survive every other fader
 * being pulled down. `alertsOnly` is that wish as a single switch: the colony goes quiet except
 * for the chime.
 *
 * Pure, so the mixer and the tests read the same rule.
 */

export const BUS_DEFAULTS = Object.freeze({ ambienceVolume: 0.8, effectsVolume: 0.8, alertsVolume: 0.8 })

/** The sounds that ride the alerts bus. Everything else is ambience or effects. */
const ALERTS = new Set(['chime-attention'])

export const isAlert = (name) => ALERTS.has(name)

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

const volume = (read, key) => {
  const v = read(key)
  return typeof v === 'number' && Number.isFinite(v) ? clamp01(v) : BUS_DEFAULTS[key]
}

/** `read(key)` → the raw setting. Returns `{ ambience, effects, alerts }`, each 0–1. */
export function busLevels(read) {
  const alertsOnly = Boolean(read('alertsOnly'))
  return {
    ambience: alertsOnly ? 0 : volume(read, 'ambienceVolume'),
    effects: alertsOnly ? 0 : volume(read, 'effectsVolume'),
    alerts: volume(read, 'alertsVolume'),
  }
}
