import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await connectDB()
      await User.findOneAndUpdate(
        { email: user.email },
        { email: user.email, name: user.name, image: user.image },
        { upsert: true, new: true }
      )
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        await connectDB()
        const dbUser = await User.findOne({ email: session.user.email })
        if (dbUser) {
          ;(session.user as any).id = dbUser._id.toString()
          ;(session.user as any).gmailConnected = !!dbUser.gmailAppPassword
        }
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
