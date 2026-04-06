import { useEffect, useMemo, useState } from "react";

import { fetchModels } from "../api";
import { DEFAULT_FORM } from "../constants";

export function useModelParametersState({ setError }) {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    async function loadModels() {
      try {
        const payload = await fetchModels();
        const list = payload.models || [];
        setModels(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, model_id: list[0].id }));
        }
      } catch (err) {
        setError(err.message || "Unable to fetch model list.");
      }
    }

    loadModels();
  }, [setError]);

  const selectedModel = useMemo(
    () => models.find((item) => item.id === form.model_id)?.name || "No model selected",
    [models, form.model_id]
  );

  function onFormFieldChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return {
    models,
    form,
    selectedModel,
    onFormFieldChange,
  };
}
