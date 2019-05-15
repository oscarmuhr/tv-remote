const express = require('express');
const request = require('request');
const fs = require('fs');

const app = express();
const port = 80;

var secretJson;

process.argv.forEach((val) => {
    if (val.indexOf('secret-path') == 0) {
        const secretFilePath = val.substring('secret-path='.length);

        const secretJsonBuffer = fs.readFileSync(secretFilePath);
        secretJson = JSON.parse(secretJsonBuffer.toString('utf-8'));
    }
});

const requestBody = {
    "method": "getSupportedApiInfo",
    "id": 5,
    "params": [{}
    ],
    "version": "1.0"
};

const urls = [];

function transformUrl(url) {
    const urlRegExp = new RegExp('(.+?)([A-Z])', 'g');

    var formattedUrl = '';

    let lastIndex = 0;

    while ((regexpArray = urlRegExp.exec(url)) != null) {
        formattedUrl = formattedUrl + regexpArray[1].toLowerCase() + '-' + regexpArray[2].toLowerCase();
        lastIndex = urlRegExp.lastIndex;
    }

    if (lastIndex != url.length) {
        formattedUrl = formattedUrl + url.substring(lastIndex).toLowerCase();
    }

    return formattedUrl;
}

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

            if (element.service !== 'ircc') {
                apiServices.forEach(apiService => {
                    if (element.service === 'system' && apiService.name === 'getRemoteControllerInfo') {
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
                            if (response.statusCode == 200) {
                                body.result[1].forEach(irccCommand => {
                                    const formattedUrl = 'ircc/' + transformUrl(irccCommand.name);
                                    urls.push(formattedUrl);
                                    app.get('/' + formattedUrl, (req, res) => {
                                        const soapRequest = `<?xml version="1.0"?>
                                        <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
                                          <s:Body>
                                            <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
                                              <IRCCCode>`+ irccCommand.value + `</IRCCCode>
                                            </u:X_SendIRCC>
                                          </s:Body>
                                        </s:Envelope>`;
                                        request.post('http://' + secretJson.ip + '/sony/ircc', {
                                            headers: {
                                                'content-type': 'text/xml',
                                                'X-Auth-PSK': secretJson.key,
                                                'soapaction': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
                                            },
                                            body: soapRequest
                                        }, (error, response, body) => {
                                            if (!!error) throw error;
                                            res.status(response.statusCode).send(body);
                                        });
                                    });
                                });
                            }
                        });
                    } else {
                        const url = element.service + '/' + apiService.name;

                        const formattedUrl = transformUrl(url);
                        urls.push(formattedUrl);
                        app.get('/' + formattedUrl, (req, res) => {
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
                    }
                });
            }
        });
    }
});

app.get('/', (req, res) => {
    res.send('Sony bravia API');
})

app.get('/admin/endpoints', (req, res) => {
    res.send(urls);
})

app.listen(port, () => {
    console.log("Application started on port: " + port);
});