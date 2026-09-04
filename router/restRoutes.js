

import { entityRoutes } from './../pages/entity/entityRoute'
import { entity_typeRoutes } from '../pages/entity_type/entity_typeRoute'
import { userRoutes } from '../pages/user/userRoute'
import { employeeRoutes } from '../pages/hr/employee/employeeRoute'
import { groupRoutes } from '../pages/group/groupRoute'
import { branchRoutes } from '../pages/branch/branchRoute'
import { permissionRoutes } from '../pages/permission/permissionRoute'
import { departmentRoutes } from '../pages/hr/department/departmentRoute'
import { job_positionRoutes } from '../pages/hr/job_position/job_positionRoute'
import { job_gradeRoutes } from '../pages/hr/job_grade/job_gradeRoute'
import { contractRoutes } from '../pages/hr/contract/contractRoute.js'
import { specialtyRoutes } from '../pages/hr/specialty/specialtyRoute'
import { employee_specialtyRoutes } from '../pages/hr/employee_specialty/employee_specialtyRoute'
import { shiftRoutes } from '../pages/hr/shift/shiftRoute'
import { employee_shiftRoutes } from '../pages/hr/employee_shift/employee_shiftRoute'
import { shift_scheduleRoutes } from '../pages/hr/shift_schedule/shift_scheduleRoute'
import { attendanceRoutes } from '../pages/hr/attendance/attendanceRoute'
import { holidayRoutes } from '../pages/hr/holiday/holidayRoute'
import { salary_componentRoutes } from '../pages/hr/salary_component/salary_componentRoute'
import { employee_salaryRoutes } from '../pages/hr/employee_salary/employee_salaryRoute'
import { payroll_periodRoutes } from '../pages/hr/payroll_period/payroll_periodRoute'
import { payrollRoutes } from '../pages/hr/payroll/payrollRoute'
import { payroll_itemRoutes } from '../pages/hr/payroll_item/payroll_itemRoute'
import { payslipRoutes } from '../pages/hr/payslip/payslipRoute'
import { leave_typeRoutes } from '../pages/hr/leave_type/leave_typeRoute'
import { leave_requestRoutes } from '../pages/hr/leave_request/leave_requestRoute'
import { leave_balance_entryRoutes } from '../pages/hr/leave_balance_entry/leave_balance_entryRoute'
import { job_openingRoutes } from '../pages/hr/job_opening/job_openingRoute'
import { candidateRoutes } from '../pages/hr/candidate/candidateRoute'
import { applicationRoutes } from '../pages/hr/application/applicationRoute'
import { interviewRoutes } from '../pages/hr/interview/interviewRoute'
import { onboarding_templateRoutes } from '../pages/hr/onboarding_template/onboarding_templateRoute'
import { onboarding_template_taskRoutes } from '../pages/hr/onboarding_template_task/onboarding_template_taskRoute'
import { employee_onboardingRoutes } from '../pages/hr/employee_onboarding/employee_onboardingRoute'
import { performance_cycleRoutes } from '../pages/hr/performance_cycle/performance_cycleRoute'
import { competencyRoutes } from '../pages/hr/competency/competencyRoute'
import { employee_goalRoutes } from '../pages/hr/employee_goal/employee_goalRoute'
import { performance_reviewRoutes } from '../pages/hr/performance_review/performance_reviewRoute'
import { courseRoutes } from '../pages/hr/course/courseRoute'
import { training_sessionRoutes } from '../pages/hr/training_session/training_sessionRoute'
import { tdc } from '../services/translation'


export let restRoutes = [

  { 
    path: '/view_scaffold', 
    name: 'view_scaffold', 
    component: () => import('../pages/commands/ScaffoldPage.vue'), 
    meta: { 
      title: tdc('View of') + ' ' + tdc('Scaffold'),
      requiresAuth: true, 
      requiredRole: 'view_scaffold'
    } 
    },
      { 
      path: '/view_crud', 
      name: 'view_crud', 
      component: () => import('../pages/CrudPage.vue'), 
      meta: { 
        title: tdc('View of') + ' ' + tdc('Crud'),
        requiresAuth: true, 
        requiredRole: 'view_crud'
      } 
    },
  { 
    path: '/add_app', 
    name: 'add_app', 
    component: () => import('../pages/commands/AppCreatePage.vue'), 
    meta: { 
      title: tdc('Add') + ' ' + tdc('App'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'add_app'
    } 
  },
  { 
    path: '/view_hr_dashboard', 
    name: 'view_hr_dashboard', 
    component: () => import('../pages/hr/DashBoard.vue'), 
    meta: { 
      title: tdc('View') + ' ' + tdc('Dashboard'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'view_hr_dashboard'
    } 
  },
  { 
    path: '/view_django_resaas_dashboard', 
    name: 'view_django_resaas_dashboard', 
    component: () => import('../pages/django_resaas/DashBoard.vue'), 
    meta: { 
      title: tdc('View') + ' ' + tdc('Dashboard'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'view_django_resaas_dashboard'
    } 
  },
  { 
    path: '/view_core_dashboard', 
    name: 'view_core_dashboard', 
    component: () => import('../pages/core/DashBoard.vue'), 
    meta: { 
      title: tdc('View') + ' ' + tdc('Dashboard'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'view_core_dashboard'
    } 
  },
  { 
    path: '/route/:route/:id', 
    name: 'route_inexistente', 
    component: () => import('../pages/RotaEnexistente.vue'), 
    meta: { 
      title: tdc('Route') + ' ' + tdc('not found'),
    } 
  },
  ...entityRoutes,
  ...entity_typeRoutes,
  ...groupRoutes,
  ...branchRoutes,
  ...userRoutes,
  ...permissionRoutes,
  ...employeeRoutes,
  ...departmentRoutes,
  ...job_positionRoutes,
  ...job_gradeRoutes,
  ...contractRoutes,
  ...specialtyRoutes,
  ...employee_specialtyRoutes,
  ...shiftRoutes,
  ...employee_shiftRoutes,
  ...shift_scheduleRoutes,
  ...attendanceRoutes,
  ...holidayRoutes,
  ...salary_componentRoutes,
  ...employee_salaryRoutes,
  ...payroll_periodRoutes,
  ...payrollRoutes,
  ...payroll_itemRoutes,
  ...payslipRoutes,
  ...leave_typeRoutes,
  ...leave_requestRoutes,
  ...leave_balance_entryRoutes,
  ...job_openingRoutes,
  ...candidateRoutes,
  ...applicationRoutes,
  ...interviewRoutes,
  ...onboarding_templateRoutes,
  ...onboarding_template_taskRoutes,
  ...employee_onboardingRoutes,
  ...performance_cycleRoutes,
  ...competencyRoutes,
  ...employee_goalRoutes,
  ...performance_reviewRoutes,
  ...courseRoutes,
  ...training_sessionRoutes,
]

