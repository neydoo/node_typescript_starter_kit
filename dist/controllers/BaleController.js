"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortingController = void 0;
const tslib_1 = require("tslib");
const moment = require('moment');
const core_1 = require("@overnightjs/core");
const auth_1 = require("../middleware/auth");
const Bale_1 = require("../models/Bale");
const PdfService_1 = require("src/service/PdfService");
let SortingController = class SortingController {
    index(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, search, pay, type, product, arrivalTime, } = req.query;
                const criteria = { isDeleted: false };
                const searchCriteria = { designation: "baler" };
                if (startDate) {
                    criteria.createdAt = { ">=": startDate };
                }
                if (endDate) {
                    criteria.createdAt = { "<=": endDate };
                }
                if (pay) {
                    searchCriteria.pay = pay;
                }
                if (type) {
                    criteria.type = type;
                }
                if (product) {
                    criteria.item = product;
                }
                if (arrivalTime) {
                    criteria.arrivalTime = arrivalTime;
                }
                if (search) {
                    searchCriteria.or = [
                        { firstName: /search/ },
                        { lastName: /search/ },
                        { address: /search/ },
                        { phone: /search/ },
                    ];
                }
                const data = yield Bale_1.Bale.find({ criteria }).populate({
                    path: "user",
                    match: searchCriteria,
                });
                res
                    .status(200)
                    .send({ success: true, message: "data retrieved successfully!", data });
            }
            catch (error) {
                res.status(400).json({ success: false, error, message: error.message });
            }
        });
    }
    create(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user.id;
                const { arrivalTime, items, amount, weight, type } = req.body;
                if (!arrivalTime || !items || !amount || !weight || !type)
                    throw new Error("incomplete items");
                const newData = req.body;
                newData.user = user;
                yield Bale_1.Bale.create(newData);
                res
                    .status(200)
                    .send({ success: true, message: "data retrieved successfully!" });
            }
            catch (error) {
                res.status(400).json({ success: false, error, message: error.message });
            }
        });
    }
    getBalings(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id ? req.params.id : req.user.id;
                const data = yield Bale_1.Bale.findById(id);
                res.status(200).send({
                    success: true,
                    message: "item updated successfully!",
                    data,
                });
            }
            catch (error) {
                res.status(400).json({ success: false, error, message: error.message });
            }
        });
    }
    enable(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield Bale_1.Bale.updateOne({ id: req.params.id }, { isDeleted: true });
                res.status(200).send({
                    success: true,
                    message: "item disabled successfully!",
                });
            }
            catch (error) {
                res.status(400).json({ success: false, error, message: error.message });
            }
        });
    }
    getData(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const { PET, UBC, ONP, BCC, GBS, PWS, name, arrivalTime, startDate, endDate, pay, type } = req.query;
                const criteria = {};
                const SubCriteria = {};
                if (name) {
                    SubCriteria.$or = [{ firstName: /search/ }, { lastName: /search/ }];
                }
                if (arrivalTime)
                    criteria.arrivalTime = arrivalTime;
                if (type)
                    criteria.type = type;
                if (startDate) {
                    criteria.createdAt = {
                        $gte: startDate,
                        $lte: endDate ? endDate : moment(),
                    };
                }
                if (pay)
                    SubCriteria.pay = pay;
                const sorting = yield Bale_1.Bale.find(criteria).populate({
                    path: "user",
                    match: SubCriteria,
                });
                const sortingPromise = sorting.map((sort) => {
                    const item = {};
                    if (UBC) {
                        item.UBC = sort.items.UBC;
                    }
                    if (PWS) {
                        item.PWS = sort.items.PWS;
                    }
                    if (ONP) {
                        item.ONP = sort.items.ONP;
                    }
                    if (BCC) {
                        item.BCC = sort.items.BCC;
                    }
                    if (GBS) {
                        item.GBS = sort.items.GBS;
                    }
                    if (PET) {
                        item.PET = sort.items.PET;
                    }
                    return sort.items = item;
                });
                yield Promise.all(sortingPromise);
                res.status(200).json({ success: true, message: "saved", data: sorting });
            }
            catch (error) {
                res.status(400).json({ success: false, error, message: error.message });
            }
        });
    }
    downloadPdf(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const data = req.body;
                const pdf = new PdfService_1.PdfService();
                const file = yield pdf.generateStaffDataPdf(data);
                res.status(200).json({ success: true, message: "saved", data: file });
            }
            catch (error) {
            }
        });
    }
};
tslib_1.__decorate([
    core_1.Get(""),
    core_1.Middleware([auth_1.isAdmin]),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "index", null);
tslib_1.__decorate([
    core_1.Post("new"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "create", null);
tslib_1.__decorate([
    core_1.Get("user/:id"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "getBalings", null);
tslib_1.__decorate([
    core_1.Post("remove/:id"),
    core_1.Middleware([auth_1.isDev]),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "enable", null);
tslib_1.__decorate([
    core_1.Get("data"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "getData", null);
tslib_1.__decorate([
    core_1.Post('data/pdf'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SortingController.prototype, "downloadPdf", null);
SortingController = tslib_1.__decorate([
    core_1.Controller("api/bale"),
    core_1.ClassMiddleware([auth_1.checkJwt])
], SortingController);
exports.SortingController = SortingController;
