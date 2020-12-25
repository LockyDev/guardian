import { QueryError } from "mysql2";

export interface IErrorResult {
  description: string;
}

export const DBError = (err: QueryError): IErrorResult => {
  // log error
  console.log(err.message);
  return { description: "A database error has occurred" };
};

export const UserNotActiveError = (): IErrorResult => {
  return {
    description:
      "The user does not exist or has not yet verified their account",
  };
};

export const InvalidTokenError = (): IErrorResult => {
  return {
    description:
      "The auth token has expired or the auth token does not exist for this user"
  }
}
