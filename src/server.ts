import express from "express";
import http from "http";
import logger from "morgan";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { graphqlUploadExpress } from "graphql-upload";
import { typeDefs, resolvers } from "./schema";
import { customAxios } from "./utils/axiosUtils";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { initEnvironment } from "./utils/envUtils";

(async () => {
  initEnvironment();

  const port = process.env.PORT;
  const app = express();

  const schema = buildSubgraphSchema({
    typeDefs,
    resolvers,
  });

  const httpServer = http.createServer(app);
  const apolloServer = new ApolloServer({
    schema,
    context: (ctx) => {
      return {
        axios: customAxios,
      };
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  app.use(
    process.env.NODE_ENV === "production" ? logger("common") : logger("dev")
  );
  app.use(graphqlUploadExpress());
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  if (process.env.NODE_ENV === "production") {
    console.info(
      `🚀 Server ready at Port with ${port}${apolloServer.graphqlPath}`
    );
  } else {
    console.info(
      `🚀 Server ready at http://localhost:${port}${apolloServer.graphqlPath}`
    );
  }
})();
