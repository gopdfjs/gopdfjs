import { Navigate, useParams } from "react-router-dom";
import { findToolById } from "../config/tools";
import { isToolId } from "../config/toolIds";
import { GenericToolPanel } from "../components/GenericToolPanel";
import { useGenericTool } from "../hooks/useGenericTool";

export default function GenericToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  if (!toolId || !isToolId(toolId) || toolId === "compress") {
    return <Navigate to="/" replace />;
  }

  const tool = findToolById(toolId);
  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const state = useGenericTool(tool);
  return <GenericToolPanel {...tool} {...state} />;
}
