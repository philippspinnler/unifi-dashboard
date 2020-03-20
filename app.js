// config
unifiBaseUrl = process.env.UNIFI_BASE_URL;
unifiUsername = process.env.UNIFI_USERNAME;
unifiPassword = process.env.UNIFI_PASSWORD;


const path = require('path')
const axios = require('axios');
const https = require('https');
const speedTest = require('speedtest-net');
const prettyBytes = require('pretty-bytes');
const timeAgo = require('timeago.js');
https.globalAgent.options.rejectUnauthorized = false;

const fastify = require('fastify')({
    logger: true
  })

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/',
})

const agent = new https.Agent({  
    rejectUnauthorized: false
});

let cookie;
let speedTestResult = null;
let speedTestRunning = false;

fastify.get('/', function(request, reply) {
    reply.sendFile('index.html')
});
fastify.get('/style.css', function(request, reply) {
    reply.sendFile('style.css')
});
fastify.get('/dashboard.js', function(request, reply) {
    reply.sendFile('dashboard.js')
});
fastify.get('/scripts/axios.min.js', function (req, reply) {
    reply.sendFile('axios.min.js', path.join(__dirname, 'node_modules', 'axios', 'dist'))
});
fastify.get('/scripts/axios.min.map', function (req, reply) {
    reply.sendFile('axios.min.map', path.join(__dirname, 'node_modules', 'axios', 'dist'))
});
fastify.get('/scripts/require.js', function (req, reply) {
    reply.sendFile('require.js', path.join(__dirname, 'node_modules', 'requirejs'))
});
fastify.get('/scripts/filesize.js', function (req, reply) {
    reply.sendFile('index.js', path.join(__dirname, 'node_modules', 'filesize.js', 'lib'))
});

const getTimestamp = function() {
    return new Date().getTime()
}

const runSpeedTest = async function() {
    speedTestRunning = true;
    const result = await speedTest({ acceptLicense: true, acceptGdpr: true });
    speedTestResult = {
        downloadSpeedBps: result.download.bandwidth * 8,
        uploadSpeedBps: result.upload.bandwidth * 8,
        downloadSpeedPretty: prettyBytes(result.download.bandwidth * 8, {bits: true}),
        uploadSpeedPretty: prettyBytes(result.upload.bandwidth * 8, {bits: true}),
        ping: result.ping.latency,
        timestamp: getTimestamp()
    }
    speedTestRunning = false;
}

fastify.get('/api/overall', async function (request, reply) {
    if (!speedTestResult && !speedTestRunning) {
        runSpeedTest();
    } else if (speedTestResult && speedTestResult.timestamp < (getTimestamp() - 3600000) && !speedTestRunning) {
        runSpeedTest();
    }
    if (speedTestResult && !speedTestRunning) {
        speedTestResult.timeAgo = timeAgo.format(speedTestResult.timestamp);
    }

    if (!cookie) {
        const response_login = await axios.post(`${unifiBaseUrl}/api/login`, {
            username: unifiUsername,
            password: unifiPassword
            });
        cookie = response_login.headers['set-cookie'][0];
    }
    
    const response_health = await axios.get(`${unifiBaseUrl}/api/s/default/stat/health`, {
        headers:{
            Cookie: cookie
        } 
    });
    const response_clients = await axios.get(`${unifiBaseUrl}/api/s/default/stat/sta`, {
        headers:{
            Cookie: cookie
        } 
    });
    const clients = response_clients.data.data.map(client => {
        return {
            name: client.name ? client.name : client.hostname ? client.hostname : client.mac,
            network: client.network,
            manufacturer: client.oui,
            ip: client.ip
        }
    });
    let donwloadUsageBps;
    let donwloadUsagePretty;
    let uploadUsageBps;
    let uploadUsagePretty;
    let users = 0;
    let guests = 0;
    let warnings = false;
    let wan_ip;
    let uptime;
    const statuses = [];
    for (const subsystem of response_health.data.data) {
        switch (subsystem.subsystem) {
            case 'www':
                donwloadUsageBps = subsystem['rx_bytes-r'] * 8;
                uploadUsageBps = subsystem['tx_bytes-r'] * 8;
                donwloadUsagePretty = prettyBytes(donwloadUsageBps, {bits: true});
                uploadUsagePretty = prettyBytes(uploadUsageBps, {bits: true});
                uptime = subsystem.uptime;
                break;
            case 'wan':
                wanIp = subsystem.wan_ip;
                break;
        }

        if (subsystem.status) {
            statuses.push({
                name: subsystem.subsystem,
                warning: subsystem.status !== 'ok'
            })
        }

        if (subsystem.num_user) {
            users += subsystem.num_user;
        }

        if (subsystem.num_iot) {
            users += subsystem.num_iot;
        }

        if (subsystem.num_guest) {
            guests += subsystem.num_guest;
        }

        if (subsystem.status && subsystem.status !== 'ok') {
            warnings = true;
        }
    }
    reply.send({
        donwloadUsageBps,
        uploadUsageBps,
        donwloadUsagePretty,
        uploadUsagePretty,
        users,
        guests,
        warnings,
        wanIp,
        uptime,
        speedTestResult,
        statuses,
        clients
    })
})

fastify.listen(3000, '0.0.0.0', function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})