const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Finds user based off the jwt context
    me: async (parent, args, context) => {
      if(context.user) {
        return User.findOne({ _id: context.user._id }).populate('savedBooks');
      }
      throw new AuthenticationError('You are not logged in!');
    },
  },
  Mutation: {
    addUser: async (parent, {username, email, password}) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user with this email found!');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
      if(context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
      }
      throw new AuthenticationError('Could NOT add book!');
    },
    removeBook: async (parent, { bookId }, context) => {
      if(context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true },
        );
      }
    },
  },
};

module.exports = resolvers;