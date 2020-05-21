"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assignment1_1 = require("./A1/Assignment1");
const runner = async () => {
    let call = new Assignment1_1.Assignment1();
    try {
        let result = await call.run();
        console.log(result);
    }
    catch (e) {
        console.error(e);
    }
    return call;
};
runner().then(x => console.log(x)).catch(e => console.error(e));
//a1Test()
//# sourceMappingURL=main.js.map