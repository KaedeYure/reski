import parse from './lib/parse';
import reskify from './lib/reskify';
import { readFile, readFileAsync, load } from './lib/read';

export interface Reski {
    parse: typeof parse;
    reskify: typeof reskify;
    load: typeof load;
    readFile: typeof readFile;
    readFileAsync: typeof readFileAsync;
}

declare const Reski: Reski;
export default Reski;