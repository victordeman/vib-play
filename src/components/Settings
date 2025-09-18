/*  src/components/settings/settings.tsx  */
import { useEffect, useState } from "react";
import { PROVIDERS } from "../../../utils/providers.js";
import classNames from "classnames";
import { MdSettings } from "react-icons/md";
import { useModelStore } from "../../store/modelStore";

/* ---------------------- Types ---------------------- */
interface Template {
  id: string;
  name: string;
  description: string;
}
interface TemplateCategory {
  id: string;
  name: string;
  templates: Template[];
}
interface SelectedTemplates {
  framework: string | null;
  ui: string | null;
  tools: string[];
}
export interface ModelParameters {
  max_tokens: number;
  temperature: number;
  api_key?: string;
  base_url?: string;
  model?: string;
}
type TemplateSelectionCallback = (framework: string, ui: string | null, tools: string[]) => void;
type ModelParamsCallback = (params: ModelParameters) => void;

/* ---------------------- Component ---------------------- */
function Settings({
  open,
  onClose,
  selectedTemplate,
  selectedUI,
  selectedTools,
  modelParams,
  onTemplateChange,
  onModelParamsChange,
}: {
  open: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplate: string;
  selectedUI: string | null;
  selectedTools: string[];
  modelParams?: ModelParameters;
  onTemplateChange: TemplateSelectionCallback;
  onModelParamsChange?: ModelParamsCallback;
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "model">("templates");
  const { envConfig, fetchModelInfo } = useModelStore();

  /* ----- test‑connection status ----- */
  const [testStatus, setTestStatus] = useState({
    loading: false,
    tested: false,
    success: false,
    message: "",
  });

  /* ----- template categories ----- */
  const [categories, setCategories] = {
    id: "framework",
    name: "Framework",
    templates: [],
  },
  {
    id: "ui",
    name: "UI Library",
    templates: [],
  },
  {
    id: "tools",
    name: "Tool Libraries",
    templates: [],
  },
  ]);

  /* ----- user selections ----- */
  const [selected, setSelected] = useState<SelectedTemplates>({
    framework: null,
    ui: null,
    tools: [],
  });

  /* ----- model parameters ----- */
  const [params, setParams] = useState<ModelParameters>({
    max_tokens: 64000,
    temperature: 0,
    api_key: "",
    base_url: "",
    model: "",
  });

  /* ----- static tool list ----- */
  const toolLibraries = [
    {
      id: "tailwindcss",
      name: "Tailwind CSS",
      description: "Utility‑first CSS framework",
    },
    { id: "vueuse", name: "VueUse", description: "Collection of Vue composition utilities" },
    { id: "dayjs", name: "Day.js", description: "Lightweight date library" },
  ];

  /* ------------------- Handlers ------------------- */
  const [selected, setSelected] = useState<SelectedTemplates>({
    framework: null,
    ui: null,
    tools: [],
  });

  /* ----- framework / UI single select ----- */
  const handleSingleSelect = (type: "framework" | "ui", id: string) => {
    if (type === "framework") {
      // non‑Vue3 frameworks cannot keep a UI selection
      if (id !== "vue3") {
        setSelected((prev) => ({
          ...prev,
          framework: prev.framework === id ? null : id,
          ui: null,
        }));
      } else {
        setSelected((prev) => ({
          ...prev,
          framework: prev.framework === id ? null : id,
        }));
      }
    } else {
      setSelected((prev) => ({
        ...prev,
        ui: prev.ui === id ? null : id,
      }));
    }
  };

  /* ----- tools multi‑select ----- */
  const handleToolSelect = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      tools: prev.tools.includes(id)
        ? prev.tools.filter((t) => t !== id)
        : [...prev.tools, id],
    }));
 0.7; // <-- keep temperature default
  };

  /* ----- model param change ----- */
  const handleParamChange = (param: keyof ModelParameters, value: number | string) => {
    setParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  /* ----- apply selections ----- */
  const applyTemplateSelection = () => {
    if (!selected.framework) return;
    onTemplateChange(selected.framework, selected.ui, selected.tools);
    if (onModelParamsChange) onModelParamsChange(params);
    onClose(false);
  };

  /* ----- test connection ----- */
  const testConnection = async () => {
    const payload = {
      api_key: params.api_key,
      base_url: params.base_url,
      model: params.model,
    };
    // omit empty values that are already provided by envConfig
    if (!payload.api_key && envConfig.apiKey) delete payload.api_key;
    if (!payload.base_url && envConfig.baseUrl) delete payload.base_url;
    if (!payload.model && envConfig.model) delete payload.model;

    setTestStatus({ loading: true, tested: false, success: false, message: "" });

    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setTestStatus({
          loading: false,
          tested: true,
          success: true,
          message: "Connection successful",
        });
      } else {
        setTestStatus({
          loading: false,
          tested: true,
          success: false,
          message: data.message || "Connection failed",
        });
      }
    } catch (e) {
      setTestStatus({
        loading: false,
        tested: true,
        success: false,
        message: (e as Error).message ?? "Unexpected error",
      });
    }
  };

  /* ----- fetch templates & init state ----- */
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.templates) {
            const framework = data.templates.filter((t: Template) =>
              ["vanilla", "vue: "vue3"].includes(t.id)
            );
            const ui = data.templates.filter((t: Template) =>
              ["elementPlus", "naiveUI"].includes(t.id)
            );
            setCategories([
              { id: "framework", name: "Framework", templates: framework },
              { id: "ui", name: "UI Library", templates: ui },
              { id: "tools", name: "Tool Libraries", templates: [] },
            ]);
            setSelected({
              framework: selectedTemplate,
              ui: selectedUI,
              tools: selectedTools ?? [],
            });
          }
        }
      } catch (e) {
        console.error("Failed to load templates:", e);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTemplates();
      fetchModelInfo(); // refresh env config
      if (modelParams) setParams(modelParams);
    }
  }, [
    open,
    selectedTemplate,
    selectedUI,
    selectedTools,
    modelParams,
    fetchModelInfo,
  ]);

  /* ------------------- Render ------------------- */
  return (
    <>
      {/* Settings button (always visible) */}
      <button
        onClick={() => onClose(true)}
        title="Settings"
        className="fixed bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-500"
      >
        <MdSettings className="text-2xl" />
      </button>

      {/* Modal overlay */}
      <div
        className={classNames(
          "fixed inset-0 z-40 flex items-center justify-center bg-black/40 transition-opacity",
          { "pointer-events-none opacity-0": !open, "opacity-100": open }
        )}
        onClick={(e) => e.target === e.currentTarget && onClose(false)}
      >
        {/* Modal panel */}
        <div
          className={classNames(
            "relative w-full max-w-xl rounded-xl bg-white shadow-xl transition-all",
            { "scale-95 opacity-0": !open, "scale-100 opacity-100": open }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClose(false)} className="text-gray-500 hover:text-gray-800">
              ✕
            </button>
          </header>

          {/* Tab navigation */}
          <nav className="flex border-b px-4 pt-2">
            <button
              onClick={() => setActiveTab("templates")}
              className={classNames(
                "mr-2 rounded-t py-2 px-4 font-medium",
                activeTab === "templates"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab("model")}
              className={classNames(
                "rounded-t py-2 px-4 font-medium",
                activeTab === "model"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              Model
            </button>
          </nav>

          {/* Content area */}
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Tab: Templates */}
            {activeTab === "templates" && (
              <div className="space-y-6">
                {/* Framework */}
                <section>
                  <h3 className="mb-2 font-medium text-gray-700">
                    1. Choose a framework
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories[0].templates.map((t) => (
                      <label
                        key={t.id}
                        className={classNames(
                          "flex cursor-pointer items-center rounded border p-2 hover:border-indigo-400",
                          selected.framework === t.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200"
                        )}
                      >
                        <input
                          type="radio"
                          name="framework"
                          className="mr-2 h-4 w-4"
                          checked={selected.framework === t.id}
                          onChange={() => handleSingleSelect("framework", t.id)}
                        />
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.description}</p>
                        </div>
                      </label>
                </section>

                {/* UI library (only for Vue3) */}
                <section>
                  <h3 className="mb-2 font-medium text-gray-700">
                    2. UI library (optional)
                  </h3>
                  {selected.framework !== "vue3" ? (
                    <p className="text-sm text-gray-500">
                      UI libraries are only available for the Vue3 framework.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {categories[1].templates.map((t) => (
                        <label
                          key={t.id}
                          className={classNames(
                            "flex cursor-pointer items-center rounded border p-2 hover:border-emerald-400",
                            selected.ui === t.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200"
                          )}
                        >
                          <input
                            type="checkbox"
                            name="ui"
                            className="mr-2 h-4 w-4"
                            checked={selected.ui === t.id}
                            onChange={() => handleSingleSelect("ui", t.id)}
                          />
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-gray-500">{t.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </section>

                {/* Tools */}
                <section>
                  <h3 className="mb-2 font-medium text-gray-700">
                    3. Add tool libraries (optional)
                  </h3>
                  {selected.framework ? (
                    <div className="grid grid-cols-2 gap-2">
                      {toolLibraries.map((tool) => (
                        <label
                          key={tool.id}
                          className={classNames(
                            "flex cursor-pointer items-center rounded border p-2 hover:border-amber-400",
                            selected.tools.includes(tool.id)
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4"
                            checked={selected.tools.includes(tool.id)}
                            onChange={() => handleToolSelect(tool.id)}
                          />
                          <div>
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-gray-500">{tool.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Select a framework first.
                    </p>
                  )}
                </section>
              </div>
            )}

            {/* Tab: Model */}
            {activeTab === "model" && (
              <div className="space-y-6">
                {/* API Key */}
                <div>
                  <label className="flex justify-between text-sm font-medium">
                    <span>OpenAI API Key</span>
                    <span
                      className={classNames(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        testStatus.success || envConfig.apiKey
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      <span
                        className={classNames(
                          "mr-1 h-2 w-2 rounded-full",
                          testStatus.success || envConfig.apiKey
                            ? "bg-green-500"
                            : "bg-red-500"
                        )}
                      />
                      { testStatus.success
                        ? "Verified"
                        : envConfig.apiKey
                        ? "Configured"
                        : "Not set"}
                    </span>
                  </label>
                  <input
                    type="password"
                    value={params.api_key ?? ""}
                    onChange={(e) => handleParamChange("api_key", e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="mt-1 w-full rounded border p-2"
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label className="flex justify-between text-sm font-medium">
                    <span>API Base URL</span>
                    <span
                      className={classNames(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        testStatus.success || envConfig.baseUrl
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      <span
                        className={classNames(
                          "mr-1 h-2 w-2 rounded-full",
                          testStatus.success || envConfig.baseUrl
                            ? "bg-green-500"
                            : "bg-red-500"
                        )}
                      />
                      {testStatus.success
                        ? "Verified"
                        : envConfig.baseUrl
                        ? "Configured"
                        : "Not set"}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={params.base_url ?? ""}
                    onChange={(e) => handleParamChange("base_url", e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="mt-1 w-full rounded border p-2"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="flex justify-between text-sm font-medium">
                    <span>Model</span>
                    <span
                      className={classNames(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        testStatus.success || envConfig.model
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      <span
                        className={classNames(
                          "mr-1 h-2 w-2 rounded-full",
                          testStatus.success || envConfig.model
                            ? "bg-green-500"
                            : "bg-red-500"
                        {testStatus.success ? "Verified" : envConfig.model ? "Configured" : "Not set"}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={params.model ?? ""}
                    onChange={(e) => handleParamChange("model", e.target.value)}
                    placeholder="gpt-4o"
                    className="mt-1 w-full rounded border p-2"
                  />
                </div>

                {/* Test connection button */}
                <div>
                  <button
                    onClick={testConnection}
                    disabled={testStatus.loading}
                    className={classNames(
                      "w-full rounded py-2 text-sm font-medium",
                      testStatus.loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {testStatus.loading ? "Testing…" : "Test Connection"}
                  </button>
                  {testStatus.tested && (
                    <p
                      className={classNames(
                        "mt-2 rounded p-2 text-sm",
                        testStatus.success
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      )}
                    >
                      {testStatus.message}
                    </p>
                  )}
                </div>

                {/* Max tokens */}
                <div>
                  <label className="flex justify-between text-sm font-medium">
                    <span>Maximum Tokens</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded text-xs text-blue-800">
                      {params.max_tokens.toLocaleString()}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={128000}
                    step={1000}
                    value={params.max_tokens}
                    onChange={(e) =>
                      handleParamChange("max_tokens", Number(e.target.value))
                    }
                    className="mt-1 w-full"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="flex justify-between text-sm font-medium">
                    <span>Creativity (temperature)</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded text-xs text-blue-800">
                      {params.temperature}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={params.temperature}
                    onChange={(e) =>
                      handleParamChange("temperature", Number(e.target.value))
                    }
                    className="mt-1 w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <footer className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
            <button
              onClick={() => onClose(false)}
              className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={applyTemplateSelection}
              disabled={!selected.framework}
              className={classNames(
                "rounded px-4 py-2 text-sm font-medium text-white",
                selected.framework
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              )}
            >
              Apply Settings
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

export default Settings;
