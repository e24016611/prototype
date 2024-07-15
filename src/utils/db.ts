import { PrismaClient } from '@prisma/client';

// const prismaClientSingleton = () => {
//   return new PrismaClient({
//     log: [
//       {
//         emit: 'event',
//         level: 'query',
//       },
//     ],
//   });
// };

// declare const globalThis: {
//   prismaGlobal: ReturnType<typeof prismaClientSingleton>;
// } & typeof global;

// const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query);
//   console.log('Params: ' + e.params);
//   console.log('Duration: ' + e.duration + 'ms');
// });

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

process.env.DEBUG = 'prisma:query';
export default prisma;

if (process.env.NODE_ENV !== 'production') {
  // globalThis.prismaGlobal = prisma;
}
