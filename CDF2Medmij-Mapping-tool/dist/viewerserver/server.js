"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const path_1 = __importDefault(require("path"));
const mapper_1 = require("../mapper");
const serversettings_1 = require("./serversettings");
//To resolve all relative paths from the 'dist' folder.
const folderPath = path_1.default.resolve(__dirname);
process.chdir(folderPath);
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.resolve('../../viewer/public')));
const server = app.listen(3000, () => {
    console.log('Server started on port 3000. Open http://localhost:3000 in a web browser');
});
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            if (message.command === 'transform') {
                const input = JSON.parse(message.payload);
                (0, mapper_1.processInput)(input, serversettings_1.targets).then((output) => {
                    ws.send(JSON.stringify({ "responsetype": "output", "payload": output }));
                }).catch((error) => {
                    console.info("Error:" + error);
                    const errmsg = error.cause != null ? error.cause.toString() : error;
                    console.info("Error:" + errmsg);
                    console.trace();
                    ws.send(JSON.stringify({ "responsetype": "error", "payload": errmsg }));
                });
            }
        }
        catch (error) {
            ws.send(JSON.stringify({ "responsetype": "error", "payload": `Error parsing input:${error}` }));
            console.error('Error parsing message:', error);
        }
    });
});
/*
For real-time update
fs.watchFile(`/tmp/out.json`, { interval: 500 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
        console.log(`File modified.`);
        const payload: string = fs.readFileSync(`/tmp/out.json`, 'utf8');

        wss.clients.forEach(client => {
            const message: transformationOutput = { source: "", output: payload }
            console.log(`Sending`);
            client.send(JSON.stringify(payload));
        });

        //ws.send(JSON.stringify(payload));
    }
});
*/
//# sourceMappingURL=server.js.map