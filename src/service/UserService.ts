import { v2 as cloudinary } from "cloudinary";
const moment = require("moment");
import Core from "./CoreService";
// const cloudinary = require("cloudinary");

const cloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");
import * as bcrypt from "bcrypt-nodejs";

import Notification from "./NotificationsService";
import { IUserM, User, Designation } from "../models/User";
import { UserRepository as Repository } from "../abstract/UserRepository";
import { UtilService } from "./UtilService";
import File from "../utilities/file";
import { RecyclePoint } from "../models/RecyclePoint";
import { config } from "../config/app";

const clodConfig = {
  cloud_name: config.image.cloud_name,
  api_key: config.image.api_key,
  api_secret: config.image.api_secret,
};

export class UserService {
  protected repository: any;
  protected sms: any;
  private core: any;
  protected notification: any;
  private file = new File();
  constructor() {
    this.repository = new Repository();
    this.core = new Core();
    this.notification = new Notification();

    // set your env variable CLOUDINARY_URL or set the following configuration
  }

  public async create(req: any): Promise<void> {
    const userPayload: IUserM = req.body;
    let { firstName, lastName, phone, designation } = userPayload;
    if (!firstName || !lastName || !phone || !designation)
      throw new Error("incomplete parameters");
    phone = UtilService.formatPhone(phone);

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) throw new Error("user with phonenumber already exists");

    if (!userPayload.password) {
      if (userPayload.designation === "client") {
        const otp = UtilService.generate(5);
        userPayload.otp = otp;
        userPayload.password = otp;
        userPayload.unverified = true;
        const thisMonth = moment().startOf("month");
        const registrationsThisMonth = await User.count({
          designation: Designation.Client,
          createdAt: { $gte: thisMonth },
        });
        let count = '0';

        if(registrationsThisMonth < 1000) count = '0' + registrationsThisMonth
        if(registrationsThisMonth < 100) count = '00' + registrationsThisMonth
        if(registrationsThisMonth < 10) count = '000' + registrationsThisMonth

        const regNo = moment().format("YYYYMM");
        userPayload.regNo = `${regNo}${count}`;
      } else {
        userPayload.password = "123456";
      }
    }
    userPayload.password = bcrypt.hashSync(userPayload.password as string);

    // return console.log(userPayload);

    const createdUser = await this.repository.createNew(userPayload);
    if (userPayload.designation === Designation.Client)
      await this.notification.sendRegistrationSMS(
        userPayload.phone,
        userPayload.otp
      );

    const user = await this.repository.findById(createdUser.id);
    if (createdUser.designation === "client")
      await RecyclePoint.create({ user: createdUser.id });

    user.profileImage = req.body.profileImage
      ? await this.cloudinaryUploader(req.body.profileImage)
      : null;
    user.save();

    this.core.Email(
      user,
      "New Registration",
      this.core.html(
        '<p style="color: #000">Hello ' +
          user.firstName +
          " " +
          user.lastName +
          ", Thank you for registering at Recycle Points.<br> Please click the link below to complete registration https://fashioncastapi.herokuapp.com/api/activate/" +
          user.temporarytoken +
          "</p>"
      )
    );

    this.core.activityLog(req, user.id, "Registered");

    this.notification.triggerNotification(
      "notifications",
      "users",
      {
        user,
        message: { message: user.lastName + " Just created a new account." },
      },
      req,
      user.id
    );

    return user;
  }

  public async createStaff(req: any): Promise<void> {
    const userPayload: IUserM = req.body;
    let { firstName, lastName, phone, designation } = userPayload;
    if (!firstName || !lastName || !phone || !designation)
      throw new Error("incomplete parameters");
    phone = UtilService.formatPhone(phone);

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) throw new Error("user with phonenumber already exists");

    if (!userPayload.password) {
      if (userPayload.designation === "client") {
        const otp = UtilService.generate(5);
        userPayload.otp = otp;
        userPayload.password = otp;
        userPayload.unverified = true;
      } else {
        userPayload.password = "123456";
      }
    }
    userPayload.password = bcrypt.hashSync(userPayload.password as string);

    // return console.log(userPayload);

    const createdUser = await this.repository.createNew(userPayload);
    if (userPayload.designation === Designation.Client)
      await this.notification.sendRegistrationSMS(
        userPayload.phone,
        userPayload.otp
      );

    const user = await this.repository.findById(createdUser.id);
    if (createdUser.designation === "client")
      await RecyclePoint.create({ user: createdUser.id });

    user.profileImage = req.body.profileImage
      ? await this.base64Uploader(req.body.profileImage)
      : null;
    user.save();

    this.core.Email(
      user,
      "New Registration",
      this.core.html(
        '<p style="color: #000">Hello ' +
          user.firstName +
          " " +
          user.lastName +
          ", Thank you for registering at Recycle Points.<br> Please click the link below to complete registration https://fashioncastapi.herokuapp.com/api/activate/" +
          user.temporarytoken +
          "</p>"
      )
    );

    this.core.activityLog(req, user.id, "Registered");

    this.notification.triggerNotification(
      "notifications",
      "users",
      {
        user,
        message: { message: user.lastName + " Just created a new account." },
      },
      req,
      user.id
    );

    return user;
  }

  public async update(req: any): Promise<any> {
    const userPayload: IUserM = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (userPayload.password) {
      userPayload.password = bcrypt.hashSync(req.body.password);
    }

    if (userPayload.regNo) {
      delete userPayload.regNo;
    }
    if (userPayload.phone) {
      const existingPhone = await User.findOne({ phone: userPayload.phone });
      if (existingPhone && existingPhone.id !== userToUpdate?.id)
        throw new Error("user with phonenumber already exists");
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // if (!oldPassword || !newPassword) throw new Error("missing parameters");
    if (oldPassword) {
      let user = await User.findOne({ _id: req.user.id }).select("+password");
      if (user) {
        if (confirmPassword && confirmPassword !== newPassword)
          throw new Error("passwords do not match");
        if (!user.comparePassword(oldPassword))
          throw new Error("invalid old password");

        user.password = bcrypt.hashSync(newPassword);
        await user.save();
      }
    } else {
      const existingUser = await this.repository.findById(req.params.userId);
      if (existingUser?.firstTimeLogin) userPayload.firstTimeLogin = false;
      const user = await this.repository.updateData(
        req.params.userId,
        userPayload
      );

      user
        ? (user.profileImage = req.body.profileImage
            ? await this.cloudinaryUploader(req.body.profileImage)
            : user?.profileImage)
        : null;
      await user?.save();
      return user;
    }

    // this.core.Email(
    //   user,
    //   "Profile Updated",
    //   this.core.html(
    //     `<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your profile has been updated successfully. </p>`
    //   )
    // );
  }
  public async updateWeb(req: any): Promise<any> {
    const userPayload: IUserM = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (userPayload.password) {
      userPayload.password = bcrypt.hashSync(req.body.password);
    }

    if (userPayload.regNo) {
      delete userPayload.regNo;
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // if (!oldPassword || !newPassword) throw new Error("missing parameters");
    if (oldPassword) {
      let user = await User.findOne({ _id: req.user.id }).select("+password");
      if (user) {
        if (confirmPassword && confirmPassword !== newPassword)
          throw new Error("passwords do not match");
        if (!user.comparePassword(oldPassword))
          throw new Error("invalid old password");

        user.password = bcrypt.hashSync(newPassword);
        await user.save();
      }
    } else {
      const existingUser = await this.repository.findById(req.params.userId);
      if (existingUser?.firstTimeLogin) userPayload.firstTimeLogin = false;
      const user = await this.repository.updateData(
        req.params.userId,
        userPayload
      );

      user
        ? (user.profileImage = req.body.profileImage
            ? await this.base64Uploader(req.body.profileImage)
            : user?.profileImage)
        : null;
      await user?.save();
      return user;
    }

    // this.core.Email(
    //   user,
    //   "Profile Updated",
    //   this.core.html(
    //     `<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your profile has been updated successfully. </p>`
    //   )
    // );
  }

  public async resetPassword(req: any) {
    const user = await this.repository.findOne({
      or: [{ phone: req.body.email }, { email: req.body.email }],
    });
    const password = UtilService.generate(5);
    user.password = bcrypt.hashSync(password);
    user.otp = bcrypt.hashSync(password);

    await user.save();
    await this.notification.sendForgetSMS(user.phone, password);

    this.core.Email(
      user,
      "Password Reset",
      this.core.html(
        `<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your password has been reset. Your new password is ${password} </p>`
      )
    );
    return user;
  }
  public async resendOtp(req: any) {
    const user = await this.repository.findOne({ phone: req.body.phone });
    const password = UtilService.generate(5);
    user.password = bcrypt.hashSync(password);
    user.otp = bcrypt.hashSync(password);

    await user.save();
    await this.notification.sendForgetSMS(user.phone, password);

    this.core.Email(
      user,
      "Password Reset",
      this.core.html(
        `<p style="color: #000">Hello ${user.firstName} ${user.lastName}, \n\r Your password has been reset. Your new password is ${password} </p>`
      )
    );
    return user;
  }

  public async cloudinaryUploader(image: any) {
    try {
      cloudinary.config(clodConfig);

      const formattedImage = `data:image/png;base64,${image}`;
      const url = await cloudinary.uploader.upload(formattedImage);

      return url.secure_url;
    } catch (error) {
      console.log(error);
    }
  }

  public async base64Uploader(image: any) {
    try {
      cloudinary.config(clodConfig);

      const url = await cloudinary.uploader.upload(image);

      return url.secure_url;
    } catch (error) {
      console.log(error);
    }
  }
}
