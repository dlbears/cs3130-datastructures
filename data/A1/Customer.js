"use strict";
exports.__esModule = true;
var utility_1 = require("./utility");
exports.isCustomer = function (x) {
    var _x = x;
    if (utility_1.nulFalse(_x.id, _x.name) &&
        typeof _x.balance === "number") {
        return true;
    }
    return false;
};
var Customer = /** @class */ (function () {
    function Customer(c) {
        this._modified = false;
        this.id = c.id;
        this._id = parseInt(c.id);
        this.name = c.name;
        this.balance = this.previousBalance = c.balance;
        this.transactions = [];
    }
    Customer.done = function () {
        this._done = true;
    };
    Customer.isDone = function () {
        return this._done;
    };
    Customer.any = function () {
        return this._anyModified;
    };
    Customer.getLatestModified = function () {
        return this._latestModified;
    };
    Customer.handleLatest = function (cid, _a) {
        var tid = _a._tid;
        var _b, _c, _d, _e;
        if ((_c = (_b = this.getLatestModified()) === null || _b === void 0 ? void 0 : _b.cid, (_c !== null && _c !== void 0 ? _c : -1)) > cid)
            console.error("Customers not in ascending order: undetermined behavior");
        if ((_e = (_d = this.getLatestModified()) === null || _d === void 0 ? void 0 : _d.tid, (_e !== null && _e !== void 0 ? _e : -1)) === tid)
            console.error("Duplicate Transaction IDs");
        this._latestModified = {
            cid: cid,
            tid: tid
        };
    };
    Customer.prototype.isModified = function () {
        return this._modified;
    };
    Customer.prototype.applyTransaction = function (t) {
        this._modified = true;
        Customer.handleLatest(this._id, t);
        this.transactions = this.transactions.concat(t);
        console.log("Tx#: " + t.tid + ", amount: " + t.amount + ", totalAdj: " + t._getTotalAdj() + ", OldBalance: " + this.balance + ", NewBalance: " + (this.balance + t._getTotalAdj()));
        this.balance += t._getTotalAdj();
        return t;
    };
    Customer.prototype.generateInvoice = function () {
        var name = this.name, id = this.id, previousBalance = this.previousBalance.toFixed(2), balanceDue = this.balance.toFixed(2), transactions = this.transactions.map(function (t) { return t.invoice(); }).join("");
        var amountSpacing = function (numStr) { return new Array(7 - numStr.length).fill(" ").join(""); };
        return (name + "\t" + id + "\nPREVIOUS BALANCE\t\t\t\t\t$ " + amountSpacing(previousBalance) + previousBalance + "\n" + transactions + "BALANCE DUE\t\t\t\t\t\t\t$ " + amountSpacing(balanceDue) + balanceDue + "\n\n");
    };
    Customer._done = false;
    Customer._latestModified = null;
    Customer._anyModified = false;
    return Customer;
}());
exports.Customer = Customer;
