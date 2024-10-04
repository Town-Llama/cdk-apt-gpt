import cors from "cors";
import express from "express";
import { errorResponder } from "./middleware/errorResponder";
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');

export const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(apiRoutes);
app.use(errorResponder);

// Middleware to add request ID to each request
app.use((req: any, res, next) => {
    const requestId = uuidv4();
    req.requestId = requestId;  // Attach the request ID to the request object
    res.setHeader('X-Request-Id', requestId); // Optionally add it to the response headers

    const originalConsoleLog = console.log;
    console.log = (...args) => {
        originalConsoleLog(`[Request ID: ${requestId}]`, ...args);
    };

    const originalConsoleError = console.error;
    console.error = (...args) => {
        originalConsoleError(`[Request ID: ${requestId}]`, ...args);
    };

    next();
});

// Morgan token to log request ID
morgan.token('id', function getId(req: any) {
    return req.requestId;
});

const loggerFormat = '[:date[clf]] :id :method :url :status :response-time ms - :res[content-length]';
app.use(morgan(loggerFormat));

//
import blog from "./api/blog";
app.use(blog);
//
import book from "./api/book";
app.use(book);
//
import chat from "./api/chat";
app.use(chat);
//
import fetch_apt from "./api/fetch_apt";
app.use(fetch_apt);
//
import health_check from "./api/health_check";
app.use(health_check);
//
import location from "./api/location";
app.use(location);
//
import models from "./api/models";
app.use(models);
//
import route from "./api/route";
app.use(route);
//
import search from "./api/search";
app.use(search);
//
import waitlist from "./api/waitlist";
app.use(waitlist);

import short from "./api/short";
app.use(short);

import review from "./api/review";
app.use(review);