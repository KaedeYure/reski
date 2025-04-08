import parse from './lib/parse';
import reskify from './lib/reskify';

export interface Reski {
    parse: typeof parse;
    reskify: typeof reskify;
}

declare const Reski: Reski;
export default Reski;