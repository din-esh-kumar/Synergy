import { UserDocument } from "../../config/user.model";

declare global {
  namespace Express {
    interface User {
      id: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
