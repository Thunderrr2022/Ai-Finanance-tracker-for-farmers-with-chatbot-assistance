import { getAuth } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const { userId } = getAuth();
  
  if (!userId) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: userId,
        name: "New User",
        email: "user@example.com",
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
