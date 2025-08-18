import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // Used for accessing cookies form user's browser and perform operations on that.

const app = express();

// configurations of CORS, json files, URL and public assets folder.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json(
    {
        limit: "30kb",
    }
));

app.use(express.urlencoded(
    { 
    extended: true, limit: "30kb" 
    }
));

app.use(express.static("public"));
app.use(cookieParser());

// routes import (segration)
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subsRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import likeRouter from "./routes/like.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import commentsRouter from "./routes/comment.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js";
import videoInteractionRouter from "./routes/videoInteraction.routes.js";
import adminRouter from "./routes/admin.routes.js";
import watchHistoryRouter from "./routes/watchHistory.routes.js";
import videoViewRouter from "./routes/videoView.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import searchRouter from "./routes/search.routes.js";
import downloadRouter from "./routes/download.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";


// routes declarations
// app.use("/users", userRouter);  used as a middleware here. Ref. example file in backend folder.
app.use("/api/v1/users", userRouter); // standard pratice to define api version.
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subDetail", subsRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/video-interactions", videoInteractionRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/watch-history", watchHistoryRouter);
app.use("/api/v1/video-views", videoViewRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/download", downloadRouter);

// Error handling middleware (must be last)
app.use(errorHandler);





export default app; // export {app}; both are same thing.