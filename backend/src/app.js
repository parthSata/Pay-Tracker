import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/** Normalize env origins: trim, strip quotes, no trailing slash (browsers send Origin without it). */
function parseAllowedOrigins(raw) {
    if (!raw || typeof raw !== "string") return [];
    return raw
        .split(",")
        .map((o) => o.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
        .map((o) => o.replace(/\/$/, ""));
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    console.warn(
        "[CORS] CORS_ORIGIN is empty. Set it in Render (Environment) to your frontend URL(s), comma-separated. " +
            "Example: https://pay-tracker-eight.vercel.app — local .env is not deployed."
    );
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }
            const normalized = origin.replace(/\/$/, "");
            if (allowedOrigins.length === 0) {
                if (process.env.NODE_ENV === "production") {
                    return callback(null, false);
                }
                return callback(null, true);
            }
            if (allowedOrigins.includes(normalized)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

app.use(
    express.json({
        limit: "16kb",
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


// Routes import
import userRouter from './routes/user.routes.js'
import invoiceRouter from './routes/invoice.routes.js'
import adminRouter from './routes/admin.routes.js'
import notificationRouter from './routes/notification.routes.js'

// Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/invoices", invoiceRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/notifications", notificationRouter)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});

app.use((err, req, res, _next) => {
    const statusCode =
        err.statusCode ??
        err.status ??
        (err.name === "ValidationError" ? 400 : undefined) ??
        (err.code === 11000 ? 409 : undefined) ??
        500;
    const message = err.message || "Internal Server Error";
    if (statusCode >= 500) {
        console.error("[API]", req.method, req.originalUrl, err);
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV !== "production" && statusCode >= 500 && err.stack
            ? { stack: err.stack.split("\n").slice(0, 8).join("\n") }
            : {}),
    });
});

export { app };
