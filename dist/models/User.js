"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
var Designation;
(function (Designation) {
    Designation["Buster"] = "buster";
    Designation["Sorter"] = "sorter";
    Designation["Admin"] = "admin";
    Designation["Dev"] = "dev";
    Designation["Operator"] = "operator";
    Designation["Staff"] = "staff";
    Designation["Client"] = "client";
})(Designation || (Designation = {}));
exports.userSchema = new mongoose_1.Schema({
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    otp: { type: String },
    email: {
        type: String,
        lowercase: true,
        required: true,
        validate: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
        index: { unique: true },
    },
    phone: { type: String, unique: true },
    password: { type: String, select: false },
    pay: { type: String },
    target: { type: String },
    targetType: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
    },
    designation: {
        type: String,
        enum: ["buster", "admin", "dev", "sorter", "operator", "staff", "client"],
    },
    profileImage: { type: String, default: null },
    cloudImage: { type: String, default: null },
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: String, default: null },
    firstTimeLogin: { type: Boolean, default: true },
}, { timestamps: true });
exports.userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};
exports.userSchema.methods.compareOtp = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.otp);
};
exports.userSchema.methods.fullName = function () {
    return this.firstName.trim() + " " + this.lastName.trim();
};
exports.User = mongoose_1.model("User", exports.userSchema);
