import { CompressToolPanel } from "../tools/compress/CompressToolPanel";
import { useCompressTool } from "../tools/compress/useCompressTool";

export default function CompressToolPage() {
  const tool = useCompressTool();
  return <CompressToolPanel {...tool} />;
}
