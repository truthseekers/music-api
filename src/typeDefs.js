const typeDefs = `
  type Query {
    songs: [Song!]!
    currentUser: User
  }

  type AuthPayload {
    user: User
    accessToken: String
    refreshToken: String
  }

  type Mutation {
    createSong(artist: String!, title: String!): Song!
    logout: Boolean
    login(email: String!, password: String!): AuthPayload
    signup(firstName: String!, lastName: String!, email: String!, password: String!): AuthPayload
    token: String
  }
  type Song {
    id: ID
    artist: String!
    title: String!
  }
  type User {
    id: ID
    firstName: String
    lastName: String
    email: String
  }
`;

module.exports = {
  typeDefs,
};

// artist
// secondaryArtists
// title
// genres
// Album
// audioFile

// artist
// secondaryArtists
// title
// genres
// Album
// audioFile

// 1. refresh = false
// 2. expired accessToken? set refresh = true
// run refreshTokenMutation. refresh still true.
// when complete, set the returned accessToken to accessToken. refresh still true.
// set refresh = false
// run getCurrentUser again.
//
