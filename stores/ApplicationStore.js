import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

export const useApplicationStore = createBaseStore(
  'application',
  {
    app: 'hr',
    model: 'Application'
  },
  {
    state: () => ({
      pipeline: [],
      loadingPipeline: false,
      workflowLoading: false,
    }),

    getters: {

    },

    actions: {
      // Used by RecruitmentPipelinePage.vue - every Application for one
      // JobOpening, for the Kanban-style board (pedido secção 76).
      async loadPipeline(jobOpeningId) {
        this.loadingPipeline = true

        try {
          const { data } = await HTTPAuth.get(
            url({
              type: 'u',
              url: 'hr/applications/',
              params: { job_opening: jobOpeningId, page_size: 200 },
            })
          )
          this.pipeline = data?.results ?? data ?? []
        } finally {
          this.loadingPipeline = false
        }
      },

      // status/employee are read_only on the serializer
      // (hr/serializers/application.py) - only these @resaas_action
      // endpoints (hr/views/application.py) can move an application
      // through the pipeline.
      async move(id, targetStatus) {
        this.workflowLoading = true
        try {
          return await HTTPAuth.post(
            url({ type: 'u', url: `hr/applications/${id}/move/` }),
            { status: targetStatus }
          )
        } finally {
          this.workflowLoading = false
        }
      },

      async scheduleInterview(id, { scheduledAt, interviewer, mode, notes }) {
        this.workflowLoading = true
        try {
          return await HTTPAuth.post(
            url({ type: 'u', url: `hr/applications/${id}/schedule_interview/` }),
            {
              scheduled_at: scheduledAt,
              interviewer: interviewer || null,
              mode: mode || undefined,
              notes: notes || '',
            }
          )
        } finally {
          this.workflowLoading = false
        }
      },

      // Returns the newly-created Employee (see hr/services/
      // recruitment_service.py hire()) - the caller decides what to do
      // with it (e.g. navigate to the employee profile).
      async hire(id) {
        this.workflowLoading = true
        try {
          return await HTTPAuth.post(url({ type: 'u', url: `hr/applications/${id}/hire/` }))
        } finally {
          this.workflowLoading = false
        }
      },
    }
  }
)
