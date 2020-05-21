"use strict";
exports.__esModule = true;
var utility_1 = require("./utility");
exports.isTransaction = function (x) {
    var _x = x;
    if (utility_1.nulFalse(_x.tid, _x.id, _x.amount, _x.operation)) {
        if (_x.operation === 'O') {
            if (!utility_1.nulFalse(_x.unitCost, _x.itemName))
                return false;
        }
        return true;
    }
    return false;
};
var Transaction = /** @class */ (function () {
    function Transaction(t) {
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
    Transaction.setMAX = function (t) {
        this._MAX = t;
    };
    Transaction.getMAX = function () {
        return this._MAX;
    };
    Transaction.latestProcessed = function () {
        return this._latest;
    };
    Transaction.any = function () {
        return this._any;
    };
    Transaction.isDone = function () {
        return this._done;
    };
    Transaction.done = function () {
        this._done = true;
    };
    Transaction.toString = function (tx) {
        return JSON.stringify(tx, null, 2);
    };
    Transaction.present = function (t) {
        var _a, _b;
        this._any = true;
        var tid = parseInt(t.tid), cid = parseInt(t.id);
        if ((_b = (_a = this._latest) === null || _a === void 0 ? void 0 : _a.tid, (_b !== null && _b !== void 0 ? _b : -1)) <= tid) {
            this._latest = {
                tid: tid,
                cid: cid
            };
        }
        else {
            console.error("Transaction Data not in ascending order: undetermined behavior");
        }
    };
    Transaction.prototype._getTotalAdj = function () {
        return this.totalAdj;
    };
    Transaction.prototype.belongsTo = function (c) {
        return this.id === c.id;
    };
    Transaction.prototype.invoice = function () {
        var _a;
        var type = (_a = this.itemName, (_a !== null && _a !== void 0 ? _a : "Payment"));
        var maxItemSize = Transaction.getMAX().itemName.length;
        var tabOverlap = (maxItemSize - type.length) % 4;
        var rawTabs = Math.floor((maxItemSize - type.length) / 4);
        var tabs = tabOverlap > 0 ? rawTabs + 1 : rawTabs;
        var typePost = new Array(tabs).fill("\t").join("");
        var op = this.operation === 'O' ? '+' : '-';
        var finAmount = Math.abs(this._getTotalAdj()).toFixed(2);
        var amountSpacing = new Array(7 - finAmount.length).fill(" ").join("");
        var res = "\t" + this.tid + "#\t" + type.concat(typePost) + "\t$" + op + amountSpacing.concat(finAmount) + "\n";
        return res;
    };
    Transaction._done = false;
    Transaction._any = false;
    Transaction._latest = { cid: -1, tid: -2 };
    Transaction._MAX = null;
    return Transaction;
}());
exports.Transaction = Transaction;
