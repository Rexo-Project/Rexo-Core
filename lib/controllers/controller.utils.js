/* \,--------\
 * | (.)   (@))  ^ Rexo Core Utilities ^
 *  \   /\__o_o) Returns a collection of common modules and libraries.
 * \_| /  VVVVV  Also includes a few custom functions and properties 
 *    \ \    \   used for generic actions, such as logging or zipping files.
 *     `-`^^^^'  
 */

module.exports = utils = {
    os: require('os'),
    path: require('path'),
    fs: require('fs'),
    fse: require('fs.extra'),
    spawn: require('child_process').spawn,
    async: require('async'),
    AWS: require('aws-sdk')
  };

var colors = require('colors');

//path.join alias because it is the most used call
utils.pajo = utils.path.join;

//Some common paths
utils.tmpDir = utils.pajo(utils.os.tmpdir(), 'rexo');
utils.deployTmp = utils.pajo(utils.tmpDir, 'deploy');
utils.zipTmp = utils.pajo(utils.tmpDir, 'zips');
utils.controllersDir = __dirname;

//Ensure the tmp directories are there for use
utils.fse.mkdirRecursiveSync(utils.deployTmp);
utils.fse.mkdirRecursiveSync(utils.zipTmp);

/* 
 * Returns [HH:MM:SS].
 * https://stackoverflow.com/questions/7357734/how-do-i-get-the-time-of-day-in-javascript-node-js
 */
utils.getTime = function() {
  var date = new Date(),
      hour = date.getHours(),
      min  = date.getMinutes(),
      sec = date.getSeconds();

  return (hour < 10 ? "0" : "") + hour + ':' +
    (min < 10 ? "0" : "") + min + ':' +
    (sec < 10 ? "0" : "") + sec;
};

/*
 * Logging function that adds a timestamp to each log.
 * Style based on gulp output.
 */
utils.log = function() {
  var text = ['[', utils.getTime().gray, '] '].concat(
    Array.prototype.slice.call(arguments), '\n');

  process.stdout.write(text.join(''));
};

// _____________________________________________________
// | (.)   (@))  ,------. ,------.,--.   ,--.,-----.   |
//  \   /\__o_o) |  .--. '|  .---' \  `.'  /'  .-.  '  |
// \_| /  VVVVV  |  '--'.'|  `--,   .'    \ |  | |  |  |
//    \ \    \   |  |\  \ |  `---. /  .'.  \'  '-'  '  |
//     `-`^^^^'  `--' '--'`------''--'   '--'`-----'   |  
utils.printLogo = function() {
  console.log('_'.repeat(53));

  console.log('| (.)   (@))'.green + 
    '  ,------. ,------.,--.   ,--.,-----.   |');

  console.log(" \\   /\\__o_o)".green + 
    " |  .--. '|  .---' \\  `.'  /'  .-.  '  |");

  console.log("\\_| /".green + 
    "  VVVVV  |  '--'.'|  `--,   .'    \\ |  | |  |  |");

  console.log("   \\ \\    \\".green + 
    "   |  |\\  \\ |  `---. /  .'.  \\'  '-'  '  |");

  console.log("    `-`".green + "^^^^" + "'".green + 
    "  `--' '--'`------''--'   '--'`-----'   | ");
};

//A line of 53 dashes, used in the header
var dashLine = '-'.repeat(53);

/*
 * Prints a simple header to the console,
 * to break up sections of output.
 */
utils.printHeader = function(text, printLogo) {
  var startPadding = Math.round((52 - text.length) / 2),
      endPadding = 52 - text.length - startPadding;

  if(printLogo === true) {
    utils.printLogo();
  }

  console.log(dashLine);

  console.log(' '.repeat(startPadding) +
    text.green + ' '.repeat(endPadding) + '|');

  console.log(dashLine);
};

/*
 * Spawn command helper.
 */
utils.run = function(command, args, options, callback) {
  options = options || {};

  var shell = utils.spawn(command, args, {
    stdio: ['inherit', 
      (options.inheritStdout ? 'inherit' : 'pipe'), 
      'inherit'],
    cwd: options.cwd || process.cwd(),
    env: Object.assign(process.env, options.env || {})
  });

  if(!options.inheritStdout) {
    shell.stdout.on('data', function(data) {
      utils.log(data);
    });
  }

  shell.on('close', function(code) {
    callback(null);
  });
};

/*
 * Runs a gulp task. 
 */
utils.gulpTask = function(task, env, callback) {
  utils.run('gulp', [task], {
    cwd: utils.pajo(__dirname, '/../../'),
    env: env,
    inheritStdout: true
  }, callback);
};

/*
 * Runs NPM install in the directory given.
 */
utils.npmInstall = function(directory, callback) {
  utils.run('npm', ['install'], {
    cwd: directory
  }, callback);
};

/*
 * Copies a locally linked module to another location.
 * Useful for cases when a symlink can't be used.
 */
utils.npmLCopyLocal = function(localModule, target, callback) {
  utils.run('npm', ['link', localModule], {
    cwd: target
  }, function() {
    var linkPath = utils.path.join(target, 'node_modules', localModule),
        modulePath = utils.fs.realpathSync(linkPath);
    
    utils.run('npm', ['unlink', localModule], {
      cwd: target
    }, function() {
      utils.fse.copyRecursive(modulePath, linkPath, callback);
    });
  });
};

/*
 * Syncs a local directory with an S3 bucket.
 * Used the AWS CLI because the sync command
 * is not available in the JS SDK.
 */
utils.awsSync = function(folder, bucket, callback) {
  utils.run('aws', 
    ['s3', 'sync', folder, 's3://' + bucket, '--exclude', '*.DS_Store*'],
    {},
    callback);
};

var archiver = require('archiver');

/*
 * Zips the provided folder.
 */
utils.zipFolder = function(folder, filename, callback) {
  var zip = new archiver('zip'),
      zipFile = utils.pajo(utils.zipTmp, filename + '.zip'),
      zipWriteStream = utils.fs.createWriteStream(zipFile);
  
  zipWriteStream.on('close', function() {
    callback(null, zipFile);
  });

  zip.on('warning', function(err) {
    throw err;
  });

  zip.on('error', function(err) {
    throw err;
  });

  zip.on('entry', function(entry) {
    utils.log('Zip Entry Added: ', entry.name.gray);
  });

  zip.pipe(zipWriteStream);

  zip.directory(folder, '/');

  zip.finalize();
};

