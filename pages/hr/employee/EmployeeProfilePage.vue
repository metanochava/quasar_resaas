<template>
  <q-page class="q-pa-sm">
    <div v-if="Employee.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>

    <template v-else-if="employee">
      <!-- HEADER -->
      <s-card class="q-mb-md">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-avatar size="72px">
              <img :src="photoUrl" />
            </q-avatar>
          </div>

          <div class="col">
            <div class="text-h6">{{ fullName }}</div>
            <div class="text-subtitle2 text-grey-8">
              {{ positionLabel }}
              <span v-if="departmentLabel"> · {{ departmentLabel }}</span>
            </div>
            <div class="text-caption text-grey-6">
              {{ branchLabel }}
              <span v-if="employee.code"> · {{ employee.code }}</span>
            </div>
          </div>

          <div class="col-auto">
            <q-badge :color="statusColor" class="q-pa-sm text-weight-bold">
              {{ statusLabel }}
            </q-badge>
          </div>

          <div class="col-auto">
            <s-btn
              flat
              round
              icon="edit"
              :to="{ name: 'change_employee', params: { id: employee.id } }"
            >
              <q-tooltip>{{ tdc('Edit') }}</q-tooltip>
            </s-btn>
          </div>
        </q-card-section>
      </s-card>

      <!-- TABS -->
      <s-card>
        <q-tabs
          v-model="tab"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="personal" :label="tdc('Personal')" />
          <q-tab name="employment" :label="tdc('Employment')" />
          <q-tab name="contract" :label="tdc('Contract')" />
          <q-tab name="attendance" :label="tdc('Attendance')" />
          <q-tab name="leave" :label="tdc('Leave')" />
          <q-tab name="onboarding" :label="tdc('Onboarding')" />
          <q-tab name="performance" :label="tdc('Performance')" />
          <q-tab name="training" :label="tdc('Training')" />
          <q-tab name="payroll" :label="tdc('Payroll')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- PERSONAL -->
          <q-tab-panel name="personal">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Full name') }}</div>
                <div class="text-body1">{{ fullName || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Gender') }}</div>
                <div class="text-body1">{{ person?.gender || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Date of birth') }}</div>
                <div class="text-body1">{{ person?.date_of_birth || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Nationality') }}</div>
                <div class="text-body1">{{ person?.nationality || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Email') }}</div>
                <div class="text-body1">{{ person?.email || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Phone') }}</div>
                <div class="text-body1">{{ person?.phone || '-' }}</div>
              </div>
            </div>
          </q-tab-panel>

          <!-- EMPLOYMENT -->
          <q-tab-panel name="employment">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Employee number') }}</div>
                <div class="text-body1">{{ employee.code || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Status') }}</div>
                <div class="text-body1">{{ statusLabel }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Employment type') }}</div>
                <div class="text-body1">{{ employmentTypeLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Hire date') }}</div>
                <div class="text-body1">{{ employee.hire_date || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Department') }}</div>
                <div class="text-body1">{{ departmentLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Position') }}</div>
                <div class="text-body1">{{ positionLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Job grade') }}</div>
                <div class="text-body1">{{ employee.job_grade_data?.name || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Manager') }}</div>
                <div class="text-body1">{{ employee.manager_data?.label || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Work email') }}</div>
                <div class="text-body1">{{ employee.work_email || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Work phone') }}</div>
                <div class="text-body1">{{ employee.work_phone || '-' }}</div>
              </div>
            </div>
          </q-tab-panel>

          <!-- CONTRACT -->
          <q-tab-panel name="contract">
            <div v-if="Employee.loadingContracts" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <div v-else-if="!contracts.length" class="text-grey-6 q-pa-md">
              {{ tdc('No contracts found for this employee.') }}
            </div>

            <q-list v-else separator>
              <q-item v-for="contract in contracts" :key="contract.id">
                <q-item-section>
                  <q-item-label>
                    {{ contract.contract_number || contract.contract_type }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ contract.start_date }} → {{ contract.end_date || tdc('ongoing') }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="grey-7">
                    {{ contract.status?.label || contract.status || '-' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- ATTENDANCE -->
          <q-tab-panel name="attendance">
            <div class="row items-center q-mb-md q-gutter-sm">
              <s-btn
                v-if="!todayAttendance?.check_in"
                color="positive"
                icon="login"
                :label="tdc('Check in')"
                :loading="Employee.checkingInOut"
                @click="doCheckIn"
              />
              <s-btn
                v-else-if="!todayAttendance?.check_out"
                color="negative"
                icon="logout"
                :label="tdc('Check out')"
                :loading="Employee.checkingInOut"
                @click="doCheckOut"
              />
              <q-badge v-else color="positive" class="q-pa-sm">
                {{ tdc('Checked out today') }}
              </q-badge>
            </div>

            <div v-if="Employee.loadingAttendances" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <div v-else-if="!attendances.length" class="text-grey-6 q-pa-md">
              {{ tdc('No attendance records found for this employee.') }}
            </div>

            <q-list v-else separator>
              <q-item v-for="record in attendances" :key="record.id">
                <q-item-section>
                  <q-item-label>{{ record.date }}</q-item-label>
                  <q-item-label caption>
                    {{ formatTime(record.check_in) }} → {{ formatTime(record.check_out) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-gutter-xs items-center">
                    <q-badge v-if="record.late_minutes" color="warning">
                      {{ tdc('Late') }} {{ record.late_minutes }}m
                    </q-badge>
                    <q-badge v-if="record.overtime_minutes" color="orange">
                      {{ tdc('Overtime') }} {{ record.overtime_minutes }}m
                    </q-badge>
                    <q-badge v-if="record.early_departure_minutes" color="grey-7">
                      {{ tdc('Early') }} {{ record.early_departure_minutes }}m
                    </q-badge>
                    <q-badge :color="attendanceStatusColor(record.status)">
                      {{ record.status?.label || record.status }}
                    </q-badge>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- LEAVE -->
          <q-tab-panel name="leave">
            <div class="row items-center q-mb-md">
              <div class="col row q-gutter-sm">
                <q-badge
                  v-for="balance in Employee.leaveBalances"
                  :key="balance.leave_type_id"
                  color="primary"
                  class="q-pa-sm"
                >
                  {{ balance.leave_type_name }}: {{ balance.balance }} {{ tdc('day(s)') }}
                </q-badge>
              </div>
              <div class="col-auto">
                <s-btn
                  color="primary"
                  icon="add"
                  :label="tdc('New request')"
                  @click="openNewLeaveRequest"
                />
              </div>
            </div>

            <div v-if="Employee.loadingLeave" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <div v-else-if="!Employee.leaveRequests.length" class="text-grey-6 q-pa-md">
              {{ tdc('No leave requests found for this employee.') }}
            </div>

            <q-list v-else separator>
              <q-item v-for="request in Employee.leaveRequests" :key="request.id">
                <q-item-section>
                  <q-item-label>
                    {{ request.leave_type_data?.name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ request.start_date }} → {{ request.end_date }}
                    ({{ request.days }} {{ tdc('day(s)') }})
                  </q-item-label>
                  <q-item-label caption v-if="request.status?.value === 'rejected' && request.rejection_reason">
                    {{ tdc('Reason') }}: {{ request.rejection_reason }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-badge :color="leaveStatusColor(request.status)">
                      {{ request.status?.label || request.status }}
                    </q-badge>
                    <s-btn
                      v-if="['draft', 'pending'].includes(request.status?.value || request.status)"
                      flat
                      dense
                      round
                      icon="cancel"
                      :loading="Employee.requestingLeave"
                      @click="cancelLeaveRequest(request.id)"
                    >
                      <q-tooltip>{{ tdc('Cancel') }}</q-tooltip>
                    </s-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- ONBOARDING -->
          <q-tab-panel name="onboarding">
            <div v-if="Employee.loadingOnboarding" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <!-- NO ACTIVE/PAST ONBOARDING - offer to start one -->
            <div v-else-if="!Employee.onboarding" class="q-pa-md text-center">
              <div class="text-grey-6 q-mb-md">
                {{ tdc('This employee has no onboarding checklist yet.') }}
              </div>
              <s-btn
                color="primary"
                icon="assignment_turned_in"
                :label="tdc('Start onboarding')"
                @click="openStartOnboarding"
              />
            </div>

            <!-- ACTIVE/COMPLETED/CANCELLED ONBOARDING -->
            <template v-else>
              <div class="row items-center q-col-gutter-md q-mb-md">
                <div class="col-auto">
                  <q-badge :color="onboardingStatusColor(Employee.onboarding.status)" class="q-pa-sm">
                    {{ Employee.onboarding.status?.label || Employee.onboarding.status }}
                  </q-badge>
                </div>
                <div class="col">
                  <q-linear-progress
                    :value="(Employee.onboarding.progress || 0) / 100"
                    color="primary"
                    size="14px"
                    rounded
                  >
                    <div class="absolute-full flex flex-center">
                      <q-badge color="white" text-color="primary">
                        {{ Employee.onboarding.progress || 0 }}%
                      </q-badge>
                    </div>
                  </q-linear-progress>
                </div>
                <div class="col-auto row q-gutter-sm" v-if="isOnboardingActive">
                  <s-btn
                    color="positive"
                    icon="task_alt"
                    :label="tdc('Complete onboarding')"
                    :loading="Employee.onboardingActionLoading"
                    @click="doCompleteOnboarding"
                  />
                  <s-btn
                    flat
                    color="negative"
                    icon="cancel"
                    :label="tdc('Cancel')"
                    :loading="Employee.onboardingActionLoading"
                    @click="doCancelOnboarding"
                  />
                </div>
              </div>

              <div v-if="onboardingError" class="text-negative text-caption q-mb-md">
                {{ onboardingError }}
              </div>

              <div v-if="!Employee.onboarding.tasks?.length" class="text-grey-6 q-pa-md">
                {{ tdc('No tasks on this checklist.') }}
              </div>

              <q-list v-else separator>
                <q-item v-for="task in Employee.onboarding.tasks" :key="task.id">
                  <q-item-section avatar>
                    <q-checkbox
                      :model-value="task.is_done"
                      :disable="!isOnboardingActive || Employee.onboardingActionLoading"
                      @update:model-value="(val) => toggleOnboardingTask(task, val)"
                    />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label :class="{ 'text-strike text-grey-6': task.is_done }">
                      {{ task.title }}
                      <q-badge v-if="task.is_required" color="grey-7" class="q-ml-sm">
                        {{ tdc('Required') }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption v-if="task.description">
                      {{ task.description }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side v-if="task.is_done">
                    <q-item-label caption>
                      {{ task.done_by_data?.label || '' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </q-tab-panel>

          <!-- PERFORMANCE -->
          <q-tab-panel name="performance">
            <div v-if="Employee.loadingPerformance" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <template v-else>
              <div class="text-subtitle2 text-grey-8 q-mb-sm">{{ tdc('Goals') }}</div>

              <div v-if="!Employee.goals.length" class="text-grey-6 q-pa-md">
                {{ tdc('No goals set for this employee.') }}
              </div>

              <q-list v-else separator class="q-mb-lg">
                <q-item v-for="goal in Employee.goals" :key="goal.id">
                  <q-item-section>
                    <q-item-label>
                      {{ goal.title }}
                      <q-badge :color="goalStatusColor(goal.status)" class="q-ml-sm">
                        {{ goal.status?.label || goal.status }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption v-if="goal.target">
                      {{ tdc('Target') }}: {{ goal.target }}
                    </q-item-label>
                    <q-linear-progress
                      :value="(goal.progress || 0) / 100"
                      color="primary"
                      size="10px"
                      rounded
                      class="q-mt-sm"
                    >
                      <div class="absolute-full flex flex-center">
                        <q-badge color="white" text-color="primary" style="font-size: 10px;">
                          {{ goal.progress || 0 }}%
                        </q-badge>
                      </div>
                    </q-linear-progress>
                  </q-item-section>

                  <q-item-section side>
                    <s-btn
                      flat
                      dense
                      icon="edit"
                      :label="tdc('Update progress')"
                      @click="openUpdateGoalProgress(goal)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="text-subtitle2 text-grey-8 q-mb-sm">{{ tdc('Reviews') }}</div>

              <div v-if="!Employee.reviews.length" class="text-grey-6 q-pa-md">
                {{ tdc('No performance reviews for this employee.') }}
              </div>

              <q-list v-else separator>
                <q-item v-for="review in Employee.reviews" :key="review.id">
                  <q-item-section>
                    <q-item-label>
                      {{ review.review_type?.label || review.review_type }}
                      <q-badge :color="reviewStatusColor(review.status)" class="q-ml-sm">
                        {{ review.status?.label || review.status }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption v-if="review.overall_rating">
                      {{ tdc('Overall rating') }}: {{ review.overall_rating }}/5
                    </q-item-label>
                    <q-item-label caption v-if="review.comments">
                      {{ review.comments }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side v-if="(review.status?.value || review.status) === 'draft'">
                    <s-btn
                      color="positive"
                      dense
                      icon="check"
                      :label="tdc('Submit')"
                      :loading="Employee.performanceActionLoading"
                      @click="doSubmitReview(review.id)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </q-tab-panel>

          <!-- TRAINING -->
          <q-tab-panel name="training">
            <div v-if="Employee.loadingTraining" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <template v-else>
              <div class="text-subtitle2 text-grey-8 q-mb-sm">{{ tdc('Trainings') }}</div>

              <div v-if="!Employee.trainings.length" class="text-grey-6 q-pa-md">
                {{ tdc('No trainings found for this employee.') }}
              </div>

              <q-list v-else separator class="q-mb-lg">
                <q-item v-for="training in Employee.trainings" :key="training.id">
                  <q-item-section>
                    <q-item-label>
                      {{ training.session_data?.label }}
                    </q-item-label>
                    <q-item-label caption v-if="training.score">
                      {{ tdc('Score') }}: {{ training.score }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-badge :color="trainingStatusColor(training.status)">
                      {{ training.status?.label || training.status }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="row items-center q-mb-sm">
                <div class="col text-subtitle2 text-grey-8">{{ tdc('Certifications') }}</div>
                <div class="col-auto">
                  <s-btn
                    flat
                    dense
                    icon="add"
                    :label="tdc('Add certification')"
                    @click="openAddCertification"
                  />
                </div>
              </div>

              <div v-if="!Employee.certifications.length" class="text-grey-6 q-pa-md">
                {{ tdc('No certifications found for this employee.') }}
              </div>

              <q-list v-else separator>
                <q-item v-for="cert in Employee.certifications" :key="cert.id">
                  <q-item-section>
                    <q-item-label>{{ cert.name }}</q-item-label>
                    <q-item-label caption>
                      {{ cert.issued_by }} · {{ cert.issued_at }}
                      <span v-if="cert.expires_at"> · {{ tdc('expires') }} {{ cert.expires_at }}</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </q-tab-panel>

          <!-- PAYROLL -->
          <q-tab-panel name="payroll">
            <div v-if="Employee.loadingPayroll" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <template v-else>
              <div class="text-subtitle2 text-grey-8 q-mb-sm">{{ tdc('Current salary structure') }}</div>

              <div v-if="!Employee.currentSalary" class="text-grey-6 q-pa-md q-mb-lg">
                {{ tdc('No active salary structure for this employee.') }}
              </div>

              <q-list v-else bordered separator class="q-mb-lg">
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ tdc('Base salary') }}</q-item-label>
                    <q-item-label caption>
                      {{ tdc('Effective') }} {{ Employee.currentSalary.effective_date }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-subtitle1">{{ Employee.currentSalary.base_salary }}</div>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="text-subtitle2 text-grey-8 q-mb-sm">{{ tdc('Payslips') }}</div>

              <div v-if="!Employee.payrolls.length" class="text-grey-6 q-pa-md">
                {{ tdc('No payroll history for this employee yet.') }}
              </div>

              <q-list v-else separator>
                <q-item v-for="payroll in Employee.payrolls" :key="payroll.id">
                  <q-item-section>
                    <q-item-label>{{ payroll.period_data?.name }}</q-item-label>
                    <q-item-label caption>
                      {{ tdc('Net salary') }}: {{ payroll.net_salary }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-badge :color="payrollStatusColor(payroll.status)">
                      {{ payroll.status?.label || payroll.status }}
                    </q-badge>
                  </q-item-section>

                  <q-item-section side v-if="payroll.payslip_id">
                    <s-btn
                      flat round dense icon="picture_as_pdf"
                      :href="payslipPdfUrl(payroll)"
                      target="_blank"
                    >
                      <q-tooltip>{{ tdc('View payslip PDF') }}</q-tooltip>
                    </s-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </q-tab-panel>
        </q-tab-panels>
      </s-card>
    </template>

    <!-- NEW LEAVE REQUEST DIALOG -->
    <q-dialog v-model="leaveDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('New leave request') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <s-select
            v-model="leaveForm.leave_type"
            :options="leaveTypeOptions"
            emit-value
            map-options
            outlined
            :label="tdc('Leave type')"
          />
          <q-input v-model="leaveForm.start_date" type="date" outlined :label="tdc('Start date')" />
          <q-input v-model="leaveForm.end_date" type="date" outlined :label="tdc('End date')" />
          <q-input v-model="leaveForm.reason" type="textarea" outlined :label="tdc('Reason')" />
          <div v-if="leaveError" class="text-negative text-caption">{{ leaveError }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="primary"
            :label="tdc('Submit')"
            :loading="Employee.requestingLeave"
            @click="submitLeaveRequest"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>

    <!-- START ONBOARDING DIALOG -->
    <q-dialog v-model="onboardingDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('Start onboarding') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <s-select
            v-model="onboardingTemplateChoice"
            :options="onboardingTemplateOptions"
            emit-value
            map-options
            outlined
            clearable
            :label="tdc('Template (optional)')"
          />
          <div v-if="onboardingError" class="text-negative text-caption">{{ onboardingError }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="primary"
            :label="tdc('Start')"
            :loading="Employee.onboardingActionLoading"
            @click="doStartOnboarding"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>

    <q-dialog v-model="goalProgressDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ goalProgressForm.title }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ tdc('Progress') }}: {{ goalProgressForm.progress }}%
            </div>
            <q-slider
              v-model="goalProgressForm.progress"
              :min="0"
              :max="100"
              :step="5"
              label
              color="primary"
            />
          </div>
          <s-select
            v-model="goalProgressForm.status"
            :options="goalStatusOptions"
            emit-value
            map-options
            outlined
            clearable
            :label="tdc('Status (optional override)')"
          />
          <div v-if="goalProgressError" class="text-negative text-caption">{{ goalProgressError }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="primary"
            :label="tdc('Save')"
            :loading="Employee.performanceActionLoading"
            @click="doUpdateGoalProgress"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>

    <!-- ADD CERTIFICATION DIALOG -->
    <q-dialog v-model="certificationDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('Add certification') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input v-model="certificationForm.name" outlined :label="tdc('Name')" />
          <q-input v-model="certificationForm.issued_by" outlined :label="tdc('Issued by')" />
          <q-input v-model="certificationForm.issued_at" type="date" outlined :label="tdc('Issued at')" />
          <q-input v-model="certificationForm.expires_at" type="date" outlined :label="tdc('Expires at (optional)')" />
          <div v-if="certificationError" class="text-negative text-caption">{{ certificationError }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="primary"
            :label="tdc('Save')"
            :loading="Employee.addingCertification"
            @click="doAddCertification"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeStore } from '../../../stores/EmployeeStore'
import { useLeaveTypeStore } from '../../../stores/LeaveTypeStore'
import { useOnboardingTemplateStore } from '../../../stores/OnboardingTemplateStore'
import { tdc } from '../../../services/translation'

const route = useRoute()
const Employee = useEmployeeStore()
const LeaveType = useLeaveTypeStore()
const OnboardingTemplate = useOnboardingTemplateStore()

const tab = ref('personal')

const leaveDialog = ref(false)
const leaveError = ref('')
const leaveForm = reactive({
  leave_type: null,
  start_date: '',
  end_date: '',
  reason: '',
})

const leaveTypeOptions = computed(() =>
  (LeaveType.rows || []).map((row) => ({ label: row.name, value: row.id }))
)

const employee = computed(() => Employee.row)
const person = computed(() => employee.value?.person_data)

const fullName = computed(() =>
  person.value?.full_name || [person.value?.name, person.value?.surname].filter(Boolean).join(' ')
)

const photoUrl = computed(() =>
  person.value?.profile?.url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
)

const positionLabel = computed(() => employee.value?.position_data?.title || tdc('No position'))
const departmentLabel = computed(() => employee.value?.position_data?.department_data?.name || '')
const branchLabel = computed(() => employee.value?.branch?.name || employee.value?.branch_data?.name || '')

const employmentTypeLabel = computed(() => {
  const value = employee.value?.employment_type
  return value?.label || value || ''
})

const statusValue = computed(() => {
  const value = employee.value?.employment_status
  return value?.value || value || (employee.value?.termination_date ? 'terminated' : 'active')
})

const statusLabel = computed(() => {
  const value = employee.value?.employment_status
  return value?.label || value || (employee.value?.termination_date ? tdc('Terminated') : tdc('Active'))
})

const statusColor = computed(() => {
  switch (statusValue.value) {
    case 'active': return 'positive'
    case 'probation': return 'warning'
    case 'suspended': return 'orange'
    case 'terminated':
    case 'resigned':
    case 'retired': return 'grey-7'
    default: return 'primary'
  }
})

const contracts = computed(() => Employee.contracts || [])
const attendances = computed(() => Employee.attendances || [])

const todayAttendance = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return attendances.value.find((record) => record.date === today) || null
})

function formatTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function attendanceStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'present': return 'positive'
    case 'late': return 'warning'
    case 'absent': return 'negative'
    default: return 'grey-7'
  }
}

async function doCheckIn() {
  await Employee.checkIn(employee.value.id)
}

async function doCheckOut() {
  await Employee.checkOut(employee.value.id)
}

function leaveStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'approved': return 'positive'
    case 'pending': return 'warning'
    case 'rejected': return 'negative'
    case 'cancelled':
    case 'draft': return 'grey-7'
    default: return 'grey-5'
  }
}

async function openNewLeaveRequest() {
  leaveForm.leave_type = null
  leaveForm.start_date = ''
  leaveForm.end_date = ''
  leaveForm.reason = ''
  leaveError.value = ''

  if (!LeaveType.rows?.length) {
    await LeaveType.loadData({ page_size: 100 })
  }

  leaveDialog.value = true
}

async function submitLeaveRequest() {
  leaveError.value = ''

  if (!leaveForm.leave_type || !leaveForm.start_date || !leaveForm.end_date) {
    leaveError.value = tdc('Leave type, start date and end date are required.')
    return
  }

  try {
    await Employee.requestLeave(employee.value.id, {
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason,
    })
    leaveDialog.value = false
  } catch (err) {
    leaveError.value = err?.response?.data?.detail
      || Object.values(err?.response?.data || {})[0]?.[0]
      || tdc('Could not submit this leave request.')
  }
}

async function cancelLeaveRequest(leaveRequestId) {
  await Employee.cancelLeaveRequest(employee.value.id, leaveRequestId)
}

// ---------------- ONBOARDING ----------------
const onboardingDialog = ref(false)
const onboardingTemplateChoice = ref(null)
const onboardingError = ref('')

const onboardingTemplateOptions = computed(() =>
  (OnboardingTemplate.rows || []).map((row) => ({ label: row.name, value: row.id }))
)

const isOnboardingActive = computed(() => {
  const value = Employee.onboarding?.status?.value || Employee.onboarding?.status
  return value === 'in_progress' || value === 'not_started'
})

function onboardingStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'in_progress': return 'warning'
    case 'cancelled': return 'grey-7'
    default: return 'grey-5'
  }
}

async function openStartOnboarding() {
  onboardingTemplateChoice.value = null
  onboardingError.value = ''

  if (!OnboardingTemplate.rows?.length) {
    await OnboardingTemplate.loadData({ page_size: 100 })
  }

  onboardingDialog.value = true
}

async function doStartOnboarding() {
  onboardingError.value = ''

  try {
    await Employee.startOnboarding(employee.value.id, onboardingTemplateChoice.value)
    onboardingDialog.value = false
  } catch (err) {
    onboardingError.value = err?.response?.data?.detail || tdc('Could not start onboarding.')
  }
}

async function toggleOnboardingTask(task, done) {
  onboardingError.value = ''

  try {
    if (done) {
      await Employee.completeOnboardingTask(employee.value.id, task.id)
    } else {
      await Employee.reopenOnboardingTask(employee.value.id, task.id)
    }
  } catch (err) {
    onboardingError.value = err?.response?.data?.detail || tdc('Could not update this task.')
  }
}

async function doCompleteOnboarding() {
  onboardingError.value = ''

  try {
    await Employee.completeOnboarding(employee.value.id, Employee.onboarding.id)
  } catch (err) {
    onboardingError.value = err?.response?.data?.detail || tdc('Could not complete this onboarding.')
  }
}

async function doCancelOnboarding() {
  onboardingError.value = ''

  try {
    await Employee.cancelOnboarding(employee.value.id, Employee.onboarding.id)
  } catch (err) {
    onboardingError.value = err?.response?.data?.detail || tdc('Could not cancel this onboarding.')
  }
}

// ---------------- PERFORMANCE ----------------
function goalStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'in_progress': return 'warning'
    case 'missed': return 'negative'
    default: return 'grey-7'
  }
}

function reviewStatusColor(status) {
  const value = status?.value || status
  return value === 'submitted' ? 'positive' : 'grey-7'
}

const goalStatusOptions = [
  { label: tdc('Not Started'), value: 'not_started' },
  { label: tdc('In Progress'), value: 'in_progress' },
  { label: tdc('Completed'), value: 'completed' },
  { label: tdc('Missed'), value: 'missed' },
]

const goalProgressDialog = ref(false)
const goalProgressError = ref('')
const goalProgressForm = reactive({
  id: null,
  title: '',
  progress: 0,
  status: null,
})

function openUpdateGoalProgress(goal) {
  goalProgressForm.id = goal.id
  goalProgressForm.title = goal.title
  goalProgressForm.progress = goal.progress || 0
  goalProgressForm.status = null
  goalProgressError.value = ''
  goalProgressDialog.value = true
}

async function doUpdateGoalProgress() {
  goalProgressError.value = ''

  try {
    await Employee.updateGoalProgress(
      employee.value.id,
      goalProgressForm.id,
      goalProgressForm.progress,
      goalProgressForm.status,
    )
    goalProgressDialog.value = false
  } catch (err) {
    goalProgressError.value = err?.response?.data?.detail || tdc('Could not update this goal.')
  }
}

async function doSubmitReview(reviewId) {
  await Employee.submitReview(employee.value.id, reviewId)
}

// ---------------- TRAINING ----------------
function trainingStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'failed':
    case 'dropped': return 'negative'
    case 'attending': return 'warning'
    default: return 'grey-7'
  }
}

const certificationDialog = ref(false)
const certificationError = ref('')
const certificationForm = reactive({
  name: '',
  issued_by: '',
  issued_at: '',
  expires_at: '',
})

function openAddCertification() {
  certificationForm.name = ''
  certificationForm.issued_by = ''
  certificationForm.issued_at = ''
  certificationForm.expires_at = ''
  certificationError.value = ''
  certificationDialog.value = true
}

async function doAddCertification() {
  certificationError.value = ''

  if (!certificationForm.name || !certificationForm.issued_at) {
    certificationError.value = tdc('Name and issued date are required.')
    return
  }

  try {
    await Employee.addCertification(employee.value.id, {
      name: certificationForm.name,
      issued_by: certificationForm.issued_by,
      issued_at: certificationForm.issued_at,
      expires_at: certificationForm.expires_at || null,
    })
    certificationDialog.value = false
  } catch (err) {
    certificationError.value = err?.response?.data?.detail
      || Object.values(err?.response?.data || {})[0]?.[0]
      || tdc('Could not add this certification.')
  }
}

// ---------------- PAYROLL ----------------
function payrollStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'confirmed':
    case 'paid': return 'positive'
    case 'cancelled': return 'grey-7'
    case 'reviewed': return 'warning'
    default: return 'primary'
  }
}

function payslipPdfUrl(payroll) {
  return url({ type: 'u', url: `hr/payslips/${payroll.payslip_id}/pdf/` })
}

async function load(id) {
  if (!id) return
  await Employee.getById(id, { force: true })
  await Employee.loadContracts(id)
}

// Attendance history is only fetched the first time that tab is opened -
// not part of the initial profile payload (pedido secção 70: load on
// demand, not one giant API call).
watch(tab, (value) => {
  if (value === 'attendance' && employee.value?.id) {
    Employee.loadAttendances(employee.value.id)
  }

  if (value === 'leave' && employee.value?.id) {
    Employee.loadLeave(employee.value.id)
  }

  if (value === 'onboarding' && employee.value?.id) {
    Employee.loadOnboarding(employee.value.id)
  }

  if (value === 'performance' && employee.value?.id) {
    Employee.loadPerformance(employee.value.id)
  }

  if (value === 'training' && employee.value?.id) {
    Employee.loadTraining(employee.value.id)
  }

  if (value === 'payroll' && employee.value?.id) {
    Employee.loadPayroll(employee.value.id)
  }
})

onMounted(() => load(route.params.id))

watch(() => route.params.id, (id) => load(id))
</script>
