"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const J_ONParser_1 = require("./J$ONParser");
const Customer_1 = require("./Customer");
const Transaction_1 = require("./Transaction");
const stream_1 = require("stream");
const utility_1 = require("./utility");
const path_1 = require("path");
const fs_1 = require("fs");
const encoding = 'utf-8', buffer_multiple = 1.5;
const CUSTOMER_MAX = {
    id: "9999",
    name: "zzzzzzzzzzzzzzzzzzzz",
    balance: 9999.99
}, TRANSACTION_MAX = {
    tid: "9999",
    id: "9999",
    operation: 'O',
    itemName: "zzzzzzzzzzzzzzzzzzzz",
    amount: 9999,
    unitCost: 9999.99
};
Transaction_1.Transaction.setMAX(TRANSACTION_MAX);
const MASTER_PATH = path_1.resolve(__dirname, `master.json`), TRANSACTIONS_PATH = path_1.resolve(__dirname, `transactions.json`), OUTPUT_PATH = path_1.resolve(__dirname, `output`);
const transaction_max_bytes = Math.round(utility_1.objSizeOf(TRANSACTION_MAX) * buffer_multiple), customer_max_bytes = Math.round(utility_1.objSizeOf(CUSTOMER_MAX) * buffer_multiple);
const c$ = fs_1.createReadStream(MASTER_PATH, { encoding, highWaterMark: customer_max_bytes }), t$ = fs_1.createReadStream(TRANSACTIONS_PATH, { encoding, highWaterMark: transaction_max_bytes }), o$ = fs_1.createWriteStream(OUTPUT_PATH, { encoding });
t$.on('end', () => Transaction_1.Transaction.done());
c$.on('end', () => Customer_1.Customer.done());
const customer_file_size = fs_1.statSync(MASTER_PATH).size, transaction_file_size = fs_1.statSync(TRANSACTIONS_PATH).size;
const customerIsLarger = (customer_file_size / customer_max_bytes) > (transaction_file_size / transaction_max_bytes);
class Assignment1 {
    constructor() {
        this.handleError = (pre, post = "END") => e => {
            if (e)
                console.error(`${pre} ${e} `);
            else
                console.log(" Success ");
        };
        this.makeCompleteHandler = (done, err) => (e = false) => e ? err(e) : done();
        this.makeEndHandler = (...$arr) => () => {
            $arr.forEach($ => $.destroy());
            return $arr;
        };
    }
    cunstructor() { }
    run() {
        const pass$ = new stream_1.PassThrough({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true }), objMap = utility_1.map$({ readableObjectMode: true, writableObjectMode: true }), reduceObjs2Str = utility_1.reduce$({ readableObjectMode: false, writableObjectMode: true });
        const tParser$ = J_ONParser_1.J$ONParser(), tRegister$ = objMap(t => new Transaction_1.Transaction(t)), cParser$ = J_ONParser_1.J$ONParser(), cRegister$ = objMap(c => new Customer_1.Customer(c));
        const transaction$ = stream_1.pipeline(t$, tParser$, tRegister$, this.handleError("atTransaction$")), customer$ = stream_1.pipeline(c$, cParser$, cRegister$, this.handleError("atCustomer$"));
        let neverEnding$ = customerIsLarger ?
            transaction$.pipe(pass$, { end: false }) : customer$.pipe(pass$, { end: false });
        customerIsLarger ?
            customer$.pipe(pass$) : transaction$.pipe(pass$);
        const doneEarly = () => {
            var _a, _b;
            return (customerIsLarger ? Transaction_1.Transaction.isDone() : Customer_1.Customer.isDone()) &&
                ((_a = Transaction_1.Transaction.latestProcessed().tid, (_a !== null && _a !== void 0 ? _a : -1)) === (_b = Customer_1.Customer.getLatestModified().tid, (_b !== null && _b !== void 0 ? _b : -2)));
        };
        const terminateEarly = () => {
            t$.close();
            c$.close();
            neverEnding$.end();
            transaction$.end();
            customer$.end();
            pass$.end();
            getInvoices$.end();
        };
        const terminatorBinding = utility_1.terminator(doneEarly, terminateEarly);
        const stateReducer = (acc, cur) => {
            var _a, _b;
            if (cur instanceof Customer_1.Customer) {
                const appliedTransactions = (_a = acc.transactions.filter(t => t.belongsTo(cur)).
                    map(t => cur.applyTransaction(t)).
                    length, (_a !== null && _a !== void 0 ? _a : 0));
                acc.customers.push(cur);
                if (appliedTransactions > 0)
                    acc.transactions = acc.transactions.filter(t => !t.belongsTo(cur));
            }
            else if (cur instanceof Transaction_1.Transaction) {
                const customerMatches = (_b = acc.customers.filter(c => cur.belongsTo(c)).
                    map(c => c.applyTransaction(cur)).
                    length, (_b !== null && _b !== void 0 ? _b : 0));
                if (customerMatches > 1)
                    console.error("Duplicate Customer Records");
                if (customerMatches === 0)
                    acc.transactions.push(cur);
            }
            return acc;
        };
        const pushNewInvoices = acc => acc.customers.
            filter(c => c.isModified()).
            map(c => c.generateInvoice()).join("");
        const initialState = {
            customers: [],
            transactions: []
        };
        const getInvoices$ = reduceObjs2Str(terminatorBinding(stateReducer), pushNewInvoices, initialState);
        const Invoice$ = stream_1.pipeline(pass$, getInvoices$, this.handleError("onInvoice$"));
        const cleanup = this.makeEndHandler(c$, t$, customer$, transaction$, pass$, neverEnding$, Invoice$);
        const onComplete = this.makeCompleteHandler(cleanup, this.handleError("onComplete"));
        Invoice$.pipe(o$).on("close", onComplete).
            on("error", onComplete);
    }
}
exports.Assignment1 = Assignment1;
//const a1 = new Assignment1()
//a1.run()
//# sourceMappingURL=Assignment1.js.map