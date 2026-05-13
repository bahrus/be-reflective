// @ts-check
/** @import {ReflectorProps, AllProps, FeatureSpawnContext, CustomStateRule} from './types/be-reflective/types' */

/**
 * Reflector is a custom element feature that reflects properties to custom states
 * based on CSS --custom-state-exports declarations.
 * 
 * It parses rules from the computed style of the host element and listens for
 * property change events on the host's propagator EventTarget, toggling custom
 * states on the host's ElementInternals accordingly.
 * 
 * Activation is driven by `callbackForwarding: ['connectedCallback', 'disconnectedCallback']`
 * in the assignFeatures config. The feature self-connects on construction (first
 * connectedCallback triggers the lazy getter spawn), and reconnects on subsequent
 * connectedCallbacks after disconnection.
 */
class Reflector {
    /** @type {WeakRef<HTMLElement> | undefined} */
    #hostRef;

    /** @type {ElementInternals | null} */
    #internals = null;

    /** @type {EventTarget | null} */
    #hostPropagator = null;

    /** @type {CustomStateRule[]} */
    #rules = [];

    /** @type {AbortController | null} */
    #abortController = null;

    /** @type {boolean} */
    #hasDisconnected = false;

    /**
     * @param {HTMLElement} hostElement
     * @param {FeatureSpawnContext} ctx
     * @param {Partial<ReflectorProps>} [initVals]
     */
    constructor(hostElement, ctx, initVals) {
        this.#hostRef = new WeakRef(hostElement);
        const shared = ctx.shared;
        if (shared) {
            this.#internals = shared.internals ?? null;
            this.#hostPropagator = shared.hostPropagator ?? null;
        }
        if (initVals) {
            Object.assign(this, initVals);
        }
        // Self-connect on construction since we're spawned during connectedCallback
        this.#connect();
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
            this.#connect();
        }
    }

    /**
     * Called by callbackForwarding when the host element is reconnected to the DOM.
     * Only re-connects if we've previously disconnected (avoids double-connect on
     * initial spawn since the constructor already connects).
     */
    connectedCallback() {
        if (this.#hasDisconnected) {
            this.#hasDisconnected = false;
            this.#connect();
        }
    }

    /**
     * Called by callbackForwarding when the host element is disconnected from the DOM.
     * Aborts all event listeners to clean up.
     */
    disconnectedCallback() {
        this.#hasDisconnected = true;
        if (this.#abortController) {
            this.#abortController.abort();
            this.#abortController = null;
        }
    }

    /**
     * Parse the --custom-state-exports CSS property and start listening for property changes.
     */
    #connect() {
        const host = this.#hostRef?.deref();
        if (!host || !this.#internals || !this.#hostPropagator) return;

        // Clean up previous listeners
        if (this.#abortController) {
            this.#abortController.abort();
        }
        this.#abortController = new AbortController();
        const signal = this.#abortController.signal;

        // Parse rules from computed style
        this.#rules = this.#parseRules(host);

        // Group rules by property name
        /** @type {Map<string, CustomStateRule[]>} */
        const rulesByProp = new Map();
        for (const rule of this.#rules) {
            const existing = rulesByProp.get(rule.propName);
            if (existing) {
                existing.push(rule);
            } else {
                rulesByProp.set(rule.propName, [rule]);
            }
        }

        // Listen for property change events
        for (const [propName, rules] of rulesByProp) {
            this.#hostPropagator.addEventListener(propName, () => {
                this.#evaluateRules(rules, host);
            }, { signal });
        }

        // Evaluate all rules immediately with current values
        for (const [, rules] of rulesByProp) {
            this.#evaluateRules(rules, host);
        }
    }

    /**
     * Parse the --custom-state-exports CSS custom property value into rules.
     * @param {HTMLElement} host
     * @returns {CustomStateRule[]}
     */
    #parseRules(host) {
        const computed = getComputedStyle(host);
        const raw = computed.getPropertyValue('--custom-state-exports').trim();
        if (!raw) return [];

        /** @type {CustomStateRule[]} */
        const rules = [];

        // Split by comma, handling the various rule formats
        const entries = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);

        for (const entry of entries) {
            const rule = this.#parseEntry(entry);
            if (rule) {
                rules.push(rule);
            }
        }

        return rules;
    }

    /**
     * Parse a single rule entry.
     * Formats:
     *   "name"                                    -> boolean reflection (stateName == propName)
     *   "stateName if propName==value"            -> string equality
     *   "stateName if propName*=value"            -> string contains
     *   "stateName if propName$=value"            -> string ends with
     *   "stateName if propName % divisor == val"  -> number modulo
     *   "stateName if propName < val"             -> number less than
     *   "stateName if propName > val"             -> number greater than
     *   "stateName if propName <= val"            -> number less than or equal
     *   "stateName if propName >= val"            -> number greater than or equal
     * @param {string} entry
     * @returns {CustomStateRule | null}
     */
    #parseEntry(entry) {
        // Check if it has a condition
        const ifIndex = entry.indexOf(' if ');
        if (ifIndex === -1) {
            // Simple boolean: "name" means propName == stateName
            const stateName = entry.trim();
            return {
                stateName,
                propName: stateName,
                conditionType: 'boolean'
            };
        }

        const stateName = entry.substring(0, ifIndex).trim();
        const condition = entry.substring(ifIndex + 4).trim();

        // Try modulo: "propName % divisor == value"
        const moduloMatch = condition.match(/^(\w+)\s*%\s*(\d+)\s*==\s*(\d+)$/);
        if (moduloMatch) {
            return {
                stateName,
                propName: moduloMatch[1],
                conditionType: 'modulo',
                moduloDivisor: parseInt(moduloMatch[2], 10),
                compareValue: parseInt(moduloMatch[3], 10)
            };
        }

        // Try greater than or equal: "propName >= value"
        const gteMatch = condition.match(/^(\w+)\s*>=\s*(.+)$/);
        if (gteMatch) {
            return {
                stateName,
                propName: gteMatch[1],
                conditionType: 'greaterThanOrEqual',
                compareValue: parseFloat(gteMatch[2].trim())
            };
        }

        // Try less than or equal: "propName <= value"
        const lteMatch = condition.match(/^(\w+)\s*<=\s*(.+)$/);
        if (lteMatch) {
            return {
                stateName,
                propName: lteMatch[1],
                conditionType: 'lessThanOrEqual',
                compareValue: parseFloat(lteMatch[2].trim())
            };
        }

        // Try greater than: "propName > value"
        const gtMatch = condition.match(/^(\w+)\s*>\s*(.+)$/);
        if (gtMatch) {
            return {
                stateName,
                propName: gtMatch[1],
                conditionType: 'greaterThan',
                compareValue: parseFloat(gtMatch[2].trim())
            };
        }

        // Try less than: "propName < value"
        const ltMatch = condition.match(/^(\w+)\s*<\s*(.+)$/);
        if (ltMatch) {
            return {
                stateName,
                propName: ltMatch[1],
                conditionType: 'lessThan',
                compareValue: parseFloat(ltMatch[2].trim())
            };
        }

        // Try string contains: "propName*=value"
        const containsMatch = condition.match(/^(\w+)\*=(.+)$/);
        if (containsMatch) {
            return {
                stateName,
                propName: containsMatch[1],
                conditionType: 'contains',
                compareValue: containsMatch[2].trim()
            };
        }

        // Try string ends with: "propName$=value"
        const endsWithMatch = condition.match(/^(\w+)\$=(.+)$/);
        if (endsWithMatch) {
            return {
                stateName,
                propName: endsWithMatch[1],
                conditionType: 'endsWith',
                compareValue: endsWithMatch[2].trim()
            };
        }

        // Try string equality: "propName==value"
        const eqMatch = condition.match(/^(\w+)==(.+)$/);
        if (eqMatch) {
            return {
                stateName,
                propName: eqMatch[1],
                conditionType: 'equals',
                compareValue: eqMatch[2].trim()
            };
        }

        return null;
    }

    /**
     * Evaluate a set of rules for a given property and update custom states.
     * @param {CustomStateRule[]} rules
     * @param {HTMLElement} host
     */
    #evaluateRules(rules, host) {
        if (!this.#internals) return;

        for (const rule of rules) {
            const value = /** @type {any} */ (host)[rule.propName];
            const active = this.#evaluateCondition(rule, value);

            if (active) {
                this.#internals.states.add(rule.stateName);
            } else {
                this.#internals.states.delete(rule.stateName);
            }
        }
    }

    /**
     * Evaluate whether a condition is met for a given value.
     * @param {CustomStateRule} rule
     * @param {any} value
     * @returns {boolean}
     */
    #evaluateCondition(rule, value) {
        switch (rule.conditionType) {
            case 'boolean':
                return !!value;

            case 'equals':
                return String(value) === String(rule.compareValue);

            case 'contains':
                return String(value).includes(String(rule.compareValue));

            case 'endsWith':
                return String(value).endsWith(String(rule.compareValue));

            case 'modulo':
                return (Number(value) % /** @type {number} */ (rule.moduloDivisor)) === Number(rule.compareValue);

            case 'lessThan':
                return Number(value) < Number(rule.compareValue);

            case 'greaterThan':
                return Number(value) > Number(rule.compareValue);

            case 'lessThanOrEqual':
                return Number(value) <= Number(rule.compareValue);

            case 'greaterThanOrEqual':
                return Number(value) >= Number(rule.compareValue);

            default:
                return false;
        }
    }
}

export { Reflector };
