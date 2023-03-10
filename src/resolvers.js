const jwt = require("jsonwebtoken");

const { Song } = require("./models/Song");
const { User } = require("./models/User");

const Query = {
  songs: async () => {
    const songs = await Song.find();

    return songs;
  },
  currentUser: async (parent, args, context) => {
    console.log(
      "context.req.headers.token: ",
      context.req.headers.authorization
    );

    try {
      // This is wrong... there SHOULD be an error when the jwt is expired to get into the catch... But it's not happening.
      const hmm = await context.authenticate("jwt", { session: false });
      console.log("hmm in currentUser: ", hmm);
      if (!hmm.user) {
        throw Error("jwt is expired");
      }
      return hmm.user;
    } catch (error) {
      console.log("no error?");
      return null;
    }
  },
};

const Mutation = {
  createSong: (parent, args, context, info) => {
    console.log("create song yo");
    const song = new Song({ artist: args.artist, title: args.title });

    console.log("args: ", args);

    return song.save();
  },
  logout: (parent, args, context) => context.logout(),
  login: async (parent, { email, password }, context) => {
    const { user } = await context.authenticate("graphql-local", {
      email,
      password,
    });

    const body = { id: user.id, email: user.email };
    const accessToken = jwt.sign(
      { user: body },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30s",
      }
    );

    const refreshToken = await jwt.sign(
      { email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "60s",
      }
    );

    user.refreshToken = refreshToken;
    await user.save();

    await context.customLogin(user);
    return { user, accessToken: accessToken, refreshToken: refreshToken };
  },
  token: async (parent, args, context) => {
    const refreshToken = context.req.headers.authorization.split("Bearer ")[1];

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const { email } = payload;

      const theUser = await User.findOne({ email });

      const refreshTokensMatch = theUser.refreshToken == refreshToken;
      const body = { id: theUser.id, email: theUser.email };

      if (refreshTokensMatch) {
        const accessToken = await jwt.sign(
          { user: body },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30s" }
        );
        return accessToken; //{ accessToken: accessToken };
      } else {
        return null; // tokens don't match
      }
    } catch (error) {
      console.log("error in token resolver: ", error);
      return null;
    }
  },
  signup: async (parent, { firstName, lastName, email, password }, context) => {
    const userWithEmailAlreadyExists = await User.findOne({ email: email });

    if (userWithEmailAlreadyExists) {
      throw new Error("User with email already exists");
    }

    const user = new User({ firstName, lastName, email, password });

    await user.save();

    const body = { id: user.id, email: user.email };

    const accessToken = jwt.sign(
      { user: body },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30s",
      }
    );

    const refreshToken = await jwt.sign(
      { email: email },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "60s",
      }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  },
};

const resolvers = {
  Query,
  Mutation,
};

module.exports = {
  resolvers,
};
