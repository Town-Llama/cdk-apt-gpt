import cors from "cors";
import express from "express";
import { errorResponder } from "./middleware/errorResponder";

export const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(apiRoutes);
app.use(errorResponder);

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