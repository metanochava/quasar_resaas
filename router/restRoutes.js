

import { entityRoutes } from './../pages/entity/entityRoute'
import { entity_typeRoutes } from '../pages/hr/entity_type/entity_typeRoute.ts'
import { userRoutes } from '../pages/user/userRoute'
import { employeeRoutes } from '../pages/hr/employee/employeeRoute.ts'
import { groupRoutes } from '../pages/hr/group/groupRoute.ts'
import { branchRoutes } from '../pages/branch/branchRoute'
import { permissionRoutes } from '../pages/permission/permissionRoute'
import { departmentRoutes } from '../pages/hr/department/departmentRoute.ts'
import { job_positionRoutes } from '../pages/hr/job_position/job_positionRoute.js'
import { contractRoutes } from '../pages/hr/attendance/contract/contractRoute.js'
import { specialtyRoutes } from '../pages/hr/specialty/specialtyRoute.ts'
import { employee_specialtyRoutes } from '../pages/hr/employee_specialty/employee_specialtyRoute.js'
import { shiftRoutes } from '../pages/hr/shift/shiftRoute.ts'
import { employee_shiftRoutes } from '../pages/hr/employee_shift/employee_shiftRoute.ts'
import { shift_scheduleRoutes } from '../pages/hr/shift_schedule/shift_scheduleRoute.ts'
import { attendanceRoutes } from '../pages/hr/attendance/attendanceRoute.ts'
import { salary_componentRoutes } from '../pages/hr/salary_component/salary_componentRoute.ts'
import { employee_salaryRoutes } from '../pages/hr/employee_salary/employee_salaryRoute.ts'
import { payroll_periodRoutes } from '../pages/hr/payroll_period/payroll_periodRoute.js'
import { payrollRoutes } from '../pages/hr/payroll/payrollRoute.ts'
import { payroll_itemRoutes } from '../pages/hr/payroll_item/payroll_itemRoute.ts'
import { payslipRoutes } from '../pages/hr/payslip/payslipRoute.ts'
import { tdc } from '../services/translation'
import { docsRoutes } from './docsRoutes'


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
    path: '/route/:route/:id', 
    name: 'route_inexistente', 
    component: () => import('../pages/RotaEnexistente.vue'), 
    meta: { 
      title: tdc('Route') + ' ' + tdc('not found'),
    } 
  },
  ...docsRoutes,
  ...entityRoutes,
  ...entity_typeRoutes,
  ...groupRoutes,
  ...branchRoutes,
  ...userRoutes,
  ...permissionRoutes,
  ...employeeRoutes,
  ...departmentRoutes,
  ...job_positionRoutes,
  ...contractRoutes,
  ...specialtyRoutes,
  ...employee_specialtyRoutes,
  ...shiftRoutes,
  ...employee_shiftRoutes,
  ...shift_scheduleRoutes,
  ...attendanceRoutes,
  ...salary_componentRoutes,
  ...employee_salaryRoutes,
  ...payroll_periodRoutes,
  ...payrollRoutes,
  ...payroll_itemRoutes,
  ...payslipRoutes,
]

