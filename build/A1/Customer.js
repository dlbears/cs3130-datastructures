"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
exports.isCustomer = (x) => {
    const _x = x;
    if (utility_1.nulFalse(_x.id, _x.name) &&
        typeof _x.balance === "number") {
        return true;
    }
    return false;
};
class Customer {
    constructor(c) {
        this._modified = false;
        this.id = c.id;
        this._id = parseInt(c.id);
        this.name = c.name;
        this.balance = this.previousBalance = c.balance;
        this.transactions = [];
    }
    static done() {
        this._done = true;
    }
    static isDone() {
        return this._done;
    }
    static any() {
        return this._anyModified;
    }
    static getLatestModified() {
        return this._latestModified;
    }
    static handleLatest(cid, { _tid: tid }) {
        var _a, _b, _c, _d;
        if ((_b = (_a = this.getLatestModified()) === null || _a === void 0 ? void 0 : _a.cid, (_b !== null && _b !== void 0 ? _b : -1)) > cid)
            console.error("Customers not in ascending order: undetermined behavior");
        if ((_d = (_c = this.getLatestModified()) === null || _c === void 0 ? void 0 : _c.tid, (_d !== null && _d !== void 0 ? _d : -1)) === tid)
            console.error("Duplicate Transaction IDs");
        this._latestModified = {
            cid,
            tid
        };
    }
    isModified() {
        return this._modified;
    }
    applyTransaction(t) {
        this._modified = true;
        Customer.handleLatest(this._id, t);
        this.transactions = this.transactions.concat(t);
        console.log(`Tx#: ${t.tid}, amount: ${t.amount}, totalAdj: ${t._getTotalAdj()}, OldBalance: ${this.balance}, NewBalance: ${this.balance + t._getTotalAdj()}`);
        this.balance += t._getTotalAdj();
        return t;
    }
    generateInvoice() {
        const name = this.name, id = this.id, previousBalance = this.previousBalance.toFixed(2), balanceDue = this.balance.toFixed(2), transactions = this.transactions.map(t => t.invoice()).join("");
        const amountSpacing = numStr => new Array(7 - numStr.length).fill(" ").join("");
        return (`${name}\t${id}\nPREVIOUS BALANCE\t\t\t\t\t$ ${amountSpacing(previousBalance)}${previousBalance}\n${transactions}BALANCE DUE\t\t\t\t\t\t\t$ ${amountSpacing(balanceDue)}${balanceDue}\n\n`);
    }
}
exports.Customer = Customer;
Customer._done = false;
Customer._latestModified = null;
Customer._anyModified = false;
//# sourceMappingURL=Customer.js.map