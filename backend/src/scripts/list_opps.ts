import dotenv from 'dotenv';
dotenv.config();
import { getAllOpportunities } from '../services/opportunityService.js';

async function main() {
  const opps = await getAllOpportunities();
  console.log(`Found ${opps.length} opportunities in Neon DB:`);
  for (const o of opps) {
    console.log(`- [${o.id}] ${o.title} (${o.organization}) | Category: ${o.type} | MinCGPA: ${o.minCgpa} | Branches: ${o.eligibleBranches.join(', ')}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
