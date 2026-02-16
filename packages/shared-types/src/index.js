/**
 * Shared type definitions and constants for Qwizzeria.
 * Will be expanded with TypeScript types in later phases.
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} qNo
 * @property {string} topic
 * @property {number} points
 * @property {string} question
 * @property {string|null} visual
 * @property {'none'|'video'|'image'} mediaType
 * @property {string|null} embedUrl
 * @property {string} answer
 */

/**
 * @typedef {Object} Topic
 * @property {string} name
 * @property {Question[]} questions
 */

/**
 * @typedef {Object} Participant
 * @property {number} id
 * @property {string} name
 * @property {number} score
 */

export {};
