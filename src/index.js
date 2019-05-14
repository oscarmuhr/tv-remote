const express = require('express');

const app = express();
const port = 80;
const request = require('request');
const fs = require('fs');

const secretJsonBuffer = fs.readFileSync('./../secret.json');

const secretJson = JSON.parse(secretJsonBuffer.toString('utf-8'));

const requestBody = {
    "method": "getSupportedApiInfo",
    "id": 5,
    "params": [{}
    ],
    "version": "1.0"
};

request.post('http://' + secretJson.ip + '/sony/guide', {
    headers: {
        'content-type': 'application/json',
        'X-Auth-PSK': secretJson.key
    },
    json: requestBody
}, (error, response, body) => {
    if (!!error) throw error;
    if (response.statusCode == 200) {
        const services = body.result[0];
        services.forEach(element => {
            const apiServices = element.apis;
            apiServices.forEach(apiService => {
                const url = element.service.toLowerCase() + '/' + apiService.name.toLowerCase();
                app.get('/' + url, (req, res) => {
                    console.log(url + "was called");
                    const internalRequestBody = {
                        method: apiService.name,
                        id: 1,
                        params: [],
                        version: apiService.versions[0].version
                    }
                    console.log(internalRequestBody);
                    request.post('http://' + secretJson.ip + '/sony/' + element.service, {
                        headers: {
                            'content-type': 'application/json',
                            'X-Auth-PSK': secretJson.key
                        },
                        json: internalRequestBody
                    }, (error, response, body) => {
                        if (!!error) throw error;
                        res.status(response.statusCode).send(body);
                    });
                });
            });
        });
    }
});


app.get('/', (req, res) => {
    res.send('hello world');
})

app.listen(port, () => {

});