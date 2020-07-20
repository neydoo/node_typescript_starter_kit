import { NextFunction, Request, Response } from "express";
import {
  Controller,
  ClassMiddleware,
  Get,
  Put,
  Post,
  Delete,
  Middleware,
} from "@overnightjs/core";
import { checkJwt, isValidUser, isAdmin, isDev } from "../middleware/auth";
import { RedemptionItem, RedemptionItemM } from "../models/RedemptionItem";
import File from "../utilities/file";

@Controller("api/redemption-item")
@ClassMiddleware([checkJwt])
export class RedemptionItemController {
  private file = new File();
  @Get("")
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const data: RedemptionItemM[] = await RedemptionItem.find({
        isDeleted: false,
      });
      res
        .status(200)
        .send({ success: true, message: "data retrieved successfully!", data });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("new")
  @Middleware([isDev])
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: RedemptionItemM = req.body;
      const { image, name, recyclePoints } = data;
      if (!name || !recyclePoints) throw new Error(" incomplete data");

      data.image = data.image
        ? this.file.localUpload(
            req.body.image,
            "/images/redemptionitems/",
            ".png"
          )
        : null;

      const newData = await RedemptionItem.create(data);

      res.status(200).send({
        success: true,
        message: "item created successfully!",
        data: newData,
      });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("remove/:id")
  @Middleware([isDev])
  public async remove(req: Request, res: Response): Promise<void> {
    try {
      await RedemptionItem.updateOne(
        { id: req.params.id },
        { isDeleted: true }
      );

      res.status(200).send({
        success: true,
        message: "item deleted successfully!",
      });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("enable/:id")
  @Middleware([isDev])
  public async enable(req: Request, res: Response): Promise<void> {
    try {
      await RedemptionItem.updateOne(
        { id: req.params.id },
        { isDeleted: false }
      );

      res.status(200).send({
        success: true,
        message: "item enabled successfully!",
      });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }
}