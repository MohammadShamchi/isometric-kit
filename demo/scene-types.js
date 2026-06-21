/**
 * @typedef {Object} SceneElement
 * @property {string} name
 * @property {string} [state]
 * @property {number} [u]
 * @property {number} [v]
 * @property {number} [z]
 * @property {number} [height]
 */

/**
 * @typedef {Object} Scene
 * @property {string} id
 * @property {string} label
 * @property {string} [subtitle]
 * @property {SceneElement[]} [elements]
 * @property {() => string} render
 */

export {};
