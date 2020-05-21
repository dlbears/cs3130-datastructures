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
const Customer_1 = require("./Customer");
const Transaction_1 = require("./Transaction");
const prefix = (size, p) => (x) => {
    if (x.length === 0)
        return new Array(size).fill(p).join("");
    if (x.length < size)
        return new Array(size - x.length).fill(p).join("").concat(x);
    return x;
};
const prefixZeros = prefix(4, "0");
const items = [
    {
        amount: 1000,
        itemName: "Weatherproof Nails",
        unitCost: 0.33
    },
    {
        amount: 10,
        itemName: "Microverse Battery",
        unitCost: 67.89
    },
    {
        amount: 100,
        itemName: "Plumbus",
        unitCost: 6.50
    },
    {
        amount: 500,
        itemName: "Fleeb Juice (Gallon)",
        unitCost: 1.98
    },
    {
        amount: 800,
        itemName: "Scruplus",
        unitCost: 1.12
    },
    {
        amount: 5,
        itemName: "Chumble",
        unitCost: 128.99
    },
    {
        amount: 25,
        itemName: "Portal Gun",
        unitCost: 38.99
    }
];
const customers = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./master.json")).toString());
//const customers = []
const cids = customers.map(x => {
    if (Customer_1.isCustomer(x))
        return x.id;
    else
        console.log(x);
});
const getID = i => cids[i - 1];
const generateTransactions = (nC, nT) => {
    let acc = "";
    let tid = 0;
    let consecutive_payment = false;
    for (let id = 1; id <= nC; id++) {
        const isFinalC = id === nC;
        for (let it = 1; it <= nT; it++) {
            const isFinalT = it === nT;
            let rdn = Math.random;
            let newTransaction = { tid: null, id: null, operation: null, unitCost: null, amount: null };
            newTransaction.tid = prefixZeros(tid.toFixed(0));
            tid++;
            newTransaction.id = getID(id);
            const operation = (rdn() * 9) > 3 ? "O" :
                consecutive_payment ? "O" : "P";
            newTransaction.operation = operation;
            if (operation === "O") {
                consecutive_payment = false;
                const randomIndex = Math.round(rdn() * items.length) - 1;
                const randomItem = items[randomIndex < 0 ? 0 : randomIndex];
                newTransaction.itemName = randomItem.itemName;
                newTransaction.unitCost = randomItem.unitCost;
                newTransaction.amount = Math.round(rdn() * randomItem.amount);
            }
            else {
                newTransaction.amount = Math.round(Math.random() * 1000);
            }
            if (Transaction_1.isTransaction(newTransaction)) {
                acc = acc.concat(JSON.stringify((newTransaction.operation === 'O' ?
                    { ...newTransaction } :
                    { tid: newTransaction.tid, id: newTransaction.id, operation: newTransaction.operation, amount: newTransaction.amount }), null, 2) + (isFinalC && isFinalT ? "" : ",\n"));
            }
        }
    }
    return "[ \n" + acc + "\n ]";
};
const gendTx = generateTransactions(cids.length, 5); //?
fs.writeFileSync(path.resolve(__dirname, "transactions.test.json"), gendTx);
//# sourceMappingURL=generateTransactions.js.map