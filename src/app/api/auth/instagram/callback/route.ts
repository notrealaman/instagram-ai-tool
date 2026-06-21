import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${error}`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/settings?connected=true", request.url)
  );
}
