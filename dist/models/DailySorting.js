"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailySorting = exports.dailySortingSchema = void 0;
const mongoose_1 = require("mongoose");
exports.dailySortingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    arrivalTime: { type: mongoose_1.Schema.Types.Date, required: true },
    points: { type: Number, default: 0 },
    items: { type: mongoose_1.Schema.Types.Mixed },
    weight: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.DailySorting = mongoose_1.model("DailySorting", exports.dailySortingSchema);
