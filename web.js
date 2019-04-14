/* eslint new-cap:off, no-multi-assign:off */

/**
 * Created by Andrei Kuminov on 11/04/19.
 */


const express = require('express');
const di = require('core/di');
const moduleName = require('./module-name');
const dispatcher = require('./dispatcher');
const extendDi = require('core/extendModuleDi');
const alias = require('core/scope-alias');

var app = module.exports = express();
var router = express.Router();

router.get('/*', dispatcher.index);

app._init = function () {
  let rootScope = di.context('app');
  let needAuth = rootScope.settings.get(moduleName + '.needAuth');
  if (!needAuth) {
    rootScope.auth.exclude('/' + moduleName + '/**');
    rootScope.auth.exclude('/' + moduleName);
  }
  return di(
    moduleName,
    extendDi(moduleName, {}),
    {module: app},
    'app',
    [],
    'modules/' + moduleName)
    .then(scope => alias(scope, scope.settings.get(moduleName + '.di-alias')))
    .then((scope) => {
      app.use('/' + moduleName, router);
    });
};
