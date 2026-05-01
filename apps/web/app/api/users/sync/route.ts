import { prisma } from "@repo/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      walletAddress?: string;
    };

    const { email, name, walletAddress } = body;

    if (!email || !name || !walletAddress) {
      return NextResponse.json(
        { error: "email, name, and walletAddress are required" },
        { status: 400 },
      );
    }

    const userExist = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const userId = userExist?.id;

    let user;
    if (userExist) {
      const walletAddressExist = await prisma.wallet.findFirst({
        where: {
          userId: userId,
          address: walletAddress,
        },
      });

      if (!walletAddressExist) {
        user = await prisma.user.update({
          where: { email },
          data: {
            wallets: {
              create: {
                address: walletAddress,
              },
            },
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          wallets: {
            create: {
              address: walletAddress,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User not created",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({ ok: true, userId: user?.id });
  } catch (error) {
    console.log("error message:", error)
    return NextResponse.json({ error: "failed to sync user" }, { status: 500 });
  }
}
