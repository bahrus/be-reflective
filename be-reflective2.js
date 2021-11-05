import { define } from 'be-decorated/be-decorated.js';
export class BeReflectiveController {
    #target;
    intro(proxy, target, beDecorProps) {
        const params = JSON.parse(proxy.getAttribute('is-' + beDecorProps.ifWantsToBe));
        const { map } = params;
        const fullyQualifiedMap = {};
        for (const propKey in map) {
            const propMap = map[propKey];
            switch (typeof propMap) {
                case 'string':
                    const reflectTo = propMap;
                    fullyQualifiedMap[propKey] = { reflectTo };
                    break;
                case 'object':
                    fullyQualifiedMap[propKey] = propMap;
                    break;
                default:
                    throw 'NI'; //Not implemented
            }
        }
        proxy.map = fullyQualifiedMap;
    }
    onMap({ map }) {
        for (const propKey in map) {
            const propMap = map[propKey];
            const { reflectTo, maxDelay, once } = propMap;
            const val = this.#target[propKey];
            if (val !== undefined) {
                this.setAttr(this.#target, val, reflectTo);
                if (once)
                    return;
            }
            if (maxDelay) {
                this.doPoll(propMap, propKey);
            }
        }
    }
    doPoll(propMap, propKey) {
        const { maxDelay, once, reflectTo } = propMap;
        setTimeout(() => {
            const val = this.#target[propKey];
            if (val !== undefined) {
                this.setAttr(this.#target, val, reflectTo);
                if (once)
                    return;
            }
            this.doPoll(propMap, propKey);
        }, maxDelay);
    }
    setAttr(self, val, reflectTo) {
    }
}
const tagName = 'be-reflective';
const ifWantsToBe = 'reflective';
const upgrade = 'input';
define({
    config: {
        tagName,
        propDefaults: {
            virtualProps: ['map'],
            noParse: true,
            upgrade,
            ifWantsToBe,
            intro: 'intro',
        },
        actions: {
            intro: 'intro',
        }
    }
});
