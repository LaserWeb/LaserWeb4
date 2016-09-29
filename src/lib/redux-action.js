/**
 * Dock actions.
 * @module
 */

 /**
  * Flux standard action.
  * @see {@link https://github.com/acdlite/flux-standard-action|flux-standard-action}.
  * @typedef {Object} module:lib/redux-action~Action
  * @property {String} type Action type (eg.: "ADD_SOMETHING").
  * @property {mixed} [payload] It represents the payload of the action. If the payload is an instance of Error the error property is set to true.
  * @property {mixed} [meta] It is intended for any extra information.
  * @property {Boolean} [error] True if an error occured. If true the payload must be an Error instance.
  */

 /**
  * Create and return an action creator.
  * @function
  * @param {String} type Action type (eg.: "ADD_SOMETHING").
  * @param {...String} [argsNames] Action creator arguments names.
  * @return {module:lib/redux-action~ActionCreator} Action creator.
  */
function actionCreatorFactory(type, ...argsNames) {
    /**
     * Create and return an action.
     * @typedef {Function} module:lib/redux-action~ActionCreator
     * @param {...args} [args] Action arguments (to map with argsNames).
     * @return {module:lib/redux-action~Action} The created action.
     */
    let actionCreator = function(...args) {
        let meta = undefined
        let error = undefined
        let payload = undefined

        if (args.length && args[0] instanceof Error) {
            meta = args.splice(1, args.length - 1)
            payload = args[0]
            error = true
        }
        else {
            if (! argsNames.length) {
                payload = args.length ? args.shift() : payload
            }

            meta = args.splice(argsNames.length, args.length - argsNames.length)
            payload = args.length ? {} : payload
        }

        if (meta.length === 0) {
            meta = undefined
        }
        else if (meta.length === 1) {
            meta = meta[0]
        }

        let action = { type, payload, error, meta }

        if (payload !== undefined && argsNames.length) {
            argsNames.forEach((arg, index) => {
                action.payload[argsNames[index]] = args[index]
            })
        }

        return action
    }

    actionCreator.TYPE = type

    return actionCreator
}

// Exports
export default actionCreatorFactory
