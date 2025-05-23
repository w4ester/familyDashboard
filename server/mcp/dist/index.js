"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const filesystem_1 = __importDefault(require("./routes/filesystem"));
const mcp_1 = __importDefault(require("./routes/mcp"));
// Import logger
const logger_1 = require("./utils/logger");
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3030;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use((0, morgan_1.default)('dev'));
app.use(body_parser_1.default.json());
// Ensure required directories exist
const rootDir = process.env.ROOT_DIR || './';
const dataDirs = (process.env.ALLOWED_DIRS || './data,./uploads').split(',');
for (const dir of dataDirs) {
    const fullPath = path_1.default.join(rootDir, dir);
    fs_extra_1.default.ensureDirSync(fullPath);
    logger_1.logger.info(`Ensured directory exists: ${fullPath}`);
}
// Routes
app.use('/api/filesystem', filesystem_1.default);
app.use('/mcp', mcp_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Start the server
app.listen(PORT, () => {
    logger_1.logger.info(`MCP Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
exports.default = app;
