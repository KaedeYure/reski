import parse from './lib/parse';
import reskify from './lib/reskify';
import engrave from './lib/engrave';

export interface Reski {
    parse: typeof parse;
    reskify: typeof reskify;
    engrave: typeof engrave;
}

declare const Reski: Reski;
export default Reski;