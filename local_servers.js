/* \,--------\
 * | (.)   (@))  ^ Rexo Local Development Servers ^
 *  \   /\__o_o) Builds and runs some local express servers
 * \_| /  VVVVV  that can be used to locally test Rexo projects.
 *    \ \    \   This makes integrating the Rexo lambdas easier
 *     `-`^^^^'  than setting up local docker environments.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var pajo = require('path').join,
    utils = require(pajo(__dirname, 'lib', 'controllers', 'controller.utils.js'));
    express = require('express'),
    cors = require('cors'),
    awsMock = require(pajo(__dirname, 'aws_mock_proxy')),
    dataAPI = express(),
    cdn = express(),
    frontend = express();

//This ensures a common console log format for the testing environment,
//without needing access to the Rexo Core utilities.
console.log = utils.log;

dataAPI.use(awsMock.request);
cdn.use(cors()); //CORS "allow" required for Fonts and such
cdn.use('/' + process.env.REXO_PROJECT, express.static(process.env.CDN_PATH));
frontend.use(awsMock.request);

dataAPI.all('*', awsMock.getProxyHandler(require('rexo-api-lambda')));
frontend.all('*', awsMock.getProxyHandler(require('rexo-frontend-lambda')));

dataAPI.listen(1811, function() {
  utils.log('Data'.cyan + ' API listening to port ', '1811'.cyan);
});

cdn.listen(1812, function() {
  utils.log('CDN'.cyan + ' serving from port ', '1812'.cyan);
});

frontend.listen(1813, function() {
  utils.log('Frontend'.cyan + ' listening to port ', '1813'.cyan);
});