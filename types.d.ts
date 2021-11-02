import {BeDecoratedProps, EventHandler, MinimalController} from 'be-decorated/types';

export interface BeReflectiveVirtualProps{
    map: {[key: string]: PropToAttrMapping}
}
export interface BeReflectiveProps extends BeReflectiveVirtualProps{
    proxy: Element & BeReflectiveVirtualProps
}

export interface BeReflectiveActions{
    intro(proxy: Element & BeReflectiveVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;
}

export interface PropToAttrMapping{
    reflectTo: string,
    maxDelay?: number,
    once: boolean,
}
