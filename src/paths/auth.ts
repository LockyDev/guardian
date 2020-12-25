import { Connection } from "mysql2";
import { Application } from "express";
import { compare, hash } from "bcrypt";
import crypto from "crypto";
import { v4 } from "uuid";
import {
  DBError,
  InvalidTokenError,
  UserNotActiveError,
} from "../models/apiResults/Error";
import {
  UserCreationSuccess,
  UserLoginSuccess,
} from "../models/apiResults/Success";

export const registerAuthPaths = (app: Application, dbConn: Connection) => {
  const commonPath = "/auth";

  const generateAuthToken = async (userId: string): Promise<string> => {
    var token = crypto.randomBytes(64).toString("hex");
    await dbConn
      .promise()
      .execute(
        `
        INSERT INTO AuthTokens (userId, authToken)
        VALUES('${userId}', X'${token}')
        `
      )
      .catch((reason) => {
        console.error("Error when generating auth token: ", reason);
      });
    return token;
  };

  const renewAuthToken = async (authToken: string): Promise<string> => {
    await dbConn
      .promise()
      .execute(
        `UPDATE AuthTokens SET lastAccessedTimestamp = CURRENT_TIMESTAMP WHERE authToken = X'${authToken}'`
      )
      .catch((reason) => {
        console.error("Error when renewing authToken: ", reason);
      });
    return authToken;
  };

  /**
   * method: POST
   * path: /register
   * description: creates a new user entry
   * parameters:
   *  username | plaintext
   *  password | plaintext
   *  email | plaintext
   */
  app.post(`${commonPath}/register`, async (req, res) => {
    let userFullName = req.body["fullName"];
    let password = req.body["password"];
    let email = req.body["email"];

    var hashPass = await hash(password, 10);
    var userId = v4();

    dbConn.query(
      `
      INSERT INTO Users (userId, userFullName, passHash, verified, email) 
      VALUES('${userId}', '${userFullName}', '${hashPass}', 0, '${email}')
      `,
      async (err, results, fields) => {
        if (err) {
          res.statusCode = 502;
          res.send(DBError(err));
        } else {
          res.statusCode = 201;
          res.send(
            UserCreationSuccess({
              email: email,
              fullName: userFullName,
              userId: userId,
              verified: false,
              authToken: await generateAuthToken(userId),
            })
          );
        }
      }
    );
  });

  /**
   * method: POST
   * path: /login
   * description: creates an authenticated session with an auth token for a user
   * parameters:
   *  email | plaintext
   *  password | plaintext
   */
  app.post(`${commonPath}/login`, async (req, res) => {
    let email = req.body["email"];
    let password = req.body["password"];
    dbConn.query(
      `
      SELECT userId, passHash FROM Users 
      WHERE email = '${email}' 
      AND verified = 1
      `,
      async (
        err,
        results: Array<{ userId: string; passHash: string }>,
        fields
      ) => {
        if (err) {
          res.statusCode = 502;
          res.send(DBError(err));
        } else if (results.length !== 1) {
          res.statusCode = 401;
          res.send(UserNotActiveError());
        } else {
          const passwordValitity = await compare(password, results[0].passHash);
          if (passwordValitity) {
            res.statusCode = 200;
            res.send(
              UserLoginSuccess(
                await generateAuthToken(results[0].userId),
                results[0].userId
              )
            );
          }
        }
      }
    );
  });

  /**
   * method: GET
   * path: /validate
   * description: validates an auth token
   * parameters:
   *  authToken | plaintext hex
   *  userId | guid
   */
  app.get(`${commonPath}/validate`, async (req, res) => {
    let authToken = req.query["authToken"];
    let userId = req.query["userId"];

    var result = (await dbConn
      .promise()
      .query(
        `
        SELECT userId, HEX(authToken) as authToken 
        FROM AuthTokens 
        WHERE userId = '${userId}' 
        AND authToken = X'${authToken}'
        AND lastAccessedTimestamp >= now() - INTERVAL 28 DAY
        `
      )
      .catch((err) => console.error(err))) as
      | [[{ userId: string; authToken: string }]]
      | undefined
      | null;
    if (result && result[0] && result[0][0]) {
      res.statusCode = 200;
      res.send(
        UserLoginSuccess(
          await renewAuthToken(result[0][0].authToken),
          result[0][0].userId
        )
      );
    } else {
      res.statusCode = 401;
      res.send(InvalidTokenError());
    }
  });
};
