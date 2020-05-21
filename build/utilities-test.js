"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const transducers_js_1 = __importDefault(require("transducers-js"));
console.log(transducers_js_1.default); //?
const filter = predicate => combine => (accumulation, current) => predicate(current) ? combine(accumulation, current) : accumulation;
const map = transform => combine => (accumulation, current) => combine(accumulation, transform(current));
const reduce = reduction => combine => (accumulation, current) => combine(...reduction(accumulation, current));
const compose = (...fs) => fs.reduce((f, g) => (...args) => {
    const partial = g(...args);
    const full = f(partial);
    console.log("Before", partial, "After", full); //?
    console.log(...args);
    return full; //f(g(...args)) 
});
const pushReducer = (acc, cur) => {
    console.log(acc, cur); //?
    acc.push(cur);
    return acc;
};
const take = x => reduction => combine => {
    let count = 0;
    return reduce((acc, cur) => {
        return (++count <= x) ? reduction(acc, cur) : [acc, cur];
    })(combine);
};
const composeTest = [
    {
        number: 2,
        value: "Something",
        filter: true
    },
    {
        number: 3,
        value: "Something Odd",
        filter: true
    },
    {
        value: "Nothing",
        filter: false
    },
    {
        value: "Something Weird",
        number: Infinity,
        filter: false
    }
];
const nums = new Array(100).fill(1).map((x, i) => i + 1);
const bools = [true, true, false, false];
const genTestObjs = amount => {
    let accumulation = [];
    let numCounter = 0, boolCounter = 0;
    while (amount >= 0) {
        if (boolCounter === bools.length)
            boolCounter = 0;
        if (numCounter === nums.length)
            numCounter = 0;
        accumulation.push({
            value: "Some Generic Thing",
            number: nums[numCounter++],
            filter: bools[boolCounter++]
        });
        amount--;
    }
    return accumulation;
};
const thousands = genTestObjs(1000);
const minus8 = x => x - 8, add10 = x => x + 10, multiply3 = x => x * 3;
const isOdd = x => {
    return x % 2 !== 0;
};
const imperative = (...fs) => data => {
    compose(...fs)(data); //?
    let accumulation = [];
    for (const datum of data) {
        const xf = x => multiply3(add10(minus8(x)));
        const i = xf(datum);
        if (isOdd(i))
            accumulation.push(xf(xf(datum))); /* ?. */
    }
    return accumulation;
};
const transduction = (xfs, combiner, data) => {
    const transform = xfs(combiner);
    let accumulation = [];
    for (const datum of data) {
        //const newAcc 
        accumulation = transform(accumulation, datum); /* ?. */
        //if (newAcc.length === accumulation.length) continue
        //else accumulation = newAcc
    }
    return accumulation; //data.reduce(transform, [])
};
const millionNums = new Array(10).fill(1).map((x, i) => x + i); /* ?. */
const ooopTestData = millionNums;
//(new Array(100))//? 
//.map((x, i) => i + 1) //?
// x - 8 -> x + 10 -> x * 3 -> x % 2 !== 0 -> x
const xfs = compose(map(minus8), map(add10), map(multiply3), filter(isOdd), map(minus8), map(add10), map(multiply3));
const optXfs = transducers_js_1.default.comp(transducers_js_1.default.map(minus8), transducers_js_1.default.map(add10), transducers_js_1.default.map(multiply3), transducers_js_1.default.filter(isOdd), transducers_js_1.default.map(minus8), transducers_js_1.default.map(add10), transducers_js_1.default.map(multiply3)); //?
const imperativeNumTest = () => imperative(minus8, add10, multiply3)(ooopTestData);
const loopTransductionTest = () => transduction(xfs, pushReducer, ooopTestData);
const libTransduceTest = () => transducers_js_1.default.into([], optXfs, ooopTestData);
// /*?.*/
//const tensThousands = genTestObjs(10000) /*?.*/
//const hundredThousands = genTestObjs(100000) /*?.*/
const millions = genTestObjs(10000); /*?.*/
//const tensMillions = genTestObjs(10000000) /*?.*/
//const hundredMillions = genTestObjs(100000000) /*?.*/
//const billions = genTestObjs(1000000000) /*?.*/
const transduce = (xfs, collection, reducer, init = []) => {
    const transform = xfs(reducer);
    //let accumulation = init
    return collection.reduce(transform, init); /* ?. */
    /*
    for (const value of collection) {
        accumulation = transform(accumulation, value)
    }
    return accumulation
    */
};
const reduceTransduceTest = () => transduce(xfs, ooopTestData, pushReducer); /* ?. */
const numTrials = 1;
for (let t = 1; t <= numTrials; t++) {
    imperativeNumTest(); /*?.*/
    loopTransductionTest(); /*?.*/
    libTransduceTest(); /*?.*/
    reduceTransduceTest(); /*?.*/
}
const transforms = compose(filter(obj => obj.filter), map(obj => {
    obj.number += 10;
    return obj;
}), map(obj => {
    obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12);
    return obj;
}), map(obj => {
    obj.number *= 2;
    return obj;
}), map(obj => {
    obj.number -= 10;
    return obj;
}), map(obj => {
    obj.number /= 2;
    return obj;
}), map(obj => {
    obj.value = obj.value.substring(0, 4);
    return obj;
}));
const chainedTest = data => data.filter(obj => obj.filter)
    .map(obj => {
    obj.number += 10;
    return obj;
})
    .map(obj => {
    obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12);
    return obj;
})
    .map(obj => {
    obj.number *= 2;
    return obj;
})
    .map(obj => {
    obj.number -= 10;
    return obj;
})
    .map(obj => {
    obj.number /= 2;
    return obj;
})
    .map(obj => {
    obj.value = obj.value.substring(0, 4);
    return obj;
});
//hundredThousands.reduce(transforms(pushReducer), []) //?
const transducerTest = data => transduce(transforms, data, pushReducer, []);
const imperativeTest = data => {
    let accumulation = [];
    for (let obj of data) {
        if (obj.filter) {
            obj.number += 10;
            obj.number *= 2;
            obj.number -= 10;
            obj.number /= 2;
            obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12);
            obj.value = obj.value.substring(0, 4);
            accumulation.push(obj);
        }
    }
    return accumulation;
};
//transducerTest(millions) //?
//chainedTest(millions) //?
//imperativeTest(millions) //?
const trials = 0;
for (let t = 1; t <= trials; t++) {
    transducerTest(millions); /*?.*/
    chainedTest(millions); /*?.*/
    imperativeTest(millions); /*?.*/
}
class Transducer extends stream_1.Transform {
    constructor(opts, xfs, state) {
        super(opts);
        this.xfs = xfs;
        this.state = state;
    }
    _reducer(acc, cur) {
        this.push(cur);
        return acc;
    }
    _transform(chunk, encoding, done) {
        const transform = this.xfs(this._reducer);
        this.state = transform(this.state, chunk);
        done();
    }
}
class State {
    constructor(_state, _reducers) {
        this._state = _state;
        this._reducers = _reducers;
    }
    setState(newState) {
        return new State(newState, this._reducers);
    }
    safeGetReducer(event) {
        var _a;
        return _a = this._reducers[event], (_a !== null && _a !== void 0 ? _a : this._reducers["default"]);
    }
    getState() {
        return this._state;
    }
    dispatch(event, value) {
        const transition = this.safeGetReducer(event);
        const newState = transition(this.getState(), value);
        return this.setState(newState);
    }
}
//# sourceMappingURL=utilities-test.js.map