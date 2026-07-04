import { CompressToolView } from "./compress/CompressToolView";
import { useCompressTool } from "./compress/useCompressTool";

export default function CompressToolPage() {
  const tool = useCompressTool();
  return <CompressToolView {...tool} />;
}
