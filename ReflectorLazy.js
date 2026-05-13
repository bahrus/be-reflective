// @ts-check
/** @import {ReflectorProps, FeatureSpawnContext} from './types/be-reflective/types' */

/**
 * ReflectorLazy is a lightweight wrapper that checks whether --custom-state-exports
 * is declared in CSS before loading the full Reflector implementation.
 * 
 * If no rules are present, the feature stays inert with zero overhead.
 * Once rules are detected, it dynamically imports and delegates to the full Reflector.
 * 
 * Activation is driven by `callbackForwarding: ['connectedCallback', 'disconnectedCallback']`.
 * The feature is spawned on first connectedCallback (via the lazy getter).
 * It checks for CSS rules and only loads the full Reflector if needed.
 */
class ReflectorLazy {
    /** @type {WeakRef<HTMLElement> | undefined} */
    #hostRef;

    /** @type {FeatureSpawnContext | undefined} */
    #ctx;

    /** @type {import('./Reflector.js').Reflector | null} */
    #delegate = null;

    /** @type {boolean} */
    #hasDisconnected = false;

    /**
     * @param {HTMLElement} hostElement
     * @param {FeatureSpawnContext} ctx
     * @param {Partial<ReflectorProps>} [initVals]
     */
    constructor(hostElement, ctx, initVals) {
        this.#hostRef = new WeakRef(hostElement);
        this.#ctx = ctx;
        if (initVals) {
            Object.assign(this, initVals);
        }
        // Self-activate on construction since we're spawned during connectedCallback
        this.#maybeActivate();
    }

    /**
     * Called by callbackForwarding on subsequent connections (after disconnect).
     */
    connectedCallback() {
        if (this.#hasDisconnected) {
            this.#hasDisconnected = false;
            if (this.#delegate) {
                this.#delegate.connectedCallback();
            } else {
                // Delegate wasn't loaded yet on first connect, try again
                this.#maybeActivate();
            }
        }
    }

    /**
     * Called by callbackForwarding when the host is disconnected.
     */
    disconnectedCallback() {
        this.#hasDisconnected = true;
        if (this.#delegate) {
            this.#delegate.disconnectedCallback();
        }
    }

    async #maybeActivate() {
        const host = this.#hostRef?.deref();
        if (!host) return;

        const computed = getComputedStyle(host);
        const raw = computed.getPropertyValue('--custom-state-exports').trim();
        if (!raw) return;

        // Rules exist — load the full implementation
        const { Reflector } = await import('./Reflector.js');
        this.#delegate = new Reflector(host, /** @type {FeatureSpawnContext} */ (this.#ctx));
    }
}

export { ReflectorLazy };
