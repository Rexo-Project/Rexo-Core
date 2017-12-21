#!/usr/bin/env node

/* \,--------\
 * | (.)   (@))  ^ Rexo CLI ^
 *  \   /\__o_o) Defines the available commands for the Rexo CLI.
 * \_| /  VVVVV  The CLI provides the core development and deployment
 *    \ \    \   functionality for Rexo projects.
 *     `-`^^^^'  
 */

var cli = require('commander'),
    pajo = require('path').join,
    utils = require(pajo(__dirname, '..', 'lib',
      'controllers', 'controller.utils.js')),
    project = require(utils.pajo(
      utils.controllersDir, 'controller.project.js'));

cli.version('0.0.1');

cli.command('local')
  .description('launch a local development environment for your Rexo project')
  .action(function() {
    process.env.CDN_URL = "http://localhost:1812/" + 
      process.env.REXO_PROJECT + '/';

    process.env.DATA_API_URL = "http://localhost:1811/";

    utils.printHeader('Launching Development Environment', true);

    utils.gulpTask('dev', project.env);
  });

require(pajo(__dirname, 'command.deploy.js'))(cli, project);

cli.parse(process.argv);