"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const expo_server_sdk_1 = require("expo-server-sdk");
let expo = new expo_server_sdk_1.Expo();
const Notification_1 = require("../models/Notification");
const CoreService_1 = require("./CoreService");
const UtilService_1 = require("./UtilService");
class NotificationsService {
    constructor() {
    }
    triggerNotification(notifications = "notifications", type, data, req, userId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.saveNotification((notifications = "notifications"), type, data, userId);
        });
    }
    saveNotification(notifications = "notifications", type, data, userId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const notify = yield Notification_1.Notification.create({
                userId,
                name: notifications,
                type,
                data: JSON.stringify(data),
            });
            return notify;
        });
    }
    sendRegistrationSMS(number, otp) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const coreService = new CoreService_1.default();
            number = UtilService_1.UtilService.formatPhone(number);
            const message = "Thank you for registering with Recycle Points. Here's your code: " + otp;
            yield coreService.sendSms(message, number);
        });
    }
    sendForgetSMS(number, otp) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const coreService = new CoreService_1.default();
            number = UtilService_1.UtilService.formatPhone(number);
            const message = "You forgot your Recycle Points login pin? Here's your code: " + otp;
            yield coreService.sendSms(message, number);
        });
    }
    sendPushNotification(title, body, tokens) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                let notifications = [];
                if (tokens.length > 1) {
                    for (let pushToken of tokens) {
                        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                            console.error(`Push token ${pushToken} is not a valid Expo push token`);
                            continue;
                        }
                        notifications.push({
                            to: pushToken,
                            title: title,
                            body: body,
                            data: { body },
                        });
                    }
                }
                else {
                    if (!expo_server_sdk_1.Expo.isExpoPushToken(tokens)) {
                        console.error(`Push token ${tokens} is not a valid Expo push token`);
                        notifications.push({
                            to: tokens,
                            title: title,
                            body: body,
                            data: { body },
                        });
                    }
                }
                expo.chunkPushNotifications(notifications);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    sendToken(token) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            expo.chunkPushNotifications([
                {
                    to: token,
                    title: "title",
                    body: "body",
                    data: { body: "body" },
                },
            ]);
        });
    }
}
exports.default = NotificationsService;
