import mongoose from 'mongoose';

// Standard Connection String (Sometimes bypassing SRV helps)
// Attempting to resolve DNS manually...
// If this script fails, you have a hard network block.

const URI = "mongodb+srv://zaynahspos_db_user:dbJ6ime4PgNyJkzd@cluster0.gqwsjdu.mongodb.net/shopgenius?retryWrites=true&w=majority";

console.log("-------------------------------------------------");
console.log("🛠️  NETWORK DIAGNOSTIC TOOL");
console.log("-------------------------------------------------");
console.log(`Target: ${URI}`);
console.log("\nAttempting connection...");

mongoose.connect(URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4
})
.then(() => {
    console.log("\n✅ SUCCESS! Connected to MongoDB.");
    console.log("Your network is fine. If the app fails, restart it.");
    process.exit(0);
})
.catch(err => {
    console.error("\n❌ CONNECTION FAILED");
    console.error(`Error Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
    
    if (err.message.includes('ETIMEOUT') || err.message.includes('queryTxt')) {
        console.log("\n--- TROUBLESHOOTING STEPS ---");
        console.log("1. IP WHITELISTING (Most Likely):");
        console.log("   Go to https://cloud.mongodb.com > Network Access");
        console.log("   Click 'Add IP Address' > 'Allow Access from Anywhere' (0.0.0.0/0)");
        console.log("   Wait 2 minutes and run this script again.");
        console.log("\n2. DNS ISSUE:");
        console.log("   Change your computer's DNS to Google (8.8.8.8).");
    }
    process.exit(1);
});
