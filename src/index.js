const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
// replace hellodammit with this... getting "not a function" error.
// const {
//   ApolloServerPluginLandingPageLocalDefault,
//   ApolloServerPluginLandingPageProductionDefault,
// } = "@apollo/server/plugin/landingPage/default";
const { GraphQLLocalStrategy, buildContext } = require("graphql-passport");
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
// const users = require("./users.json");
const hellodammit = require("@apollo/server/plugin/landingPage/default");

const { User } = require("./models/User");
const { resolvers } = require("./resolvers");
const { typeDefs } = require("./typeDefs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const httpServer = http.createServer(app);

passport.use(
  new GraphQLLocalStrategy(async (email, password, done) => {
    console.log("between login 1 and login 2.");
    // const users = User.getUsers();
    // const matchingUser = users.find(
    //   (user) => email === user.email && password === user.password
    // );

    const matchingUser = await User.findOne({ email, password });

    console.log("matchingUser: ", matchingUser);
    const error = matchingUser ? null : new Error("no matching user");
    done(error, matchingUser);
  })
);

passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.ACCESS_TOKEN_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //getJwt,
    },
    async (token, done) => {
      if (token?.user?.email == "tokenerror") {
        let testError = new Error(
          "something bad happened. we've simulated an application error in the JWTstrategy callback for users with an email of 'tokenerror'."
        );
        return done(testError, false);
      }

      if (token?.user?.email == "emptytoken") {
        // 2. Some other reason for user to not exist. pass false as user:
        // displays "unauthorized". Doesn't allow the app to hit the next function in the chain.
        // We are simulating an empty user / no user coming from the JWT.
        return done(null, false); // unauthorized
      }

      // 3. Successfully decoded and validated user:
      // (adds the req.user, req.login, etc... properties to req. Then calls the next function in the chain.)
      return done(null, token.user);
    }
  )
);

const corsOptions = {
  credentials: true,
  origin: "*",
  // origin: [
  //   "https://studio.apollographql.com",
  //   "http://localhost:3000",
  //   "https://8c6c-23-162-0-117.ngrok.io",
  // ],
};

let plugins = [];
if (process.env.NODE_ENV === "production") {
  plugins = [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    hellodammit.ApolloServerPluginLandingPageProductionDefault({ embed: true }), // remove this too to disallow explorer
  ];
} else {
  plugins = [ApolloServerPluginDrainHttpServer({ httpServer })];
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins,
  introspection: true, // comment / remove this line for security in production. Disallows users from playing in graphql explorer
});

const startServer = async () => {
  await server.start();

  app.use(passport.initialize());
  // app.use(passport.session());

  const customLogin = () => {
    console.log("Test login function");
  };

  app.use(
    "/",
    cors(corsOptions),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: ({ req, res }) => buildContext({ req, res, customLogin }),
      // context: async ({ req }) => {
      //   console.log("request in server?");
      //   // console.log("req: ", req);

      //   return { token: req.headers.token };
      // },
    })
  );

  // console.log("ENv: ", process.env.MONGO_PASS);

  await mongoose.connect(
    // enter the password used to connect to mongo in place of process.env.MONGO_PASS
    `mongodb+srv://john:${process.env.MONGO_PASS}@music-app.wixv4kc.mongodb.net/development?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
    }
  );

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
};

startServer();

console.log("WTF. mongopass: ", process.env.MONGO_PASS);
// const express = require("express");
// const app = express();
// require("dotenv").config();

// app.get("/", (req, res) => {
//   const name = process.env.NAME || "World";
//   res.send(`Hello ${name}! I have updated`);
// });

// const port = parseInt(process.env.PORT) || 8080;
// app.listen(port, () => {
//   console.log(`helloworld: listening on port ${port}`);
// });
