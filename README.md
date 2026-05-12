# be-reflective

This package contains the world's second custom element feature (following closely on the related https://github.com/bahrus/truth-sourcer which provides a pluggable feature for synchronizing attributes with properties in a kind of two-binding mechanism).

This feature provides a pluggable way of reflecting properties.

## Using this feature

The spawn definition can be either **synchronous** (eager) or **asynchronous** (lazy-loaded). The tradeoff:

- **Synchronous** — the Reflector is available immediately, so custom states are reflected from the very first property change. No flash of unstyled state.
- **Asynchronous** — smaller initial bundle. The implementation loads on first access. There's a brief window where states aren't reflected until the import resolves. For most UI this is invisible since custom states typically drive non-critical styling.

Both approaches are shown below. Pick whichever fits your priorities.

### Synchronous (immediate reflection)

```JavaScript
import 'assign-gingerly/object-extension.js';
import {Reflector} from 'be-reflective/Reflector.js';

class MyElement extends HTMLElement {
    /**
     * @type {EventTarget}
     **/
    propagator = new EventTarget();


    static supportedFeatures = {
        reflector: {
            fallbackSpawn: Reflector,
            getSharedContext(instance) {
                return { internals: instance.#internals };
            }
        }
    };

    /**
     * @type {string}
     **/
    #name = '';

    get name(){
        return this.#name
    }

    set name(nv){
        this.#name = nv;
        this.propagator.dispatchEvent(new Event('name'));
    }

    /** @type {boolean} */
    #disabled = false;

    get disabled() {
        return this.#disabled;
    }

    set disabled(nv) {
        this.#disabled = nv;
        this.propagator.dispatchEvent(new Event('disabled'));
    }

    constructor(){
        super();
        this.#internals = this.attachInternals();
        this.reflector.hostPropagator = this.propagator;
    }


}

customElements.assignFeatures(MyElement, {
    reflector: { spawn: Reflector }
});

customElements.define('my-element', MyElement);
```

### Asynchronous (smaller initial footprint)

Uses `ReflectorLazy` which checks whether `--custom-state-exports` is actually declared in CSS before loading the full implementation. If no rules are present, the feature stays inert with zero overhead.

```JavaScript
import 'assign-gingerly/object-extension.js';

class MyElement extends HTMLElement {
    /**
     * @type {EventTarget}
     **/
    propagator = new EventTarget();


    static supportedFeatures = {
        reflector: {
            fallbackSpawn: async () => (await import('be-reflective/ReflectorLazy.js')).ReflectorLazy,
            getSharedContext(instance) {
                return { internals: instance.#internals };
            }
        }
    };

    /**
     * @type {string}
     **/
    #name = '';

    get name(){
        return this.#name
    }

    set name(nv){
        this.#name = nv;
        this.propagator.dispatchEvent(new Event('name'));
    }

    /** @type {boolean} */
    #disabled = false;

    get disabled() {
        return this.#disabled;
    }

    set disabled(nv) {
        this.#disabled = nv;
        this.propagator.dispatchEvent(new Event('disabled'));
    }

    constructor(){
        super();
        this.#internals = this.attachInternals();
        this.reflector.hostPropagator = this.propagator;
    }


}

customElements.assignFeatures(MyElement, {
    reflector: { spawn: async () => (await import('be-reflective/ReflectorLazy.js')).ReflectorLazy }
});

customElements.define('my-element', MyElement);
```

## Custom State Reflection

Custom state reflection is only available for properties of type boolean, number and string.

### Booleans

For booleans, just specify each one individually:

```html
<style>
    my-element {
        --custom-state-exports: name, disabled;
    }
    
</style>
```

Bonus benefit:  This makes it really easy for another developer to "discover" what custom states are applicable, something that appears to be lacking with the current browser developer tools.

### Strings
For strings, we can specify a mapping:


```html
<style>
    alert-component {
        --custom-state-exports: 
            alertTypeIndicatesSuccess if alertType==success, 
            alertTypeIndicatesFailure if alertType==failure
        ;
    }
    
</style>
```

We can also specify wildcard matching:

```html
<style>
    alert-component {
        --custom-state-exports: 
            alertTypeIndicatesSuccess if alertType*=success, 
            alertTypeIndicatesFailure if alertType$=failure
        ;
    }
    
</style>
```

We adopt the same symbol for the wildcard matching is is used for [attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors)

### Numbers

Finally for numbers, we can specify modulo checks, and greater than or less than checks

```html
<style>
    alert-component {
        --custom-state-exports: 
            ticksInSecondQuarter if ticks % 4 == 1, 
            ticksInFourthQuarter if ticks % 4 == 3,
            ticksLessThan20 if ticks < 20,
            ticksGreaterThanOrEqualTo30 if ticks >= 30
        ;
    }
    
</style>
```




## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule add https://github.com/bahrus/types.git types
6. > git submodule update --init --recursive
7. > npm install
8. > npm run serve
9. Open http://localhost:8000/ in a modern browser

## Running Tests

```
> npm run test
```

## Using from ESM Module:

```JavaScript
import 'be-reflective/be-reflective.js';
```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.sh/be-reflective';
</script>
```

git rm --cached types 2>nul
git submodule add https://github.com/bahrus/types.git types
