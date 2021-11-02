import { XtalDecor } from 'xtal-decor/xtal-decor.js';
import { CE } from 'trans-render/lib/CE.js';
function doPoll(lastValue, key, self, prop) {
    if (lastValue !== self[key]) {
        lastValue = self[key];
        if (lastValue !== undefined && lastValue != null) {
            const sLV = lastValue.toString();
            if (prop.as !== undefined) {
                self.setAttribute(prop.as, sLV);
            }
            else {
                self.dataset[key] = sLV;
            }
        }
    }
    setTimeout(() => {
        doPoll(lastValue, key, self, prop);
    }, prop.poll);
}
const ce = new CE({
    config: {
        tagName: 'be-reflective',
        propDefaults: {
            upgrade: '*',
            ifWantsToBe: 'reflective',
            props: {
                src: {}
            },
            virtualProps: [],
        }
    },
    complexPropDefaults: {
        actions: [
            ({ self, props, target }) => {
                for (const key in props) {
                    const prop = props[key];
                    if (prop.poll) {
                        let lastValue = undefined;
                        doPoll(lastValue, key, self, prop);
                    }
                    else {
                        const proto = target.constructor.prototype;
                        const newProp = Object.getOwnPropertyDescriptor(proto, key);
                        const setter = newProp.set;
                        const getter = newProp.get;
                        Object.defineProperty(target, key, {
                            get() {
                                const tempGetter = getter.bind(this);
                                return tempGetter();
                            },
                            set(nv) {
                                if (nv !== null && nv !== undefined) {
                                    const sNV = nv.toString();
                                    if (prop.as !== undefined) {
                                        self.setAttribute(prop.as, sNV);
                                    }
                                    self.dataset[key] = nv.toString();
                                }
                                const tempSetter = setter.bind(this);
                                tempSetter(nv);
                            },
                            enumerable: true,
                            configurable: true,
                        });
                    }
                }
            }
        ],
        init: (self) => {
            console.log('in init');
        },
        on: {},
    },
    superclass: XtalDecor,
});
document.head.appendChild(document.createElement('be-reflective'));
