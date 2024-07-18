import prisma from '@/utils/db';
import { Transaction, TransactionDetail } from '@/utils/type';
import { NextRequest, NextResponse } from 'next/server';
import { TRANSACTION_SELECT } from '../route';

export async function POST(
  request: NextRequest,
  { params }: { params: { category_id: string; tx_id: string } }
) {
  let result: any = {};
  try {
    const body: Transaction = await request.json();
    if (!(body.id.toString() === params.tx_id)) {
      throw new Error('Invalid tx id');
    }

    const deleteDetail = await prisma.transactionDetail.deleteMany({
      where: {
        transactionId: body.id,
      },
    });

    const detailEntities = detailsToEntities(body.TransactionDetail);
    let data = {
      buyer: body.buyer,
      seller: body.seller,
      amount: body.amount,
      isShipped: body.isShipped,
      isAccounted: body.isAccounted,
      deleted: body.deleted,
      TransactionDetail: {
        createMany: {
          data: detailEntities,
        },
      },
    };
    result = await prisma.transaction.update({
      where: {
        id: body.id,
      },
      data: data,
      select: TRANSACTION_SELECT,
    });

    // result = await prisma.$transaction([deleteDetail, updateTx]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}

function detailsToEntities(details: TransactionDetail[]) {
  const result: {
    itemId: number;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const detail of details) {
    result.push({
      itemId: detail.itemId,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
    });
  }

  return result;
}
