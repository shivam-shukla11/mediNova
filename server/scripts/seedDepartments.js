require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');

const departments = [
  ['General Medicine', 'General outpatient care'],
  ['Cardiology', 'Heart and cardiovascular care'],
  ['Dermatology', 'Skin conditions'],
  ['Orthopedics', 'Bone, joint and musculoskeletal care'],
  ['Neurology', 'Brain and nervous system care'],
  ['Pediatrics', 'Child health'],
];

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured');
  await mongoose.connect(process.env.MONGO_URI);
  await Department.init();
  for (const [departmentName, description] of departments) {
    await Department.updateOne(
      { departmentName },
      { $setOnInsert: { departmentName, description } },
      { upsert: true, runValidators: true }
    );
  }
  console.log('Starter departments are available; existing records were preserved');
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
