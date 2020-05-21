"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const output = path.resolve(__dirname, 'out');
const master = path.resolve(__dirname, 'master.json');
const filein = fs.createReadStream(master);
const out = fs.createWriteStream(output);
const Test = async () => {
    //const filein = fs.createReadStream(master)
    //const out = fs.createWriteStream(output)
    for await (const chk of filein) {
        out.write(chk);
    }
    return new Promise((res, rej) => {
        filein.on('close', res);
        filein.on('error', rej);
    });
};
Test().then(console.log).catch(console.error);
//# sourceMappingURL=test.js.map