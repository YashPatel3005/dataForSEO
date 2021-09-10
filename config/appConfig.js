const helmet = require("helmet");
const convict = require("convict");

let env = process.env.NODE_ENV;

let config = convict({
  env: {
    doc: "The applicaton environment.",
    format: ["development", "production"],
    default: env,
    env: "NODE_ENV",
    arg: "env",
  },
  server: {
    security: {
      enableCSP: {
        doc: "Enable CSP policy",
        format: Boolean,
        default: true,
      },
      enableDPC: {
        doc: "Enable DNS prefetch control policy",
        format: Boolean,
        default: true,
      },
      enableExpectCt: {
        doc: "Enable expectCt",
        format: Boolean,
        default: true,
      },
      enableXframe: {
        doc: "Enable Iframe protection",
        format: Boolean,
        default: true,
      },
      enableHidePoweredBy: {
        doc: "Hide X powered by Header",
        format: Boolean,
        default: true,
      },
      enableHSTS: {
        doc: "Enable HSTS",
        format: Boolean,
        default: true,
      },
      enableIENoOpen: {
        doc: "Enable IENoOpen",
        format: Boolean,
        default: true,
      },
      enableNoSniff: {
        doc: "Enable no snigff",
        format: Boolean,
        default: true,
      },
      enablePermittedCrossDomainPolicies: {
        doc: "Enable permitted cross domain policy",
        format: Boolean,
        default: true,
      },
      enableReferrerPolicy: {
        doc: "Enable referrer policy",
        format: Boolean,
        default: true,
      },
      enableXssFilter: {
        doc: "Enable XSS filter protection",
        format: Boolean,
        default: true,
      },
      enableCORS: {
        doc: "Enable CORS",
        format: Boolean,
        default: true,
      },
    },
    CORS: {
      allowedHosts: {
        doc: "Allowed Host for CORS",
        format: Array,
        default: ["http://localhost:3001"],
      },
      allowedMethods: {
        doc: "Allowed HTTP Methods for CORS",
        format: String,
        default: "GET,POST,PUT,DELETE,OPTIONS",
      },
      allowedHeaders: {
        doc: "Allowed HTTP Headers for CORS",
        format: String,
        default: "accept, x-xsrf-token,content-type, x-location, certificate",
      },
      exposedHeaders: {
        doc: "Exposed HTTP Headers for CORS",
        format: String,
        default: "XSRF-TOKEN",
      },
    },
    bodyParser: {
      limit: {
        doc: "maximum request body size",
        format: String,
        default: "100kb",
      },
    },
  },
});

config.loadFile("config/config-" + config.get("env") + ".json");

// validate
config.validate();

module.exports = config;
