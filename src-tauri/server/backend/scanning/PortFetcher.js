const net = require('net');
const tls = require('tls');

class PortFetcher {
  constructor(timeout = 2000) {
    this.timeout = timeout;
  }

  async fetch(ipOrHost, port) {
    switch (port) {
      case 22: return this.fetchSSH(ipOrHost, port);
      case 21: return this.fetchFTP(ipOrHost, port);
      case 25: return this.fetchSMTP(ipOrHost, port);
      case 53: return this.fetchDNS(ipOrHost, port);
      case 80: return this.fetchHTTP(ipOrHost, port);
      case 443: return this.fetchHTTPS(ipOrHost, port);
      default: return this.fetchRaw(ipOrHost, port);
    }
  }

  fetchHTTP(host, port = 80) {
    return this._fetchGeneric(host, port, `GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
  }

  fetchHTTPS(host, port = 443) {
    return new Promise((resolve) => {
      const client = tls.connect(port, host, { servername: host, timeout: this.timeout });
      let data = '';

      client.on('secureConnect', () => {
        client.write(`GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
      });

      client.on('data', chunk => data += chunk.toString());
      client.on('end', () => resolve({ port, body: data }));
      client.on('error', err => resolve({ port, error: err.message }));
      client.on('timeout', () => { client.destroy(); resolve({ port, error: 'Timeout' }); });
    });
  }

  fetchSSH(host, port = 22) {
    return this._fetchBanner(host, port);
  }

  fetchFTP(host, port = 21) {
    return this._fetchBanner(host, port);
  }

  fetchSMTP(host, port = 25) {
    return this._fetchBanner(host, port);
  }

  fetchDNS(host, port = 53) {
    return this._fetchBanner(host, port);
  }

  fetchRaw(host, port) {
    return this._fetchGeneric(host, port);
  }

  _fetchGeneric(host, port, message = '') {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(this.timeout);
      let data = '';

      client.connect(port, host, () => {
        if (message) client.write(message);
      });

      client.on('data', chunk => data += chunk.toString());
      client.on('end', () => resolve({ port, body: data }));
      client.on('error', err => resolve({ port, error: err.message }));
      client.on('timeout', () => { client.destroy(); resolve({ port, error: 'Timeout' }); });
    });
  }

  _fetchBanner(host, port) {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(this.timeout);
      let data = '';

      client.connect(port, host);
      client.on('data', chunk => data += chunk.toString());
      client.on('end', () => resolve({ port, body: data }));
      client.on('error', err => resolve({ port, error: err.message }));
      client.on('timeout', () => { client.destroy(); resolve({ port, error: 'Timeout' }); });
    });
  }
}

module.exports = PortFetcher;
