import { IUser } from "../config/User.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
