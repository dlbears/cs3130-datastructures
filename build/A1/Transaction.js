"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
exports.isTransaction = (x) => {
    const _x = x;
    if (utility_1.nulFalse(_x.tid, _x.id, _x.amount, _x.operation)) {
        if (_x.operation === 'O') {
            if (!utility_1.nulFalse(_x.unitCost, _x.itemName))
                return false;
        }
        return true;
    }
    return false;
};
class Transaction {
    constructor(t) {
        var _a;
        this.tid = t.tid;
        this._tid = parseInt(t.tid);
        this.id = t.id;
        this.operation = t.operation;
        this.amount = t.amount;
        if (t.operation === "O" && ((_a = t) === null || _a === void 0 ? void 0 : _a.unitCost)) {
            this.itemName = t.itemName;
            this.unitCost = t.unitCost;
            this.totalAdj = t.unitCost * t.amount;
        }
        else if (t.operation === "P") {
            this.totalAdj = -t.amount;
        }
        Transaction.present(t);
    }
    static setMAX(t) {
        this._MAX = t;
    }
    static getMAX() {
        return this._MAX;
    }
    static latestProcessed() {
        return this._latest;
    }
    static any() {
        return this._any;
    }
    static isDone() {
        return this._done;
    }
    static done() {
        this._done = true;
    }
    static toString(tx) {
        return JSON.stringify(tx, null, 2);
    }
    static present(t) {
        var _a, _b;
        this._any = true;
        const tid = parseInt(t.tid), cid = parseInt(t.id);
        if ((_b = (_a = this._latest) === null || _a === void 0 ? void 0 : _a.tid, (_b !== null && _b !== void 0 ? _b : -1)) <= tid) {
            this._latest = {
                tid,
                cid
            };
        }
        else {
            console.error("Transaction Data not in ascending order: undetermined behavior");
        }
    }
    _getTotalAdj() {
        return this.totalAdj;
    }
    belongsTo(c) {
        return this.id === c.id;
    }
    invoice() {
        var _a;
        const type = (_a = this.itemName, (_a !== null && _a !== void 0 ? _a : "Payment"));
        const maxItemSize = Transaction.getMAX().itemName.length;
        const tabOverlap = (maxItemSize - type.length) % 4;
        const rawTabs = Math.floor((maxItemSize - type.length) / 4);
        const tabs = tabOverlap > 0 ? rawTabs + 1 : rawTabs;
        const typePost = new Array(tabs).fill("\t").join("");
        const op = this.operation === 'O' ? '+' : '-';
        const finAmount = Math.abs(this._getTotalAdj()).toFixed(2);
        const amountSpacing = new Array(7 - finAmount.length).fill(" ").join("");
        const res = `\t${this.tid}#\t${type.concat(typePost)}\t$${op}${amountSpacing.concat(finAmount)}\n`;
        return res;
    }
}
exports.Transaction = Transaction;
Transaction._done = false;
Transaction._any = false;
Transaction._latest = { cid: -1, tid: -2 };
Transaction._MAX = null;
//# sourceMappingURL=Transaction.js.map