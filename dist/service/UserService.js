"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const tslib_1 = require("tslib");
const CoreService_1 = require("./CoreService");
const NotificationsService_1 = require("./NotificationsService");
const UserRepository_1 = require("../abstract/UserRepository");
const UtilService_1 = require("./UtilService");
const file_1 = require("../utilities/file");
const bcrypt = require("bcrypt-nodejs");
const RecyclePoint_1 = require("../models/RecyclePoint");
class UserService {
    constructor() {
        this.file = new file_1.default();
        this.repository = new UserRepository_1.UserRepository();
        this.core = new CoreService_1.default();
        this.notification = new NotificationsService_1.default();
    }
    create(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const userPayload = req.body;
            const { firstName, lastName, phone, designation } = userPayload;
            if (!firstName || !lastName || !phone || !designation)
                throw new Error("incomplete parameters");
            if (!userPayload.password) {
                if (userPayload.designation === "client") {
                    const otp = UtilService_1.UtilService.generate(4);
                    userPayload.otp = otp;
                    userPayload.password = otp;
                    yield this.notification.sendRegistrationSMS(userPayload.phone, otp);
                }
                else {
                    userPayload.password = "123456";
                }
            }
            userPayload.password = bcrypt.hashSync(userPayload.password);
            const createdUser = yield this.repository.createNew(userPayload);
            const user = yield this.repository.findById(createdUser.id);
            if (createdUser.designation === "client")
                yield RecyclePoint_1.RecyclePoint.create({ user: createdUser.id });
            user.profileImage = req.body.profileImage
                ? this.file.localUpload(req.body.profileImage, "/images/profile/", ".png")
                : null;
            user.save();
            this.core.Email(user, "New Registration", this.core.html('<p style="color: #000">Hello ' +
                user.firstName +
                " " +
                user.lastName +
                ", Thank you for registering at Recycle Points.<br> Please click the link below to complete registration https://fashioncastapi.herokuapp.com/api/activate/" +
                user.temporarytoken +
                "</p>"));
            this.core.activityLog(req, user.id, "Registered");
            this.notification.triggerNotification("notifications", "users", {
                user,
                message: { message: user.lastName + " Just created a new account." },
            }, req, user.id);
            return user;
        });
    }
    update(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const userPayload = req.body;
            if (userPayload.password) {
                userPayload.password = bcrypt.hashSync(req.body.password);
            }
            const existingUser = yield this.repository.findById(req.params.userId);
            if (existingUser.firstTimeLogin)
                userPayload.firstTimeLogin = false;
            const user = yield this.repository.updateData(req.params.userId, userPayload);
            user.profileImage = req.body.profileImage
                ? this.file.localUpload(req.body.profileImage, "/images/profile/", ".png")
                : user.profileImage;
            user.save();
            this.core.Email(user, "Profile Updated", this.core.html(`<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your profile has been updated successfully. </p>`));
            this.core.activityLog(req, user.id, "Update Profile");
            this.notification.triggerNotification("notifications", "users", {
                user,
                message: { message: user.lastName + " Just created a new account." },
            }, req, user.id);
            return user;
        });
    }
    resetPassword(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const user = yield this.repository.findOne({
                or: [{ phone: req.body.email, email: req.body.email }],
            });
            const password = UtilService_1.UtilService.generate(5);
            user.password = bcrypt.hashSync(password);
            user.otp = bcrypt.hashSync(password);
            yield user.save();
            yield this.notification.sendForgetSMS(user.phone, password);
            this.core.Email(user, "Password Reset", this.core.html(`<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your password has been reset. Your new password is ${password} </p>`));
            return user;
        });
    }
}
exports.UserService = UserService;
