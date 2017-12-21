var handleResponse = function(res, lambdaRes) {
  if(lambdaRes.headers) {
    res.set(lambdaRes.headers);
  }

  res.status(lambdaRes.statusCode || 200).send(lambdaRes.body);
};

module.exports = {
  request: function(req, res, next) {
    req.awsEvent = {
      path: req.path,
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: req.query,
      body: req.body,
      pathParameters: {
        proxy: req.path.substring(1)
      }
    };

    next();
  },
  getProxyHandler: function(lambda) {
    return function(req, res) {
      lambda(req.awsEvent, {}, function(err, lambdaRes) {
        handleResponse(res, lambdaRes);
      });
    }
  }
};