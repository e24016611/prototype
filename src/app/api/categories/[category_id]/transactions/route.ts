import { getTodayStr } from '@/utils/date';
import prisma from '@/utils/db';
import { TransactionDetail } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const TRANSACTION_SELECT = {
  TransactionDetail: {
    select: {
      itemId: true,
      quantity: true,
      unitPrice: true,
    },
  },
  id: true,
  buyer: true,
  seller: true,
  amount: true,
  isAccounted: true,
  isShipped: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { category_id: string } }
) {
  const dateStr = request.nextUrl.searchParams.get('date') ?? getTodayStr();
  const type = request.nextUrl.searchParams.get('type');
  const customer = request.nextUrl.searchParams.get('customer') ?? undefined;
  const queryDate = new Date(dateStr + 'T00:00:00.000+08:00');

  const typeQuery: any = {};
  switch (type) {
    case 'stocks':
      typeQuery['buyer'] = 'self';
      if (customer) typeQuery['seller'] = customer;
      break;
    case 'orders':
      typeQuery['seller'] = 'self';
      if (customer) typeQuery['buyer'] = customer;
      break;
    default:
      break;
  }

  const result = await prisma.transaction.findMany({
    where: {
      categoryId: Number.parseInt(params.category_id),
      deleted: false,
      transactionDate: {
        equals: queryDate,
      },
      ...typeQuery,
    },

    select: TRANSACTION_SELECT,
  });

  return NextResponse.json(result, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { category_id: string } }
) {
  let result;
  try {
    const body = await request.json();
    const details: Omit<TransactionDetail, 'transactionId'>[] =
      body.TransactionDetail;

    let data = {
      buyer: body.buyer,
      seller: body.seller,
      categoryId: Number.parseInt(params.category_id),
      amount: body.amount,
      transactionDate: body.transactionDate,
      TransactionDetail: {
        createMany: {
          data: details,
        },
      },
    };
    result = await prisma.transaction.create({
      data: data,
      select: TRANSACTION_SELECT,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: error }, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
