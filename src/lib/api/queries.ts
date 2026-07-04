import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type CreateAgentInput, type CreateModelConnectionInput } from "@/lib/api/client";
import type { Agent, ModelConnection } from "@/types/domain";

export const queryKeys = {
  dashboard: ["dashboard"],
  modelCatalog: ["modelCatalog"],
  models: ["models"],
  agents: ["agents"],
  links: ["links"],
  metrics: ["metrics"],
  trace: (id: string) => ["trace", id],
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: api.getDashboard, refetchInterval: 30_000 });
}

export function useModels() {
  return useQuery({ queryKey: queryKeys.models, queryFn: api.getModels });
}

export function useModelCatalog() {
  return useQuery({ queryKey: queryKeys.modelCatalog, queryFn: api.getModelCatalog });
}

export function useAgents() {
  return useQuery({ queryKey: queryKeys.agents, queryFn: api.getAgents });
}

export function useLinks() {
  return useQuery({ queryKey: queryKeys.links, queryFn: api.getLinks });
}

export function useMetrics(params?: { timeRange?: string; agentId?: string; modelId?: string }) {
  return useQuery({
    queryKey: [...queryKeys.metrics, params?.timeRange ?? "24h", params?.agentId ?? "all", params?.modelId ?? "all"],
    queryFn: () => api.getMetrics(params),
    refetchInterval: 15_000,
  });
}

export function useTrace(id: string) {
  return useQuery({ queryKey: queryKeys.trace(id), queryFn: () => api.getTrace(id) });
}

export function useCreateModelConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateModelConnectionInput) => api.createModelConnection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.models });
      toast.success(`Model token generated `);
    },
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgentInput) => api.createAgent(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      const label = data.tokenName ? `"${data.tokenName}"` : data.maskedKey;
      toast.success(`Agent token generated: ${label}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, modelId }: { agentId: string; modelId: string }) => api.createLink(agentId, modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links });
      toast.success("Agent linked to model token");
    },
  });
}

export function useDeleteModel(){
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => api.deleteModel(modelId),
    onSuccess: async () => {
      // Force immediate refetch of models list
      await queryClient.refetchQueries({ queryKey: queryKeys.models });
      toast.success("Model token deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete model: ${error.message}`);
    },
  });
}

export function useDeleteAgent(){
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn  : (agentCID: string) => api.deleteAgent(agentCID),
    onSuccess: async () => {
      toast.success("Agent token deleted successfully");
      await queryClient.refetchQueries({ queryKey: queryKeys.agents });
    }
  })
}

export function useRevokeAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentCID: string) => api.revokeAgent(agentCID),
    onSuccess: async (data: Agent) => {
      toast.success(`Token "${data.tokenName || data.name}" revoked — it can no longer authenticate.`);
      await queryClient.refetchQueries({ queryKey: queryKeys.agents });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke token: ${error.message}`);
    },
  });
}

export function useRotateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentCID: string) => api.rotateAgent(agentCID),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.agents });
    },
    onError: (error: Error) => {
      toast.error(`Failed to rotate token: ${error.message}`);
    },
  });
}

export function useRevokeModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => api.revokeModel(modelId),
    onSuccess: async (data: ModelConnection) => {
      const label = data.tokenName || data.modelName;
      toast.success(`Token "${label}" revoked — it can no longer authenticate.`);
      await queryClient.refetchQueries({ queryKey: queryKeys.models });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke token: ${error.message}`);
    },
  });
}

export function useRotateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => api.rotateModel(modelId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.models });
    },
    onError: (error: Error) => {
      toast.error(`Failed to rotate token: ${error.message}`);
    },
  });
}

export function useModelUsage(modelId: string) {
  return useQuery({
    queryKey: [...queryKeys.models, modelId, "usage"],
    queryFn: () => api.getModelUsage(modelId),
    enabled: !!modelId,
  });
}
