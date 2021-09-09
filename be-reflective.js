import { XtalDecor } from 'xtal-decor/xtal-decor.js';
import { CE } from 'trans-render/lib/CE.js';
const ce = new CE({
    config: {
        tagName: 'be-reflective',
        propDefaults: {
            upgrade: '*',
            ifWantsToBe: 'reflective',
            props: [],
            virtualProps: [],
        }
    },
    complexPropDefaults: {
        actions: [
            ({ self, props, target }) => {
                for (const prop of props) {
                    const proto = target.constructor.prototype;
                    const newProp = Object.getOwnPropertyDescriptor(proto, prop);
                    const setter = newProp.set;
                    const getter = newProp.get;
                    Object.defineProperty(target, prop, {
                        get() {
                            const tempGetter = getter.bind(this);
                            return tempGetter();
                        },
                        set(nv) {
                            self.dataset[prop] = nv.toString();
                            const tempSetter = setter.bind(this);
                            tempSetter(nv);
                        },
                        enumerable: true,
                        configurable: true,
                    });
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
