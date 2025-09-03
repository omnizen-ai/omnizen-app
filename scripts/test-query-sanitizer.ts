#!/usr/bin/env npx tsx

import { sanitizeSQLQuery, sanitizeNaturalQuery, extractQueryPattern } from '../lib/ai/query-sanitizer';

console.log('Testing Query Sanitizer\n');
console.log('='.repeat(80));

// Test SQL Query Sanitization
const testSQLQueries = [
  `SELECT * FROM invoices WHERE organization_id = '11111111-1111-1111-1111-111111111111' AND customer_id = '7c08fc98-a801-407a-98fc-f24b7e352bfb'`,
  `SELECT i.*, c.company_name FROM invoices i JOIN contacts c ON i.customer_id = c.id WHERE i.organization_id = '11111111-1111-1111-1111-111111111111' AND c.company_name ILIKE '%Acme Corp%'`,
  `UPDATE organizations SET name = 'Anchorblock Technology', email = 'info@anchorblock.com' WHERE id = '11111111-1111-1111-1111-111111111111'`,
  `SELECT * FROM contacts WHERE email = 'john.doe@example.com' AND created_by = 'user-123-456'`,
  `SELECT SUM(total_amount) FROM invoices WHERE organization_id = '11111111-1111-1111-1111-111111111111' AND issue_date >= '2024-01-01'`,
];

console.log('SQL QUERY SANITIZATION TESTS:\n');
testSQLQueries.forEach((query, i) => {
  console.log(`Test ${i + 1}:`);
  console.log('Original:', query);
  console.log('Sanitized:', sanitizeSQLQuery(query));
  console.log('Pattern:', extractQueryPattern(query));
  console.log('-'.repeat(80));
});

// Test Natural Language Sanitization
const testNaturalQueries = [
  'my company is anchorblock technology limited, show me all invoices',
  'show invoices for bkash from january 2024',
  'add customer John Doe with email john@example.com and phone +1-555-123-4567',
  'house 432, road 6, avenue 5, mirpur dohs, dhaka bangladesh',
  'calculate total revenue of $15000 for TechCorp Limited',
  'setup books for Acme Corporation with tax ID 123456789',
];

console.log('\nNATURAL LANGUAGE SANITIZATION TESTS:\n');
testNaturalQueries.forEach((query, i) => {
  console.log(`Test ${i + 1}:`);
  console.log('Original:', query);
  console.log('Sanitized:', sanitizeNaturalQuery(query));
  console.log('-'.repeat(80));
});

// Test edge cases
console.log('\nEDGE CASES:\n');
const edgeCases = [
  '',
  null,
  undefined,
  'SELECT * FROM users',
  'show me everything',
];

edgeCases.forEach((query, i) => {
  console.log(`Edge Case ${i + 1}:`);
  console.log('Input:', query);
  console.log('SQL Sanitized:', sanitizeSQLQuery(query as string));
  console.log('Natural Sanitized:', sanitizeNaturalQuery(query as string));
  console.log('-'.repeat(80));
});

console.log('\nSanitization testing complete!');