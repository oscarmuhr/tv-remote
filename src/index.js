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
        const urlRegExp = new RegExp('(.+?)([A-Z])', 'g');

        services.forEach(element => {
            const apiServices = element.apis;
            apiServices.forEach(apiService => {
                const url = element.service + '/' + apiService.name;

                let formattedUrl = '';

                let lastIndex = 0;
                while((regexpArray = urlRegExp.exec(url)) != null) {
                    formattedUrl = formattedUrl + regexpArray[1] + '-' + regexpArray[2].toLowerCase(); 
                    lastIndex = urlRegExp.lastIndex;
                }

                if(lastIndex != url.length) {
                    formattedUrl = formattedUrl + url.substring(lastIndex);
                }
                app.get('/' + url, (req, res) => {
                    const internalRequestBody = {
                        method: apiService.name,
                        id: 1,
                        params: [],
                        version: apiService.versions[0].version
                    }
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