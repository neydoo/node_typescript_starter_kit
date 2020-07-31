const moment = require("moment");
import { NextFunction, Request, Response } from "express";
import {
  Controller,
  ClassMiddleware,
  Get,
  Put,
  Post,
  Delete,
} from "@overnightjs/core";
import { AbstractController } from "./AbstractController";
import { RequestRepository as Repository } from "../abstract/RequestRepository";
import { checkJwt, isValidUser } from "../middleware/auth";
import { RequestM, Request as ItemRequest, Status } from "../models/Request";
import { RequestService } from "../service/RequestService";
import NotificationsService from "../service/NotificationsService";
import PaginationService from "../service/PaginationService";
import { RecyclePointRecord } from "../models/RecyclePointRecord";
import { UserNotification } from "../models/UserNotification";
import { User, Designation } from "../models/User";

@Controller("api/request")
@ClassMiddleware([checkJwt])
export class RequestController extends AbstractController {
  private request: any = new RequestService();
  constructor() {
    super(new Repository());
  }

  @Get("")
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, status, type, search } = req.query;
      const criteria: any = {
        isDeleted: false,
      };
      const searchCriteria: any = {
        isDeleted: false,
      };
      if (type) {
        criteria.type = type;
      }
      if (startDate) {
        criteria.createdAt = {
          $gte: startDate,
          $lte: endDate ? endDate : moment(),
        };
      }

      if (status) {
        criteria.status = status;
      }

      if (search) {
        searchCriteria.or = [
          { firstName: /search/ },
          { address: /search/ },
          { phone: /search/ },
        ];
      }
      const request = await ItemRequest.find(criteria)
        .populate("requestedBy")
        .populate({ path: "acceptedBy", match: searchCriteria })
        .populate("redemptionItem");

      if (request.length) {
        const requestPromise = request.map(async (r: any) => {
          if (r?.type === "redemption") {
            const transaction = await RecyclePointRecord.findOne({
              transactionId: r.id,
              type: "deduction",
            });
            r.transaction = transaction;
          }
        });
        await Promise.all(requestPromise);
      }

      res.status(200).send({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("new")
  public async createRequest(req: Request, res: Response): Promise<void> {
    try {
      // console.log(req);
      const request: RequestM = await this.request.create(req);

      res.status(200).json({
        success: true,
        data: request,
        message: "request created successfully!",
      });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Put("update/:id")
  public async updateRequest(req: Request, res: Response): Promise<void> {
    try {
      const request: RequestM = await this.request.update(req);

      res.status(200).json({
        success: true,
        data: request,
        message: "request updated successfully",
      });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }
  @Post("accept/:id")
  public async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const request: any = await this.request.accept(req);
      const notification = new NotificationsService();

      const { requestedBy } = request;

      await UserNotification.create({
        body: "your recycle request has been accepted",
        title: "We'll be visiting soon",
        userId: requestedBy.id,
      });

      res.status(200).json({
        success: true,
        data: request,
        message: "request updated successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("collect/:id")
  public async markAsCollected(req: any, res: Response): Promise<void> {
    try {
      const itemrequest: any = await ItemRequest.findById(req.params.id);
      let items;

      if (itemrequest.type === "redemption")
        throw new Error("invalid request selected");

      if (itemrequest.type === "recycle") {
        if (itemrequest.status === "collected")
          throw new Error("request is already collected");

        items = req.body.items ? req.body.items : itemrequest.items;
        if (!items) {
          throw new Error("there are no recycle items for this request");
        }
      }
      itemrequest.status = Status.Collected;
      await itemrequest.save();

      const users = await User.find({
        designation: Designation.Staff,
        isDeleted: false,
      });

      users.forEach(async (user) => {
        await UserNotification.create({
          userId: user.id,
          title: "recycle collected",
          body: `A recycle request has been collected`,
        });
      });

      res.status(200).json({
        success: true,
        data: itemrequest,
        message: "request updated successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Get(":requestId")
  public async findRequest(req: Request, res: Response): Promise<void> {
    try {
      const request: any = await ItemRequest.findById(req.params.requestId);

      if (request?.type === "redemption") {
        const transaction = await RecyclePointRecord.findOne({
          transactionId: request.id,
          type: "deduction",
        });
        request.transaction = transaction;
      }

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("decline/:requestId")
  public async declineRequest(req: Request, res: Response): Promise<void> {
    try {
      const notification = new NotificationsService();
      const request: any = await ItemRequest.findOne({
        _id: req.params.requestId,
        status: Status.Pending,
      }).populate("requestedBy");

      request.status = Status.Declined;
      const details = "redemption declined";
      await this.request.addPoints(
        request.points,
        request.id,
        request.requestedBy,
        details
      );
      request.save();

      await UserNotification.create({
        title: "Request declined",
        userId: request.requestedBy.id,
        body: `your request has been declined`,
      });

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Post("approve/:requestId")
  public async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const request: any = await ItemRequest.findOne({
        _id: req.params.requestId,
        status: Status.Pending,
      });
      request.status = Status.Approved;

      request.save();

      await UserNotification.create({
        title: "Request approved",
        userId: request.requestedBy.id,
        body: `your request has been approved`,
      });

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Get("list/user")
  public async getUserRecycleRequests(req: any, res: Response): Promise<void> {
    try {
      const { startDate, endDate, status, type } = req.query;
      const criteria: any = {
        requestedBy: req.user.id,
        isDeleted: false,
      };
      if (type) {
        criteria.type = type;
      }

      if (startDate) {
        criteria.createdAt = {
          $lte: endDate ? endDate : moment(),
          $gte: startDate,
        };
      }

      if (status) {
        criteria.status = status;
      }
      const request = await ItemRequest.find(criteria)
        .populate("acceptedBy")
        .populate("requestedBy")
        .populate("redemptionItem");

      // const pagination = new PaginationService();

      // pagination.paginate(ItemRequest,res,1,2,criteria)

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  // @Get("list/user/redemption")
  // public async getUserRedemptionRequests(
  //   req: any,
  //   res: Response
  // ): Promise<void> {
  //   try {
  //     console.log(req.user.id);
  //     const request = await ItemRequest.find({
  //       requestedBy: req.user.id,
  //       isDeleted: false,
  //       type: "redemption",
  //     });

  //     res.status(200).json({ success: true, request });
  //   } catch (error) {
  //     res.status(400).json({ success: false, error, message: error.message });
  //   }
  // }

  @Get("buster/accepted")
  public async fetchAcceptedRequests(req: any, res: Response): Promise<void> {
    try {
      const request = await ItemRequest.find({
        acceptedBy: req.user.id,
      });

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(400).json({ success: false, error, message: error.message });
    }
  }

  @Get("buster/pending")
  public async fetchPendingRequests(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const request = await ItemRequest.find({
        status: Status.Pending,
        type: "recycle",
      });

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(401).json({ success: false, error, message: error.message });
    }
  }

  @Get("buster/completed")
  public async fetchCompletedRequests(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const request = await ItemRequest.find({
        status: Status.Collected,
        type: "recycle",
      });

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(401).json({ success: false, error, message: error.message });
    }
  }

  @Post("remind-buster/:id")
  public async remindBuster(req: Request, res: Response): Promise<void> {
    try {
      const request: any = await ItemRequest.findOne({
        _id: req.params.id,
        status: Status.Accepted,
        type: "recycle",
      })
        .populate("requestedBy")
        .populate("acceptedBy");
      const notification = new NotificationsService();

      if (!request) throw new Error("invalid request selected for reminder");

      await UserNotification.create({
        title: "pickup reminder",
        userId: request.acceptedBy.id,
        body: `${request.requestedBy.firstName} has sent a pickup reminder`,
      });

      res.status(200).json({ success: true, message: "sent reminder" });
    } catch (error) {
      console.log(error);
      res.status(401).json({ success: false, error, message: error.message });
    }
  }

  @Delete("destroy/:id")
  public async destroy(req: Request, res: Response): Promise<void> {
    try {
      await this.request.forceDelete(req.params.id);
      res
        .status(200)
        .send({ success: true, message: "request deleted successfully" });
    } catch (error) {
      res.status(401).json({ success: false, error, message: error.message });
    }
  }
}
