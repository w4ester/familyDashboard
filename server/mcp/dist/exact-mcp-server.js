"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var body_parser_1 = __importDefault(require("body-parser"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var yargs_parser_1 = __importDefault(require("yargs-parser"));
var args = (0, yargs_parser_1.default)(process.argv.slice(2));
var port = process.env.PORT ? parseInt(process.env.PORT) : 3030;
var allowedDirs = args._;
if (allowedDirs.length === 0) {
    console.error("Error: No directory provided.");
    console.error("Usage: npx server-filesystem /path/to/dir1 /path/to/dir2 ...");
    process.exit(1);
}
// Make sure all allowed directories exist and are absolute paths
var allowedAbsoluteDirs = allowedDirs.map(function (dir) { return path_1.default.resolve(dir); });
for (var _i = 0, allowedAbsoluteDirs_1 = allowedAbsoluteDirs; _i < allowedAbsoluteDirs_1.length; _i++) {
    var dir = allowedAbsoluteDirs_1[_i];
    if (!fs_1.default.existsSync(dir)) {
        try {
            var mkdirpSync = require('mkdirp').sync;
            mkdirpSync(dir);
            console.log("Created directory: ".concat(dir));
        }
        catch (error) {
            console.error("Failed to create directory ".concat(dir, ": ").concat(error));
            process.exit(1);
        }
    }
}
// Create Express app
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json({ limit: "50mb" }));
// Check if a path is allowed
function isPathAllowed(filepath) {
    var absolutePath = path_1.default.resolve(filepath);
    for (var _i = 0, allowedAbsoluteDirs_2 = allowedAbsoluteDirs; _i < allowedAbsoluteDirs_2.length; _i++) {
        var dir = allowedAbsoluteDirs_2[_i];
        if (absolutePath === dir || absolutePath.startsWith(dir + path_1.default.sep)) {
            return true;
        }
    }
    return false;
}
// Handle JSON-RPC requests
app.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var timestamp, reqBody, _a, jsonrpc, id, method, params, response, name_1, args_1, result, _b, errorResponse, response, error_1, errorResponse, response, listName, response, response;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                timestamp = new Date().toISOString();
                reqBody = JSON.stringify(req.body);
                console.log("".concat(timestamp, " [info] [filesystem] Message from client: ").concat(reqBody));
                _a = req.body, jsonrpc = _a.jsonrpc, id = _a.id, method = _a.method, params = _a.params;
                // Validate JSON-RPC 2.0
                if (jsonrpc !== "2.0") {
                    response = {
                        jsonrpc: "2.0",
                        id: id || null,
                        error: {
                            code: -32600,
                            message: "Invalid Request: jsonrpc must be '2.0'"
                        }
                    };
                    console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(response)));
                    return [2 /*return*/, res.json(response)];
                }
                if (!(method === "tools/call")) return [3 /*break*/, 24];
                name_1 = params.name, args_1 = params.arguments;
                result = void 0;
                _d.label = 1;
            case 1:
                _d.trys.push([1, 22, , 23]);
                _b = name_1;
                switch (_b) {
                    case "read_file": return [3 /*break*/, 2];
                    case "write_file": return [3 /*break*/, 4];
                    case "list_directory": return [3 /*break*/, 6];
                    case "create_directory": return [3 /*break*/, 8];
                    case "get_file_info": return [3 /*break*/, 10];
                    case "move_file": return [3 /*break*/, 12];
                    case "search_files": return [3 /*break*/, 14];
                    case "directory_tree": return [3 /*break*/, 16];
                    case "list_allowed_directories": return [3 /*break*/, 18];
                }
                return [3 /*break*/, 20];
            case 2: return [4 /*yield*/, readFile(args_1)];
            case 3:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 4: return [4 /*yield*/, writeFile(args_1)];
            case 5:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 6: return [4 /*yield*/, listDirectory(args_1)];
            case 7:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 8: return [4 /*yield*/, createDirectory(args_1)];
            case 9:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 10: return [4 /*yield*/, getFileInfo(args_1)];
            case 11:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 12: return [4 /*yield*/, moveFile(args_1)];
            case 13:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 14: return [4 /*yield*/, searchFiles(args_1)];
            case 15:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 16: return [4 /*yield*/, directoryTree(args_1)];
            case 17:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 18: return [4 /*yield*/, listAllowedDirectories()];
            case 19:
                result = _d.sent();
                return [3 /*break*/, 21];
            case 20:
                errorResponse = {
                    jsonrpc: "2.0",
                    id: id,
                    error: {
                        code: -32601,
                        message: "Method Not Found: Unknown tool '".concat(name_1, "'")
                    }
                };
                console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(errorResponse)));
                return [2 /*return*/, res.json(errorResponse)];
            case 21:
                response = {
                    jsonrpc: "2.0",
                    id: id,
                    result: result
                };
                console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(response)));
                return [2 /*return*/, res.json(response)];
            case 22:
                error_1 = _d.sent();
                errorResponse = {
                    jsonrpc: "2.0",
                    id: id,
                    error: {
                        code: -32000,
                        message: error_1.message
                    }
                };
                console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(errorResponse)));
                return [2 /*return*/, res.json(errorResponse)];
            case 23: return [3 /*break*/, 25];
            case 24:
                if (method === "tools/list") {
                    response = {
                        jsonrpc: "2.0",
                        id: id,
                        result: {
                            tools: [
                                {
                                    name: "read_file",
                                    description: "Read the contents of a file"
                                },
                                {
                                    name: "write_file",
                                    description: "Write content to a file"
                                },
                                {
                                    name: "list_directory",
                                    description: "List the contents of a directory"
                                },
                                {
                                    name: "create_directory",
                                    description: "Create a new directory"
                                },
                                {
                                    name: "get_file_info",
                                    description: "Get metadata about a file"
                                },
                                {
                                    name: "move_file",
                                    description: "Move or rename a file"
                                },
                                {
                                    name: "search_files",
                                    description: "Search for files matching a pattern"
                                },
                                {
                                    name: "directory_tree",
                                    description: "Get a recursive directory tree"
                                },
                                {
                                    name: "list_allowed_directories",
                                    description: "List the allowed directories"
                                }
                            ]
                        }
                    };
                    console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(response)));
                    return [2 /*return*/, res.json(response)];
                }
                else if (method === "resources/list" || method === "prompts/list") {
                    listName = method.split("/")[0];
                    response = {
                        jsonrpc: "2.0",
                        id: id,
                        result: (_c = {},
                            _c[listName] = [],
                            _c)
                    };
                    console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(response)));
                    return [2 /*return*/, res.json(response)];
                }
                else {
                    response = {
                        jsonrpc: "2.0",
                        id: id,
                        error: {
                            code: -32601,
                            message: "Method Not Found: '".concat(method, "'")
                        }
                    };
                    console.log("".concat(timestamp, " [info] [filesystem] Message from server: ").concat(JSON.stringify(response)));
                    return [2 /*return*/, res.json(response)];
                }
                _d.label = 25;
            case 25: return [2 /*return*/];
        }
    });
}); });
// Start server
app.listen(port, function () {
    console.log("MCP Filesystem server running on port ".concat(port));
    console.log("Allowed directories: ".concat(allowedAbsoluteDirs.join(", ")));
});
// Tool implementations
// Read file
function readFile(args) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, stats, content;
        return __generator(this, function (_a) {
            filePath = path_1.default.resolve(args.path);
            if (!isPathAllowed(filePath)) {
                throw new Error("Path outside allowed directories: ".concat(filePath));
            }
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error("File not found: No file named \"".concat(filePath, "\""));
            }
            stats = fs_1.default.statSync(filePath);
            if (stats.isDirectory()) {
                throw new Error("Cannot read directory as file: ".concat(filePath));
            }
            content = fs_1.default.readFileSync(filePath, 'utf8');
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: content
                        }
                    ]
                }];
        });
    });
}
// Write file
function writeFile(args) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, dirPath, mkdirpLib;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = path_1.default.resolve(args.path);
                    if (!isPathAllowed(filePath)) {
                        throw new Error("Path outside allowed directories: ".concat(filePath));
                    }
                    dirPath = path_1.default.dirname(filePath);
                    if (!!fs_1.default.existsSync(dirPath)) return [3 /*break*/, 2];
                    mkdirpLib = require('mkdirp');
                    return [4 /*yield*/, mkdirpLib(dirPath)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    // Write the file
                    fs_1.default.writeFileSync(filePath, args.content);
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Successfully wrote to ".concat(filePath)
                                }
                            ]
                        }];
            }
        });
    });
}
// List directory
function listDirectory(args) {
    return __awaiter(this, void 0, void 0, function () {
        var dirPath, stats, files, filesList;
        return __generator(this, function (_a) {
            dirPath = path_1.default.resolve(args.path);
            if (!isPathAllowed(dirPath)) {
                throw new Error("Path outside allowed directories: ".concat(dirPath));
            }
            if (!fs_1.default.existsSync(dirPath)) {
                throw new Error("Directory not found: ".concat(dirPath));
            }
            stats = fs_1.default.statSync(dirPath);
            if (!stats.isDirectory()) {
                throw new Error("Not a directory: ".concat(dirPath));
            }
            files = fs_1.default.readdirSync(dirPath);
            filesList = files.map(function (file) {
                var filePath = path_1.default.join(dirPath, file);
                var stats = fs_1.default.statSync(filePath);
                return "[".concat(stats.isDirectory() ? 'DIR' : 'FILE', "] ").concat(file);
            });
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: filesList.join('\n')
                        }
                    ]
                }];
        });
    });
}
// Create directory
function createDirectory(args) {
    return __awaiter(this, void 0, void 0, function () {
        var dirPath, stats, mkdirpLib;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dirPath = path_1.default.resolve(args.path);
                    if (!isPathAllowed(dirPath)) {
                        throw new Error("Path outside allowed directories: ".concat(dirPath));
                    }
                    if (fs_1.default.existsSync(dirPath)) {
                        stats = fs_1.default.statSync(dirPath);
                        if (stats.isDirectory()) {
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: 'text',
                                            text: "Directory already exists: ".concat(dirPath)
                                        }
                                    ]
                                }];
                        }
                        else {
                            throw new Error("Path exists but is not a directory: ".concat(dirPath));
                        }
                    }
                    mkdirpLib = require('mkdirp');
                    return [4 /*yield*/, mkdirpLib(dirPath)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Directory created: ".concat(dirPath)
                                }
                            ]
                        }];
            }
        });
    });
}
// Get file info
function getFileInfo(args) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, stats, info;
        return __generator(this, function (_a) {
            filePath = path_1.default.resolve(args.path);
            if (!isPathAllowed(filePath)) {
                throw new Error("Path outside allowed directories: ".concat(filePath));
            }
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error("File not found: ".concat(filePath));
            }
            stats = fs_1.default.statSync(filePath);
            info = {
                size: stats.size,
                created: stats.birthtime.toISOString(),
                modified: stats.mtime.toISOString(),
                isDirectory: stats.isDirectory(),
                permissions: stats.mode.toString(8).substr(-3)
            };
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(info, null, 2)
                        }
                    ]
                }];
        });
    });
}
// Move file
function moveFile(args) {
    return __awaiter(this, void 0, void 0, function () {
        var sourcePath, destPath, destDir, mkdirpLib;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sourcePath = path_1.default.resolve(args.source);
                    destPath = path_1.default.resolve(args.destination);
                    if (!isPathAllowed(sourcePath) || !isPathAllowed(destPath)) {
                        throw new Error('Path outside allowed directories');
                    }
                    if (!fs_1.default.existsSync(sourcePath)) {
                        throw new Error("Source file not found: ".concat(sourcePath));
                    }
                    destDir = path_1.default.dirname(destPath);
                    if (!!fs_1.default.existsSync(destDir)) return [3 /*break*/, 2];
                    mkdirpLib = require('mkdirp');
                    return [4 /*yield*/, mkdirpLib(destDir)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    // Move the file
                    fs_1.default.renameSync(sourcePath, destPath);
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "File moved from ".concat(sourcePath, " to ").concat(destPath)
                                }
                            ]
                        }];
            }
        });
    });
}
// Helper function for recursive file search
function globFiles(dir, pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var files, results, _i, files_1, file, fullPath, stats, subResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    files = fs_1.default.readdirSync(dir);
                    results = [];
                    _i = 0, files_1 = files;
                    _a.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 5];
                    file = files_1[_i];
                    fullPath = path_1.default.join(dir, file);
                    stats = fs_1.default.statSync(fullPath);
                    if (!stats.isDirectory()) return [3 /*break*/, 3];
                    return [4 /*yield*/, globFiles(fullPath, pattern)];
                case 2:
                    subResults = _a.sent();
                    results = results.concat(subResults);
                    return [3 /*break*/, 4];
                case 3:
                    if (file.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
                        // Match files using pattern
                        results.push(fullPath);
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, results];
            }
        });
    });
}
// Search files
function searchFiles(args) {
    return __awaiter(this, void 0, void 0, function () {
        var dirPath, stats, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dirPath = path_1.default.resolve(args.path);
                    if (!isPathAllowed(dirPath)) {
                        throw new Error("Path outside allowed directories: ".concat(dirPath));
                    }
                    if (!fs_1.default.existsSync(dirPath)) {
                        throw new Error("Directory not found: ".concat(dirPath));
                    }
                    stats = fs_1.default.statSync(dirPath);
                    if (!stats.isDirectory()) {
                        throw new Error("Not a directory: ".concat(dirPath));
                    }
                    return [4 /*yield*/, globFiles(dirPath, args.pattern)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: results.join('\n')
                                }
                            ]
                        }];
            }
        });
    });
}
// Helper function to build directory tree
function buildTree(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var basename, stats, files, children, _i, files_2, file, filePath, childNode, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    basename = path_1.default.basename(dir);
                    stats = fs_1.default.statSync(dir);
                    if (!stats.isDirectory()) {
                        return [2 /*return*/, { name: basename, type: 'file' }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    files = fs_1.default.readdirSync(dir);
                    children = [];
                    _i = 0, files_2 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_2.length)) return [3 /*break*/, 7];
                    file = files_2[_i];
                    filePath = path_1.default.join(dir, file);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, buildTree(filePath)];
                case 4:
                    childNode = _a.sent();
                    children.push(childNode);
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    // Skip files we can't access
                    console.warn("Warning: Could not access ".concat(filePath));
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, { name: basename, type: 'directory', children: children }];
                case 8:
                    error_3 = _a.sent();
                    // For directories we can't read, just return the basic info
                    return [2 /*return*/, { name: basename, type: 'directory', children: [] }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Directory tree
function directoryTree(args) {
    return __awaiter(this, void 0, void 0, function () {
        var dirPath, stats, tree;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dirPath = path_1.default.resolve(args.path);
                    if (!isPathAllowed(dirPath)) {
                        throw new Error("Path outside allowed directories: ".concat(dirPath));
                    }
                    if (!fs_1.default.existsSync(dirPath)) {
                        throw new Error("Directory not found: ".concat(dirPath));
                    }
                    stats = fs_1.default.statSync(dirPath);
                    if (!stats.isDirectory()) {
                        throw new Error("Not a directory: ".concat(dirPath));
                    }
                    return [4 /*yield*/, buildTree(dirPath)];
                case 1:
                    tree = _a.sent();
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(tree, null, 2)
                                }
                            ]
                        }];
            }
        });
    });
}
// List allowed directories
function listAllowedDirectories() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: allowedAbsoluteDirs.join('\n')
                        }
                    ]
                }];
        });
    });
}
