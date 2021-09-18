const request = require("request");
exports.callPostApi = function (method, url, token, body = {}) {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: url,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        json: true,
        body: body,
      },
      function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
        }

        // console.log(body);

        resolve(body);
      }
    );
  });
};

exports.callPutApi = function (method, url, token, body = {}) {
  return new Promise((resolve, reject) => {
    // request.post(
    //   {
    //     url: url,
    //     headers: {
    //       'content-type': 'application/json',
    //       Authorization: `Bearer ${token}`
    //     },
    //     json: true,
    //     body: body
    //   },
    //   function(error, response, body) {
    //     if (error) {
    //       console.log(error, '-=-=-=-=-=-=-=-=-=-');
    //       reject(error);
    //     }
    //     if (response.statusCode == undefined || response.statusCode !== 200) {
    //       reject('Invalid status code <' + response.statusCode + '>');
    //     }
    //     resolve(body);
    //   }
    // );
    request.put(
      {
        url: url,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        json: true,
        body: body,
      },
      function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
        }
        // console.log(body);
        resolve(body);
      }
    );
  });
};
