// explicitly importing and using body-parser
// is deprecated:
// https://stackoverflow.com/questions/66525078/bodyparser-is-deprecated
// 3rd party dependencies
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer } from 'http';

// local imports
import { editorRouter } from './routes/editor-api.mjs';

const app = express();

let port;
let clientUrls;

if (process.env.NODE_ENV === 'test') {
    port = 6666;
    clientUrls = [
        "http://localhost:4200",
    ];
} else if (process.env.PORT) {
    port = process.env.PORT;
    clientUrls = process.env.CLIENT_URLS.split(' ');
} else {
    const envConfig = JSON.parse(fs.readFileSync('./env_config.json'));

    port = envConfig.expressPort;
    clientUrls = envConfig.clientUrls.length;
}
clientUrls = clientUrls.length == 1 ? clientUrls[0]: clientUrls;

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

// enable CORS, requests made from other domains
app.use(cors());

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/editor-api', editorRouter);

// Add routes for 404 and error handling
// Catch 404 and forward to error handler
// Put this last
app.use((req, res, next) => {
    const err = new Error("Not Found");

    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        "errors": [
            {
                "status": err.status,
                "title":  err.message,
                "detail": err.message
            }
        ]
    });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: clientUrls,
        methods: ["GET", "POST"]
    }
});

io.sockets.on('connection', function(socket) {
    socket.on('createRoom', function(room) {
        socket.join(room.toString());
    });

    socket.on('leaveRoom', (room) => {
        socket.leave(room.toString());
    });

    socket.on("docBodyUpdate", function (data) {
        console.log('broadcasting..', data._id);
        // note that this only broadcasts to all clients __except__
        // the event origin.
        socket.to(data._id.toString()).emit("docBodyUpdate", data);
    });
});


// Start up server
export const server = httpServer.listen(
    port,
    () => console.log(`Text editor backend listening on port ${port}.`)
);

