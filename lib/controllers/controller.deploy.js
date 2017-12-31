/* \,--------\
 * | (.)   (@))  ^ Rexo CLI - Deploy Controller ^
 *  \   /\__o_o) Helps with deploying projects and 
 * \_| /  VVVVV  Rexo components.
 *    \ \    \   
 *     `-`^^^^'  
 */

var pajo = require('path').join,
    utils = require(pajo(__dirname, 'controller.utils.js'));
    rexoFunctionsPath = pajo(__dirname, '..', '..',
      'deployment', 'cloud_functions'),
    deploy = {},
    project = null;

//The cloud location to deploy the project's templates
deploy.templateBucket = ''; 

//The cloud location for CDN files
deploy.cdnBucket = '';

/*
 * Deploys a Rexo cloud function.
 * @param {string} deploymentFolder - The folder the function
 * deployment template can be found.
 * @param {string} npmModule - The name of the npm module for
 * the function to deploy.
 * @oaram {string} functionName - The name of the cloud resource
 * to deploy to, IE the name of the cloud function in the cloud service.
 * @param {function(error)} callback - The function to run when the deployment
 * completes.
 */
deploy.lambda = function(deploymentFolder, npmModule, functionName, callback) {
  var lambdaPath = pajo(rexoFunctionsPath, 'aws', deploymentFolder);
  console.log(lambdaPath);

  utils.async.waterfall([
    utils.async.apply(utils.fse.rmrf, utils.deployTmp),
    utils.async.apply(utils.fse.copyRecursive, lambdaPath, utils.deployTmp),
    utils.async.apply(utils.npmLCopyLocal, npmModule, utils.deployTmp),
    utils.async.apply(utils.zipFolder, utils.deployTmp, functionName),
    function(zipFile, cb) {
      var lambda = new utils.AWS.Lambda({
        region: project.PLATFORM_REGION,
        accessKeyId: project.AWS_LAMBDA_UPDATER_KEY,
        secretAccessKey: project.AWS_LAMBDA_UPDATER_SECRET
      });
      
      lambda.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: utils.fs.readFileSync(zipFile)
      }, cb);
    }
  ], function(err) {
    if(!err) {
      utils.log('Function Deployed.'.green);
    }

    callback(err);
  });
};

/*
 * Deploys Rexo's API cloude function.
 * @param {function(error)} callback - The function to run when
 * the deployment is complete.
 */
deploy.api = function(callback) {
  deploy.lambda('api', 
    'rexo-api-lambda', 
    project.API_FUNCTION,
    callback);
};

/*
 * Deploys Rexo's frontend cloud function.
 * @param {function(error)} callback - The function to run when
 * the deployment is complete.
 */
deploy.frontend = function(callback) {
  deploy.lambda('frontend', 
    'rexo-frontend-lambda', 
    project.FRONTEND_FUNCTION,
    callback);
};

/*
 * Deploys a project's template files.
 * @param {function(error)} callback - The function to run when
 * the deployment is complete.
 */
deploy.templates = function(callback) {
  utils.awsSync(project.env.TEMPLATE_PATH, 
    deploy.templateBucket, callback);
};

/*
 * Builds and deploys a project's static files to it's CDN.
 * @param {function(error)} callback - The function to run when
 * the deployment is complete.
 */
deploy.cdn = function(callback) {
  utils.async.waterfall([
    utils.async.apply(utils.gulpTask, 'build', project.env),
    utils.async.apply(utils.awsSync, project.env.CDN_PATH, deploy.cdnBucket)
  ], callback);
};

module.exports = function(targetProject) {
  project = targetProject;

  deploy.templateBucket = project.TEMPLATE_STORAGE + 
    '/' + process.env.REXO_PROJECT;
  
  deploy.cdnBucket = project.CDN_STORAGE +
    '/' + process.env.REXO_PROJECT,
    actions = [];

  return deploy;
};