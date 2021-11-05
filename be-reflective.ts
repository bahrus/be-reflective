import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BeReflectiveProps, BeReflectiveActions, BeReflectiveVirtualProps, PropToAttrMapping} from './types';
import {register} from "be-hive/register.js";

export class BeReflectiveController implements BeReflectiveActions{
    #target!: Element;
    intro(proxy: Element & BeReflectiveVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        this.#target = target;
        const params = JSON.parse(proxy.getAttribute('is-' + beDecorProps.ifWantsToBe!)!) as {[key: string]: PropToAttrMapping};
        const fullyQualifiedMap: {[key: string]: PropToAttrMapping} = {}
        for(const propKey in params){
            const propMap = params[propKey];
            switch(typeof propMap){
                case 'string':
                    const reflectTo = propMap;
                    fullyQualifiedMap[propKey] = {reflectTo};
                    break;
                case 'object':
                    fullyQualifiedMap[propKey] = propMap;
                    break;
                default:
                    throw 'NI';//Not implemented
            }
        }
        proxy.map = fullyQualifiedMap;
    }

    onMap({map}: this){
        for(const propKey in map){
            const propMap = map[propKey];
            const {reflectTo, maxDelay, once} = propMap;
            const val = (<any>this.#target)[propKey];
            if(val !== undefined){
                this.setAttr(this.#target, val, reflectTo);
                if(once) return;
            }
            if(maxDelay){
                this.doPoll(propMap, propKey);
            }else{
                let proto = this;
                let prop: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(proto, propKey);
                while(proto && !prop){
                    proto = Object.getPrototypeOf(proto);
                    prop = Object.getOwnPropertyDescriptor(proto, propKey);
                }
                if(prop === undefined){
                    throw {element: this, propKey, message: "Can't find property."};
                }
                const setter = prop.set!.bind(this);
                const getter = prop.get!.bind(this);
                Object.defineProperty(this, propKey, {
                    get(){
                        return getter();
                    },
                    set(nv){
                        setter(nv);
                        this.setAttr(this.#target, nv, reflectTo);
                    },
                    enumerable: true,
                    configurable: true,
                });     
            }
        }
    }

    doPoll(propMap: PropToAttrMapping, propKey: string){
        const {maxDelay, once, reflectTo} = propMap;
        setTimeout(() => {
            const val = (<any>this.#target)[propKey];
            if(val !== undefined){
                this.setAttr(this.#target, val, reflectTo);
                if(once) return;
            }
            this.doPoll(propMap, propKey);
        }, maxDelay);
    }

    setAttr(self: Element, val: any, reflectTo: string){
        if(reflectTo[0] === '.'){
            const verb = val ? 'add' : 'remove';
            self.classList[verb](reflectTo.slice(1));
            
        }else if(reflectTo.substr(0, 2) === '::'){
            const verb = val ? 'add' : 'remove';
            self.part[verb](reflectTo.slice(2));
        }else{
            const verb = val ? 'setAttribute' : 'removeAttribute';
            self[verb](reflectTo, '');
        }
    }
}

export interface BeReflectiveController extends BeReflectiveProps{}

const tagName = 'be-reflective';
const ifWantsToBe = 'reflective';
const upgrade = '*';

define<BeReflectiveProps & BeDecoratedProps<BeReflectiveProps, BeReflectiveActions>, BeReflectiveActions>({
    config:{
        tagName,
        propDefaults:{
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
    complexPropDefaults:{
        controller: BeReflectiveController,
    }
});

register(ifWantsToBe, upgrade, tagName);


