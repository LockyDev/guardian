require('dotenv').config();

import {Connection, createConnection} from 'mysql2';

import express from 'express';
import bodyParser from 'body-parser';
import { exit } from 'process';
import { registerAuthPaths } from './paths';

const mysqlcs = process.env.MYSQL_CONNECTION_STRING;
const schema: "prod" | "dev" = process.env.MYSQL_SCHEMA === "prod" ? "prod" : "dev";

let dbConn: Connection;

try {
    dbConn = createConnection(mysqlcs!);
} catch (error) {
    console.error("There was no connection string specified for the sql server");
    exit(-1);
}

const app = express();
const port = process.env.PORT ? process.env.PORT : 8082;

app.use(bodyParser.json())
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
})

registerAuthPaths(app, dbConn)

app.listen(port, () => console.log(`Authentication microservice listening on port: ${port}!`));