import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/prisma.js';

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      actionPlans: {
        include: {
          tasks: true
        }
      }
    }
  });
  console.log(`Found ${matches.length} matches in DB:`);
  for (const m of matches) {
    console.log(`- Match: student ${m.studentId}, opp ${m.opportunityId}, id ${m.id}`);
    console.log(`  ActionPlans count: ${m.actionPlans.length}`);
    for (const ap of m.actionPlans) {
      console.log(`    Plan id ${ap.id}, matchId: ${ap.matchId}, tasks count: ${ap.tasks.length}`);
      for (const t of ap.tasks) {
        console.log(`      Task: ${t.id} - ${t.title} (${t.status})`);
      }
    }
  }
}

main().catch(console.error);
