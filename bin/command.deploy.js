/* \,--------\
 * | (.)   (@))  ^ Rexo CLI - Deploy Command ^
 *  \   /\__o_o) Helps transfer project files to cloud
 * \_| /  VVVVV  storage, with the option to re-deploy
 *    \ \    \   the cloud functions if needed.
 *     `-`^^^^'  
 */

module.exports = function(cli, project) {
  var pajo = require('path').join,
      utils = require(pajo(__dirname, '..', 'lib',
        'controllers', 'controller.utils.js'));

  //Provides a simple countdown in the console
  var countdown = function(seconds, message, callback) {
    var ticks = 1, countdown = seconds;

    process.stdout.write(message + ' ' + countdown);
    var timer = setInterval(function() {
      if(ticks > 0 && ticks % 4 === 0) {
        countdown--;
        if(countdown === 0) {
          process.stdout.write('GO!');
        } else {
          process.stdout.write(countdown + '');
        }
      } else if(countdown === 0) {
        process.stdout.write('\n');
        clearTimeout(timer);
        callback(null);
      } else {
        process.stdout.write('.');
      }

      ticks++;
    }, 250);
  };
  
  cli.command('deploy <env>')
    .description('deploys a Rexo project under the environment given')
    .option('-f, --functions', 
      'deploy the latests compatible Rexo cloud functions as well')
    .action(function(env, options) {
      process.env.NODE_ENV = env;
      project.load();

      var deploy = require(pajo(__dirname,
        '..', 'lib', 'controllers',
        'controller.deploy.js'))(project);
      
      utils.printHeader('Starting Rexo Deploy', true);
      utils.log('Selected Environment: ', env.cyan);
      utils.log('Project Path: ', process.cwd().magenta);

      //This gives the user 5 seconds to cancel the deploy
      //just in case the environment is wrong or they ran the
      //command by accident.
      actions.push(utils.async.apply(countdown, 5, 'Deploying Project in'));

      actions.push(function(callback) {
        utils.printHeader('Syncing Your Templates');
        utils.log('Templates Local Path: ', project.env.TEMPLATE_PATH.magenta);
        utils.log('Templates Cloud Storage Path: ', 
          deploy.templateBucket.magenta);

        callback(null);
      });

      actions.push(utils.async.apply(deploy.templates));
      
      actions.push(function(callback) {
        utils.log('Templates Updated.'.green);
        utils.printHeader('Syncing Your CDN Files');
        utils.log('CDN Local Path: ', project.env.CDN_PATH.magenta);
        utils.log('CDN Cloud Storage Path: ', 
          deploy.cdnBucket.magenta);

        callback(null);
      });

      actions.push(utils.async.apply(deploy.cdn));
      
      actions.push(function(callback) {
        utils.log('CDN Updated.'.green);
        callback(null);
      });

      if(options.functions) {
        actions.push(function(callback) {
          utils.printHeader('Deploying Rexo Cloud Functions');
          callback(null);
        });

        actions.push(utils.async.apply(deploy.api));
        actions.push(utils.async.apply(deploy.frontend));
      }

      utils.async.waterfall(actions, function(err) {
        if(err) {
          utils.log('Deploy Failed!'.red);
          utils.log(err);
        }

        utils.printHeader('Deploy Completed Successfully!');
      });
    });
};