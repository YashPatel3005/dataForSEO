const helmet = require("helmet");
const session = require("cookie-session");
const logger = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const config = require("../config/appConfig");

module.exports = (app) => {
  // Allow loading resources only from white-listed domains
  // if (config.get("server.security.enableCSP")) {
  //   app.use(
  //     helmet.contentSecurityPolicy({
  //       directives: config.get("csp.directives"),
  //     })
  //   );
  // }

  if (config.get("server.security.enableDPC")) {
    app.use(helmet.dnsPrefetchControl());
  }

  if (config.get("server.security.enableExpectCt")) {
    app.use(helmet.expectCt());
  }

  // Prevent opening page in frame or iframe to protect from clickjacking
  if (config.get("server.security.enableXframe")) {
    app.use(helmet.frameguard());
  }

  // Remove X-Powered-By
  if (config.get("server.security.enableHidePoweredBy")) {
    app.use(helmet.hidePoweredBy());
  }

  // Allow communication only on HTTPS
  if (config.get("server.security.enableHSTS")) {
    app.use(helmet.hsts());
  }

  if (config.get("server.security.enableIENoOpen")) {
    app.use(helmet.ieNoOpen());
  }

  if (config.get("server.security.enableNoSniff")) {
    app.use(helmet.noSniff());
  }

  if (config.get("server.security.enablePermittedCrossDomainPolicies")) {
    app.use(helmet.permittedCrossDomainPolicies());
  }

  if (config.get("server.security.enableReferrerPolicy")) {
    app.use(helmet.referrerPolicy());
  }

  // Enable XSS filter in IE (On by default)
  if (config.get("server.security.enableXssFilter")) {
    app.use(helmet.xssFilter());
  }

  // Eanble CORS support
  if (config.get("server.security.enableCORS")) {
    require("../config/cors")(app);
  }

  // Enable request body parsing
  app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: config.get("server.bodyParser.limit"),
    })
  );

  // Enable request body parsing in JSON format
  app.use(
    bodyParser.json({
      limit: config.get("server.bodyParser.limit"),
    })
  );

  let appRootPath = app.get("appRootPath");

  app.use(express.static(path.join(appRootPath, "public")));

  app.use(logger("dev"));

  app.use(
    session({
      cookie: { maxAge: 60000, secure: true },
      secret: "secret key...",
      resave: false,
      saveUninitialized: true,
    })
  );
};
