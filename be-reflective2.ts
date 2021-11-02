import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BeReflectiveProps, BeReflectiveActions, BeReflectiveVirtualProps} from './types';

export class BeReflectiveController implements BeReflectiveActions{
    intro(proxy: Element & BeReflectiveVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        const params = JSON.parse(proxy.getAttribute('is-' + beDecorProps.ifWantsToBe!)!) as BeReflectiveProps;
        const {map} = params;
        for(const propKey in map){
            const propMap = map[propKey];
        }
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
            intro: 'intro'
        }
    }
});


