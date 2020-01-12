import { NextFunction, Request, Response } from "express";
import { Controller, Get, Put, Post, Delete } from "@overnightjs/core";
import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import "../config/passport";
import { config } from "../config/app";
import File from "../utilities/file";
import { AbstractController } from "./AbstractController";
import { IUser as Repository } from "../Abstract/UserInterface";

@Controller("api/user")
export class UserController extends AbstractController {
    protected file: any;

    constructor(repository: Repository) {
        super(repository);
        this.file = new File();
    }

    @Post("/register")
    public async registerUser(req: Request, res: Response): Promise<void> {

        const user = await this.repository.createNew(req.body);
        user.profile_image = this.file.localUpload(req.body.profile_image, "/images/profile/", req.body.last_name, ".png");
        user.cloud_image = this.file.cloudUpload(req.body.profile_image);
        user.save();

        const token = jwt.sign({ username: user.username, scope : req.body.scope }, config.app.JWT_SECRET);
        res.status(200).json({ user, token });
    }

    @Post("/login")
    public authenticateUser(req: Request, res: Response, next: NextFunction) {
        passport.authenticate("local",  (err, user, info) => {
            // no async/await because passport works only with callback ..
            if (err) { return next({err}); }

            if (!user) {
                return res.status(401).json({ status: "error", code: "unauthorized" });
            } else {
                const token = jwt.sign({ username: user.username }, config.app.JWT_SECRET);
                res.status(200).json({ user, token });
            }
        });
    }
}