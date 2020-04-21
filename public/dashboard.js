const downloadUsage = document.getElementsByClassName("download-usage")[0];
const uploadUsage = document.getElementsByClassName("upload-usage")[0];
const uptime = document.getElementsByClassName("uptime")[0];
const numOfUsers = document.getElementsByClassName("num-of-users")[0];
const numOfDevices = document.getElementsByClassName("num-of-devices")[0];
const devicesDetail = document.getElementsByClassName("devices-detail")[0];
const ip = document.getElementsByClassName("ip")[0];
const speedtestPing = document.getElementsByClassName("speedtest-ping")[0];
const speedtestDownload = document.getElementsByClassName(
  "speedtest-download"
)[0];
const speedtestUpload = document.getElementsByClassName("speedtest-upload")[0];
const speedtestAgo = document.getElementsByClassName("speedtest-ago")[0];
const status = document.getElementById("status");
const statusText = document.getElementsByClassName("status-text")[0];
const statusDetail = document.getElementsByClassName("status-detail")[0];
const clientsDetail = document.getElementsByClassName("clients-detail")[0];
const usageDetail = document.getElementsByClassName("usage-detail")[0];
const downloadGraphData = [];
const uploadGraphData = [];

require.config({
  paths: {
    axios: "scripts/axios.min",
    Chartist: "srcipt/chartist.min",
  },
});

require(["axios", "Chartist"], function (axios, Chartist) {
  const toggled = {};
  const toggleDetail = function (className, classNameDetail = null) {
    classNameDetail = classNameDetail ? classNameDetail : `${className}-detail`;
    if (toggled[className]) {
      divs = document.getElementsByClassName(className);
      for (const div of divs) {
        div.classList.remove("hidden");
      }
      detailDivs = document.getElementsByClassName(classNameDetail);
      for (const detailDiv of detailDivs) {
        detailDiv.classList.add("hidden");
      }
      toggled[className] = false;
    } else {
      divs = document.getElementsByClassName(className);
      for (const div of divs) {
        div.classList.add("hidden");
      }
      detailDivs = document.getElementsByClassName(classNameDetail);
      for (const detailDiv of detailDivs) {
        detailDiv.classList.remove("hidden");
      }
      toggled[className] = true;
    }
  };

  const uptimeFunc = function (seconds) {
    function numberEnding(number) {
      return number > 1 ? "s" : "";
    }

    var temp = Math.floor(seconds);
    var years = Math.floor(temp / 31536000);
    if (years) {
      return years + " year" + numberEnding(years);
    }

    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + " day" + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + " hour" + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + " minute" + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
      return seconds + " second" + numberEnding(seconds);
    }
    return "just now";
  };

  // Chart
  const data = {
    series: [],
  };
  const options = {
    width: 495,
    height: 150,
    showArea: true,
    chartPadding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: -50,
    },
    fullWidth: true,
    axisY: {
      showGrid: false,
      labelOffset: {
        x: 50,
      },
    },
    axisX: {
      showGrid: false,
      showLabel: false,
      offset: 0,
    },
    showPoint: false,
  };
  const chart = new Chartist.Line(".usage-detail", data, options);

  const getStatus = function () {
    axios.get("api/overall").then(function (response) {
      const data = response.data;
      downloadUsage.innerText = `${data.donwloadUsagePretty}/s`;
      uploadUsage.innerText = `${data.uploadUsagePretty}/s`;
      if (downloadGraphData.length >= 15) {
        downloadGraphData.shift();
      }
      if (uploadGraphData.length >= 15) {
        uploadGraphData.shift();
      }
      downloadGraphData.push(data.donwloadUsageBps / 1024 / 1024);
      uploadGraphData.push(data.uploadUsageBps / 1024 / 1024);

      chart.update({ series: [downloadGraphData, uploadGraphData] });
      uptime.innerText = uptimeFunc(data.uptime);
      numOfUsers.innerText = data.numOfUsers;
      numOfDevices.innerText = data.numOfDevices;
      ip.innerText = data.wanIp;

      statusDetailHtml = "<dl>";
      statusDetailOkHtml = '<i class="fad fa-check-circle great"></i>';
      statusDetailWarningHtml =
        '<i class="fad fa-exclamation-triangle warning"></i>';
      for (const status of data.statuses) {
        statusDetailHtml += `<dt>${status.name}</dt><dd>${
          status.warning ? statusDetailWarningHtml : statusDetailOkHtml
        }</dd>`;
      }
      statusDetailHtml += "</dl>";
      statusDetail.innerHTML = statusDetailHtml;

      let clients = data.clients.sort(function (a, b) {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        let comparison = 0;
        if (nameA > nameB) {
          comparison = 1;
        } else if (nameA < nameB) {
          comparison = -1;
        }
        return comparison;
      });
      clients = data.clients.sort(function (a, b) {
        const networkA = a.network.toUpperCase();
        const networkB = b.network.toUpperCase();

        let comparison = 0;
        if (networkA > networkB) {
          comparison = 1;
        } else if (networkA < networkB) {
          comparison = -1;
        }
        return comparison;
      });
      let currentNetwork;
      let clientsDetailHtml = '<h1><i class="fad fa-users"></i> Clients</h1>';
      for (const client of clients) {
        if (currentNetwork != client.network) {
          if (currentNetwork) {
            clientsDetailHtml += "</div>";
          }
          clientsDetailHtml += `<h2 style="margin-top: 40px;">${client.network}</h2>`;
          clientsDetailHtml += '<div class="grid-container-clients">';
          currentNetwork = client.network;
        }
        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.name}</div>`;
        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.manufacturer}</div>`;
        clientsDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${client.ip}</div>`;
      }
      clientsDetailHtml += "</div>";
      clientsDetail.innerHTML = clientsDetailHtml;

      let currentDeviceType;
      let devicesDetailHtml =
        '<h1><i class="fad fa-network-wired"></i> Devices</h1>';
      let devices = data.devices.sort(function (a, b) {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        let comparison = 0;
        if (nameA > nameB) {
          comparison = 1;
        } else if (nameA < nameB) {
          comparison = -1;
        }
        return comparison;
      });
      devices = devices.sort(function (a, b) {
        const nameA = a.type.toUpperCase();
        const nameB = b.type.toUpperCase();

        let comparison = 0;
        if (nameA > nameB) {
          comparison = 1;
        } else if (nameA < nameB) {
          comparison = -1;
        }
        return comparison;
      });
      for (const device of devices) {
        switch (device.type) {
          case "ugw":
            device.type = "Gateways";
            break;
          case "usw":
            device.type = "Switches";
            break;
          case "uap":
            device.type = "Access Points";
            break;
        }
        if (currentDeviceType != device.type) {
          if (currentDeviceType) {
            devicesDetailHtml += "</div>";
          }
          devicesDetailHtml += `<h2 style="margin-top: 40px;">${device.type}</h2>`;
          devicesDetailHtml += '<div class="grid-container-devices">';
          currentDeviceType = device.type;
        }
        devicesDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${device.name}</div>`;
        devicesDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${uptimeFunc(
          device.uptime
        )}</div>`;
        devicesDetailHtml += `<div style="overflow: hidden; white-space: nowrap;">${device.ip}</div>`;
      }
      devicesDetailHtml += "</div>";
      devicesDetail.innerHTML = devicesDetailHtml;

      if (data.speedTestResult) {
        speedtestPing.innerText = `${Math.floor(data.speedTestResult.ping)} ms`;
        speedtestDownload.innerText = `${data.speedTestResult.downloadSpeedPretty}/s`;
        speedtestUpload.innerText = `${data.speedTestResult.uploadSpeedPretty}/s`;
        speedtestAgo.innerText = data.speedTestResult.timeAgo;
      }
      if (data.warnings) {
        status.classList.remove("fa-check-circle");
        status.classList.remove("great");
        status.classList.add("fa-exclamation-triangle");
        status.classList.add("warning");
        statusText.innerText = "Warning";
      } else {
        status.classList.remove("fa-exclamation-triangle");
        status.classList.remove("warning");
        status.classList.add("fa-check-circle");
        status.classList.add("great");
        statusText.innerText = "Great";
      }
    });
  };

  // listener
  speedtestDivs = document.getElementsByClassName("speedtest");
  for (const speedtestDiv of speedtestDivs) {
    speedtestDiv.addEventListener("click", function () {
      toggleDetail("speedtest");
    });
  }
  document
    .getElementsByClassName("speedtest-detail")[0]
    .addEventListener("click", function () {
      toggleDetail("speedtest");
    });
  document
    .getElementsByClassName("status")[0]
    .addEventListener("click", function () {
      toggleDetail("status");
    });
  document
    .getElementsByClassName("status-detail")[0]
    .addEventListener("click", function () {
      toggleDetail("status");
    });
  document
    .getElementsByClassName("clients")[0]
    .addEventListener("click", function () {
      toggleDetail("main-content", "clients-detail");
    });
  document
    .getElementsByClassName("clients-detail")[0]
    .addEventListener("click", function () {
      toggleDetail("main-content", "clients-detail");
    });
  document
    .getElementsByClassName("devices")[0]
    .addEventListener("click", function () {
      toggleDetail("main-content", "devices-detail");
    });
  document
    .getElementsByClassName("devices-detail")[0]
    .addEventListener("click", function () {
      toggleDetail("main-content", "devices-detail");
    });
  document
    .getElementsByClassName("usage")[0]
    .addEventListener("click", function () {
      toggleDetail("usage", "usage-detail");
    });
  document
    .getElementsByClassName("usage")[1]
    .addEventListener("click", function () {
      toggleDetail("usage", "usage-detail");
    });
  document
    .getElementsByClassName("usage-detail")[0]
    .addEventListener("click", function () {
      toggleDetail("usage", "usage-detail");
    });

  // start interval
  getStatus();
  setInterval(function () {
    getStatus();
  }, 30000);
});
