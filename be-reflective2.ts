import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BeReflectiveProps, BeReflectiveActions, BeReflectiveVirtualProps, PropToAttrMapping} from './types';

export class BeReflectiveController implements BeReflectiveActions{
    #target!: Element;
    intro(proxy: Element & BeReflectiveVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        const params = JSON.parse(proxy.getAttribute('is-' + beDecorProps.ifWantsToBe!)!) as BeReflectiveProps;
        const {map} = params;
        const fullyQualifiedMap: {[key: string]: PropToAttrMapping} = {}
        for(const propKey in map){
            const propMap = map[propKey];
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

    }
}

export interface BeReflectiveController extends BeReflectiveProps{

}

const tagName = 'be-reflective';
const ifWantsToBe = 'reflective';
const upgrade = 'input';

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
            intro: 'intro',
        }
    }
});


