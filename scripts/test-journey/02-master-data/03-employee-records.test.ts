/**
 * Test: Employee Records
 * Tests creating and managing employee data
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testCreateEmployees() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-employees',
    'hr@anchorblock.ai',
    'professional'
  )
  
  // Create employees with different roles
  const employees = [
    {
      first_name: 'Alex',
      last_name: 'Chen',
      email: 'alex@anchorblock.ai',
      job_title: 'Chief Executive Officer',
      department: 'Executive',
      employee_id: 'EMP001',
      salary: 250000,
      start_date: '2020-01-15'
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@anchorblock.ai',
      job_title: 'Chief Financial Officer',
      department: 'Finance',
      employee_id: 'EMP002',
      salary: 200000,
      start_date: '2020-03-01'
    },
    {
      first_name: 'Mike',
      last_name: 'Wilson',
      email: 'mike@anchorblock.ai',
      job_title: 'VP of Sales',
      department: 'Sales',
      employee_id: 'EMP003',
      salary: 150000,
      start_date: '2020-06-01'
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily@anchorblock.ai',
      job_title: 'Senior Software Engineer',
      department: 'Engineering',
      employee_id: 'EMP004',
      salary: 120000,
      start_date: '2021-01-15'
    },
    {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@anchorblock.ai',
      job_title: 'Customer Success Manager',
      department: 'Support',
      employee_id: 'EMP005',
      salary: 80000,
      start_date: '2021-08-01'
    }
  ]
  
  const createdEmployees = []
  
  for (const emp of employees) {
    const { data: employee, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'employee',
        first_name: emp.first_name,
        last_name: emp.last_name,
        display_name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        company_name: 'Anchorblock Technology Limited',
        custom_fields: {
          employee_id: emp.employee_id,
          job_title: emp.job_title,
          department: emp.department,
          annual_salary: emp.salary,
          start_date: emp.start_date,
          employment_status: 'active',
          employment_type: 'full_time',
          reports_to: emp.department === 'Executive' ? null : 'EMP001'
        },
        is_active: true
      })
      .select()
      .single()
    
    assertTrue(!error, `Employee ${emp.first_name} should be created`)
    assertEqual(employee.type, 'employee', 'Should be marked as employee')
    createdEmployees.push(employee)
  }
  
  // Calculate total payroll
  const totalPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0)
  assertEqual(totalPayroll, 800000, 'Total annual payroll should be $800,000')
  
  return { org, employees: createdEmployees }
}

async function testEmployeeDepartments() {
  const { org } = await createTestOrganization(
    'Department Test Org',
    'dept-test',
    'hr@dept.ai',
    'professional'
  )
  
  // Define department structure
  const departments = [
    { name: 'Engineering', code: 'ENG', budget: 2000000, headcount: 10 },
    { name: 'Sales', code: 'SALES', budget: 1000000, headcount: 5 },
    { name: 'Marketing', code: 'MKT', budget: 500000, headcount: 3 },
    { name: 'Finance', code: 'FIN', budget: 300000, headcount: 2 },
    { name: 'Operations', code: 'OPS', budget: 400000, headcount: 4 }
  ]
  
  // Create employees for each department
  for (const dept of departments) {
    for (let i = 1; i <= Math.min(dept.headcount, 3); i++) {
      await supabaseAdmin
        .from('contacts')
        .insert({
          organization_id: org.id,
          type: 'employee',
          first_name: `${dept.name}`,
          last_name: `Employee${i}`,
          display_name: `${dept.name} Employee${i}`,
          email: `${dept.code.toLowerCase()}${i}@company.ai`,
          custom_fields: {
            employee_id: `${dept.code}${String(i).padStart(3, '0')}`,
            department: dept.name,
            department_code: dept.code,
            department_budget: dept.budget,
            cost_center: dept.code
          }
        })
    }
  }
  
  // Query employees by department
  const { data: engEmployees } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'employee')
    .contains('custom_fields', { department: 'Engineering' })
  
  assertTrue(engEmployees.length >= 3, 'Engineering should have at least 3 employees')
  
  // Verify all departments have employees
  for (const dept of departments) {
    const { data: deptEmployees } = await supabaseAdmin
      .from('contacts')
      .select()
      .eq('organization_id', org.id)
      .contains('custom_fields', { department: dept.name })
    
    assertTrue(deptEmployees.length > 0, `${dept.name} should have employees`)
  }
}

async function testEmployeeHierarchy() {
  const { org } = await createTestOrganization(
    'Hierarchy Test Org',
    'hierarchy-emp',
    'hr@hierarchy.ai',
    'enterprise'
  )
  
  // Create organizational hierarchy
  const hierarchy = [
    // C-Suite
    { id: 'CEO', name: 'CEO', title: 'Chief Executive Officer', reports_to: null, level: 1 },
    
    // VPs reporting to CEO
    { id: 'CTO', name: 'CTO', title: 'Chief Technology Officer', reports_to: 'CEO', level: 2 },
    { id: 'CFO', name: 'CFO', title: 'Chief Financial Officer', reports_to: 'CEO', level: 2 },
    { id: 'VP_SALES', name: 'VP Sales', title: 'VP of Sales', reports_to: 'CEO', level: 2 },
    
    // Directors reporting to VPs
    { id: 'DIR_ENG', name: 'Engineering Director', title: 'Director of Engineering', reports_to: 'CTO', level: 3 },
    { id: 'DIR_FIN', name: 'Finance Director', title: 'Director of Finance', reports_to: 'CFO', level: 3 },
    { id: 'DIR_SALES', name: 'Sales Director', title: 'Director of Sales', reports_to: 'VP_SALES', level: 3 },
    
    // Managers reporting to Directors
    { id: 'MGR_ENG1', name: 'Eng Manager 1', title: 'Engineering Manager', reports_to: 'DIR_ENG', level: 4 },
    { id: 'MGR_ENG2', name: 'Eng Manager 2', title: 'Engineering Manager', reports_to: 'DIR_ENG', level: 4 },
    
    // Individual contributors
    { id: 'ENG1', name: 'Engineer 1', title: 'Software Engineer', reports_to: 'MGR_ENG1', level: 5 },
    { id: 'ENG2', name: 'Engineer 2', title: 'Software Engineer', reports_to: 'MGR_ENG1', level: 5 },
    { id: 'ENG3', name: 'Engineer 3', title: 'Software Engineer', reports_to: 'MGR_ENG2', level: 5 }
  ]
  
  const employeeMap = {}
  
  for (const emp of hierarchy) {
    const { data: employee } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'employee',
        first_name: emp.name.split(' ')[0],
        last_name: emp.name.split(' ').slice(1).join(' ') || 'Employee',
        display_name: emp.name,
        email: `${emp.id.toLowerCase()}@company.ai`,
        custom_fields: {
          employee_id: emp.id,
          job_title: emp.title,
          reports_to: emp.reports_to,
          org_level: emp.level,
          direct_reports: []
        }
      })
      .select()
      .single()
    
    employeeMap[emp.id] = employee
  }
  
  // Update direct reports
  for (const emp of hierarchy) {
    if (emp.reports_to) {
      const manager = employeeMap[emp.reports_to]
      const directReports = manager.custom_fields.direct_reports || []
      directReports.push(emp.id)
      
      await supabaseAdmin
        .from('contacts')
        .update({
          custom_fields: {
            ...manager.custom_fields,
            direct_reports: directReports
          }
        })
        .eq('id', manager.id)
    }
  }
  
  // Verify hierarchy
  const ceo = employeeMap['CEO']
  assertTrue(ceo.custom_fields.reports_to === null, 'CEO should not report to anyone')
  assertTrue(ceo.custom_fields.org_level === 1, 'CEO should be level 1')
  
  const cto = employeeMap['CTO']
  assertEqual(cto.custom_fields.reports_to, 'CEO', 'CTO should report to CEO')
  assertEqual(cto.custom_fields.org_level, 2, 'CTO should be level 2')
}

async function testEmployeeCompensation() {
  const { org } = await createTestOrganization(
    'Compensation Test Org',
    'comp-test',
    'hr@comp.ai',
    'professional'
  )
  
  // Create employees with detailed compensation
  const employees = [
    {
      name: 'Executive Employee',
      base_salary: 200000,
      bonus_target: 50000,
      equity: 10000,
      benefits_value: 30000
    },
    {
      name: 'Senior Employee',
      base_salary: 120000,
      bonus_target: 18000,
      equity: 5000,
      benefits_value: 25000
    },
    {
      name: 'Mid Employee',
      base_salary: 85000,
      bonus_target: 8500,
      equity: 2000,
      benefits_value: 20000
    },
    {
      name: 'Junior Employee',
      base_salary: 65000,
      bonus_target: 3250,
      equity: 1000,
      benefits_value: 18000
    }
  ]
  
  for (const emp of employees) {
    const { data: employee } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'employee',
        first_name: emp.name.split(' ')[0],
        last_name: emp.name.split(' ')[1],
        display_name: emp.name,
        custom_fields: {
          compensation: {
            base_salary: emp.base_salary,
            bonus_target: emp.bonus_target,
            bonus_percentage: (emp.bonus_target / emp.base_salary) * 100,
            equity_shares: emp.equity,
            benefits_value: emp.benefits_value,
            total_comp: emp.base_salary + emp.bonus_target + emp.equity + emp.benefits_value,
            pay_frequency: 'bi-weekly',
            pay_per_period: Math.round(emp.base_salary / 26)
          }
        }
      })
      .select()
      .single()
    
    assertTrue(employee.custom_fields.compensation, 'Should have compensation data')
    assertTrue(
      employee.custom_fields.compensation.total_comp > emp.base_salary,
      'Total comp should exceed base salary'
    )
  }
  
  // Calculate total compensation budget
  const totalCompBudget = employees.reduce(
    (sum, emp) => sum + emp.base_salary + emp.bonus_target + emp.equity + emp.benefits_value,
    0
  )
  assertEqual(totalCompBudget, 569750, 'Total compensation budget should be $569,750')
}

async function testEmployeeTimeOff() {
  const { org } = await createTestOrganization(
    'Time Off Test Org',
    'timeoff-test',
    'hr@timeoff.ai',
    'growth'
  )
  
  // Create employees with PTO balances
  const employees = [
    {
      name: 'Senior Employee',
      tenure_years: 5,
      pto_annual: 20,
      pto_taken: 10,
      pto_remaining: 10,
      sick_days: 10,
      sick_taken: 2
    },
    {
      name: 'Mid Employee',
      tenure_years: 2,
      pto_annual: 15,
      pto_taken: 5,
      pto_remaining: 10,
      sick_days: 10,
      sick_taken: 0
    },
    {
      name: 'New Employee',
      tenure_years: 0.5,
      pto_annual: 10,
      pto_taken: 2,
      pto_remaining: 8,
      sick_days: 10,
      sick_taken: 1
    }
  ]
  
  for (const emp of employees) {
    const { data: employee } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'employee',
        display_name: emp.name,
        custom_fields: {
          time_off: {
            pto_annual_allotment: emp.pto_annual,
            pto_taken_ytd: emp.pto_taken,
            pto_remaining: emp.pto_remaining,
            pto_accrual_rate: emp.pto_annual / 12, // Monthly accrual
            sick_days_annual: emp.sick_days,
            sick_days_taken: emp.sick_taken,
            sick_days_remaining: emp.sick_days - emp.sick_taken,
            tenure_years: emp.tenure_years,
            next_accrual_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      })
      .select()
      .single()
    
    assertEqual(
      employee.custom_fields.time_off.pto_remaining,
      emp.pto_remaining,
      'PTO remaining should match'
    )
  }
}

async function testContractorsVsEmployees() {
  const { org } = await createTestOrganization(
    'Contractor Test Org',
    'contractor-test',
    'hr@contractor.ai',
    'professional'
  )
  
  // Create mix of employees and contractors
  const workers = [
    {
      name: 'Full Time Employee',
      type: 'employee',
      employment_type: 'full_time',
      hourly_rate: null,
      salary: 100000
    },
    {
      name: 'Part Time Employee',
      type: 'employee',
      employment_type: 'part_time',
      hourly_rate: 50,
      salary: null
    },
    {
      name: 'Contractor 1',
      type: 'contractor',
      employment_type: 'contractor',
      hourly_rate: 150,
      salary: null
    },
    {
      name: 'Contractor 2',
      type: 'contractor',
      employment_type: 'contractor',
      hourly_rate: 200,
      salary: null
    }
  ]
  
  for (const worker of workers) {
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: worker.type === 'contractor' ? 'vendor' : 'employee',
        display_name: worker.name,
        custom_fields: {
          employment_type: worker.employment_type,
          hourly_rate: worker.hourly_rate,
          annual_salary: worker.salary,
          is_w2: worker.type === 'employee',
          is_1099: worker.type === 'contractor',
          requires_timesheet: worker.hourly_rate !== null
        }
      })
      .select()
      .single()
    
    if (worker.type === 'contractor') {
      assertTrue(contact.custom_fields.is_1099, 'Contractor should be 1099')
      assertTrue(contact.custom_fields.requires_timesheet, 'Contractor should require timesheet')
    } else {
      assertTrue(contact.custom_fields.is_w2, 'Employee should be W2')
    }
  }
  
  // Query employees vs contractors
  const { data: employees } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'employee')
  
  const { data: contractors } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'vendor')
    .contains('custom_fields', { employment_type: 'contractor' })
  
  assertEqual(employees.length, 2, 'Should have 2 employees')
  assertEqual(contractors.length, 2, 'Should have 2 contractors')
}

async function testEmployeeOnboardingOffboarding() {
  const { org } = await createTestOrganization(
    'Onboarding Test Org',
    'onboard-test',
    'hr@onboard.ai',
    'professional'
  )
  
  // Create employees in different stages
  const employees = [
    {
      name: 'New Hire',
      status: 'onboarding',
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Starts in 2 weeks
      onboarding_tasks: ['Equipment ordered', 'Accounts created', 'Training scheduled']
    },
    {
      name: 'Active Employee',
      status: 'active',
      start_date: '2023-01-01',
      onboarding_tasks: ['Complete']
    },
    {
      name: 'Departing Employee',
      status: 'offboarding',
      start_date: '2022-01-01',
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Leaves in 30 days
      offboarding_tasks: ['Knowledge transfer', 'Equipment return', 'Access revocation']
    },
    {
      name: 'Former Employee',
      status: 'terminated',
      start_date: '2021-01-01',
      end_date: '2023-12-31',
      termination_type: 'voluntary',
      eligible_for_rehire: true
    }
  ]
  
  for (const emp of employees) {
    const { data: employee } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'employee',
        display_name: emp.name,
        is_active: emp.status === 'active' || emp.status === 'onboarding',
        custom_fields: {
          employment_status: emp.status,
          start_date: emp.start_date,
          end_date: emp.end_date || null,
          onboarding_tasks: emp.onboarding_tasks || [],
          offboarding_tasks: emp.offboarding_tasks || [],
          termination_type: emp.termination_type || null,
          eligible_for_rehire: emp.eligible_for_rehire || null
        }
      })
      .select()
      .single()
    
    assertEqual(
      employee.custom_fields.employment_status,
      emp.status,
      `Status should be ${emp.status}`
    )
  }
  
  // Query active employees
  const { data: activeEmployees } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'employee')
    .eq('is_active', true)
  
  assertEqual(activeEmployees.length, 2, 'Should have 2 active employees')
}

// Run tests
async function main() {
  console.log('🚀 Starting Employee Records Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-employees',
    'dept-test',
    'hierarchy-emp',
    'comp-test',
    'timeoff-test',
    'contractor-test',
    'onboard-test'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Employee Records', [
    { name: 'Create employees', fn: testCreateEmployees },
    { name: 'Employee departments', fn: testEmployeeDepartments },
    { name: 'Employee hierarchy', fn: testEmployeeHierarchy },
    { name: 'Employee compensation', fn: testEmployeeCompensation },
    { name: 'Employee time off', fn: testEmployeeTimeOff },
    { name: 'Contractors vs employees', fn: testContractorsVsEmployees },
    { name: 'Onboarding and offboarding', fn: testEmployeeOnboardingOffboarding }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)