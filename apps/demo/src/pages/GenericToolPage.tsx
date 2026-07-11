import { Navigate, useParams } from "react-router-dom";
import { ToolDemoPanel } from "../components/ToolDemoPanel";
import { findToolById } from "../config/tools";
import { isToolId } from "../config/toolIds";
import { useToolDemo } from "../hooks/useToolDemo";

export default function GenericToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  if (!toolId || !isToolId(toolId) || toolId === "compress") {
    return <Navigate to="/" replace />;
  }

  const tool = findToolById(toolId);
  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const state = useToolDemo(tool);
  return <ToolDemoPanel {...tool} {...state} />;
}
