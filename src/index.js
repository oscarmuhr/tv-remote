require('dotenv').config();

const path = require('path');

const express = require('express');
const basicActions = require('./basic-action-routes');

const app = express();
const port = 80;

app.use(basicActions);
app.use(express.static(path.join(__dirname, '/static')));

app.get('/admin/endpoints', (req, res) => {
    res.send(urls);
})

app.get('/', (req, res) => {
    res.redirect(301, '/home.html');
})

app.listen(port, () => {
    console.log("Application started on port: " + port);
});