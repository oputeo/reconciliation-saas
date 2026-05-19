// src/components/PowerBIEmbed.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import both the component and models to avoid SSR issues
const PowerBIEmbed = dynamic(
  () => import("powerbi-client-react").then((mod) => mod.PowerBIEmbed),
  { ssr: false }
);

const models = dynamic(
  () => import("powerbi-client").then((mod) => mod.models),
  { ssr: false }
);

interface Props {
  reportId: string;
  embedUrl: string;
  accessToken: string;
}

export default function PowerBIEmbedComponent({ reportId, embedUrl, accessToken }: Props) {
  if (!reportId || reportId === "YOUR_ACTUAL_REPORT_ID") {
    return (
      <div className="h-[650px] flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
        <div className="text-center">
          <p className="font-medium text-lg">Power BI Embed Not Configured</p>
          <p className="text-sm text-slate-500 mt-2">Replace with your real Report ID, Embed URL and Access Token</p>
        </div>
      </div>
    );
  }

  return (
    <PowerBIEmbed
      embedConfig={{
        type: "report",
        id: reportId,
        embedUrl: embedUrl,
        accessToken: accessToken,
        tokenType: 1, // Embed token
        settings: {
          panes: {
            filters: { expanded: false, visible: true },
            pageNavigation: { visible: true },
          },
          background: 1, // Transparent
        },
      }}
      cssClassName="powerbi-container h-[650px] w-full rounded-xl overflow-hidden"
    />
  );
}