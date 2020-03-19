const downloadUsage = document.getElementsByClassName('download-usage')[0];
const uploadUsage = document.getElementsByClassName('upload-usage')[0];
const uptime = document.getElementsByClassName('uptime')[0];
const users = document.getElementsByClassName('users')[0];
const guests = document.getElementsByClassName('guests')[0];
const ip = document.getElementsByClassName('ip')[0];
const speedtestPing = document.getElementsByClassName('speedtest-ping')[0];
const speedtestDownload = document.getElementsByClassName('speedtest-download')[0];
const speedtestUpload = document.getElementsByClassName('speedtest-upload')[0];
const speedtestAgo = document.getElementsByClassName('speedtest-ago')[0];
const status = document.getElementById('status');
const statusText = document.getElementsByClassName('status-text')[0];
const statusDetail = document.getElementsByClassName('status-detail')[0];
const clientsDetail = document.getElementsByClassName('clients-detail')[0];

require.config({
    paths: {
        'axios': 'scripts/axios.min'
    }
});

require(['axios'], function (axios) {

    const toggled = {};
    const toggleDetail = function(className, classNameDetail=null) {
        classNameDetail = classNameDetail ? classNameDetail : `${className}-detail`;
        if (toggled[className]) {
            divs = document.getElementsByClassName(className);
            for (const div of divs) {
                div.classList.remove('hidden');
            }
            detailDivs = document.getElementsByClassName(classNameDetail);
            for (const detailDiv of detailDivs) {
                detailDiv.classList.add('hidden');
            }
            toggled[className] = false;
        } else {
            divs = document.getElementsByClassName(className);
            for (const div of divs) {
                div.classList.add('hidden');
            }
            detailDivs = document.getElementsByClassName(classNameDetail);
            for (const detailDiv of detailDivs) {
                detailDiv.classList.remove('hidden');
            }
            toggled[className] = true;
        }
    }

    const uptimeFunc = function(seconds) {
        function numberEnding (number) {
            return (number > 1) ? 's' : '';
        }

        var temp = Math.floor(seconds);
        var years = Math.floor(temp / 31536000);
        if (years) {
            return years + ' year' + numberEnding(years);
        }

        var days = Math.floor((temp %= 31536000) / 86400);
        if (days) {
            return days + ' day' + numberEnding(days);
        }
        var hours = Math.floor((temp %= 86400) / 3600);
        if (hours) {
            return hours + ' hour' + numberEnding(hours);
        }
        var minutes = Math.floor((temp %= 3600) / 60);
        if (minutes) {
            return minutes + ' minute' + numberEnding(minutes);
        }
        var seconds = temp % 60;
        if (seconds) {
            return seconds + ' second' + numberEnding(seconds);
        }
        return 'just now';
    }

    const getStatus = function() {
        axios.get('api/overall')
                .then(function (response) {
                    const data = response.data;
                    downloadUsage.innerText = `${data.donwloadUsagePretty}/s`;
                    uploadUsage.innerText = `${data.uploadUsagePretty}/s`;
                    uptime.innerText = uptimeFunc(data.uptime);
                    users.innerText = data.users;
                    guests.innerText = data.guests;
                    ip.innerText = data.wanIp;

                    statusDetailHtml = '<dl>';
                    statusDetailOkHtml = '<i class="fad fa-check-circle great"></i>';
                    statusDetailWarningHtml = '<i class="fad fa-exclamation-triangle warning"></i>';
                    for (const status of data.statuses) {
                        statusDetailHtml += `<dt>${status.name}</dt><dd>${status.warning ? statusDetailWarningHtml : statusDetailOkHtml}</dd>`;
                    }
                    statusDetailHtml += '</dl>';
                    statusDetail.innerHTML = statusDetailHtml;

                    clientsDetailHtml = '<div class="grid-container-clients">';
                    for (const client of data.clients) {
                        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.name}</div>`;
                        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.manufacturer}</div>`
                        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.network}</div>`
                        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.ip}</div>`
                    }
                    clientsDetailHtml += '</div>';
                    clientsDetail.innerHTML = clientsDetailHtml;

                    if (data.speedTestResult) {
                        speedtestPing.innerText = `${Math.floor(data.speedTestResult.ping)} ms`;
                        speedtestDownload.innerText = `${data.speedTestResult.downloadSpeedPretty}/s`;
                        speedtestUpload.innerText = `${data.speedTestResult.uploadSpeedPretty}/s`;
                        speedtestAgo.innerText = data.speedTestResult.timeAgo;
                    }
                    if (data.warnings) {
                        status.classList.remove('fa-check-circle');
                        status.classList.remove('great');
                        status.classList.add('fa-exclamation-triangle');
                        status.classList.add('warning');
                        statusText.innerText = 'Warning';
                    } else {
                        status.classList.remove('fa-exclamation-triangle');
                        status.classList.remove('warning');
                        status.classList.add('fa-check-circle');
                        status.classList.add('great');
                        statusText.innerText = 'Great';
                    }
                });
    }

    // listener
    speedtestDivs = document.getElementsByClassName('speedtest');
    for (const speedtestDiv of speedtestDivs) {
        speedtestDiv.addEventListener('click', function() {toggleDetail('speedtest')});
    }
    document.getElementsByClassName('speedtest-detail')[0].addEventListener('click', function() { toggleDetail('speedtest') });
    document.getElementsByClassName('status')[0].addEventListener('click', function() { toggleDetail('status') });
    document.getElementsByClassName('status-detail')[0].addEventListener('click', function() { toggleDetail('status') });
    clientsDivs = document.getElementsByClassName('clients');
    for (const clientsDiv of clientsDivs) {
        clientsDiv.addEventListener('click', function() {toggleDetail('main-content', 'clients-detail')});
    }
    document.getElementsByClassName('clients-detail')[0].addEventListener('click', function() { toggleDetail('main-content', 'clients-detail') });

    // start interval
    getStatus();
    setInterval(function(){
        getStatus();
    }, 30000);
});