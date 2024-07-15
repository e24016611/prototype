import prisma from '@/utils/db';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { category_id: string } }
) {
  const items = await prisma.item.findMany({
    where: {
      categoryId: Number.parseInt(params.category_id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const result = items.map<{ name: string; id: number }>((item) => {
    return { name: item.name, id: item.id };
  });

  return Response.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { category_id: string } }
) {
  const body = await request.json();
  body['categoryId'] = Number.parseInt(params.category_id);
  await prisma.item.create({ data: body });
  const items = await prisma.item.findFirst({
    orderBy: {
      created: 'desc',
    },
  });
  return Response.json(items);
}
