import {XtalDecor, XtalDecorCore} from 'xtal-decor/xtal-decor.js';
import {CE} from 'trans-render/lib/CE.js';
import {BeReflectiveProps, PropMonitor} from './types';


function doPoll(lastValue: any, key: string, self: any, prop: PropMonitor){
    if(lastValue !== self[key]){
        lastValue = self[key];
        if(lastValue !== undefined && lastValue != null){
            const sLV = lastValue.toString();
            if(prop.as !== undefined){
                self.setAttribute(prop.as, sLV)
            }else{
                self.dataset[key] = sLV;
            }
        }
    }
    setTimeout(() => {
        doPoll(lastValue, key, self, prop);
    }, prop.poll);
}
const ce = new CE<XtalDecorCore<HTMLElement> & BeReflectiveProps>({
    config:{
        tagName: 'be-reflective',
        propDefaults:{
            upgrade: '*',
            ifWantsToBe: 'reflective',
            props: {
                src:{}
            },
            virtualProps:[],
        }
    },
    complexPropDefaults:{
        actions:[
            ({self, props, target}: any) => {
                for(const key in props){
                    const prop = props[key] as PropMonitor;
                    if(prop.poll){
                        let lastValue: any = undefined;
                        doPoll(lastValue, key, self, prop);
                    }else{
                        const proto = target.constructor.prototype;
                        const newProp = Object.getOwnPropertyDescriptor(proto, key)!;
                        const setter = newProp.set!;
                        const getter = newProp.get!;
                        Object.defineProperty(target, key, {
                            get(){
                                const tempGetter = getter.bind(this);
                                return tempGetter();
                            },
                            set(nv){
                                if(nv !== null && nv !== undefined){
                                    const sNV = nv.toString();
                                    if(prop.as !== undefined){
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
        init:(self: HTMLElement) => {
            console.log('in init');
        },
        on:{},
    },
    superclass: XtalDecor,
});

document.head.appendChild(document.createElement('be-reflective'));