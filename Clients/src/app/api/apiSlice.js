import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { projectService } from "../../services/projectService";
import { documentService } from "../../services/documentService";
import { approvalService } from "../../services/approvalService";
import { notificationService } from "../../services/notificationService";
import { messageService } from "../../services/messageService";
import { userService } from "../../services/userService";
import { reportService } from "../../services/reportService";
import { conversationService } from "../../services/conversationService";

// fakeBaseQuery lets each endpoint call our own async service functions
// directly (which themselves call Axios or the mock adapter) while still
// getting RTK Query's caching, tags, and refetch-on-mutation behavior.
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Project", "Document", "Approval", "Notification", "Message", "User", "Report", "Conversation"],
  endpoints: (builder) => ({
    // ---------- Projects ----------
    getProjects: builder.query({
      async queryFn({ role, userId } = {}) {
        try {
          const { data } = await projectService.getProjects({ role, userId });
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: "Project", id: p.id })), { type: "Project", id: "LIST" }]
          : [{ type: "Project", id: "LIST" }],
    }),

    getProjectById: builder.query({
      async queryFn(id) {
        try {
          const { data } = await projectService.getProjectById(id);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),

    createProject: builder.mutation({
      async queryFn(payload) {
        try {
          const { data } = await projectService.createProject(payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    updateStage: builder.mutation({
      async queryFn({ projectId, stageNumber, payload }) {
        try {
          const { data } = await projectService.updateStage(projectId, stageNumber, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Project", id: projectId }],
    }),

    assignTeamMember: builder.mutation({
      async queryFn({ projectId, member }) {
        try {
          const { data } = await projectService.assignTeamMember(projectId, member);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Project", id: projectId }, { type: "User", id: "WORKLOAD" }],
    }),

    removeTeamMember: builder.mutation({
      async queryFn({ projectId, userId }) {
        try {
          const { data } = await projectService.removeTeamMember(projectId, userId);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Project", id: projectId }, { type: "User", id: "WORKLOAD" }],
    }),

    submitFinalReview: builder.mutation({
      async queryFn({ projectId, payload }) {
        try {
          const { data } = await projectService.submitFinalReview(projectId, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Project", id: projectId }],
    }),

    // ---------- Documents ----------
    getDocumentsByProject: builder.query({
      async queryFn({ projectId, clientVisibleOnly }) {
        try {
          const { data } = await documentService.getDocumentsByProject(projectId, { clientVisibleOnly });
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result, error, { projectId }) => [{ type: "Document", id: projectId }],
    }),

    uploadDocument: builder.mutation({
      async queryFn({ projectId, payload }) {
        try {
          const { data } = await documentService.uploadDocument(projectId, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Document", id: projectId }],
    }),

    // ---------- Approvals ----------
    getApprovals: builder.query({
      async queryFn(args) {
        try {
          const { data } = await approvalService.getApprovals(args);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "Approval", id: "LIST" }],
    }),

    requestApproval: builder.mutation({
      async queryFn({ projectId, payload }) {
        try {
          const { data } = await approvalService.requestApproval(projectId, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "Approval", id: "LIST" }],
    }),

    reviewApproval: builder.mutation({
      async queryFn({ approvalId, decision, comment }) {
        try {
          const { data } = await approvalService.reviewApproval(approvalId, { decision, comment });
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "Approval", id: "LIST" }],
    }),

    // ---------- Notifications ----------
    getNotifications: builder.query({
      async queryFn(userId) {
        try {
          const { data } = await notificationService.getNotifications(userId);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),

    markNotificationRead: builder.mutation({
      async queryFn(notificationId) {
        try {
          const { data } = await notificationService.markAsRead(notificationId);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),

    // ---------- Group chats (conversations) ----------
    getConversations: builder.query({
      async queryFn(projectId) {
        try {
          const { data } = await conversationService.getConversations(projectId);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result, error, projectId) => [{ type: "Conversation", id: projectId }],
    }),

    createConversation: builder.mutation({
      async queryFn({ projectId, name, participantIds }) {
        try {
          const { data } = await conversationService.createConversation(projectId, { name, participantIds });
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [{ type: "Conversation", id: projectId }],
    }),

    // ---------- Messages (scoped to a conversation / group chat) ----------
    getMessages: builder.query({
      async queryFn({ conversationId, projectId }) {
        try {
          const { data } = await messageService.getMessages(conversationId, projectId);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result, error, { conversationId }) => [{ type: "Message", id: conversationId }],
    }),

    sendMessage: builder.mutation({
      async queryFn({ conversationId, projectId, payload }) {
        try {
          const { data } = await messageService.sendMessage(conversationId, projectId, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [{ type: "Message", id: conversationId }],
    }),

    // ---------- Users / Team ----------
    getUsers: builder.query({
      async queryFn(args) {
        try {
          const { data } = await userService.getUsers(args);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "User", id: u.id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),

    createUser: builder.mutation({
      async queryFn(payload) {
        try {
          const { data } = await userService.createUser(payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    updateUser: builder.mutation({
      async queryFn({ id, payload }) {
        try {
          const { data } = await userService.updateUser(id, payload);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    deactivateUser: builder.mutation({
      async queryFn(id) {
        try {
          const { data } = await userService.deactivateUser(id);
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    getTeamWorkload: builder.query({
      async queryFn() {
        try {
          const { data } = await userService.getTeamWorkload();
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "User", id: "WORKLOAD" }],
    }),

    // ---------- Reports ----------
    getProjectsReport: builder.query({
      async queryFn() {
        try {
          const { data } = await reportService.getProjectsReport();
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "Report", id: "PROJECTS" }],
    }),

    getTeamReport: builder.query({
      async queryFn() {
        try {
          const { data } = await reportService.getTeamReport();
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "Report", id: "TEAM" }],
    }),

    getApprovalsReport: builder.query({
      async queryFn() {
        try {
          const { data } = await reportService.getApprovalsReport();
          return { data };
        } catch (error) {
          return { error: error.response?.data || { message: error.message } };
        }
      },
      providesTags: [{ type: "Report", id: "APPROVALS" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateStageMutation,
  useAssignTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useSubmitFinalReviewMutation,
  useGetDocumentsByProjectQuery,
  useUploadDocumentMutation,
  useGetApprovalsQuery,
  useRequestApprovalMutation,
  useReviewApprovalMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useGetTeamWorkloadQuery,
  useGetProjectsReportQuery,
  useGetTeamReportQuery,
  useGetApprovalsReportQuery,
} = apiSlice;
