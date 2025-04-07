import parse from './lib/parse.js';
import reskify from './lib/reskify.js';
import { readFile, readFileAsync, load } from './lib/read.js';


const Reski = {
    parse: parse,
    reskify: reskify,
    load: load,
    readFile : readFile,
    readFileAsync : readFileAsync
}

export default Reski;