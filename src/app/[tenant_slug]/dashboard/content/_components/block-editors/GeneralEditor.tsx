'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface GeneralEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
  userRole: string;
}

export default function GeneralEditor({ data = {}, onChange, userRole }: GeneralEditorProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));

  useEffect(() => {
    setJsonText(JSON.stringify(data, null, 2));
  }, [data]);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      onChange(parsed);
    } catch {
      // Esperar a que el JSON sea completamente válido antes de enviar onChange
    }
  };

  const handleBlur = () => {
    try {
      JSON.parse(jsonText);
    } catch {
      toast.error('El formato JSON no es válido. Revisa las llaves o comillas.');
    }
  };

  const isSuperAdmin = userRole === 'superadmin';

  return (
    <div className="space-y-4">
      {isSuperAdmin ? (
        <div className="space-y-2">
          <label className="text-sm font-bold block text-primary">Editor de Estructura JSON (Superadmin)</label>
          <p className="text-xs text-muted-foreground">
            Modifica la estructura directa del bloque de forma libre. Ten cuidado de no romper las claves requeridas por la UI.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            onBlur={handleBlur}
            rows={15}
            className="w-full p-3 font-mono text-xs border border-border rounded-lg bg-black text-green-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
            <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Edición Restringida</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Las secciones personalizadas avanzadas solo son reestructurables por soporte técnico de Lumis. Puedes modificar campos individuales de texto plano a continuación.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold block">Campos del Bloque</label>
            <div className="border border-border rounded-xl p-4 bg-muted/40 max-h-80 overflow-y-auto space-y-3">
              {Object.keys(data).length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay propiedades configurables en este bloque.</p>
              ) : (
                Object.keys(data).map((key) => {
                  const val = data[key];
                  if (
                    typeof val === 'string' ||
                    typeof val === 'number' ||
                    typeof val === 'boolean'
                  ) {
                    return (
                      <div key={key} className="space-y-1">
                        <span className="text-xs font-semibold capitalize text-muted-foreground">{key}</span>
                        <input
                          type="text"
                          value={String(val)}
                          onChange={(e) => {
                            let typedVal: any = e.target.value;
                            if (typeof val === 'number') typedVal = Number(e.target.value) || 0;
                            if (typeof val === 'boolean') typedVal = e.target.value === 'true';
                            onChange({ ...data, [key]: typedVal });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold capitalize text-muted-foreground">{key}</span>
                      <pre className="text-[10px] font-mono p-2 bg-muted rounded border border-border overflow-x-auto text-foreground">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
