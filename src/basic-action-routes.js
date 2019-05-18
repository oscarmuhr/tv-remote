const express = require('express');
const request = require('request');
var app = module.exports = express();

const utils = require('./utils');

const internalRequestBody = {
    method: 'getRemoteControllerInfo',
    id: 1,
    params: [],
    version: '1.0'
}

const urls = [];

app.get('/basic-actions', (req, res) => {
    res.status(200).send(urls);
});

request.post('http://' + process.env.TELEVISION_IP + '/sony/system', {
    headers: {
        'content-type': 'application/json',
        'X-Auth-PSK': process.env.TELEVISION_PRESHARED_KEY
    },
    json: internalRequestBody
}, (error, response, body) => {
    if (!!error) throw error;
    if (response.statusCode == 200) {
        if(body.error) throw new Error('Television api returned an error');
        body.result[1].forEach(irccCommand => {
            const formattedUrl = 'basic-actions/' + utils(irccCommand.name);
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
                request.post('http://' + process.env.TELEVISION_IP + '/sony/ircc', {
                    headers: {
                        'content-type': 'text/xml',
                        'X-Auth-PSK': process.env.TELEVISION_PRESHARED_KEY,
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