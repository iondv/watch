/* jshint maxstatements: 40, maxcomplexity: 20, maxdepth: 15 */

const moduleName = require('../../module-name');
const di = require('core/di');

const buf1pxPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00,
  0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x06, 0x62, 0x4B, 0x47, 0x44, 0x00, 0xFF, 0x00, 0xFF,
  0x00, 0xFF, 0xA0, 0xBD, 0xA7, 0x93, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00,
  0x2E, 0x23, 0x00, 0x00, 0x2E, 0x23, 0x01, 0x78, 0xA5, 0x3F, 0x76, 0x00, 0x00, 0x00, 0x0B, 0x49,
  0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x60, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0xE2, 0x26,
  0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

module.exports = function (req, res) {
  if (req.path === '/') { // For check healthy in docker
    return res.sendStatus(200);
  }
  const scope = di.context(moduleName);
  const cm = scope.metaRepo.getMeta('request@metrics');

  let requestData = {};
  try {
    requestData = {
      ip: req.get('X-Real-IP') || req.ip, // Ip in X-Real-IP set Nginx
      referrer: req.get('Referrer'),
      hostname: req.hostname,
      hostHeader: req.headers.host,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      query: JSON.stringify(req.query, null, 2),
      method: req.method,
      protocol: req.protocol,
      userAgent: req.headers['user-agent'],
      accepts: req.headers.accept,
      acceptsEncodings: req.headers['accept-encoding'],
      acceptsLanguages: req.headers['accept-language'],
      cookie: req.headers.cookie
      //connection: req.headers.connection,
      //pragma: req.headers.pragma,
      //cacheControl: req.headers['cache-control'],
      //body: req.body,
      //cookies: req.cookies,
      //ips: req.ips,
      //params: req.params,
      //signedCookies: req.signedCookies,
      //subdomains: req.subdomains,
    };
    requestData.skipHeaders = '';
    Object.keys(req.headers).forEach((item) => {
      if (['Referrer', 'X-Real-IP', 'host', 'user-agent', 'accept-encoding', 'accept-language'].indexOf() === -1) {
        requestData.skipHeaders = requestData.skipHeaders + '\n' + item + ': ' + req.headers[item];
      }
    });
  } catch (err) {
    console.error(err);
    requestData = {
      ip: req.ip,
      hostHeader: req.headers.host,
      originalUrl: req.originalUrl
    };
  }
  scope.dataRepo.createItem(cm.getCanonicalName(), requestData, cm.getVersion())
    .then((result) => {
      if (!result) {
        const curDate = new Date();
        console.error(`Didn't save request. Time stamp ${curDate.toISOString()}, IP ${req.ip} Request header:\n ${req.headers}`);
      }
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', '107');
      return res.end(buf1pxPng);
    })
    .catch((err) => {
      console.error(err);
      return res.send(buf1pxPng);
    });

};
