import https from "https";
import v8 from "v8";

import Hapi from "@hapi/hapi";
import got from "got";
import rp from "request-promise-native";

const init = async () => {
  const server = Hapi.Server({
    port: 3000,
    host: "localhost",
  });

  server.route({
    method: "GET",
    path: "/big-response",
    handler: async (request) => {
      let response;

      const useAgentWithKeepAlive =
        request.query["use-agent-with-keep-alive"] === "yes";
      const opts = {
        url: "https://http-me.glitch.me/now",
      };

      // Passing `?request-type=request-promise-native&use-agent-with-keep-alive=yes` will trigger
      // the memory leak.
      if (request.query["request-type"] === "request-promise-native") {
        if (useAgentWithKeepAlive) {
          opts.agent = new https.Agent({ keepAlive: true });
        }

        response = await rp(opts);

        // Passing `?request-type=got&use-agent-with-keep-alive=yes` will trigger the memory leak.
      } else if (request.query["request-type"] === "got") {
        if (useAgentWithKeepAlive) {
          opts.agent = {
            https: new https.Agent({ keepAlive: true }),
          };
        }

        response = await got(opts);
      }

      return "a".repeat(2 * 1000000); // 2MB
    },
  });

  server.route({
    method: "GET",
    path: "/gc",
    handler: async () => {
      global.gc();
      return "gc complete";
    },
  });

  server.route({
    method: "GET",
    path: "/heapdump",
    handler: async () => {
      console.log("writing heap snapshot");
      v8.writeHeapSnapshot(`${Date.now()}.heapsnapshot`);
      return "heapdump complete";
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);

  // listen on SIGINT signal and gracefully stop the server
  process.on("SIGINT", function () {
    console.log("stopping hapi server");

    server.stop({ timeout: 100 }).then(function (err) {
      console.log("hapi server stopped");
      process.exit(err ? 1 : 0);
    });
  });
};

init();
