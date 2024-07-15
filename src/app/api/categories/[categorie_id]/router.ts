import prisma from '@/utils/db';
import { NextRequest } from 'next/server';

export async function GET() {
  const result = await prisma.category.findMany({
    where: {
      deleted: false,
    },
  });
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  await prisma.category.createMany({ data: body });
  const result = await prisma.category.findMany();
  return Response.json(result);
}
