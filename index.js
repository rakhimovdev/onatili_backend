require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const UserModel = require("./models/User");
const clickRoutes = require('./routes/click')// Routers
const Student = require("./routes/Student");
const UserRouter = require("./routes/User");
const Test = require("./routes/Test");
const Score = require("./routes/Score");
const Testl = require("./routes/Testl");
const ScoreL = require("./routes/Scorel");
const Writing = require("./routes/writing");
const ScoreW = require("./routes/ScoreW");
const Admin = require("./routes/Admin");
const AiWriting = require("./routes/AiWriting");
const WritingAi = require("./routes/WritingAi");
const AuthRouter = require("./routes/Auth");
const Results = require("./routes/Results");

// 1. Avval CORS
const normalizeOrigin = (origin = "") =>
    String(origin || "")
        .trim()
        .replace(/\/+$/, "");

const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS
]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const allowedOrigins = new Set([
    "https://onatili-two.vercel.app",
    "https://unversels.vercel.app",
    "https://unverse-frontend.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...configuredOrigins
].map((origin) => normalizeOrigin(origin)));

const allowedOriginPatterns = [
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i
];

const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin) {
        return true;
    }

    if (allowedOrigins.has(normalizedOrigin)) {
        return true;
    }

    return allowedOriginPatterns.some((pattern) =>
        pattern.test(normalizedOrigin)
    );
};

const isDev = process.env.NODE_ENV !== "production";

const corsOptionsDelegate = (req, callback) => {
    const requestOrigin = normalizeOrigin(req.header("Origin"));

    if (!requestOrigin || isDev || isAllowedOrigin(requestOrigin)) {
        return callback(null, {
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            optionsSuccessStatus: 200,
            preflightContinue: false
        });
    }

    console.log("❌ Not allowed origin:", requestOrigin);

    // Do not throw here: throwing makes preflight fail with HTTP 500.
    return callback(null, {
        origin: false,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        optionsSuccessStatus: 200,
        preflightContinue: false
    });
};

app.use(cors(corsOptionsDelegate));
app.options(/.*/, cors(corsOptionsDelegate));

// 2. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. Required env vars
const url = process.env.MONGO_URI;

if (!url || !process.env.JWT_SECRET) {
    console.error("❌ Required environment variables are missing. Check MONGO_URI and JWT_SECRET.");
    process.exit(1);
}

mongoose.connect(url)
    .then(async () => {
        console.log("✅ MongoDBga ulandi");

        try {
            const [studentTypeResult, verificationResult] = await Promise.all([
                UserModel.updateMany(
                    {
                        role: "student",
                        $or: [
                            { studentType: { $exists: false } },
                            { studentType: null },
                            { studentType: "" }
                        ]
                    },
                    { $set: { studentType: "insider" } }
                ),
                UserModel.updateMany(
                    { isVerified: { $exists: false } },
                    { $set: { isVerified: true } }
                )
            ]);

            if (studentTypeResult?.modifiedCount) {
                console.log(`✅ ${studentTypeResult.modifiedCount} student insider qilib yangilandi`);
            }
            if (verificationResult?.modifiedCount) {
                console.log(`✅ ${verificationResult.modifiedCount} user verified flag bilan yangilandi`);
            }
        } catch (err) {
            console.error("❌ User migratsiya xatosi:", err);
        }
    })
    .catch((error) => console.error("❌ MongoDB ulanishda xato:", error));

// 5. Routes
app.use("/auth", AuthRouter);
app.use("/student", Student);
app.use("/user", UserRouter);
app.use("/test", Test);
app.use("/score", Score);
app.use("/testl", Testl);   // 🔥 BU JOYNI QO‘SHDIM
app.use("/scorel", ScoreL);
app.use("/posts", Writing);
app.use("/scorew", ScoreW);   // writing route uchun
app.use("/admin", Admin);
app.use("/ai", AiWriting);
app.use("/api/writing", WritingAi);
app.use("/results", Results);
app.use('/api/click', clickRoutes)
// 6. Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portda ishlamoqda`);
});
