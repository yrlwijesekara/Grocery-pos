const Customer = require('../models/Customer');

// Script to test loyalty points calculation locally

function testLoyaltyPoints() {
  console.log('=== LOYALTY POINTS CALCULATION TEST ===\n');

  // Test different spending amounts and tiers
  const testCases = [
    { spending: 10, tier: 'bronze', hasMemership: true },
    { spending: 50, tier: 'bronze', hasMemership: true },
    { spending: 100, tier: 'bronze', hasMemership: true },
    { spending: 100, tier: 'silver', hasMemership: true },
    { spending: 100, tier: 'gold', hasMemership: true },
    { spending: 100, tier: 'platinum', hasMemership: true },
    { spending: 100, tier: 'bronze', hasMemership: false }, // No membership
  ];

  console.log('LOYALTY POINTS FORMULA:');
  console.log('- 1 point per $1 spent (100% rate, not 1%)');
  console.log('- Tier multipliers applied to base points');
  console.log('- Only for customers with membership numbers\n');

  testCases.forEach((test, index) => {
    // Create test customer
    const customer = new Customer({
      customerId: `TEST${index}`,
      firstName: 'Test',
      lastName: 'Customer',
      loyaltyProgram: {
        tier: test.tier,
        points: 0,
        membershipNumber: test.hasMemership ? `LP${Date.now()}${index}` : null
      }
    });

    console.log(`Test ${index + 1}: $${test.spending} - ${test.tier.toUpperCase()} ${test.hasMemership ? 'WITH' : 'WITHOUT'} membership`);
    
    const pointsBefore = customer.loyaltyProgram.points;
    const pointsEarned = customer.addPoints(test.spending);
    const pointsAfter = customer.loyaltyProgram.points;

    console.log(`  Before: ${pointsBefore} points`);
    console.log(`  Earned: ${pointsEarned} points`);
    console.log(`  After: ${pointsAfter} points`);
    console.log(`  Expected: ${test.hasMemership ? Math.floor(test.spending * getTierMultiplier(test.tier)) : 0} points`);
    console.log('');
  });

  console.log('TROUBLESHOOTING CHECKLIST:');
  console.log('1. ✅ Customer must have loyalty membership number');
  console.log('2. ✅ Points = Math.floor(amount * tier_multiplier)');
  console.log('3. ✅ Check server logs for transaction processing');
  console.log('4. ✅ Verify customer is selected during checkout');
  console.log('5. ✅ Check browser network tab for API calls');
}

function getTierMultiplier(tier) {
  switch (tier) {
    case 'silver': return 1.25;
    case 'gold': return 1.5;
    case 'platinum': return 2;
    default: return 1;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testLoyaltyPoints();
}

module.exports = testLoyaltyPoints;