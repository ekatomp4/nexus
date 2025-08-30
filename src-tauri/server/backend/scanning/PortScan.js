const net = require("net");
const https = require("https");

const PortFetcher = require('./PortFetcher.js');
const fetcher = new PortFetcher();

// PORT 53 is DNS
// PORT 80 is HTTP
// PORT 443 is HTTPS
// PORT 22 is SSH
// PORT 21 is FTP
// PORT 25 is SMTP

class PortScanner {
  /**
   * Sends a request to a single port on an IP
   * @param {string} ip IP address to send the request to
   * @param {number} [port=80] Port number to send the request to
   * @returns {Promise<object>} Promise that resolves to an object containing the request results
   */
  async sendRequest(ip, port = 80) {
    return fetcher.fetch(ip, port);
  }
  /**
   * Sends a request to multiple ports on an IP
   * @param {string} ip IP address to send the request to
   * @param {number[]} [ports=[80, 443, 53, 22, 21, 25]] List of port numbers to send the request to
   * @returns {Promise<object[]>} Promise that resolves to an array of objects containing the request results
   */
  async sendBatchRequest(ip, ports = [ 80, 443, 53, 22, 21, 25 ]) {
    const results = [];
    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      results.push(fetcher.fetch(ip, port));
    }
    return Promise.all(results);
  }

  async resolveHost(host) {
    // If already an IPv4
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return host;
    }

    // Otherwise resolve with DNS-over-HTTPS
    return new Promise((resolve, reject) => {
      const url = `https://dns.google/resolve?name=${host}&type=A`;
      https.get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.Answer && json.Answer.length > 0) {
              const record = json.Answer.find((a) => a.type === 1); // A record
              if (record) {
                return resolve(record.data);
              }
            }
            reject(new Error(`Could not resolve ${host}`));
          } catch (e) {
            reject(e);
          }
        });
      }).on("error", reject);
    });
  }

  async scanPort(host, port, timeout = 300) {
    const ip = await this.resolveHost(host);
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = "closed";

      socket.setTimeout(timeout);

      socket.on("connect", () => {
        status = "open";
        socket.destroy();
      });

      socket.on("timeout", () => {
        socket.destroy();
      });

      socket.on("error", () => {
        // stays closed
      });

      socket.on("close", () => {
        resolve({ port, status });
      });

      socket.connect(port, ip);
    });
  }

  async checkPort(host, port, timeout = 300) {
    const result = await this.scanPort(host, port, timeout);
    return result.status === "open";
  }

  async scanAllPorts(host, start = 1, end = 1024, concurrency = 100, timeout = 300) {
    const ip = await this.resolveHost(host);
    const ports = [];
    for (let p = start; p <= end; p++) ports.push(p);

    const openPorts = [];
    while (ports.length > 0) {
      const batch = ports.splice(0, concurrency);
      const results = await Promise.all(batch.map((p) => this.scanPort(ip, p, timeout)));
      results.forEach((r) => {
        if (r.status === "open") openPorts.push(r.port);
      });
    }
    return openPorts;
  }
}

module.exports = PortScanner;