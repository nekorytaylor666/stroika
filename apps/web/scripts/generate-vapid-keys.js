#!/usr/bin/env node

const webpush = require("web-push");

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("Generated VAPID keys:");
console.log("===================");
console.log("");
console.log("Add these to your .env files:");
console.log("");
console.log("# For frontend (.env in apps/web/)");
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log("");
console.log("# For Convex (in Convex dashboard environment variables)");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@yourdomain.com`);
console.log("");
console.log(
	"Keep the private key secure and never commit it to version control!",
);
