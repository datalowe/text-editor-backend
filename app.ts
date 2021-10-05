'use strict';
// 3rd party dependencies
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import * as socketio from 'socket.io';
import http from 'http';

// local imports
import { editorRouter } from './routes/editor-api.js';

const app: express.Express = express();

let port: number;
let clientUrls: Array<string> | string;

if (process.env.NODE_ENV === 'test') {
    port = 6666;
    clientUrls = [
        'http://localhost:4200'
    ];
} else if (process.env.PORT) {
    port = Number.parseInt(process.env.PORT);
    clientUrls = process.env.CLIENT_URLS.split(' ');
}

clientUrls = clientUrls.length === 1 ? clientUrls[0] : clientUrls;

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs Apache style LOGs
}

// enable CORS, requests made from other domains
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/editor-api', editorRouter);

// Add routes for 404 and error handling
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');

    console.log(res.statusCode);
    res.statusCode = 404;
    next(err);
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(res.statusCode || 500).json({
        errors: [
            {
                status: err.status,
                title:  err.message,
                detail: err.message
            }
        ]
    });
});

const httpServer: http.Server = http.createServer(app);

const io: socketio.Server = new socketio.Server(httpServer, {
    cors: {
        origin: clientUrls,
        methods: ['GET', 'POST']
    }
});

io.sockets.on('connection', function(socket) {
    socket.on('createRoom', function(room) {
        socket.join(room.toString());
    });

    socket.on('leaveRoom', (room) => {
        socket.leave(room.toString());
    });

    socket.on('docBodyUpdate', function (data) {
        // note that this only broadcasts to all clients __except__
        // the event origin.
        socket.to(data._id.toString()).emit('docBodyUpdate', data);
    });
});

export const server: http.Server = httpServer.listen(
    port,
    () => console.log(`Text editor backend listening on port ${port}.`)
);
