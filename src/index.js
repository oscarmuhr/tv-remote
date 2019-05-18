require('dotenv').config();

const express = require('express');
const basicActions = require('./basic-action-routes');

const app = express();
const port = 80;

app.use(basicActions);

app.get('/', (req, res) => {
    res.send('Sony bravia API');
})

app.get('/admin/endpoints', (req, res) => {
    res.send(urls);
})

app.listen(port, () => {
    console.log("Application started on port: " + port);
});