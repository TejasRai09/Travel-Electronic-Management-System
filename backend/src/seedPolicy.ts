import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from './mongo.js';
import { TravelPolicy } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config();

const seedTravelPolicy = async () => {
  try {
    console.log('Connecting to database...');
    await connectDb();
    
    // Check if policy already exists
    const existingPolicy = await TravelPolicy.findOne({ policyVersion: '2025' });
    
    if (existingPolicy) {
      console.log('Policy version 2025 already exists. Skipping seed.');
      process.exit(0);
    }
    
    console.log('Seeding travel policy...');
    
    const initialPolicy = {
      policyName: 'Travel Policy - Domestic',
      policyVersion: '2025',
      impactLevels: [
        {
          level: 'UC',
          description: 'Upper Corporate - CMD, MD, CXO Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Business'] },
            trainTravel: { allowed: true, classes: ['1AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Hired Taxi (Luxury Car)'] }
        },
        {
          level: '1',
          description: 'Grade 1 - SVP, VP Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Premium Economy', 'Economy'] },
            trainTravel: { allowed: true, classes: ['1AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Hired Taxi (Standard AC Car)'] }
        },
        {
          level: '2A',
          description: 'Grade 2A - GM Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['1AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Sedan / Premium / Go)'] }
        },
        {
          level: '2B',
          description: 'Grade 2B - DGM Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['1AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Sedan / Premium / Go)'] }
        },
        {
          level: '2C',
          description: 'Grade 2C',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['1AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Sedan / Premium / Go)'] }
        },
        {
          level: '3A',
          description: 'Grade 3A - Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '3B',
          description: 'Grade 3B - Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '3C',
          description: 'Grade 3C - Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'Executive Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '4A',
          description: 'Grade 4A - Assistant Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '4B',
          description: 'Grade 4B - Assistant Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '4C',
          description: 'Grade 4C - Assistant Manager Level',
          travelMode: {
            airTravel: { allowed: true, classes: ['Economy'] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: false, types: [] }
          },
          localConveyance: { options: ['Ride Hailing (Uber Go)'] }
        },
        {
          level: '5A',
          description: 'Grade 5A - Officer Level (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['Uber Go', 'Uber Auto', 'Public Transport'] }
        },
        {
          level: '5B',
          description: 'Grade 5B - Officer Level (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['Uber Go', 'Uber Auto', 'Public Transport'] }
        },
        {
          level: '5C',
          description: 'Grade 5C - Officer Level (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['2AC', 'AC Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['Uber Go', 'Uber Auto', 'Public Transport'] }
        },
        {
          level: '6A',
          description: 'Grade 6A - Junior Staff (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['3AC', 'Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['3-Wheeler', 'Public Transport'] }
        },
        {
          level: '6B',
          description: 'Grade 6B - Junior Staff (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['3AC', 'Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['3-Wheeler', 'Public Transport'] }
        },
        {
          level: '6C',
          description: 'Grade 6C - Junior Staff (NO AIR TRAVEL)',
          travelMode: {
            airTravel: { allowed: false, classes: [] },
            trainTravel: { allowed: true, classes: ['3AC', 'Chair Car'] },
            publicTransport: { allowed: true, types: ['AC Bus'] }
          },
          localConveyance: { options: ['3-Wheeler', 'Public Transport'] }
        }
      ],
      cityGroups: [
        {
          name: 'Group A',
          cities: [
            'Mumbai', 'Thane', 'Navi Mumbai', 'Delhi', 'Noida', 'Greater Noida', 
            'Faridabad', 'Gurgaon', 'Ghaziabad', 'Kolkata', 'Chennai', 'Pune', 
            'Bangalore', 'Hyderabad', 'Ahmedabad'
          ],
          roomRentLimit: 0, // Actual expenses
          foodExpenseLimit: 0 // Actual expenses
        },
        {
          name: 'Group B',
          cities: [
            'Goa', 'Agra', 'Cochin', 'Calicut', 'Coimbatore', 'Indore', 'Kanpur', 
            'Surat', 'Udaipur', 'Varanasi', 'Vishakhapatnam', 'Vijaywada', 'Ludhiana', 
            'Cuttack', 'Vadodara', 'Mangalore', 'Mysore', 'Hubli', 'Belgaum', 'Nagpur', 
            'Aurangabad', 'Allahabad', 'Gorakhpur', 'Amritsar', 'Jalandhar', 'Bareilly', 
            'Meerut', 'Bhubaneswar', 'Raipur', 'Ranchi', 'Patna', 'Lucknow', 'Jaipur', 
            'Chandigarh', 'Shimla', 'Gangtok', 'Imphal', 'Aizawl', 'Shillong', 'Agartala', 
            'Kohima', 'Itanagar', 'Dispur', 'Thiruvananthapuram', 'Panaji', 'Jaipur', 
            'Dehradun', 'Srinagar', 'Jammu'
          ],
          roomRentLimit: 5000,
          foodExpenseLimit: 3000
        },
        {
          name: 'Group C',
          cities: ['Other Cities'],
          roomRentLimit: 3000,
          foodExpenseLimit: 3000
        }
      ],
      policyRules: {
        incidentalExpenses: 3000,
        advanceBookingDays: 7,
        expenseSubmissionDays: 5,
        expenseSettlementDays: 7,
        outstandingAdvanceWeeks: 3,
        roomRentDeviationPercent: 15,
        requireOriginalBills: true,
        guestHouseMandatory: true,
        alcoholReimbursement: false,
        cigaretteReimbursement: false
      },
      isActive: true,
      effectiveFrom: new Date('2025-01-01'),
      createdBy: 'system',
      updatedBy: 'system'
    };
    
    const policy = new TravelPolicy(initialPolicy);
    await policy.save();
    
    console.log('✓ Travel policy seeded successfully!');
    console.log(`  Policy: ${policy.policyName} v${policy.policyVersion}`);
    console.log(`  Impact Levels: ${policy.impactLevels.length}`);
    console.log(`  City Groups: ${policy.cityGroups.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding travel policy:', err);
    process.exit(1);
  }
};

seedTravelPolicy();
