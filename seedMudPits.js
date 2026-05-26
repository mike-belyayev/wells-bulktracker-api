// seedMudPits-force.js
// Run with: node seedMudPits-force.js

const mongoose = require('mongoose');
const Well = require('./src/models/wellModel');

const MONGODB_URI = '****';

const defaultMudPits = [
  { pitName: "Active 1", pitGroup: "Active", order: 0, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "137" }
  ] },
  { pitName: "Active 2", pitGroup: "Active", order: 1, values: [
    { valueName: "Fluid", value: "PreMix" },
    { valueName: "Weight", value: "7.2" },
    { valueName: "Vol. (bbl)", value: "233" }
  ] },
  { pitName: "Active 3", pitGroup: "Active", order: 2, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "405" }
  ] },
  { pitName: "Active 4", pitGroup: "Active", order: 3, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Reserve 1", pitGroup: "Reserve", order: 4, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "372" }
  ] },
  { pitName: "Reserve 2", pitGroup: "Reserve", order: 5, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Reserve 3", pitGroup: "Reserve", order: 6, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Reserve 4", pitGroup: "Reserve", order: 7, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Reserve 5", pitGroup: "Reserve", order: 8, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "192" }
  ] },
  { pitName: "Reserve 6", pitGroup: "Reserve", order: 9, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "40" }
  ] },
  { pitName: "Chem 1", pitGroup: "Chemical", order: 10, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Chem 2", pitGroup: "Chemical", order: 11, values: [
    { valueName: "Fluid", value: "LCM" },
    { valueName: "Weight", value: "12" },
    { valueName: "Vol. (bbl)", value: "100" }
  ] },
  { pitName: "Chem 3", pitGroup: "Chemical", order: 12, values: [
    { valueName: "Fluid", value: "HiVis" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "104" }
  ] },
  { pitName: "Chem 4", pitGroup: "Chemical", order: 13, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "Brine 1", pitGroup: "Brine", order: 14, values: [
    { valueName: "Fluid", value: "Brine" },
    { valueName: "Weight", value: "11.5" },
    { valueName: "Vol. (bbl)", value: "1011" }
  ] },
  { pitName: "Brine 2", pitGroup: "Brine", order: 15, values: [
    { valueName: "Fluid", value: "Brine" },
    { valueName: "Weight", value: "11.5" },
    { valueName: "Vol. (bbl)", value: "1352" }
  ] },
  { pitName: "Slug", pitGroup: "Slug", order: 16, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "13" },
    { valueName: "Vol. (bbl)", value: "96" }
  ] },
  { pitName: "SSt 1", pitGroup: "Starboard", order: 17, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "45" }
  ] },
  { pitName: "SSt 2", pitGroup: "Starboard", order: 18, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "865" }
  ] },
  { pitName: "SSt 3", pitGroup: "Starboard", order: 19, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "91" }
  ] },
  { pitName: "SSt 4", pitGroup: "Starboard", order: 20, values: [
    { valueName: "Fluid", value: "NAF" },
    { valueName: "Weight", value: "10.4" },
    { valueName: "Vol. (bbl)", value: "97" }
  ] },
  { pitName: "Base Oil", pitGroup: "Base Oil", order: 21, values: [
    { valueName: "Fluid", value: "Base Oil" },
    { valueName: "Weight", value: "6.7" },
    { valueName: "Vol. (bbl)", value: "1383" }
  ] },
  { pitName: "PSt 1", pitGroup: "Port", order: 22, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "PSt 2", pitGroup: "Port", order: 23, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] },
  { pitName: "PSt 3", pitGroup: "Port", order: 24, values: [
    { valueName: "Fluid", value: "Empty" },
    { valueName: "Weight", value: "0" },
    { valueName: "Vol. (bbl)", value: "0" }
  ] }
];

async function seedMudPitsForce() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const wells = await Well.find({});
    console.log(`📊 Found ${wells.length} wells`);

    let updatedCount = 0;

    for (const well of wells) {
      console.log(`🔄 FORCE seeding mud pits for well: ${well.wellName} (${well._id})`);
      console.log(`   Previous mud pits count: ${well.mudPits?.length || 0}`);
      
      well.mudPits = defaultMudPits;
      await well.save();
      updatedCount++;
      
      console.log(`   New mud pits count: ${well.mudPits.length}`);
    }

    console.log('\n=== 📋 Seeding Summary ===');
    console.log(`✅ Force updated wells: ${updatedCount}`);
    console.log('🎉 Seeding completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mud pits:', error);
    process.exit(1);
  }
}

seedMudPitsForce();