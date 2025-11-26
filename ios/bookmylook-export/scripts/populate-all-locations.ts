import { db } from '../server/db';
import { indianStates, indianDistricts, indianTowns } from '../shared/schema';
import { eq } from 'drizzle-orm';

const locationData = {
  "Jammu & Kashmir": {
    districts: [
      { name: "Srinagar", towns: ["Lal Chowk", "Dal Lake", "Rajbagh", "Jawahar Nagar", "Badami Bagh", "Soura", "Hazratbal", "Nishat"] },
      { name: "Jammu", towns: ["Gandhi Nagar", "Jammu City", "Bahu Plaza", "Raghunath Bazaar", "Residency Road"] },
      { name: "Anantnag", towns: ["Anantnag Town", "Mattan", "Bijbehara", "Pahalgam"] },
      { name: "Baramulla", towns: ["Baramulla Town", "Sopore", "Uri", "Gulmarg"] },
      { name: "Budgam", towns: ["Budgam Town", "Khansahib", "Beerwah", "Magam"] },
      { name: "Pulwama", towns: ["Pulwama Town", "Shopian", "Tral", "Awantipora"] },
      { name: "Kupwara", towns: ["Kupwara Town", "Handwara", "Tangdhar"] },
      { name: "Bandipora", towns: ["Bandipora Town", "Sumbal", "Gurez"] }
    ]
  },
  "Delhi": {
    districts: [
      { name: "Central Delhi", towns: ["Connaught Place", "Karol Bagh", "Paharganj", "Chandni Chowk", "Daryaganj"] },
      { name: "South Delhi", towns: ["Hauz Khas", "Greater Kailash", "Defence Colony", "Saket", "Lajpat Nagar"] },
      { name: "North Delhi", towns: ["Civil Lines", "Model Town", "Kamla Nagar", "Shakti Nagar"] },
      { name: "East Delhi", towns: ["Preet Vihar", "Laxmi Nagar", "Gandhi Nagar", "Vivek Vihar"] },
      { name: "West Delhi", towns: ["Rajouri Garden", "Janakpuri", "Punjabi Bagh", "Vikaspuri"] },
      { name: "New Delhi", towns: ["Lutyens Delhi", "Chanakyapuri", "Khan Market", "Lodhi Road"] },
      { name: "North East Delhi", towns: ["Seelampur", "Gokulpuri", "Nand Nagri"] },
      { name: "South West Delhi", towns: ["Dwarka", "Vasant Kunj", "Najafgarh"] }
    ]
  },
  "Maharashtra": {
    districts: [
      { name: "Mumbai City", towns: ["Colaba", "Fort", "Marine Drive", "Bandra", "Andheri", "Borivali", "Dadar"] },
      { name: "Mumbai Suburban", towns: ["Thane", "Navi Mumbai", "Kalyan", "Ulhasnagar", "Mira-Bhayandar"] },
      { name: "Pune", towns: ["Shivajinagar", "Kothrud", "Hinjewadi", "Viman Nagar", "Koregaon Park", "Hadapsar"] },
      { name: "Nagpur", towns: ["Sitabuldi", "Dharampeth", "Sadar", "Civil Lines", "Wardha Road"] },
      { name: "Nashik", towns: ["Nashik Road", "Panchavati", "Satpur", "College Road"] },
      { name: "Aurangabad", towns: ["Aurangabad City", "Beed Bypass", "Garkheda", "Cidco"] },
      { name: "Thane", towns: ["Thane City", "Dombivli", "Ambernath", "Badlapur"] },
      { name: "Raigad", towns: ["Panvel", "Kharghar", "Alibag", "Pen"] }
    ]
  },
  "Karnataka": {
    districts: [
      { name: "Bengaluru Urban", towns: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Malleshwaram", "Rajajinagar"] },
      { name: "Mysuru", towns: ["Mysore City", "Vijayanagar", "Kuvempunagar", "Saraswathipuram"] },
      { name: "Mangaluru", towns: ["Mangalore City", "Hampankatta", "Kadri", "Ullal"] },
      { name: "Hubballi-Dharwad", towns: ["Hubli City", "Dharwad City", "Unkal", "Vidyanagar"] },
      { name: "Belagavi", towns: ["Belgaum City", "Camp Area", "Tilakwadi"] },
      { name: "Tumakuru", towns: ["Tumkur City", "Gubbi", "Tiptur"] },
      { name: "Shivamogga", towns: ["Shimoga City", "Bhadravathi", "Sagar"] },
      { name: "Kalaburagi", towns: ["Gulbarga City", "Sedam", "Jewargi"] }
    ]
  },
  "Tamil Nadu": {
    districts: [
      { name: "Chennai", towns: ["T Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore", "Nungambakkam"] },
      { name: "Coimbatore", towns: ["RS Puram", "Gandhipuram", "Saibaba Colony", "Peelamedu"] },
      { name: "Madurai", towns: ["Anna Nagar", "K K Nagar", "Goripalayam", "Pasumalai"] },
      { name: "Tiruchirappalli", towns: ["Trichy City", "Srirangam", "Thillai Nagar"] },
      { name: "Salem", towns: ["Salem City", "Fairlands", "Suramangalam"] },
      { name: "Tirunelveli", towns: ["Tirunelveli Town", "Palayamkottai"] },
      { name: "Vellore", towns: ["Vellore Fort", "Katpadi", "Thorapadi"] },
      { name: "Erode", towns: ["Erode City", "Perundurai", "Bhavani"] }
    ]
  },
  "West Bengal": {
    districts: [
      { name: "Kolkata", towns: ["Park Street", "Salt Lake", "New Town", "Ballygunge", "Alipore", "Behala"] },
      { name: "North 24 Parganas", towns: ["Barasat", "Barrackpore", "Dum Dum", "Madhyamgram"] },
      { name: "South 24 Parganas", towns: ["Baruipur", "Sonarpur", "Diamond Harbour"] },
      { name: "Howrah", towns: ["Howrah City", "Shibpur", "Liluah", "Bally"] },
      { name: "Darjeeling", towns: ["Darjeeling Town", "Siliguri", "Kalimpong"] },
      { name: "Jalpaiguri", towns: ["Jalpaiguri Town", "Mal", "Nagrakata"] },
      { name: "Murshidabad", towns: ["Berhampore", "Kandi", "Domkal"] },
      { name: "Nadia", towns: ["Krishnanagar", "Ranaghat", "Kalyani"] }
    ]
  },
  "Uttar Pradesh": {
    districts: [
      { name: "Lucknow", towns: ["Hazratganj", "Gomti Nagar", "Alambagh", "Aminabad", "Indira Nagar"] },
      { name: "Kanpur", towns: ["Civil Lines", "Swaroop Nagar", "Kidwai Nagar", "Kalyanpur"] },
      { name: "Ghaziabad", towns: ["Indirapuram", "Vaishali", "Raj Nagar", "Kaushambi"] },
      { name: "Agra", towns: ["Civil Lines", "Taj Ganj", "Sadar Bazaar", "Sikandra"] },
      { name: "Meerut", towns: ["Shastri Nagar", "Begum Bridge", "Brahmpuri"] },
      { name: "Varanasi", towns: ["Cantonment", "Sigra", "Sarnath", "Bhelupur"] },
      { name: "Prayagraj", towns: ["Civil Lines", "Katra", "George Town", "Naini"] },
      { name: "Noida", towns: ["Sector 18", "Sector 62", "Greater Noida", "Noida Extension"] }
    ]
  },
  "Rajasthan": {
    districts: [
      { name: "Jaipur", towns: ["Pink City", "C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Mansarovar"] },
      { name: "Jodhpur", towns: ["Jodhpur City", "Ratanada", "Shastri Nagar", "Sardarpura"] },
      { name: "Udaipur", towns: ["Udaipur City", "Fateh Sagar", "Hiran Magri"] },
      { name: "Kota", towns: ["Kota City", "Aerodrome Circle", "Gumanpura"] },
      { name: "Ajmer", towns: ["Ajmer City", "Pushkar", "Nasirabad"] },
      { name: "Bikaner", towns: ["Bikaner City", "Karni Nagar", "Rani Bazar"] },
      { name: "Alwar", towns: ["Alwar City", "Bhiwadi", "Neemrana"] },
      { name: "Jaisalmer", towns: ["Jaisalmer Fort", "Gandhi Colony"] }
    ]
  },
  "Gujarat": {
    districts: [
      { name: "Ahmedabad", towns: ["Maninagar", "Vastrapur", "Satellite", "Bodakdev", "Naranpura"] },
      { name: "Surat", towns: ["Adajan", "Vesu", "Rander", "Athwa", "Katargam"] },
      { name: "Vadodara", towns: ["Alkapuri", "Sayajigunj", "Vasna", "Manjalpur"] },
      { name: "Rajkot", towns: ["Rajkot City", "Kalawad Road", "University Road"] },
      { name: "Gandhinagar", towns: ["Sector 1", "Sector 21", "Kudasan"] },
      { name: "Bhavnagar", towns: ["Bhavnagar City", "Ghogha"] },
      { name: "Jamnagar", towns: ["Jamnagar City", "Bedi", "Khambhalia"] },
      { name: "Anand", towns: ["Anand City", "Vallabh Vidyanagar", "Karamsad"] }
    ]
  },
  "Punjab": {
    districts: [
      { name: "Ludhiana", towns: ["Civil Lines", "Model Town", "Sarabha Nagar", "Dugri"] },
      { name: "Amritsar", towns: ["Golden Temple Area", "Lawrence Road", "Ranjit Avenue", "Mall Road"] },
      { name: "Jalandhar", towns: ["Civil Lines", "Model Town", "Urban Estate"] },
      { name: "Patiala", towns: ["Patiala City", "Baradari", "Leela Bhawan"] },
      { name: "Mohali", towns: ["Phase 1", "Phase 7", "Phase 11", "Kharar"] },
      { name: "Bathinda", towns: ["Bathinda City", "Goniana", "Talwandi Sabo"] },
      { name: "Pathankot", towns: ["Pathankot City", "Dalhousie Road"] },
      { name: "Hoshiarpur", towns: ["Hoshiarpur City", "Garhshankar", "Dasuya"] }
    ]
  }
};

async function populateAllLocations() {
  try {
    console.log('🌍 Starting comprehensive location population...\n');
    
    // Get all existing states
    const states = await db.select().from(indianStates);
    console.log(`Found ${states.length} states in database\n`);
    
    let totalDistricts = 0;
    let totalTowns = 0;
    
    for (const state of states) {
      console.log(`\n📍 Processing: ${state.name}`);
      
      const stateData = locationData[state.name as keyof typeof locationData];
      if (!stateData) {
        console.log(`   ⚠️  No data found for ${state.name}, skipping`);
        continue;
      }
      
      for (const districtData of stateData.districts) {
        // Check if district already exists
        const existingDistrict = await db
          .select()
          .from(indianDistricts)
          .where(eq(indianDistricts.name, districtData.name))
          .limit(1);
        
        let district;
        if (existingDistrict.length > 0) {
          district = existingDistrict[0];
          console.log(`   ✓ District exists: ${districtData.name}`);
        } else {
          [district] = await db.insert(indianDistricts).values({
            name: districtData.name,
            stateId: state.id,
            displayOrder: totalDistricts + 1
          }).returning();
          totalDistricts++;
          console.log(`   ✅ Added district: ${districtData.name}`);
        }
        
        // Add towns for this district
        for (const townName of districtData.towns) {
          // Check if town already exists
          const existingTown = await db
            .select()
            .from(indianTowns)
            .where(eq(indianTowns.name, townName))
            .limit(1);
          
          if (existingTown.length === 0) {
            await db.insert(indianTowns).values({
              name: townName,
              districtId: district.id,
              stateId: state.id,
              displayOrder: totalTowns + 1
            });
            totalTowns++;
          }
        }
        console.log(`      → Added ${districtData.towns.length} towns`);
      }
    }
    
    console.log('\n✅ Location population complete!');
    console.log(`   📊 Summary:`);
    console.log(`   - States: ${states.length}`);
    console.log(`   - New Districts: ${totalDistricts}`);
    console.log(`   - New Towns: ${totalTowns}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating locations:', error);
    process.exit(1);
  }
}

populateAllLocations();
