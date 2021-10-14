'use strict';
// 3rd party dependencies
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import * as socketio from 'socket.io';
import http from 'http';

// local imports
import { editorRouter } from './routes/editor-api.js';
import { userRouter } from './routes/user.js';

const app: express.Express = express();

const port: number = Number.parseInt(process.env.PORT);
let clientUrls: Array<string> | string = process.env.CLIENT_URLS.split(' ');

export let dsn: string;

if (process.env.NODE_ENV === 'test') {
    dsn = process.env.MONGO_URI;
} else {
    dsn = `${process.env.DB_URI_PREFIX}://${process.env.DB_USERNAME}:` +
        `${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}` +
        '?retryWrites=true&w=majority';
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
app.use('/user', userRouter);

// Add routes for 404 and error handling
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');

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
        socket.to(data.id.toString()).emit('docBodyUpdate', data);
    });
});

export const server: http.Server = httpServer.listen(
    port,
    () => console.log(`Text editor backend listening on port ${port}.`)
);
