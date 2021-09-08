// explicitly importing and using body-parser
// is deprecated:
// https://stackoverflow.com/questions/66525078/bodyparser-is-deprecated
// 3rd party dependencies
const express = require("express");
const morgan = require('morgan');
const cors = require('cors');

// local imports
const editorApi = require('./routes/editor-api');

// environment/database configurations
const envConfig = require('./env_config.json');

const app = express();
const port = envConfig.expressPort || 1337;

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

// enable CORS, requests made from other domains
app.use(cors());

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/editor-api', editorApi);

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
app.listen(port, () => console.log(`Example API listening on port ${port}!`));
