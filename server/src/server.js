"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const error_1 = require("./middleware/error");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()) || true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.use(error_1.errorHandler);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`StarCoreWeb server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map