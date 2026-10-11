const assert = require('assert');
const axios = require('../frontend/node_modules/axios');

const BASE_URL = 'http://localhost:8080';

async function testRoles() {
  console.log('================== DATAVAULT ROLE VERIFICATION ==================');

  // -------------------------------------------------------------------------
  // 1. Personal User (Role: USER)
  // -------------------------------------------------------------------------
  console.log('\n1. Testing Personal User Role (USER)...');
  const userLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'alice_test@example.com',
    password: 'password123'
  });

  assert.strictEqual(userLoginRes.status, 200, 'User login HTTP status must be 200');
  assert.ok(userLoginRes.data.token, 'User login must return a JWT token');
  assert.strictEqual(userLoginRes.data.email, 'alice_test@example.com', 'User email must match alice_test@example.com');
  assert.strictEqual(userLoginRes.data.role, 'USER', 'User role must be strictly "USER"');
  console.log(`   [PASS] User authentication verified: ${userLoginRes.data.email} (Role: ${userLoginRes.data.role})`);

  const userStatsRes = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${userLoginRes.data.token}` }
  });

  assert.strictEqual(userStatsRes.status, 200, 'User stats HTTP status must be 200');
  assert.strictEqual(userStatsRes.data.success, true, 'User stats success flag must be true');
  const userData = userStatsRes.data.data;
  assert.strictEqual(userData.role, 'USER', 'Stats payload role must be "USER"');
  assert.strictEqual(typeof userData.vaultRecordsCount, 'number', 'vaultRecordsCount must be a number');
  assert.strictEqual(typeof userData.documentsCount, 'number', 'documentsCount must be a number');
  assert.strictEqual(typeof userData.pendingRequestsCount, 'number', 'pendingRequestsCount must be a number');
  assert.strictEqual(typeof userData.activePermissionsCount, 'number', 'activePermissionsCount must be a number');
  assert.strictEqual(typeof userData.revokedPermissionsCount, 'number', 'revokedPermissionsCount must be a number');
  assert.strictEqual(typeof userData.expiredPermissionsCount, 'number', 'expiredPermissionsCount must be a number');
  assert.strictEqual(typeof userData.emergencyLockActive, 'boolean', 'emergencyLockActive must be a boolean');
  assert.ok(Array.isArray(userData.recentAuditLogs), 'recentAuditLogs must be an array');
  // Admin-only fields must NOT be present on user payload
  assert.strictEqual(userData.totalUsers, undefined, 'totalUsers must not be exposed to USER');
  assert.strictEqual(userData.totalOrganizations, undefined, 'totalOrganizations must not be exposed to USER');
  console.log('   [PASS] User dashboard stats verified (personal vault metrics confirmed).');

  // -------------------------------------------------------------------------
  // 2. Organization User (Role: ORGANIZATION)
  // -------------------------------------------------------------------------
  console.log('\n2. Testing Organization Role (ORGANIZATION)...');
  const orgLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@globalhealth.org',
    password: 'password123'
  });

  assert.strictEqual(orgLoginRes.status, 200, 'Org login HTTP status must be 200');
  assert.ok(orgLoginRes.data.token, 'Org login must return a JWT token');
  assert.strictEqual(orgLoginRes.data.email, 'admin@globalhealth.org', 'Org email must match admin@globalhealth.org');
  assert.strictEqual(orgLoginRes.data.role, 'ORGANIZATION', 'Org role must be strictly "ORGANIZATION"');
  assert.ok(orgLoginRes.data.organizationName, 'organizationName must be populated');
  console.log(`   [PASS] Organization authentication verified: ${orgLoginRes.data.organizationName} (Role: ${orgLoginRes.data.role})`);

  const orgStatsRes = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${orgLoginRes.data.token}` }
  });

  assert.strictEqual(orgStatsRes.status, 200, 'Org stats HTTP status must be 200');
  assert.strictEqual(orgStatsRes.data.success, true, 'Org stats success flag must be true');
  const orgData = orgStatsRes.data.data;
  assert.strictEqual(orgData.role, 'ORGANIZATION', 'Stats payload role must be "ORGANIZATION"');
  assert.strictEqual(typeof orgData.pendingRequestsCount, 'number', 'pendingRequestsCount must be a number');
  assert.strictEqual(typeof orgData.approvedRequestsCount, 'number', 'approvedRequestsCount must be a number');
  assert.strictEqual(typeof orgData.activePermissionsCount, 'number', 'activePermissionsCount must be a number');
  assert.strictEqual(typeof orgData.expiredPermissionsCount, 'number', 'expiredPermissionsCount must be a number');
  assert.strictEqual(typeof orgData.revokedPermissionsCount, 'number', 'revokedPermissionsCount must be a number');
  assert.ok(Array.isArray(orgData.recentAuditLogs), 'recentAuditLogs must be an array');
  // Admin-only fields must NOT be present on org payload
  assert.strictEqual(orgData.totalUsers, undefined, 'totalUsers must not be exposed to ORGANIZATION');
  assert.strictEqual(orgData.totalOrganizations, undefined, 'totalOrganizations must not be exposed to ORGANIZATION');
  console.log('   [PASS] Organization dashboard stats verified (request/permission metrics confirmed).');

  // -------------------------------------------------------------------------
  // 3. System Administrator (Role: ADMIN)
  // -------------------------------------------------------------------------
  console.log('\n3. Testing System Administrator Role (ADMIN)...');
  const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@datavault.com',
    password: 'password123'
  });

  assert.strictEqual(adminLoginRes.status, 200, 'Admin login HTTP status must be 200');
  assert.ok(adminLoginRes.data.token, 'Admin login must return a JWT token');
  assert.strictEqual(adminLoginRes.data.email, 'admin@datavault.com', 'Admin email must match admin@datavault.com');
  assert.strictEqual(adminLoginRes.data.role, 'ADMIN', 'Admin role must be strictly "ADMIN"');
  console.log(`   [PASS] Admin authentication verified: ${adminLoginRes.data.fullName} (Role: ${adminLoginRes.data.role})`);

  const adminStatsRes = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${adminLoginRes.data.token}` }
  });

  assert.strictEqual(adminStatsRes.status, 200, 'Admin stats HTTP status must be 200');
  assert.strictEqual(adminStatsRes.data.success, true, 'Admin stats success flag must be true');
  const adminData = adminStatsRes.data.data;
  assert.strictEqual(adminData.role, 'ADMIN', 'Stats payload role must be "ADMIN"');
  assert.strictEqual(typeof adminData.totalUsers, 'number', 'totalUsers must be a number');
  assert.strictEqual(typeof adminData.totalOrganizations, 'number', 'totalOrganizations must be a number');
  assert.strictEqual(typeof adminData.totalVaultRecords, 'number', 'totalVaultRecords must be a number');
  assert.strictEqual(typeof adminData.totalDocuments, 'number', 'totalDocuments must be a number');
  assert.strictEqual(typeof adminData.totalRequests, 'number', 'totalRequests must be a number');
  assert.strictEqual(typeof adminData.totalPermissions, 'number', 'totalPermissions must be a number');
  assert.strictEqual(typeof adminData.totalAuditLogs, 'number', 'totalAuditLogs must be a number');
  assert.ok(Array.isArray(adminData.recentAuditLogs), 'recentAuditLogs must be an array');
  assert.ok(adminData.recentAuditLogs.length <= 5, 'recentAuditLogs must contain at most 5 recent logs');
  console.log('   [PASS] Admin System Overview statistics verified:');
  console.log(`          - Total Users:         ${adminData.totalUsers}`);
  console.log(`          - Total Organizations: ${adminData.totalOrganizations}`);
  console.log(`          - Total Vault Records: ${adminData.totalVaultRecords}`);
  console.log(`          - Total Documents:     ${adminData.totalDocuments}`);
  console.log(`          - Total Requests:      ${adminData.totalRequests}`);
  console.log(`          - Total Permissions:   ${adminData.totalPermissions}`);
  console.log(`          - Total Audit Logs:    ${adminData.totalAuditLogs}`);

  // -------------------------------------------------------------------------
  // 4. Platform Audit Logs for ADMIN
  // -------------------------------------------------------------------------
  console.log('\n4. Testing Platform Audit Logs Retrieval for ADMIN...');
  const auditRes = await axios.get(`${BASE_URL}/api/audit-logs`, {
    headers: { Authorization: `Bearer ${adminLoginRes.data.token}` }
  });

  assert.strictEqual(auditRes.status, 200, 'Audit logs HTTP status must be 200');
  assert.strictEqual(auditRes.data.success, true, 'Audit logs response success must be true');
  assert.ok(Array.isArray(auditRes.data.data), 'Audit logs data must be an array');
  assert.ok(auditRes.data.data.length > 0, 'Audit logs must contain recorded events');
  const sampleLog = auditRes.data.data[0];
  assert.ok(sampleLog.id, 'Audit log entry must have an id');
  assert.ok(sampleLog.timestamp, 'Audit log entry must have a timestamp');
  assert.ok(sampleLog.action, 'Audit log entry must have an action');
  assert.ok(sampleLog.actorEmail, 'Audit log entry must have an actorEmail');
  assert.ok(sampleLog.outcome, 'Audit log entry must have an outcome');
  console.log(`   [PASS] Platform audit trail verified (${auditRes.data.data.length} total events).`);

  console.log('\n==================================================================');
  console.log('>>> ALL EXPLICIT ASSERTIONS PASSED WITH 100% SUCCESS! <<<');
  console.log('==================================================================');
}

testRoles().catch(err => {
  console.error('\n[ASSERTION / TEST FAILURE]:', err.message);
  if (err.response?.data) {
    console.error('Server response:', err.response.data);
  }
  process.exit(1);
});
