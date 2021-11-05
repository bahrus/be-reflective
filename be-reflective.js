import { define } from 'be-decorated/be-decorated.js';
import { register } from "be-hive/register.js";
export class BeReflectiveController {
    #target;
    intro(proxy, target, beDecorProps) {
        this.#target = target;
        const params = JSON.parse(proxy.getAttribute('is-' + beDecorProps.ifWantsToBe));
        const fullyQualifiedMap = {};
        for (const propKey in params) {
            const propMap = params[propKey];
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
            else {
                let proto = this;
                let prop = Object.getOwnPropertyDescriptor(proto, propKey);
                while (proto && !prop) {
                    proto = Object.getPrototypeOf(proto);
                    prop = Object.getOwnPropertyDescriptor(proto, propKey);
                }
                if (prop === undefined) {
                    throw { element: this, propKey, message: "Can't find property." };
                }
                const setter = prop.set.bind(this);
                const getter = prop.get.bind(this);
                Object.defineProperty(this, propKey, {
                    get() {
                        return getter();
                    },
                    set(nv) {
                        setter(nv);
                        this.setAttr(this.#target, nv, reflectTo);
                    },
                    enumerable: true,
                    configurable: true,
                });
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
        if (reflectTo[0] === '.') {
            const verb = val ? 'add' : 'remove';
            self.classList[verb](reflectTo.slice(1));
        }
        else if (reflectTo.substr(0, 2) === '::') {
            const verb = val ? 'add' : 'remove';
            self.part[verb](reflectTo.slice(2));
        }
        else {
            const verb = val ? 'setAttribute' : 'removeAttribute';
            self[verb](reflectTo, '');
        }
    }
}
const tagName = 'be-reflective';
const ifWantsToBe = 'reflective';
const upgrade = '*';
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
            onMap: {
                ifAllOf: ['map'],
            }
        }
    },
    complexPropDefaults: {
        controller: BeReflectiveController,
    }
});
register(ifWantsToBe, upgrade, tagName);
