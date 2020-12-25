import { IUserDetail } from "../AuthModels";

export interface ISuccessResult {
  data: any;
}

export const UserCreationSuccess = (
  userDetail: IUserDetail
): ISuccessResult => {
  return { data: userDetail };
};

export const UserLoginSuccess = (authToken: string, userId: string): ISuccessResult => {
  return {
    data: {
      authToken,
      userId
    },
  };
};
