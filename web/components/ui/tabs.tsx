"use client";

import { useState } from "react";

type TabItem = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export default function Tabs({
  tabs,
  defaultKey,
}: {
  tabs: TabItem[];
  defaultKey?: string;
}) {
  const initial = defaultKey && tabs.find((t) => t.key === defaultKey) ? defaultKey : tabs[0]?.key;
  const [active, setActive] = useState<string | undefined>(initial);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm rounded-t-lg border-b-2 -mb-[1px] transition-colors ${
              active === t.key
                ? "border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{activeTab?.content}</div>
    </div>
  );
}
