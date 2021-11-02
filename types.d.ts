export interface BeReflectiveProps{
    props: {[key: string]: PropMonitor};
}

export interface PropMonitor{
    as?: string,
    poll?: number,
}
