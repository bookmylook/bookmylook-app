import { db } from '../server/db';
import { indianStates, indianDistricts, indianTowns } from '../shared/schema';

const statesData = [
  { name: "Jammu & Kashmir", code: "JK", displayOrder: 1 },
  { name: "Delhi", code: "DL", displayOrder: 2 },
  { name: "Maharashtra", code: "MH", displayOrder: 3 },
  { name: "Karnataka", code: "KA", displayOrder: 4 },
  { name: "Tamil Nadu", code: "TN", displayOrder: 5 },
  { name: "West Bengal", code: "WB", displayOrder: 6 },
  { name: "Uttar Pradesh", code: "UP", displayOrder: 7 },
  { name: "Rajasthan", code: "RJ", displayOrder: 8 },
  { name: "Gujarat", code: "GJ", displayOrder: 9 },
  { name: "Punjab", code: "PB", displayOrder: 10 },
];

const jkDistricts = [
  { name: "Srinagar", displayOrder: 1 },
  { name: "Budgam", displayOrder: 2 },
  { name: "Jammu", displayOrder: 3 },
  { name: "Anantnag", displayOrder: 4 },
  { name: "Baramulla", displayOrder: 5 },
];

const srinigarTowns = [
  { name: "Lal Chowk", displayOrder: 1 },
  { name: "Dal Lake Area", displayOrder: 2 },
  { name: "Rajbagh", displayOrder: 3 },
  { name: "Jawahar Nagar", displayOrder: 4 },
  { name: "Badami Bagh", displayOrder: 5 },
  { name: "Gogji Bagh", displayOrder: 6 },
  { name: "Soura", displayOrder: 7 },
  { name: "Baghat", displayOrder: 8 },
  { name: "Hazratbal", displayOrder: 9 },
  { name: "Nishat", displayOrder: 10 },
];

const delhiDistricts = [
  { name: "Central Delhi", displayOrder: 1 },
  { name: "South Delhi", displayOrder: 2 },
  { name: "North Delhi", displayOrder: 3 },
  { name: "East Delhi", displayOrder: 4 },
  { name: "West Delhi", displayOrder: 5 },
];

const centralDelhiTowns = [
  { name: "Connaught Place", displayOrder: 1 },
  { name: "Karol Bagh", displayOrder: 2 },
  { name: "Paharganj", displayOrder: 3 },
  { name: "Daryaganj", displayOrder: 4 },
  { name: "Chandni Chowk", displayOrder: 5 },
];

async function populateLocations() {
  try {
    console.log('🌍 Starting location population...');
    
    console.log('Adding states...');
    const insertedStates: any[] = [];
    for (const state of statesData) {
      const [inserted] = await db.insert(indianStates).values(state).returning();
      insertedStates.push(inserted);
      console.log(`  ✅ Added state: ${inserted.name}`);
    }

    const jkState = insertedStates.find(s => s.name === "Jammu & Kashmir");
    const delhiState = insertedStates.find(s => s.name === "Delhi");

    if (jkState) {
      console.log('\nAdding J&K districts...');
      const insertedDistricts: any[] = [];
      for (const district of jkDistricts) {
        const [inserted] = await db.insert(indianDistricts).values({
          ...district,
          stateId: jkState.id
        }).returning();
        insertedDistricts.push(inserted);
        console.log(`  ✅ Added district: ${inserted.name}`);
      }

      const srinigarDistrict = insertedDistricts.find(d => d.name === "Srinagar");
      if (srinigarDistrict) {
        console.log('\nAdding Srinagar towns...');
        for (const town of srinigarTowns) {
          const [inserted] = await db.insert(indianTowns).values({
            ...town,
            districtId: srinigarDistrict.id,
            stateId: jkState.id
          }).returning();
          console.log(`  ✅ Added town: ${inserted.name}`);
        }
      }
    }

    if (delhiState) {
      console.log('\nAdding Delhi districts...');
      const insertedDistricts: any[] = [];
      for (const district of delhiDistricts) {
        const [inserted] = await db.insert(indianDistricts).values({
          ...district,
          stateId: delhiState.id
        }).returning();
        insertedDistricts.push(inserted);
        console.log(`  ✅ Added district: ${inserted.name}`);
      }

      const centralDelhiDistrict = insertedDistricts.find(d => d.name === "Central Delhi");
      if (centralDelhiDistrict) {
        console.log('\nAdding Central Delhi towns...');
        for (const town of centralDelhiTowns) {
          const [inserted] = await db.insert(indianTowns).values({
            ...town,
            districtId: centralDelhiDistrict.id,
            stateId: delhiState.id
          }).returning();
          console.log(`  ✅ Added town: ${inserted.name}`);
        }
      }
    }

    console.log('\n✅ Location population complete!');
    console.log(`   States: ${insertedStates.length}`);
    console.log(`   Sample locations ready for testing`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating locations:', error);
    process.exit(1);
  }
}

populateLocations();
