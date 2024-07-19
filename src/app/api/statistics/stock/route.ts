import { getTodayStr } from '@/utils/date';
import prisma from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

type ResultType = {
  itemId: number;
  quantity: number;
};

export async function GET(request: NextRequest) {
  const category_id = request.nextUrl.searchParams.get('category');
  const dateStr = request.nextUrl.searchParams.get('date');

  if (!category_id)
    return NextResponse.json(
      { error: 'category_id is required' },
      { status: 400 }
    );

  let startOfDay: Date;
  let result: ResultType[] = [];
  if (dateStr) {
    startOfDay = new Date(dateStr + 'T00:00:00.000+08:00');
  } else {
    const todayStr = getTodayStr();
    startOfDay = new Date(todayStr + 'T00:00:00.000+08:00');
  }
  // 可能有未來的交易存在
  const latestDate = await prisma.transaction.aggregate({
    _max: {
      transactionDate: true,
    },
    where: {
      categoryId: Number.parseInt(category_id),
      deleted: false,
      transactionDate: {
        lt: startOfDay,
      },
    },
  });
  const queryDate = latestDate._max.transactionDate;

  if (queryDate) {
    result = await prisma.$queryRaw<ResultType[]>`
    select detail.itemId,  
      sum(case tx.buyer WHEN 'self' then detail.quantity else -detail.quantity end) as quantity 
    from "Transaction" as tx, "TransactionDetail" as detail 
    where detail.transactionId = tx.id 
      and tx.categoryId = ${category_id} 
      and tx.transactionDate = ${queryDate}
      and tx.deleted = false  
    GROUP by detail.itemId;`;
  }

  return NextResponse.json(result, { status: 200 });
}
