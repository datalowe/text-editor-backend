// explicitly importing and using body-parser
// is deprecated:
// https://stackoverflow.com/questions/66525078/bodyparser-is-deprecated
// 3rd party dependencies
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';

// local imports
import { editorRouter } from './routes/editor-api.mjs';

const app = express();

let port;

if (process.env.PORT) {
    port = process.env.PORT;
} else {
    const envConfig = JSON.parse(fs.readFileSync('./env_config.json'));

    port = envConfig.expressPort;
}

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

// Start up server
export const server = app.listen(
    port,
    () => console.log(`Text editor backend listening on port ${port}.`)
);

