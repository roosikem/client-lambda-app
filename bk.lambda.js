const awsServerlessExpress = require("aws-serverless-express");
const server = require("./dist/fastkart-ssr/server/main");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const axios = require('axios');
const binaryMimeTypes = [
  "application/javascript",
  "application/json",
  "application/octet-stream",
  "application/xml",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/comma-separated-values",
  "text/css",
  "text/html",
  "text/javascript",
  "text/plain",
  "text/text",
  "text/xml",
  "image/x-icon",
  "image/svg+xml",
  "application/x-font-ttf",
];

const app = server.app();
app.use(awsServerlessExpressMiddleware.eventContext());

// Add a middleware to intercept requests to "sitemap.xml" path
app.use(async (req, res, next) => {
  console.log(req.path);
  if (req.path === "/sitemap.xml") {
    // Modify the XML response here
    const response = await axios.get('https://d2gkan94pe0y42.cloudfront.net/sitemap.xml');
    res.set("Content-Type", "application/xml");
    res.send(response);
  } else {
    // For other paths, continue with the regular server response
    next();
  }
});

const serverProxy = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

module.exports.universal =  (event, context) => {
  if (event.path && event.path === "/sitemap.xml") {
    // Fetch the XML content using Axios
    return axios.get("https://d2gkan94pe0y42.cloudfront.net/sitemap.xml", {
        responseType: "text" // Ensure response is treated as text, not JSON
    }).then(response => {
        // Return the fetched XML content
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/xml" },
            body: response.data
        };
    }).catch(error => {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    });
} else {
    // For other paths, continue with the regular server response
    return awsServerlessExpress.proxy(serverProxy, event, context);
}
  
}
