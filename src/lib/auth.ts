import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from './mongodb-client';
import dbConnect from './db';
import User from './models/User';

export const authOptions: NextAuthOptions = {
  // Temporarily remove MongoDB adapter to handle account linking manually
  // adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  // Allow linking accounts with same email from different providers
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.type !== 'oauth') return true;
      
      await dbConnect();
      
      try {
        // Check if user already exists with this email
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user if doesn't exist
          existingUser = new User({
            email: user.email,
            name: user.name || (profile as any)?.name,
            image: user.image || (profile as any)?.picture,
            role: 'user',
            isVerified: false,
            profileComplete: false,
          });
          
          await existingUser.save();
          console.log('Created new user:', existingUser._id);
        } else {
          console.log('User already exists:', existingUser._id);
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        // Don't block sign in due to our custom logic errors
        return true;
      }
    },
    async session({ session, token, user }) {
      if (session?.user && token?.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.email = dbUser.email;
          session.user.name = dbUser.name;
          session.user.image = dbUser.image;
          session.user.role = dbUser.role;
          session.user.isVerified = dbUser.isVerified;
          session.user.phone = dbUser.phone;
          session.user.about = dbUser.about;
          session.user.workCategories = dbUser.workCategories;
          session.user.profileComplete = dbUser.profileComplete;
          // Add verification status
          (session.user as any).verificationStatus = dbUser.ktpVerification?.status || 'not_submitted';
        }
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // When user first signs in
      if (user) {
        await dbConnect();
        
        // Try to find existing user in our database
        let dbUser = await User.findOne({ email: user.email });
        
        if (!dbUser) {
          // Create new user if doesn't exist
          dbUser = new User({
            email: user.email,
            name: user.name,
            image: user.image,
            role: 'user',
            isVerified: false,
            profileComplete: false,
          });
          await dbUser.save();
          console.log('Created new user via JWT:', dbUser._id);
        }
        
        // Set token data from database user
        token.id = dbUser._id.toString();
        token.email = dbUser.email;
        token.role = dbUser.role;
      }
      
      // Force refresh data from database when needed
      if (trigger === 'update' || (!token.role && token.email)) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }
      
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: 'user' | 'tasker' | 'admin';
      isVerified: boolean;
      phone?: string;
      about?: string;
      workCategories?: string[];
      profileComplete?: boolean;
    };
  }
  interface User {
    role: 'user' | 'tasker' | 'admin';
    isVerified: boolean;
    phone?: string;
    about?: string;
    workCategories?: string[];
    profileComplete?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: 'user' | 'tasker' | 'admin';
  }
}