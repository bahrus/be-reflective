// @ts-check
/** @import {ReflectorProps, FeatureSpawnContext} from './types/be-reflective/types' */

/**
 * ReflectorLazy is a lightweight wrapper that checks whether --custom-state-exports
 * is declared in CSS before loading the full Reflector implementation.
 * 
 * If no rules are present, the feature stays inert with zero overhead.
 * Once rules are detected, it dynamically imports and delegates to the full Reflector.
 * 
 * @implements {ReflectorProps}
 */
class ReflectorLazy {
    /** @type {WeakRef<HTMLElement> | undefined} */
    #hostRef;

    /** @type {FeatureSpawnContext | undefined} */
    #ctx;

    /** @type {EventTarget | null} */
    #hostPropagator = null;

    /** @type {import('./Reflector.js').Reflector | null} */
    #delegate = null;

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
    }

    get hostPropagator() {
        return this.#hostPropagator;
    }

    /**
     * @param {EventTarget | null} nv
     */
    set hostPropagator(nv) {
        this.#hostPropagator = nv;
        if (nv) {
            this.#maybeActivate();
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
        this.#delegate = new Reflector(host, /** @type {FeatureSpawnContext} */ (this.#ctx), {
            hostPropagator: this.#hostPropagator
        });
    }
}

export { ReflectorLazy };
